# IBMを逃した男が書いたPC革命の設計図——CP/Mのソースコードに「Pacific Grove, California」と書いてあった話

## はじめに

GitHubの片隅に「もう一つの歴史」のコードを見つけた。

**CP/M**。1974年、Gary KildallがIntel 8080用に書いたパーソナルコンピュータOSだ。8080アセンブリ、約4,000行。BIOS（Basic Input/Output System）、BDOS（Basic Disk Operating System）、CCP（Console Command Processor）の3層構造。64KBのメモリ空間に、ファイルシステム、コンソールI/O、プログラムローダーのすべてが収まっている。

1980年、IBMがパーソナルコンピュータを作ると決めたとき、最初に訪ねたのはGary Kildallだった。しかしKildallは飛行機に乗っていて不在。妻のDorothyがIBMのNDA（機密保持契約）への署名を拒否した。IBMは去り、Microsoftに向かった。

Bill Gatesは$50,000でQDOS（Quick and Dirty Operating System）を買い、PC DOSとしてIBMに納めた。QDOSはCP/Mの仕様書を見て書かれたAPI互換OSだった。

Kildallは1994年に52歳で亡くなった。未発表の回顧録とともに。

---

## Gary Kildall——コンピュータを「学習ツール」と見た男

Gary Kildallは、コンピュータ科学者であり、教師であり、パイロットであり、テレビ司会者だった。

1973年、海軍の大学院教授だったKildallは、Intelからコンサルタントとしてマイクロプロセッサ用ソフトウェアの開発を依頼された。Intel 8008、後に8080のためのプログラミング言語PL/Mを開発し、さらにそのPL/Mで**CP/M**を書いた。

KildallはコンピュータをComputer History Museumの言葉を借りれば「学習ツールであり、利益エンジンではない」と見なしていた。この哲学が、彼の技術的成功とビジネス的敗北の両方を決定づけた。

1976年、KildallはDigital Research社を設立。カリフォルニア州Pacific Grove——モントレー半島の小さな海辺の町。ここからCP/Mは世界中のマイクロコンピュータに配布された。

---

## 発掘された痕跡

### 痕跡1：Pacific Grove, California——小さな海辺の町の著作権

```
Copyright (c) 1978, 1979, 1980
Digital Research, Box 579, Pacific Grove, California
```
— BDOS.asm ファイルヘッダ

Pacific Grove, California。人口1万5千人の小さな町。モントレー湾に面し、蝶の越冬地として知られる。ここに「世界のパーソナルコンピュータの標準OS」を作った会社があった。

Box 579——私書箱だ。シリコンバレーの巨大キャンパスではなく、海辺の町の私書箱。Digital Researchは最初、Kildallの自宅で運営されていた。

### 痕跡2：8080アセンブリの美学——64KBに収めるアーキテクチャ

CP/Mのメモリマップは、64KBの制約の中で驚くほど整然としている。

```
0x0000-0x0005:  リセットベクタ + BDOSジャンプ
0x0006-0x0007:  BDOS エントリアドレス
0x005C:         デフォルトFCB（File Control Block）
0x0080:         デフォルトDMAバッファ（128バイト）
0x0100:         TPA開始（Transient Program Area）
  ～
上位:           CCP → BDOS → BIOS
```

TPA（Transient Program Area）——ユーザープログラムが使える領域——は0x0100から始まる。最初の256バイトはシステム予約。プログラムは常に0x0100にロードされ、そこから実行される。

この設計が革命的だったのは、**BIOSがハードウェアの差を隠す**ことだ。Altair 8800でもIMSAI 8080でもKayproでも、BIOSさえ書き換えれば同じCP/Mが動く。同じWordStarが動く。同じdBASEが動く。

「ハードウェア抽象化層」という概念を、Kildallは1974年に8080アセンブリで実現した。

### 痕跡3：BDOSの40個のファンクションコール——50年生き続けたAPI

```
BDOS Function Calls:
 0: System Reset           1: Console Input
 2: Console Output         3: Reader Input
 4: Punch Output           5: List Output
 6: Direct Console I/O     7: Get I/O Byte
 8: Set I/O Byte           9: Print String
10: Read Console Buffer   11: Get Console Status
12: Return Version Number 13: Reset Disk System
14: Select Disk           15: Open File
16: Close File            17: Search For First
18: Search For Next       19: Delete File
20: Read Sequential       21: Write Sequential
22: Make File             23: Rename File
...
```

40個のファンクションコール。コンソールI/O、ファイル操作、ディスク管理——OSの基本機能がここに定義されている。

プログラムがBDOSを呼ぶには、レジスタCにファンクション番号、DEにパラメータを入れて、アドレス0x0005にCALLする。たったこれだけ。

```asm
; コンソールに文字'A'を出力
MVI  C, 2        ; ファンクション2: Console Output
MVI  E, 'A'      ; 出力する文字
CALL 0005h       ; BDOSを呼ぶ
```

この設計は、Tim PatersonがQDOSを書くとき、ほぼそのまま継承された。CP/Mの「CALL 5」がMS-DOSの「INT 21h」になった。ファンクション番号も、パラメータの渡し方も、酷似している。

| 機能 | CP/M | MS-DOS |
|:---|:---|:---|
| コンソール出力 | BDOS func 2, CALL 5 | INT 21h, func 02h |
| ファイルオープン | BDOS func 15 | INT 21h, func 0Fh |
| ファイル読み込み | BDOS func 20 | INT 21h, func 14h |
| FCB構造 | 36バイト | ほぼ同一 |

50年後の今も、WindowsのコマンドプロンプトのDIR、DEL、REN——これらのコマンドはCP/Mに由来する。

### 痕跡4：FCB（File Control Block）——ファイル名「8.3」の起源

```
FCB構造（36バイト）:
  byte 0:     ドライブ番号（0=デフォルト, 1=A:, 2=B:, ...）
  byte 1-8:   ファイル名（8文字、スペースパディング）
  byte 9-11:  拡張子（3文字）
  byte 12:    エクステント番号
  byte 13-14: 予約
  byte 15:    レコードカウント
  byte 16-31: ディスクアロケーションマップ
  byte 32-35: ランダムレコード番号
```

ファイル名8文字 + 拡張子3文字。**8.3形式**だ。FILENAME.TXTの上限が8+3=11文字。この制約は、CP/MのFCBの物理的なバイト配置から来ている。

Windows 95でロングファイルネームがサポートされるまで、20年間この制約は続いた。2026年の今でも、FATファイルシステムの互換層には8.3形式が残っている。

### 痕跡5：40年後のタイポ修正——考古学的コード検証

```
typo...here originally, corrected by comparing to disassembly of Clark Calkins
```
— CCP.asm

2018年、Eric Smithが40年前のCP/Mソースコードを現代のアセンブラ用に変換する作業中、オリジナルのDigital Researchコードにタイプミスを発見した。Clark Calkinsによる逆アセンブル結果と比較して修正。

1980年のプログラマーが打ち間違えた1文字を、2018年のプログラマーが逆アセンブルで見つけて直す。コードの考古学だ。

### 痕跡6：IBMが来た日——パーソナルコンピュータ史上最も重要な5分間

1980年のある日、IBMの代表団がPacific Groveを訪れた。パーソナルコンピュータ「Project Chess」のOSとしてCP/Mを採用するため。

Kildallは不在だった。顧客訪問のため飛行機に乗っていた（飛行が趣味だったという神話もあるが、実際はビジネスフライト）。

妻のDorothy McEwen（Digital Research副社長）と弁護士のGerry DavisがIBM代表団と対面した。IBMはまずNDAへの署名を求めた。

NDAの内容は一方的だった——情報漏洩があった場合、IBMは自由にその情報を使えるが、Digital Research側はIBMを訴えられない。

Dorothy と弁護士はこの条件を「不公正」と判断し、署名を拒否した。

**IBMは去った。**

次に向かったのはMicrosoft。Bill GatesはOSを持っていなかったが、Seattle Computer ProductsのTim Patersonが書いたQDOS（Quick and Dirty Operating System）を$50,000で買った。QDOSはCP/Mの公開仕様を参照して書かれたAPI互換OSだった。

IBMはPC DOSを$40で販売した。CP/M-86は$240。顧客は$40を選んだ。

### 痕跡7：「彼らは私のOSを盗んだ」——未発表の回顧録

1993年、KildallはPCの歴史の回顧録を執筆していた。

タイトルは「Computer Connections: People, Places, and Events in the Evolution of the Personal Computer Industry」。出版予定はOsborne-McGraw Hill、1994年初頭。

1994年7月8日、KildallはMontereyのバーで頭部外傷を負った。3日後の7月11日、52歳で死亡。死因は医学的に「不明」とされた。

回顧録は未発表のまま消えた。

Kildallが生前語った言葉が一つだけ残っている。

> *「彼らは私のOSを盗んだ」*

---

## 推定される経緯

**1973年**: Gary Kildallが海軍の大学院教授として、IntelのコンサルタントでPL/Mを開発。

**1974年**: PL/Mを使ってCP/M（Control Program for Microcomputers）を開発。Intel 8080用。最初の実装は紙テープとフロッピーディスクの制御。

**1976年**: Digital Research社設立。Pacific Grove, California。CP/Mの販売開始。

**1977-1980年**: CP/Mがマイクロコンピュータの事実上の標準OSに。Altair 8800、IMSAI 8080、Osborne 1、Kaypro——数百のハードウェアで動作。WordStar、dBASE II、Turbo Pascalが登場。

**1980年**: IBMがProject Chess（IBM PC）のOSとしてCP/Mを検討。交渉決裂。MicrosoftがQDOSを買い、PC DOSとして納品。

**1981年8月**: IBM PC発売。PC DOSが$40、CP/M-86が$240。CP/Mの市場シェアが急速に縮小。

**1991年**: Digital ResearchがNovellに買収。CP/Mの歴史が終わる。

**1994年7月11日**: Gary Kildall死去。52歳。未発表の回顧録とともに。

**2014年**: Computer History MuseumがKildallを「PC OS革命の父」として殿堂入り。IEEE MilestoneにCP/Mが登録。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| コード行数 | 約4,000行 (8080 ASM) |
| 構成 | BIOS + BDOS + CCP |
| ファンクションコール | 40個 |
| 最大メモリ | 64KB |
| 対応ドライブ | 最大16論理ドライブ |
| ファイル名制限 | 8.3形式（11文字） |
| 対応ハードウェア | 数百機種 |
| 主要アプリケーション | WordStar, dBASE, Turbo Pascal |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.020
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】CP/M 2.2 (1974〜1980, 8080 ASM)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年3月

■ 鑑定結果
  希少度:          ★★★★★
  技術的負債密度:    ★★☆☆☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★★
パーソナルコンピュータ初の商用OSのソースコードが公開されている。2018年にEric Smithが現代のアセンブラ用に変換し、GitHubに公開。Digital Research時代のオリジナルコメントが残っている。

### 技術的負債密度: ★★☆☆☆
4,000行の8080アセンブリは驚くほど整理されている。BIOS/BDOS/CCPの3層分離は明確で、各ファンクションは単一責務。64KBの制約がコードの肥大化を物理的に防いだ。40年後のタイポ修正が1件あるのみ。

### 考古学的価値: ★★★★★
パーソナルコンピュータ産業の分岐点。CP/MのAPI設計はMS-DOSに継承され、Windows/Linuxに遺伝した。8.3ファイル名形式、FCB構造、コンソールI/O——50年後の今も痕跡が残っている。

### 読み物としての面白さ: ★★★★★
技術的卓越性とビジネス的悲劇の対比が鮮烈。Pacific Groveの私書箱、IBMのNDA拒否、$50,000のQDOS、52歳の死、未発表の回顧録——コードの向こうに一人の人間の人生が見える。

---

## 鑑定人所見

CP/Mは「もう一つのWindows」だ。

4,000行の8080アセンブリの中に、パーソナルコンピュータの設計図がすべて書かれている。BIOSによるハードウェア抽象化、BDOSの40個のファンクションコール、8.3形式のファイル名、FCB構造——これらはMS-DOSに継承され、Windowsに遺伝し、50年後の今もコマンドプロンプトの中で生きている。

しかしCP/Mの物語は、技術の物語ではない。**判断の物語**だ。

Kildallは飛行機に乗っていた。DorothyはNDAを拒否した。IBMは去った。Gatesは$50,000でQDOSを買った。IBM PCは$40のPC DOSを載せて出荷された。

1つのNDA、1回の不在、$200の価格差——これだけで、コンピュータ産業の30年が決まった。

最も印象的なのは、**コードの品質ではビジネスの勝敗は決まらない**という事実だ。CP/Mは技術的にQDOSより優れていた。しかし市場は安い方を選んだ。Kildallが「学習ツール」と考えたOSは、Gatesの「利益エンジン」に上書きされた。

Pacific Grove, California。私書箱579番。そこから発送されたフロッピーディスクの中に、パーソナルコンピュータの設計図が入っていた。その設計図は今も生きている——ただし、発送元の名前は消えている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
