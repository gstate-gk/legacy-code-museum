# UNARY MUL——Steve Johnsonが2ビットシフトで型を表現したpcc、1977年の「移植可能なCコンパイラ」

## はじめに

`manifest` にこう書いてある。

```c
#define ASG    1+
#define UNARY  2+
```

これはマクロだ。`ASG PLUS` と書くと `1+PLUS` になる。`UNARY MUL` と書くと `2+MUL` になる。プリプロセッサを「演算子の前置修飾子」として使うという、C言語史上最も奇妙な記法の一つだ。

作者は **Steve Johnson**。前々回（#070）yacc、前回（#075）lintを書いた人物と同一だ。同じ人間が、コンパイラを生む道具（yacc）、コードを検査する道具（lint）、そしてコンパイラ本体（pcc）を書いた。Bell Labsの1970年代後半、一人の頭脳が現代のコンパイラ基盤を設計した。

pcc——Portable C Compiler——は1977年、Bell Telephone Laboratoriesで生まれた。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C（+ yacc）
- **作者**: Steve Johnson
- **年**: 1977年

```
pcc — 主要ファイル
  /usr/src/cmd/mip/         — マシン非依存コア（lint と共有）
    cgram.y   ( ~960行) — C文法（yacc）
    trees.c   (~1388行) — 式ツリー構築（buildtree）
    pftn.c    (~1682行) — 関数・シンボルテーブル
    optim.c   ( ~181行) — マシン非依存オプティマイザ
    scan.c    ( ~990行) — 字句解析器
    manifest  ( ~318行) — トークン・型・オペレータ定義
    mfile1    ( ~239行) — Pass1ヘッダ（NODE union, symtab）
    reader.c  (~1237行) — Pass2コード生成リーダ
    common    ( ~250行) — エラー処理・ノードアロケータ
  /usr/src/cmd/pcc/         — VAX向けマシン依存コード
    macdefs         — サイズ・アライメント定数
    local.c / local2.c — マシン固有変換関数
    table.c         — 命令選択テーブル
    order.c         — レジスタ割り付け
  /usr/src/cmd/cc.c         — コンパイラドライバ
```

---

## manifest——`ASG 1+` の記法

`manifest` の冒頭部分に並ぶ定義を見ると、これが普通のヘッダファイルではないことがわかる。

```c
#define ASG    1+
#define UNARY  2+
#define NOASG  (-1)+
#define NOUNARY (-2)+
```

これらのマクロは**前置演算子として機能する**。

```c
UNARY MUL     →  2+MUL     /* 間接参照演算子 * */
UNARY AND     →  2+AND     /* アドレス演算子 & */
UNARY MINUS   →  2+MINUS   /* 単項マイナス */
ASG PLUS      →  1+PLUS    /* += */
ASG MINUS     →  1+MINUS   /* -= */
ASG MUL       →  1+MUL     /* *= */
```

`trees.c` の `buildtree()` でこの記法が至る所に現れる。

```c
case UNARY MINUS:
    ...
case ASG PLUS:
    ...
case UNARY MUL:  /* 間接参照 */
```

これはトークン番号の算術だ。`MUL=45` なら `UNARY MUL = 2+45 = 47`。二項演算子、代入演算子、単項演算子が連続した番号空間に配置されている。switch文の case が読めるようになる——`case UNARY MUL:` は `case 47:` よりはるかに明確だ。

奇妙だが、機能する。しかも1977年のCプリプロセッサで動く。

---

## TWORD——2ビットシフトで型を圧縮する

型情報の表現は `manifest` に定義されている。

```c
/* 基本型（下位4ビット） */
#define INT     4
#define CHAR    2
#define DOUBLE  7
#define STRTY   8
/* ... */

/* 型修飾子 */
#define PTR   020    /* ポインタ */
#define FTN   040    /* 関数 */
#define ARY   060    /* 配列 */

#define BTMASK   017    /* 基本型マスク */
#define TSHIFT   2      /* 修飾子1段のシフト幅 */

/* 型操作マクロ */
#define INCREF(x)  (((x&~BTMASK)<<TSHIFT)|PTR|(x&BTMASK))
#define DECREF(x)  (((x>>TSHIFT)&~BTMASK)|(x&BTMASK))
#define ISPTR(x)   (((x)&TMASK)==PTR)
#define ISFTN(x)   (((x)&TMASK)==FTN)
#define ISARY(x)   (((x)&TMASK)==ARY)
```

`TWORD`（`unsigned int`）1つで複雑な型が表現できる。

```
int **p の型:
  基本型:  INT (4)      = 0000 0100
  PTR 1段: INCREF       = 0001 0100
  PTR 2段: INCREF 再び  = 0001 0001 0100

int (*fp)(char) の型:
  基本型:  INT
  FTN:     関数
  PTR:     ポインタ
```

`INCREF(x)` は「既存の修飾子を2ビット左シフトして、PTRビットを最下位修飾子位置に追加する」操作だ。型の「外側」が低位ビットに来る。`DECREF` はその逆。`int *` から `int` に戻るのは1命令のマクロ。

この設計は **32ビットのint1つで `int`、`int *`、`int **`、`int (*)()`、配列の任意の組み合わせを表現できる**。1977年のメモリが貴重な時代に、型情報を1ワードに詰め込んだ。

---

## NODE union——ノードを使い分ける1つの型

式ツリーのノードは `mfile1` に定義されている。

```c
union ndu {
    struct { int op; int rall; TWORD type; int su;
             char name[8]; NODE *left; NODE *right; };  /* 二項演算子 */

    struct { int op; int rall; TWORD type; int su;
             char name[8]; CONSZ lval; int rval; };      /* 定数・名前 */

    struct { int op; int rall; TWORD type; int su;
             int label; };                                /* 分岐 */

    struct { int op; int rall; TWORD type; int su;
             int stsize; int stalign; };                  /* 構造体 */

    struct { int op; int cdim; TWORD type; int csiz;
             double dval; };                              /* 浮動小数点定数 */
};
```

C言語の `union` を使った**タグなし直和型**だ。`op`（オペレータ）が必ず先頭にあり、`op` の値を見て解釈を切り替える。

- `NAME` ノード: `rval > 0` はシンボルテーブルインデックス、`lval` はビットオフセット
- `ICON` ノード: `lval` が定数値、`rval == NONAME` なら純粋な数値定数
- `REG` ノード: `rval` がレジスタ番号
- `FCON` ノード: `dval` に浮動小数点値（`double`）

`double dval` を含む最後の struct は他の struct より大きい——これが union のサイズを決める。全ノードが同じサイズのメモリを使う代わりに、型安全性をランタイムの `op` チェックに委ねる。現代のRustや関数型言語のenumが解決しようとした問題を、1977年のCはこう扱っていた。

---

## ポータビリティの仕組み——`-I` の順序が全て

pccが「Portable」を名乗れる理由は `Makefile` に書いてある。

```make
M=/usr/src/cmd/mip     # マシン非依存ファイルのディレクトリ

trees.o: $M/manifest macdefs $M/mfile1 $M/trees.c
    cc -c $(CFLAGS) -I$M -I. $M/trees.c
```

`-I$M -I.` ——インクルードパスの順序が逆だ。通常は `-I.` を先に書く。ここでは**意図的に `-I$M` が先**だ。

しかし `macdefs` は `-I.`（ローカル）でも `-I$M`（共通）にも存在しない独立ファイルとして扱われる。鍵は、コンパイラ共通の `manifest` や `mfile1` は `-I$M` から来るが、`macdefs`（型サイズ・アライメントのアーキテクチャ固有定義）だけはコンパイル時にカレントディレクトリ（ターゲット固有ディレクトリ）から提供する、という約束にある。

```c
/* VAX版 macdefs */
#define SZCHAR   8
#define SZINT    32    /* VAX: 32ビットint */
#define SZLONG   32
#define SZPOINT  32    /* VAX: 32ビットポインタ */
#define ALINT    32
```

```c
/* PDP-11版 macdefs（仮） */
#define SZINT    16    /* PDP-11: 16ビットint */
#define SZPOINT  16
```

同じ `trees.c`、`pftn.c`、`cgram.y` が、異なる `macdefs` を用意するだけで別のアーキテクチャ向けにビルドされる。これが現代の CMake、autoconf、そして LLVM の target triple の直接の祖先だ。

---

## optim.c——乗算をシフトに変える

`optim.c` は181行の小さなオプティマイザだ。

```c
/* 乗算をシフトに変換 */
if( o==MUL && nncon(p->right) && (i=ispow2(RV(p)))>=0 ){
    o = p->op = LS;
    RV(p) = i;
}

/* 関係演算子: 定数を必ず右辺に */
short revrel[] = { EQ, NE, GE, GT, LE, LT, UGE, UGT, ULE, ULT };
```

`ispow2()` は定数が2のべき乗かどうかを検査する。`x * 8` は `x << 3` に変換される。これはマシン非依存最適化——どのアーキテクチャでもシフトは乗算より速い。

`revrel[]` は `5 < x` を `x > 5` に変換するための逆演算子テーブルだ。比較演算子の右辺には定数が来るという規約に合わせる。

---

## cgram.y——dangling-elseが既知の問題だった

`cgram.y` の先頭にこうある。

```yacc
/* at last count, there were 7 shift/reduce, 1 reduce/reduce conflicts
/* these involved:
    if/else
    recognizing functions in various contexts, including declarations
    error recovery
```

`if/else` の dangling-else問題（`if (a) if (b) c; else d;` の `else` がどちらの `if` に属するか）は、1978年時点で既知の7 shift/reduce 競合として記録されていた。yaccは「shift」を選択する——競合時は常にshiftを優先するというyaccの規則が、dangling-elseを「最近のif」に結びつける正しい挙動を生む。バグではなく、既知の設計上の妥協点だ。

---

## cc.c——4段パイプライン

コンパイラドライバは4段構成だ。

```c
char pass0[40] = "/lib/ccom";   /* C コンパイラ本体（Pass1+2）*/
char pass2[20] = "/lib/c2";     /* Peepholeオプティマイザ */
char passp[20] = "/lib/cpp";    /* プリプロセッサ */
char *pref = "/lib/crt0.o";     /* C runtime startup */
```

```
ソース.c
    → cpp  (プリプロセッサ)
    → ccom (構文解析+コード生成)
    → c2   (Peepholeオプティマイザ、オプション)
    → as   (アセンブラ)
    → ld   (リンカ)
```

`c2` はオプションの2段目オプティマイザ。アセンブラ命令を見て、`mov r1,r2; mov r2,r1` のような冗長な命令対を消す。これが「Peephole optimization」——覗き窓（peephole）越しに直前・直後の命令を見て最適化する手法の名前の由来だ。

---

## 鑑定

```
初版       : 1977年（Bell-32V収録）
作者       : Steve Johnson（Bell Telephone Laboratories）
実装       : C + yacc
マシン非依存: /usr/src/cmd/mip（lintと共有）
移植先     : PDP-11, VAX, Interdata 8/32（最初の非PDP-11 Unix）
型表現     : TWORD（unsigned int 1つに2ビットシフトで型修飾子を積み重ね）
演算子記法 : ASG 1+ / UNARY 2+（マクロを前置演算子として使用）
yacc競合   : shift/reduce 7個（dangling-else等）、既知の設計上の妥協
最適化     : optim.c（乗算→シフト変換）+ c2（Peepholeオプティマイザ）
パス構成   : cpp → ccom → c2 → as → ld の4段パイプライン
後継       : GCC, LLVM（マシン非依存コアの設計思想を継承）
```

Steve Johnsonは1975年にyaccを書き、1977年にlintとpccを書いた。三連作だ。

yacc：コンパイラの文法を宣言的に書く  
lint：コードの欠陥を静的に検出する  
pcc：コードを複数のアーキテクチャにコンパイルする

その全てが `/usr/src/cmd/mip` というディレクトリに収束している。lintはpccのパーサを使い、pccはyaccで書かれた文法を持つ。Bell Labsの道具箱は自己参照の塔だった。

`INCREF(x)` マクロ1つで `int *` の型が表現できる世界を設計した男が、同じ時代に「コンパイラを移植可能にする」という問題を `-Iディレクトリ` の順序で解いた。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
