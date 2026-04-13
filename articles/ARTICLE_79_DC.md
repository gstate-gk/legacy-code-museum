# bcより古い、スタックに生きる——dc、1969年のRPN電卓とチューリング完全マクロ

## はじめに

`bc` はUnixの計算機として知られている。しかし `bc` は表向きの顔だ。

`bc` のコードを追うと、最終的にすべての演算を `dc` に渡す。`bc` は構文解析器であり、`dc` へのコンパイラだ。本体は常に `dc` だった。

`dspinellis/unix-history-repo` の Bell-32V ブランチに `usr/src/cmd/dc/dc.c` がある。**1940行**。1969年、Robert Morris（Bell Telephone Laboratories）。

`bc`（1975年）より6年古い。おそらく**現役最古のUnixプログラム**のひとつだ。

---

## 発掘されたコード

- **リポジトリ**: [dspinellis/unix-history-repo](https://github.com/dspinellis/unix-history-repo)（Bell-32V-Snapshot-Development ブランチ）
- **スター数**: 7,215
- **実装言語**: C
- **設計者**: Robert Morris（Bell Telephone Laboratories）
- **初版**: 1969年

```
dc/ — 3ファイル
  dc.c   (1940行) — コマンドディスパッチャ、演算実装
  dc.h   ( 220行) — struct blk定義、マクロ群
  Makefile

dc.c の主要関数:
  commnds()  # メインループ：1文字ディスパッチ
  div()      # 任意精度除算（base-100）
  sqrt()     # 任意精度平方根
  exp()      # 任意精度べき乗（binary exponentiation）
  readin()   # 数値読み込み（input-radix対応）
  init()     # 初期化（256文字シンボルテーブル）
```

---

## RPN——逆ポーランド記法

dc はスタックマシンだ。演算子は数値の後に書く。

```
4 5 +     →  9 をスタックに積む
2 3 4 + * →  2 と (3+4) の積 = 14
```

`commnds()` のメインループは `while(1){ switch(c){ ... } }` だ。1文字読んで即座にディスパッチする。数字なら `readin()` で任意精度数値に変換してpush、演算子なら2つをpopして計算してpush。

```c
commnds(){
    register int c;
    register struct blk *p,*q;

    while(1){
        if(((c = readc())>='0' && c <= '9') ||
           (c>='A' && c <='F') || c == '.'){
            unreadc(c);
            p = readin();    /* 数値をbase-100形式に変換してpush */
            pushp(p);
            continue;
        }
        switch(c){
        case '+': if(eqk() != 0)continue; binop('+'); continue;
        case '-': subt(); continue;
        case '*': /* ... 精度計算 ... */ binop('*'); continue;
        case '/': if(dscale() != 0)continue; binop('/'); continue;
        case '^': /* ... binary exponentiation ... */ continue;
        case 'v': /* ... 平方根 ... */ continue;
        /* ... */
        }
    }
}
```

`k` コマンドで小数点以下の桁数（scale）を設定できる。`i` と `o` で入出力の基数を変える——16進入力・10進出力も、8進出力も、任意基数も可能だ。

---

## struct blk——base-100の任意精度演算

dcの数値はすべて `struct blk` に格納される。

```c
struct blk {
    char *rd;    /* 読み取りポインタ */
    char *wt;    /* 書き込みポインタ */
    char *beg;   /* バッファ先頭 */
    char *last;  /* バッファ末尾 */
};
```

数値は**base-100**（1バイト = 0〜99、2十進桁）でリトルエンディアンに格納される。`dc.h` はこの構造体を操作するマクロ群で構成されている。

```c
#define length(p)    ((p)->wt-(p)->beg)
#define rewind(p)    (p)->rd=(p)->beg
#define fsfile(p)    (p)->rd = (p)->wt       /* ファイル末尾（最上位桁）へ */
#define sfeof(p)     (((p)->rd==(p)->wt)?1:0)
#define sfbeg(p)     (((p)->rd==(p)->beg)?1:0)

#define sgetc(p)     (((p)->rd==(p)->wt)?EOF:*(p)->rd++)
#define sbackc(p)    (((p)->rd==(p)->beg)?EOF:*(--(p)->rd))
#define sputc(p,c)   {if((p)->wt==(p)->last)more(p); *(p)->wt++ = c; }
```

`sgetc`/`sbackc` が双方向シーク——前から読む（最下位桁から）か、後ろから読む（最上位桁から）かを選べる。加算は最下位桁から繰り上がりを伝播し、除算は最上位桁から推定商を計算する。

除算アルゴリズムは見事だ。

```c
magic = 0;
fsfile(divr);
c = sbackc(divr);         /* 除数の最上位バイト */
if(c<10) magic++;         /* 小さい除数には補正が必要 */
c = c*100 + (sfbeg(divr)?0:sbackc(divr));
if(magic>0){
    c = (c*100 + (sfbeg(divr)?0:sbackc(divr)))*2;
    c /= 25;              /* magic補正: 実効除数を調整 */
}
```

`magic` 変数——小さい最上位桁（10未満）では推定商が不正確になるため、3バイト分を使って補正する。「magic」という命名が正直だ。

---

## [文字列]とx——マクロ実行でチューリング完全

dc が単なる電卓ではない理由がここにある。

```c
case '[':
    n = 0;
    p = salloc(0);
    while(1){
        if((c = readc()) == ']'){
            if(n == 0) break;
            n--;            /* 入れ子の ] は対応する [ まで */
        }
        sputc(p,c);
        if(c == '[') n++;   /* 入れ子の [ をカウント */
    }
    pushp(p);               /* 文字列をスタックに積む */
    continue;
```

`[dc命令列]` で任意の文字列をスタックに積める。`x` はスタックトップをポップして、それをdcプログラムとして実行する。

```c
case 'x':
execute:
    p = pop();
    EMPTY;
    /* ... readptrを保存してマクロを実行 ... */
    *readptr = p;
    if(p != 0) rewind(p);
    continue;
```

さらに条件付き実行がある。

```c
case '<':
case '>':
case '=':
    if(cond(c) == 1) goto execute;  /* 条件が真ならマクロ実行 */
    continue;
```

`!` を前置すると否定条件になる。`q` はマクロから戻り、`Q n` は n レベル戻る。`readstk[100]` が最大100段のコールスタックだ。

これで**ループと条件分岐と再帰**が実現できる。dcはチューリング完全な言語だ。1969年に。

フィボナッチ数列をdcで書ける：
```
[lnp [lax] sx la1-sa lb la+sb lx] sx
0 sa 1 sb lx
```

---

## stable[256]——256個のレジスタ、各々がスタック

```c
struct sym {
    struct sym *next;
    struct blk *val;
} symlst[TBLSZ];      /* TBLSZ = 256 */
struct sym *stable[TBLSZ];
```

ASCII 256文字それぞれがレジスタになる。`sa` はスタックトップを変数 `a` に保存、`la` は変数 `a` を読み込む。`Sa`/`La` はレジスタをスタックとして使う（push/pop）。

配列もある。`;a` と `:a` でレジスタ `a` を配列として使う。インデックスはスタックから取る。

---

## 大文字Y——隠れたデバッグコマンド

```c
case 'Y':
    sdump("stk",*stkptr);
    printf("all %ld rel %ld headmor %ld\n",all,rel,headmor);
    printf("nbytes %ld\n",nbytes);
    continue;
```

`Y`（大文字）はドキュメントに載っていない。スタックの内容と、確保したメモリ総量（`all`）、解放したメモリ量（`rel`）、ヒープ拡張回数（`headmor`）、現在のバイト数（`nbytes`）を出力する。

1969年のメモリデバッガが、コマンドとして今も残っている。

---

## bcはdcのコンパイラ

`bc.y`（1975年、Lorinda Cherry）はyacc文法ファイル1枚だ。bcの式を構文解析して、dcのコマンド列に変換し、dcプロセスに渡す。

```
bc: "2 + 3"
  ↓  yacc文法が変換
dc: "2 3 + p"
```

bcには演算実装がない。四則演算も、平方根も、すべてdcが処理する。bcは**dcへのコンパイラ**だ。

1969年のRPN電卓の上に、1975年に中置記法の皮をかぶせた。50年前の2層アーキテクチャが今も動いている。

---

## 鑑定

```
ファイル     : usr/src/cmd/dc/dc.c（1940行）+ dc.h（220行）
言語         : C
誕生         : 1969年、AT&T Bell Labs
設計者       : Robert Morris
演算方式     : 逆ポーランド記法（RPN）、base-100任意精度
マクロ       : [文字列]とxでチューリング完全
継承         : bcのバックエンド（1975〜）、現代Linuxにも同梱
```

`bc` の裏に `dc` がある。`dc` の演算は `struct blk` のbase-100バイト列が担う。`magic` 変数が補正する除算。`[...]` と `x` がプログラムを作る。`stable[256]` が256個のレジスタを提供する。

1969年に書かれ、2024年の Linux にも同梱されている。`echo "2 3 + p" | dc` は今日も動く。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
