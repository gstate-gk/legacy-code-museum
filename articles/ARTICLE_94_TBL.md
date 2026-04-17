# `l c r n`——Mike Leskの4文字が表を定義し、tblがtroff呪文を生成する2,391行

**Bell Labs, 1975〜1976年。Cで書かれた表組版プリプロセッサ。**

---

## はじめに

```
.TS
box;
l c r n
.
Name    Age   City   Score
Alice   28    NY     98.5
Bob     34    LA     72.0
.TE
```

この6行が、tblへの入力だ。`l`（左揃え）、`c`（中央）、`r`（右揃え）、`n`（小数点揃え）——4文字が列の体裁をすべて決める。

tblはこれを読んで、troffのソースコードを出力する。表を「描く」のではなく、troffに表を描かせるコードを「生成する」。

**tbl はtroff-to-troffトランスレータだ。**

---

## 作者——Mike Lesk

**Mike Lesk**——Bell Labsのプログラマー。`lex`（#073, Eric Schmidt作）よりも前に字句解析器の先駆を書き、`uucp`（Unix間ファイル転送）を実装した人物。tblは1975〜1976年の作品だ。

Brian Kernighanとは異なる方向で、Bell Labsのドキュメント処理パイプラインを支えた。

---

## `.TS` から `.TE` の間だけ生きる

```c
while (gets1(line))
    {
    fprintf(tabout, "%s\n", line);
    if (prefix(".TS", line))
        tableput();
    }
```

`t1.c`、tblのメインループ。入力を1行ずつ読み、`.TS`（Table Start）に出会うまでそのまま流す。`.TS`を見つけたとき、`tableput()` が起動する。`.TE`（Table End）に達するまで処理し、以降はまた素通し。

tblは`.TS`と`.TE`の間だけ目覚める。それ以外の行は一切手をつけない——フィルターの哲学の完全な実現だ。

---

## 16ステップのパイプライン

```c
tableput()
{
saveline();   savefill();  ifdivert();  cleanfc();
getcomm();    getspec();   gettbl();    getstop();
checkuse();   choochar();  maktab();    runout();
release();    rstofill();  endoff();    restline();
}
```

`t2.c` の `tableput()`——16の関数が順番に走る。

- `getcomm()` — テーブル全体オプション（box、allbox、expand...）
- `getspec()` — 列フォーマット仕様（`l c r n`の解析）
- `gettbl()` — データの読み込み
- `getstop()` — 列幅・タブ位置の計算
- `maktab()` — 列幅をtroffの `.nr` レジスタとして出力
- `runout()` — 各行のtroffコードを出力

入力解析から出力生成まで、各ステップが独立した関数に収まる。

---

## 列フォーマット言語——`l c r n a s ^ - =`

`t4.c`、フォーマット仕様の解析。1文字が1つの意味を持つ：

| 文字 | 意味 |
|------|------|
| `l` | 左揃え（left） |
| `c` | 中央揃え（center） |
| `r` | 右揃え（right） |
| `n` | 数値（小数点揃え） |
| `a` | 英字サブ列 |
| `s` | 前の列にスパン（span） |
| `^` | 上の行にスパン（縦スパン） |
| `-` | 横線 |
| `=` | 二重横線 |

修飾子も1文字：`b`（ボールド）、`i`（イタリック）、`f X`（フォントX）、`p N`（ポイントサイズN）、`e`（幅を揃える）。

データ行で `_` 一文字だけの行は単線、`=` 一文字だけなら二重線。

---

## `n` 型——小数点揃えの仕組み

```c
if (ba==0)
    {
    for (dpoint=0; *str; str++)
        if (*str=='.' && !ineqn(str,p) &&
            (str>p && digit(*(str-1)) ||
            digit(*(str+1))))
                dpoint=str;
    }
```

`tm.c`、`maknew()` 関数。`n`（数値）型の列は、セルを小数点の左右2つのサブ列に分割する。`98.5` なら `98` と `.5` に分けて別々に右揃え／左揃えし、整列を実現する。

`\\&`（ゼロ幅位置合わせ文字）を使えば手動で揃え位置を指定できる。

---

## `ineqn()`——tblはeqnを知っている

```c
ineqn (s, p)
    char *s, *p;
{
int ineq = 0, c;
while (c = *p)
    {
    if (s == p) return(ineq);
    p++;
    if ((ineq == 0) && (c == delim1)) ineq = 1;
    else if ((ineq == 1) && (c == delim2)) ineq = 0;
    }
return(0);
}
```

`tm.c`。小数点を探すとき、その文字がeqn式の内側にあるかどうかを確認する。

テーブル先頭の `delim($, $)` オプション（t3.c）でeqnの区切り文字を設定すると、`$x.y$` という数式中の `.` を小数点と誤認しない。

`pic | tbl | eqn | troff` のパイプラインで、tblとeqnは互いを意識して設計されている。上流のtblが下流のeqnの構文を知っている——1970年代の「疎結合」だ。

---

## `texname`——26文字のレジスタ割り当て

```c
int texname = 'a';
char texstr[] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWYXZ0123456789";
```

`T{...T}` で囲まれた長テキストブロック（複数行のセル）は、troffのダイバージョンとして格納される。そのダイバージョン名に `texname` の文字を割り当てる——`a`, `b`, `c`... と順に使う。

1つのテーブルに使えるテキストブロックは最大62個（26小文字 + 26大文字 + 10数字）。名前衝突を避けるための26+26+10文字の名前空間。

---

## troff呪文の生成——drawline()

```c
drawline(i, cl, cr, lintype, noheight, shortl)
{
    if (!nodata)
        fprintf(tabout, "\\v'-.5m'");
    for(ln=oldpos=0; ln<lcount; ln++)
        {
        linpos = 2*ln - lcount +1;
        if (linpos != oldpos)
            fprintf(tabout, "\\v'%dp'", linpos-oldpos);
        ...
        fprintf(tabout, "\\l'...\\(ul'");
        }
}
```

`tu.c`、横線の描画。tblは「線を引く」のではなく、troffの `\v`（垂直移動）と `\l`（線）命令を生成する。単線なら1本、二重線なら2本の `\l` を `\v` でずらして出力する。

`tv.c` の `drawvert()` は縦線。やはり `\h`（水平移動）と `\v` で位置を調整しながら罫線を描く。

すべての表組版は、最終的にtroffの `\v`, `\h`, `\l`, `.nr`, `.ds` の羅列に変換される。

---

## `#ifdef gcos`——GEのメインフレームにも対応

```c
# ifdef gcos
if(!intss()) tabout = fopen("qq", "w");
# define MACROS "cc/troff/smac"
# endif
# ifdef unix
# define MACROS "/usr/lib/tmac.s"
# endif
```

`t1.c`。tblは最初からUnixとGCOS（General Electric Comprehensive Operating System）の両方をサポートしていた。Bell Labsの多くのツールがそうであるように、Unixだけを想定していない。

---

## 鑑定

```
初版       : 1975〜1976年（Mike Lesk、Bell Telephone Laboratories）
実装       : C（22ファイル、2,391行）
動作方式   : .TS〜.TE間を処理し、残りはすべて素通し（フィルター）
列形式     : l c r n a s ^ - = の1文字言語
n型列      : ineqn()でeqn式を避けながら小数点で分割し2サブ列に整列
テキストブロック: T{...T}で複数行セル、texnameで26+26+10文字のレジスタ名割り当て
eqn連携    : delim オプション経由でeqnの区切り文字を受け取り、ineqn()で回避
tableput() : saveline→getcomm→getspec→gettbl→maktab→runout の16ステップ
出力       : troffソースコード（\v, \h, \l, .nr, .ds の生成）
OS対応     : #ifdef unix / #ifdef gcos で両OS対応
後継       : GNU tbl（groff付属）→ 現在もmanページの表に使用
```

**tblは表を描かない——troffに表を描かせるコードを生成する。Leskの2,391行は、1文字の列指定をtroff呪文の連鎖に変換する翻訳機だ。**
