# 19歳が60日で書いた帝国の原点——8086アセンブリ100%のBASICインタプリタ

## はじめに

GitHubの片隅に「帝国の原点」を見つけた。

**GW-BASIC**。1983年、Microsoft が8086アセンブリで書いた BASIC インタプリタだ。MS-DOS に同梱され、世界中の IBM PC 互換機で動いた。

34,474行。35ファイル。**全て8086アセンブリ**。高級言語は1行もない。

しかしこのコードの冒頭には、もっと古い日付が刻まれている——

```asm
COPYRIGHT 1975 BY BILL GATES AND PAUL ALLEN

ORIGINALLY WRITTEN ON THE PDP-10 FROM
FEBRUARY 9 TO  APRIL 9 1975

BILL GATES WROTE A LOT OF STUFF.
PAUL ALLEN WROTE A LOT OF OTHER STUFF AND FAST CODE.
MONTE DAVIDOFF WROTE THE MATH PACKAGE (F4I.MAC).
```

1975年2月9日から4月9日。**60日間**。Gates 19歳、Allen 22歳。ハーバード大学の PDP-10 でクロスアセンブルし、Altair 8800 用の BASIC を書いた。紙テープで納品した。

これが Microsoft 最初の製品だ。そしてこの34,474行のアセンブリコードは、1975年の60日間から8年かけて進化した、**帝国の原点** だ。

---

## Popular Electronics の表紙

1975年1月号の Popular Electronics 誌。表紙に Altair 8800 が載っていた。

Paul Allen はこの雑誌を Bill Gates に見せた。「これに BASIC を載せれば売れる」。

問題があった。二人は Altair 8800 を持っていなかった。実機が手に入らないまま、ハーバード大学の PDP-10 で Intel 8080 のエミュレータを書き、その上で BASIC インタプリタをクロスアセンブルした。

Gates が大部分のコードを書いた。Allen が高速なルーチンを書いた。Monte Davidoff——ハーバードの学生で、当時19歳——が浮動小数点演算パッケージを担当した。

1975年4月、Allen が紙テープを持って MITS 社（ニューメキシコ州アルバカーキ）に飛んだ。初めて実機で動かした。**動いた。**

1975年4月4日、Microsoft が設立された。

---

## 発掘された痕跡

### 痕跡1：1975年のコードが1983年に生きている

GW-BASIC の全ファイルの冒頭にはこう書かれている——

```asm
; [ This translation created 10-Feb-83 by Version 4.3 ]
```

1983年2月10日、「Version 4.3」という ISA 翻訳ツールが、**8080 アセンブリのソースを 8086 アセンブリに自動変換した**。

つまり GW-BASIC は「8086 で書き直された」のではない。1975年に 8080 向けに書かれた Altair BASIC のソースコードが、翻訳ツールで機械的に 8086 に変換されたのだ。

**1975年の Gates と Allen のコードが、8年後の変換を経て、そのまま IBM PC の中で動いていた。**

### 痕跡2：「BILL GATES WROTE A LOT OF STUFF」

コードの冒頭コメント——

```asm
BILL GATES WROTE A LOT OF STUFF.
PAUL ALLEN WROTE A LOT OF OTHER STUFF AND FAST CODE.
MONTE DAVIDOFF WROTE THE MATH PACKAGE (F4I.MAC).
```

「Bill Gates はいろんなものをたくさん書いた。Paul Allen は他のいろんなものと高速なコードを書いた。」

世界一の富豪になる男のクレジットが、"a lot of stuff"（いろんなもの）。そして Monte Davidoff の名前は、49年後の GitHub でも消えていない。19歳で書いた浮動小数点パッケージが、彼の名前と共にコードの中に永遠に刻まれている。

### 痕跡3：Knuth を参照する乱数生成器

乱数生成のコメント——

```asm
; METHOD: LINEAR CONGRUENTIAL FROM VOL. 2 CHAPTER 3 OF
;         KNUTH - THE ART OF COMPUTER PROGRAMMING.
;         M=16,777,216 OR 2^24; [ A MOD 8 ]=5 AND
;         [ C MOD 8 ]=3
;         RND(N+1)=(RND(N)*A+C)MOD M
```

Donald Knuth の『The Art of Computer Programming』Vol.2 Chapter 3 の線形合同法。参照文献がコードのコメントに直接書かれている。

19歳の Gates は Knuth を読んでいた。

### 痕跡4：懐かしのエラーメッセージたち

BASIC を使ったことがある世代なら、涙が出るかもしれない。

```asm
DCL    "NEXT without FOR"
DCL    "Syntax error"
DCL    "RETURN without GOSUB"
DCL    "Out of DATA"
DCL    "Illegal function call"
DCL    "Overflow"
DCL    "Out of memory"
DCL    "Undefined line number"
DCL    "Division by zero"
DCL    "Type mismatch"
DCL    "String too long"
DCL    "WHILE without WEND"
```

「Syntax error」。「Out of memory」。「Division by zero」。

あのエラーメッセージは、8086アセンブリの `DCL` マクロで1つずつ定義されていた。世界中の何百万人が見た「Syntax error」の文字列は、このコードの中にある。

### 痕跡5：BEEPは800Hz、1/4秒

```asm
BEEP:
BEEPS:    MOV    CX,800D    ; 800 Hz
          MOV    DX,100D    ; .. for 1/4 second.
```

あの「ビープ音」。800Hz、0.25秒。ハードコード。

PLAY 文では MML（Music Macro Language）をサポートしていた。音符 A〜G、オクターブ、テンポ、音長、シャープ、フラット——8086アセンブリで実装された音楽言語だ。

```asm
NOTTAB:    DW    4186D    ;C
           DW    4435D    ;C#
           DW    4699D    ;D
           ...
           DW    7902D    ;B
```

最高オクターブの周波数テーブルを持ち、2で割って下のオクターブを生成する。

### 痕跡6：8080/Z80 の亡霊

8086 向けのコードの中に、前世代の CPU への言及が残っている——

```asm
; THE FOLLOWING FUNCTIONS ALLOW THE
; USER FULL ACCESS TO THE 8080/Z80  I/O PORTS
```

INP/OUT/WAIT 関数の説明に「8080/Z80」と書かれている。8086 向けに翻訳されたコードなのに、コメントは 8080 時代のまま。**1975年の Altair BASIC の亡霊が、1983年の GW-BASIC に棲みついている。**

### 痕跡7：日本語の痕跡——KANJ86.ASM

OEM 向けの条件コンパイルヘッダに、日本メーカーの名前が並ぶ——

```asm
GW=1        ;GW BASIC
IBMLIK=1    ;IBM compatibility package
MELCO=0     ;Mitsubishi Electronics Co.
ZENITH=0    ;ZENITH 8086
TSHIBA=0    ;(Toshiba)
ALPS=0
```

三菱、東芝、アルプス。そして `KANJ86.ASM` というファイルが存在する。日本語対応 OEM 版があったのだ。

GW-BASIC は IBM PC 専用ではなかった。世界中のメーカーに OEM 供給された **汎用 Microsoft BASIC の一バリアント** だった。

---

## 「ソフトウェアに金を払え」

1976年2月、Gates は Homebrew Computer Club Newsletter に公開書簡を掲載した。

**「Open Letter to Hobbyists」**——

> *「ホビイストの大半が知っているように、あなたたちのほとんどはソフトウェアを盗んでいる。ハードウェアには金を払うが、ソフトウェアは共有するものだと。それを作った人間に報酬が支払われるかどうか、誰が気にするのか？」*

Altair BASIC の海賊版が横行していた。紙テープをコピーして配り回す。Gates は20歳でこの手紙を書いた。

「ソフトウェアは金を払って買うものだ」——この概念を業界に定着させた転換点だ。そしてその精神は、45年後の2020年、MIT License での公開という形で完結した。かつて「盗むな」と訴えたコードが、今は「自由に読め」と公開されている。

---

## 推定される経緯

**1975年1月**: Popular Electronics 誌に Altair 8800 が掲載。

**1975年2月9日**: Gates と Allen、ハーバード大の PDP-10 で BASIC の開発開始。

**1975年4月9日**: 60日で完成。紙テープで MITS に納品。

**1975年4月4日**: Microsoft 設立。

**1976年2月**: Gates の「Open Letter to Hobbyists」。

**1977年**: MBASIC として CP/M 向けに展開。

**1981年**: IBM BASICA として IBM PC DOS 1.0 に同梱。

**1983年2月10日**: ISA 翻訳ツール Version 4.3 で 8086 向けに変換。GW-BASIC 誕生。

**1991年**: QBasic に置き換えられ、GW-BASIC は終了。

**2020年5月21日**: Microsoft が MIT License でソースコード公開。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| 実装言語 | 8086 アセンブリ（100%） |
| 元ソース | 8080 アセンブリ（1975年〜） |
| 変換方法 | ISA 翻訳ツール Version 4.3 |
| ソースコード | 34,474行 / 35ファイル |
| 開発者 | Bill Gates, Paul Allen, Monte Davidoff + Microsoft |
| 浮動小数点 | 単精度 + 倍精度（ソフトウェア実装） |
| グラフィック | SCREEN/LINE/CIRCLE/PAINT/DRAW |
| サウンド | BEEP(800Hz) + PLAY(MML) + SOUND |
| OEM対応 | 三菱、東芝、アルプス、Zenith 等 |
| 乱数生成 | Knuth の線形合同法 |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.031
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】GW-BASIC (1983, 8086 アセンブリ)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年3月

■ 鑑定結果
  希少度:          ★★★★☆
  技術的負債密度:    ★★★★☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★☆
8086アセンブリ100%の BASIC インタプリタ。Microsoft が公式に MIT License で公開。元は1975年のAltair BASICからの系譜。ただし8086アセンブリ自体は広く使われた言語のため★4。

### 技術的負債密度: ★★★★☆
8080→8086の機械的翻訳の痕跡。8080/Z80 時代のコメントが残存。条件コンパイルで多数のOEMバリアントを管理する複雑な構造。8年間の増築による巨大な単一コードベース。

### 考古学的価値: ★★★★★
**Microsoft 帝国の原点。** Altair BASIC → MBASIC → GW-BASIC → QBasic → Visual Basic の系譜の中間点。「ソフトウェアを有料で売る」という概念の出発点。Gates/Allen/Davidoff のクレジットが49年後もコードに残っている。

### 読み物としての面白さ: ★★★★★
19歳が60日で書いた帝国の原点、"a lot of stuff" のクレジット、Knuth参照の乱数生成、800Hzのビープ音、8080の亡霊、日本メーカーの名前、そして「盗むな」から「自由に読め」への45年の変遷——技術とビジネスの歴史が凝縮されている。

---

## 鑑定人所見

GW-BASIC は「種」だ。

1975年2月9日、19歳の Bill Gates と22歳の Paul Allen が、ハーバード大学の PDP-10 の前に座った。Altair 8800 の実機はない。エミュレータで8080の命令を模擬しながら、60日で BASIC インタプリタを書き上げた。紙テープで納品した。

この60日間から、全てが始まった。

最も象徴的なのは、**1975年のコードが1983年にそのまま生きている** ことだ。ISA 翻訳ツールが8080のアセンブリを8086に変換した。コメントには「8080/Z80 I/O PORTS」と書かれたまま。Gates と Allen のクレジットも、Davidoff の名前も、1975年の日付も——全てが翻訳を越えて生き残っている。

そして Monte Davidoff。彼の名前はMicrosoftの歴史の中ではほとんど語られない。しかしコードの冒頭に「MONTE DAVIDOFF WROTE THE MATH PACKAGE」と刻まれている。19歳で書いた浮動小数点パッケージは、5,709行のアセンブリとして、世界中のIBM PCの中で動き続けた。コードは覚えている。

「Open Letter to Hobbyists」——20歳の Gates が「ソフトウェアを盗むな」と訴えた手紙。これは単なる抗議ではなく、「ソフトウェアに経済的価値がある」という宣言だった。45年後、そのコードは MIT License で公開された。「盗むな」から「自由に読め」へ——しかし「読み取り専用、PRは受け付けない」。歴史は保存するが、書き換えは許さない。

MacPaint（鑑定書 #030）は「窓」だった。GW-BASIC は **「種」** だ——19歳が60日で蒔いた種から、世界最大のソフトウェア帝国が育った。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
