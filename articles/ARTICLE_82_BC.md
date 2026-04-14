# yacc文法1枚が生んだ2プロセスJIT——bc.y、パイプ越しにdcを動かす300行のコンパイラ

## はじめに

`bc` は計算機だ——そう思っていた。

`bc.y` を開いた瞬間、認識が変わる。bcは**コンパイラ**だ。実行時にbcコードをdcコードに変換し、dcプロセスに流し込む。計算はdcがやる。bcはその翻訳者に過ぎない。

`dspinellis/unix-history-repo` の Bell-32V ブランチに `usr/src/cmd/bc.y` がある。**1ファイル、約300行**。yacc文法とCコードが混在する。設計者はLorinda Cherry（Bell Labs）、1975年。

---

## 発掘されたコード

- **リポジトリ**: [dspinellis/unix-history-repo](https://github.com/dspinellis/unix-history-repo)（Bell-32V-Snapshot-Development ブランチ）
- **スター数**: 7,215
- **実装言語**: C + yacc文法
- **設計者**: Lorinda Cherry（Bell Telephone Laboratories）
- **初版**: 1975年

```
bc.y — 1ファイル（約300行）
  %{ ... %}  — C変数・マクロ宣言
  %%
  文法規則    — yacc LALR文法 + dcコード生成アクション
  %%
  yylex()    — 字句解析器
  bundle()   — コード生成エンジン
  routput()  — 再帰的出力
  main()     — fork/pipe/execl でdcを起動
```

---

## main()——2プロセスアーキテクチャ

`bc.y` の `main()` を読んだ瞬間、すべてが分かる。

```c
main(argc, argv)
char **argv;
{
    int p[2];

    pipe(p);
    if (fork()==0) {
        close(1);
        dup(p[1]);      /* 子プロセスのstdout = パイプ書き込み端 */
        close(p[0]);
        close(p[1]);
        yyinit(argc, argv);
        yyparse();      /* bcコードを解析してdcコードをstdoutに出力 */
        exit();
    }
    close(0);
    dup(p[0]);          /* 親プロセスのstdin = パイプ読み込み端 */
    close(p[0]);
    close(p[1]);
    execl("/bin/dc", "dc", "-", 0);  /* 親プロセスがdcになる */
    execl("/usr/bin/dc", "dc", "-", 0);
}
```

`fork()` で2つのプロセスに分かれる。

- **子プロセス**（bc翻訳器）: `yyparse()` がbcコードを読み、dcコードを `stdout`（= パイプ書き込み端）に書き出す
- **親プロセス**（dc実行器）: `execl("/bin/dc")` でdcに変身し、`stdin`（= パイプ読み込み端）からdcコードを受け取って実行する

bcは一瞬も計算しない。すべての演算はdcがやる。**bcはパイプ越しにdcを動かす翻訳者だ。**

---

## bundle()——ポインタで作るコードツリー

コード生成の核心は `bundle()` 関数だ。

```c
# define b_sp_max 3000
int b_space [ b_sp_max ];
int * b_sp_nxt = { b_space };

bundle(a){
    int i, *p, *q;
    p = &a;
    i = *p++;          /* 第1引数 = 要素数 */
    q = b_sp_nxt;
    while(i-- > 0){
        if( b_sp_nxt >= &b_space[b_sp_max] ) yyerror("bundling space exceeded");
        *b_sp_nxt++ = *p++;   /* 後続引数をb_space[]に積む */
    }
    *b_sp_nxt++ = 0;   /* ヌル終端 */
    yyval = q;
    return(q);
}
```

引数は「ポインタ」だ。`b_space[]` 内のアドレスなら別のbundle（サブツリー）を指し、そうでなければリテラル文字列（dcコマンド断片）を指す。

```c
routput(p) int *p; {
    if( p >= &b_space[0] && p < &b_space[b_sp_max]){
        while( *p != 0 ) routput( *p++ );  /* 再帰的に展開 */
    }
    else printf( p );  /* 文字列をそのまま出力 */
}
```

`routput()` がツリーを再帰的に辿り、最終的にdcコマンド列を `printf` で出力する。

`bundle(3, $1, $3, "+")` は「`$1`の出力、`$3`の出力、そして文字列 `+`」というノードを作る。これが `a + b` → `a b +`（逆ポーランド記法）の変換だ。

---

## 文法規則——bcからdcへの変換

`%%` 以降の文法部分を見ると、各規則がdcコードを組み立てる。

```
e '+' e  = bundle(3, $1, $3, "+" );
e '-' e  = bundle(3, $1, $3, "-" );
e '*' e  = bundle(3, $1, $3, "*" );
e '/' e  = bundle(3, $1, $3, "/" );
e '^' e  = bundle(3, $1, $3, "^" );
```

足し算・引き算・掛け算・割り算・べき乗——すべてが同じパターン。オペランドをスタックに積んでから演算子を置く。dcのRPNそのものだ。

変数 `x` の読み込みは `lx`（load x）、書き込みは `sx`（store x）に変換される。

```
LETTER '=' e  = bundle(3, $3, "s", $1 );   /* x = e  →  e sx */
LETTER        = bundle(2, "l", $1 );        /* x      →  lx   */
```

---

## 比較演算子の反転——スタック順序の補正

dc のスタックは LIFO だ。`e1 < e2` をそのまま変換すると `e1 e2 <` になるが、dcでは後からプッシュした `e2` が「スタックトップ」になるため、`<` の判定対象が逆になる。

bc.y はこれを文法レベルで修正する。

```
re  :  e EQ e  = bundle(3, $1, $3, "=" );
    |  e '<' e = bundle(3, $1, $3, ">" );   /* bcの < → dcの > */
    |  e '>' e = bundle(3, $1, $3, "<" );   /* bcの > → dcの < */
    |  e NE e  = bundle(3, $1, $3, "!=" );
    |  e GE e  = bundle(3, $1, $3, "!>" );  /* bcの >= → dcの !> */
    |  e LE e  = bundle(3, $1, $3, "!<" );  /* bcの <= → dcの !< */
```

bcユーザーは `<` と書く。bcコンパイラが `>` に変換する。dcが正しく実行する。透明な層だ。

---

## conout()——if/while/forをdcマクロに変換

dcには条件分岐がある——比較結果が真なら指定レジスタのマクロを実行する。bcのif/while/forは、このdcのマクロ機構に変換される。

```c
conout( p, s ) int *p; char *s; {
    printf("[");    /* dcマクロ開始 */
    routput( p );  /* ブロック本体のdcコードを出力 */
    printf("]s%s\n", s );  /* レジスタsに格納 */
    fflush(stdout);
    lev--;
}
```

`conout()` はブロック本体を `[...]s名前` の形式でdcに送る。dcのレジスタに**コードを格納する**のだ。実行時には `名前 x` でそのコードを呼び出す。

bcのwhileループ：

```
_WHILE CRS '(' re ')' stat BLEV
    ={  bundle(3, $6, $4, $2 );       /* ループ本体 + 条件 + マクロ呼び出し */
        conout( $$, $2 );             /* dcマクロとして書き出す */
        bundle(3, $4, $2, " " );      /* 最初の条件チェック + マクロ呼び出し */
        }
```

`CRS` トークンがループごとにユニークなレジスタ名（英字1文字）を割り当てる。`crs` 変数が `'0'` から始まってループのたびにインクリメントされる。

---

## yyerror()——エラーメッセージもdcプログラム

bc の出力はすべてdcコードだ。エラーが起きても同じ。

```c
yyerror( s ) char *s; {
    if(ifile > sargc) ss="teletype";
    printf("c[%s on line %d, %s]pc\n", s, ln+1, ss);
    fflush(stdout);
    /* c=スタッククリア, [...]= 文字列, p=print, c=クリア */
    cp = cary;
    crs = rcrs;
    bindx = 0;
    lev = 0;
    b_sp_nxt = &b_space[0];
}
```

構文エラーが起きると、bcはdcに `c[エラーメッセージ]pc` という命令を送る。dcがそれを実行してエラーメッセージを表示する。**エラー表示もパイプ越しのdcプログラムだ。**

---

## funtab[]とatab[]——関数と配列の名前空間

bcの関数名 `a`〜`z` と配列名 `a[]`〜`z[]` は、それぞれ独立したdcレジスタにマッピングされる。

```c
char funtab[52] = {
    01,0, 02,0, 03,0, 04,0, 05,0, 06,0, 07,0, 010,0,
    011,0, 012,0, 013,0, 014,0, 015,0, 016,0, 017,0,
    /* ... 26文字分 */ };

char atab[52] = {
    0241,0, 0242,0, 0243,0, /* ... */ };
```

`getf('a')` は `&funtab[0]`、つまりバイト値 `01` を持つ文字列へのポインタを返す。`getf('b')` は `&funtab[2]` でバイト値 `02` を返す。0が配列の区切り（ヌル終端）を兼ねる。

`atab[]` は 0241〜0272（8進）の範囲——ASCIIの通常文字と衝突しないDC内部レジスタ名だ。

---

## 鑑定

```
ファイル     : usr/src/cmd/bc.y（1ファイル、約300行）
言語         : yacc文法（C埋め込み）
誕生         : 1975年、AT&T Bell Labs
設計者       : Lorinda Cherry
アーキテクチャ: fork+pipe+execl — コンパイラ(bc)とランタイム(dc)が別プロセス
コード生成   : bundle()+routput() — ポインタツリーをdcコマンド列に展開
依存関係     : yacc（構文解析）+ dc（実行）— 単体では動かない
```

`bc.y` は「yacc文法1枚でコンパイラを実装する」という思想の結晶だ。

字句解析・構文解析・コード生成・ランタイム——これらをbcは4つの部品に分解した。yaccが解析、`bundle()` がコード生成、`fork+pipe` がプロセス間通信、dcが実行。

1975年に書かれた300行のyacc文法が、2024年の `bc` コマンドの直系の祖先だ。`echo "2 + 3" | bc` は今日も動く。そしてその裏では、dcが今も計算をしている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
