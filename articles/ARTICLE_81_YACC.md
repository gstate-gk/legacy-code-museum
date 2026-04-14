# コンパイラを生むコンパイラ——yacc、AWK/bc/Perlを産んだメタツールの解剖

## はじめに

`bc`（1975年）はyaccで書かれている。`AWK`（1977年）もyaccで書かれている。`egrep`のパターン構文解析もyaccだ。`Perl 1.0`（1987年）も。

yaccは言語処理系を書くための言語処理系だ——**コンパイラを生むコンパイラ**。

`dspinellis/unix-history-repo` の Bell-32V ブランチに `usr/src/cmd/yacc/` がある。`y1.c`（16577バイト）、`y2.c`（18914バイト）、`y3.c`（9229バイト）、`y4.c`（6224バイト）、`dextern`（5739バイト）、`yaccpar`（3357バイト）。総計約50KB。そして `yaccnews` という歴史の記録が残っている。

---

## 発掘されたコード

- **リポジトリ**: [dspinellis/unix-history-repo](https://github.com/dspinellis/unix-history-repo)（Bell-32V-Snapshot-Development ブランチ）
- **スター数**: 7,215
- **実装言語**: C
- **設計者**: Stephen C. Johnson（Bell Telephone Laboratories）
- **初版**: 1975年

```
yacc/ — 10ファイル
  dextern   ( 200行) — 共有ヘッダ：定数、構造体定義、ループマクロ
  y1.c      ( 490行) — メイン + 状態生成（LALR構成の核心）
  y2.c      ( 560行) — 文法読み込み（setup：トークン/生成規則のパース）
  y3.c      ( 270行) — 出力生成（パーステーブルをCコードに書き出す）
  y4.c      ( 230行) — 最適化パッカー（greedy算法でテーブルを圧縮）
  yaccpar   ( 100行) — 生成パーサのテンプレート（$Aが挿入点）
  yaccnews  (   -  ) — リリースノート群（1975〜1978年の開発記録）
  yaccdiffs (   -  ) — 変更履歴
```

---

## "Ratfor and EFL Yacc are dead. Long live C!"

`yaccnews` に1978年5月18日付のエントリがある。

```
5/18/78
A new version of Yacc has been installed...

***  Ratfor and EFL Yacc are dead.  Long live C!
```

**Ratfor**（Rational FORTRAN）はBrian Kernighanが1975年に設計した構造化FORTRANプリプロセッサだ。**EFL**（Extended FORTRAN Language）も同様。1970年代のBell Labs では、構造化されたFORTRANが主要な開発言語だった。

1978年5月、Stephen JohnsonはRatfor版・EFL版のyaccを廃止し、C版のみに一本化した。Bell Labsがプログラミング言語としてC言語を中心に据えた瞬間の記録だ。

`y2.c` にはその痕跡が今も残っている。

```c
case 'r':
case 'R':
    error( "Ratfor Yacc is dead: sorry...\n" );
```

`-r` フラグの実装がこれだけだ。エラーメッセージそのものが歴史証言になっている。

---

## 11フェーズのパイプライン

`y1.c` の `main()` は11個の関数を順に呼ぶ。

```c
main(argc,argv) int argc; char *argv[]; {
    setup(argc,argv);  /* 文法を読み込み、生成規則を構築 */
    tbitset = NWORDS(ntokens);
    cpres();           /* 各非終端を導出できる生成規則の表を作る */
    cempty();          /* 空文字列を導出できる非終端の表を作る */
    cpfir();           /* 各非終端のFIRST集合を計算 */
    stagen();          /* LR(0)アイテム集合からLALR状態を生成 */
    output();          /* 状態とパーステーブルをCコードに書き出す */
    go2out();          /* goto表を出力 */
    hideprod();        /* アクション付き生成規則を隠す（最適化準備） */
    summary();         /* 競合レポートを出力 */
    callopt();         /* テーブルを貪欲アルゴリズムでパック */
    others();          /* 残りの配列と yaccpar テンプレートをコピー */
    exit(0);
}
```

各フェーズが前フェーズの出力を受け取り、次フェーズに渡す。コンパイラがコンパイラを作るための、コンパイラそのものの設計だ。

---

## NTBASE = 010000——終端と非終端の空間分割

`dextern` の冒頭にある。

```c
/* base of nonterminal internal numbers */
# define NTBASE 010000
```

`010000`は8進数で10進数の4096だ。終端記号（トークン）は1〜127の整数値を持つ。非終端記号は `NTBASE + 0`, `NTBASE + 1`, ... と番号付けされる。これで終端・非終端を単一の `int` で表現でき、符号の差で区別できる。

```c
# define ERRCODE  8190    /* 8190 = NTBASE*2 - 2 に近い */
# define ACCEPTCODE 8191  /* 受け入れアクション */
```

生成規則は `mem0[]` という単純な整数配列に格納される。`prdptr[i]` がi番目の生成規則の開始点を指す。

---

## struct item——LRアイテムの表現

LALR構成の核心は `struct item` だ。

```c
struct item {
    int *pitem;              /* 生成規則内のドット位置を指すポインタ */
    struct looksets *look;   /* 先読み集合（ビットベクタ） */
};
```

`pitem` は `mem0[]` 内のポインタで、ドット（`·`）の直後の記号を指す。先読み集合は `struct looksets` のビットベクタだ。

```c
struct looksets {
    int lset[TBITSET];   /* TBITSET = (NTERMS+32)/32 個のint */
};
```

`TBITSET` は終端記号数を32ビットワードに収めるのに必要なワード数。`BIT(a,i)` と `SETBIT(a,i)` マクロがビット操作を担当する。

```c
# define BIT(a,i)    ((a)[(i)>>5] & (1<<((i)&037)))
# define SETBIT(a,i) ((a)[(i)>>5] |= (1<<((i)&037)))
```

LALR(1)の先読み集合の計算は `stagen()`（y1.c）が担当する。`wsets[]`（作業集合）と `lkst[]`（先読み集合）を使って状態を構成する。

---

## y4.c — 貪欲パッカー、"greed"

生成パーサのアクション表は `amem[]` に格納される。y4.c の `callopt()` はこれを最適化する。

```c
int * ggreed = lkst[0].lset;  /* 非終端のgreed値（lkstを流用！） */
int greed[NSTATES];            /* 各状態のgreed値 */

nxti(){  /* 次に処理する最も「貪欲な」エントリを選ぶ */
    register i, max, maxi;
    max = 0;
    for( i=1; i<= nnonter; ++i ) if( ggreed[i] >= max ){
        max = ggreed[i];
        maxi = -i;
    }
    for( i=0; i<nstate; ++i ) if( greed[i] >= max ){
        max = greed[i];
        maxi = i;
    }
    if( max==0 ) return( NOMORE );
    else return( maxi );
}
```

`greed[i]` はその状態のエントリ数とスプレッド（最大インデックス - 最小インデックス）の組み合わせだ。貪欲な状態から順にパックすることで、テーブルのオーバーラップを最大化し、サイズを最小化する。

`yaccdiffs` にある記述：

```
The optimized parsers produced by Yacc are likely to be
2-3 times faster and 1-2k bytes smaller than the old ones,
for medium/large grammars.
```

1977年1月の最適化だ。

---

## yaccpar — $Aと生成パーサのテンプレート

`yaccpar` はyaccが生成するC関数のテンプレートだ。

```c
yyparse() {
    short yys[YYMAXDEPTH];
    short yyj, yym;
    register YYSTYPE *yypvt;
    register short yystate, *yyps, yyn;
    /* ... */

    yystate = 0;
    yychar = -1;
    /* ... */

yystack:
    /* put a state and value onto the stack */
    if( ++yyps> &yys[YYMAXDEPTH] ) { yyerror( "yacc stack overflow" ); return(1); }
    *yyps = yystate;

yynewstate:
    yyn = yypact[yystate];
    if( yyn<= YYFLAG ) goto yydefault;
    if( yychar<0 ) if( (yychar=yylex())<0 ) yychar=0;
    if( (yyn += yychar)<0 || yyn >= YYLAST ) goto yydefault;
    if( yychk[ yyn=yyact[ yyn ] ] == yychar ){  /* valid shift */
        /* ... */
        goto yystack;
    }

yydefault:
    /* reduction by production yyn */
    /* ... */
    switch(yym){
        $A           /* ← ここにすべてのアクションが挿入される */
    }
    goto yystack;
}
```

`$A` がプレースホルダーだ。yacc が生成時にこれをユーザーの書いたアクション（`{ $$ = $1 + $3; }` など）に置き換える。

`yystack:` `yynewstate:` `yydefault:` `yyerrlab:` `yyabort:` の5つのラベルがLALR解析の全状態遷移を実装する。これが1975年以来変わっていないLALRパーサの骨格だ。

`#ifdef YYDEBUG` も埋め込まれている。

```c
#ifdef YYDEBUG
int yydebug = 0; /* 1 for debugging */
#endif
/* ... */
#ifdef YYDEBUG
    if( yydebug  ) printf( "state %d, char 0%o\n", yystate, yychar );
#endif
```

全生成パーサに `yydebug = 1;` を書けばデバッグ出力が出る。1975年のデバッガが今日のbison生成パーサにも生きている。

---

## yaccが産んだ子どもたち

`bc.y`（1975年、Lorinda Cherry）——yacc文法1枚でbcのコンパイラを実装。dc へのコードを生成する。

`AWK`（1977年、Aho/Weinberger/Kernighan）——パターンアクション言語の構文解析にyaccを使用。

`egrep`——拡張正規表現の構文解析。

`Perl 1.0`（1987年、Larry Wall）——yaccで書かれた `perly.y` が今日も `perly.c` を生成し続けている。

`Python`（初期版）——`Grammar/Grammar` をyaccで処理していた。

`ANSI C コンパイラ`群——pcc（Portable C Compiler）はSteve Johnson自身が書き、yaccを使った。

---

## 鑑定

```
ファイル     : usr/src/cmd/yacc/（y1〜y4.c + dextern + yaccpar、計~1850行）
言語         : C
誕生         : 1975年、AT&T Bell Labs
設計者       : Stephen C. Johnson
手法         : LALR(1)パーサ自動生成
最適化       : y4.c の貪欲パッキング（2-3倍高速化、1-2KB縮小）
歴史的記録   : "Ratfor and EFL Yacc are dead. Long live C!"（1978年5月18日）
子孫         : GNU Bison（1985〜）、多数のC/Perl/Pythonコンパイラ
```

`yaccnews` の一言が歴史を語る。1978年、RatforとEFLが死に、Cが生きた。

yaccが生成したパーサが `AWK` を動かし、`bc` を動かし、`Perl` を動かした。50年後の今日、GNU bisonが同じLALRアルゴリズムで動いている。`$A` のプレースホルダーは `yaccpar` から消えたが、そのアイデアは生き続けている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
