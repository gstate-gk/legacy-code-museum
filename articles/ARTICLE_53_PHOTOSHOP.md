# 博士論文の息抜きが世界標準になった——兄弟二人と128,000行のPhotoshop 1.0

## はじめに

GitHubの片隅に「副業」のコードを見つけた。

**Photoshop 1.0.1**。1990年、Thomas Knoll が Pascal と68000アセンブリで書いた画像編集ソフトウェアだ。

128,000行。181ファイル。Pascal 75%、68000アセンブリ 15%。**Thomas が一人で全てを書いた。**

始まりは博士論文の息抜きだった。ミシガン大学でコンピュータビジョンの PhD 研究をしていた Thomas は、1987年に画像表示プログラム「Display」を作り始めた。研究のストレス発散のために。

そこに兄の **John Knoll** が気づいた。ILM（Industrial Light & Magic）で VFX アーティストとして働いていた John は、弟のプログラムを見て言った——「これ、製品になる」。

John は「スター・ウォーズ」のVFXを手がけ、後に「パイレーツ・オブ・カリビアン」のVFXでも知られる男だ。映画の視覚効果の最前線にいた人間が、弟の副業に可能性を見た。

兄弟はプログラムを「Photoshop」と名付け、Adobe にライセンスした。

2026年現在、「Photoshop する」は動詞になった。世界標準の画像編集ソフトウェア。その全てが、一人の PhD 学生の息抜きから始まった。

---

## 発掘された痕跡

### 痕跡1：一人で128,000行を書いた

Photoshop 1.0 の全コードは Thomas Knoll 一人で書かれた。バージョン2から初めて2人体制になった。

エントリーポイント `MPhotoshop.p`——

```pascal
PROGRAM Photoshop;
...
NEW (gPhotoshopApplication);
gPhotoshopApplication.IPhotoshopApplication;
gPhotoshopApplication.Run;
```

最大のファイルは `UPhotoshop.inc1.p`（10,910行）——アプリケーションのメインロジック全体が1ファイルに。MacPaint（鑑定書 #030）の5,804行の約2倍。

### 痕跡2：`8BIM`——30年間生き続ける4文字

```pascal
kSignature    = '8BIM';    { Application signature }
kFileType     = '8BIM';    { Internal file type }
kClipDataType = '8BIM';    { Clipboard data type }
```

**`8BIM`**。この4文字は Photoshop のメタデータチャンク識別子として、2026年の今も **世界中の JPEG/TIFF ファイルの中に埋め込まれている**。スマートフォンで撮った写真にも、`8BIM` が入っている可能性がある。

1990年に Thomas が選んだ4文字が、30年以上経った今もバイナリレベルで生き続けている。

### 痕跡3：仮想メモリを自前で実装した

初代 Macintosh の実メモリは1〜8MB。大きな画像を扱うには足りない。

Thomas は **OS の仮想メモリを信頼せず、自前でページングを実装した**。

```pascal
kVMMinPages = 7    { 最小ページ数: 約56KB }
```

`UVMemory.inc1.p`（2,143行）——ディスクへのページアウトを自分で管理する。MacPaint（鑑定書 #030）が `UnloadSeg` でセグメントを追い出したように、Photoshop はメモリページを追い出した。

### 痕跡4：「Kludge!」——フレームワークのバグを直す

```pascal
{ Kludge code, claims colors on the main screen of a Mac II }
```

```pascal
{ Bug fix--Kludge! }
IF aCmdNumber = cRepeatFilter THEN
    INHERITED SetUndoText (NOT cmdDone, aCmdNumber);
```

```pascal
menu^^.enableFlags := 0    { MacApp bug fix }
```

「Kludge（応急処置）」が複数箇所に。MacApp フレームワークのバグをアプリ側でワークアラウンドしている。**フレームワークを信頼できない時代のプログラミング。**

### 痕跡5：フィルタープラグインAPI——35年変わらない設計

```pascal
{
    File: FilterInterface.p
    Copyright 1990 by Thomas Knoll.
    This file describes version 3 of Photoshop's Filter module interface.
}
```

Thomas Knoll **個人の著作権表示** が残っている唯一のファイル。このプラグイン設計——バッファポインタ渡し、プログレスコールバック、アボートコールバック——は、**2026年の Photoshop SDK まで基本的に変わっていない**。

1990年に一人の学生が設計した API が、35年間の後方互換性を維持している。

### 痕跡6：BarneyScan が先だった

```
OtherPascalOptions = -d qBarneyscan=FALSE -d qDemo=FALSE -d qPlugIns=TRUE
```

ソース全体に `{$IFC qBarneyscan}` の条件コンパイルブロックが散在している。

Photoshop が Adobe から発売される **前に**、BarneyScan 社がスキャナーバンドル版「BarneyScan XP」として約200本を出荷していた。Adobe 版が「初の Photoshop」ではなく、スキャナーの付属品が最初だった。

### 痕跡7：コピープロテクトにハードウェアドングル

`UAbout.p` に EVE キー（ハードウェアドングル）の検証ロジックがある。暗号化セグメントを実行時にデコードする。

```pascal
'zsBanSwzaMGpSmDP'    { パスワード文字列 }
```

1990年の DRM。32年後の今、サブスクリプションモデルに変わった。しかし「ソフトウェアを守る」という課題は変わっていない。

---

## ILMの兄と PhD の弟

John Knoll は ILM でVFXアーティストとして働いていた。

彼が手がけた作品——

- **スター・ウォーズ** 特別篇のVFX
- **パイレーツ・オブ・カリビアン** シリーズのVFX
- Academy Award、BAFTA Award 受賞

映画の視覚効果の最前線にいた人間が、弟の「博士論文の息抜き」に可能性を見た。John は Photoshop 1.0 の多くの画像処理プラグインを書いた。

**VFXアーティストの目が、学術ツールを産業標準に変えた。**

---

## 推定される経緯

**1987年**: Thomas Knoll、ミシガン大学 PhD 研究中に「Display」を開発開始。

**1988年夏**: John が商用化を提案。「Photoshop」に改名。

**1988年**: BarneyScan XP として約200本がスキャナーバンドルで出荷。

**1989年4月**: Adobe とライセンス契約締結。

**1990年2月19日**: Photoshop 1.0 発売（Mac 専用）。

**1991年**: Photoshop 2.0（Paths 機能追加、初の2人体制開発）。

**2003年**: 累計販売300万本超。

**2013年2月14日**: Computer History Museum にソースコード寄贈・公開。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| 実装言語 | Pascal 75% + 68000 ASM 15% |
| ソースコード | 128,000行 / 181ファイル |
| 最大ファイル | UPhotoshop.inc1.p（10,910行） |
| 仮想メモリ | 自前実装（最小7ページ） |
| プラグインAPI | FilterInterface v3 |
| アプリ署名 | 8BIM（30年以上現役） |
| 開発者 | Thomas Knoll（v1 単独）+ John Knoll（プラグイン） |
| OEM版 | BarneyScan XP（約200本） |
| コピープロテクト | EVE ハードウェアドングル |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.042
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Photoshop 1.0.1 (1990, Pascal + 68000 ASM)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年4月

■ 鑑定結果
  希少度:          ★★★★☆
  技術的負債密度:    ★★★☆☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★☆
Pascal + 68000アセンブリ。Computer History Museum 経由で非商用ライセンス公開。MacPaint と同じ言語構成だが、規模は14倍（128,000行 vs 9,000行）。

### 技術的負債密度: ★★★☆☆
128,000行は大規模だが、MacApp フレームワーク上に構築された構造は明確。「Kludge」コメントが数箇所あるが、全体的にはエンジニアリング品質が高い。フィルタープラグインAPIは35年間後方互換。

### 考古学的価値: ★★★★★
**画像編集の世界標準の起源。** `8BIM` が30年間バイナリに生き続ける。フィルタープラグインAPI設計が35年間不変。「Photoshop する」が動詞化した唯一のソフトウェアの最初のソースコード。

### 読み物としての面白さ: ★★★★★
博士論文の息抜き、ILMの兄と PhD の弟、一人で128,000行、BarneyScan が先だった、8BIM の30年、仮想メモリ自前実装——技術と家族の物語。

---

## 鑑定人所見

Photoshop 1.0.1 は「レンズ」だ。

128,000行のPascalとアセンブリが、世界の「見え方」を変えた。Photoshop 以前、写真は現実の記録だった。Photoshop 以後、写真は「加工されているかもしれない」ものになった。「Photoshop する」が動詞になった時点で、このソフトウェアは単なるツールを超えた。

最も象徴的なのは **`8BIM`** だ。1990年に Thomas Knoll が選んだ4文字のアプリケーション署名が、30年以上経った今も世界中の画像ファイルの中にバイナリとして埋め込まれている。スマートフォンで撮った写真に、Instagram でフィルターをかけた画像に、`8BIM` が潜んでいる。コードは死んでも、データは生き続ける。

フィルタープラグイン API が35年間後方互換を維持しているのは、1990年の設計が正しかったことの証明だ。バッファポインタ渡し、プログレスコールバック、アボートコールバック——この3要素は画像処理の本質を捉えている。Thomas Knoll 個人の著作権表示が残るこのファイルは、鑑定書シリーズの中で最も「個人の設計が産業標準になった」例だ。

Elite（鑑定書 #041）は「星図」だった——6バイトから宇宙を展開する。Photoshop 1.0.1 は **「レンズ」** だ——128,000行を通して、世界の見え方が変わった。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
