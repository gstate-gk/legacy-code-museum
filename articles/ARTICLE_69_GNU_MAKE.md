# タブ文字の呪い——GNU Make という35年の共犯者

## はじめに

世界中のプログラマーが、毎日呪っている。

```
Makefile:12: *** missing separator.  Stop.
```

原因はほぼ決まっている。**タブ文字の代わりにスペースを使ってしまった。**

GNU Make の Makefile では、コマンド行を「タブ文字で始める」というルールがある。スペース8個ではない。タブ1個でなければならない。目には見えない。エラーメッセージは行番号しか教えてくれない。

このルールは 1976年、Stuart Feldman が最初の `make` を書いたときに生まれた。後に Feldman 自身がその理由を語っている。

「最初のバージョンをリリースしたら、あっという間にユーザーが数十人ついてしまった。タブの仕様を変えようとしたが、もう遅かった。**それが私のキャリア最大の後悔の一つだ。**」

GNU Make はその「呪い」を 1988年から今日まで忠実に受け継いでいる。

---

## 発掘された痕跡

`mirror/make` リポジトリの `Release1` タグに、1988年4月23日のコミットが残っている。

```
Initial revision
This version was distributed by RMS in `binutils.tar'.
```

RMS——Richard M. Stallman。GNU の創始者が `binutils.tar` に同梱して配布した、最初の GNU Make だ。

### 痕跡1：タブの「仕様」が書かれた 1988年の文書

`Release1` タグには `make.texinfo` しかない。ソースコードではなく、マニュアルだけが最初に公開された。そこにタブの定義が書かれている。

```
After each line containing a target and dependencies come one or more lines
of shell commands that say how to update the target file.  These lines
start with a tab to tell make that they are command lines.
But make does not know anything about how the commands work.  It is up
to you to supply commands that will update the target file properly.
```

「コマンド行はタブで始まる。make はコマンドの内容を何も知らない。」

そしてもう一箇所、より重要な記述がある。

```
Extra spaces are allowed and ignored at the beginning of the line,
but a tab is not allowed.
(If the line begins with a tab, it will be considered a command line.)
```

**スペースは許される。タブは許されない**——ただし、それは変数定義行の話だ。コマンド行はその逆で、タブしか許されない。

この「タブとスペースで意味が変わる」という設計が、35年にわたるプログラマーの悲鳴を生んだ。

### 痕跡2：`read.c` ——タブを検出する心臓部

`read.c`（Makefile を読み込む処理）の核心部分がある。

```c
/* Check for a shell command line first.
   If it is not one, we can stop treating tab specially.  */
if (line[0] == '\t')
  {
    if (no_targets)
      /* Ignore the commands in a rule with no targets.  */
      continue;

    /* If there is no preceding rule line, don't treat this line
       as a command, even though it begins with a tab character.
       SunOS 4 make appears to behave this way.  */

    if (filenames != 0)
      {
        /* Append this command line to the line being accumulated.  */
```

そして、ターゲットなしでタブ行が現れたときのエラー。

```c
/* This line starts with a tab but was not caught above
   because there was no preceding target, and the line
   might have been usable as a variable definition.
   But now we know it is definitely lossage.  */
fatal(fstart, _("commands commence before first target"));
```

「`lossage`」——「ひどい状態」を意味する MIT ハッカー用語だ。

### 痕跡3：`default.c` ——「知らないことを知っている」暗黙ルール

GNU Make の最も強力な機能の一つが「暗黙ルール（implicit rules）」だ。`default.c` にその全リストが書かれている。

```c
/* This is the default list of suffixes for suffix rules.
   `.s' must come last, so that a `.o' file will be made from
   a `.c' or `.p' or ... file rather than from a .s file.  */

static char default_suffixes[]
  = ".out .a .ln .o .c .cc .C .cpp .p .f .F .r .y .l .s .S \
.mod .sym .def .h .info .dvi .tex .texinfo .texi .txinfo \
.w .ch .web .sh .elc .el";
```

`.c` から `.o` を作る方法、`.y`（yacc）から `.c` を作る方法、`.tex` から `.dvi` を作る方法——全て「書かなくても分かっている」。

さらに RCS（バージョン管理システム）との統合まである。

```c
/* RCS.  */
{ "%", "%,v",
    "$(CHECKOUT,v)" },
{ "%", "RCS/%,v",
    "$(CHECKOUT,v)" },
```

ファイルが存在しなくても、RCS リポジトリにあれば自動的にチェックアウトする。1988年当時のソフトウェア開発環境が、`default.c` の中に化石として残っている。

### 痕跡4：`main.c` ——著作権表示に刻まれた歴史

```c
/* Argument parsing and main program of GNU Make.
Copyright (C) 1988, 1989, 1990, 1991, 1994, 1995, 1996, 1997, 1998, 1999,
2002 Free Software Foundation, Inc.
```

著作権表示の年号が、GNU Make の歴史そのものだ。1988年から始まり、1992〜1993年が抜けている（ほとんど変更がなかった年）。`main.c` の中に、35年の開発史が刻まれている。

### 痕跡5：Amiga 対応——移植の広さが見える

`default.c` のコメント：

```c
#ifdef __MSDOS__
#define GCC_IS_NATIVE
#endif
```

```c
#ifdef VMS
  = ".exe .olb .ln .obj .c .cxx .cc .pas .p .for .f .r .y .l .mar \
.s .ss .i .ii .mod .sym .def .h .info .dvi .tex .texinfo .texi .txinfo \
.w .ch .cweb .web .com .sh .elc .el";
```

MS-DOS、VMS（DEC の OS）、Amiga（`README.Amiga`）——Unix 以外のプラットフォームへの対応が随所に見える。GNU Make は「Unix のツール」ではなく、「どこでも動くビルドツール」を目指していた。

### 痕跡6：コミットメッセージに残った誤字

`Release2`（1988年6月28日）のコミットメッセージ：

```
* Fixed a minor grammaticaly error.
* Second release.
```

`grammatically` の綴りが `grammaticaly` と間違っている。

文法エラーを修正したコミットのコミットメッセージに文法エラー。**1988年、Roland McGrath が急いでいた**ことが伝わってくる。

---

## 年表

**1976年**: Stuart Feldman（Bell Labs）、最初の `make` を書く。タブ文字ルールが生まれる。「あっという間にユーザーが数十人ついてしまい、変えられなくなった」。

**1988年4月23日**: Richard Stallman と Roland McGrath、GNU Make として書き直す。`binutils.tar` に同梱して配布。コミットメッセージ：「Initial revision」。

**1988年6月28日**: Release2。`grammaticaly`（誤字）というコミットメッセージ付きで第2版リリース。

**1991年**: Version 3.62。マルチプラットフォーム対応が本格化。

**2002年**: Version 3.80。現在も多くのディストリビューションで使われるバージョン。

**2014年**: Version 4.0。`--output-sync` オプション追加（並列ビルド時の出力を整列）。

**現在**: Linux カーネル、GCC、Python、Git——世界の主要なオープンソースプロジェクトのビルドを支える。

---

## AI 解析データ

| 指標 | 値 |
|:---|---:|
| 実装言語 | C |
| 初版リリース日 | 1988年4月23日（GNU版） |
| 起源 | Stuart Feldman 版 make（1976年、Bell Labs） |
| Release1 の内容 | `make.texinfo` のみ（ソースなし） |
| Release2 コミットの誤字 | `grammaticaly`（正：grammatically） |
| タブルール誕生年 | 1976年（Feldman の後悔） |
| 主な移植先 | Unix, MS-DOS, VMS, Amiga, Windows |
| 現在のバージョン | 4.4.1（2023年） |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.058
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】GNU Make (1988, C)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年4月

■ 鑑定結果
  希少度:          ★★★☆☆
  技術的負債密度:    ★★★★★
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★☆
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★☆☆

GitHub の `mirror/make` リポジトリで `Release1`（1988年）から現在まで全て閲覧できる。コードは現役で、消えた伝説ではない。「希少」というより「普遍」——世界中のビルドシステムの共通基盤として今日も動いている。

### 技術的負債密度: ★★★★★

タブ文字ルール。これに尽きる。Stuart Feldman が「最大の後悔の一つ」と言い、世界中のプログラマーが毎日呪い、IDE が「タブを可視化する」機能を実装し、YAML（インデントに意味を持つ）が同じ轍を踏んだ。最も有名な技術的負債の一つであり、50年近く「変えられない」まま生き続けている。

### 考古学的価値: ★★★★★

Linux カーネル、GCC、GNU Coreutils——世界のオープンソースエコシステムの根幹をなすプロジェクトが、今日も `make` でビルドされている。`default.c` に化石として残る RCS 統合、Amiga 対応、VMS サポート。1988年当時のソフトウェア開発環境の地層がそのままコードに残っている。

### 読み物としての面白さ: ★★★★☆

「タブの呪い」と Feldman の後悔は伝説だ。しかし `grammaticaly` という誤字コミット、`lossage` というハッカー用語、Amiga 対応のコード——読んでいくと、1988年の開発現場の空気が伝わってくる。「完璧な設計よりも、動くものを今すぐ」という GNU の実用主義が随所に滲む。

---

## 鑑定人所見

タブ文字は見えない。

`make`命令を打つとき、プログラマーはターゲット行とコマンド行を肉眼で区別している。しかし Makefile が要求するのは文字コード 0x09——水平タブ。それが 0x20（スペース）の連続であっても、画面では同じように見える。

Stuart Feldman はそのことに気づかなかった——あるいは、気づいたときにはもう遅かった。1976年、リリースした翌週にユーザーが数十人ついてしまった。インターネットのない時代に、それだけのスピードで広まった。

GNU Make はその「間違い」を 1988年に継承し、世界に広めた。今日、Linux カーネルの Makefile は何万行もあり、全てのコマンド行がタブで始まる。それを変えることは誰にもできない。

**「コードは書いた人間より長生きする」**——Make のタブルールはその最も極端な例だ。Feldman はまだ生きており、毎日どこかで誰かが彼の設計に呪いをかけている。

しかし同時に、その「間違い」がなければ、GNU Make はここまで普及しなかったかもしれない。互換性を保ち続けたからこそ、50年間の信頼が積み上がった。

**呪いと遺産は、同じものの表と裏だ。**

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
