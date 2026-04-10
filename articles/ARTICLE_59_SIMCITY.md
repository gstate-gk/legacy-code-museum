# 爆撃ゲームの地図エディタの方が面白かった——「勝てないゲーム」を発明した男

## はじめに

GitHubの片隅に「都市」のコードを見つけた。

**Micropolis（SimCity）**。1989年、Will Wright が C言語で書いた都市シミュレーションゲームだ。

約15,000行（シミュレーションコア）。C 49%、Tcl 11%、C++ 16%。**「勝つことができない」世界初の商用ゲーム。**

始まりは爆撃ゲームだった。1984年、Wright は Commodore 64 向けに **Raid on Bungeling Bay** というシューティングゲームを作っていた。島を爆撃するゲーム。しかし Wright は気づいた——**レベルエディタで島を作っている方が、爆撃するより面白い。**

Wright は地図エディタを独立させ、都市計画の本を読み始めた。Jay Forrester の **『Urban Dynamics』**、Christopher Alexander の都市理論。Stanisław Lem の SF 短編 **『The Seventh Sally』** からもインスピレーションを得た。

結果は **SimCity**——勝利条件がないゲーム。ゴールもスコアもエンディングもない。Wright 自身が言う：**「プレイヤーにおもちゃを渡す。プレイヤーがそれをゲームに変える」。**

2008年、Electronic Arts は SimCity のソースコードを **GPLv3** で公開した。One Laptop Per Child（OLPC）プロジェクトのために。商標の関係で名前は **Micropolis**（SimCity の元々の開発コードネーム）に変更された。世界中の子供たちに、都市の仕組みを教えるために。

---

## 発掘された痕跡

### 痕跡1：16ステップの心臓

```c
void
Simulate(int mod16)
{
    /* Cases 1-8: MapScan segments divide the game world into eighths */
    /* Case 9: Census and tax collection */
    /* Cases 10-15: Power, pollution, crime, population density, fire */
}
```

`s_sim.c`——SimCity のシミュレーションは **16フェーズのサイクル** で回る。都市のマップを8分割してスキャンし、残りのフェーズで電力、汚染、犯罪、人口密度、火災を処理する。

全てが **1つのメインループ** で回る。フレームごとに1フェーズだけ処理し、16フレームで1サイクル。**ゲームが重くならないように、都市の「生きている感」を分散処理で実現した。** 1989年のハードウェアで。

### 痕跡2：3つのバルブ——R・C・I の呼吸

```c
int RValve, CValve, IValve;  /* Residential, Commercial, Industrial growth valves */
int ResCap, ComCap, IndCap;  /* Zone capacity limits */
float EMarket = 4.0;          /* External market baseline */
```

SimCity の都市は **3つのバルブ** で呼吸する。住宅（Residential）、商業（Commercial）、工業（Industrial）。各バルブの正負が、ゾーンの成長と衰退を決める。

雇用率、出生率、移民率を計算し、バルブの値を調整する。電力が途絶えると **-500 のペナルティ** が課され、成長は即座に止まる。汚染が高いと住宅の「魅力」が下がり、人口が流出する。

**都市の成長は「数式」ではなく「バランス」だ。** Wright は個々のルールは単純だと語っている。しかし単純なルールが相互作用すると、複雑な振る舞いが生まれる。

### 痕跡3：交通シミュレーション——30タイルの旅

```c
/* TryDrive(): distance-limited search (max 30 tiles) */
/* TryGo(): randomizes direction, skips last direction to prevent oscillation */
```

`s_traf.c`——交通は **最大30タイルの探索** で目的地を見つける。住宅ゾーンからの交通は商業・工業ゾーンを探し、逆もまた然り。

経路探索はランダム化されている。直前に来た方向をスキップして、振動を防ぐ。行き止まりに達するとスタックをポップして戻る。**完璧な最短経路ではなく、「それっぽい」交通の流れ。** 

交通密度が上がると警察のスプライトが出動する。渋滞が犯罪を呼ぶ——Wright の都市理論がコードに織り込まれている。

### 痕跡4：怪獣は汚染から生まれる

```c
/* MakeMonster(): conditionally triggered when pollution averages above threshold */
/* MakeMeltdown(): searches map for nuclear power plants and triggers failure */
```

`s_disast.c`——災害シミュレーション。火災、洪水、地震、竜巻、**怪獣**、原発メルトダウン。

怪獣は **汚染レベルが閾値を超えると出現する。** 環境破壊の報いが、巨大怪獣という形で都市を襲う。原発メルトダウンはマップ上の原子力発電所を検索して、見つかったら破壊する。

シナリオモードでは実在の都市と災害が結びつく——サンフランシスコの地震、東京の怪獣。**ゲームと現実が交差する瞬間。**

### 痕跡5：C64 → Mac → SunOS → Unix → Web への進化

```
C64 → Mac → SunOS/NeWS/HyperLook → Unix/X11/TCL/Tk → C++/Emscripten/TypeScript/SvelteKit
```

SimCity のコードは **6世代のプラットフォーム** を渡り歩いた。Commodore 64 から始まり、Mac、SunOS（NeWS ウィンドウシステム + PostScript UI）、X11/Tcl/Tk、そして現代の Web 技術まで。

Don Hopkins が Sun ワークステーション向けにポートし、**PostScript で UI を書いた** バージョンが存在する。DOOM（鑑定書 #044）が NeXT 上で開発されたように、SimCity も Sun/NeWS という「消えたプラットフォーム」の上を通過した。

### 痕跡6：子供たちのために公開された

```c
/* Copyright (C) 1989 - 2007 Electronic Arts Inc. */
/* This program is free software: you can redistribute it and/or modify */
/* it under the terms of the GNU General Public License */
```

2008年、Will Wright と Don Hopkins は Electronic Arts を説得して、SimCity のソースコードを GPLv3 で公開した。**One Laptop Per Child（OLPC）** プロジェクトのために。

発展途上国の子供たちに $100 のラップトップを届けるプロジェクト。そのラップトップに、都市の仕組みを教えるソフトウェアが必要だった。Wright は **「ゲーム」ではなく「教育ツール」** として SimCity を再定義した。

商標の問題で「SimCity」の名前は使えなかった。代わりに **Micropolis**——Wright が1985年に最初につけた開発コードネームが、20年後に復活した。

---

## 「勝てないゲーム」の発明

SimCity 以前、ゲームには勝利条件があった。敵を倒す。スコアを上げる。クリアする。

Wright はそれを否定した。**「ソフトウェアトイ」** という概念——勝つことも負けることもできず、ただ遊び続けるもの。

Wright のデザイン哲学：「シミュレーションの大部分は、実はかなり単純なルールで構成されている。しかしこれらの単純なルールが相互作用すると、大きな複雑さが生まれる」。

この思想は後の **The Sims**（2000年）、**Spore**（2008年）に受け継がれた。そして「サンドボックスゲーム」というジャンル全体——**Minecraft** を含む——の先祖になった。

---

## 推定される経緯

**1984年**: Will Wright、Commodore 64 向け Raid on Bungeling Bay をリリース。レベルエディタの方が面白いことに気づく。

**1985年**: 都市シミュレーションの開発を開始。開発コードネーム「Micropolis」。

**1987年**: Jeff Braun と共に Maxis を設立。

**1989年2月2日**: SimCity リリース（Mac/Amiga/IBM PC）。

**1990年頃**: Unix 版リリース。Don Hopkins が Sun ワークステーション向けにポート。

**1992年頃**: Don Hopkins が Tcl/Tk 版を開発。マルチプレイヤー対応。

**2000年**: The Sims リリース。SimCity の思想を「人」に適用。

**2008年1月**: EA が SimCity のソースコードを GPLv3 で公開。OLPC のため。Micropolis と改名。

**2026年現在**: MicropolisCore（C++/TypeScript/SvelteKit）として進化継続中。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| 実装言語 | C 49% + Tcl 11% + C++ 16% |
| ソースコード | 約15,000行（シミュレーションコア） |
| シミュレーション | 16フェーズサイクル |
| ゾーンタイプ | 住宅(R)・商業(C)・工業(I) |
| 交通探索 | 最大30タイル、ランダム化経路 |
| 災害 | 火災・洪水・地震・竜巻・怪獣・メルトダウン |
| プラットフォーム | C64→Mac→SunOS→Unix/X11→Web（6世代） |
| ライセンス | GPLv3（2008年公開） |
| 公開理由 | One Laptop Per Child（OLPC） |
| 開発者 | Will Wright（設計）+ Don Hopkins（Unix ポート・GPL 公開） |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.048
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Micropolis / SimCity (1989, C)
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
C言語だが、6世代のプラットフォームを渡り歩いたコードベース。SunOS/NeWS 版の PostScript UI は既に失われた技術。商用ゲームが教育目的で GPL 公開された稀有な例。

### 技術的負債密度: ★★★☆☆
Don Hopkins が GPL 公開時にコードをクリーンアップし、ANSI C 化、最適化、バグ修正を行った。しかし元のコードはグローバル変数の嵐で、16フェーズサイクルは「美しい」とは言い難い。それでも37年間動き続けている。

### 考古学的価値: ★★★★★
**「サンドボックスゲーム」の起源。** SimCity が定義した「勝利条件のないゲーム」は、The Sims、Spore、Minecraft へと繋がる。都市シミュレーションという概念の発明。OLPC のための GPL 公開は、ソフトウェアの社会的責任の先駆け。

### 読み物としての面白さ: ★★★★★
爆撃ゲームのエディタからの発想、Jay Forrester の都市理論、「おもちゃ」としてのゲーム設計、怪獣が汚染から生まれる設計、子供たちのための GPL 公開——技術と哲学と社会貢献の交差点。

---

## 鑑定人所見

SimCity は「箱庭」だ。

Wright は爆撃ゲームの地図エディタで遊んでいるうちに、**「破壊より創造の方が面白い」** ことに気づいた。そこから都市計画の理論を学び、「勝てないゲーム」を発明した。

最も象徴的なのは **怪獣が汚染から生まれる** ことだ。環境を破壊すると、巨大な怪獣が都市を襲う。これは罰ではない。Wright の言葉を借りれば、**「シンプルなルールの相互作用が複雑さを生む」** 一例だ。汚染→怪獣→破壊→再建。都市は呼吸し、病み、そして再生する。

DOOM（鑑定書 #044）は「炎」だった——FPS というジャンルを燃え上がらせた。SimCity は **「箱庭」** だ——勝利条件を取り除くことで、「遊び」そのものを再定義した。そして2008年、その箱庭は発展途上国の子供たちに手渡された。商用ソフトウェアが社会貢献のために GPL 公開された、最も美しい例の一つだ。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
