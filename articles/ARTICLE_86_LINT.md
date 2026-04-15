# yaccを書いた男がlintを書いた——Stephen Johnsonが1977年に発明した2パスのCコード品質検査

## はじめに

`lint.c` の冒頭にこう書いてある。

```c
# include "mfile1"
# include "lmanifest"
```

`mfile1` は `/usr/src/cmd/mip`——Portable C Compiler（pcc）との共有ヘッダだ。lintはコンパイラの構文解析コードをそのまま流用して動いている。

作者は **Stephen C. Johnson**。前回（#070）yacc（Yet Another Compiler Compiler）を書いた人物と同一だ。コンパイラを生むコンパイラを作り、次の年にそのコンパイラが生み出すコードを検査するツールを書いた。

lintは1977年、Bell Telephone Laboratoriesで生まれた。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **作者**: Stephen C. Johnson
- **年**: 1977年

```
lint — 主要ファイル
  lint.c      (~800行) — パス1：構文解析・型チェック（pcc共有）
  lpass2.c    (~370行) — パス2：クロスファイル整合性チェック
  llib-lc     (~105行) — libcスタブ（/* LINTLIBRARY */マーカー）
  llib-port   ( ~44行) — 移植性サブセットスタブ
  READ_ME     (  ~3行) — 「本体ソースはmipにある」
```

---

## READ_ME——「ソースはここにない」

`READ_ME` は3行だけだ。要約すると「本体のソースの多くは `/usr/src/cmd/mip`（ポータブルコンパイラとの共有ディレクトリ）にある。このディレクトリはlint固有のファイルのみ」。

これがlintの本質を表している。**lintはコンパイラのフロントエンドそのものだ**。pcc（Portable C Compiler）の構文解析エンジンを共有し、コード生成フェーズを「型チェック・警告出力」フェーズに差し替えた。コンパイラとlintは同じ木を2本の道具で削っている。

---

## lint.c——ポータビリティ検査のための型サイズ定数

`lint.c` の冒頭に並ぶ整数定数がある。

```c
/* these are appropriate for the -p flag */
int  SZCHAR = 8;
int  SZINT = 16;
int  SZFLOAT = 32;
int  SZDOUBLE = 64;
int  SZLONG = 32;
int  SZSHORT = 16;
int SZPOINT = 16;
```

`-p` フラグは「移植性チェック」モードだ。`SZINT=16` はPDP-11の `int` が16ビット幅であることを意味する。1977年のUnixは16ビットマシン上で動いていた。

このフラグが存在すること自体が重要だ。Bell Labsのエンジニアは既に「コードが別のマシンに移ると壊れる」という問題を意識していた。`-p` フラグはその問題を自動検出するための機構で、**移植性という概念を静的解析ツールに組み込んだ最初の実装**だ。

`int libflag = 0;` はライブラリ記述モード。`llib-lc` を生成するのに使う。`vflag = 1` は「未使用の引数について警告する」。1977年に「未使用引数」を検出していた。

---

## lpass2.c——ヘッダファイルなしのクロスファイル型チェック

2パス構成の肝は `lpass2.c` にある。

```c
# define USED 01
# define VUSED 02
# define EUSED 04
# define RVAL 010
# define VARARGS 0100

typedef struct { TWORD aty; int extra; } atype;

struct line {
    char name[8];      /* 関数名 (最大8文字) */
    int decflag;       /* 宣言フラグ */
    atype type;        /* 戻り値の型 */
    int nargs;         /* 引数の数 */
    atype atyp[50];    /* 引数の型 (最大50個) */
    int fline;         /* 宣言されたファイルの行番号 */
    char file[100];    /* 宣言されたファイル名 */
    }
```

`struct line` はパス1が中間ファイルに書き出した関数シグネチャの1レコードだ。

**`name[8]`** ——関数名は8文字以内。Bell-32V の C は識別子が8文字に制限されていた。  
**`atyp[50]`** ——引数の型を最大50個まで記録。50引数以上の関数は当時ほぼ存在しなかった。  
**`file[100]`** ——どのファイルで宣言されたかを100文字で記録。

これが革新だ。1977年には `#include` で共有するヘッダファイルの慣習がまだ確立していなかった。プログラマは `extern int foo();` を各ファイルに手書きして、型の一致を人間が確認していた。lintのパス2はその確認を自動化した。

メインループがシンプルだ。

```c
for(;;){
    lread();
    if( steq(pc->name, pd->name) ) chkcompat();
    else {
        lastone();
        setuse();
        p3=pc;
        pc = pd;
        pd = p3;
    }
}
```

パス1が書いた中間ファイルを名前でソートしておき、同じ名前が連続して現れたら `chkcompat()` で型の一致を確認する。名前が変わったら前の関数の「使われたか」チェックをして次へ。**ソートとスキャンだけで複数ファイルをまたいだ型整合性を検出する**。

---

## llib-lc——VARARGSの発明

`llib-lc` は `/* LINTLIBRARY */` で始まる。

```c
    /* LINTLIBRARY */
#include <stdio.h>
#include <sgtty.h>
#include <sys/types.h>
...
int  fork() { return(0); }
    /* VARARGS */
    execl(f, a) char *f, *a; {;}
...
    /* VARARGS */
    fprintf( f, s ) FILE *f; char *s; {;}
    /* VARARGS */
    printf( s ) char *s; {;}
    /* VARARGS */
    scanf( f ) char *f; {return(1); }
```

`/* LINTLIBRARY */` はlintに「このファイルはライブラリのインターフェース定義だ」と伝えるマーカーだ。実装は全て空関数（`return(0);` か `{;}`）で、型情報だけが存在する。

**`/* VARARGS */`** が特に重要だ。C言語は1977年、可変長引数の構文を持っていなかった。`printf( s ) char *s;` は形式上1引数の関数として宣言されているが、実際には引数の数が不定だ。このコメントはlintに「この関数の引数チェックをスキップせよ」と伝える。

この `/* VARARGS */` アノテーションは、後の `<stdarg.h>`、`va_list`、そして現代の `__attribute__((format(printf, ...)))` へと続く系譜の起点だ。「可変長引数関数の型安全性をいかに検査するか」という問題を、lintは1977年にコメントベースで解決しようとした。

---

## 2パスアーキテクチャ——中間ファイルがプロトリンカだった

```
ソースファイル群
    ↓ パス1 (lint.c + /usr/src/cmd/mip)
中間ファイル (関数シグネチャの記録)
    ↓ sort (名前順)
    ↓ パス2 (lpass2.c)
警告メッセージ
```

パス1はCコンパイラのフロントエンドとほぼ同じ処理をして、コードを生成する代わりに関数シグネチャを中間ファイルに書き出す。パス2はその中間ファイルを読んで宣言と定義の矛盾を探す。

この設計はリンカに似ている。リンカが未定義シンボルを検出するように、lintのパス2は型の不一致を検出する。**lintは型情報を扱うプロトリンカだった**。

1977年のヘッダファイルのない世界では、プログラマが「この関数は `int` を返すと宣言したが、別のファイルでは `char *` を返すと使っている」というバグを自動で発見する手段がなかった。lintが初めてその手段を提供した。

---

## contx()——式コンテキストの解析

`lint.c` の `contx()` 関数は、式が「値として使われているか」「副作用として使われているか」を追跡する。

```c
contx( p, down, pl, pr ) register NODE *p; register *pl, *pr; {

    *pl = *pr = VAL;
    switch( p->op ){

    case ANDAND:
    case OROR:
    case QUEST:
        *pr = down;
        break;
    ...
    default:
        if( asgop(p->op) ) break;
        if( down == EFF && hflag ) werror( "null effect" );
    }
}
```

`VAL` は「式が値として評価される」コンテキスト、`EFF` は「式が副作用のために実行される」コンテキストだ。`if( down == EFF && hflag ) werror( "null effect" )` は「副作用を期待している場所に、副作用のない式がある」という警告だ。`x + 1;` のような文のことだ。

`-h` フラグ（`hflag`）で有効になる。1977年に「null effect」という概念を静的解析で検出していた。

---

## 鑑定

```
初版       : 1977年（Bell-32V収録）
作者       : Stephen C. Johnson（Bell Telephone Laboratories）
実装       : C（pcc共有コード + lint固有パス）
アーキテクチャ: 2パス（lint.c→中間ファイル→lpass2.c）
共有コード   : /usr/src/cmd/mip (pcc / ポータブルCコンパイラと共通)
/* LINTLIBRARY */: ライブラリインターフェース定義マーカー
/* VARARGS */   : 可変長引数関数の型チェック免除、stdarg.hの前身
-p フラグ    : SZINT=16の16ビット環境を仮定した移植性チェック
struct line  : 8文字名・50引数・100文字ファイル名のシグネチャ記録
```

Stephen Johnsonは1975年にyaccを書き（#070）、1977年にlintを書いた。コンパイラを生む道具と、コードの欠陥を見つける道具を同じ人間が作った。

yaccが「文法からパーサを生成する」という抽象化を提供したように、lintは「コンパイルせずに型整合性を検査する」という抽象化を提供した。どちらもコードを機械語に変換する以外の目的でプログラムを読む、という概念の実装だ。

`/* VARARGS */` コメントはlintのアノテーション体系の出発点だ。現代の `[[nodiscard]]`、`__attribute__((format(...)))`、型ヒント、そしてLSPのdiagnosticsまで、「コードに意味を付加して自動検査に使う」という思想の起点がここにある。

lintはコンパイラと同じソースから生まれ、コンパイラが見逃すものを見た。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
