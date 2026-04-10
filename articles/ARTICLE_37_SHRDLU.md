# AIが積み木を「理解」した日——そしてその作者がAIを疑い始めた話

## はじめに

GitHubの片隅に「理解」のコードを見つけた。

**SHRDLU**。1970年、MIT AI LabのTerry WinogradがMACLISPとMicro-Plannerで書いた自然言語理解プログラムだ。画面上の積み木の世界について、英語で会話できる。

「赤いブロックを拾え」→「OK」。「それを箱に入れろ」→「OK」。「なぜそうした？」→「あなたがそう指示したから」。

ELIZAがパターンマッチで「理解しているふり」をしたのに対し、SHRDLUは世界モデルを持ち、推論し、行動し、その理由を説明できた。1970年——ChatGPTの55年前に、AIは言葉を「理解」した。

しかし物語はここで終わらない。SHRDLUを作ったWinograd自身が、やがて**AIの限界に気づき、自らの研究を否定する**ことになる。そして彼の教え子が、**Google**を創業する。

---

## 積み木の世界

SHRDLUの世界は極めてシンプルだ。テーブルの上に積み木がある。赤い箱、青いピラミッド、緑のブロック。約50語の語彙。それだけ。

しかしこの「おもちゃの世界」で、SHRDLUは驚くべきことをやってのけた。

```
人間: Pick up a big red block.
SHRDLU: OK.

人間: Find a block which is taller than the one you are holding
      and put it into the box.
SHRDLU: BY "IT", I ASSUME YOU MEAN THE BLOCK WHICH IS TALLER
        THAN THE ONE I AM HOLDING. OK.

人間: What does the box contain?
SHRDLU: THE BLUE PYRAMID AND THE BLUE BLOCK.

人間: Why did you put the blue block on the table?
SHRDLU: TO CLEAR OFF THE RED CUBE.

人間: Why did you do that?
SHRDLU: TO PUT IT ON A LARGE GREEN CUBE.
```

「なぜ青いブロックをテーブルに置いた？」→「赤いキューブの上を空けるため」→「なぜ？」→「それを大きな緑のキューブの上に置くため」。

**推論の連鎖を遡って説明できる。** ELIZAには絶対にできなかったことだ。

---

## 発掘された痕跡

### 痕跡1：ELIZA→SHRDLU→ChatGPT——AI理解の系譜

ELIZAとSHRDLUとChatGPTを並べると、「コンピュータの言語理解」の進化が見える。

| | ELIZA (1966) | SHRDLU (1970) | ChatGPT (2022) |
|:---|:---|:---|:---|
| 手法 | パターンマッチ | 形式的推論 | 統計的パターン |
| 世界モデル | なし | あり（積み木） | なし（暗黙的） |
| 理解 | していない | 限定的にしている | 論争中 |
| 説明能力 | なし | あり | 部分的 |
| スケーラビリティ | 高い | 極めて低い | 高い |

ELIZAは何も理解していない。ユーザーの言葉を反射するだけ。SHRDLUは積み木の世界を**本当に理解**している——物体の位置を追跡し、推論し、行動し、理由を説明できる。ChatGPTは膨大なテキストから統計的パターンを学習し、あらゆる話題に応答できるが、「理解しているか」は哲学的に未解決だ。

SHRDLUの悲劇は、**「理解」はスケールしなかった**ことだ。積み木の世界では完璧に動く。しかし現実世界——レストランの予約、医療診断、法律相談——には適用できなかった。

### 痕跡2：「それ」を理解する——代名詞解決の先駆

```
人間: Pick up a big red block.
SHRDLU: OK.

人間: Put it in the box.
SHRDLU: OK.
```

「**it**」が「さっき拾った赤いブロック」を指すことを、SHRDLUは理解する。

さらに複雑な例。

```
人間: Find a block which is taller than the one you are holding
      and put it into the box.
SHRDLU: BY "IT", I ASSUME YOU MEAN THE BLOCK WHICH IS TALLER
        THAN THE ONE I AM HOLDING. OK.
```

「**it**」が曖昧な場合、SHRDLUは「it」が何を指すかを明示的に確認する——「itとは、今持っているブロックより背の高いブロックのことだと仮定します」。

1970年の代名詞解決。2026年のLLMが自然にこなしていることを、MACLISPの明示的なルールで実現していた。

### 痕跡3：フレーム問題——積み木ですら解けない深淵

SHRDLUが明らかにした最も重要な問題は、**フレーム問題**だ。

「赤いブロックを拾い上げて箱に入れろ」。SHRDLUはこれを実行できる。しかし——「この操作で、テーブルの色は変わったか？」

この質問に答えるには、「赤いブロックを移動する」という行為が**変えないもの**を全て列挙する必要がある。テーブルの色、部屋の温度、他のブロックの重さ、宇宙の膨張速度……。「変わらないもの」は無限にある。

積み木の世界ですら、この問題は完全には解けない。現実世界では不可能だ。

フレーム問題は1969年にMcCarthyとHayesが定式化し、60年経った今も未解決だ。SHRDLUはこの問題の存在を**実装レベルで可視化した**最初のシステムだった。

### 痕跡4：ETAOIN SHRDLU——活字時代への敬意

「SHRDLU」という名前の由来は、**英語の文字頻度順**だ。

**ETAOIN SHRDLU**——E, T, A, O, I, N, S, H, R, D, L, U。英語で最も多く出現する文字を頻度順に並べたもの。

この配列は**Linotype植字機**のキーボードに由来する。植字オペレーターが誤植を作ったとき、キーボードの最初の列を指でなぞって「ETAOIN SHRDLU」という捨て行を作った。この行は校正で容易に検出・削除できた。

1978年、ニューヨーク・タイムズが活字制作を終了した際、ドキュメンタリー『Farewell, Etaoin Shrdlu』が制作された。

WinogradがAIシステムに活字時代の遺物の名前を付けたのは、**計算技術の歴史への敬意**だ。古い技術から新しい技術へ——この連続性は、Legacy Code Archiveプロジェクトの精神そのものだ。

### 痕跡5：Winogradの転向——自分の研究を否定した男

SHRDLUの最も衝撃的な「痕跡」は、コードの中ではなく、**作者の人生**にある。

1970年代後半、Winogradは哲学者Hubert Dreyfusの批判に真正面から向き合った。Dreyfusは『What Computers Can't Do』（1972年）で、SHRDLUを含む象徴的AIが人間の知能の暗黙的なプロセスを捉えられないと主張した。

当初、AI研究者たちはDreyfusを嘲笑した。しかしWinogradは——自分の成功作を批判されたにもかかわらず——Dreyfusの指摘を真剣に受け止めた。

1986年、Winogradはチリの哲学者Fernando Floresと共著で『Understanding Computers and Cognition: A New Foundation for Design』を出版した。

> *「言語は情報を伝えるのではなく、聞き手の事前理解との相互作用である『理解』を喚起する。」*

SHRDLUのような象徴的AIアプローチは、**根本的に誤った前提に基づいている**——と、SHRDLUの作者自身が宣言した。

技術的成功を収めた研究者が、自らの成功の限界を認め、哲学的に転向する。この知的誠実さは、AI研究史上最も印象的な「人間の痕跡」だ。

### 痕跡6：Larry Pageの指導教官——SHRDLUからGoogleへ

Winogradは1973年にMITからスタンフォード大学に移った。

1995年、一人の博士課程の学生がWinogradの研究室にやってきた。**Larry Page**。

PageはWinogradの指導下で、Webページの重要度をリンク構造から計算する研究を始めた。1998年、Pageは同級生のSergey Brinとともに**Google**を創業する。

SHRDLUの作者が、Google創業者の指導教官。

「言語理解」と「情報検索」——Winogradが1970年にMACLISPで追求した問いは、30年後に教え子の手で、まったく異なる方法で解かれることになった。SHRDLUは形式的推論で言語を理解しようとした。Googleは統計的パターンでWebを理解しようとした。

### 痕跡7：「Expect errors! This code is from 1972.」——復元の困難

GitHubのSHRDLUリポジトリのREADMEには、こう書かれている。

> *「Expect errors! This code is from 1972.」*
> 「エラーを覚悟してください！ このコードは1972年のものです。」

SHRDLUの復元は極めて困難だ。

- **MACLISPの互換性問題** — Property Listの動作が現代のCommon Lispと異なる
- **Micro-Plannerの依存** — ITS（Incompatible Time Sharing System）のメモリアドレスがハードコードされている
- **DEC PDP-6への依存** — 元の実行環境がもはや存在しない

複数の復元プロジェクト（penlu/shrdlu、tsgouros/www-shrdlu、GunterMueller/SHRDLU_Resurrection）が試みているが、完全な復元には至っていない。

55年前のMACLISPを、現代のCommon Lispで動かすこと自体が、考古学的挑戦だ。

---

## 推定される経緯

**1968年**: Terry WinogradがMIT AI Labでマーヴィン・ミンスキー、シーモア・パパート指導下でSHRDLUの開発を開始。博士論文として。

**1970年**: SHRDLU完成。論文『Procedures as a Representation for Data in a Computer Program for Understanding Natural Language』発表。AI研究コミュニティに衝撃。

**1972年**: Hubert Dreyfusが『What Computers Can't Do』でSHRDLUを含む象徴的AIを批判。

**1973年**: Winogradがスタンフォード大学に移籍。

**1970年代後半-1980年代**: AI Winterの始まり。大規模AIプロジェクトが次々と期待を裏切る。

**1986年**: WinogradがFloresと『Understanding Computers and Cognition』を出版。象徴的AIの限界を自ら宣言。

**1995年**: Larry Pageがスタンフォードに入学。Winogradの指導下で研究開始。

**1998年**: Google創業。

**2016年**: WinogradがPage/Brinの指導教官として広く認知される。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| 実装言語 | MACLISP + Micro-Planner |
| 実行環境 | DEC PDP-6 / ITS |
| 語彙 | 約50語 |
| 世界モデル | 積み木（blocks world） |
| 推論能力 | ゴール駆動型推論 |
| 代名詞解決 | あり |
| 説明能力 | あり（推論連鎖の遡行） |
| 復元状態 | 困難（複数プロジェクトが挑戦中） |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】SHRDLU (1968-1970, MACLISP + Micro-Planner)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年3月

■ 鑑定結果
  希少度:          ★★★★★
  技術的負債密度:    ★★★★☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★★
オリジナルのMACLISPソースコードがGitHubにアーカイブされているが、完全に動作する復元には至っていない。DEC PDP-6とITSという、もはや存在しない環境への依存。55年前のLispコードを現代環境で動かすこと自体が考古学的挑戦。

### 技術的負債密度: ★★★★☆
ITSのメモリアドレスのハードコード、MACLISPの方言依存、Micro-Plannerの移植困難性——時代の制約による負債が重い。「Expect errors! This code is from 1972.」がREADMEに書かれている。

### 考古学的価値: ★★★★★
NLP（自然言語処理）の里程標。フレーム問題の可視化。ELIZA→SHRDLU→LLMの系譜の中間点。AI楽観主義からAI Winter、そして現代のLLMブームまでの歴史を1つのプロジェクトで追える。

### 読み物としての面白さ: ★★★★★
技術的成功、哲学的転向、知的誠実さ、Larry Pageとの師弟関係——コードの向こうに、AI研究の半世紀が見える。「自分の成功作を否定した男」の物語は、どんなフィクションよりも深い。

---

## 鑑定人所見

SHRDLUは「理解の限界」だ。

積み木の世界で、AIは言葉を「理解」した。代名詞を解決し、推論を連鎖させ、行動の理由を説明した。1970年のMACLISPで。

しかしSHRDLUの作者Winogradは、やがて自分の成功の限界に気づいた。積み木の世界では完璧に動く「理解」が、現実世界にはスケールしない。フレーム問題——「変わらないもの」を列挙する不可能性——が立ちはだかる。

最も印象的なのは、**Winogradの知的誠実さ**だ。SHRDLUで名声を得た研究者が、自らの手法の限界を認め、哲学的に転向する。『Understanding Computers and Cognition』で「象徴的AIは根本的に誤った前提に基づいている」と宣言する。自分の最大の業績を、自分で否定する。

そしてその教え子がGoogleを創る。Winogradが形式的推論で追求した「言語理解」を、Larry Pageは統計的パターンで別の角度から攻略する。師弟の物語は、AI研究のパラダイムシフトそのものだ。

ELIZA（鑑定書 #019）は「鏡」だった——何も理解せず、ユーザーの言葉を反射するだけ。SHRDLUは「箱庭」だった——限定された世界で完璧に理解する。現代のLLMは何だろうか？ 巨大な鏡か、無限の箱庭か、それとも全く別の何かか。

Winogradが1970年に問いかけた「理解とは何か」は、55年後の今も答えが出ていない。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
