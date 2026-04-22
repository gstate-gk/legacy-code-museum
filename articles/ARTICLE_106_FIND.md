# `(*exlist->F)(exlist)`——述語を関数ポインタのASTで評価する1979年のfind、`{}` の誕生と opendir() がなかった時代のディレクトリ生読み

## はじめに

```c
struct anode {
    int (*F)();
    struct anode *L, *R;
} Node[100];
```

`find` の述語（`-name`, `-mtime`, `-exec` 等）は**関数ポインタを持つ木**として表現される。ファイルを発見するたびに `(*exlist->F)(exlist)` を呼ぶ——ノードが自分自身の評価関数を呼ぶ設計だ。

Bell-32V（1979年）の `find.c` は708行。再帰下降パーサで述語式をASTに変換し、ディレクトリを再帰的に歩き、各ファイルに対してASTを評価する——現代の `find` と本質的に同じアーキテクチャだ。そして `-exec {} \;` という構文がここで生まれた。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

```
find.c — 708行
  main()       — パス走査のエントリポイント
  exp()        — OR(-o)の解析（最低優先度）
  e1()         — AND(-a、または暗黙的)の解析
  e2()         — NOT(!)の解析
  e3()         — 述語・括弧の解析（最高優先度）
  mk()         — ASTノードを生成してNode[]に格納
  nxtarg()     — 次の引数を取り出す（strikes=3で無限ループ防止）
  and/or/not() — ASTの評価関数（短絡評価）
  glob/mtime/atime/user/group/size/perm/type/ino() — 各述語
  exeq/ok()   — -exec と -ok の実行
  doex()       — {}をPathnameに置換してfork+execvp
  descend()    — ディレクトリ再帰（opendir()なし、生読み）
  scomp()      — "funny signed compare"（+/-/なし の3way比較）
  getunum()    — /etc/passwdを直接読んでUID取得
  cpio()       — -cpioオプション（cpio.cと同じコードを内蔵）
  gmatch/amatch/umatch() — グロブパターンマッチ
```

---

## `exp() < e1() < e2() < e3()`——演算子優先順位の実装

```c
/* compile time functions:  priority is  exp()<e1()<e2()<e3()  */

struct anode *exp()  { /* parse ALTERNATION (-o) */  ... return mk(or,  p1, exp()); }
struct anode *e1()   { /* parse CONCATENATION (-a) */ ... return mk(and, p1, e1()); }
struct anode *e2()   { /* parse NOT (!) */            ... return mk(not, e3(), 0);  }
struct anode *e3()   { /* parse parens and predicates */ ... }
```

コメントが演算子優先順位の全てを語っている：`exp() < e1() < e2() < e3()`。

`exp()` が最初に呼ばれ OR を探す。見つからなければ `e1()` へ。`e1()` が AND を探し、見つからなければ `e2()` へ。`e2()` が `!` を探し、見つからなければ `e3()` へ。`e3()` が実際の述語を解析する。再帰下降法で演算子優先順位を実現した——yacc を使わない手書きパーサだ。

---

## 暗黙的な AND

```c
struct anode *e1() {
    p1 = e2();
    a = nxtarg();
    if(EQ(a, "-a")) {
And:
        Randlast--;
        return(mk(and, p1, e1()));
    } else if(EQ(a, "(") || EQ(a, "!") || (*a=='-' && !EQ(a, "-o"))) {
        --Ai;
        goto And;   /* 暗黙的 AND */
    }
    ...
}
```

`find . -name "*.c" -print` — `-a` が書かれていない。次の引数が述語（`-` で始まる）か `(` か `!` であれば、暗黙的に AND として扱う。`goto And` で明示的 AND と同じコードパスに乗る。現代の `find` でも `-a` を省略できるのはこの設計を引き継いでいる。

---

## `(*exlist->F)(exlist)`——自分を評価する関数ポインタ

```c
struct anode *mk(f, l, r)
int (*f)();
struct anode *l, *r;
{
    Node[Nn].F = f;   /* 評価関数 */
    Node[Nn].L = l;   /* 左辺 */
    Node[Nn].R = r;   /* 右辺 */
    return(&(Node[Nn++]));
}
```

`Node[100]` の固定プールにノードを積む——malloc不使用。最大100ノード。

```c
and(p)
register struct anode *p;
{
    return(((*p->L->F)(p->L)) && ((*p->R->F)(p->R))? 1: 0);
}
```

`and` ノードの評価関数は左ノードを評価し、真であれば右ノードを評価する——短絡評価だ。`||` と `&&` のC言語の短絡評価を `or()` と `and()` の関数として実装している。

descend() でファイルを発見するたびに：

```c
(*exlist->F)(exlist);
```

ノードが自分自身の評価関数を呼ぶ——関数ポインタでポリモーフィズムを実現した1979年のOOP。

---

## `{}` の誕生——`-exec` と `doex()`

```c
doex(com)
{
    static char *nargv[50];
    int np = 0;
    char *na;

    while (na = Argv[com++]) {
        if(strcmp(na, ";") == 0) break;
        if(strcmp(na, "{}") == 0) nargv[np++] = Pathname;  /* {} → ファイル名 */
        else nargv[np++] = na;
    }
    nargv[np] = 0;
    if(fork()) wait(&ccode);
    else {
        chdir(Home);
        execvp(nargv[0], nargv, np);
        exit(1);
    }
    return(ccode ? 0 : 1);
}
```

`-exec rm {} \;` の `{}` をここで `Pathname`（現在のファイルパス）に置換する。`strcmp(na, "{}")` という文字列比較で特別扱いする——`{}` という記法は `find.c` の `doex()` から生まれた。`chdir(Home)` で実行前にホームディレクトリに戻る設計が光る。

---

## `-ok`——インタラクティブ確認

```c
ok(p)
struct { int f, com; } *p;
{
    char c; int yes = 0;
    fflush(stdout);
    fprintf(stderr, "< %s ... %s > ?   ", Argv[p->com], Pathname);
    fflush(stderr);
    if((c=getchar()) == 'y') yes = 1;
    while(c != '\n') c = getchar();
    if(yes) return(doex(p->com));
    return(0);
}
```

`-exec` の確認版。`< rm ... ./foo.c > ?` と表示して `y` を待つ。`fflush(stdout)` で `-print` の出力を先に流す——`-print -ok rm {} \;` のような組み合わせを正しく動かすための考慮だ。

---

## `scomp()` ——"funny signed compare"

```c
scomp(a, b, s) /* funny signed compare */
register a, b;
register char s;
{
    if(s == '+') return(a > b);
    if(s == '-') return(a < (b * -1));
    return(a == b);
}
```

コメントが正直だ——"funny signed compare"。`-mtime +7`（7日より古い）、`-mtime -7`（7日より新しい）、`-mtime 7`（ちょうど7日前）の3通りを `s` の文字（`+`/`-`/`\0`）で切り分ける。

`b * -1` が奇妙だ——`-mtime -7` では `b=7`、`s='-'` で `a < (7 * -1)` = `a < -7` を評価する。これは経過日数の符号を逆転させる意図だが、`a` は常に非負なので `a < -7` は常に偽になる気がする。"funny" なのはそのためかもしれない。

---

## opendir() がなかった——ディレクトリを生読み

```c
struct direct dentry[32];

for(offset=0; offset < dirsize; offset += 512) {
    dsize = 512 < (dirsize-offset)? 512: (dirsize-offset);
    if((dir=open(".", 0)) < 0) { ... }
    read(dir, (char *)dentry, dsize);
    for(dp=dentry, entries=dsize>>4; entries; --entries, ++dp) {
        if(dp->d_ino == 0
        || (dp->d_name[0]=='.' && dp->d_name[1]=='\0')
        || (dp->d_name[0]=='.' && dp->d_name[1]=='.' && dp->d_name[2]=='\0'))
            continue;
        ...
    }
}
```

`opendir()` / `readdir()` は BSD 4.2（1983年）で追加された。1979年のfindはディレクトリを**通常のファイルとして `open()` して生読み**する。`struct direct` は `{short d_ino; char d_name[14];}` の16バイト構造体——`entries=dsize>>4` は `dsize/16` だ。

`if(dir > 10) { close(dir); dir = 0; }` ——ファイルディスクリプタ番号が10を超えたら閉じて次のブロック読み込み時に再オープンする。深いディレクトリ再帰でfdが枯渇しないための工夫だ。

---

## `-cpio`——find に内蔵された cpio

```c
/* find. -cpio archive.cpio */
else if(EQ(a, "-cpio")) {
    Cpio = creat(b, 0666);
    Buf  = (short *)sbrk(512);
    Dbuf = (short *)sbrk(5120);
    return(mk(cpio, ...));
}

/* main()の末尾: TRAILERを書いて終了 */
if(Cpio) {
    strcpy(Pathname, "TRAILER!!!");
    Statb.st_size = 0;
    cpio();
}
```

findは `-cpio` オプションで直接cpioアーカイブを生成できる。`MAGIC = 070707`、`MKSHORT`、`bwrite()`、`chgreel()` のコードが `cpio.c` からそのままコピーされている——1979年の「ライブラリ」のあり方だ。`find . -cpio backup.cpio` は `find . | cpio -o > backup.cpio` より直接的だった。

---

## `getunum()`——`/etc/passwd` を直接読む

```c
getunum(f, s) char *f, *s; {  /* f = "/etc/passwd" or "/etc/group" */
    pin = fopen(f, "r");
    do {
        if(c=='\n') {
            /* ユーザー名をコロンまで読む */
            while((c = *sp++ = getc(pin)) != ':') ...
            if(EQ(str, s)) {
                /* 次のコロンまでスキップ */
                while((c=getc(pin)) != ':') ...
                /* UIDを読む */
                while((*sp = getc(pin)) != ':') sp++;
                i = atoi(str);
            }
        }
    } while((c = getc(pin)) != EOF);
}
```

`-user` や `-group` のユーザー名からUID/GIDへの変換を `getpwnam()` を使わずに `/etc/passwd` を直接パースして行う。コロン区切りのフィールドを `getc()` で1文字ずつ読む——1979年にはライブラリ関数の抽象化が薄かった。

---

## `nxtarg()` の `strikes = 3`

```c
char *nxtarg() {
    static strikes = 0;

    if(strikes == 3) {
        fprintf(stderr, "find: incomplete statement\n");
        exit(1);
    }
    if(Ai >= Argc) {
        strikes++;
        Ai = Argc + 1;
        return("");
    }
    return(Argv[Ai++]);
}
```

引数が尽きた後に `nxtarg()` を3回呼ぶとエラー終了する——再帰下降パーサが引数の終端でループしないための防衛装置だ。`strikes` という命名に1979年のプログラマのユーモアが感じられる。

---

## 鑑定

```
初版       : Bell-32V Unix（1979年）
実装       : C（708行）
ASTノード  : struct anode { int (*F)(); L, R; } Node[100]（固定プール）
パーサ     : 再帰下降（exp/e1/e2/e3、優先度順）
{}         : doex()でPathnameに置換——find -exec {} \; の誕生
暗黙AND    : -a不要、述語が続けば自動的にANDで連結
-ok        : -execのインタラクティブ確認版
scomp()   : "funny signed compare"（+/-/なし の3way比較）
opendir()  : 存在しない——struct direct[]でディレクトリブロックを生読み
if(dir>10) : fd番号が大きければ即close——深い再帰でのfd枯渇対策
-cpio      : cpio.cのコードを内蔵（MAGIC=070707/TRAILER!!!まで同じ）
getunum()  : /etc/passwdをgetc()で直接パース（getpwnam()なし）
strikes=3  : 引数終端でのパーサ無限ループ防止
popen()    : pwd取得にpopen("pwd","r")（getcwd()なし）
後継       : GNU findutils find、macOS find
```

**findは「ファイルシステムのSQLだ」。**

`-name`, `-mtime`, `-user`, `-perm`, `-type` を `AND`/`OR`/`NOT` で組み合わせ、マッチしたものに `-exec` でコマンドを実行する——SQL の `SELECT ... WHERE ... AND ... EXEC` と同じ構造だ。`struct anode` の関数ポインタツリーが述語を評価し、`descend()` がファイルシステムを走査する。`opendir()` もなく、`getpwnam()` もなかった1979年に、708行でこの設計を完成させた。`{}` という記法がここで生まれた。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
