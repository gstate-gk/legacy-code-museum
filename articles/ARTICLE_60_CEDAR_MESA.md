# Steve Jobs が見たGUIの本体——3,441ファイルの絶滅言語が眠る場所

## はじめに

GitHubの片隅に「始祖」のコードを見つけた。

**Xerox Cedar/Mesa**。1970年代〜1980年代、Xerox PARC が設計した独自プログラミング言語と統合開発環境だ。

3,441個の `.mesa` ファイル。440個の `.tioga` ドキュメント。**2026年の地球上で、この言語を読み書きできる人間はほぼ存在しない。**

1979年12月、Steve Jobs は Apple の株式100,000株（100万ドル相当）と引き換えに、Xerox PARC の見学を許可された。エンジニアの Larry Tesler がデモンストレーションを行った。マウスでカーソルを動かし、アイコンをクリックし、ウィンドウを開閉する。Jobs は叫んだ——**「なぜこれを製品にしないんだ！」**

その GUI を動かしていたのが **Mesa** だ。Butler Lampson、Jim Mitchell、Charles Geschke らが設計した強い型付けのモジュラー言語。Pascal の構文をベースに、例外処理、モニタによるスレッド同期、モジュール間の型チェックを備えていた。**1970年代に。**

Cedar は Mesa の拡張版だ。ガベージコレクション、動的型、ロープ（文字列処理）を追加した。Tioga という WYSIWYG エディタで編集され、ソースコードにフォントやスタイルの情報が含まれていた。**ソースコードがリッチテキスト。** 2026年の IDE が当たり前にやっていることを、1980年代にやっていた。

2023年5月10日、Computer History Museum がこのソースコードを公開した。1993年の Solaris ポート版の CD イメージ。**30年間封印されていた絶滅言語が、ようやく日の目を見た。**

---

## 発掘された痕跡

### 痕跡1：3,441ファイルの絶滅言語

```
[Indigo]<cedar6.1>
3,441 *.mesa files
440 *.tioga files
```

Xerox PARC アーカイブに保存された Cedar/Mesa のソースコード。1993年の Solaris ポート版 CD から復元された。

Mesa の構文は **全てのキーワードが大文字** だ：

```
DEFINITIONS
MODULE
IMPORTS
EXPORTS
BEGIN
END
MONITOR
ENTRY
SIGNAL
ERROR
```

Pascal に似ているが、Pascal ではない。Modula-2 に似ているが、Modula-2 より先に存在した。**Mesa が Modula-2 に影響を与えた** のであって、逆ではない。Niklaus Wirth は1976年に PARC を訪れ、Mesa を知った。それが Modula-2 の設計に「大きな影響」を与えたと語っている。

### 痕跡2：モジュール＝インターフェース＋実装

Mesa は全てのライブラリモジュールを **2つのファイル** に分離した。「definitions ファイル」（インターフェース）と「program ファイル」（実装）。

```
-- Interface (definitions file)
SampleDefs: DEFINITIONS = BEGIN
  Procedure: PROCEDURE [x: INTEGER] RETURNS [INTEGER];
END.

-- Implementation (program file)
SampleImpl: PROGRAM IMPORTS SampleDefs = BEGIN
  ...
END.
```

別コンパイルと型チェックの組み合わせ。**1970年代にこれをやっていた言語は Mesa だけだった。** Java のインターフェース、C# のアセンブリ、Go のパッケージ——全ての「モジュラープログラミング」の原型がここにある。

### 痕跡3：世界初のモニタ BROADCAST

Mesa は世界で初めて **モニタの BROADCAST** を実装した言語だ。

```
MONITOR
ENTRY Procedure: ...
  WAIT condition;
  BROADCAST condition;
  NOTIFY condition;
```

スレッド同期のためのモニタ——mutex とcondition variable の組み合わせ。Java の `synchronized` と `wait()`/`notifyAll()` は、Mesa のモニタの直系の子孫だ。

Java は明示的に Mesa を前身として言及している。**Mesa → Cedar → Modula-2+ → Modula-3 → Java** という系譜。1970年代の Xerox PARC の設計が、2026年の Java プログラマーのコードの中に生きている。

### 痕跡4：4種類の例外——1970年代の先進性

```
SIGNAL   -- resumable exception
ERROR    -- non-resumable exception
ABORT    -- terminate without cleanup
RETRY    -- restart the operation
CATCH    -- handle the exception
CONTINUE -- resume after the signal
```

Mesa は **4種類の例外** を持っていた。SIGNAL（再開可能な例外）と ERROR（再開不可能な例外）を区別し、RETRY（操作のやり直し）と CONTINUE（シグナル後の再開）を提供した。

1970年代に、例外処理のこのレベルの設計を持っていた言語は存在しなかった。**C++ の例外処理（1990年）、Java の例外処理（1995年）より20年早い。**

### 痕跡5：Tioga——リッチテキストのソースコード

Cedar のソースコードは `.tioga` 形式で保存された。Tioga は **WYSIWYG テキストエディタ** であり、ソースコードに **フォント、スタイル、サイズの情報** が含まれていた。

コメントはイタリック体。キーワードはボールド体。変数名は別のフォント。**ソースコードが「ドキュメント」として設計されていた。** Donald Knuth の「文芸的プログラミング」（WEB/TeX、鑑定書 #036）と同時代の、しかし異なるアプローチ。

### 痕跡6：Jobs が見たもの、Gates が持っていったもの

Steve Jobs は1979年に PARC を訪れ、GUI を見た。しかし Jobs が見たのは **表面** だった。マウス、アイコン、ウィンドウ。

その下に Mesa が動いていた。モジュラープログラミング、例外処理、モニタ、型安全性。**Jobs は GUI を持ち帰ったが、Mesa は持ち帰らなかった。** Apple は Lisa と Macintosh を Pascal と68000アセンブリで作った。

Bill Gates もまた PARC の技術を見た。「良いアーティストはコピーする。偉大なアーティストは盗む」——この引用は Jobs のものとして知られるが、実際には **誰もが PARC から「盗んだ」。** GUI、イーサネット、レーザープリンタ、WYSIWYG エディタ。

しかし Mesa/Cedar そのものは誰も持ち帰らなかった。**世界で最も先進的な言語は、世界で最も有名な研究所の中で、絶滅した。**

---

## なぜ絶滅したのか

Mesa/Cedar が絶滅した理由は、Xerox が **自社の発明を商品化できなかった** からだ。

Xerox Star（8010 Information System、1981年）は Mesa で書かれた商用ワークステーションだった。価格は $16,595。当時の IBM PC の10倍以上。**技術的には完璧だったが、市場には高すぎた。**

Apple は PARC の GUI を $2,495 の Lisa に、さらに $2,495 の Macintosh に落とし込んだ。Xerox の技術を、Xerox より安く、Xerox より広く届けた。

Mesa/Cedar は Xerox のエコシステムの中でしか動かなかった。Alto、Dorado、Dandelion——Xerox 製のハードウェアでしか走らない言語に、外部の開発者コミュニティは存在しなかった。**言語は生態系を必要とする。** C は Unix と共に広がった。Mesa は Xerox と共に閉じた。

---

## 推定される経緯

**1973年**: Xerox Alto 完成。Mesa の前身 MPL（Modular Programming Language）の開発開始。

**1976年**: Mesa 言語の初期バージョン完成。Wirth が PARC を訪問、Modula-2 に影響。

**1979年12月**: Steve Jobs が Xerox PARC を訪問。GUI デモを見る。

**1980年代前半**: Cedar 開発。ガベージコレクション、動的型、Tioga エディタ追加。

**1981年4月27日**: Xerox Star 8010 リリース（$16,595）。商業的失敗。

**1984年1月24日**: Apple Macintosh リリース（$2,495）。PARC の GUI 思想を商品化。

**1993年**: Cedar の Solaris ポート版 CD が作成される。

**2023年5月10日**: Computer History Museum が Cedar/Mesa ソースコードを公開。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| 実装言語 | Mesa / Cedar（独自言語） |
| ソースファイル | 3,441個（.mesa） + 440個（.tioga） |
| エディタ | Tioga（WYSIWYG、リッチテキストソースコード） |
| モジュールシステム | インターフェース + 実装の分離 |
| 例外処理 | 4種類（SIGNAL, ERROR, ABORT, RETRY） |
| スレッド同期 | モニタ（世界初の BROADCAST 実装） |
| 影響を与えた言語 | Modula-2, Modula-3, Java, C# |
| ハードウェア | Alto, Dorado, Dandelion（Xerox 製） |
| 公開日 | 2023年5月10日（Computer History Museum） |
| 設計者 | Butler Lampson, Jim Mitchell, Charles Geschke 他 |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.049
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Xerox Cedar/Mesa (1970s-1980s, Mesa)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年4月

■ 鑑定結果
  希少度:          ★★★★★
  技術的負債密度:    ★☆☆☆☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★★
**絶滅言語。** Mesa/Cedar を読み書きできる人間は、2026年の地球上にほぼ存在しない。3,441個のソースファイルは2023年まで30年間封印されていた。Xerox 製ハードウェアでしか動作しない言語。鑑定書シリーズ最高レベルの希少度。

### 技術的負債密度: ★☆☆☆☆
**ほぼゼロ。** Butler Lampson をはじめとする計算機科学の巨人たちが設計した言語。モジュールシステム、例外処理、モニタ——全てが「正しく」設計されている。Plan 9（鑑定書 #046）と同様、「正しすぎた」ことが普及を妨げた。

### 考古学的価値: ★★★★★
**GUI、イーサネット、レーザープリンタ、WYSIWYG、モジュラープログラミング、モニタ——現代のコンピューティングの基盤技術が全てここから生まれた。** Java のスレッドモデル、C# のアセンブリ、Go のパッケージシステムの直系の祖先。

### 読み物としての面白さ: ★★★★★
Steve Jobs の PARC 訪問、「なぜ製品にしないんだ！」、$16,595 の Xerox Star vs $2,495 の Macintosh、30年間封印されたソースコード、絶滅した言語が Java の中に生きている——技術と経営と市場の壮大な失敗の物語。

---

## 鑑定人所見

Cedar/Mesa は「遺伝子」だ。

生物が絶滅しても、その遺伝子は子孫の中に生き続ける。Mesa は絶滅した。しかしその遺伝子——モジュールシステム、例外処理、モニタ、型安全性——は **Java、C#、Go の中に生きている。**

最も象徴的なのは **Smalltalk（鑑定書 #021）との対比** だ。同じ Xerox PARC で、同じ時代に、同じ建物の中で開発された二つの言語。Smalltalk は「全てはオブジェクト」を追求し、Mesa は「全ては型安全に」を追求した。Alan Kay の哲学と Butler Lampson のエンジニアリング。

しかし両方とも Xerox の外では生き残れなかった。**PARC は技術の楽園であり、同時に墓場だった。** 最高の頭脳が最高の技術を作り、それを商品化する方法を知らなかった。

Jobs は GUI を持ち帰った。しかし Mesa は持ち帰らなかった。もし Mesa が Apple に渡っていたら——もし1984年の Macintosh が Mesa で書かれていたら——プログラミング言語の歴史は大きく違っていたかもしれない。

Plan 9（鑑定書 #046）は「設計図」だった——建物は建たなかったが設計図の一部は世界中に。Cedar/Mesa は **「遺伝子」** だ——種は絶滅したが、遺伝子は Java と C# の中で増殖し続けている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
