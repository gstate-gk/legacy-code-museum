# `#define INCH 432`——CAT写植機に話しかける言語、Joe OssannaとKernighanが継いだ8,224行

**Bell Labs, 1973〜1979年。Cで書かれた組版システム。**

---

## はじめに

```c
#ifdef NROFF
#define INCH 240   /* nroff: 端末・ラインプリンタ */
#else
#define INCH 432   /* troff: CAT写植機 */
#endif
```

この1行の分岐が、`troff` のすべてを決めている。

`INCH=432`——1インチを432単位に分割する座標系。それはGraphic Systems CAT写植機の物理的な精度だ。ガラスのドラムに刻まれた活字が1/432インチ単位で動く。`troff` はその機械の言語を話す。

`INCH=240`——端末の画面やラインプリンタ向け、それが `nroff`。同じソースコードから、`#ifdef NROFF` の1フラグで2つの全く異なるフォーマッターが生まれる。

Bell Labs の `troff` は、組版の世界にUnixの哲学を持ち込んだ道具だ。

---

## 作者——Ossannaの死とKernighanの継承

**Joe Ossanna**——`troff` の原作者。1964年にMITで `RUNOFF`（Douglas McIlroyのアイデアから）、それが `roff` → `nroff` → `troff` へと進化した。1973年にBell Labs CAT写植機への出力を実装し、Bell Labs Technical Memoに論文を書いた。

1977年、Ossannaは突然亡くなった。

**Brian W. Kernighan**——Kは「AWK」のK（#063）。eqnを書いた（#081）。m4を書いた（#077）。Ossanna没後、`troff` のソースコードを継承し、**ゼロから書き直した**。

Bell-32V（1979年）に収録されているのは、Kernighanによる完全書き直し版だ。Ossannaが遺したものを、Kernighanが21ファイル・8,224行のCコードとして再実装した。

---

## `/dev/cat`——機械の名前

```c
char ptname[] = "/dev/cat";
```

`t10.c`（CAT インターフェース）の冒頭、`ptname` はCAT写植機のデバイスファイル名だ。`troff` の出力は `/dev/cat` に流れる。

CAT（Graphic Systems Computer Aided Typesetter）——ガラスのドラムに活字が刻まれ、ストロボで感光紙に焼き付ける。横方向に1/432インチ単位で動き、縦方向に進み、文字を一つずつ照射する。

`T_INIT`（0100）で機械を初期化し、`T_IESC`（16）でエスケープシーケンスを送る。トナーではなく光、電子ではなく回転するガラス——1979年の「プリンター」はそういう機械だった。

---

## `pstab`——機械が定義した言語

```c
char pstab[] = {6,7,8,9,10,11,12,14,16,18,20,22,24,28,36,0};
```

有効なポイントサイズの一覧だ。6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36。15種類だけ。

13ポイントは存在しない。25ポイントも存在しない。なぜか——CAT写植機のフィルムストリップには、この15サイズの活字しか刻まれていないからだ。機械の物理的制約が言語の仕様を決めた。

`.ps 13`（13ポイント指定）をtroffに渡すと、最も近い12か14に丸められる：

```c
for(j=0; i > (k = pstab[j]);j++)if(!k){k=pstab[--j];break;}
```

---

## `fontlab`——4本のレール

```c
char fontfile[] = "/usr/lib/font/ftXX";
int fontlab[] = {'R','I','B','S',0};
```

CATには4本のフォントレールがあった。各レールに1つのフォントフィルムを装着する。通常は R（Roman）、I（Italic）、B（Bold）、S（Special）の4種類。

`.ft R` でローマン体に切り替え、`.ft B` でボールド、`.ft I` でイタリック。`\f1`, `\f2`, `\f3`, `\f4` でも同じ。

`/usr/lib/font/ftXX` のXXにフォント名が入る——`ftR`、`ftI`、`ftB`。これがtroffの文字幅テーブルのパス。フォントメトリクスはバイナリファイルとして配布された。

---

## `contab[]`——80の2文字命令

```c
struct contab {
    int rq;
    int (*f)();
} contab[NM] = {
    PAIR('d','s'), caseds,
    PAIR('a','s'), caseas,
    PAIR('s','p'), casesp,
    PAIR('f','t'), caseft,
    PAIR('p','s'), caseps,
    PAIR('v','s'), casevs,
    PAIR('i','f'), caseif,
    PAIR('d','e'), casede,
    PAIR('d','i'), casedi,
    PAIR('w','h'), casewh,
    /* ... 計約80エントリ ... */
};
```

`ni.c` に展開されたこの配列が、troffのすべての「リクエスト」だ。

`.ds`（文字列定義）、`.de`（マクロ定義）、`.if`（条件分岐）、`.sp`（垂直スペース）、`.ft`（フォント変更）、`.ps`（ポイントサイズ）——2文字の命令が `PAIR()` マクロで1つのintに圧縮され、対応する関数ポインタと並ぶ。

`PAIR(a,b)` は `(a<<8)|b`。2文字を1つの整数に詰め込む1970年代のハッシュ。

---

## 三段階の分節アルゴリズム

```c
hyoff = 2;
if (!exword() && !suffix())
    digram();
```

`n8.c` の `hyphen()` 関数、3つの戦略を順に試す。

1. **例外辞書**（`exword()`）——`.hw` リクエストで登録された単語の分節位置
2. **接尾辞ルール**（`suffix()`）——`suftab.c`（606行）の接尾辞パターンマッチング
3. **二字組確率**（`digram()`）——`hytab.c`（123行）の統計テーブル

`hytab.c` の核心：

```c
#define THRESH 160  /* digram goodness threshold */
char hxx[26][13] = {
    0006,0042,0041,0123,0021,0024,0063, ...
    /* 26文字 × 13パターン = 英語分節の統計 */
};
```

26×13の8進数テーブル——英語の文字対（二字組）の出現頻度から分節点を予測する。Knuthの `TeX`（1984年）の分節アルゴリズムより5年早い、Bell Labsの統計的NLPだ。

---

## `#ifdef NROFF` が二つの世界を作る

```c
#ifndef NROFF  /*TROFF専用*/
#define INCH 432
#define SPS 20       /* 10ptでのスペースサイズ */
#define VERT 3       /* 垂直単位 = 1/144インチ */
#define HOR 1
#define PO 416       /* ページオフセット 26/27インチ */
#define LG 1         /* リガチャ有効 */
#define ASCII 0
#endif

#ifdef NROFF  /*NROFF専用*/
#define INCH 240
#define HOR t.Hor    /* 端末依存 */
#define VERT t.Vert
#define PO 0
#define LG 0         /* リガチャなし */
#define ASCII 1
#endif
```

`Makefile` には `Maketroff`（`-DNROFF` なし）と `Makenroff`（`-DNROFF`）の2つが別ファイルで存在する。同じ8,224行から2つのバイナリが生まれる。

`VERT=3`——1垂直単位は1/144インチ。行間 `VS=INCH/6=72`（12ポイント=1/6インチ）が72単位になる。`VERT(n) = ((n+1)/3)*3` でも3の倍数に揃える（eqn #081と同じロジック）。

---

## パイプラインの完成

```sh
pic | tbl | eqn | troff | lpr
```

troffは鎖の最終段（出力前）だ。pic（#未）、tbl（#未）、eqn（#081）が前処理し、troffが最終組版する。

各ツールは「自分の担当部分だけを処理して残りを通す」——フィルターの哲学。troffはこの哲学の最下流に座り、CAT写植機に向けてT_INITを送る。

TeX（1984年）より5年前。LaserJet（1984年）より5年前。Bell Labsの科学技術論文は、この道具で印刷された。

---

## 鑑定

```
初版       : 1973年（Joe Ossanna、Bell Telephone Laboratories）
継承・再実装: 1979年（Brian W. Kernighan、Ossanna没後）
実装       : C（21ファイル、8,224行）
出力先     : /dev/cat（Graphic Systems CAT写植機）または端末
座標系     : INCH=432（troff）/ INCH=240（nroff）— 1/432インチ単位
フォント   : R/I/B/S 4本レール（fontlab[] = {'R','I','B','S',0}）
点活字     : pstab[] — 15種類のみ（機械の物理制約が言語仕様を決定）
命令体系   : contab[] — 約80の2文字リクエスト（PAIR()マクロで1整数に圧縮）
分節       : 例外辞書 → 接尾辞ルール → 二字組統計（Knuth TeX の5年前）
#ifdef     : NROFF フラグ1つで nroff/troff の2バイナリを同一ソースから生成
後継       : groff（GNU、1990年〜）→ 現在もLinuxのmanページ生成に使用
```

**OssannaはroffをCATに接続し、Kernighanはそれを8,224行のCで書き直した。2人のコードは今もgroffとして動いている。**
