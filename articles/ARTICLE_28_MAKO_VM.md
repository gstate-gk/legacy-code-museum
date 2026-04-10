# 226行のJavaで「ゲーム機」を作り、その上にForth処理系を載せた男の話

## はじめに

GitHubの片隅に「ゲーム機」のコードを見つけた。

**Mako VM**。John Earnest（ハンドルネーム "Internet Janitor"）が作った、スタックベースの仮想ゲームコンソールだ。Java 226行。320x240ピクセルのディスプレイ、8x8タイルのスプライトエンジン、8kHzオーディオ、6ボタンゲームパッド——ファミコンのような「想像上のゲーム機」が、たった226行のJavaに収まっている。

しかし本当に驚くべきは、この226行の上で**12本のゲームが動き**、さらにその1本（Warrior2）の中に**Forth処理系が丸ごと再実装されている**ことだ。VMの上にVMを載せ、その上でゲームを動かす。226行から始まるマトリョーシカ。

---

## Forthの遺伝子

Mako VMを理解するには、Forth言語を知る必要がある。

1968年、天文学者**Charles Havice Moore**は、NRAO（国立電波天文台）の11メートル電波望遠鏡の制御システムを開発していた。使えるマシンはDDP-116（16KBのRAM）とH316（32KB）。この極限のメモリ制約の中で、望遠鏡の指向制御、データ収集、リアルタイム表示——すべてを同時にこなす言語が必要だった。

Mooreが作ったのが**Forth**だ。

Forthの原理は極めてシンプルだ。**スタック**にデータを積み、**ワード**（関数）で操作する。

```forth
: square  dup * ;
: hypotenuse  square swap square + sqrt ;
```

変数はない。ループ構文もない。あるのはスタックとワードだけ。この「何もない」ミニマリズムが、16KBのマシンでリアルタイム制御を可能にした。

56年後、John Earnestはこの思想を**ゲーム機**に適用した。

---

## 発掘された痕跡

### 痕跡1：226行の全体像——while(true) + switch

MakoVM.javaの核心は、驚くほど単純だ。

```java
public final int[] m;                      // main memory
public final int[] p = new int[320 * 240]; // pixel buffer
public int keys = 0;

private void push(int v)  { m[m[DP]++] = v; }
private void rpush(int v) { m[m[RP]++] = v; }
private int pop()         { return m[--m[DP]]; }
private int rpop()        { return m[--m[RP]]; }
```
— **src/MakoVM.java**

メモリ配列 **m[]**、ピクセルバッファ **p[]**、キー入力 **keys**。スタック操作は **push**/**pop** と **rpush**/**rpop** の4メソッド。パラメータスタックとリターンスタック——Forthの**デュアルスタック**設計がそのまま再現されている。

1968年のMooreが望遠鏡制御のために選んだアーキテクチャが、2010年代のゲーム機で生き続けている。

### 痕跡2：メモリマップドI/O——全てが同じメモリ空間

```java
public static final int PC =  0; // program counter
public static final int DP =  1; // data stack pointer
public static final int RP =  2; // return stack pointer
public static final int GP =  3; // grid pointer
public static final int GT =  4; // grid tile pointer
public static final int SP =  5; // sprite pointer
public static final int ST =  6; // sprite tile pointer
public static final int SX =  7; // scroll X
public static final int SY =  8; // scroll Y
public static final int CL = 10; // clear color
public static final int RN = 11; // random number
public static final int KY = 12; // key input
public static final int CO = 13; // character-out (debug)
public static final int AU = 14; // audio-out (8khz, 8-bit)
```
— **src/MakoConstants.java**

メモリアドレス0〜18が「ハードウェアレジスタ」として機能する。CPU、グラフィックス、サウンド、入力——すべてが同じメモリ空間に住んでいる。

ファミコンの2A03プロセッサは、$2000-$2007がPPUレジスタ、$4000-$4017がAPUレジスタだった。**物理的に別のチップ**をメモリマップでアクセスする設計。Mako VMはこの思想を継承しつつ、VMだからこそ可能な統一性を実現した——読み取り（**@**）も書き込み（**!**）も、全てのデバイスに対して同じ操作。

スプライトを動かすにはアドレス5が指す先を書き換えるだけ。音を鳴らすにはアドレス14に値を書くだけ。

### 痕跡3：32個のオペコード——Forthの最小命令セット

```
制御:  CONST(0), CALL(1), JUMP(2), JUMPZ(3), JUMPIF(4), RETURN(12)
スタック: LOAD(10), STOR(11), DROP(13), SWAP(14), DUP(15), OVER(16), STR(17), RTS(18)
算術:  ADD(19), SUB(20), MUL(21), DIV(22), MOD(23)
論理:  AND(24), OR(25), XOR(26), NOT(27), SGT(28), SLT(29)
同期:  SYNC(30), NEXT(31)
```
— **src/MakoConstants.java**

x86は数千命令。ARM Cortex-Aは数百命令。Mako VMは32命令。

この32個はForthの理論的最小集合に基づいている。Forthの古い実装では12〜20命令でコアVMを構成するのが一般的だった。Makoの32個はそこにゲーム向けの命令（SYNC、NEXT）を追加したもの。

特に**OP_NEXT(31)**はForth特有の**パラメタライズドループカウンタ**を直接サポートする。Forthの**DO...LOOP**構文がこのオペコードにコンパイルされる。ループすらスタック操作とオペコード1個で実現する。

### 痕跡4：peephole optimizer——「遅延定数」という裏技

Makoにはコンパイラ（Maker）が付属する。そのコードに興味深いコメントがある。

```java
/**
* CodeMatcher is a peephole optimizer for Mako bytecode.
* It recognizes patterns within a fixed window and replaces
* them with more efficient sequences with the same semantics.
* Examples include constant folding and tail-call optimization.
*
* @author John Earnest
**/
```
— **src/CodeMatcher.java**

ピープホール最適化器。定数畳み込み、末尾呼び出し最適化——226行のVMに対して、コンパイラ側で最適化を施す。

さらに面白いのがこれだ。

```java
// inject a "delayed constant" which will not
// be pattern-matched by the optimizer, allowing
// the value to be manipulated later.
public void addDelayConst(int value) {
    paramOp(-1, value);
}
```
— **src/MakoRom.java**

「遅延定数」——最適化器に**意図的に無視させる**定数。プログラマがコンパイラの挙動を制御するメタプログラミング機構だ。226行のVMの裏側に、洗練されたコンパイラ設計が隠れている。

### 痕跡5：12本のゲーム——199行のPongから2,170行のAldezまで

Mako VM上で実際に動くゲームが12本実装されている。

| ゲーム | 行数 | ジャンル |
|:---|---:|:---|
| Pong | 199行 | アーケード |
| Pentris | 271行 | テトリス系パズル |
| Sokoban | 385行 | 倉庫番 |
| Webscape | 367行 | ブラウジング |
| Yar | 519行 | シューティング |
| Deep | 503行 | 深海アクション |
| Warrior | 709行 | ローグライク |
| Cardboard | 772行 | カードゲーム |
| Salad | 958行 | マッチパズル |
| CleanSweep | 1,284行 | マインスイーパ系 |
| Warrior2 | 2,055行 | ローグライク + Forth処理系 |
| Aldez | 2,170行 | 大規模アクション |

199行のPongから2,170行のAldezまで——226行のVMの上で、ここまで複雑なソフトウェアが動く。

### 痕跡6：Warrior2——VM上にForth処理系を再実装した狂気

12本の中で最も衝撃的なのが**Warrior2**だ。

Warrior2は単なるローグライクゲームではない。ゲームの中に**MakoForth言語のインタプリタが丸ごと再実装**されている。VM上にVMを載せ、その上でゲームロジックを動かす。

```
MakoVM.java (226行)
  └── Warrior2.rom
        └── MakoForth.fs (Forth処理系)
              └── ゲームロジック
```

226行のJavaが32オペコードのVMを実行し、そのVM上でForth処理系が動き、そのForth上でローグライクゲームが動く。マトリョーシカ構造。

これはMako VMの**汎用性の究極の証明**だ。226行で「ゲーム機」を作っただけでなく、その上にプログラミング言語を実装し、さらにその上でゲームを動かせる。Forthの「何もないところから全てを作る」思想の、最も純粋な実現。

### 痕跡7：Makerのメモリマップ——手作業のハードウェア設計

コンパイラMakerが生成するROMのメモリレイアウトは、手作業で設計されている。

```java
buildRegion("data-stack",     50);
buildRegion("return-stack",   50);
buildRegion("grid",         1271);
buildRegion("grid-tiles",     64);
buildRegion("sprites",      1024);
buildRegion("sprite-tiles",   64);
```
— **src/Maker.java**

データスタック50ワード、リターンスタック50ワード、グリッド41x31=1,271ワード、スプライト256個x4=1,024ワード。これらの領域がROMの中に線形に配置される。

領域名は全て小文字ハイフン区切り——Forth/Lispの伝統的な命名規則。Javaのコードの中に、異なる言語文化の痕跡が埋め込まれている。

---

## 推定される経緯

**1968年**: Charles MooreがNRAOの望遠鏡制御のためにForthを発明。16KBのマシンでリアルタイム処理を実現するスタックベースのミニマリズム。

**1970-80年代**: ForthはNASA、IBM、Sun Microsystemsで採用される。Open Firmware（Sun, Apple）のブートローダー言語として組み込まれる。

**2010年代**: John Earnest（Internet Janitor）がMako VMを開発。Forthの思想をゲーム機に適用。226行のJavaでVM本体、別途コンパイラMakerを実装。12本のゲームで検証。

**同時期**: EarnestはOcto（CHIP-8アセンブラ/IDE）、XO-CHIP（CHIP-8拡張仕様）、Decker（HyperCard的ツール）など、「想像上のコンピュータ」を作り続ける。一貫したミニマリズムと創造的ツール設計の哲学。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| VMコア | 226行 (MakoVM.java) |
| 定数定義 | 73行 (MakoConstants.java) |
| コンパイラ | Maker.java + CodeMatcher.java |
| オペコード | 32個 |
| 画面解像度 | 320x240 |
| タイルサイズ | 8x8ピクセル |
| スプライト | 最大256個 |
| 音声 | 8kHz, 8ビット, モノラル |
| 実装ゲーム | 12本 (199行〜2,170行) |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.017
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Mako VM (2010s, Java 226行)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年3月

■ 鑑定結果
  希少度:          ★★★★☆
  技術的負債密度:    ★☆☆☆☆
  考古学的価値:     ★★★★☆
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★☆
「想像上のゲーム機」はPICO-8やTIC-80などの先例があるが、226行でVM全体を実装し、その上にForth処理系まで再構築した例は極めて珍しい。John Earnestの個人プロジェクト群（Octo, XO-CHIP, Decker）と合わせて、一貫したミニマリスト哲学の産物。

### 技術的負債密度: ★☆☆☆☆
226行。ほぼ負債がない。コードは明快で、各関数は単一責務。32オペコードの実装は**switch**文の中に整然と並んでいる。コンパイラ側のpeephole optimizerまで含めて、設計が一貫している。

### 考古学的価値: ★★★★☆
Forth言語の歴史（1968年の望遠鏡制御）からMako VM（2010年代のゲーム機）まで、スタックベースコンピューティングの系譜を1つのプロジェクトで追える。メモリマップドI/Oの設計はファミコンのPPU/APUアーキテクチャとの比較研究に適する。

### 読み物としての面白さ: ★★★★★
226行でゲーム機を作る。その上で12本のゲームが動く。さらにゲームの中にForth処理系を再実装する。コードは短く明快で、「読んで理解できる」レベル。ミニマリズムの美しさが凝縮されている。

---

## 鑑定人所見

Mako VMは「引き算の芸術」だ。

226行のJavaコードに、CPU、メモリ、画面、音、入力——ゲーム機のすべてが収まっている。32個のオペコード。デュアルスタック。メモリマップドI/O。1968年にCharles Mooreが望遠鏡制御のために設計したForthの思想が、半世紀を超えてゲーム機の中で生きている。

最も衝撃的なのは**Warrior2**だ。226行のVM上でForth処理系を再実装し、その上でローグライクゲームを動かす。これは技術的なデモンストレーションであると同時に、Forthの哲学の究極の表現だ——「何もないところから全てを作る」。

John Earnestは「Internet Janitor」を名乗る。インターネットの清掃員。しかし彼が作ったものは、掃除ではなく**蒸留**だ。ゲーム機のエッセンスを226行に蒸留し、コンパイラのエッセンスをpeephole optimizerに蒸留し、Forthのエッセンスをゲームの中に蒸留した。

足し算では到達できない境地がある。226行は、引き算でしか辿り着けない。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
