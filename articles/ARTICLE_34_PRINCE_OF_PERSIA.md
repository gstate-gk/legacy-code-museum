# 父の押入れから22年前のフロッピーを発掘したら、6502アセンブリでロトスコープが動いていた話

## はじめに

GitHubの片隅に「発掘」のコードを見つけた。

**Prince of Persia**。1989年、Jordan MechnerがApple II上で6502アセンブリで書いたアクションゲームだ。29本のアセンブリソースファイル。48KBのメモリ制約。240フレーム以上のロトスコープアニメーション——弟をビデオ撮影し、1フレームずつ手作業でコードに変換した。

2012年、Mechnerは父親の自宅から22年前の3.5インチフロッピーディスクを発掘した。Internet ArchiveのJason Scottと、Apple II愛好家の故Tony Diazが、丸一日かけてフロッピーからソースコードを復元した。

> *「我々がこのコードを抽出・公開したのは、それがコンピュータ史の一片であり、他の人々の興味を引くかもしれないからだ。そして、もしそうしなければ、永遠に失われていたかもしれないからだ。」*

---

## Yale大学の学生がゲームを作った

Jordan Mechnerは映画監督志望のYale大学生だった。しかし彼にはもう一つの才能があった——Apple IIの6502アセンブリを書けること。

1984年、Mechnerは前作**Karateka**をリリース。格闘ゲームにシネマティックな演出を持ち込んだ最初のゲームだった。しかしアニメーションは硬く、「ゲームらしい」動きだった。

次の作品では、**人間が本当に動いているように見せたい**。

Mechnerは弟をビデオカメラで撮影した。走る、跳ぶ、ぶら下がる、戦う——あらゆる動作を録画し、1フレームずつApple IIのドット絵に変換した。**ロトスコーピング**——1910年代にMax Fleischerが発明した、実写フィルムをアニメーションにトレースする技法を、6502アセンブリで再現した。

1985年に開発を始め、1989年9月7日に完成。4年間。

```
TextLine asc "Prince of Persia 1.0  9/7/89"
```
— VERSION.S

---

## 発掘された痕跡

### 痕跡1：240フレームのロトスコープ——5バイトに圧縮された人体

```
:1 db $01,0,1,0,$c0+4 ;run-4
:2 db $02,0,1,0,$40+4 ;run-5
:3 db $03,0,3,0,$40+7 ;run-6
...
:67 db $11,$40,-2,0,$40+1 ;jumphang-2
:68 db $12,$40,-2,0,$40+1 ;jumphang-3
:69 db $13,$40,-1,0,$c0+2 ;jumphang-4
```
— FRAMEDEF.S

240以上のアニメーションフレーム。各フレームはたった**5バイト**——画像ID、剣の位置、X方向移動量、Y方向移動量、チェックデータ。

弟の動きをビデオ撮影し、1フレームずつドット絵にトレースし、5バイトのデータ構造にエンコードした。走り、ジャンプ、ぶら下がり、戦闘、ポーション飲み——111のシーケンスが、このフレーム定義テーブルから組み立てられる。

```
startrun = 1
standjump = 3
runjump = 4
jumphang = 9
jumpfall = 18
drinkpotion = 78
```
— SEQDATA.S

### 痕跡2：48KBの壁——AUXメモリとランゲージカードの魔法

Apple IIの標準メモリは48KB。Prince of Persiaはそこに収まらなかった。

```
*-------------------------------
* Check to make sure //c or //e
* with 128k
*-------------------------------
check128k
 sta $c081
 lda $FBB3 ;Apple // family ID byte
 cmp #6
 bne NOT128K ;Must be e/c/GS
```
— BOOT.S

起動時に128KBメモリを確認する。足りなければ：

```
MEMTEXT hex 8D
 asc "REQUIRES A //C OR //E WITH 128K"
 hex 00
```

「128KBメモリを搭載したApple //cまたは//eが必要です」。

Mechnerはメモリを2つの空間に分割した。

```
* Game code sits in auxmem & aux l.c. and uses aux z.p.
*
* Routines in main l.c. (including MASTER and HIRES)
* are called via intermediary routines in GRAFIX (in auxmem).
*
* RW18 sits in bank 1 of main language card;
* driveon switches it in, driveoff switches it out.
```
— MASTER.S

ゲームコードはAUXメモリ（補助メモリ）に。描画ルーチンはメインメモリのランゲージカードに。ディスク読み込み（RW18）はbank 1に切り替えて使う。48KBの壁を、メモリバンク切り替えという力技で乗り越えた。

### 痕跡3：DeathVelocity = 33——物理演算が定数に刻まれた

```
DeathVelocity = 33  — 死亡判定速度
OofVelocity = 22    — ダメージ速度
grabreach = -8      — 掴める範囲
grabspeed = 32      — 掴める最大落下速度
grablead = 25       — 予測落下距離
stuntime = 12       — スタン時間
```
— CTRL.S

**DeathVelocity = 33**。落下速度が33を超えたら死亡。22を超えたらダメージ（「ウッ」という声）。掴まれる範囲は-8、最大落下速度32まで。

これらの数値は4年間のプレイテストで調整された。33と22の差——11ユニットが「ダメージを受けるが死なない」ゾーンだ。この11ユニットの中に、ゲームデザインの微妙なバランスが凝縮されている。

### 痕跡4：pressplate, slicer, loose——ダンジョンの仕掛け

```
space = 0
floor = 1
spikes = 2
gate = 4
pressplate = 6      — 圧力プレート
loose = 11          — 落下床
mirror = 13         — 鏡
slicer = 18         — スライサー（刃）
torch = 19          — 松明
bones = 21          — 骨
window = 23         — 窓
```
— MOVEDATA.S

Prince of Persiaの名物ギミックがすべて定数として並んでいる。**pressplate**（踏むと門が開く圧力プレート）、**loose**（乗ると落ちる床）、**slicer**（通ると斬られる刃）、**mirror**（影の自分が現れる鏡）。

各オブジェクトにはタイマーが設定されている。

```
spiketimer, pptimer, slicetimer, gatetimer, loosetimer
```

スパイクが出るタイミング、門が閉まるタイミング、刃が動くタイミング——すべてがフレーム単位のタイマーで制御されている。

### 痕跡5：左向きスプライトの反転技法——メモリ節約の知恵

```
;  Frame def list shows kid, sword in RIGHT hand
;  Altset1 shows enemy, sword in LEFT hand (to be mirrored)
;  (Image tables always show character facing LEFT)
```
— FRAMEDEF.S

全キャラクターのスプライトは**左向きだけ**保存されている。右向きが必要なときは、描画時にミラーリング（左右反転）する。240フレーム×2方向のデータを保存する余裕は、48KB（実質128KB）のメモリにはない。

前作Karatekaでも同じ技法を使っていたが、Prince of Persiaではフレーム数が大幅に増えたため、この節約はさらに重要になった。

### 痕跡6：DRAZ——ロトスコープ専用開発ツール

Mechnerはゲームだけでなく、**開発ツール**も自作した。

```
*   D   R   A   Z
*
*   Hi-res shape table maker (ProDOS/18-sector version)
*   Copyright 1986,1987,1988,1989 Jordan Mechner
```
— DRAZ.S

DRAZは「Hi-res shape table maker」——高解像度スプライトのエディタだ。弟のビデオからトレースしたドット絵を、Apple IIのスプライトフォーマットに変換するためのツール。

```
ANIMSEQ = $1D80      — アニメーションシーケンスエディタ
ANIMDX = $1E00       — フレーム間X移動量
ANIMDY = $1E80       — フレーム間Y移動量
FREEZEF              — フレーム単位の一時停止
```

フレーム間の移動量（dx, dy）を編集し、アニメーションをプレビューし、フリーズして1フレームずつ確認する。1986年に作り始め、4年間改良し続けた。

### 痕跡7：22年後の発掘——「失われていたかもしれない」

2012年、MechnerはGitHubのREADMEにこう書いた。

> *「Thanks to The Internet Archive's Jason Scott and the late Tony Diaz for successfully extracting the source code from a 22-year-old 3.5" floppy disk archive, a task that took most of a long day and night, and would have taken much longer if not for Tony's incredible expertise, perseverence, and well-maintained collection of vintage Apple hardware.」*

22年前のフロッピーディスクからの復元には、Jason Scott（Internet Archive）と故Tony Diaz（Apple II愛好家）の助けが必要だった。丸一日以上の作業。Tony Diazのヴィンテージハードウェアコレクションがなければ、もっと時間がかかっていた。

> *「We extracted and posted the 6502 code because it was a piece of computer history that could be of interest to others, and because if we hadn't, it might have been lost for all time.」*

「もしそうしなければ、永遠に失われていたかもしれない」——このプロジェクト、Legacy Code Archiveが存在する理由そのものだ。

---

## 推定される経緯

**1984年**: Jordan MechnerがYale大学在学中にKaratekaをリリース。シネマティックアクションの先駆け。

**1985年**: Prince of Persiaの開発開始。弟をビデオ撮影し、ロトスコーピングの実験を始める。

**1986年**: 開発ツールDRAZの初版。スプライトエディタとアニメーションプレビューア。

**1989年9月7日**: Prince of Persia 1.0完成。6502アセンブリ、29ソースファイル。

**1989年10月**: Mechnerが「6502プログラミングの銃を置いた」。Brøderbund Softwareから発売。

**1990年代-2000年代**: PC、SNES、メガドライブ、ゲームボーイ等に移植。2003年に「Sands of Time」で3D化。2010年にディズニー映画化。

**2012年**: 父親の自宅から22年前のフロッピーディスクを発掘。Internet ArchiveとTony Diazの助けで復元。GitHubに公開。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| ソースファイル | 29本 (6502 ASM) |
| 開発期間 | 4年 (1985-1989) |
| アニメーションフレーム | 240以上 |
| シーケンス定義 | 111個 |
| フレームデータサイズ | 5バイト/フレーム |
| メモリ要件 | 128KB (Apple //c or //e) |
| 開発ツール | DRAZ (自作、4年間改良) |
| フロッピー発掘 | 2012年 (22年後) |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.023
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Prince of Persia (1985-1989, 6502 ASM)
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
22年前のフロッピーディスクから復元されたオリジナルソースコードが、作者本人によってGitHubに公開されている。フロッピーが見つからなければ、永遠に失われていた。物理メディアからのデジタル考古学の成功例。

### 技術的負債密度: ★★☆☆☆
4年間の開発で磨かれた6502アセンブリは驚くほど整理されている。フレーム定義テーブル、物理演算定数、オブジェクト型定義——データ駆動設計が一貫している。ただしメモリバンク切り替えの複雑さは時代の制約による不可避な負債。

### 考古学的価値: ★★★★★
シネマティックプラットフォーマーの始祖。ロトスコーピングをゲームに持ち込んだ最初の商業的成功例。開発ツール（DRAZ）まで含めて完全なソースが公開されている——開発プロセス全体の一次資料。

### 読み物としての面白さ: ★★★★★
Yale大学生が弟をビデオ撮影し、4年かけて6502アセンブリでロトスコープを実装し、22年後に父の押入れからフロッピーを発掘する——この物語にフィクションは不要。

---

## 鑑定人所見

Prince of Persiaは「発掘」の物語だ。

ゲーム自体がアラビアンナイトの「王子を救出する」物語であり、ソースコードもまた22年間フロッピーディスクの中に閉じ込められていた「失われた宝物」だった。

最も印象的なのは、**240フレームの5バイトデータ**だ。弟の走り、跳び、ぶら下がりを1フレームずつビデオからトレースし、Apple IIのドット絵に変換し、5バイトのデータ構造にエンコードする。1985年の技術で、2026年のモーションキャプチャーの先駆けをやっていた。

**DeathVelocity = 33**。この定数の背後に4年間のプレイテストがある。33と22の差——11ユニットの「ダメージを受けるが死なない」ゾーン。ゲームデザインとは、こういう数字を決めることだ。

Mechnerは「6502プログラミングの銃を置いた」と書いた。しかし彼が置いた銃は、22年後に父の押入れで見つかった。そしてGitHubで永遠に保存されることになった。

消えゆく古いコードを救うのは、いつも「もしそうしなければ、永遠に失われていた」という危機感だ。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
