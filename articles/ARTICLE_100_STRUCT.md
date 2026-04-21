# 消せるものだけ消す——Fortran 66のGOTOをRatforのWHILE/UNTILに変換する4フェーズ構造化器と、`implicit`ラベルが統一した制御フロー

## はじめに

`4.out.c` の中核にこういう関数がある。

```c
outrat(v)   /* output Ratfor */
```

`outrat`——出力するのはRatforだ。

structは「Fortranを構造化する」ツールだが、出力先はFortranではなくRatfor（#078）だ。GotoだらけのFortran 66をRatforのWHILE/UNTIL/breakに変換し、その出力をratfor（#078）がFortran 77形式に変換し、f77（#080）がコンパイルする——3段のパイプラインの最初の段がstructだ。

```
[Fortran 66 + GOTO] → struct → [Ratfor] → ratfor → [Fortran 77] → f77 → [実行ファイル]
```

Bell Labsは「Fortranを近代化する」ために3つのツールを作った。structはその入口だ。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C（53ファイル、~141KB）
- **年**: Bell-32V版（1979年）

```
struct — 2つの実行ファイルをパイプで繋ぐ
  structure  — 本体（フェーズ0〜4、36ファイル）
  beautify   — 後処理整形器（beauty.y + lextab.l + tree.c + bdef.c）
  struct.sh  — 2つをパイプで繋ぐシェルスクリプト
```

---

## 4フェーズの構成

ファイル名のプレフィクス（`0.`〜`4.`）がそのままパイプライン段階を示す。

| フェーズ | 処理 | 主要ファイル |
|---------|------|------------|
| 0 | ユーティリティ層（アロケータ・引数パーサ・ノード型定義） | 0.alloc.c, 0.args.c, 0.parts.c |
| 1 | Fortranテキスト → 制御フローグラフ | 1.fort.c, 1.recog.c, 1.tables.c |
| 2 | グラフ → 構造木（支配木計算） | 2.dfs.c, 2.dom.c, 2.head.c, 2.tree.c |
| 3 | 構造木の意味的変換（WHILE/UNTIL/break判定） | 3.loop.c, 3.then.c, 3.branch.c |
| 4 | 構造木 → Ratforテキスト出力 | 4.out.c, 4.brace.c, 4.form.c |

`2.main.c` の `build()` がオーケストレーションする。

```c
dfs(START);           /* 深さ優先探索、後退辺→LOOPVXに変換 */
gethead(head);        /* 各ノードが属する最小ループを特定 */
getinarc(inarc,head); /* 前向き入弧のみ収集 */
getdom(inarc,dom);    /* 即時支配ノード計算（Hecht-Ullmanアルゴリズム） */
gettree(inarc,dom,head); /* 制御構造木を生成 */
```

---

## 22種のノード型

`0.parts.c` に22種のノード型が定義されている。

```c
STLNVX    /* 文（statement） */
IFVX      /* IF文 */
DOVX      /* DOループ（Fortranのネイティブ構文） */
WHIVX     /* WHILE（変換後） */
UNTVX     /* REPEAT-UNTIL（変換後） */
LOOPVX    /* ループ（WHILE/UNTILどちらか未確定） */
ITERVX    /* ループの反復部分 */
GOVX      /* GOTO（変換できなかった残留） */
BRKVX     /* break（変換後） */
NXTVX     /* next（continue、変換後） */
SWCHVX    /* switch/case */
...
```

**`DOVX` はそのまま通過する**——Fortranの `DO` 文は構造化済みなので変換不要だ。変換が必要なのは `GOTO` で実装されたループだけ。

---

## `implicit`——fall-throughを値0で統一する

Fortranには「次の行に暗黙的に流れる」という概念がある。`1.recog.c` はこれを `implicit` という特別ラベル（値0）で表現する。

```c
/* Fortranの暗黙フロー（fall-through）も GOTO も同じ機構で処理する */
#define IMPLICIT 0   /* 次の文への暗黙的な流れ */
```

`GOTO 100` も「次の行に流れる」も、制御フローグラフ上では同じ「辺（アーク）」として表現される。`implicit` ラベルを使うことで、GOTOとfall-throughを区別せずに統一的に処理できる——これがフェーズ1の設計の核心だ。

---

## Hecht-Ullmanアルゴリズムによる支配木計算

```c
/* 2.dom.c */
/* Algorithm is from Hecht and Ullman, Analysis of a simple algorithm
   for global flow analysis problems */
```

コード全体で唯一の文献引用がここにある。

支配木（dominator tree）計算は制御フロー解析の基盤だ。ノードAがノードBを「支配する」とは、スタートからBへの全経路がAを通ること——AがなければBに到達できない。この関係を使ってループの境界を特定し、構造化の単位を決める。

グラフが簡約不能（irreducible、GOTOが複雑に絡まっている）な場合も、「簡約可能とみなして処理を続行する」とコメントに記されている。完全な変換を保証しないが、実用上は多くのFortranプログラムで機能する。

---

## `REACH(v)` の多重利用——フェーズをまたぐ再定義

同じフィールドが局面によって意味を変える。

```c
/* 3.def.h */
#define LABEL(v) REACH(v)   /* フェーズ3後半: ラベル番号として再利用 */
```

`REACH(v)` はフェーズ2では「唯一の脱出先ノード」を指すが、フェーズ3後半では同じフィールドが「ラベル番号」として再定義される。

16bitアドレス空間の制約時代、グラフ全体を複数コピー持つ余裕はなかった。フェーズが進むにつれて古い意味が不要になる——その瞬間に同じメモリを別の意味で使う。`#define` による再定義がその設計を明示している。

---

## WHILE か UNTIL か——`getloop()` の判定

`3.loop.c` の `getloop()` がループの意味を確定する。

**WHILE への変換**（`getwh()`）:

```
LOOPVX
  ITERVX
    IFTHEN { goto exit }   ← ループ先頭にIF-goto
    <ループ本体>
```

このパターンを検出したら `WHIVX` に変換。出力は `WHILE (cond) {...}`。

**REPEAT-UNTIL への変換**（`getun()`）:

```
LOOPVX
  ITERVX
    <ループ本体>
    IF(cond) goto exit   ← ループ末尾にIF-goto
```

このパターンなら `UNTVX` に変換。出力は `REPEAT {...} UNTIL (cond)`。

どちらでもない場合は `LOOPVX` のまま、`REPEAT {...}` （無限ループ）として出力する。

---

## 「消せるものだけ消す」設計

structは「完全にGOTOを消す」ことを目指していない。

```c
/* 変換できなかった GOTO は GOVX として残る */
case GOVX:
    fprintf(outfd, "go to %d\n", LABEL(v));
```

多重脱出、複雑なジャンプ、簡約不能なグラフ——これらは変換できない。structは変換できるものを変換し、できないものはそのまま `go to NNN` として出力する。

変換できた部分だけがWHILE/UNTILになる。残ったGOTOはratfor（#078）を経由してf77がコンパイルする——GOK（God Only Knows）として通過させたRatforの哲学と同じだ。

---

## beautify——Ratfor出力の後処理

structの出力Ratforを `beautify` が整形する。`lextab.l` がFortranの比較演算子を変換する。

```
.GT.  →  >
.LE.  →  <=
.EQ.  →  ==
```

putback(">=") のようにlex定義でそのまま変換——Ratfor（#078）の演算子変換（#084）と同じ発想だが、方向が逆だ。Ratforは `==` を `.eq.` に変換する。beautyは `.LE.` を `<=` に変換する。

---

## Fortran近代化の3段パイプライン

Bell Labsが設計したFortran近代化の全体像が見えてくる。

```
struct  (1977) — GOTO依存のFortran 66 → Ratfor
                 Hecht-Ullman支配木 + 22種ノード変換
    ↓
ratfor  (1974) — Ratfor → Fortran 77スタイル
                 GOK設計で制御フローだけを触る
    ↓
f77     (1978) — Fortran 77 → オブジェクトファイル
                 FAMILY==SCJ、pccの第2パスで動く
```

structの開発（1977年）はratfor（1974年）の後、f77（1978年）の前だ。ratforが「CをFortranで書く道」を開き、structが「古いFortranをratforに変換する道」を開いた。f77がその全てをコンパイルする。

---

## 鑑定

```
実装       : C（53ファイル、~141KB）
構成       : structure（4フェーズ）+ beautify（整形）をパイプで接続
フェーズ1  : 手書き状態機械145状態でFortranを制御フローグラフに変換
フェーズ2  : Hecht-Ullmanアルゴリズムで支配木計算、LOOPVXを機械的に挿入
フェーズ3  : LOOPVX→WHIVX/UNTVX判定、GOVX→BRKVX/NXTVX変換
フェーズ4  : 22種ノードをRatfor構文にマッピング（outrat()）
implicit   : fall-throughを値0で統一、GOTOと同じ機構で処理
REACH(v)   : フェーズをまたいで脱出先→ラベル番号として再定義
「消せるもの」: WHILE/UNTIL/break/nextに変換。複雑なGOTOは残留
出力       : Ratfor（#078）形式——struct→ratfor→f77の3段パイプライン
後継       : FORESYS（Fortran restructurer, 1990年代）
```

**structはFortranの時間旅行者だ。**

1966年のGOTOを1974年のRatforに変換し、1978年のf77がコンパイルする。Bell Labsが設計した近代化パイプラインの入口に立ち、「消せるものだけ消す」という誠実な設計で、24年分の制御フローの差を埋める。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
