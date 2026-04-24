# `HOUR = 100`——HHMMを「粒」で刻む時刻表現、`popen("pwd","r")` でサブプロセスから現在ディレクトリを取得する1979年のジョブスケジューラ

## はじめに

```c
#define HOUR    100
#define HALFDAY (12*HOUR)
#define DAY     (24*HOUR)
```

`HOUR = 100`。1時間は100粒（grain）だ——1200が正午、2400が深夜0時。`at 3:30pm` と入力すると時刻は1530として処理される。秒でも分でもなく、HHMM形式の整数が時刻の単位だ。Bell-32V（1979年）の `at.c` は160行。

`at` はジョブスケジューラだ——`at 5pm friday cmd` で金曜日午後5時にコマンドを実行する。現代の `cron` と並ぶ1979年のUnixの時間管理機能。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

---

## `HOUR = 100`——時刻は「HHMM整数」で管理する

```c
#define HOUR    100
#define HALFDAY (12*HOUR)   /* 1200 = 正午 */
#define DAY     (24*HOUR)   /* 2400 = 深夜0時 */

int utime;  /* requested time in grains */
int now;    /* when is it */
```

コメントが明言する——`in grains`（粒単位で）。時刻はHHMM形式の整数として扱われる。`3:30` は330、`12:00`（正午）は1200、`3PM` は1500。

`makeutime()` がこの変換を担う：

```c
makeutime(pp)
char *pp;
{
    register val;
    register char *p;

    p = pp;
    val = 0;
    while(isdigit(*p)) {
        val = val*10+(*p++ -'0');
    }
    if (p-pp < 3)
        val *= HOUR;  /* 3桁未満なら時のみ → ×100 */

    for (;;) {
        switch(*p) {
        case ':':
            ++p;
            if (isdigit(*p)) {
                if (isdigit(p[1])) {
                    val +=(10* *p + p[1] - 11*'0');  /* 分を加算 */
                    p += 2;
                    continue;
                }
            }
            /* ... */
        case 'A':
        case 'a':
            if (val >= HALFDAY && val < (HALFDAY+HOUR))
                val -= HALFDAY;  /* 12:xx AM → 00:xx */
            break;
        case 'P':
        case 'p':
            if (val < HALFDAY)
                val += HALFDAY;  /* PM → +1200 */
            break;
        case 'N':
        case 'n':
            val = HALFDAY;       /* noon = 1200 */
            break;
        case 'M':
        case 'm':
            val = 0;             /* midnight = 0 */
            break;
        }
        break;
    }
    if (val%HOUR >= 60) {
        fprintf(stderr, "at: illegal minute field\n");
        exit(1);
    }
    utime = val;
}
```

`val%HOUR >= 60` で不正な分フィールドを検出する——HOUR=100だから `val%100` が分になる。1:75AMは `175%100=75` で弾かれる。

---

## `popen("pwd","r")`——`getcwd()`がなかった1979年

```c
if ((pwfil = popen("pwd", "r")) == NULL) {
    fprintf(stderr, "at: can't execute pwd\n");
    exit(1);
}
fgets(pwbuf, 100, pwfil);
pclose(pwfil);
fprintf(file, "cd %s", pwbuf);
```

現在ディレクトリを取得するために `pwd` コマンドを子プロセスとして起動する。`getcwd()` は1979年のBell-32Vには存在しない——`popen()` でサブプロセスを立ち上げ、標準出力を読み込む。

スケジュールされたジョブは `cd <現在のディレクトリ>` から始まる——ジョブ登録時のディレクトリで実行されるためだ。続いて環境変数も全て書き込む：

```c
if (environ) {
    char **ep = environ;
    while(*ep)
        fprintf(file, "%s\n", *ep++);
}
```

`char **environ` から全ての環境変数を直接出力する。スケジュールされたジョブは登録時の環境を完全に再現する——`PATH`、`HOME`、`TERM`、全て。

---

## `filename()`——素数53のステップで衝突を回避する

```c
filename(dir, y, d, t)
char *dir;
{
    register i;

    for (i=0; ; i += 53) {
        sprintf(fname, "%s/%02d.%03d.%04d.%02d", dir, y, d, t,
           (getpid()+i)%100);
        if (access(fname, 0) == -1)
            return;
    }
}
```

ジョブファイルの名前は `/usr/spool/at/YY.DDD.HHMM.XX` だ。

- `YY` — 年（2桁）
- `DDD` — 年の何日目か（3桁、001〜366）
- `HHMM` — 実行時刻（4桁）
- `XX` — `(getpid()+i)%100` で0〜99の衝突回避番号

同じ時刻に複数のジョブが登録されると `XX` 部分が衝突する。`i += 53` のステップで `(getpid()+i)%100` を順に試す——53と100は互いに素（gcd=1）なので、ステップ53で0〜99の全値を巡回できる。素数を選ぶことで均等分散を保証する。

ファイルが存在しない（`access(fname,0)==-1`）ならそのファイル名を使う——競合が解消するまでループを続ける。

---

## `uyear%4==0`——うるう年の素朴な判定

```c
c = uyear%4==0? 366: 365;
if (uday >= c) {
    uday -= c;
    uyear++;
}
```

```c
if (detail->tm_year%4==0 && uday>59)
    uday += 1;  /* うるう年の2月29日以降に1日加算 */
```

1900年や2100年は4の倍数だが閏年ではない（100年ルール）。Bell-32V 1979年版は `%4==0` だけで判定する——2000年問題と同じ素朴さだが、1979年には2100年は遠すぎた。

---

## `prefix()`——前方一致での月・曜日名解析と曖昧性検出

```c
char *
prefix(begin, full)
char *begin, *full;
{
    int c;
    while (c = *begin++) {
        if (isupper(c))
            c = tolower(c);
        if (*full != c)
            return(0);
        else
            full++;
    }
    return(full);
}
```

月名・曜日名は前方一致で解析する——`jan`、`feb`、`mo`、`tue` が使える。大文字小文字は `tolower()` で吸収する。

曖昧性も検出する：

```c
for (pt=months; pt->mname; pt++) {
    if (prefix(argv[2], pt->mname)) {
        if (found<0)
            found = pt-months;
        else {
            fprintf(stderr, "at: ambiguous month\n");
            exit(1);
        }
    }
}
```

`m` だけなら `march`・`may` の両方にマッチして "ambiguous month" で終了。`ma` なら `march`・`may` の両方——`mar` でようやく一意になる。

---

## 鑑定

```
初版       : Bell-32V Unix（1979年）
実装       : C（160行）
HOUR=100   : 時刻はHHMM整数（粒）——1200が正午、val%HOUR>=60で不正分を検出
popen("pwd"): getcwd()なし——pwd子プロセスから現在ディレクトリを取得
environ    : char **environmentから全環境変数をジョブファイルに出力
filename() : YY.DDD.HHMM.XX形式——i+=53のステップで0〜99を素数巡回
ファイル名  : /usr/spool/at/に実行スクリプトとして保存
うるう年   : uyear%4==0の素朴な判定
prefix()   : 前方一致で月・曜日名を解析、曖昧性を検出してexit(1)
後継       : cron（デーモン型）、at(1)は現代のsystemd-runにも引き継がれる
```

**`at` は「実行を未来に延期する」最小の機構だ。**

160行で `at 5pm friday` を解釈し、現在の環境を丸ごと再現するスクリプトを `/usr/spool/at/` に書く——デーモンが残りを担う。`HOUR=100` という整数表現は時刻計算をHHMM算術で単純にし、`popen("pwd","r")` は `getcwd()` のない時代に子プロセスを辞書として使う。素数53のステップは衝突回避のための数学だ——1979年の `at.c` は「未来への約束」を160行で実装した。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
