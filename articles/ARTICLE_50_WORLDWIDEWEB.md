# 「漠然としているが、面白い」——物理学者がNeXTで書いた6,500行が、人類の情報空間を変えた

## はじめに

GitHubの片隅に「始まりの始まり」を見つけた。

**WorldWideWeb**。1990年、CERNの物理学者 Tim Berners-Lee が Objective-C で書いた、世界最初のWebブラウザだ。

約6,500行。41ファイル。NeXTSTEP 専用。

しかしこれは「ブラウザ」ではなかった——正確には **ブラウザ兼エディタ** だ。Webページを読みながら、そのページを直接編集し、新しいリンクを作れる。Webの本来の思想は **「読むだけ」ではなく「読み書き双方向」** だった。

そしてこのプログラムが生まれたきっかけは、上司の手書きメモ一行だった——

> *「Vague but exciting.」*
> （漠然としているが、面白い。）

---

## 物理学者がWebを発明した

Tim Berners-Lee。1955年ロンドン生まれ。両親ともコンピュータ科学者——父は世界初の商用コンピュータ Ferranti Mark I の開発者だ。

Berners-Lee は素粒子物理学の研究所 CERN で働いていた。CERN には世界中から物理学者が集まるが、全員が違うコンピュータ、違うOS、違うフォーマットを使っていた。情報の共有が絶望的に困難だった。

1989年3月、Berners-Lee は上司 **Mike Sendall** に提案書を提出した。

タイトル——**「Information Management: A Proposal」**（情報管理：一つの提案）。

Sendall はその表紙に手書きでこう書いた——

> *「Vague but exciting.」*

この一言で、Webが始まった。提案書の原本は今も CERN のアーカイブに保存されている。

---

## 発掘された痕跡

### 痕跡1：ブラウザであり、エディタだった

ソースコードの至るところに `isEditable` チェックが存在する——

```objc
if ([self isEditable]) [window setDocEdited:YES];
```

そして「リンクを作る」関数——

```objc
- (Anchor *) linkSelTo:(Anchor *)anAnchor
// Generate a live anchor for the text, and link it to a given one
```

Webページを読みながら、選択したテキストにリンクを張れる。**これが Berners-Lee の考えた Web の本来の姿だ。**

しかし Mosaic（1993年）が普及したとき、エディタ機能は実装されなかった。Web は「読むだけ」のメディアになった。Berners-Lee の双方向の夢は、20年後の Wikipedia まで待たなければならなかった。

### 痕跡2：HTTP GET は1行だった

```c
strcpy(command, "GET ");
strcat(command, "\n");
```

最初の HTTP リクエストは `GET /path\n` ——たった1行。ヘッダなし。バージョン表記なし。これが後に「HTTP/0.9」と呼ばれるものだ。

2026年の HTTP/3（QUIC）の祖先が、C言語の `strcpy` と `strcat` 2行。

### 痕跡3：ポート80の誕生日がコードに刻まれている

```c
#define TCP_PORT 80   /* Allocated to http by Jon Postel/ISI 24-Jan-92 */
#define OLD_TCP_PORT 2784   /* Try the old one if no answer on 80 */
```

「Jon Postel/ISI、1992年1月24日」——ポート80が HTTP に割り当てられた日付が、コメントに刻まれている。それ以前は **ポート2784** が使われていた。

### 痕跡4：CSSの原型がすでにあった

```c
typedef struct _HTStyle {
    char *    SGMLTag;    /* Tag name to start */
    id        font;
    HTCoord   fontSize;
    NXTextStyle *paragraph;
    float     textGray;
    int       textRGBColor;
} HTStyle;
```

**StyleSheet** という言葉が1990年のコードに存在する。CSS（1996年）の6年前に、論理的な文書構造と物理的な表現を分離する思想がすでにここにあった。

### 痕跡5：HTMLパーサーは手作りステートマシン

```c
enum state_enum {
    S_text,        /* We are not in a tag */
    S_tag_start,   /* We have just had "<" */
    S_tag_h,
    S_tag_a, S_end_a,
    S_anchor, S_href, S_href_quoted, S_href_unquoted, S_aname,
    S_junk_tag,    /* Ignore everything until ">" */
    S_done
};
```

`<`、`</`、`<a href=...>` を手作業でステートマシンとして解析している。現代のブラウザの複雑な HTML パーサーの出発点。`S_junk_tag`——「知らないタグは `>` まで全部無視」。

### 痕跡6：Jobs → NeXT → CERN → Web という因果

Steve Jobs は1985年に Apple を追われ、NeXT Inc. を設立した。NeXTコンピュータは商業的に失敗した。しかし **CERN が1989年にNeXTマシンを購入した**。

Berners-Lee の証言——

> *「他のプラットフォームなら1年かかる作業が、NeXTなら数ヶ月で完了できた。」*

NeXTSTEP の Interface Builder、Objective-C の動的型付け、リッチテキストエディタ——これらがなければ、Web の発明は遅れていた。

**Jobs が Apple を追放されたことが、Web の誕生を早めた。**

しかし同時に、NeXT 専用だったことが致命的だった。高価な NeXT マシンでしか動かないブラウザは、「誰でもアクセスできる普遍的な情報空間」という思想と矛盾していた。

### 痕跡7：特許を取らなかった決断

1993年4月30日、CERN は WorldWideWeb のソースコードを **ロイヤルティフリー・永久無償** で公開した。

Berners-Lee の言葉——

> *「もし技術を独占し、完全にコントロールしていたら、おそらく普及しなかっただろう。普遍的な空間を提案しながら、同時にそれをコントロールすることは矛盾している。」*

この決断がなければ、現在の Web はなかった。

---

## 「Web は壊れた」

2026年現在、Berners-Lee は自分の発明について、こう語っている——

> *「あらゆるものが間違った方向に行った。フェイクニュース、プライバシーの問題、人々がプロファイリングされ操作される問題。」*

2019年、Berners-Lee は **「Contract for the Web」** を発足させた。Web の規制と倫理規範を求める国際的な取り組みだ。

**Web の発明者が、自分の発明を「壊れた」と言っている。**

---

## 推定される経緯

**1989年3月**: Berners-Lee が「Information Management: A Proposal」を提出。「Vague but exciting」。

**1990年5月**: NeXTマシン購入承認。開発着手。

**1990年12月25日**: 最初の Web サーバーと WorldWideWeb ブラウザが稼働。

**1991年8月6日**: Berners-Lee が alt.hypertext ニュースグループで Web を公開。

**1993年4月30日**: CERN がソースコードをロイヤルティフリーで公開。

**1993年**: NCSA Mosaic が Windows/Mac/Unix 対応でリリース。Web が爆発的に普及。

**1994年**: W3C 設立。

**2004年**: ナイト爵位授与。Sir Tim Berners-Lee。

**2019年**: 「Contract for the Web」発足。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| 実装言語 | Objective-C |
| ソースコード | 約6,500行 / 41ファイル |
| 実行環境 | NeXTSTEP |
| HTTP | GET 1行（HTTP/0.9） |
| HTMLパーサー | 手作りステートマシン |
| 機能 | ブラウザ兼エディタ（双方向） |
| ポート | 80（旧: 2784） |
| スタイル | StyleSheet 構造体（CSS の原型） |
| ライセンス | ロイヤルティフリー（1993年公開） |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.039
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】WorldWideWeb 0.15 (1990, Objective-C / NeXTSTEP)
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
Objective-C / NeXTSTEP。現代の環境ではコンパイル不可能。READMEに「no idea how to make this compile or run」と書かれている。世界最初のWebブラウザのソースコード。

### 技術的負債密度: ★★★☆☆
6,500行のシンプルな構造。NeXTSTEP API に完全依存するが、HTTP/HTMLの基本設計は明確。手作りステートマシンのHTMLパーサーは原始的だが合理的。

### 考古学的価値: ★★★★★
**全てのWebの始まり。** HTTP、HTML、URL——現代のインターネットの三本柱がこの6,500行から生まれた。StyleSheet の原型。ブラウザ兼エディタという本来の双方向Web思想。

### 読み物としての面白さ: ★★★★★
「Vague but exciting」の一言、Jobs→NeXT→Web の因果、特許を取らなかった決断、NeXT専用という矛盾、「Webは壊れた」発言——技術と哲学と運命が交差する。

---

## 鑑定人所見

WorldWideWeb は「源流」だ。

6,500行の Objective-C から、全ての Web が始まった。HTTP の GET は1行。HTML パーサーは手作りのステートマシン。ポート80の誕生日がコメントに刻まれている。

最も象徴的なのは **`isEditable`** だ。ソースコードの至るところにこのチェックがある。Berners-Lee の Web は「読むもの」ではなく「読み書きするもの」だった。しかし Mosaic が普及したとき、エディタ機能は実装されなかった。Web は片方向のメディアになった。

Jobs が Apple を追い出されて作った NeXT が、CERN に購入され、その上で Web が生まれた。失敗した製品が、世界を変える道具になった。しかし NeXT 専用だったことが、WorldWideWeb 自身の普及を阻んだ。「誰でもアクセスできる空間」を作った道具が、「ほぼ誰もアクセスできない」機械でしか動かなかった。

そして2026年、発明者自身が「Web は壊れた」と言っている。フェイクニュース、監視資本主義、個人データの搾取——「普遍的な情報空間」は「普遍的な監視空間」にもなりうることを、Berners-Lee は痛感している。

NetHack（鑑定書 #038）は「遺跡」だった。WorldWideWeb は **「源流」** だ——全てのWebページ、全てのURL、全てのHTTPリクエストの最初の一滴が、この6,500行から流れ出した。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
