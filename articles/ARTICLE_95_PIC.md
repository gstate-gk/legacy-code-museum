# `of the way between`——英語を食べる図形言語、Kernighanが書いたFOR/IF付きDSL、4,624行

**Bell Labs, 1984年。Cとlex/yaccで書かれた図形記述プリプロセッサ。**

---

## はじめに

```
.PS
box "Input"
arrow
circle "Process"
arrow
box "Output"
.PE
```

これがpicの入力だ。座標は一切書かない。`box; arrow; circle` と並べるだけで、左から右に自動的に配置される。

picは「図形の座標を計算する言語」ではなく「**図形の関係を記述する言語**」だ。

---

## 作者——Brian Kernighan

**Brian W. Kernighan**——AWK（#063）、m4（#077）、eqn（#081）を書いた。tblのMike Leskとともにdocument processing パイプラインを構築してきた人物。1984年にpicを書いた。

このバージョンのsccsidには `@(#)main.c 3.1 (CWI) 85/07/30`——CWI（Centrum Wiskunde & Informatica、アムステルダム）が1985年に移植したバージョンだ。

---

## `.PS` から `.PE` の間だけ生きる

```c
while (fgets(buf, sizeof buf, curfile->fin) != NULL) {
    if (*buf == '.' && *(buf+1) == 'P' && *(buf+2) == 'S') {
        reset();
        yyparse();
        ...
        print();
    } else
        fputs(buf, stdout);
}
```

`main.c`。tbl（#083）と同じ哲学——`.PS`（Picture Start）を見つけるまで素通し、`.PE`（Picture End）で終了。

`pic | tbl | eqn | troff` のパイプラインで、picが最上流に座る。

---

## `of the way between`——英語を食べる

`picl.l`（lex）の3行に目を疑う：

```
<A>of     ;
<A>the    ;
<A>way    ;
```

`of`、`the`、`way` はすべて**無視される**。何も返さない。

これが意味することは——

```
0.3 of the way between A and B
```

は文法的に有効なpicのコードだ。`0.3 between A and B` と等価で、AからBへ30%の位置座標を返す。Kernighanは意図的に英語の自然な文体で書けるよう設計した。

---

## 314行のyacc文法——全部で何が書けるか

`picy.y`、314行。プリミティブから始まる：

```yacc
%token BOX LINE ARROW CIRCLE ELLIPSE ARC SPLINE BLOCK TEXT TROFF MOVE
```

位置の指定：

```yacc
position:
  | expr ',' expr                      /* 座標直接指定 */
  | PLACENAME CORNER                   /* A.NE, A.SW など */
  | expr BETWEEN position AND position /* 0.3 between A and B */
  | '(' place ',' place ')'           /* xをAから、yをBから */
```

数式：

```yacc
expr:
  | LOG '(' expr ')'     { $$ = Log10($3); }
  | SIN '(' expr ')'     { $$ = sin($3); }
  | COS '(' expr ')'     { $$ = cos($3); }
  | ATAN2 '(' expr ',' expr ')' { $$ = atan2($3, $5); }
  | SQRT '(' expr ')'    { $$ = Sqrt($3); }
  | RAND '(' ')'         { $$ = (float)rand() / 32767.0; }
  | MAX '(' expr ',' expr ')' { $$ = $3 >= $5 ? $3 : $5; }
```

図形記述言語の中に、sin/cos/atan2/sqrt/rand まで組み込まれている。

---

## `hvmode = R_DIR`——自動流動配置

```c
int hvmode = R_DIR;  /* R => join left to right */
```

`main.c`。すべての図形は「今どちら向きに流れているか」という状態を持つ。デフォルトは右向き（`R_DIR`）。

```
box; arrow; box
```

を書くと、各オブジェクトは前のオブジェクトの右端から自動的に配置される。`boxgen.c`：

```c
if (isright(hvmode))
    curx = x1;  /* 右端に進む */
else if (isup(hvmode))
    cury = y1;  /* 上端に進む */
```

`right`, `left`, `up`, `down` で方向を変えられる。

---

## NORTH/SOUTH/EAST/WEST——8方位の接続点

```c
case NORTH: ywith = -h / 2; break;
case SOUTH: ywith = h / 2;  break;
case EAST:  xwith = -w / 2; break;
case WEST:  xwith = w / 2;  break;
case NE:    xwith = -w / 2; ywith = -h / 2; break;
```

`boxgen.c`。すべての図形は8方位（N, S, E, W, NE, NW, SE, SW）と中心（`center`）の接続点を持つ。

```
line from A.NE to B.SW
```

「Aの北東からBの南西へ線を引く」——名前だけで接続点が決まる。

---

## FOR/IF——ただの図形言語ではない

`for.c`（100行）：

```c
typedef struct {
    char *var;    /* インデックス変数 */
    float to;     /* 上限 */
    float by;
    int op;       /* +, *, etc. */
    char *str;    /* 繰り返すコード文字列 */
} For;

For forstk[10];  /* スタック深さ10 */
```

```
for i from 1 to 5 do {
    box ht 0.2*i wid 0.3*i
    move
}
```

これで5種類のサイズのボックスが並ぶ。picはただの図形記述フォーマットではなく、**プログラミング言語**だ。FOR/IF/変数/算術——すべて備えている。

---

## `defaults[]`——名前付きデフォルト値

```c
static struct {
    char *name;
    float val;
    short scalable;  /* 1 => scaleが変わると比例変更 */
} defaults[] = {
    "scale",     SCALE, 1,
    "lineht",    HT,   1,
    "boxht",     HT,   1,
    "boxwid",    WID,  1,
    "circlerad", HT2,  1,
    "arrowht",   HT5,  1,
    "arrowwid",  HT10, 1,
    NULL, 0
};
```

`scale` を変えると `scalable=1` のすべての変数が比例変化する。`scale = 2` で図全体が2倍に拡大される。

---

## `DEVCAT`——あのCATが再び

```c
} else if (strcmp(&argv[1][2], "cat") == 0) {
    res = 432;
    devtype = DEVCAT;
}
```

`driver.c`。出力デバイスとして DEVCAT（res=432）が選べる。troff（#082）の `INCH=432` と同じ解像度——CAT写植機だ。

他にも DEV202（Mergenthaler 202, res=972）、DEVAPS（APS-5, res=723）、DEVHAR（Harris, res=1445）が選択肢にある。picはtroffと同じ物理世界で生きている。

---

## 鑑定

```
初版       : 1984年（Brian W. Kernighan、Bell Telephone Laboratories）
このバージョン: 1985年（CWI Amsterdam 移植版、v3.1）
実装       : C + lex + yacc（20ファイル、4,624行）
フィルター  : .PS〜.PE間を処理、それ以外は素通し
プリミティブ: BOX LINE ARROW CIRCLE ELLIPSE ARC SPLINE BLOCK TEXT MOVE
自然言語   : of/the/way を無視（"1/3 of the way between" が有効）
位置指定   : 8方位接続点（NE/NW/SE/SW/N/S/E/W）+ BETWEEN...AND
制御構造   : FOR ループ（forstk深さ10）、IF/ELSE、変数、sin/cos/atan2/sqrt
自動配置   : hvmode（R/U/L/D_DIR）で流動配置、座標なしで図形を並べられる
デフォルト  : defaults[]配列、scale変更で全サイズ比例変化
デバイス   : DEVCAT(432)、DEV202(972)、DEVAPS(723)、DEVHAR(1445)
後継       : GNU groff pic、GNU pic（gpic）→ 現在もmanページの図に使用
```

**`of the way between` を食べる言語——Kernighanは英語で書けるDSLを設計し、FOR/IF/sin/cosまで詰め込んだ。座標を書かずに図形が語り合う。**
