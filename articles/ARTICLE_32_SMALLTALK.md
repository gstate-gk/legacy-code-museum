# 「未来を予測する最良の方法は、それを発明することだ」——Xerox PARCが発明して売れなかった全てのソースコードの話

## はじめに

GitHubの片隅に「未来」のコードを見つけた。

**Smalltalk-80**。1980年、Xerox PARCのAlan Kayが設計し、Dan Ingallsが実装した**オブジェクト指向プログラミング言語**だ。しかし「プログラミング言語」と呼ぶのは正確ではない。Smalltalkは言語であると同時に、**OS**であり、**IDE**であり、**GUIフレームワーク**であり、**哲学**だった。

GUI（グラフィカルユーザーインターフェース）。マウス操作。ウィンドウシステム。MVC（Model-View-Controller）。統合開発環境。リファクタリング。ビットマップディスプレイ——**2026年の私たちが毎日使っているもののほぼ全てが、ここで発明された。**

1979年12月、Steve JobsがXerox PARCを訪れた。彼が見たものは、後にMacintoshになった。

しかしXeroxは、自分たちが発明したものを売ることができなかった。

---

## Alan Kay——「子供たちのためのコンピュータ」を夢見た男

Alan Kayは2003年にチューリング賞を受賞した計算機科学者だ。しかし彼の原点は**教育**にある。

1968年、Kayは「Dynabook」を構想した。3リングバインダーサイズの携帯型コンピュータ。タッチスクリーン搭載。子供がプログラミングを学ぶためのデバイス。

> *「A Personal Computer For Children of All Ages」*
> 「あらゆる年齢の子供たちのための個人用コンピュータ」

1968年——まだメインフレームの時代だ。パーソナルコンピュータという言葉すらない。その時代に「子供が持ち歩くコンピュータ」を構想した。

Smalltalkは、このDynabookの**ソフトウェア基盤**として設計された。子供が直感的に理解できる「ものに話しかける」モデル——それがメッセージパッシングの起源だ。

そしてKayはこう言った。

> *「The best way to predict the future is to invent it.」*
> 「未来を予測する最良の方法は、それを発明することだ。」

---

## 発掘された痕跡

### 痕跡1：「全てがオブジェクト」——哲学的なコミットメント

Smalltalkの世界では、文字通り**全て**がオブジェクトだ。

```smalltalk
3 + 4              "数値3というオブジェクトに、+というメッセージを送る"
#(1 2 3) size      "配列というオブジェクトに、sizeというメッセージを送る"
true ifTrue: []    "真偽値trueというオブジェクトに、ifTrue:というメッセージを送る"
```

数値がオブジェクト。真偽値がオブジェクト。クラスがオブジェクト。**クラスのクラス（メタクラス）すらオブジェクト**。

他の「オブジェクト指向」言語——Java、C++、Python——では、整数型やブール型はオブジェクトではない「プリミティブ」として扱われることがある。Smalltalkにはプリミティブがない。例外がない。**全てがオブジェクト**。

この徹底的な一貫性が、後のPython（「全てがオブジェクト」）、Ruby（Matzが「Smalltalkの思想に最も近い言語」と公言）、JavaScript（プロトタイプベースだがオブジェクト中心）に遺伝した。

### 痕跡2：メッセージパッシング——Alan Kayが言った「OOPの本質」

Kayは後年、こう述べている。

> *「メッセージパッシングが本質であり、クラスやインヘリタンスではない」*

C++やJavaが広めた「クラスと継承」のOOPは、Kayの本意ではなかった。Smalltalkの真髄は**メッセージ**だ。

```smalltalk
anObject doSomething
```

これは「anObjectの中のdoSomethingメソッドを呼ぶ」のではない。「anObjectに**doSomethingというメッセージを送る**」のだ。受け取ったオブジェクトが何をするかは、オブジェクト自身が決める。

この設計思想は、分散システムのRPC、マイクロサービスのAPI呼び出し、Erlangのアクターモデル——現代のソフトウェアアーキテクチャの根幹にある。

### 痕跡3：MVC——Reactの曽祖父

1979年、Xerox PARCの客員研究員**Trygve Reenskaug**が、Smalltalk-79でModel-View-Controllerパターンを発明した。

```
Model（モデル）    — データと業務ロジック
View（ビュー）     — 画面表示
Controller（コントローラ） — ユーザー入力
```

Smalltalk-80のGUIは、このMVCで構築された最初のGUIだ。同じModelに複数のViewを接続できる。データが変わればViewが自動更新される。

2026年、React（Unidirectional Data Flow）、Angular（MVVM）、Vue（Reactivity）——すべてMVCの系譜だ。Reenskaugが1979年にSmalltalkの中で描いたパターンが、50年近く経った今もフロントエンド開発の基盤になっている。

### 痕跡4：Dan Ingalls——「Smalltalkの母」、7世代の実装者

Alan Kayが「Smalltalkの父」なら、Dan Ingallsは「母」だ。

Peter Siebelの著書『Coders at Work』にこう書かれている。

> *「Smalltalkは Alan Kayの目の光沢から始まったかもしれないが、Ingallsが世界に生み出すために艱難辛苦の仕事をしたのだ。」*

Ingallsが実装したSmalltalkの世代：
1. **Smalltalk-72**（1972）— Nova minicomputerにアセンブリで。最初の「全てがオブジェクト」
2. **Smalltalk-76**（1976）— バイトコードVM導入。実用性の飛躍
3. **Smalltalk-78**（1978）— NoteTaker（携帯型プロトタイプ）
4. **Smalltalk-80**（1980）— 商用リリース。Blue Book出版
5. **Squeak**（1996）— Apple、Walt Disney Imagineeringで開発
6. **Lively Kernel**（2008）— Webベース実装

35年以上、一つの言語の進化に寄り添い続けた。さらにIngallsが発明した**BitBlt**（ビットマップブロック転送アルゴリズム）は、今日のGPUグラフィックス処理の先駆けだ。

### 痕跡5：Steve Jobsが見た日——1979年12月

1979年12月、Steve JobsがXerox PARCを訪れた。AppleがXeroxに株式購入権を提供する見返りに、PARC視察のアクセスを得た。

デモを担当したLarry Teslerの証言。

> *「彼は握り拳を顎の下に置き、歩き回りながら同時に話していた。彼は言った——『我々はゴールドマイン（金鉱）の上に座っている』」*

Jobsが見たもの：
- **ビットマップディスプレイ** — 文字だけでなく、画像やフォントが表示される画面
- **マウス操作** — カーソルを動かしてクリックする
- **ウィンドウシステム** — 複数のアプリが重なり合う
- **Smalltalk-76の開発環境** — コードを書きながらリアルタイムで動かす

Jobs後年の発言：

> *「全てのコンピュータがこのように動作することは明らかだった」*

しかし多くの人が言う「Jobsが盗んだ」は正確ではない。AppleチームはPARCを去るとき、**コードもハードウェアも何も持ち出さなかった**。持ち出したのは「アイデア」「概念」「哲学」だけだ。そしてそれを、Lisa（1983年）とMacintosh（1984年）で商業化した。

### 痕跡6：Xerox PARCが売れなかった全て

Xerox PARCは以下を発明した。そして、ほぼ全てを商業化できなかった。

| 発明 | 商業化した会社 |
|:---|:---|
| GUI | Apple (Macintosh) |
| マウス操作 | Apple, Microsoft |
| イーサネット | 3Com, Novell |
| レーザープリンタ | Canon, HP |
| Smalltalk/OOP | 学術機関のみ |
| WYSIWYG | Apple, Microsoft |

Xerox Star（1981年）は$16,595で販売された。フルシステムは$100,000。IBM PCは$1,565。市場は安い方を選んだ。

**CP/Mの物語と同じだ。** 技術的に優れたものが市場で勝つとは限らない。

失敗の原因は明確だった。Xeroxはコピー機の会社であり、コンピュータの会社ではなかった。PARCの研究者が未来を発明している間、Xeroxの営業部門はコピー機を売っていた。発明のインセンティブと販売のインセンティブが完全にずれていた。

### 痕跡7：リファクタリングの発祥地

「リファクタリング」という概念は、Smalltalkの開発環境から生まれた。

1990年、イリノイ大学のWilliam F. OpdykeとRalph Johnsonが論文を発表。

> *「Refactoring: An aid in designing application frameworks and evolving object-oriented systems」*

定義：**外部的動作を変えずに、内部構造を改善すること。**

なぜSmalltalkから生まれたのか？ Smalltalkの開発環境では、コードを修正すると**即座に動作を確認**できる。テスト→修正→確認のサイクルが秒単位。この環境が「構造の改善」という行為を自然発生させた。

Martin Fowlerの名著『Refactoring』（2000年）は、このOpdyke-Johnsonの研究の直系だ。Smalltalkなくして、リファクタリングは生まれなかった。

---

## 推定される経緯

**1968年**: Alan KayがDynabookを構想。「あらゆる年齢の子供たちのための個人用コンピュータ」。

**1970年**: Xerox PARCが設立。Kayが参加。

**1972年**: Dan IngallsがSmalltalk-72を実装。Nova minicomputerにアセンブリで。

**1973年**: Xerox Altoが完成。ビットマップディスプレイ + マウスの最初のコンピュータ。

**1976年**: Smalltalk-76。バイトコードVMの導入。実用的な開発環境に。

**1979年**: Trygve ReenskaugがMVCパターンを発明。Steve JobsがPARCを訪問。

**1980年**: Smalltalk-80完成。外部へのリリース。

**1981年**: Xerox Star発売。$16,595。商業的失敗。

**1983年**: Adele GoldbergとDavid Robsonが『Smalltalk-80: The Language and its Implementation』（Blue Book）出版。

**1984年**: Apple Macintosh発売。$2,495。PARCの思想が商業化される。

**1996年**: Dan IngallsがAppleでSqueak（オープンソースSmalltalk）を開発。

**2003年**: Alan Kayがチューリング賞受賞。

---

## AI 解析データ

### Smalltalkが生んだもの
| 発明 | 年 | 発明者 | 現代の子孫 |
|:---|:---|:---|:---|
| 全てがオブジェクト | 1972 | Kay, Ingalls | Python, Ruby, JS |
| メッセージパッシング | 1972 | Kay | Erlang, Akka, マイクロサービス |
| バイトコードVM | 1976 | Ingalls | JVM, CLR, V8 |
| BitBlt | 1975 | Ingalls | GPU グラフィックス |
| MVC | 1979 | Reenskaug | React, Angular, Vue |
| IDE | 1980 | PARC | IntelliJ, VS Code |
| リファクタリング | 1990 | Opdyke, Johnson | 全てのモダン開発 |
| ポップアップメニュー | 1976 | Ingalls | 全てのGUI |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.021
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Smalltalk-80 (1972〜1983, Smalltalk)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年3月

■ 鑑定結果
  希少度:          ★★★★★
  技術的負債密度:    ★☆☆☆☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★★
Xerox PARCのオリジナル環境を再現できるSmalltalk実装がGitHubに複数存在する。Computer History Museumが「Smalltalk Zoo」として歴代バージョンを保存。ただしオリジナルのAlto上のソースコードは断片的にしか残っていない。

### 技術的負債密度: ★☆☆☆☆
「全てがオブジェクト」の一貫性が、設計の純度を保っている。プリミティブ型がないので例外規則がない。メッセージパッシングという単一の原理で全てが動く。Mako VMの226行と同じ「引き算の美学」。

### 考古学的価値: ★★★★★
GUI、OOP、MVC、IDE、リファクタリング——現代のソフトウェア開発の基礎概念のほぼ全てがここに遡る。Computer History Museumが公式に「ソフトウェア史上最も影響力のあるプロジェクトの一つ」と認定。

### 読み物としての面白さ: ★★★★★
Alan Kayの教育思想、Dan Ingallsの35年間の実装、Steve Jobsの訪問、Xeroxの商業的失敗、Adele Goldbergの記録——技術、ビジネス、人間ドラマが凝縮されている。

---

## 鑑定人所見

Smalltalkは「発明の聖地」だ。

GUI、OOP、MVC、IDE、リファクタリング——2026年のプログラマーが毎日使っている道具のほぼ全てが、カリフォルニア州パロアルトの研究所で、1970年代に発明された。Alan Kayが思想を語り、Dan Ingallsが実装し、Adele Goldbergが記録し、Trygve ReenskaugがMVCを定式化した。

しかし最も印象的なのは、**Xerox PARCが全てを発明しながら、何も売れなかった**という事実だ。$16,595のXerox Star。$2,495のMacintosh。$1,565のIBM PC。市場は安い方を選んだ。CP/Mと同じ物語が繰り返された。

Alan Kayは「未来を予測する最良の方法は、それを発明することだ」と言った。Xerox PARCはまさにそれを実行した。未来を発明した。しかし**未来を売ることはできなかった**。売ったのはAppleとMicrosoftだった。

それでもSmalltalkの遺伝子は消えていない。ReactのコンポーネントはSmalltalkのオブジェクトだ。VS CodeのエディタはSmalltalkのクラスブラウザだ。Git diffの「動作を変えずに構造を改善する」はリファクタリングそのものだ。

Smalltalkは市場では負けた。しかし思想では勝った。50年後の今、全てのプログラマーがSmalltalkの子孫を使っている——ただし、その名前を知らないだけだ。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
