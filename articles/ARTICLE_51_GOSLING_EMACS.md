# フリーソフトを売った男と、それを許さなかった男——一つのエディタがGPLを生んだ

## はじめに

GitHubの片隅に「分岐点」のコードを見つけた。

**Gosling Emacs**。1981年、カーネギーメロン大学の大学院生 James Gosling が C 言語で書いた、Unix 上で動く最初の Emacs 互換エディタだ。

約10,891行。706ファイル。拡張言語は **Mocklisp**——「CONS のない Lisp」と自嘲される偽物の Lisp。

Gosling はこのエディタをフリーで配布した。誰でもコピーできた。しかし1983年、彼はこのコードを **UniPress** 社に売却した。UniPress は $395 で販売を開始した。

Richard Stallman は怒った。

Stallman は自分の GNU Emacs に Gosling Emacs のコードの一部を使っていた。UniPress は配布停止を要求した。Stallman は論争になったコードを **1週間半で全面書き直し**、「元のより短く、速く、明確だ」と述べた。

そしてこの紛争から、**GPL（GNU General Public License）** が生まれた。

「フリーソフトが将来このような方法で私有化されるのを防ぐため、GPL を発明した」——Stallman、1986年。

一つのエディタの所有権争いが、現代のオープンソース文化の根幹を生んだ。

---

## 「この残虐行為をお届けするのは」

ソースコードの冒頭——

```c
/* Yes folks!  This is it!  A for-real Unix Emacs!  With
   all (well...) those features we've come to know and love.

        This atrocity brought to you by:
            James Gosling
            October, 1980
            @ CMU
*/
```

「皆さん！これです！本物の Unix Emacs です！（まあ…）おなじみの機能を全部搭載。**この残虐行為をお届けするのは James Gosling、1980年10月、CMU にて。**」

「atrocity（残虐行為）」。後に Java を創ることになる男が、自分のコードをこう呼んだ。

---

## 発掘された痕跡

### 痕跡1：ドクロマーク付きの警告——「理解したと思うなら、していない」

`display.c` の冒頭に、ドクロのASCIIアートが描かれている——

```
         **************
         *  BEWARE!!  *
         **************

        All ye who enter here:
    Most of the code in this module
       is twisted beyond belief!
           Tread carefully.
    If you think you understand it,
              You Don't,
            So Look Again.
```

**「ここに入る者すべてに告ぐ：このモジュールのコードの大部分は、信じられないほど歪んでいる。慎重に歩め。理解したと思うなら、していない。だからもう一度見ろ。」**

この `display.c` のコードが、後の著作権紛争の中心となる。低速端末で最小コストの画面更新を行う動的計画法アルゴリズム。Gosling はこのアルゴリズムの論文を1981年の ACM SIGPLAN Symposium で発表した。

### 痕跡2：Mocklisp——CONS のない Lisp

```c
/* Unix Emacs MLisp (Mock/Minimal Lisp).
   This atrocity is used for writing extensions to Emacs.

   MLisp is Lisp without the CONS function, and all that that implies.
   (including the fact that MLisp programs are not MLisp data structures) */
```

**「MLisp は CONS のない Lisp であり、それが意味する全てを含む（MLisp プログラムは MLisp のデータ構造ではないという事実を含む）。」**

CONS がない——つまりリストが作れない。Lisp の見た目をしているが、「プログラム = データ」というホモイコニシティが根本的に欠如している。

Stallman が GNU Emacs で最初にやったことは、この Mocklisp を **本物の Emacs Lisp** に置き換えることだった。

### 痕跡3：「卒業か、Mr. Emacs のまま生きるか」

Gosling が Emacs を売った理由は、金銭目的ではなかった。

Gosling 自身の証言（2019年、Hacker News）——

> *「私は『Mr. Emacs のまま生きるか、卒業するか』の選択に直面していた。MIT や UCLA の人々に保守を頼んだが、誰も引き受けなかった。UniPress の二人が『大学には無料で、その他には良心的な価格で』という条件で引き受けた。」*

PhD を取って Sun Microsystems に進み、後に **Java** を創る。Gosling にとって Emacs は「卒業前の仕事」だった。

### 痕跡4：Stallman のコード書き直し——1週間半の伝説

紛争の核心は `display.c` の動的計画法コードだった。

Stallman は GNU Emacs v16.56（1985年7月）で、Gosling 由来のコードを **全て削除** した。論争になったアルゴリズムを約1週間半で全面書き直し、「元のより短く、速く、明確で、拡張性が高い」と述べた。

### 痕跡5：UniPress の致命的な確信

UniPress は Stallman や FSF を訴えなかった。

理由——**「アマチュアや学者が、自分たちに勝てる商品を作れるはずがない」**。

しかし GNU Emacs は無料かつ高機能で、1985〜86年にかけて UniPress Emacs を **市場から完全に駆逐した**。

### 痕跡6：GPL の誕生

この紛争から Stallman が学んだ教訓——

**「著作権のないフリー配布は、誰かが著作権を主張して商業化した瞬間に消える。」**

解決策——利用・改変・再配布の自由を **法的に保証** し、かつその自由を次の利用者にも **強制する** 仕組み。コピーレフト。それが GPL となった。

> *「フリーなコードが将来このような方法で私有化されるのを防ぐため、GPL を発明した。」*
> ——Richard Stallman, 1986年

### 痕跡7：大学ごとの拡張が残っている

リポジトリの `maclib/` ディレクトリには、各大学が独自に追加した拡張が残っている——

```
maclib/stanford/
maclib/utah/
maclib/purdue/
```

スタンフォード、ユタ、パデュー。フリー配布された時代に、各大学が自分たちの環境に合わせてカスタマイズした痕跡だ。**フリーソフトウェアの「フォーク」文化の原型**がここにある。

---

## Emacs の系譜

```
TECO (MIT PDP-10, 1960s)
  ↓
EMACS macros for TECO (Stallman, 1976) — 最初のEmacs
  ↓
Multics Emacs (Bernie Greenberg, 1978) — 初のLisp拡張Emacs
  ↓
Gosling Emacs (James Gosling, 1981, C + Mocklisp)
  → UniPress Emacs (1983, $395)
  ↓
GNU Emacs (Stallman, 1985, C + Emacs Lisp) — GPLで配布
  → UniPress Emacsを市場から駆逐
```

---

## 推定される経緯

**1980年10月**: Gosling、CMU で Emacs の開発開始。

**1981年**: Gosling Emacs 完成。フリーで配布開始。

**1983年**: UniPress に売却。$395 で販売開始。

**1984年**: Stallman、GNU プロジェクトを開始。

**1985年3月**: GNU Emacs v15.34 に Gosling Emacs のコード一部を使用。

**1985年**: UniPress が配布停止を要求。Stallman が1週間半で書き直し。

**1985年7月**: GNU Emacs v16.56 で Gosling 由来コード完全削除。

**1989年**: GPL v1 公開。

**1995年**: Gosling、Sun Microsystems で Java をリリース。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| 実装言語 | C |
| ソースコード | 約10,891行（主要Cファイル） |
| 総ファイル数 | 706 |
| 拡張言語 | Mocklisp（CONS なし Lisp） |
| 画面更新 | 動的計画法（最小コスト経路） |
| バージョン | #85 |
| 作者 | James Gosling (CMU) |
| 商用版 | UniPress Emacs ($395) |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.040
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Gosling Emacs (1981, C / Unix)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年3月

■ 鑑定結果
  希少度:          ★★★★★
  技術的負債密度:    ★★★★☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★★
Unix 最初の Emacs 互換エディタのソースコード。フリー→商用化→GPLの系譜の中間点。Mocklisp という消滅した拡張言語。

### 技術的負債密度: ★★★★☆
ドクロマーク付き `display.c`。Mocklisp の根本的制約（CONS なし）。しかし動的計画法による画面更新は学術論文として発表されるレベルの設計。

### 考古学的価値: ★★★★★
**GPL 誕生の直接的な原因。** Emacs の系譜の重要な中間点。「フリーソフトを売る」という行為が引き起こした紛争が、現代のオープンソース文化の法的基盤を形作った。

### 読み物としての面白さ: ★★★★★
「残虐行為」の自虐、ドクロの警告、Mocklisp の偽物Lisp、「卒業か Mr.Emacs か」、1週間半の書き直し、UniPress の致命的確信、GPL の誕生——一つのエディタに凝縮された自由ソフトウェア運動の起源。

---

## 鑑定人所見

Gosling Emacs は「火種」だ。

Gosling はフリーで配布した。誰でもコピーできた。しかし PhD を取るために保守を手放し、UniPress に売った。Stallman はそのコードを使い、UniPress は止めろと言った。

この紛争がなければ、GPL は生まれなかったかもしれない。

最も象徴的なのは **`display.c` のドクロ** だ。「理解したと思うなら、していない」——この警告はコードの複雑さへの自虐であると同時に、著作権の問題の予言でもあった。誰がこのコードを「所有」しているのか？ フリーで配布した人か、売った会社か、書き直した人か？

Gosling にとって Emacs は「卒業前の仕事」だった。彼は Java を創り、世界を変えた。しかし Gosling Emacs がなければ、GNU Emacs も GPL も、現在のオープンソース文化もなかったかもしれない。**「卒業前の仕事」が、業界の法的基盤を作った。**

ITS（鑑定書 #032）は「聖地」だった——「情報は自由であるべきだ」の聖地。GW-BASIC（鑑定書 #031）は「種」だった——「ソフトウェアに金を払え」の種。Gosling Emacs は **「火種」** だ——フリーと有料の衝突が GPL という炎を生んだ。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
