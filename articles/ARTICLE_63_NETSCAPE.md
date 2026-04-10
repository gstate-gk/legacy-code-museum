# 世界を征服した後、その名前だけが残った——Netscape Navigatorと「Mozilla」という遺産

## はじめに

GitHubの片隅に「征服」のコードを見つけた。

**Netscape Navigator**。1994年、Marc Andreessen と Jim Clark が作ったブラウザ。リリース直後に世界のウェブブラウザ市場の90%を獲得した。しかし1998年、Microsoftとのブラウザ戦争に敗れ、ソースコードを公開した。

その日からが面白い。

1998年3月31日、Jamie Zawinski が `mozilla.org` ドメインを登録した。Netscapeは死に、征服者の名前「Mozilla」だけが生き残った。今日、あなたが使うすべての主要ブラウザのUser-Agentは「**Mozilla/5.0**」で始まる——ChromeもSafariもEdgeも、Netscapeのコードネームを名乗り続けている。

コードネームの語源は「**Mosaic + Godzilla**」。「Mosaicを殺す者」。征服者の名前が、征服された後も全てのブラウザに刻まれている。

---

## 発掘された痕跡

### 痕跡1：`XXXbe` — Brendan Eichが残したイニシャル

```c
/* XXXbe push this into jsobj.c or jsscope.c */
/* XXX bad API */
```

`jsapi.c`——JavaScriptエンジンのパブリックAPI。

`XXXbe` の `be` は **Brendan Eich** のイニシャル。「後で自分が直す」という意味で、Netscapeでは開発者が自分のイニシャルを`XXX`の後に付ける慣習があった。

1995年5月、Eich はNetscapeの命令を受け、**10日間でJavaScriptのプロトタイプを実装した**。コードネームは「Mocha」、次に「LiveScript」、そしてJavaブームに便乗して「JavaScript」に改名された。10日間のスプリントで作ったコードが、1998年のオープンソース化まで本番環境に残っていた。`XXXbe` のマーカーとともに。

**10日間で作った言語が、今日30億台のデバイスで動いている。**

### 痕跡2：`document.layers` — 歴史の敗北を刻んだ独自API

```c
/* Z-order constants for special layers */
#define Z_CONTENT_LAYERS     (-1)
#define Z_CELL_BACKGROUND_LAYER  (-1000)
#define Z_BACKGROUND_LAYER   (-1001)
```

`laylayer.c`——Netscapeの独自レイヤーシステム。

Netscapeは1997年に独自の `<LAYER>` タグと `document.layers` APIを実装した。Microsoftは W3C 標準の CSS `z-index` を採用した。**どちらが正しいか、ウェブ開発者は選択を迫られた。**

1998年、W3C が CSS を標準化し、`<LAYER>` は歴史のゴミ箱へ。`document.layers` は消えた。ファイルには `BLINK` タグのサポートコードも残っている——750msのハードコードされた点滅間隔とともに。

### 痕跡3：`<BLINK>` — 深夜のバーから生まれた呪い

```c
/* Blink support */
/* timed visibility toggling at 750ms intervals */
```

1994年夏、Lou Montulli（Netscapeの創立エンジニア）がマウンテンビューのバーで冗談を言った：「**Lynxブラウザで使える唯一のスタイルは点滅だ**」。

別のエンジニアが真夜中にオフィスに戻り、翌朝には `<BLINK>` タグが実装されていた。Montulli 本人はコードを1行も書いていない。後に Montulli 自身が「**世界で最も後悔しているインターネットの発明**」と語った。

750ms。ハードコードされた点滅間隔が、ソースコード上に今も残っている。

### 痕跡4：`README.jwz` — Zawinskiが残した個人の痕跡

```
All of my changes are conditioned on #ifdef DEBUG_jwz

XFE changes:
- Simplified handling of FONT tag attributes
- Added menu items for JavaScript and animated GIF control
...
Note: lib/libjava changes — reason unknown
```

Jamie Zawinski は自分専用のパッチを `#ifdef DEBUG_jwz` で全て囲んで管理していた。

Zawinski は Netscape 最も著名なエンジニアの一人。後に `mozilla.org` を自ら登録してMozillaプロジェクトを立ち上げた人物。しかし1999年4月1日——エイプリルフールの日——「**コードが複雑すぎて修正不可能**」と声明を出して辞任した。

「lib/libjava への変更——理由不明」。自分でも記録できなかった箇所が、90年代の巨大コードベースの混沌を物語る。

### 痕跡5：`about:mozilla` — 征服者への讃歌と敵への呪い

```
The Book of Mozilla, 3:31

"And the beast shall be made legion.
Its numbers shall be increased a thousand thousand fold.
The din of a million keyboards like unto a great storm
shall cover the earth, and the followers of Mammon shall tremble."
```

`about:mozilla` を開くと現れる聖書風イースターエッグ「The Book of Mozilla」。

**3:31 = 3月31日**。1998年3月31日のNetscapeオープンソース化を記念して Zawinski が書いた詩。

- 「beast（獣）」= Netscape
- 「legion（軍団）」= オープンソース開発者コミュニティ
- 「Mammon（マモン）」= Microsoft

**征服された側が、自らの解放を聖典に刻んだ。**

### 痕跡6：User-Agentの詐称連鎖 — 敗者の名が勝者を名乗る

```
Netscape 1.0 (1994):
  Mozilla/1.0 (Windows)

Internet Explorer 3 (1996):
  Mozilla/2.0 (compatible; MSIE 3.0; Windows 95)

Chrome 120 (2024):
  Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
  (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

Netscapeが「Mozilla」と名乗ってフレーム対応コンテンツを配信していたため、IEは1996年に「**自分もMozilla互換だ**」と詐称し始めた。Safariは「KHTMLだがGeckoのふりをしてMozillaでもある」と名乗り、ChromeはさらにSafariのふりをした。

**今日、全ての主要ブラウザのUser-Agentは「Mozilla/5.0」で始まる。**

Netscapeは死に、そのコードネームだけが全てのブラウザに永遠に刻まれている。征服した者の名前が、征服された後も残り続けた。

---

## ブラウザ戦争の年表

**1993年**: Marc Andreessen が NCSA Mosaic の後継として Netscape の前身を開発。

**1994年10月**: Netscape Navigator 1.0 リリース。瞬く間に市場の90%を獲得。

**1995年5月**: Brendan Eich、10日間でJavaScript（Mocha）を実装。

**1996年**: IE 3.0 リリース。Windowsへのバンドル戦略開始。User-Agentに「Mozilla/2.0 compatible」を名乗る詐称が始まる。

**1997年**: Netscapeが `<LAYER>` タグを実装。IEはCSS標準を採用。ウェブ開発者は両方に対応を迫られる。

**1998年3月31日**: Netscapeがソースコードをオープンソース化。Jamie Zawinskiが `mozilla.org` を登録。「The Book of Mozilla 3:31」が書かれる。

**1999年4月1日（エイプリルフール）**: Zawinskiが「コードは修復不可能なほど複雑」と声明を出して辞任。

**2002年**: Mozilla 1.0 リリース。Netscapeの名前は消えたが、コードは生き続けた。

**2004年11月**: Firefox 1.0 リリース。IEへの反撃開始。

**2008年**: Chrome 登場。今日も「Mozilla/5.0」を名乗る。

**2026年現在**: Netscapeは消えた。しかし全ての主要ブラウザに「Mozilla」の名が刻まれている。

---

## AI 解析データ

### コードの特徴

| 指標 | 値 |
|:---|---:|
| 実装言語 | C + JavaScript（自作） |
| ソースコード規模 | 約300万行（Communicator 4.x時点） |
| JavaScript初期実装 | 10日間（Brendan Eich, 1995年5月） |
| User-Agent詐称の連鎖 | 1996年〜現在まで継続 |
| オープンソース化 | 1998年3月31日（Mozilla Public License） |
| 後継プロジェクト | Mozilla → Firefox（2004年）→ Gecko エンジン |
| 市場シェアピーク | 約90%（1994年〜1996年） |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.052
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Netscape Navigator (1994-1998, C + JavaScript)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年4月

■ 鑑定結果
  希少度:          ★★★★☆
  技術的負債密度:    ★★★★★
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★☆
一部のみオープンソース化。Communicator 4.xのコードは公開されているが、Navigator 1.x〜3.xは断片的。ウェブ史の分岐点を記録した一次資料として希少。

### 技術的負債密度: ★★★★★
**10日間で作ったJavaScript、レイアウトエンジンの混沌、16ビットWindowsのコード、`document.layers` の独自API。** 巨大化の一途を辿ったコードベースを「修復不可能」と診断してZawinskiが辞任したほど。Joel Spolskyの名エッセイ「Things You Should Never Do」の実例として引用された。

### 考古学的価値: ★★★★★
**全ての現代ブラウザに刻まれた「Mozilla」の名。** User-Agentの詐称連鎖は30年間続いている。Brendan EichのJavaScriptは世界のウェブを動かし続けている。`<BLINK>` タグは2013年にようやくChrome/Firefoxから削除された——20年近く生き続けた。

### 読み物としての面白さ: ★★★★★
征服と失墜のドラマ、10日間のJavaScript、`<BLINK>` の誕生、「The Book of Mozilla」の詩、Zawinskiのエイプリルフール辞任——技術とドラマが交差する最高の素材。

---

## 鑑定人所見

Netscapeは「征服」だ。

1994年、世界のウェブ市場の90%を獲得した。しかし4年後、Microsoftのバンドル戦略に敗れ、ソースコードを公開した。「The Book of Mozilla 3:31」——自らの解放を聖典に刻んで。

最も象徴的なのは **User-Agent文字列の詐称連鎖** だ。Netscapeが「Mozilla」と名乗ったから、IEは「Mozilla互換」と名乗った。SafariはGeckoのふりをしてMozillaと名乗り、Chromeはさらにその上を重ねた。今日、Netscapeは存在しない。しかし全てのブラウザは「Mozilla/5.0」と自称している。**敗者の名が、勝者全員を命名した。**

Brendan Eich は10日間でJavaScriptを書いた。`XXXbe` のマーカーを残しながら。その言語が30億台のデバイスで動いている。**10日間の借金が、30年間の利子を生み続けた。**

そして Jamie Zawinski は、エイプリルフールの日に辞任した。「コードは修復不可能なほど複雑だ」と言いながら。しかし彼が登録した `mozilla.org` から Firefox が生まれ、Chrome が生まれ、現代のウェブが生まれた。

**征服者が滅びた後、その名前だけが残った。それがNetscapeの遺産だ。**

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
