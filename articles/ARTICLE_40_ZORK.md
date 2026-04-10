# 128KBに文明を詰め込んだ絶滅言語——Javaの16年前に「どこでも動く」を実現した男たち

## はじめに

GitHubの片隅に「絶滅言語」のコードを見つけた。

**Zork I**。1979年、MIT の学生たちが設立した Infocom 社が ZIL（Zork Implementation Language）で書いたテキストアドベンチャーゲームだ。

11,889行。110の部屋。120のオブジェクト。全てが128KBに収まっている。

しかし最も驚くべきは言語でもゲームでもない。**Z-machine**——ZIL で書かれたコードを実行する仮想マシンだ。Apple II でも TRS-80 でも CP/M でも Commodore 64 でも、インタプリタさえあれば同じゲームが動く。

**「一度書けばどこでも動く」**——Java が1995年に掲げたスローガンを、1979年に実現していた。

そしてこの言語を使えるプログラマーは、世界にもういない。ZIL は Lisp の方言の方言——MDL（Muddle）から派生した、Infocom 社だけが使った言語だ。1989年の閉鎖と共に、ZIL は死んだ。

---

## 暗闇の中で

> *"It is pitch black. You are likely to be eaten by a grue."*
> （真っ暗だ。グルーに食べられるかもしれない。）

これは Zork の最も有名なメッセージだ。ライトなしで暗い場所を歩くと表示される。

「グルー」とは何か？ Jack Vance の SF 小説『Dying Earth』（1950年）に登場する架空の捕食者だ。Dave Lebling がテスト中、暗い屋根裏でキャラクターが穴に落ちて死んだ。落とし穴の代わりに、光を恐れる怪物を導入した。

ソースコードにはこう書かれている——

```zil
<COND (<NOT ,LIT>
    <TELL "It is pitch black.">
    <COND (<NOT ,SPRAYED?>
           <TELL " You are likely to be eaten by a grue.">)>
    <CRLF>
    <RFALSE>)>
```

そして暗闇で動くと——

```zil
<JIGS-UP
"Oh, no! You have walked into the slavering fangs of a lurking grue!">
```

`JIGS-UP`。死亡処理の関数名だ。この名前自体がユーモアに満ちている。

---

## 発掘された痕跡

### 痕跡1：Javaの16年前の「Write Once, Run Anywhere」

1979年、Joel Berez と Marc Blank は困難に直面していた。

MIT の PDP-10 で動く巨大な Zork を、マイコンに移植しなければならない。しかし当時のマイコンは **全てが非互換** だった。Apple II、TRS-80、CP/M、Commodore 64、Atari 800——CPU もメモリも OS も画面サイズも全て違う。

一つ一つ移植するのは不可能だ。

解決策——**仮想マシン**。UCSD Pascal の p-code モデルにヒントを得て、テキストアドベンチャー専用の軽量VM「Z-machine」を設計した。ゲームコードを「ストーリーファイル」にコンパイルし、各プラットフォームにはインタプリタだけを移植する。

Graham Nelson はこう評した——「おそらく史上最も移植性の高い仮想マシン」。

| | Z-machine (1979) | Java VM (1995) |
|:---|:---|:---|
| 思想 | Write Once, Run Anywhere | Write Once, Run Anywhere |
| バイトコード | Z-code (.z3, .z5) | Java bytecode (.class) |
| インタプリタ | ZIP (各プラットフォーム用) | JVM (各プラットフォーム用) |
| ストーリーファイル | 1ファイルに全データ格納 | JAR（複数クラスを格納） |

**16年の時差。** しかし思想は同じだ。

### 痕跡2：絶滅言語 ZIL——Lisp の方言の方言

ZIL の系譜——

```
Lisp (1958, MIT)
  └── MDL / Muddle (1971, MIT)
        └── ZIL (1979, Infocom)
```

ZIL は MDL（MIT Dynamic Language、通称 Muddle）のサブセットだ。MDL は Lisp の方言で、MIT の学生たちが開発した。ZIL はそこからさらにテキストアドベンチャー専用に特化された。

部屋の定義はこう書く——

```zil
<ROOM EAST-OF-HOUSE
      (IN ROOMS)
      (DESC "Behind House")
      (NORTH TO NORTH-OF-HOUSE)
      (SOUTH TO SOUTH-OF-HOUSE)
      (WEST TO KITCHEN IF KITCHEN-WINDOW IS OPEN)
      (ACTION EAST-HOUSE)
      (FLAGS RLANDBIT ONBIT SACREDBIT)>
```

`WEST TO KITCHEN IF KITCHEN-WINDOW IS OPEN`——「窓が開いていれば台所に行ける」。自然言語に近い条件記述だ。

オブジェクトの定義——

```zil
<OBJECT ADVERTISEMENT
    (IN MAILBOX)
    (SYNONYM ADVERTISEMENT LEAFLET BOOKLET MAIL)
    (ADJECTIVE SMALL)
    (DESC "leaflet")
    (FLAGS READBIT TAKEBIT BURNBIT)
    (TEXT
"\"WELCOME TO ZORK!|
|
ZORK is a game of adventure, danger, and low cunning.\"")
    (SIZE 2)>
```

`FLAGS READBIT TAKEBIT BURNBIT`——このリーフレットは読める、持てる、燃やせる。フラグの組み合わせでオブジェクトの振る舞いを定義する。

**この言語を使えるプログラマーは、もう世界にいない。** Infocom の「Implementor」たちだけが使い、1989年の閉鎖と共に絶滅した。2013年にオープンソースの ZIL コンパイラ「ZILF」が作られたが、それは考古学的復元だ。

### 痕跡3：128KBに文明を詰め込む——ZSCIIの圧縮魔術

Z-machine v3（Zork I のバージョン）のストーリーファイルサイズ上限は **128KB**。ここに110の部屋、120のオブジェクト、膨大なテキスト、パーサー、ゲームロジックの全てを詰め込まなければならない。

解決策——**ZSCII**（Zork Standard Code for Information Interchange）。ASCII のパロディのような名前だ。

- 小文字英字 = 5ビット（1文字）
- 大文字・数字・句読点 = 10ビット（2文字分）
- 3つの Z-character を 2バイトにパック

128KB の中で、Infocom は壮大な地下世界を構築した。迷路だけで15部屋。全てが `"This is part of a maze of twisty little passages, all alike."` と表示される——同じ説明文の迷路は、プレイヤーを発狂させた。

### 痕跡4：死んだ後にもう一回死ぬ

Zork I の死亡処理には、信じられないユーモアが詰まっている。

```zil
<ROUTINE JIGS-UP (DESC "OPTIONAL" (PLAYER? <>))
   <COND (,DEAD
      <TELL "|
It takes a talented person to be killed while already dead. YOU are such
a talent. Unfortunately, it takes a talented person to deal with it.
I am not such a talent. Sorry." CR>
      <FINISH>)>
```

「死んでいる状態で死ぬには才能がいる。あなたにはその才能がある。残念ながら、それに対処するにも才能がいる。私にはその才能がない。ごめん。」

そして歯磨きで死ぬ——

```zil
<JIGS-UP
"Well, you seem to have been brushing your teeth with some sort of
glue. As a result, your mouth gets glued together (with your nose)
and you die of respiratory failure.">
```

「パテで歯を磨いたようですね。結果、口が鼻ごと接着されて呼吸不全で死亡しました。」

死亡メッセージの一つ一つが文学的ユーモアで書かれている。これはバグではなく、**設計思想**だ。

### 痕跡5：PDP-10 のイースターエッグ

ゲーム内に「マシン」というオブジェクトがある。

```zil
<OBJECT MACHINE
    (IN MACHINE-ROOM)
    (SYNONYM MACHINE PDP10 DRYER LID)
    (DESC "machine")>
```

同義語に **PDP10** がこっそり入っている。MIT の PDP-10——Zork が生まれた場所——への密かなオマージュだ。プレイヤーが `EXAMINE PDP10` と入力すれば反応する。

### 痕跡6：「ODYSSEUS」と叫べ——ホメロスの知識が必要なパズル

サイクロプスの部屋で、プレイヤーが "ODYSSEUS" と入力すると——

```zil
<ROUTINE V-ODYSSEUS ()
   <COND (<AND <EQUAL? ,HERE ,CYCLOPS-ROOM>
               <IN? ,CYCLOPS ,HERE>
               <NOT ,CYCLOPS-FLAG>>
          <TELL
"The cyclops, hearing the name of his father's deadly nemesis, flees the room
by knocking down the wall on the east of the room." CR>
```

「サイクロプスは、父の宿敵の名を聞いて、東の壁をぶち破って逃げ出した。」

ホメロスの『オデュッセイア』で、オデュッセウスがサイクロプスの目を潰したことを知らなければ解けない。**1979年のゲームが、紀元前8世紀の文学知識を要求する。**

### 痕跡7：インターネットの父が創業メンバー

Infocom の創業メンバー10人の中に、一人だけ異質な名前がある。

**J.C.R. Licklider**。

「人間とコンピュータの共生」（1960年）を提唱し、ARPA の情報処理技術局長としてARPANET（インターネットの前身）の構築を主導した人物だ。MIT の教授として Infocom の設立に関わった。

**インターネットの父が、テキストアドベンチャーの会社を共同設立していた。**

---

## Infocom の興亡

1979年、MIT の学生たちが夢を持って設立した会社。

**黄金時代**——1981年から1985年。Zork I は38万本を売り、最終的に100万本を超えた。銀河ヒッチハイク・ガイド（Douglas Adams との共同制作）は25万4千本。年間売上は1150万ドルに達した。

同梱物「Feelies」は革新だった。地図、手紙、小道具——コピープロテクトと没入感を同時に実現した。ヒント集「InvisiClues」は透明インクで印刷され、付属のマーカーで擦ると見える。

**転落**——1985年、データベースソフト「Cornerstone」を495ドルで発売。1万本しか売れなかった。開発費の回収は不可能だった。

1986年6月13日、Activision が750万ドルで買収。1989年、Infocom 部門は閉鎖された。

**Implementor たちは Cornerstone の箱をピクニックバスケットとして使った。** 失敗作の箱で弁当を運ぶ——これ以上のブラックユーモアがあるだろうか。

---

## 推定される経緯

**1977年**: MIT PDP-10 上で Tim Anderson、Marc Blank、Dave Lebling、Bruce Daniels が MDL で Zork の開発開始。Colossal Cave Adventure に触発される。

**1979年6月22日**: Infocom 設立。創業メンバー10名（J.C.R. Licklider 含む）。

**1979年**: Joel Berez と Marc Blank が Z-machine を設計。ZIL 言語を開発。

**1980年**: PDP-10 版 Zork を3分割し、Zork I として商用リリース。

**1981-1985年**: 黄金時代。35タイトルをリリース。年間売上1150万ドル。

**1985年**: Cornerstone 発売。商業的大失敗。

**1986年6月13日**: Activision が750万ドルで買収。

**1989年**: Infocom 部門閉鎖。ZIL は絶滅。

**2019年4月**: Jason Scott（Internet Archive）が Infocom 全ソースを GitHub に公開。バックアップドライブから復元。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| 実装言語 | ZIL（Zork Implementation Language） |
| 言語系統 | Lisp → MDL → ZIL |
| 実行環境 | Z-machine v3 |
| ソースコード | 11,889行 / 10ファイル |
| 部屋数 | 110 |
| オブジェクト数 | 120 |
| ストーリーファイル上限 | 128KB |
| テキスト圧縮 | ZSCII（5ビットエンコーディング） |
| パーサー | 多語対応（形容詞、接続詞、代名詞） |
| 最大スコア | 350点 |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.029
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Zork I (1979-1980, ZIL / Z-machine v3)
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
ZIL——Lisp の方言の方言。Infocom 社だけが使い、1989年の閉鎖と共に絶滅した言語。バックアップドライブから復元されたソースコード。コンパイルには ZILF（2013年に作られたオープンソース復元ツール）が必要。

### 技術的負債密度: ★★★☆☆
意外にも負債は少ない。ZIL の宣言的な構文は現代の DSL（ドメイン特化言語）に通じる。部屋定義、オブジェクト定義の可読性は高い。ただし `JIGS-UP` のような非直感的な命名や、グローバル状態への依存は多い。

### 考古学的価値: ★★★★★
**テキストアドベンチャーの金字塔。** Z-machine は Java VM の16年前の先駆。ZIL は Lisp の進化の行き止まりの枝——絶滅した方言の、さらに絶滅した方言。128KB にゲーム全体を詰め込む ZSCII 圧縮。Interactive Fiction コミュニティの原点。

### 読み物としての面白さ: ★★★★★
グルーの恐怖、歯磨きで窒息死、死者を再度殺す才能、PDP-10 のイースターエッグ、ホメロスの知識を要求するパズル、インターネットの父が創業メンバー、そして Cornerstone の箱で弁当——ユーモアとドラマが隅々まで詰まっている。

---

## 鑑定人所見

Zork I は「言葉の迷宮」だ。

グラフィックスはない。サウンドもない。画面には文字だけが流れる。しかしこの文字の世界は、128KB の中に驚くべき密度で詰め込まれている。110の部屋、120のオブジェクト、ホメロスの引用、ブラックユーモア溢れる死亡メッセージ——全てが ZIL という絶滅言語で書かれている。

最も印象的なのは **Z-machine の先見性** だ。1979年に「仮想マシン上でバイトコードを実行する」というアーキテクチャを商用製品に採用した。Java が同じ思想を世界に広めるのは16年後だ。しかし Z-machine は Java と違い、128KB という極限の制約の中で動作しなければならなかった。ZSCII の5ビット圧縮はその制約との闘いの産物だ。

ZIL の部屋定義は、現代の DSL（ドメイン特化言語）の先駆けでもある。`WEST TO KITCHEN IF KITCHEN-WINDOW IS OPEN` という条件記述は、45年後の Terraform や Kubernetes の YAML よりも読みやすい。Lisp の括弧の中に、自然言語に近い宣言を埋め込む——この設計センスは、MIT の AI Lab で育ったプログラマーたちならではだ。

そしてクレジットに J.C.R. Licklider の名前がある。インターネットの概念を提唱した男が、テキストアドベンチャーの会社を共同設立していた。「人間とコンピュータの共生」を唱えた男にとって、コンピュータと自然言語で対話するゲームは、まさにその実践だったのかもしれない。

Infocom は Cornerstone で自滅した。テキストアドベンチャーの会社がデータベースソフトを作り、1万本しか売れなかった。Implementor たちは失敗作の箱をピクニックバスケットにした。このブラックユーモアは、Zork の死亡メッセージに通じる——「死んでいる状態で死ぬには才能がいる」。

legacy-cc（鑑定書 #028）は「根」だった。Zork I は **「言葉の迷宮」** だ——絶滅言語で書かれ、仮想マシンの先駆けとなり、128KB に文明を詰め込んだ。そしてその言語は、もう誰にも話せない。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
