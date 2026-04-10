# 離婚した父が娘のために作ったゲームが、全てのアドベンチャーの祖になった——XYZZYと実在の洞窟の物語

## はじめに

GitHubの片隅に「全ての始まり」のコードを見つけた。

**Colossal Cave Adventure**。1976年、BBN Technologies の Will Crowther が FORTRAN IV で書いた、世界初のテキストアドベンチャーゲームだ。

2,948行。150の場所。100のオブジェクト。35の動詞。

```
YOU ARE STANDING AT THE END OF A ROAD BEFORE A SMALL BRICK BUILDING.
AROUND YOU IS A FOREST.  A SMALL STREAM FLOWS OUT OF THE BUILDING AND
DOWN A GULLY.
```

プレイヤーは文字を打ち込んで洞窟を探検する。"GO NORTH"、"GET LAMP"、"XYZZY"。

このゲームが全てのアドベンチャーゲームの祖になった。Zork も、Sierra On-Line も、『ゼルダの伝説』も、全てがここから始まった。

しかし Crowther がこのゲームを作った理由は、技術的挑戦でも商業的野心でもなかった。

**離婚して疎遠になった娘たちが、訪ねてきたときに一緒に楽しめるものを作りたかった。**

---

## ARPANETのルーターを書いた男

Will Crowther は BBN Technologies のプログラマーだった。BBN はインターネットの前身 ARPANET の IMP（Interface Message Processor）——現代のルーターに相当するもの——を開発した会社だ。Crowther はそのルーティングプログラムをアセンブリで書いた。

**インターネットの配管工が、片手間にゲームを作った。**

しかし Crowther にはもう一つの顔があった。妻の Patricia と共に、ケンタッキー州の **Mammoth Cave** を探検する熱狂的なケイバー（洞窟探検家）だった。1972年9月9日、Patricia は歴史的探検に参加し、Flint Ridge 洞窟系と Mammoth Cave 系を接続する通路「The Tight Spot」を発見した。

1976年、二人は離婚した。娘の Sandy と Laura と疎遠になった。

Crowther は娘たちのためにゲームを作ることにした。自分が潜った洞窟を、コンピュータの中に再現する。D&D 仲間との冒険の要素も加える。

完成したゲームを BBN の ARPANET ノードの公開ディレクトリに置いて、そのまま Xerox に転職した。

---

## 発掘された痕跡

### 痕跡1：実在の洞窟がそのままゲームマップになっている

ゲームの部屋の説明に、実在の洞窟の地名がそのまま登場する——

```
65  YOU ARE IN BEDQUILT, A LONG EAST/WEST PASSAGE WITH HOLES EVERYWHERE.
```

**Bedquilt**——Crowther が1975年に実際に測量した洞窟区域だ。

```
33  YOU ARE IN A LARGE ROOM, WITH A PASSAGE TO THE SOUTH, A PASSAGE TO THE
33  WEST, AND A WALL OF BROKEN ROCK TO THE EAST.  THERE IS A LARGE "Y2" ON
33  A ROCK IN THE ROOM'S CENTER.
```

**Y2**——実在する洞窟のポイントで、岩に "Y2" と実際に刻まれている。

元妻の Patricia が洞窟研究者の会議でこのゲームをプレイし、「自分たちが探検した洞窟だ」と気づいた。地図と説明の正確さに驚いたという。

### 痕跡2：XYZZY——妹のわがままから生まれた魔法の言葉

ゲームには魔法の言葉がある。"XYZZY" と唱えると、建物と洞窟の間をテレポートできる。

実装——

```
3   11  62    ← 場所3（建物内）でXYZZY(62) → 場所11（デブリルーム）へ
11   3  62    ← 場所11でXYZZY(62) → 場所3（建物内）へ
```

正しい場所以外で XYZZY を唱えると——

```fortran
IF(K.EQ.62.OR.K.EQ.65)SPK=42
```

メッセージ42番——**「NOTHING HAPPENS.」**

この「XYZZY」は Crowther の **妹 Betty** のわがままから生まれた。プレイテスト中に「毎回最初から歩くのが面倒！」と叫び、魔法のテレポートを要求した。

Crowther の証言——「魔法の言葉は奇妙に見えて、でも発音できるものであるべきだった。ゼロックスへの就職を検討していたので、X から始まる文字が頭にあったのだと思う」。

**この言葉は40年間、プログラマー文化に浸透し続けた。** Windows のマインスイーパーには XYZZY と入力すると地雷の位置がわかるイースターエッグがあった（Windows XP SP3まで）。NASA ゴダード宇宙飛行センターの衛星ソフトウェアでは Noop コマンドとして使われた。セキュリティ書籍には「XYZZY をパスワードにするな」と書かれている。

### 痕跡3：2語パーサー——先頭5文字しか見ない

```fortran
C  GET A COMMAND FROM THE ADVENTURER.  SNARF OUT THE FIRST WORD, PAD IT WITH
C  BLANKS, AND RETURN IT IN WORD1.
```

プレイヤーの入力から「動詞 + 名詞」の2語だけを抽出する。しかも **先頭5文字しか識別しない**。

ゲームは正直に告知している——

```
I SHOULD WARN YOU THAT I LOOK AT ONLY THE FIRST FIVE LETTERS OF EACH WORD
```

PDP-10 の36ビットワードに5文字（各7ビット）をパックする制約から来ている。"NORTHEAST" は "NE" と打つ必要がある。

### 痕跡4：ドワーフのランダム移動——5体の追跡者

洞窟の中を5体のドワーフがランダムに歩き回っている。プレイヤーを「視認」すると追跡を始める。

```fortran
C  THINGS ARE IN FULL SWING.  MOVE EACH DWARF AT RANDOM, EXCEPT IF HE'S SEEN US
C  HE STICKS WITH US.  DWARVES NEVER GO TO LOCS <15.
```

さらに6体目の「海賊」がいて、プレイヤーの宝物を盗む。

最初のドワーフ遭遇——

```
A LITTLE DWARF WITH A BIG KNIFE BLOCKS YOUR WAY.
```

```
A LITTLE DWARF JUST WALKED AROUND A CORNER, SAW YOU, THREW A LITTLE
AXE AT YOU WHICH MISSED, CURSED, AND RAN AWAY.
```

ナイフが当たるかどうかは `PCT(N)=RAN(100).LT.N` ——確率N%。**D&D のダイスロールがそのまま FORTRAN に変換されている。**

### 痕跡5：「A HOLLOW VOICE SAYS "PLUGH"」——25%の確率で聞こえる幽霊

場所33（Y2）にいると、25%の確率で——

```fortran
IF(LOC.EQ.33.AND.PCT(25).AND..NOT.CLOSNG)CALL RSPEAK(8)
```

```
A HOLLOW VOICE SAYS "PLUGH".
```

「空ろな声が "PLUGH" と言った」。PLUGH はもう一つの魔法の言葉だ。25%の確率でヒントが聞こえる。プレイヤーは最初、これが何を意味するか知らない。

### 痕跡6：世界初のスパムでCrowtherを探し当てた

1977年初頭、スタンフォード大学の大学院生 Don Woods がゲームのバイナリを発見した。ソースコードがない。作者の名前だけが手がかりだった。

Woods は **ARPANET 上の全ドメインに `crowther@xxx` 宛のメールを送信した**。

Crowther は Xerox に転職しており、`crowther@xerox` で見つかった。Woods は許可とFORTRAN ソースを得て、部屋数とパズルを倍以上に拡張した。ドワーフ、ドラゴン、トロル、海賊、熊——ファンタジー要素を追加した。

**この「全ドメインに宛てたメール」は、「世界初のスパム」と呼ばれることがある。**

### 痕跡7：「コンピュータ産業を2週間止めた」

ゲームが ARPANET を通じて拡散した後、MIT AI 研究所の Tim Anderson はこう証言した——

> *「コンピュータ産業全体を2週間遅らせた。」*

研究者が誰も研究をせず、ゲームを解くことだけに時間を費やした。

Anderson はその後、MIT で Zork を作った。Adventure に触発されて。

---

## 推定される経緯

**1972年9月**: Patricia Crowther が Mammoth Cave で歴史的接続を発見。

**1975年**: Crowther が Mammoth Cave の地図を測量。

**1976年**: 離婚。娘たちのためにゲームを作成。BBN の ARPANET ノードに公開。

**1977年初頭**: Don Woods が ARPANET 全ドメインにメールを送り、Crowther を発見。

**1977年6月3日**: Woods の拡張版をスタンフォード SAIL でリリース。

**1977年**: MIT で Zork の開発開始（Adventure に触発）。

**1978年**: Scott Adams が Adventureland を発売（最初の商用アドベンチャー）。

**1980年**: Roberta Williams が Mystery House を発売（最初のグラフィックアドベンチャー）。

**2017年**: ESR（Eric S. Raymond）が Open Adventure として現代化。

**2023年**: Ken & Roberta Williams が Unreal Engine で3Dリメイク版をリリース。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| 実装言語 | FORTRAN IV（PDP-10） |
| ソースコード | 2,948行 |
| データファイル | 55,455バイト（12セクション） |
| 場所数 | 150 |
| オブジェクト数 | 100 |
| 動詞数 | 35 |
| パーサー | 2語（先頭5文字のみ識別） |
| ドワーフ | 5体 + 海賊1体 |
| 魔法の言葉 | XYZZY, PLUGH, PLOVER |
| 乱数 | PCT(N) = RAN(100).LT.N |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.037
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Colossal Cave Adventure (1976, FORTRAN IV / PDP-10)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年3月

■ 鑑定結果
  希少度:          ★★★★★
  技術的負債密度:    ★★★☆☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★★
PDP-10 FORTRAN IV。1976年のコードがそのまま GitHub に存在する。36ビットワードのビット操作、5文字パッキング。現代の環境では実行困難。

### 技術的負債密度: ★★★☆☆
2,948行の単一ファイルだが、データ（advent.dat）とロジック（advent.for）が分離されている。12セクションのデータ構造は整然としている。先頭5文字制限は時代の制約。

### 考古学的価値: ★★★★★
**全てのアドベンチャーゲームの祖。** Zork、Infocom、Sierra On-Line、グラフィックアドベンチャー、RPG——全てがここから始まった。XYZZY はプログラマー文化のミームとして50年生き続けている。

### 読み物としての面白さ: ★★★★★
離婚した父の贈り物、実在の洞窟がマップに、ARPANETのルーター開発者がゲームを作る、妹のわがままでXYZZY誕生、世界初のスパムで作者を発見、産業を2週間止めた——コードの向こうに人間の物語がある。

---

## 鑑定人所見

Colossal Cave Adventure は「洞窟」だ。

実在の洞窟が、そのままゲームになった。Y2 という岩に刻まれた文字が、FORTRAN のデータファイルに転写された。Bedquilt という洞窟区域の名前が、ゲームの部屋名になった。Crowther は洞窟探検家としての記憶を、コードに変換した。

最も象徴的なのは **XYZZY** だ。妹の「歩くの面倒」というわがままから生まれた6文字が、50年間プログラマー文化に浸透し続けた。Windows のマインスイーパー、NASA の衛星ソフト、セキュリティ書籍の「悪い例」——一つの FORTRAN の魔法の言葉が、コンピュータ文化の共通語になった。

しかし最も心に残るのは、Crowther がこのゲームを作った **動機** だ。離婚して疎遠になった娘たちのために。「娘たちが訪ねてきたときに一緒に楽しめるもの」。ARPANET のルーティングプログラムを書いた男が、娘への贈り物として洞窟をコードに変えた。

ゲームの語りかけにこうある——

```
MAGIC IS SAID TO WORK IN THE CAVE.  I WILL BE YOUR EYES AND HANDS.
```

「魔法は洞窟の中で効くと言われている。私があなたの目と手になる。」

これは娘への言葉だ。

TeX（鑑定書 #036）は「彫刻」だった。Colossal Cave Adventure は **「洞窟」** だ——実在の洞窟が、父の愛を通じて、コードの中に永遠に保存された。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
