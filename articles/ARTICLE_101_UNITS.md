# `dollar *f*`——次元の一つがドル、1978年11月10日のWSJ相場と10次元ベクトルが全ての単位を表現する

## はじめに

`/usr/lib/units` の先頭にこういう定義がある。

```
/ dimensions
m			*a*
kg			*b*
sec			*c*
coul			*d*
candela			*e*
dollar			*f*
radian			*g*
bit			*h*
erlang			*i*
degC			*j*
```

**`dollar *f*`**——ドルが物理の次元だ。

SI（国際単位系）の7基底次元はメートル・キログラム・秒・アンペア・ケルビン・モル・カンデラ。Bell Labsの `units` はそれを10次元に拡張し、`dollar`（経済）、`bit`（情報量）、`erlang`（通信トラフィック）を物理と同列に置いた。465行のCプログラムが、ドルとビットと光子を同じ次元空間の中で扱う。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

```
units.c     — 465行（実装本体）
/usr/lib/units — 単位データベース（外部テキストファイル）
  次元定義（10次元）
  定数（光速、重力加速度、電子電荷...）
  各種単位（SI/ヤード・ポンド法/米国慣用/英国慣用）
  通貨（Nov 10, 1978 WSJレート）
```

---

## 10次元——Bell Labsが選んだ物理の基盤

SIの7基底次元ではなく、Bell Labsは10次元を選んだ。

| 次元記号 | 単位 | SI対応 |
|---------|------|--------|
| `*a*` | m（メートル） | ✓ 長さ |
| `*b*` | kg（キログラム） | ✓ 質量 |
| `*c*` | sec（秒） | ✓ 時間 |
| `*d*` | coul（クーロン） | △ アンペア→クーロン（より基本的） |
| `*e*` | candela（カンデラ） | ✓ 光度 |
| `*f*` | **dollar（ドル）** | ✗ 非SI（経済） |
| `*g*` | radian（ラジアン） | △ SI補助単位 |
| `*h*` | **bit（ビット）** | ✗ 非SI（情報量） |
| `*i*` | **erlang（アーラン）** | ✗ 非SI（通信トラフィック） |
| `*j*` | degC（摂氏） | △ Kではなく°C |

SIのアンペアをクーロンに置き換え（電流より電荷が基本）、モルを削除し、ケルビンを摂氏に置き換えた。そして電話会社らしく `erlang`（電話回線の使用率を表す単位）と `bit`（Shannon情報量）と `dollar` を追加した。

これはBell Labsの学術的な視野の写し鏡だ——情報理論（Shannon）、通信工学、物理学、経済学が1つの次元空間に収まっている。

---

## struct unit——factor × dim[10]

```c
#define NDIM 10

struct unit
{
    double  factor;
    char    dim[NDIM];
};
```

全ての単位はこの構造体1つで表現される。

- `factor` — SI基底単位に対する係数
- `dim[10]` — 各次元の指数（-128〜127の整数）

たとえば `joule`（ジュール）は:
```
joule = newton × meter = (kg × m / sec²) × m = kg × m² / sec²
```
なので `factor=1.0`、`dim = {2,1,-2,0,0,0,0,0,0,0}`（m²・kg・sec⁻²）。

単位の積は dim の加算、商は減算。`m2`（平方メートル）は「mの次元ベクトルを2回加算する」——コードの `goto l1; c--;` がそれを実現する。

```c
if(c >= '2' && c <= '9') {
    c--;
    goto l1;   /* m3 → m*m*m として3回加算 */
}
```

---

## `1|180 pi-radian`——パイプが割り算

```
degree    1|180 pi-radian
circle    2 pi-radian
arcmin    1|60 arcdeg
arcsec    1|60 arcmin
```

`|` はUnixのパイプではなく割り算だ。`1|180` は 1/180。`getflt()` が `|` を検出すると再帰的に分母を読む。

```c
if(c == '|')
    return(d/getflt());
```

分数を表すためにパイプ文字を使う——Unixにどっぷり浸かったBell Labsらしい選択だ。

`year 365.24219879 day fuzz` という定義もある。「年の長さ」は定義によって変わる——この精度は平均太陽年。`fuzz` が付いている。

---

## fuzz——測定不確かさを単位として持つ

```
fuzz    1
```

`fuzz` は `factor=1.0`、次元ゼロの無次元定数だ。

```
c     2.997925+8 m/sec fuzz
e     1.6021917-19 coul fuzz
au    1.49597871+11 m fuzz
year  365.24219879 day fuzz
```

光速、電子電荷、天文単位、太陽年——精度が有限な測定値には全て `fuzz` が付く。`fuzz` は単位互換性チェックには影響しない（無次元）が、「この値は実験的測定値であり、定義値ではない」という意味論的マーカーだ。

数値の表記も独特だ。`2.997925+8` はEフォーマット（`2.997925e8`）ではなく、符号なし指数表記——`getflt()` が `+` や `-` を読んでべき指数として処理する。

---

## `/ Money epoch Nov 10, 1978 wall st j`

```
/ Money
/ epoch Nov 10, 1978 wall st j

$                dollar
argentinapeso    .0011 $
australiadollar  1.1560 $
britainpound     1.9705 $
japanyen         .005332 $
```

通貨セクションの冒頭に `epoch Nov 10, 1978 wall st j`——データの基準日が「1978年11月10日、ウォール・ストリート・ジャーナル」と記録されている。

日本円 = 0.005332ドル（1ドル≒187.6円）。ポンド = 1.9705ドル。これはBell-32V（1979年）に収録された時点での実際の為替レートだ。

`units` を使えば「1000日本円をブラジルクルゼイロに換算する」ことができた——ただし1978年11月10日のレートで。

---

## NTAB=601——素数ハッシュとh×57

```c
#define NTAB 601

struct table *
hash(name)
char *name;
{
    register struct table *tp;
    register char *np;
    register unsigned h;

    h = 0;
    np = name;
    while(*np)
        h = h*57 + *np++ - '0';
    if( ((int)h)<0) h= -(int)h;
    h %= NTAB;
    ...
}
```

NTAB=601は素数。ハッシュ関数は `h*57 + c - '0'`——57という乗数と、ASCII '0'（=48）を引くことで文字コードを0基点に正規化する。衝突はリニアプロービング（`tp++; if(tp >= &table[NTAB]) tp = table`）で解決。

601個のスロットに~400エントリが収まる——負荷率約67%のオープンアドレッシング。

---

## lookup()——接頭辞の剥がしとsの除去

未知の単位名に対して `lookup()` は2つの後退処理を試みる。

**接頭辞の剥がし**:
```c
for(i=0; cp1 = prefix[i].pname; i++) {
    /* "kilometer" → "kilo" + "meter" */
    e *= prefix[i].factor;
    name = cp2-1;
    goto loop;
}
```

`kilometer` が見つからなければ、prefix[] テーブルから `kilo`（×1000）を剥がして `meter` で再検索。これが「kilowatt」「megahertz」「nanosecond」を自動的に処理する仕組みだ。

**sの除去**:
```c
if(cp1 > name+1 && *--cp1 == 's') {
    *cp1 = 0;
    goto loop;
}
```

`meters` が見つからなければ末尾の `s` を削除して `meter` で再検索。英語の複数形を自動的に単数形に変換する——データベースに `feet` と `foot` を両方書く必要がなく、`feet` だけで足りる。

---

## signal(8, fperr)——浮動小数点例外の捕捉

```c
signal(8, fperr);

fperr()
{
    signal(8, fperr);
    fperrc++;
}
```

`8` は SIGFPE（浮動小数点例外）のシグナル番号。ゼロ除算やオーバーフローが起きたとき、プログラムをクラッシュさせずに `fperrc` フラグを立てて継続する。

```
printf("underflow or overflow\n");
```

`units` は浮動小数点演算のエラーを「graceful degradation」で処理する——1979年に例外処理機構がない中での実用的な解だ。

---

## 鑑定

```
初版       : Bell-32V Unix（1979年）
実装       : C（465行）
次元空間   : NDIM=10（m/kg/sec/coul/candela/dollar/radian/bit/erlang/degC）
データ表現 : struct unit { double factor; char dim[NDIM]; }
データベース: /usr/lib/units（外部テキストファイル、~400エントリ）
ハッシュ   : NTAB=601（素数）、h*57 + c - '0'、リニアプロービング
接頭辞     : atto〜tera（1e-18〜1e12）、lookup()で自動剥がし
複数形対応 : 末尾のsを除去して再検索
fuzz       : 測定不確かさマーカー（光速・電子電荷・天文単位・太陽年に付与）
1|180      : パイプ文字が分数（getflt()で再帰処理）
通貨       : epoch Nov 10, 1978 WSJ相場（28通貨収録）
後継       : GNU units（現在も開発中）
```

**`dollar *f*`——ドルがメートルと同じ次元空間にある。**

物理と情報と通信と経済を1つの10次元空間に収めたBell Labsの世界観が、465行のCと400行のデータファイルに刻まれている。1978年11月10日のWSJ相場は凍りついたまま、`you have: / you want: ` というプロンプトが今も待っている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
