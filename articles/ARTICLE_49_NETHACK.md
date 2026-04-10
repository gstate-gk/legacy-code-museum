# 匿名の開発チームが36年間作り続けた迷宮——哲学教授は死後もランプを売り続けている

## はじめに

GitHubの片隅に「伝説」のコードを見つけた。

**NetHack**。1987年、匿名の開発チーム「DevTeam」がC言語で書き始めたローグライクゲームだ。

約323,000行。398ファイル。129のコアソースファイル。**36年間、開発が続いている。**

Rogue（鑑定書 #035）の子孫だが、規模が桁違いだ。`options.c` だけで8,272行——ゲームの設定ファイルが、多くのゲームの全ソースコードより大きい。

DevTeam は素性をほとんど明かさない。リリース間隔は予告なし。**2003年から2015年まで12年間、一切のリリースがなかった。** 世界中のプレイヤーが「開発終了か」と思った。そして突然、3.6.0がリリースされた。

このゲームのコードの中で、一人の男がランプを売り続けている。**Izchak Miller**——哲学教授であり、DevTeam の創設メンバー。1994年に癌で亡くなった。しかしゲームの中では、Minetown のランプ屋の店主として永遠に生き続けている。

---

## 「DevTeam はすべてを考えていた」

NetHack には伝説がある——**TDTTOE（The DevTeam Thinks of Everything）**。

プレイヤーがどんなバカバカしい行動を取っても、ゲームが対応している。

---

## 発掘された痕跡

### 痕跡1：Cockatrice の死体で敵を殴ると石化する

Cockatrice（コカトリス）は触れた者を石に変える怪物だ。その死体を拾って武器として使うとどうなるか？

```c
case CORPSE:
    if (touch_petrifies(&mons[obj->corpsenm])) {
        You("hit %s with %s.", mon_nam(mon),
            corpse_xname(obj, (const char *) 0, ...));
        if (!munstone(mon, TRUE))
            minstapetrify(mon, TRUE);
```

**敵が石化する。** しかし手袋なしで拾うとプレイヤーも石化する。

さらに——Cockatrice の **卵** を投げつけても石化する。

```c
pline("Splat!  You hit %s with %s %s egg%s!", mon_nam(mon), ...);
```

さらに——手袋なしで Cockatrice の死体を持っているとき、Nymph（ニンフ）に盗まれると、**盗んだニンフが石化する**。

```c
staticfn boolean
theft_petrifies(struct obj *otmp)
{
    if (uarmg || otmp->otyp != CORPSE
        || !touch_petrifies(&mons[otmp->corpsenm]) || Stone_resistance)
        return FALSE;
```

**DevTeam はすべてを考えていた。**

### 痕跡2：シュレーディンガーの猫が箱の中にいる

ゲーム内に「シュレーディンガーの箱」が存在する。

```c
case CAT_CHECK: /* Schroedinger's Cat */
    /* Ascending is deterministic */
    if (SchroedingersBox(otmp))
        return rn2(2);
```

箱を開けるまで、猫は生きているか死んでいるか不定（50%）。**量子力学のネタが完全に実装されている。**

クリア時に猫が生きていれば、スコア画面に「...and Schroedinger's cat」と追加される。

### 痕跡3：Izchak の墓石——「Ascended」

NetHack 3.2.0（1996年）は、創設メンバー Izchak Miller への追悼バージョンだ。

ソースコードに二枚の墓石のASCIIアートが残されている——

```c
"              ----------                      ----------",
"             /          \\                    /          \\",
"            /    REST    \\                  /    This    \\",
"           /      IN      \\                /  release of  \\",
"          /     PEACE      \\              /   NetHack is   \\",
"         /                  \\            /   dedicated to   \\",
"         |                  |            |  the memory of   |",
"         |                  |            |  Izchak Miller   |",
"         |                  |            |   1935 - 1994    |",
"         |                  |            |     Ascended     |",
```

**「1935 - 1994, Ascended」**。NetHack で「Ascend（昇天）」はゲームクリアを意味する。Izchak は、コードの中で昇天した。

### 痕跡4：Izchak はまだランプを売っている

ゲーム内の Minetown（鉱山の街）に、ランプ屋がある。店主の名前は **Izchak**——他の店主名は全てランダムだが、Izchak だけは固定だ。

```c
/* special-case minetown lighting shk */
shname = "+Izchak";
shk->female = FALSE;
```

そして Izchak には専用の台詞がある——

```c
static const char *Izchak_speaks[] = {
    "%s says: 'These shopping malls give me a headache.'",
    "%s says: 'Slow down.  Think clearly.'",
    "%s says: 'You need to take things one at a time.'",
    "%s says: 'I don't like poofy coffee... give me Colombian Supremo.'",
    "%s says that getting the devteam's agreement on anything is difficult.",
```

**「DevTeam の合意を得るのは難しい」**——亡くなった開発者自身に、この台詞を言わせている。

プレイヤーがゲームクリアに必要なアイテム（Amulet of Invocation）を売ろうとすると、Izchak は——

```c
verbalize("No thanks, I'd hang onto that if I were you.");
```

「いいえ、私だったらそれは手放さないよ。」——**死後もプレイヤーを助けようとしている。**

### 痕跡5：店主名の秘密——開発者名の逆読み

道具屋の店主名は、全て **DevTeam メンバーの名前の逆読み** だ。

| 店主名 | 逆読み → 実名 |
|:---|:---|
| Kachzi Rellim | Miller Izchak |
| Nosnehpets | Stephenson |
| Noskcirdneh | Hendrickson |
| Cire Htims | Eric Smith |
| Rellenk | Kneller |

匿名のDevTeamが、店主名の中にだけ自分たちの名前を——逆さまに——残している。

### 痕跡6：12年の沈黙——「静かに水面下で」

公式の歴史ファイルにこう書かれている——

> *「NetHack 3.4.3のリリース（2003年12月）は、長いリリース休止期間の始まりとなった。3.4.3は驚くほど安定したバージョンで、コミュニティに10年以上にわたって楽しみを提供した。NetHack Development Team は、3.4.3の在任期間中、静かに水面下でゲームの開発を続けていた。」*

12年間、一切のリリースなし。2014年9月に非公式スナップショットが流出したが、DevTeam は「3.4.4も3.5も正式リリースしない」と声明を出した。

そして **2015年12月、突然 3.6.0 がリリースされた。** 12年の沈黙を破って。

### 痕跡7：神を怒らせると雷と分解ビームが来る

祈りのシステムは精緻を極めている。信仰度は数値化されている——

`PIOUS(20)` > `DEVOUT(14)` > `FERVENT(9)` > `STRIDENT(4)`

神を怒らせると、まず雷撃。耐えると——

```c
pline("%s is not deterred...", align_gname(resp_god));
pline("A wide-angle disintegration beam hits you!");
```

「神はひるまない……広角分解ビームがあなたに命中！」

雷に耐えても分解ビームが来る。**神は2段階で殺しに来る。**

---

## MoMAに収蔵されたフリーゲーム

2022年9月、NetHack は **ニューヨーク近代美術館（MoMA）** の展覧会「Never Alone: Video Games and Other Interactive Design」に収蔵された。

1987年のフリーゲームが、現代美術として認められた。商業ゲームではない。広告費もない。匿名の開発チームが36年間作り続けたASCIIの迷宮が、美術館に入った。

---

## 推定される経緯

**1980年**: Rogue 完成。

**1982年**: Jay Fenlason が Hack を作成。

**1984年**: Andries Brouwer が Hack 1.0 を Usenet にポスト。

**1987年**: Mike Stephenson が NetHack 1.4 をリリース。

**1993年**: NetHack 3.1。Izchak Miller が調整役。

**1994年**: Izchak Miller、癌で死去。

**1996年4月**: NetHack 3.2.0。Izchak への追悼バージョン。

**2003年12月**: NetHack 3.4.3 リリース。以後12年の沈黙。

**2015年12月**: NetHack 3.6.0 リリース。沈黙を破る。

**2022年9月**: MoMA に収蔵。

**2023年2月**: NetHack 3.6.7（最新安定版）。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| 実装言語 | C + Lua（3.7〜） |
| ソースコード | 約323,000行 / 398ファイル |
| 最大ファイル | options.c（8,272行） |
| 開発期間 | 1987年〜現在（36年間） |
| 最長リリース間隔 | 12年（2003-2015） |
| ペットシステム | あり（猫、犬等を手懐け可能） |
| 宗教システム | 信仰度数値化（PIOUS/DEVOUT/FERVENT/STRIDENT） |
| 死因 | 16種（died, choked, starvation, turned to stone, genocided 等） |
| bones | 前回死亡キャラの幽霊が次プレイに出現 |
| MoMA | 2022年収蔵 |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.038
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】NetHack 3.6 (1987〜現在, C)
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
C言語。言語自体は一般的だが、36年間継続開発されているフリーゲームのソースコードという存在自体が稀少。匿名DevTeamによる開発スタイルも独特。

### 技術的負債密度: ★★★★☆
323,000行の36年間の増築。options.c だけで8,272行。Amiga/Atari/WinCE の旧ポートが outdated/ に残存。しかしゲームロジックの複雑さは「負債」ではなく「深さ」だ。

### 考古学的価値: ★★★★★
**ローグライクの完成形。** Rogue の子孫として最も深く進化した形。TDTTOE の伝説。MoMA 収蔵。Izchak Miller への追悼が36年間コードに生き続けている。

### 読み物としての面白さ: ★★★★★
Cockatrice の死体問題、シュレーディンガーの猫、Izchak の墓石と台詞、店主名の逆読み、12年の沈黙、神の2段階攻撃、MoMA 収蔵——コードの中に人間のドラマと遊び心が凝縮。

---

## 鑑定人所見

NetHack は「遺跡」だ。

323,000行。36年間。匿名の開発チームが、素性を明かさず、予告なく、静かに作り続けた迷宮。12年間の沈黙の後、突然リリースが再開された。誰が作っているのか、なぜ作り続けているのか——外からは見えない。遺跡を掘り続ける考古学者のように、DevTeam はコードを掘り続けている。

最も心に残るのは **Izchak Miller** だ。哲学教授。DevTeam の創設メンバー。1994年に癌で亡くなった。しかし彼はまだ Minetown でランプを売っている。「ゆっくり行け。明確に考えろ」。「DevTeam の合意を得るのは難しい」。プレイヤーがクリアに必要なアイテムを売ろうとすると「私だったら手放さない」と言ってくれる。

**死者がコードの中で生き続けている。** これはプログラミングという行為の最も美しい側面だ。

店主名の逆読みは、匿名の DevTeam が自分たちの存在を刻む唯一の方法だった。「Kachzi Rellim」——Miller Izchak。名前を逆さまにして、ゲームの中に隠した。見つけた者だけが、開発者の名前を知ることができる。

Colossal Cave Adventure（鑑定書 #037）は「洞窟」だった——父の愛がコードに保存された。NetHack は **「遺跡」** だ——36年間、匿名の人々が掘り続けた迷宮。そして死者はまだその中でランプを売っている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
