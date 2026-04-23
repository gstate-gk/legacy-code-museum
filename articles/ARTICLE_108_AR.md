# `ARMAG = 0177545`——PDP-11のワード境界と `ar_name[14]`、静的リンクを可能にした705行のライブラリアーカイバ

## はじめに

```c
#define ARMAG   0177545
```

`ar` ファイルの先頭2バイトは `0177545`（8進数）——10進数では65381、16進数では `0xFF65`。この値が「これはarアーカイブだ」を証明するマジックナンバーだ。Bell-32V 1979年の `ar.c` は705行。

`ar` はライブラリアーカイバだ。`libc.a` のような静的ライブラリを作る道具——Cのオブジェクトファイルを束ねて、リンカが必要なシンボルを探せる単一ファイルを作る。`*.a` ファイルの `a` は **archive** だ。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

```
ar.c  — 705行
  main()     — コマンド解析、関数ポインタ dispatch
  rcmd()     — r: replace（追加/更新）
  dcmd()     — d: delete
  xcmd()     — x: extract
  tcmd()     — t: table（一覧表示）
  pcmd()     — p: print（内容出力）
  mcmd()     — m: move
  qcmd()     — q: quick append
  copyfil()  — アーカイブエントリのコピー（IODD/OODD/HEAD/SKIPフラグ）
  install()  — 一時ファイルを最終ファイルにコピー
  pmode()    — パーミッション表示（データ駆動）
```

---

## `struct ar_hdr`——26バイトのアーカイブエントリ

```c
/* /usr/include/ar.h */
#define ARMAG   0177545
struct  ar_hdr {
    char    ar_name[14];  /* ファイル名 */
    long    ar_date;      /* 更新時刻 */
    char    ar_uid;       /* オーナーUID */
    char    ar_gid;       /* グループGID */
    int     ar_mode;      /* パーミッション */
    long    ar_size;      /* サイズ */
};
```

14 + 4 + 1 + 1 + 2 + 4 = 26バイト。ファイル名は最大14文字——当時のUnixファイル名の上限（`struct direct` の `d_name[14]` と同じ）。

arアーカイブの構造：
```
[ ARMAG(2バイト) ] [ ar_hdr(26バイト) + data(偶数バイト) ] [ ar_hdr + data ] ...
```

先頭2バイトが `0177545` でなければ即エラー：

```c
if (read(af, (char *)&mbuf, sizeof(int)) != sizeof(int) || mbuf!=ARMAG) {
    fprintf(stderr, "ar: %s not in archive format\n", arnam);
    done(1);
}
```

`sizeof(int)` は PDP-11 では2バイト。arファイルの先頭2バイトをintとして読んで `ARMAG` と比較する。

---

## `if(i&1)`——PDP-11のワード境界パディング

```c
copyfil(fi, fo, flag)
{
    register i, o;

    if(flag & HEAD)
        if (write(fo, (char *)&arbuf, sizeof arbuf) != sizeof arbuf)
            wrerr();
    while(arbuf.ar_size > 0) {
        i = o = 512;
        if(arbuf.ar_size < i) {
            i = o = arbuf.ar_size;
            if(i&1) {
                if(flag & IODD) i++;  /* 入力を偶数バイトに切り上げ */
                if(flag & OODD) o++;  /* 出力を偶数バイトに切り上げ */
            }
        }
        if(read(fi, buf, i) != i)
            pe++;
        if((flag & SKIP) == 0)
            if (write(fo, buf, o) != o)
                wrerr();
        arbuf.ar_size -= 512;
    }
}
```

`if(i&1)` ——ファイルサイズが奇数なら1バイト余分に読み書きする。PDP-11は**ワード（2バイト）境界**でデータにアクセスする——奇数バイトのファイルをそのまま並べるとアライメントエラーになる。1バイトのパディングでワード境界を保つ。

4つのフラグ（ビットマスク）：

```c
#define SKIP    1  /* 出力しない（スキップ） */
#define IODD    2  /* 入力を偶数に切り上げ */
#define OODD    4  /* 出力を偶数に切り上げ */
#define HEAD    8  /* ar_hdrを先に書く */
```

`copyfil(af, tf, IODD+OODD+HEAD)` — ヘッダを書いて、入出力ともワード境界に揃える。`copyfil(af, -1, IODD+SKIP)` — ファイルを読んで捨てる（スキップ）。フラグの組み合わせが7コマンドの全操作を表現する。

---

## 3つの一時ファイル——アトミック置換

```c
char *tmpnam  = { "/tmp/vXXXXX" };
char *tmp1nam = { "/tmp/v1XXXXX" };
char *tmp2nam = { "/tmp/v2XXXXX" };
```

`ar r`（replace）は3段階で動作する：

1. アーカイブを走査しながら新しい一時ファイル（`tf`）に書き出す
2. 移動対象があれば第2一時ファイル（`tf2`）に取り分ける
3. `-b`（before）/-a`（after）の挿入位置があれば第3一時ファイル（`tf1`）を使う

```c
install()
{
    /* tf → tf2 → tf1 の順でarファイルに書き込む */
    lseek(tf, 0l, 0);
    while((i = read(tf, buf, 512)) > 0)
        if (write(af, buf, i) != i) wrerr();
    if(tf2nam) { /* move済みファイル */ ... }
    if(tf1nam) { /* before/afterの後ろ側 */ ... }
}
```

シグナル（SIGHUP/SIGINT/SIGQUIT）で中断されても `done()` が一時ファイルを削除する：

```c
done(c)
{
    if(tfnam)  unlink(tfnam);
    if(tf1nam) unlink(tf1nam);
    if(tf2nam) unlink(tf2nam);
    exit(c);
}
```

`flg['l'-'a']` — `-l` フラグで一時ファイルをカレントディレクトリに作る。`/tmp` が小さな環境でのフォールバックだ。

---

## `(*comfun)()`——7コマンドの関数ポインタ dispatch

```c
char *man = { "mrxtdpq" };  /* コマンド文字列 */
int (*comfun)();             /* 選択されたコマンド関数 */

/* main() の switch */
case 'r': setcom(rcmd); continue;
case 'd': setcom(dcmd); continue;
case 'x': setcom(xcmd); continue;
/* ... */

setcom(fun)
int (*fun)();
{
    if(comfun != 0) {
        fprintf(stderr, "ar: only one of [%s] allowed\n", man);
        done(1);
    }
    comfun = fun;
}

/* 最後に呼ぶ */
(*comfun)();
```

コマンド文字を見てstringの `man = "mrxtdpq"` で案内し、関数ポインタに格納。`setcom()` が2回呼ばれたらエラー——コマンドは1つだけ、というルールをポインタの上書き検出で守る。find.c（#095）の `(*exlist->F)(exlist)` と同じ関数ポインタのイディオムだ。

---

## `pmode()`——データ駆動のパーミッション表示

```c
int m1[] = { 1, ROWN, 'r', '-' };
int m2[] = { 1, WOWN, 'w', '-' };
int m3[] = { 2, SUID, 's', XOWN, 'x', '-' };
/* ... */
int *m[] = { m1, m2, m3, m4, m5, m6, m7, m8, m9};

pmode()
{
    register int **mp;
    for (mp = &m[0]; mp < &m[9];)
        select(*mp++);
}

select(pairp)
int *pairp;
{
    register int n, *ap;
    ap = pairp;
    n = *ap++;
    while (--n>=0 && (arbuf.ar_mode & *ap++) == 0)
        ap++;
    putchar(*ap);
}
```

各エントリは `{count, bitflag, char_if_set, ..., char_if_not}` という可変長配列。`select()` は先頭の `count` を読んで、マッチしたビットフラグの文字を出力する。`m3` は `SUID` なら `'s'`、`XOWN` なら `'x'`、どちらでもなければ `'-'`——3通りを `count=2` で表現する。9ビット分のパーミッションをテーブル駆動で `rwxrwxrwx` に変換する設計だ。

---

## `longt()`——`cp+4` と `cp+20`

```c
longt()
{
    register char *cp;

    pmode();
    printf("%3d/%1d", arbuf.ar_uid, arbuf.ar_gid);
    printf("%7D", arbuf.ar_size);
    cp = ctime(&arbuf.ar_date);
    printf(" %-12.12s %-4.4s ", cp+4, cp+20);
}
```

`ctime()` が返す `"Mon Apr 22 12:34:56 2026\n"` から：
- `cp+4` + `%.12s` → `"Apr 22 12:34"`（月日時分、who.cと同じ）
- `cp+20` + `%.4s` → `"2026"`（年——who.cと違い年も表示する）

who.c（#096）は同年内のセッションを前提に年を省いた。ar.cはライブラリファイルの更新日として年が必要だ——用途が日時の精度を決める。同じ `ctime()` トリックを2種類の切り出し方で使い分けている。

---

## `qcmd()`——quick append と `ranlib` への道

```c
qcmd()
{
    register i, f;

    if (flg['a'-'a'] || flg['b'-'a']) {
        fprintf(stderr, "ar: abi not allowed with q\n");
        done(1);
    }
    getqf();
    for(i=0; signum[i]; i++)
        signal(signum[i], SIG_IGN);
    lseek(qf, 0l, 2);  /* ファイル末尾へ */
    for(i=0; i<namc; i++) {
        /* ... */
        movefil(f);
    }
}
```

`q`（quick append）は一時ファイルを使わない。アーカイブ末尾に直接追記するだけ。`-a/-b` での挿入位置指定は不可——速度と引き換えに機能を捨てる。

しかし `qcmd()` はシンボルテーブルを更新しない。`ar q` の後に `ranlib` を呼ぶ必要がある——`ranlib` は後から追加された、アーカイブのシンボルインデックス作成ツールだ。Bell-32V にはまだ `ranlib` がない。リンカは `libc.a` を頭から線形スキャンして必要なシンボルを探していた。

---

## `bastate`——`-a`/`-b` 挿入位置の状態機械

```c
bamatch()
{
    register f;

    switch(bastate) {
    case 1:
        if(strcmp(file, ponam) != 0)
            return;
        bastate = 2;
        if(flg['a'-'a'])
            return;  /* after: 基準ファイル自身はコピーしてから挿入 */
    case 2:
        bastate = 0;
        tf1nam = mktemp(tmp1nam);
        /* 第3一時ファイルを開いて、残りをそちらに向ける */
        tf1 = tf;
        tf = f;
    }
}
```

`-b posfile` でアーカイブ内の `posfile` の**前**に挿入し、`-a posfile` では**後**に挿入する。`bastate=1`（探索中）→ `bastate=2`（発見）→ `bastate=0`（完了）の3状態。`-a` の場合は `case 1:` が return して基準ファイル自身を先にコピーし、`case 2:` で次のファイルから一時ファイルを切り替える——fall-throughで `-b` と `-a` の違いを制御する。

---

## 鑑定

```
初版       : Bell-32V Unix（1979年）
実装       : C（705行）
マジック   : ARMAG = 0177545（arアーカイブの先頭2バイト）
struct ar_hdr: ar_name[14] + ar_date + ar_uid + ar_gid + ar_mode + ar_size = 26バイト
コマンド   : mrxtdpq（move/replace/extract/table/delete/print/quick）
オプション  : uvnbail
ワード境界 : if(i&1)でIODD/OODDフラグ——PDP-11のアライメント要求
一時ファイル: /tmp/vXXXXX + v1XXXXX + v2XXXXXの3本でアトミック置換
dispatch   : int (*comfun)()——関数ポインタで7コマンドを切り替え
pmode()    : データ駆動パーミッション表示（int *m[]の配列で定義）
longt()    : cp+4（月日時分）+ cp+20（年）——who.cより4文字多い
qcmd()     : 末尾直接追記、ranlib不要だが索引なし
bastate    : -a/-bの挿入位置をfall-throughで3状態管理
後継       : GNU ar、llvm-ar、ranlib、__.SYMDEFシンボルインデックス
```

**arは「ライブラリという概念の容器」だ。**

`libc.a` があるから `#include <stdio.h>` して `printf()` が使える——静的リンクの根幹を支えるのが `ar.c` の705行だ。26バイトの `struct ar_hdr` にファイルのメタデータを詰めて、`if(i&1)` でPDP-11のワード境界を守り、3本の一時ファイルでアトミック更新を実現する。`ARMAG = 0177545` というマジックナンバーは、今日の `file` コマンドのデータベースにも `current ar archive` として登録されている——1979年の約束は45年後も破られていない。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
