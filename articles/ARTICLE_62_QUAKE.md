# DOOMの次に地獄を開いたら、そこは完全な3D空間だった——QuakeCという独自言語を内蔵したエンジン

## はじめに

GitHubの片隅に「次元」のコードを見つけた。

**Quake**。1996年、John Carmack が C言語と8086アセンブリで書いた、世界初の完全3Dファーストパーソンシューティングゲームだ。

約80,000行（WinQuake）。C 86%、アセンブリ 13%。**DOOM（鑑定書 #044）が「2.5D」だったのに対し、Quake は真の3D空間を実現した。**

DOOM は高さの概念があるように見えて、実際には2Dマップに高さ情報を付加したものだった。上を見上げることも、下を見下ろすこともできなかった。Quake はそれを根本から変えた。**6自由度のカメラ。任意の角度のポリゴン。完全な3D空間。**

開発には Michael Abrash が参加した。「Power Graphics Programming」の著者であり、Windows NT のグラフィックスコードを書いた男だ。Carmack がアーキテクチャを設計し、Abrash がアセンブリで極限まで最適化した。**Abrash の最適化がなければ、Quake のフレームレートは半分だった。**

そしてもう一つ、Quake には革命があった。**QuakeC**——ゲームロジックを記述するための独自プログラミング言語と、その仮想マシンを内蔵していた。MOD 文化の爆発。Team Fortress、Capture the Flag——プレイヤーが「ゲームの中にゲームを作る」文化が、ここから始まった。

---

## 発掘された痕跡

### 痕跡1：完全な3D——DOOMとの決別

```c
typedef struct {
    vec3_t  modelorg;      /* viewpoint relative to entity */
    vec3_t  r_entorigin;   /* world coordinates */
    float   entity_rotation[3][3];  /* 3x3 rotation matrix */
} ...
```

`r_bsp.c`——Quake のレンダリングコア。**3×3回転行列** でエンティティを任意の角度に回転させる。DOOM にはなかった概念だ。DOOM の BSP はラインセグメントを扱っていたが、Quake の BSP は **ポリゴンの平面** を扱う。

BSP ツリーの使い方も進化した。DOOM（鑑定書 #044）では Carmack が学術論文の「奥→手前」を逆転させたが、Quake ではさらに **PVS（Potentially Visible Set）** を導入した。各リーフノードから「見える可能性のあるリーフ」を事前計算し、圧縮してマップに埋め込む。**描画すべきものだけを描画する。**

### 痕跡2：QuakeC——ゲームの中のプログラミング言語

```c
typedef struct {
    int     s;          /* statement counter */
    dfunction_t *f;     /* function pointer */
} prstack_t;

#define MAX_STACK_DEPTH 32
#define LOCALSTACK_SIZE 2048
```

`pr_exec.c`——**QuakeC 仮想マシンのインタプリタ。** スタック深度32、ローカル変数2,048個。QuakeC のソースコードは `qcc` コンパイラで `progs.dat` というバイトコードにコンパイルされ、エンジン内蔵の仮想マシンで実行される。

**Java が登場した翌年に、ゲームエンジンの中にバイトコード仮想マシンが組み込まれていた。**

オペコードテーブル：`ADD_F`、`MUL_V`、`STORE_ENT`、`CALL0`〜`CALL8`、`GOTO`、`IF`、`IFNOT`。**C に似た構文で、ゲームロジックの全て** ——武器の挙動、モンスターのAI、物理ルール——をプレイヤーが書き換えられた。

1996年7月25日、Carmack は QuakeC のソースコードとコンパイラを公開した。Quake 発売のわずか1ヶ月後。**エンジンではなく、言語を公開した。** その結果：

- **Team Fortress** — クラスベースのチーム戦。後の Team Fortress 2 の祖先
- **Capture the Flag** — 旗取りモード。FPS の定番ルールに
- 数千の MOD が QuakeC で書かれた

### 痕跡3：「evil floating point bit level hacking」

```c
float Q_rsqrt( float number )
{
    long i;
    float x2, y;
    const float threehalfs = 1.5F;

    x2 = number * 0.5F;
    y  = number;
    i  = * ( long * ) &y;                       // evil floating point bit level hacking
    i  = 0x5f3759df - ( i >> 1 );               // what the fuck?
    y  = * ( float * ) &i;
    y  = y * ( threehalfs - ( x2 * y * y ) );   // 1st iteration
    return y;
}
```

**高速逆平方根。** コンピュータ史上最も有名なハックの一つ。Quake III Arena（1999年）のコードだが、その原型は Quake 時代から存在した。

`0x5f3759df` という「マジックナンバー」を使って、浮動小数点数のビットパターンを整数として操作し、逆平方根の近似値を高速に求める。コメントが全てを語っている：**「evil floating point bit level hacking」** と **「what the fuck?」**。

Carmack が書いたと思われていたが、実際の原作者は Greg Walsh であることが2006年に判明した。**天才のコードは、別の天才から借りたものだった。**

### 痕跡4：Abrash の最適化——フレームレートが倍になった

Carmack がエンジンのアーキテクチャを変更するたびに、Abrash は低レベルのアセンブリコードを **書き直さなければならなかった。** しかしその最適化がなければ、Quake のフレームレートは半分だった。

```
C 86.2%
Assembly 13.3%
```

**13%のアセンブリが、パフォーマンスの50%を支えていた。** Carmack の C コードだけでもゲームは動くが（README にも「C のみでビルド可能だが速度は約半減」と書かれている）、Abrash のアセンブリがあって初めて「遊べる」フレームレートになった。

### 痕跡5：`.plan` ファイル——最初のデベロッパーブログ

Carmack は Unix の `finger` プロトコルを使って、`.plan` ファイルに開発の進捗を書いた。**世界初のデベロッパーブログ。**

1996年8月8日の `.plan` エントリ：

> 「Romero は id を去った。今後、我々のプロジェクトについて大げさな発言はなくなるだろう」

二人の John の物語（DOOM 鑑定書 #044 参照）の終章。Quake の開発中、Romero と Carmack は対立した。Romero は妥協のないビジョンを追求し、Carmack は着実な進捗を求めた。1996年8月6日、Romero は id Software を去った。

**`.plan` ファイルは技術的な進捗報告であると同時に、チームの崩壊の記録でもあった。**

### 痕跡6：自分自身をクリップしない

```c
/* entities never clip against themselves, or their owner */
/* line of sight checks trace->crosscontent, but bullets don't */
```

`world.c`——衝突検出のルール。エンティティは **自分自身や自分の生成者と衝突しない。** ロケットが発射した瞬間にプレイヤーに当たらないためのハック。

そして、視線チェックと弾丸で **衝突判定のルールが違う。** 視線は透明な壁を通過するが、弾丸は通過しない。**物理法則ではなく、「ゲームとして面白いかどうか」でルールが決まる。**

---

## Wolf3D → DOOM → Quake：id Software 三部作

| | Wolf3D (#033) | DOOM (#044) | Quake |
|---|---|---|---|
| 年 | 1992 | 1993 | 1996 |
| 次元 | 2D（高さなし） | 2.5D（高さあり、見上げ不可） | 真の3D |
| レンダリング | レイキャスティング | BSP（ラインセグメント） | BSP（ポリゴン） + PVS |
| 壁 | 90度のみ | 任意の角度 | 任意の3Dポリゴン |
| MOD | なし | WAD（データ差し替え） | QuakeC（プログラミング言語） |
| ネットワーク | なし | ピアツーピア | クライアント/サーバー |
| 開発環境 | DOS PC | NeXT | NeXT → Windows |
| アセンブリ | セルフモディファイング | なし（C のみ） | Abrash の極限最適化 |

**技術が飛躍するたびに、ゲームの形が変わった。** そして Quake で到達した「真の3D + MOD 文化 + クライアント/サーバー」は、2026年のオンライン FPS の基盤になっている。

---

## 推定される経緯

**1995年**: Quake 開発開始。Carmack が真の3D エンジンの設計に着手。Michael Abrash が id Software に参加。

**1996年2月24日**: QuakeWorld（オンライン対戦最適化版）の構想開始。

**1996年6月22日**: Quake リリース。

**1996年7月25日**: QuakeC ソースコードとコンパイラ公開。MOD 文化爆発。

**1996年8月6日**: John Romero が id Software を去る。

**1996年8月8日**: Carmack の `.plan`：「Romero は去った。大げさな発言はなくなる」。

**1996年12月**: Team Fortress MOD リリース。クラスベースの FPS が誕生。

**1999年12月21日**: エンジンのソースコードを GPL-2.0 で公開。

**2026年現在**: Quake のエンジンコードは数百のゲームやプロジェクトに派生。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| 実装言語 | C 86% + Assembly 13% |
| ソースコード | 約80,000行（WinQuake） |
| レンダリング | BSP + PVS（Potentially Visible Set） |
| 内蔵言語 | QuakeC（バイトコード仮想マシン） |
| VM スタック | 深度32、ローカル変数2,048 |
| ネットワーク | クライアント/サーバーモデル |
| 公開日 | 1999年12月21日（GPL-2.0） |
| ゲームリリース | 1996年6月22日 |
| アセンブリ最適化 | Michael Abrash（フレームレート2倍） |
| 開発者 | John Carmack + Michael Abrash |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.051
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Quake (1996, C + Assembly)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年4月

■ 鑑定結果
  希少度:          ★★★☆☆
  技術的負債密度:    ★★★☆☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★☆☆
C言語 + アセンブリ。GPL で公開済み。DOOM ほどの知名度はないが、技術的影響力はむしろ Quake の方が大きい。

### 技術的負債密度: ★★★☆☆
Abrash のアセンブリ最適化は「美しい負債」。C のみでもビルドできるが速度は半減。QuakeC VM は堅実な設計だが、スタック深度32の制約は MOD 開発者を悩ませた。

### 考古学的価値: ★★★★★
**真の3D FPS の起源。** QuakeC による MOD 文化は、Steam Workshop、Minecraft MOD、Roblox まで続く「ユーザー生成コンテンツ」の祖先。クライアント/サーバー型ネットワークモデルは現代のオンラインゲームの標準。PVS による可視性計算は Unreal Engine にも影響。

### 読み物としての面白さ: ★★★★★
id Software 三部作の完結編。Abrash との協業、QuakeC の誕生、Romero の離脱、`.plan` ファイル、「evil floating point bit level hacking」——技術とドラマの両方が詰まっている。

---

## 鑑定人所見

Quake は「次元」だ。

Wolfenstein 3D（鑑定書 #033）が「扉」を開き、DOOM（鑑定書 #044）が「炎」を燃やした。Quake は **新しい次元** を開いた。2.5D から真の3Dへ。データ差し替えからプログラミング言語へ。ピアツーピアからクライアント/サーバーへ。全てが一段階上に引き上げられた。

最も象徴的なのは **QuakeC** だ。ゲームエンジンの中にプログラミング言語と仮想マシンを内蔵するという発想。プレイヤーは「遊ぶ」だけでなく「作る」ことができるようになった。Team Fortress はプレイヤーが QuakeC で書いた MOD だ。それが後に Valve に買収され、Team Fortress Classic、Team Fortress 2 になった。**プレイヤーが書いた MOD が、産業になった。**

そして「evil floating point bit level hacking」と「what the fuck?」——コンピュータ史上最も有名なコメントの一つが、このエンジンの系譜から生まれた。天才が天才のコードを借り、コメントで「何だこれ」と書く。**コードは人間の驚きも記録する。**

DOOM は「炎」だった——FPS を燃え上がらせた。Quake は **「次元」** だ——全てを一段階上に引き上げ、「遊ぶ」と「作る」の境界を壊した。id Software 三部作の完結編にふさわしい。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
