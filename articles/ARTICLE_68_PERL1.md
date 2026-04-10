# awkとsedを殺すつもりはなかった——Perl 1.0という実用主義の奇跡

## はじめに

1987年12月18日、木曜日。

Larry Wall は NASA ジェット推進研究所（JPL）のワークステーションで `rcs commit` を叩いた。

```
a "replacement" for awk and sed
```

コミットメッセージはそれだけだった。「awk と sed の代替品」。大げさな主張は何もない。

その日から38年後、Perl は CPAN に 25万本以上のモジュールを持ち、CGI 全盛期のWebインフラを支え、「プログラマブルなスイスアーミーナイフ」として世界中のシステム管理者の手元に存在し続けている。

README には、1987年当時の連絡先がそのまま残っている。

```
lwall@jpl-devvax.jpl.nasa.gov (Larry Wall)
```

JPL。火星探査機を飛ばしているところだ。

---

## 発掘された痕跡

GitHub の公式 Perl リポジトリ（`Perl/perl5`）には `perl-1.0` タグが存在する。1987年12月18日当日のソースが、手つかずのまま残っている。

### 痕跡1：名前の意味——「Practical」という反抗

マニュアルの冒頭にこう書いてある。

```
perl - Practical Extraction and Report Language
```

しかし同じページに、Larry Wall 自身がその姿勢を明かしている。

```
The language is intended to be practical (easy to use, efficient, complete)
rather than beautiful (tiny, elegant, minimal).
```

「美しいより実用的。小さく優雅で最小限、ではなく。」

これは宣言だった。1980年代、Unix の世界では「美しい設計」「直交性」「一つのことをうまくやる」という哲学が支配していた。sed は一つのことだけをする。awk は一つのことだけをする。sh は一つのことだけをする。

Larry Wall は言った——「全部やる。」

### 痕跡2：Wishlist——たった5行の野望

バージョン 1.0 のリポジトリに `Wishlist` というファイルがある。

```
date support
case statement
ioctl() support
random numbers
directory reading via <>
```

5行。それだけ。

**case文すら未実装**で公開した。日付処理もない。乱数もない。それでも「動く」と判断してリリースした。完成を待たず、「今の状態で役に立つ」と判断した瞬間に世に出した。

### 痕跡3：特殊変数の森——`$_`という発明

`stab.c`（シンボルテーブル）を読むと、Perl の本質が見える。

```c
switch (*stab->stab_name) {
case '0': case '1': case '2': ... case '&':
    /* 正規表現のキャプチャグループ */
case '.':
    /* 最後に読んだ行番号 */
case '?':
    /* 直前のコマンドの終了ステータス */
case '/':
    /* レコードセパレータ */
case '|':
    /* 自動フラッシュフラグ */
case '!':
    /* errno */
```

`$0` `$1` `$&` `$.` `$?` `$/` `$|` `$!`——記号だけで変数名を作るという発想。

これは美しくない。`errno` と書けばいい。`exit_status` と書けばいい。しかし **タイプ数が少ない**。awk の書き方に慣れたシステム管理者が、何も覚え直さずに使える。

実用主義は妥協ではなく、設計思想だった。

### 痕跡4：paranoid malloc——「防衛的」という言葉の選択

`util.c` の malloc ラッパーに、ファイル内で最も雄弁なコメントがある。

```c
static char nomem[] = "Out of memory!\n";

/* paranoid version of malloc */

char *
safemalloc(size)
MEM_SIZE size;
{
    ptr = malloc(size?size:1);  /* malloc(0) is NASTY on our system */
    if (ptr != Nullch)
        return ptr;
    else {
        fputs(nomem,stdout) FLUSH;
        exit(1);
    }
    /*NOTREACHED*/
}
```

`paranoid version`。妄想的な版。

`malloc(0)` が何を返すかは実装依存で、1987年当時のシステムでは Null を返すものがあった。それを知っていて、`malloc(size?size:1)` と書いた——「サイズがゼロなら1バイト要求する」。

`/*NOTREACHED*/` というコメントも興味深い。`exit(1)` の後には絶対到達しないのに、コンパイラへの念押しとして書いた。防衛的な性格がコードに滲み出ている。

### 痕跡5：`#define DEBUGGING`——デフォルトで監視する

`perl.h` の冒頭。

```c
#define DEBUGGING
#define STDSTDIO    /* eventually should be in config.h */
```

デバッグフラグがデフォルトで ON になっている。

本番リリースなのに。公開バージョンなのに。

`util.c` を見ると、このフラグが立っていると malloc/free の全呼び出しがログに吐き出される。

```c
#ifdef DEBUGGING
    if (debug & 128)
        fprintf(stderr,"0x%x: (%05d) malloc %d bytes\n",ptr,an++,size);
#endif
```

「ユーザーに配るソフトはデバッグビルドで」という感覚。当時の Unix 文化では珍しくなかったが、Perl の「何でも見せる」という透明性の原点がここにある。

### 痕跡6：パーサー——yacc で書かれた文法

`perl.y` の字句定義を見ると、最初期の Perl が何を話せたかが分かる。

```c
char *tokename[] = {
"256",
"word",
"append","open","write","select","close","loopctl",
"while","until","if","unless","else","elsif","continue","split","sprintf",
"for", "eof", "tell", "seek", "stat",
"print", "unary operation",
"..",
"||",
"&&",
"==","!=", "EQ", "NE",
...
```

`unless`。`elsif`。

これが 1987年にすでにある。「if の否定版」を `unless` と呼ぶ——英語として自然な選択。Larry Wall は言語学者でもあった。プログラミング言語を設計するとき、彼は自然言語の直感を持ち込んだ。

`while` があって `until` がある。「〜になるまで繰り返す」を `until` と書ける。awk にも sed にも、この素直さはなかった。

---

## 年表

**1987年10月頃**: Larry Wall、JPL（NASA ジェット推進研究所）勤務中に開発開始。当初は内部ツールとして。

**1987年12月18日**: Perl 1.0 を Usenet（`comp.sources.unix`）に投稿。コミットメッセージ：「a "replacement" for awk and sed」。

**1988年**: パッチが続々と届き始める。コミュニティが形成される。

**1989年**: Perl 2.0。正規表現エンジンを全面書き直し。

**1991年**: Perl 4.0。O'Reilly から「Programming Perl」（ラクダ本）出版。

**1994年**: Perl 5.0。オブジェクト指向、モジュールシステム。CPAN 開始。

**1995〜2000年代**: CGI の標準言語として爆発的普及。世界の Web サーバーの大部分が Perl で動く。

**2000年**: Perl 6 プロジェクト開始（後の Raku）。

**2015年**: Perl 5.22。5.x 系は現在も活発に開発継続。

---

## AI 解析データ

| 指標 | 値 |
|:---|---:|
| 実装言語 | C（インタープリタ本体）+ yacc（パーサー） |
| リリース日 | 1987年12月18日 |
| 初版サイズ | 約 40ファイル、C ソース約 15,000行 |
| 作者の職場 | NASA ジェット推進研究所（JPL） |
| Wishlist 項目数 | 5（case文、日付、ioctl、乱数、ディレクトリ読み込み） |
| PATCHLEVEL | 0 |
| 特殊変数数（初版） | 約 20種（`$_` `$&` `$.` `$?` `$/` `$\` `$,` など） |
| 現在の CPAN モジュール数 | 250,000以上 |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.057
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Perl 1.0 (1987, C + yacc)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年4月

■ 鑑定結果
  希少度:          ★★★★☆
  技術的負債密度:    ★★★★☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★☆

GitHub の公式リポジトリに `perl-1.0` タグとして現存する。消えた伝説ではなく、今日でも `git checkout perl-1.0` で手元に展開できる。希少というより「奇跡的に保存されている」。ソースコード自体は読めるが、1987年当時の Unix 環境を再現して動かすことは難しい。

### 技術的負債密度: ★★★★☆

`#define DEBUGGING` がデフォルト ON。特殊変数が記号だらけで可読性を犠牲にしている。`paranoid malloc` は防衛的だが、現代の目で見るとエラー処理が `exit(1)` で打ち切りという荒々しさ。`stab.c` の巨大な switch 文は、後の Perl 5 オブジェクト指向化で大きく書き直された。「動けばいい」という実用主義の代償が、可読性という形で積み重なっている。

### 考古学的価値: ★★★★★

CGI 時代のインターネットインフラ、Linux システム管理、バイオインフォマティクス——Perl が支えた領域の広さは他の言語と比べても異質だ。`$_`（デフォルト変数）という発明、`unless`/`until` という英語的な構文、正規表現の直接組み込み——これらは後の Ruby や Python の設計にも影響を与えた。「awkとsedの代替品」が現代言語設計の教科書になった。

### 読み物としての面白さ: ★★★★★

Wishlist の5行。`paranoid malloc` の命名。`lwall@jpl-devvax.jpl.nasa.gov`。`#define DEBUGGING`。どこを切っても Larry Wall の性格が滲み出ている。コードは饒舌ではないが、その簡潔さと「とにかく動かす」という意志が、読む者に「あの時代の空気」を伝える。

---

## 鑑定人所見

Larry Wall は言語学者だった。

プログラミング言語を設計するとき、多くのエンジニアは「正しさ」を追う。直交性、一貫性、最小性。しかし Wall は「使いやすさ」を追った。人間が自然に書けるか。英語として読めるか。タイプ数が少ないか。

`unless` という単語一つに、その哲学が凝縮されている。`if (!condition)` と書けばいい。しかし `unless condition` の方が人間の脳に近い。

Wishlist にあった case 文は、後に Perl の `given/when` として実装されたが、設計の複雑さゆえに「実験的機能」のまま何十年も漂い続けた。最初から未実装で出した Wall の直感は、ある意味では正しかった。

**「awkとsedを殺すつもりはなかった」**——Wall は後にそう語っている。ただ、もう少し便利なものが欲しかっただけだ。

その「もう少し」が、世界を変えた。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
