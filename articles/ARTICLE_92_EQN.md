# `int from 0 to inf`——数学の言葉でtroffに話しかける、KernighanとCherryの1974年の翻訳機

## はじめに

`lookup.c` の中央部にある。

```c
">=",   "\\(>=",
"<=",   "\\(<=",
"inf",  "\\(if",
"alpha","\\(*a",
"beta", "\\(*b",
"gamma","\\(*g",
"approx","\\v'-.2m'\\z\\(ap\\v'.25m'\\(ap\\v'-.05m'",
```

この2列の表が、eqnの本質をすべて語っている。

左列：人間が書く言葉。右列：troffが食べる呪文。

`"approx"` は `≈` だ。`\z` は「カーソルを動かさずに印字する」troff命令。`\(ap` が波線ひとつ。それを2つ、`0.25m` ずらして重ねると `≈` になる。この変換知識が、1974年のCソースコードに1行で記録されている。

**eqn**——数式組版プリプロセッサ——は今日も動いている。LaTeX以前の時代、BellLabsの科学者たちは論文の数式を `eqn` で書いた。Unixドキュメントの多くが今もeqnで組まれている。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C（+ yacc）
- **作者**: Brian W. Kernighan + Lorinda Cherry
- **年**: 1974年（Bell Labs Tech Journal 1975年掲載）

```
eqn — ファイル構成（23ファイル、1,762行）
  e.y      (166行) — yaccによる数式文法
  e.h      ( 42行) — 共有ヘッダ（VERTマクロ含む）
  lookup.c (217行) — キーワードとギリシャ文字テーブル
  io.c     (195行) — メインドライバ（.EQ〜.EN処理）
  lex.c    (211行) — 字句解析（プッシュバック実装）
  text.c   (170行) — テキストボックス処理
  sqrt.c   ( 17行) — 平方根の組版
  over.c   ( 29行) — 分数の組版（分子/分母/罫線）
  integral.c(30行) — 積分記号の組版
  diacrit.c ( 56行) — アクセント記号（vec/bar/hat等）
  ほか 13ファイル
```

---

## 痕跡1：166行の文法——`int from 0 to inf`

`e.y` の文法が数式組版言語の全体を定義している。166行。

```yacc
box : box OVER box  { boverb($1, $3); }
    | MARK box      { mark($2); }
    | SQRT box      { sqrt($2); }
    | int sub box sbox %prec SUB  { integral($1, $3, $4); }
    | int sup box  %prec SUP      { integral($1, 0, $3); }
    | int                         { integral($1, 0, 0); }
    | box from box tbox %prec FROM { fromto($1, $3, $4); fromflg=0; }
    | box to box    %prec TO      { fromto($1, 0, $3); }
    | box diacrit   { diacrit($1, $2); }
    | left eqn right { paren($1, $2, $3); }
    ;
```

ユーザーが書くのはこれだ：

```
int from 0 to inf e sup {-x sup 2} dx
```

eqnはこれを読み、`∫₀^∞ e^(−x²) dx` をtroffで組版する。

yaccの優先順位宣言（`%prec`）が重要だ。`from` と `to` のどちらが先に来ても `%right FROM` と `%right TO` によって正しく解析される。`sub` より `from` が優先されるから `int from 0 to inf` が `(int from 0) to inf` に誤解析されない。

この文法に `UNION`（∪）、`INTER`（∩）、`PROD`（∏）、`SUM`（∑）、`LPILE`（左揃え縦並べ）、`MATRIX`（行列）が含まれる——全部で166行。

---

## 痕跡2：ギリシャ文字の辞書——人間語からtroff呪文へ

`lookup.c` に数学記号の完全な変換テーブルがある。

```c
struct {
    char *res;
    char *resval;
} resword[] = {
    ">=",    "\\(>=",
    "<=",    "\\(<=",
    "==",    "\\(==",
    "!=",    "\\(!=",
    "+-",    "\\(+-",
    "->",    "\\(->",
    "<-",    "\\(<-",
    "inf",   "\\(if",
    "infinity","\\(if",
    "partial","\\(pd",
    "half",  "\\f1\\(12\\fP",
    "prime", "\\f1\\(fm\\fP",
    "times", "\\(mu",
    "del",   "\\(gr",
    "grad",  "\\(gr",
```

そして全ギリシャ文字：

```c
    "alpha", "\\(*a",
    "beta",  "\\(*b",
    "gamma", "\\(*g",
    "GAMMA", "\\(*G",
    "delta", "\\(*d",
    "DELTA", "\\(*D",
    /* ... 全24文字 ... */
    "pi",    "\\(*p",
    "PI",    "\\(*P",
    "sigma", "\\(*s",
    "SIGMA", "\\(*S",
    /* ... */
    0, 0
};
```

`\\(*a` はtroffのギリシャ文字エスケープ。ユーザーは `alpha` と書けば `α` が出る。`SIGMA` と書けば `Σ` が出る。辞書引きだ。

関数名も変換される：

```c
    "sin",  "\\f1sin\\fP",
    "cos",  "\\f1cos\\fP",
    "lim",  "\\f1lim\\fP",
    "log",  "\\f1log\\fP",
    "max",  "\\f1max\\fP",
    "min",  "\\f1min\\fP",
    "exp",  "\\f1exp\\fP",
    "det",  "\\f1det\\fP",
```

`\\f1` はローマン体に切り替え、`\\fP` は元のフォントに戻す。数式中の関数名は慣例的に立体で組む——この知識が180行のCテーブルに埋め込まれている。

`approx` の実装が白眉だ：

```c
#else  /* troff版 */
    "approx","\\v'-.2m'\\z\\(ap\\v'.25m'\\(ap\\v'-.05m'",
```

`\z` は「次の文字を印字するがカーソルを動かさない」troff命令。2つの `\(ap`（チルダ記号）を `0.25m` ずらして重ねると `≈` になる。これを1行のCの文字列リテラルで表現している。

neqn（文字端末版）では：

```c
#ifdef NEQN
    "approx","~\b\\d~\\u",
```

バックスペースで重ねる。1つのソースで2つの出力デバイスに対応する。

---

## 痕跡3：VERTマクロ——troffの座標系への適応

`e.h` に小さいが重要なマクロがある。

```c
#define VERT(n)   ((((n)+1)/3)*3)
#define EFFPS(p)  ((p) >= 6 ? (p) : 6)
```

`VERT(n)` は数値を3の倍数に切り上げる。

troffの座標単位はデバイス依存だが、Bell Labsの写植機（Graphic Systems C/A/T）では `1u = 1/432 インチ`。フォントのポイントサイズは `1pt = 6u`。全ての縦方向計算が6の倍数になるよう、`VERT` が保証する。

```c
eht[yyval] = VERT( (nps*6*12)/10 );   /* sqrt.c */
d = VERT((ps*6*3) / 10);              /* over.c: 0.3m の縦間隔 */
```

整数演算で `0.3m`（m = 1em = ポイントサイズ × 6u）を計算し、3の倍数に丸める。浮動小数点なしで組版座標を扱う1974年の解。

`EFFPS(p)` はポイントサイズの最小値を6ptに制限する。これ以下だと写植機が処理できないため。

---

## 痕跡4：平方根の物理——`\(sr\l'\n(%du\(rn'`

`sqrt.c` は17行だが、1行のprintfがすべてを語る。

```c
printf(".ds %d \\v'%du'\\s%d\\v'-.2m'\\(sr\\l'\\n(%du\\(rn'\\v'.2m'\\s%d",
    yyval, ebase[p2], nps, p2, ps);
printf("\\v'%du'\\h'-\\n(%du'\\*(%d\n", -ebase[p2], p2, p2);
```

troff記法を解読すると：

```
\\v'%du'       — 垂直移動（ベースラインへ）
\\s%d          — ポイントサイズ変更（√記号用に小さく）
\\v'-.2m'      — さらに0.2m上に
\\(sr          — √記号（根号左部分）
\\l'\\n(%du\\(rn' — \\n(%d幅の水平線を\(rn文字で描く（根号上部の横棒）
\\v'.2m'       — 0.2m下に戻す
\\s%d          — ポイントサイズを元に戻す
\\v'%du'       — 垂直移動（元のベースラインへ）
\\h'-\\n(%du' — 根号幅だけ左に戻る
\\*(%d        — 根号内の数式を描く
```

`\(sr` は「根号の左部分」、`\(rn` は「根号上部の横棒を引くための文字」。2つのtroff特殊文字を組み合わせ、任意幅の `√‾‾` が完成する。

`nps = EFFPS(((eht[p2]*9)/10+5)/6)` は根号記号のポイントサイズを中身の高さから計算する。整数演算の近似。

---

## 痕跡5：.EQ/.EN——troffへのメッセージ

`io.c` のメインループが数式の検出方法を示す。

```c
while ((type=getline(in)) != EOF) {
    if (in[0]=='.' && in[1]=='E' && in[2]=='Q') {
        /* ... */
        printf("%s",in);          /* .EQ 行をそのまま出力 */
        printf(".nr 99 \\n(.s\n"); /* 現在のポイントサイズを保存 */
        printf(".nr 98 \\n(.f\n"); /* 現在のフォントを保存 */
        markline = 0;
        init();
        yyparse();                /* 数式を解析 */
        if (eqnreg>0) {
            printf(".nr %d \\w'\\*(%d'\n", eqnreg, eqnreg);
            printf(".rn %d 10\n", eqnreg);
            if(!noeqn) printf("\\*(10\n");
        }
        printf(".ps \\n(99\n.ft \\n(98\n");  /* フォントとサイズを復元 */
        printf(".EN");
```

eqnはフィルターだ。troffソースファイルを読み、`.EQ〜.EN` の間だけを処理し、それ以外はそのままスルーする。

処理前に `.nr 99 \n(.s`（現在のポイントサイズ）と `.nr 98 \n(.f`（現在のフォント）をtroffのレジスタに保存し、処理後に復元する。数式前後でフォントが変わらないことをtroffレジスタで保証する。

パイプラインの位置：

```sh
pic file.ms | tbl | eqn | troff -ms | ps2pdf
```

`pic`（図表）→ `tbl`（表）→ `eqn`（数式）→ `troff`（組版）。それぞれが独立した言語を独立したプロセスで処理し、次に渡す。Unixのパイプ哲学の完全な実現。

---

## 痕跡6：`#ifdef NEQN`——1つのソースで2つの宇宙

`lookup.c` に条件コンパイルが現れる。

```c
#ifdef NEQN  /* neqn: 文字端末用 */

    "tdefine", TDEFINE,
    "ndefine", DEFINE,  /* ndefine を define と同義にする */

#else        /* eqn: 写植機用 */

    "tdefine", DEFINE,  /* tdefine を define と同義にする */
    "ndefine", NDEFINE, /* ndefine は無視 */

#endif
```

`tdefine`（troff-define）と `ndefine`（nroff-define）は、出力先によって意味が変わる定義命令だ。写植機（troff）では `tdefine` が有効で `ndefine` は無視される。端末（nroff/neqn）ではその逆。

`#ifdef NEQN` の一択を変えるだけで、同じソースから2つのバイナリが生まれる。1974年の継続的配信の原形。

---

## Lorinda Cherry——bcとeqnを書いた女性

Lorinda Cherryはベル研究所の研究員で、eqnの共同著者だ。Cherry はbc（#071）の作者でもある——`bc.y` の yacc文法でDC上に精度無制限計算機を実現した300行のコード。

2人の担当は記録にないが：
- KernighanはAWKを書き、m4を書き、eqnを書いた——言語設計者
- CherryはBCを書き、eqnを書いた——数学処理の専門家

Bell Labs Tech Journal 1975年の論文 "EASY TYPESETTING OF MATHEMATICAL TEXT" にKernighanとCherryの連名がある。

eqnが実現したこと：科学者が `int from 0 to inf e sup {-x sup 2} dx` と書けば、美しいガウス積分記号が紙に刷られる。TRoffが機械語なら、eqnは数式の日本語だった。

---

## 推定される経緯

**1973年**: Ken Thompsonがed（#067）のために正規表現エンジンを設計。yaccがBell Labsの標準ツールになる。

**1974年**: Brian Kernighan + Lorinda Cherry が eqn を開発。対象は Bell Labs内部の論文執筆。同年、AWK（Kernighan + Weinberger + Aho）の原型も開発される。CherryはDC（#068）のフロントエンドとしてBC（#071）も書く。

**1975年**: Bell Labs Technical Journal に論文掲載。"EASY TYPESETTING OF MATHEMATICAL TEXT"。科学技術論文の組版が変わった。

**1979年**: Unix Version 7 に同梱。eqn/neqn の両バイナリが配布される。世界中のUnixシステムで科学論文が組まれる。

**1984〜**: Donald Knuthが TeX（#047）を開発。eqnとは別の哲学——完全な制御vs.自然な記法。現代の `\frac{}{}` はeqnの `over` とは異なる道を選んだ。

**現在**: GNU troff（groff）にeqnが同梱され、LinuxのBSDモノのman page生成に使われている。`man bash` の数式表現はeqnの子孫が処理している可能性がある。

---

## コードの価値

- **1,762行**（23ファイル）で完全な数式組版プリプロセッサ
- yacc文法166行が数式言語を定義
- 変換テーブル1枚にギリシャ文字全24字 + 数学記号 + 関数名
- `#ifdef NEQN` の1フラグで端末/写植機の両対応
- `VERT(n)` マクロで浮動小数点なしの精密組版

Brian KernighanはAWK、m4、eqnを書いた。Lorinda CherryはBC、eqnを書いた。TeX（1984年）以前の10年間、世界中の科学論文はこの1,762行の上に印刷された。
