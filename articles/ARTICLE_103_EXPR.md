# `"0"` と `""` が偽——すべてが文字列の算術評価器、`$((...))` 以前のシェルスクリプト計算機と `case LEQ: i = i>=0` のバグ

## はじめに

`expr.y` の中核にこういう関数がある。

```c
char *arith(op, r1, r2) char *r1, *r2; {
    long i1, i2;
    i1 = atol(r1);
    i2 = atol(r2);
    switch(op) {
    case ADD: i1 = i1 + i2; break;
    ...
    }
    rv = malloc(16);
    sprintf(rv, "%D", i1);
    return rv;
}
```

引数は `char *`（文字列）、`atol()` で数値に変換して計算し、`sprintf()` で文字列に戻す。**exprに数値型は存在しない**——全ての値は文字列だ。

Bell Labsが1979年に実装した `expr` は、Bourne Shell（#064）のスクリプトで唯一の算術手段だった。`$((...))` が登場するのは1988年のksh以降。それ以前の10年間、シェルスクリプトの計算は全て `expr` に依存していた。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C + yacc
- **年**: Bell-32V版（1979年）

```
expr.y — 669行（yacc文法 + C実装）
  yacc文法部  — 演算子優先順位と文法規則
  yylex()     — コマンドライン引数をトークンに変換
  arith()     — 算術演算（文字列→整数→文字列）
  rel()       — 比較演算（数値または文字列）
  conj()      — 論理演算（OR/AND）
  substr()    — 部分文字列
  length()    — 文字列長
  index()     — 文字位置検索
  match()     — 正規表現マッチ
  ematch()    / compile() / step() / advance() — 内蔵正規表現エンジン
```

---

## コマンドライン引数がトークン

exprの字句解析器は特殊だ。標準入力を読まず、**コマンドライン引数の配列を直接トークンとして消費する**。

```c
char **Av;
int Ac, Argi;

yylex() {
    if(Argi >= Ac) return NOARG;  /* 引数が尽きたら NOARG */
    p = Av[Argi++];               /* 次の引数を取得 */
    if(*p == '(' || *p == ')')
        return (int)*p;
    for(i = 0; *operators[i]; ++i)
        if(EQL(operators[i], p))
            return op[i];         /* 演算子を認識 */
    yylval = p;
    return A_STRING;              /* それ以外は文字列 */
}
```

`expr 2 + 3` を実行すると、`Av = {"expr", "2", "+", "3"}` の配列を `Argi=1` から順に読む。`"2"` → A_STRING、`"+"` → ADD、`"3"` → A_STRING、引数終了 → NOARG。

yacc文法の最上位規則は `expr NOARG`——「式の後に引数終了」というパターンだ。

---

## 演算子テーブル——`=` と `==` が両方 EQ

```c
char *operators[] = { "|", "&", "+", "-", "*", "/", "%", ":",
    "=", "==", "<", "<=", ">", ">=", "!=",
    "match", "substr", "length", "index", "\0" };
int op[]  = { OR, AND, ADD,  SUBT, MULT, DIV, REM, MCH,
    EQ,  EQ,  LT, LEQ, GT,  GEQ,  NEQ,
    MATCH, SUBSTR, LENGTH, INDEX };
```

`"="` も `"=="` も同じ `EQ` に対応する。`expr 1 = 1` と `expr 1 == 1` は等価だ。

演算子テーブルは文字列テーブルと整数コードテーブルの2つの配列で実装されている。yylex()はこのテーブルを線形探索する——ハッシュも二分探索もなし。演算子は19個なので線形探索で十分だ。

---

## `"0"` と `""` が偽——シェル的真偽値

```c
expression: expr NOARG = {
    printf("%s\n", $1);
    exit((!strcmp($1,"0") || !strcmp($1,"\0")) ? 1 : 0);
}
```

exprの終了コードはシェルの真偽値規約に従う。

- 結果が `"0"` または空文字列 `""` → **偽**（終了コード1）
- それ以外 → **真**（終了コード0）

C言語の `0=false` と逆の、シェルの `0=success=true` 規約だ。シェルスクリプトで `if expr ...` と書けるのはこの設計があるから。

---

## 数値検出——`-*[0-9]*$` の正規表現

比較演算 `rel()` は数値比較か文字列比較かを動的に判断する。

```c
char *rel(op, r1, r2) register char *r1, *r2; {
    register i;
    if(ematch(r1, "-*[0-9]*$") && ematch(r2, "[0-9]*$"))
        i = atol(r1) - atol(r2);  /* 数値比較 */
    else
        i = strcmp(r1, r2);       /* 文字列比較 */
    ...
}
```

`r1` が `-*[0-9]*$`（符号付き整数）、`r2` が `[0-9]*$` にマッチすれば数値として `atol()` で比較、そうでなければ `strcmp()` で文字列比較する。型宣言なしで実行時に判断する——動的型付けを正規表現で実装した。

---

## `case LEQ: i = i>=0` ——1979年のバグ

`rel()` の switch文に目を凝らすと奇妙な行がある。

```c
switch(op) {
case EQ:  i = i==0; break;
case GT:  i = i>0;  break;
case GEQ: i = i>=0; break;
case LT:  i = i<0;  break;
case LEQ: i = i>=0; break;  /* ← バグ: GEQ と同じ！ */
case NEQ: i = i!=0; break;
}
```

`LEQ`（以下）の条件が `i>=0`——これは `GEQ`（以上）と全く同じだ。正しくは `i<=0` であるべきところ、コピーミスで `>=` になっている。

`expr 3 \<= 5` が `1`（真）を返すはずなのに `0`（偽）を返す。Bell Labs 1979年のオリジナルコードに実在するバグだ。

---

## `:` 演算子——正規表現マッチカウント

`expr` の `:` 演算子はシェルスクリプトの定番イディオムだ。

```sh
count=`expr "$string" : '[0-9]*'`
```

左辺文字列に右辺正規表現をマッチさせ、マッチした文字数を返す。パターンに `\(` `\)` グループがある場合はグループマッチの内容を返す。

```c
char *match(s, p) {
    sprintf(rv = malloc(8), "%d", ematch(s, p));  /* マッチ文字数 */
    if(nbra) {  /* グループマッチがあれば */
        rv = malloc(strlen(Mstring[0])+1);
        strcpy(rv, Mstring[0]);                    /* グループ内容 */
    }
    return rv;
}
```

`$(...)` や `${#var}` がない時代、`:` 演算子が文字列操作の要だった。

---

## substr()——引数を破壊する実装

```c
char *substr(v, s, w) char *v, *s, *w; {
    si = atol(s);
    wi = atol(w);
    while(--si) if(*v) ++v;   /* 開始位置まで進む */
    res = v;
    while(wi--) if(*v) ++v;   /* 長さ分進む */
    *v = '\0';                  /* ← 元の文字列を破壊！ */
    return res;
}
```

`substr()` は元の引数文字列に直接 `'\0'` を書き込んで部分文字列を返す。コマンドライン引数の文字列を破壊的に変更している——コマンドライン引数を直接使い回す設計の帰結だ。

---

## 内蔵正規表現エンジン

exprは正規表現エンジンを内部に持つ。`compile()` / `step()` / `advance()` の3関数で構成され、ed（#067）・grep（#065）・sed（#069）と同じ正規表現エンジンを `#define INIT/GETC/PEEKC/UNGETC/RETURN/ERROR` マクロで差し替えてコピーしている。

```c
#define INIT        register char *sp = instring;
#define GETC()      (*sp++)
#define PEEKC()     (*sp)
#define UNGETC(c)   (--sp)
#define RETURN(c)   return
#define ERROR(c)    errxx(c)
```

同じ正規表現エンジンが、ed・grep・sed・exprに存在する。Bell Labs内でコピーペーストが行われ、微妙に異なるマクロで接続されている——1979年の「ライブラリ」のあり方だ。

---

## `$((...))` 以前の世界

exprが現役だった時代のシェルスクリプト:

```sh
# ループカウンタのインクリメント
i=`expr $i + 1`

# 文字列長の取得
len=`expr "$str" : '.*'`

# 条件分岐
if expr $x \> $y; then ...

# 切り上げ除算
ceil=`expr \( $n + $d - 1 \) / $d`
```

`$()` すらなく、バッククォートで `expr` の出力を受け取る。全ての引数はスペースで区切られた文字列として渡す——演算子もシェルにとって特殊文字なので、`\*`、`\<`、`\>` のようにエスケープが必要だ。

Bourne Shell（#064）が1979年に登場し、`$((...))` がksh（1988年）で来るまでの10年間、この不便さがシェルスクリプトの現実だった。

---

## 鑑定

```
初版       : Bell-32V Unix（1979年）
実装       : C + yacc（669行）
字句解析   : コマンドライン引数を直接トークンとして消費
型システム  : 全値がchar *（文字列）、算術はatol→計算→sprintf
数値検出   : rel()が"-*[0-9]*$"正規表現で動的判断
真偽値     : "0"と""が偽（終了コード1）、それ以外が真（終了コード0）
バグ       : case LEQ: i = i>=0 ——GEQと同一（コピーミス）
:演算子    : 正規表現マッチカウント（グループ\(\)で内容抽出）
substr()   : 元の引数文字列に\0を書き込む破壊的実装
=と==      : 両方EQにマップ（等値比較は両記法OK）
正規表現   : compile/step/advance を内包（ed/grep/sedと共通ソース）
後継       : $((...)) (ksh 1988, bash 2.0) で置き換え
```

**exprは「数値型のないプログラミング言語」だ。**

全ての値は文字列として生まれ、算術の瞬間だけ整数になり、また文字列に戻る。yacc文法で演算子優先順位を定義し、正規表現で型を動的判断し、シェル規約で真偽値を定める。`$((...))` が登場するまでの10年間、669行がシェルスクリプトの計算を支えた。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
