# マクロは自分自身を展開する——KernighanとRitchieが900行で書いたm4、プッシュバックバッファが生む再帰

## はじめに

`m4.c` の冒頭にある。

```c
#define HSHSIZ  199   /* prime */
struct nlist {
    char  *name;
    char  *def;
    struct nlist *next;
};
struct nlist *hshtab[HSHSIZ];
```

著者の名前はない。コメントもない。Bell Labsの慣習だ——コードが語るだけでいい。

しかし歴史はこれが **Brian W. Kernighan** と **Dennis M. Ritchie** の共同作だと記録している。C言語を設計した男（Ritchie）と、その言語で最も有名な本を書いた男（Kernighan）が2人がかりで900行に収めた。1977年、Bell Telephone Laboratoriesで。

m4——マクロプロセッサ——は今日も動いている。`autoconf` がm4で書かれており、Linuxカーネルのビルドはautconfを使う。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C（+ yacc）
- **作者**: Brian W. Kernighan + Dennis M. Ritchie
- **年**: 1977年

```
m4 — ファイル
  m4.c    (~900行) — 全実装（単一ファイル）
  m4y.y   ( ~95行) — eval 用算術エンジン（yacc）
  Makefile(  ~9行) — ビルド設定
```

1つのCファイルで完結する完全なマクロプロセッサ。

---

## プッシュバックバッファ——再帰展開のしくみ

m4の核心は `m4.c` の中央部にある。

```c
#define SAVS    4096
#define TOKS    128
char ibuf[SAVS+TOKS];    /* 入力バッファ（プッシュバック用） */
char obuf[SAVS+TOKS];    /* 出力バッファ（引数収集用） */
char *ip = ibuf;
char *op = obuf;

#define putbak(c)  *ip++ = c
#define getchr()   (ip>cur_ip ? *--ip : getc(infile[infptr]))
```

`putbak()` は「文字を入力ストリームに戻す」操作だ。`getchr()` はプッシュバックバッファが空でなければそこから取り出し、空ならファイルから読む。

マクロ展開の流れはこうだ。

```
1. getchr() でトークンを読む
2. lookup() でハッシュテーブルを引く
3. 定義があれば引数を収集
4. expand() で展開し、結果を pbstr() でバッファにプッシュバック
5. 次の getchr() でその展開済みテキストを再スキャン
```

展開結果を「入力に差し戻す」ことで、スタックを使わずに再帰展開が自然に実現する。`define(A, define(B, $1))` のような入れ子のマクロは、展開された結果がまた入力として読まれ、さらに展開される。

**引数なしマクロの自動補完**：

```c
if (t != LPAR) {
    putbak(')');
    putbak('(');
}
```

`(`が続かない場合でも、空の `()` をプッシュバックして引数ゼロで展開させる。`foo` と書くだけで `foo()` として処理される。

---

## 状態機械——`cp == NULL` の一行

コールスタックの定義：

```c
#define STACKS  50
struct call {
    char  **argp;  /* 引数リストへのポインタ */
    int    plev;   /* 括弧ネストレベル */
};
struct call *cp = NULL;
char *argstk[STACKS+10];
```

`cp == NULL` はシステム全体の状態を1つのポインタで表現する。

- `cp == NULL`: 通常テキスト出力モード——文字はそのまま出力される
- `cp != NULL`: マクロ引数収集モード——`plev` で括弧の深さを追い、`)` かつ `plev==0` で引数確定

この1ビットの状態機械が、マクロ外のテキストとマクロ内の引数を区別する全て。50スタックが上限だが、`STACKS+10` の余裕が「念のため」感を漂わせる。

---

## ハッシュテーブル——素数199の意味

```c
#define HSHSIZ  199   /* prime */

lookup(s)
char *s;
{
    char *s1;
    int hshval;
    struct nlist *np;
    static struct nlist nodef;

    for(hshval=0,s1=s; *s1!=EOS; )
        hshval += *s1++;
    hshval %= HSHSIZ;

    for(np=hshtab[hshval]; np!=NULL; np=np->next)
        if(strcmp(s,np->name)==0)
            return(np);
    return(&nodef);
}
```

ハッシュ関数は文字コードの加算（`hshval += *s1++`）をテーブルサイズで割った余り——最もシンプルな実装だ。衝突はチェーン法で解決する。

199が素数であることは意味がある。ハッシュのバケット数を素数にすると、キーの分布が均等になりやすい。`#define HSHSIZ 199 /* prime */` のコメントは、設計者がこれを意識していた証拠だ。

`lookup()` がヒットしない場合は静的な `nodef`（`name==NULL`）を返す。NULLポインタを返さないことで呼び出し側のNULLチェックが不要になる——1977年のC言語でのイディオムだ。

---

## divert——出力を一時ファイルへ

```c
FILE *olist[11] = { stdout };   /* [0]=stdout, [1..9]=一時ファイル */
FILE *curfile = { stdout };
```

`divert(N)` で出力先を切り替える。

```c
dodiv(ap)
char **ap;
{
    int n = ctol(ap[1]);
    if(n<0 || n>9)
        curfile = NULL;        /* 出力を捨てる */
    else {
        if(olist[n]==NULL)
            olist[n] = mytmpfile();
        curfile = olist[n];
    }
}
```

`divert(0)` で標準出力に戻り、`divert(-1)` で以降の出力を全て捨てる。`delexit()` 時にすべての一時ファイルを標準出力に流し込んで終了する。

autoconfがこの仕組みを多用する。設定スクリプト生成中に「先に出力したいヘッダ部分」と「後から埋まる本文部分」を別々の divert バッファに書き、最後に正しい順序で結合する。

---

## eval と m4y.y——yaccが算術を担う

```yacc
/* m4y.y — eval の算術エンジン */
e : e '|' e        ={ $$ = $1 | $3; }
  | e '&' e        ={ $$ = $1 & $3; }
  | e EQ e         ={ $$ = ($1==$3); }
  | e '+' e        ={ $$ = $1 + $3; }
  | e '-' e        ={ $$ = $1 - $3; }
  | e '*' e        ={ $$ = $1 * $3; }
  | e '/' e        ={ $$ = $1 / $3; }
  | e POWER e      ={ for($$=1; $3-->0; $$*=$1); }
  | '-' e %prec UMINUS  ={ $$ = $2-1; $$ = -$2; }
```

`eval` マクロの算術エンジンはyacc文法だ——前回（#070 yacc、#076 pcc）と同じパターン。Bell Labsの全ツールはyaccで文法を書く。

**デッドコードのバグ**：

```c
| '-' e %prec UMINUS  ={ $$ = $2-1; $$ = -$2; }
```

`$$ = $2-1;` が実行された直後に `$$ = -$2;` で上書きされる。前者は永遠に使われない。おそらく編集ミスの残骸だ——`$2-1` は誰かが書こうとした別の実装の名残かもしれない。Kernighan+Ritchieのコードにも入稿ミスはあった。

`POWER` 演算子 `^`（または `**`）の実装：

```c
for($$=1; $3-->0; $$*=$1);
```

ループで掛け算を繰り返す。`$3--` が0になるまで。シンプルだが指数が負だと無限ループするリスクがある——1977年に型チェックなし。

---

## 組み込みマクロ——autoconfに受け継がれた命令セット

```
define     — マクロ定義（$1, $2, ... で引数参照）
undefine   — ハッシュテーブルから削除
ifdef      — 定義有無で条件分岐
ifelse     — 文字列比較で条件分岐
include    — ファイル読み込み（失敗でエラー）
sinclude   — サイレントインクルード（失敗で無視）
eval       — 算術評価
divert     — 出力先切り替え
undivert   — divertバッファを現在出力に流し込み
dnl        — 次の改行まで捨てる（コメント行に使う）
changequote— クォート文字の変更
translit   — 文字置換（tr相当）
substr     — 部分文字列
index      — 文字列検索位置
len        — 文字列長
maketemp   — 一時ファイル名生成
syscmd     — シェルコマンド実行
errprint   — stderrへ出力
dumpdef    — 定義内容をstderrに出力
shift      — [未実装] "shift not yet implemented"
```

**`shift` が未実装のまま出荷されている**。関数呼び出しに入ると `"shift not yet implemented"` と出力して処理を打ち切る。TODO残しの出荷——1977年も2024年も変わらない。

autoconf（1991年）が依存する `define`、`ifdef`、`include`、`divert`、`dnl`、`changequote`、`translit`、`eval` は全てこの実装に揃っている。Bell 32V m4（1979年収録）→ SysV m4 → GNU m4 → autoconf という系譜の源点がこの900行だ。

---

## GCOS対応——`#ifdef M4`

```c
#ifdef M4
    { "DEFINE",   dodef   },
    { "IFDEF",    doifdef },
    { "INCLUDE",  doincl  },
    ...
#endif
    { "define",   dodef   },
    { "ifdef",    doifdef },
    { "include",  doincl  },
```

`#ifdef M4` でコンパイル時に大文字名（`DEFINE`、`IFDEF`...）と小文字名（`define`、`ifdef`...）を切り替える。大文字版はGCOS（Honeywell製メインフレームのOS）用だ。

Bell Labsは1970年代後半、GE/Honeywellのメインフレームでもc言語ツールを動かしていた。m4はUnixとGCOSの両方で使えるように設計されていた——ポータビリティはpcc（#076）だけの問題ではなかった。

---

## 鑑定

```
初版       : 1977年（Bell-32V収録）
作者       : Brian W. Kernighan + Dennis M. Ritchie（Bell Telephone Laboratories）
実装       : C（900行）+ yacc（95行 — eval算術エンジン）
マクロ辞書 : チェーンハッシュ（サイズ199、素数）
展開機構   : プッシュバックバッファ（4096+128バイト）
状態機械   : cp==NULL で出力モード/引数収集モードを区別
divert     : 10チャンネルの一時ファイル出力（autoconfの基盤）
GCOS対応   : #ifdef M4 で大文字/小文字マクロ名を切り替え
既知の問題 : shift未実装（"not yet implemented"で出荷）/ eval UMINUS デッドコード
後継       : GNU m4 → autoconf → Linuxカーネルビルドシステム
```

Kernighanは2025年12月にもAWKのリポジトリにコミットしていた（#063）。Ritchieは2011年に亡くなった。2人が900行に書き込んだ「テキストを展開する機械」は、Linux、macOS、FreeBSDのビルドを今日も支えている。

`shift not yet implemented` のエラーメッセージは、1977年から変わらずそこにある。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
