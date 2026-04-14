# 公開されなかった最初のLua——失われたソースと@()の時代、1993年7月28日の断片

## はじめに

`README` の冒頭にこう書いてある。

```
This is Lua 1.0. It was never publicly released. This code is a snapshot of
the status of Lua on 28 Jul 1993. It is distributed for historical curiosity
to celebrate 10 years of Lua and is hereby placed in the public domain.
```

**公開されなかった**。1993年7月28日のスナップショット。Lua誕生10周年（2003年）を記念して初めて公開された歴史的資料だ。

そしてもう一つの衝撃。

```
The source files for the lexer and parser have been lost: all that is left is
the output of lex and yacc. A grammar can be found inside y_tab.c in yyreds.
```

**lex と yacc のソースファイルが消失した。** `lex_yy.c`（生成済み字句解析器）と `y_tab.c`（生成済みパーサ）だけが残っている。コードを生んだ設計者の意図は、生成物の中にしか残っていない。

`lua.h` の著作権表示は「19 May 93」——`TeCGraf - PUC-Rio`（ブラジル・リオデジャネイロ）。設計者は Roberto Ierusalimschy、Luiz Henrique de Figueiredo、Waldemar Celes の3人。

---

## 発掘されたコード

- **オリジナル**: PUC-Rio Lua チームが2003年に公開した歴史的アーカイブ
- **参照先**: necrophcodr/lua（Lua全バージョン Git ミラー）、タグ v1.0
- **実装言語**: C（+ lex/yacc 生成コード）
- **設計者**: Roberto Ierusalimschy、Luiz Henrique de Figueiredo、Waldemar Celes（TeCGraf - PUC-Rio）
- **スナップショット日付**: 1993年7月28日

```
Lua 1.0 — 主要ファイル
  lua.h      (  ~70行) — 公開API定義（19 May 93）
  opcode.h   ( ~140行) — オペコードと型定義（16 Apr 92）
  opcode.c   ( ~660行) — VMインタプリタ（26 Apr 93）
  hash.c     ( ~190行) — ハッシュテーブル実装（17 Aug 90改）
  hash.h     (  ~40行) — ハッシュテーブル定義
  table.c    ( ~280行) — シンボルテーブル
  strlib.c   (  ~90行) — 文字列ライブラリ
  mathlib.c  ( ~180行) — 数学ライブラリ
  lex_yy.c   (  *生成) — lex生成字句解析器（ソース消失）
  y_tab.c    (  *生成) — yacc生成パーサ（ソース消失）
  *.lua      (   6本 ) — テストプログラム
```

---

## LUA——Linguagem para Usuarios de Aplicacao

`lua.h` のコメントに正式名称がある。

```c
/*
** LUA - Linguagem para Usuarios de Aplicacao
** Grupo de Tecnologia em Computacao Grafica
** TeCGraf - PUC-Rio
** 19 May 93
*/
```

**Linguagem para Usuarios de Aplicacao** —— ポルトガル語で「アプリケーション・ユーザーのための言語」。設計の動機が名前に刻まれている。

TeCGraf（Grupo de Tecnologia em Computacao Grafica）はPUC-Rioのコンピュータグラフィクス技術グループ。当時の主要クライアントはPetrobras（ブラジル国営石油会社）だった。油田の地質データ処理システムに組み込むスクリプト言語として設計された。

ブラジルから生まれた言語が、30年後にゲームエンジン・組み込みシステム・Webサーバーの標準スクリプト言語になる——1993年7月の段階では誰も知らなかった。

---

## 型システム——booleanのない世界

`opcode.h` に型定義がある。

```c
typedef enum
{
 T_MARK,
 T_NIL,
 T_NUMBER,
 T_STRING,
 T_ARRAY,
 T_FUNCTION,
 T_CFUNCTION,
 T_USERDATA
} Type;
```

**T_BOOLEAN が存在しない。** 真偽値は `T_NUMBER`（真）と `T_NIL`（偽）で表現する。

`EQOP` の実装がその証拠だ。

```c
case EQOP:
{
 Object *l = top-2;
 Object *r = top-1;
 --top;
 if (tag(l) != tag(r))
  tag(top-1) = T_NIL;          /* 型が異なれば偽（= NIL） */
 else
 {
  switch (tag(l))
  {
   case T_NIL:    tag(top-1) = T_NUMBER; break;  /* NIL == NIL → 真（= NUMBER） */
   case T_NUMBER: tag(top-1) = (nvalue(l) == nvalue(r)) ? T_NUMBER : T_NIL; break;
   case T_ARRAY:  tag(top-1) = (avalue(l) == avalue(r)) ? T_NUMBER : T_NIL; break;
   /* ... */
  }
 }
}
```

等値比較の結果は `T_NUMBER`（1.0）か `T_NIL`。booleanは現代Luaの4.0（2000年）で追加される。1993年時点では、数値と nil で真偽を表現した。

数値は `float`——現代Luaが `double` を使うのとは異なる。

---

## Object——タグ付きユニオン

すべての値は `Object` 構造体に収まる。

```c
typedef union
{
 Cfunction  f;   /* Cの関数ポインタ */
 real       n;   /* float数値 */
 char      *s;   /* 文字列ポインタ */
 Byte      *b;   /* バイトコードポインタ（関数本体） */
 struct Hash *a; /* テーブル（ハッシュマップ） */
 void      *u;   /* ユーザーデータ */
} Value;

typedef struct Object
{
 Type  tag;
 Value value;
} Object;
```

`struct Object` のサイズは `sizeof(Type) + sizeof(Value)` —— タグ1ワードと値1ポインタ/float。すべての値がこの構造体に収まる。

アクセスは `tag(o)`, `nvalue(o)`, `svalue(o)`, `bvalue(o)`, `avalue(o)` マクロ経由。

---

## lua_execute()——VMの心臓部

VMは `opcode.c` の `lua_execute(Byte *pc)` だ。

```c
static Object stack[MAXSTACK] = {{T_MARK, {NULL}}};
static Object *top = stack+1, *base = stack+1;

int lua_execute (Byte *pc)
{
 while (1)
 {
  switch ((OpCode)*pc++)
  {
   case PUSHNIL: tag(top++) = T_NIL; break;

   case PUSH0: tag(top) = T_NUMBER; nvalue(top++) = 0; break;
   case PUSH1: tag(top) = T_NUMBER; nvalue(top++) = 1; break;
   case PUSH2: tag(top) = T_NUMBER; nvalue(top++) = 2; break;

   case PUSHLOCAL0: *top++ = *(base + 0); break;
   case PUSHLOCAL1: *top++ = *(base + 1); break;
   /* ... PUSHLOCAL9 まで最適化 */
   case PUSHLOCAL: *top++ = *(base + (*pc++)); break;

   /* ... */
  }
 }
}
```

`while(1) { switch((OpCode)*pc++) { ... } }` ——バイトコードVMの古典的パターンだ。

`PUSHLOCAL0` 〜 `PUSHLOCAL9` は最初の10個のローカル変数に特化した高速命令。現代のVM設計でも使われるスペシャライゼーション最適化が、1993年のLua 1.0にすでにある。

`CALLFUNC` の実装も洗練されている。

```c
case CALLFUNC:
{
 Byte *newpc;
 Object *b = top-1;
 while (tag(b) != T_MARK) b--;  /* マークを探してスタックを遡る */
 if (tag(b-1) == T_FUNCTION)
 {
  newpc = bvalue(b-1);
  bvalue(b-1) = pc;             /* リターンアドレスをスタックに保存 */
  nvalue(b) = (base-stack);     /* ベースポインタをスタックに保存 */
  base = b+1;
  pc = newpc;
  /* ... */
 }
}

case RETCODE:
{
 int nretval = top - base - shift;
 top = base - 2;
 pc = bvalue(base-2);           /* リターンアドレスを回収 */
 base = stack + (int)nvalue(base-1);  /* ベースポインタを回収 */
 /* 戻り値をコピー */
}
```

リターンアドレスとベースポインタはスタック上に保存される。`T_MARK` がアクティベーションレコードの区切りだ。この構造が**多値返却**（multiple return values）を自然にサポートする。

---

## hash.h——1990年生まれのテーブル

`hash.h` に驚く日付がある。

```c
/*
** hash.h
** hash manager for lua
** Luiz Henrique de Figueiredo - 17 Aug 90
** Modified by Waldemar Celes Filho
** 26 Apr 93
*/
```

**17 Aug 90**——1990年8月17日。Lua 1.0 の3年前。ハッシュテーブルの設計はLuaの言語設計より先に始まっていた。

```c
typedef struct node
{
 Object ref;   /* キー */
 Object val;   /* 値 */
 struct node *next;
} Node;

typedef struct Hash
{
 char           mark;      /* GCマーク */
 unsigned int   nhash;     /* バケット数 */
 Node         **list;      /* バケット配列 */
} Hash;
```

チェーン法のハッシュテーブル。`mark` フィールドがGCのためのマーク——ガベージコレクションは Lua 1.0 から設計されていた。

`Object ref` と `Object val` により、**任意の型がキーになれる**。文字列だけでなく、数値も関数もキーになれる。現代Luaのテーブルの万能性はここから来ている。

---

## sort.lua——0始まりの時代

`sort.lua` を見ると、現代Luaとの違いが分かる。

```lua
function main()
 x=@()        -- テーブル生成（現代: x = {}）
 n=-1
 n=n+1; x[n]="a"        -- x[0] から始まる！
 n=n+1; x[n]="waldemar"
 n=n+1; x[n]="luiz"
 -- ...
end
```

`@()` がテーブルリテラルの構文だ——現代の `{}` ではない。**インデックスは0から始まる**——現代Luaの1始まりは後から変わった。

クイックソートも書ける。

```lua
function quicksort(r,s)
    if s<=r then return end   -- 基本ケース
    local v=x[r]
    local i=r
    local j=s+1
    -- ...
    x[i],x[j]=x[j],x[i]      -- 多重代入でスワップ（1993年から！）
end
```

**多重代入**（`a, b = b, a`）は Lua 1.0 からある。ガベージコレクション、クロージャ、テーブル、多値返却——現代Luaの核心的な機能の多くが1993年の断片に既にある。

---

## SETLINE——デバッグの痕跡

`SETLINE` オペコードがある。

```c
case SETLINE:
{
 int line = *((Word *)(pc));
 pc += sizeof(Word);
 if (lua_debugline)
  lua_debugmask = 0;
 /* ソース行情報をVMに記録 */
}
```

デバッグ情報はバイトコードに直接埋め込まれる。実行時にソース行を追跡できる——1993年時点でのデバッガビリティへの配慮だ。

`$debug` ディレクティブを先頭に書くとデバッグモードが有効になる（`sort.lua` 冒頭の `$debug` がそれ）。

---

## 鑑定

```
スナップショット : 1993年7月28日（未公開のまま保存）
初公開         : 2003年（Lua 10周年記念）
設計者         : Roberto Ierusalimschy、Luiz Henrique de Figueiredo、Waldemar Celes
所属           : TeCGraf - PUC-Rio（ブラジル）
言語           : C（lex/yacc 生成コード含む）
ソース消失     : lex/yacc の文法ソースが現存しない
型システム     : T_NIL/T_NUMBER/T_STRING/T_ARRAY/T_FUNCTION/T_CFUNCTION/T_USERDATA（bool なし）
テーブル       : hash.h（1990年設計）が全データ構造の基盤
配布対象       : Petrobras の油田処理システムへの組み込み用途
```

lex/yaccのソースは失われた。`@()` の構文は消えた。0始まりのインデックスは1始まりになった。boolean型は7年後に追加された。

しかし `while(1){ switch(*pc++) { ... } }` というVMの骨格は残った。`Object { Type tag; Value value; }` というタグ付きユニオンは残った。`Node { Object ref; Object val; }` というテーブルの構造は残った。多値返却は残った。

1993年7月28日のスナップショットに、30年間生き続けた設計判断の核心がある。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
