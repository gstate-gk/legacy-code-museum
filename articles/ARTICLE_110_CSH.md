# `"Too dangerous to alias that"`——`alias` が `alias` を上書きできない1979年の csh、`!` がLexerで展開されるhistory置換とBill Joyの発明

## はじめに

```c
if (eq(p, "alias") || eq(p, "unalias")) {
    setname(p);
    bferr("Too dangerous to alias that");
}
```

`alias alias rm` は実行できない。`alias` が `alias` 自身を上書きしようとすると "Too dangerous to alias that" というエラーで止まる——Bill Joyはこの罠を最初から知っていた。BSD Unix 3BSD（1979年）の `csh` は17ファイル、約8,000行。

`csh` は **Bill Joy** が UC Berkeley で1978年10月に書いた。sh.hのコメントが証言する：

```c
/*
 * C shell
 *
 * Bill Joy, UC Berkeley
 * October, 1978
 */
```

Bourne Shellが同年AT&Tで生まれた。Joyは `history`・`alias`・Job Controlを持つシェルを独立して作った——`!` でコマンド履歴を呼び戻す機能は csh が発明した。

---

## 発掘されたコード

- **オリジナル**: Regents of the University of California
- **参照先**: dspinellis/unix-history-repo BSD-3-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: 3BSD版（1979年）

```
csh/  — 17ファイル、約8,000行
  sh.c      — main()、初期化、メインループ（754行）
  sh.lex.c  — 字句解析、history置換（1,240行）
  sh.func.c — 組み込みコマンドの実装（784行）
  sh.glob.c — ファイル名展開（726行）
  sh.dol.c  — $変数展開（668行）
  sh.parse.c— パーサ（621行）
  sh.exp.c  — 式評価（553行）
  sh.hist.c — history管理（93行）
  sh.init.c — 組み込みコマンドテーブル（172行）
  sh.h      — 全グローバル宣言（402行）
  （他7ファイル）
```

---

## `struct Hist`——イベント番号と参照カウントで管理するhistory list

```c
struct Hist {
    struct wordent  Hlex;   /* 入力をトークン列として保存 */
    int             Hnum;   /* イベント番号 */
    int             Href;   /* 参照カウント（老化のため） */
    struct Hist     *Hnext; /* 次のhistoryエントリ */
} Histlist;

int eventno;  /* 次のイベント番号 */
int lastev;   /* 最後に参照したイベント（デフォルト！！） */
```

`savehist()` が毎コマンドを `Histlist` の先頭に追加し、`histlen` を超えた古いエントリを削除する：

```c
savehist(sp)
    struct wordent *sp;
{
    register struct Hist *hp, *np;
    int histlen;
    register char *cp;

    cp = value("history");
    if (*cp == 0)
        histlen = 0;
    else {
        while (*cp && digit(*cp))
            cp++;
        /* avoid a looping snafu */
        if (*cp)
            set("history", "10");
        histlen = getn(value("history"));
    }
    /* throw away null lines */
    if (sp->next->word[0] == '\n')
        return;
    for (hp = &Histlist; np = hp->Hnext;)
        if (eventno - np->Href >= histlen || histlen == 0)
            hp->Hnext = np->Hnext, hfree(np);
        else
            hp = np;
    enthist(++eventno, sp, 1);
}
```

`/* avoid a looping snafu */` — `history` 変数の値が数値でない場合（例えば `set history=foo`）は `"10"` にリセットする。スナフー（snafu = Situation Normal All Fouled Up）——軍隊スラングで「いつも通りのごたごた」。

`dohist1()` は再帰で history list を末尾まで辿ってから出力する——古いイベントが先、新しいイベントが後の順で表示するための再帰だ：

```c
dohist1(hp)
    register struct Hist *hp;
{
    if (hp == 0) return;
    hp->Href++;
    dohist1(hp->Hnext);  /* 末尾へ再帰 */
    phist(hp);           /* 戻りながら出力（古い順） */
}
```

---

## `!` はLexerで展開される——3段ペクバッファの設計

`!` による history 置換は**字句解析（lexer）のレベルで処理**される：

```c
char peekc, peekd;   /* getC の2段ペーク */
char peekread;       /* readc のペーク */

char *exclp;         /* ! 置換の現在の単語（残り） */
struct wordent *exclnxt; /* ! 置換の残りの単語列 */
int   exclc;         /* ! 置換の残り単語数 */
```

`getC()` が `!` を読んだ瞬間に `getexcl()` を呼んで、history list から対応するトークン列を取り出し、`exclp/exclnxt` にセットする。次の `getC()` の呼び出しからはそのトークン列が流れ出す——入力ストリームへの「割り込み挿入」だ。

`peekc`・`peekd`・`peekread` の3段バッファが必要な理由をコメントが説明する：

```c
/*
 * There is a subtlety here in many places... history routines
 * will read ahead and then insert stuff into the input stream.
 * If they push back a character then they must push it behind
 * the text substituted by the history substitution.
 */
```

history 置換ルーティンが先読みして入力に差し込む——差し込む前に押し戻したい文字は、差し込んだテキストの「後ろ」に置かなければならない。1文字のpeekでは足りないため3段が必要だ。

---

## `^lef^rit`——`!:s^lef^rit` の省略形

```c
if (c == '^' && intty)
    /* ^lef^rit   from tty is short !:s^lef^rit */
    getexcl(c);
```

tty入力（対話的シェル）で行頭の `^` は `!:s^lef^rit` の省略形だ——直前のコマンドの `lef` を `rit` に置換して再実行する。`^grpe^grep` で誤入力を即座に修正できる。`intty` チェックで非対話的スクリプトでは無効になる。

`getexcl()` の `sc == '^'` 分岐：

```c
if (sc == '^') {
    ungetC('s'), unreadc('^'), c = ':';
    goto subst;
}
```

`^` を読んだら `s` と `^` を押し戻して `:s^...^...` と同じパスを歩く——文字列操作でシンタックスシュガーを実現する。

---

## `"Too dangerous to alias that"`——aliasの自己防衛

```c
doalias(v)
    register char **v;
{
    register struct varent *vp;
    register char *p;

    v++;
    p = *v++;
    if (p == 0)
        plist(&aliases);              /* alias — 全一覧 */
    else if (*v == 0) {
        vp = adrof1(strip(p), &aliases);
        if (vp)
            blkpr(vp->vec), printf("\n");  /* alias name — 1件表示 */
    } else {
        if (eq(p, "alias") || eq(p, "unalias")) {
            setname(p);
            bferr("Too dangerous to alias that");  /* 自己上書き禁止 */
        }
        set1(strip(p), saveblk(v), &aliases);
    }
}
```

`alias alias rm` を許すと、`alias` コマンド自体が `rm` として動作し、aliasを解除する方法がなくなる——ループや自己破壊の罠だ。Bill Joyはこの罠を最初から知っていた。`alias` と `unalias` の2つを明示的に禁止する。

---

## `struct varent`——変数もaliasも同じ構造体

```c
/*
 * Lists of aliases and variables are sorted alphabetically by name
 */
struct varent {
    char    **vec;      /* Array of words which is the value */
    char    *name;      /* Name of variable/alias */
    struct varent *link;
} shvhed, aliases;
```

変数リスト（`shvhed`）とaliasリスト（`aliases`）が同じ `struct varent` だ。`adrof1()` が両方を検索できる。`vec` は `char **`——aliasは**単語の配列**として保存される。`alias ls 'ls -F'` は `{"ls", "-F", NULL}` という配列だ。

aliasが展開されるとき、その内容が入力ストリームに差し込まれる（historyと同じメカニズム）。aliasが再帰的に展開される可能性があるため、`alhistp/alhistt/alvec` という別系統の変数が追跡する。

---

## `struct biltins`——最小/最大引数を持つ組み込みコマンドテーブル

```c
struct biltins {
    char    *bname;
    int     (*bfunct)();
    short   minargs, maxargs;
} bfunc[] = {
    "@",        dolet,      0,  INF,
    "alias",    doalias,    0,  INF,
    "break",    dobreak,    0,  0,
    "cd",       chngd,      0,  1,
    "foreach",  doforeach,  3,  INF,
    "history",  dohist,     0,  0,
    "if",       doif,       1,  INF,
    /* ... */
    0,          0,          0,  0,
};
```

ar.c（#097）や find.c（#095）と同じ関数ポインタテーブルだが、`minargs/maxargs` という引数制約が付く。`#define INF 1000` で「無制限」を表現。`"@"` は `dolet`——cshのC言語風算術演算子（`@ i = $i + 1`）だ。

組み込みコマンドの検索は線形スキャン——テーブルの順序がそのまま検索順になる。アルファベット順に並んでいるため読みやすいが、実行順序は変わらない。

---

## `hadhist`——history置換が起きたかどうかのフラグ

```c
bool hadhist;

lex(hp)
    register struct wordent *hp;
{
    /* ... */
    alvecp = 0, hadhist = 0;
    /* ... */
    return (hadhist);
}
```

`lex()` が `hadhist` を返す。メインループ（`process()`）はこれを使って入力をエコーするかどうかを判断する——`set verbose` の場合、history置換があった行は置換後のテキストをエコーする。`echo` もhistory置換の結果を見せる。

---

## 鑑定

```
初版       : 3BSD Unix（1979年）、オリジナルは1978年10月
作者       : Bill Joy（UC Berkeley）
実装       : C（17ファイル、約8,000行）
発明       : history置換（!）、alias、Job Control
struct Hist: Hlex(トークン列) + Hnum(イベント番号) + Href(参照カウント)
!置換      : Lexerレベルで展開（getexcl()、exclp/exclnxt/exclcで挿入）
peekバッファ: peekc/peekd/peekreadの3段——history置換の差し込みに必要
^lef^rit  : !:s^lef^rit の省略形（inttyチェックで対話時のみ有効）
alias禁止  : alias/unaliasのalias上書きを"Too dangerous to alias that"で拒否
struct varent: 変数もaliasも同じ構造体、vecはchar**（単語配列）
bfunc[]    : 関数ポインタ+minargs/maxargsの組み込みコマンドテーブル
hadhist    : history置換の有無をlexerが返す——echoの条件判断
snafu対策  : historyが数値でなければ"10"にリセット——looping snafu防止
後継       : tcsh（1981年）、fishのhistory、bashのhistoryは別実装
```

**cshは「対話的シェルの設計図」だ。**

コンピュータが1人に1台になる前夜、端末の前で試行錯誤するユーザーのために、Bill Joyは `!` と `alias` を発明した。Bourne Shellがスクリプト言語として設計されたとき、cshは**対話**のために設計された。Lexerのレベルで `!` を展開し、`peekc/peekd/peekread` の3段バッファで入力への「割り込み挿入」を実現し、`alias` が `alias` を上書きする罠を "Too dangerous" の一言で封じた——1979年の設計判断は50年後のfishやzshにも生きている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
