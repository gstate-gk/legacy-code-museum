# `who am i` は `argc==3`——utmpの20バイトを読んで接続者を列挙する62行と `cbuf+4` の日付フォーマット

## はじめに

```c
if (argc==3) {
    tp = ttyname(0);
    if (tp)
        tp = rindex(tp, '/') + 1;
    ...
}
```

`who am i` を実行すると `argc==3`（`who`・`am`・`i` の3引数）になる。`-s` や `--self` というフラグではない——引数の**個数**で動作が変わる。Bell Labs 1979年の `who.c` は62行だ。

`who` は `/etc/utmp` を読む。`struct utmp` はたった3フィールド——tty名（8バイト）・ユーザー名（8バイト）・ログイン時刻（long 4バイト）。20バイトの構造体が「今このシステムに誰が接続しているか」を記録している。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

```
who.c  — 62行
  main()    — /etc/utmpを開いてfread()で1エントリずつ読む
  putline() — 1行分を printf() で出力
```

---

## `struct utmp`——20バイトが接続状態を記録する

```c
/* /usr/include/utmp.h */
struct utmp {
    char    ut_line[8];  /* tty名 */
    char    ut_name[8];  /* ユーザー名 */
    long    ut_time;     /* ログイン時刻 */
};
```

3フィールド、合計20バイト。これがUnixの「誰が今接続しているか」のデータ構造だ。ユーザー名は最大8文字——`%-8.8s` フォーマットが示す通り、9文字目は切り捨てられる。

`/etc/utmp` はこの構造体が端末の数だけ並んだバイナリファイルだ。

```c
while (fread((char *)&utmp, sizeof(utmp), 1, fi) == 1) {
    if(utmp.ut_name[0] == '\0' && argc==1)
        continue;  /* 空エントリをスキップ */
    putline();
}
```

`fread()` で直接 `struct utmp` に読み込む——テキストパースなし。`ut_name[0] == '\0'` は誰もログインしていない端末エントリだ。

---

## `who am i` は `argc==3`

```c
if (argc==3) {
    tp = ttyname(0);       /* 自分のttyを取得 */
    if (tp)
        tp = rindex(tp, '/') + 1;  /* "/dev/tty01" → "tty01" */
    else {  /* ttyなし（パイプ経由等）*/
        pw = getpwuid(getuid());
        strcpy(utmp.ut_name, pw? pw->pw_name: "?");
        strcpy(utmp.ut_line, "tty??");
        time(&utmp.ut_time);
        putline();
        exit(0);
    }
}
```

引数が3つ（`who am i`、`who are you`、なんでもよい）なら自分の端末だけを表示する。`argc==3` を検出するだけで、`argv[1]` も `argv[2]` の内容も見ない——`who am i` も `who loves you` も同じ動作だ。

`ttyname(0)` でstdinのデバイス名（例：`/dev/tty01`）を取得し、`rindex(tp, '/')` で最後の `/` を見つけて `+1` で tty名だけを切り出す。

ttyが取得できない場合（パイプでリダイレクトされた場合等）は `/etc/passwd` から uid でユーザー名を取得し、tty名を `"tty??"` として出力する——フォールバック設計だ。

---

## `cbuf+4` と `%.12s`——日付フォーマットの算術

```c
putline()
{
    register char *cbuf;

    printf("%-8.8s %-8.8s", utmp.ut_name, utmp.ut_line);
    cbuf = ctime(&utmp.ut_time);
    printf("%.12s\n", cbuf+4);
}
```

`ctime()` は `"Mon Apr 22 12:34:56 2026\n"` という形式の文字列を返す。

- `cbuf+4` — 先頭4文字（曜日と空白 `"Mon "`）をポインタ加算でスキップ
- `%.12s` — その位置から12文字だけ出力 = `"Apr 22 12:34"`

年も秒も表示しない。曜日も表示しない。「誰がどの端末に何時からいるか」だけが重要で、それは月日と時分で十分だった——1979年の端末環境では同年内のセッションが前提だ。

---

## `#ifdef vax`——62行の中の唯一の条件コンパイル

```c
if(argc==3) {
    if (strcmp(utmp.ut_line, tp))
        continue;
#ifdef vax
    printf("(Vax) ");
#endif
    putline();
    exit(0);
}
```

62行の中で条件コンパイルはここだけだ。VAX（DEC VAX-11）で `who am i` を実行すると `"(Vax) "` が先頭に表示される——どのマシンで動いているかを教えるための1行。Bell Labs では VAX と PDP-11 が混在していた時代だ。

---

## login.c が書き、who.c が読む

`who.c` の対になるのは `login.c`（149行）だ。

```c
/* login.c の SCPYN マクロ */
#define SCPYN(a, b) strncpy(a, b, sizeof(a))

/* ログイン時に utmp に書き込む */
SCPYN(utmp.ut_name, namep);     /* ユーザー名 */
SCPYN(utmp.ut_line, ttyn+5);    /* "/dev/tty01" → "tty01" の5文字目から */
time(&utmp.ut_time);             /* ログイン時刻 */
```

`login` が `/etc/utmp` に書き、`who` が読む——生産者と消費者が1つのバイナリファイルを共有するシンプルな設計だ。`SCPYN` は `strncpy` を `sizeof(a)` で自動サイズ制限するマクロ——8バイト制限の守り手だ。

`who.c` はそれを `fread()` で1構造体ずつ読む。インデックスもハッシュもなし——20バイト×端末数の線形スキャンで十分だ。

---

## 引数2つで別ファイルを読む

```c
s = "/etc/utmp";
if(argc == 2)
    s = argv[1];
```

引数を1つ与えると、`/etc/utmp` の代わりにそのファイルを読む。`who /var/adm/wtmp` で過去のログイン記録（`/var/adm/wtmp` は同形式の履歴ファイル）を参照できる——後の `last` コマンドが担う機能の原型だ。

---

## 鑑定

```
初版       : Bell-32V Unix（1979年）
実装       : C（62行）
入力       : /etc/utmp（デフォルト）または argv[1]
struct utmp: ut_line[8] + ut_name[8] + ut_time(long) = 20バイト
読み方     : fread()で直接構造体に読み込む（テキストパースなし）
who am i   : argc==3を検出——引数の内容ではなく個数で判断
tty取得    : ttyname(0) + rindex(tp, '/') + 1
ttyなし    : getpwuid(getuid())でフォールバック
日付       : ctime()の出力をcbuf+4でずらし%.12sで12文字切り出し
出力形式   : %-8.8s（8文字固定幅）でname/line、年と秒は省略
#ifdef vax : 62行中唯一の条件コンパイル——VAX環境で"(Vax) "を表示
対になる   : login.cがutmpに書きwho.cが読む（生産者・消費者モデル）
後継       : w(1)、last(1)、finger(1)、utmpx
```

**whoは「端末時代の花名簿」だ。**

共有端末にtelnetで接続するミニコンピュータの時代、`who` は「今このマシンに誰がいるか」を知る唯一の手段だった。20バイトの `struct utmp` を `fread()` で流し読みするだけの62行が、接続者管理の全てを担った。`who am i` が `argc==3` で動くのは、Bell Labs のプログラマがこのコマンドを対話的に使う状況を正確に想像していたからだ——`who`・`am`・`i` という3語で問いかける、コンピュータに対する最初の哲学的質問のひとつ。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
