# 5万ドルの「Quick and Dirty」が世界を支配した——CP/Mの影を引きずるMS-DOS

## はじめに

GitHubの片隅に「帝国」のコードを見つけた。

**MS-DOS 1.25**。1981年、Tim Paterson が8086アセンブリで書いたオペレーティングシステムだ。

約4,000行。アセンブリ 85%。**開発コードネームは QDOS——Quick and Dirty Operating System。**

1980年、Intel の16ビット CPU 8086 が登場したが、Digital Research の CP/M-86 は遅れていた。Seattle Computer Products の24歳のエンジニア Tim Paterson は、CP/M-80 のマニュアルを参照しながら、8086向けの互換 OS を書き始めた。名前が全てを語っている——**Quick and Dirty**。速く、汚く。

Microsoft の Bill Gates がこれに目をつけた。1980年12月、$25,000 の非独占ライセンスを取得。1981年7月、IBM PC 発表の1ヶ月前に、全権利を **$50,000** で買い取った（計算方法によっては $75,000）。

Paterson は Microsoft に移籍し、IBM PC 向けにポートした。1981年8月12日、IBM PC と共に PC-DOS 1.0 として出荷。**世界で最も成功した OS の始まりは、24歳のエンジニアが「速く汚く」書いた4,000行だった。**

Digital Research の Gary Kildall（鑑定書 #020: CP/M）は IBM との契約を逃した。5万ドルの QDOS が、CP/M の帝国を終わらせた。

---

## 発掘された痕跡

### 痕跡1：全てを記録した改訂履歴

```assembly
; 86-DOS  High-performance operating system for the 8086  version 1.25
;       by Tim Paterson
;
; 0.34 12/29/80 General release, updating all past customers
; 0.42 02/25/81 32-byte directory entries added
; 0.56 03/23/81 Variable record and sector sizes
; 0.60 03/27/81 Ctrl-C exit changes
; 0.74 04/15/81 Recognize I/O devices with file names
; 0.80 04/27/81 Add console input without echo
; 1.00 04/28/81 Renumber for general release
; 1.10 07/21/81 Fatal error trapping, NUL device, hidden files, date & time
; 1.25 03/03/82 Put marker (00) at end of directory to speed searches
```

`MSDOS.ASM` の冒頭——**全ての変更が記録されている。** バージョン0.34（1980年12月）から1.25（1982年3月）まで、25回の改訂。各改訂に日付と変更内容。

最初のコメントに `>> EVERY change must noted below!! <<` と書かれている。**全ての変更を記録せよ。** 1980年のバージョン管理は、ソースコードのコメントに手書きで行われていた。Git が生まれる25年前の話だ。

### 痕跡2：CP/M の影——互換性の苦悩

```assembly
; 1.12 10/09/81 Zero high half of CURRENT BLOCK after all (CP/M programs don't)
```

バージョン1.12の改訂メモ。**CP/M プログラムが CURRENT BLOCK の上位バイトをゼロにしない** ため、MS-DOS 側で対処している。

MS-DOS は CP/M との互換性を維持するために作られた。しかし完全な互換ではなかった。CP/M プログラムの「お行儀の悪さ」を MS-DOS が吸収し続けた。**互換性とは、先人の間違いを引き継ぐことだ。**

### 痕跡3：`IF IBM` ——二つの顔

```assembly
IF IBM
  ; IBM-specific escape sequence tables
  ; COM1 device
  ; Division overflow handler
ENDIF
```

ソースコード全体に **`IF IBM` / `ENDIF`** の条件分岐が散在している。MS-DOS は IBM PC 向け（PC-DOS）と、他社 OEM 向け（MS-DOS）の **二つの顔** を持っていた。同じソースコードから、条件コンパイルで異なるバイナリを生成する。

エスケープシーケンスのテーブル、COM1 デバイスの有無、除算オーバーフローの処理——IBM 版と非 IBM 版で微妙に異なる。**一つのコードベースから帝国を築いた。**

### 痕跡4：DIRTYBUF と DIRTYDIR——「汚い」フラグ

```assembly
DIRTYBUF    ; unsynchronized buffer state
DIRTYDIR    ; modified directory entries
```

バッファとディレクトリの **「ダーティ」フラグ。** 変更がディスクに書き込まれていない状態を追跡する。

バージョン1.13のバグ修正：**「Fix classic 'no write-through' error in buffer handling」。** バッファのダーティデータがディスクに書き戻されない「古典的な」バグ。このバグが修正されるまで、MS-DOS はデータを失う可能性があった。**「Quick and Dirty」は、文字通りだった。**

### 痕跡5：v4.0 と Ray Ozzie の発見

2024年、元 Microsoft CTO の **Ray Ozzie** の個人コレクションから、未公開の MS-DOS 4.0 ベータ版が発見された。

Ozzie が Lotus 時代に受け取ったディスク。1984年頃の日付。**マルチタスキング DOS**（MT-DOS）のバイナリが含まれていた。IBM と Microsoft が共同開発したが、広くリリースされることはなかった。後の OS/2 の前身にあたる。

研究者 Connor "Starfrost" Hyde が Ozzie に連絡を取り、Microsoft の Open Source Programs Office と協力して、ディスクイメージをスキャンし、GitHub に MIT ライセンスで公開した。**40年前のフロッピーが、GitHub で蘇った。**

### 痕跡6：31,800スター——最も注目された遺産

MS-DOS リポジトリは GitHub で **31,800 スター** を獲得している。DOOM（18,400）の1.7倍。**世界で最も注目されたレガシーコードの一つ。**

しかし README には明記されている：「PRs will not be accepted.」**プルリクエストは受け付けない。** このコードは歴史的参考資料であり、生きているプロジェクトではない。

---

## 5万ドルの因縁

MS-DOS の物語は、CP/M（鑑定書 #020）の物語の続きだ。

Gary Kildall は CP/M を作り、パーソナルコンピュータ OS の市場を切り開いた。IBM が OS を求めて Digital Research を訪れた時、Kildall は NDA への署名を拒否した（あるいは飛行機で留守だった——諸説ある）。

Bill Gates は、この隙間に Paterson の QDOS を滑り込ませた。$50,000。**パーソナルコンピュータの歴史を変えた金額としては、驚くほど安い。**

Kildall は1994年に52歳で亡くなった。Gates は世界一の富豪になった。同じ問題を、ほぼ同じ方法で解いた二人。しかし結果は天と地ほど違った。**技術ではなく、タイミングと商売が勝敗を分けた。**

---

## 推定される経緯

**1980年4月**: Tim Paterson、Seattle Computer Products で QDOS の開発を開始。CP/M-80 マニュアルを参考に。

**1980年8月**: QDOS 0.10 完成。86-DOS に改名。

**1980年12月**: Microsoft が $25,000 で非独占ライセンスを取得。

**1981年5月**: Paterson が Microsoft に移籍。IBM PC 向けにポート。

**1981年7月**: Microsoft が全権利を $50,000 で取得。

**1981年8月12日**: IBM PC 発表。PC-DOS 1.0 同梱。

**1982年3月**: MS-DOS 1.25 リリース（本リポジトリのバージョン）。

**1983年3月**: MS-DOS 2.0 リリース（ハードディスク対応、階層ディレクトリ）。

**1984年頃**: MS-DOS 4.0（マルチタスキング版）を IBM と共同開発。未公開。

**2014年3月25日**: Computer History Museum 経由で v1.25, v2.0 のソースコード公開。

**2024年4月25日**: v4.0 のソースコードを MIT ライセンスで GitHub 公開。Ray Ozzie のコレクションから発見。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| 実装言語 | 8086 Assembly 85% + C 13% |
| ソースコード | 約4,000行（v1.25カーネル） |
| 開発コードネーム | QDOS (Quick and Dirty Operating System) |
| 前身 | 86-DOS（Seattle Computer Products） |
| 取得価格 | $50,000（全権利） |
| 条件コンパイル | IF IBM / ENDIF（OEM 対応） |
| CP/M 互換 | API レベルで互換（FCB, INT 21h） |
| GitHub スター | 31,800（レガシーコード最高レベル） |
| 公開バージョン | v1.25, v2.0（2014年）、v4.0（2024年） |
| 開発者 | Tim Paterson（24歳で開発開始） |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.050
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】MS-DOS 1.25 (1981, 8086 Assembly)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年4月

■ 鑑定結果
  希少度:          ★★★☆☆
  技術的負債密度:    ★★★★☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★☆☆
8086アセンブリ。MIT ライセンスで GitHub に公開済み。31,800スターで広く知られている。コード自体の希少性は高くないが、「PC の歴史そのもの」としての重要性は最高レベル。

### 技術的負債密度: ★★★★☆
**「Quick and Dirty」が名前に入っている。** CP/M 互換のための `IF IBM` 条件分岐、DIRTYBUF/DIRTYDIR の「汚い」フラグ、バッファのwrite-throughバグ。しかしこの「汚さ」が、市場投入の速さを支えた。

### 考古学的価値: ★★★★★
**パーソナルコンピュータ革命の起爆剤。** IBM PC と共に出荷され、PC/AT 互換機の爆発的普及を支えた。Windows のルーツ。CP/M（鑑定書 #020）との因縁。$50,000 がコンピュータ史を変えた。

### 読み物としての面白さ: ★★★★★
24歳の「Quick and Dirty」、$50,000 の買収、CP/M の影、IF IBM の二つの顔、Ray Ozzie の発見、31,800スター——技術と商売とタイミングの物語。

---

## 鑑定人所見

MS-DOS は「複製」だ。

CP/M（鑑定書 #020）の API を複製し、IBM PC の上に載せた。Tim Paterson は CP/M のマニュアルを読みながら QDOS を書いた。**オリジナルではない。しかしオリジナルより成功した。**

最も象徴的なのは **バージョン1.12の改訂メモ** だ：「Zero high half of CURRENT BLOCK after all (CP/M programs don't)」。CP/M プログラムのお行儀の悪さを、MS-DOS が吸収している。**互換性の本質は、先人の間違いを引き継ぐことだ。** そしてその「間違いの引き継ぎ」が、エコシステムを作った。

VisiCalc（鑑定書 #045）は「原器」だった——表計算の概念を定義した。MS-DOS は **「複製」** だ——CP/M を複製し、IBM の名前を借りて、世界を制覇した。オリジナリティは $0。タイミングと商売は $50,000。そして結果は——数十兆ドル規模の PC 産業。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
