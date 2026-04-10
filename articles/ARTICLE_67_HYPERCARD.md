# Webを発明できたのに、しなかった——HyperCardという平行世界の扉

## はじめに

1987年8月11日、MacWorld。Bill Atkinson がデモを始めた。

カードをめくるように画面が切り替わる。ボタンをクリックすると別のカードに飛ぶ。テキストをクリックするとリンク先に移動する。プログラマーでなくても、スクリプトが書ける。

会場は静まり返った。

「**ソフトウェアの組み立てセット**」——Atkinson はそう呼んだ。MacPaint を作った男が、次に作ったものは「誰でもソフトウェアを作れる環境」だった。全ての新しい Macintosh に**無料でバンドル**される。

Tim Berners-Lee が World Wide Web を提案したのは、その **2年後** だった。

晩年、Atkinson はこう語った。

「もし私が Sun のようなネットワーク中心の文化の中で育っていたら、HyperCard が最初の Web ブラウザになったかもしれない。それが私のキャリア最大の後悔だ。」

---

## 発掘された痕跡

HyperCard のソースコードは非公開のまま眠っている。しかし HyperTalk（スクリプト言語）の設計と、当時のスタックデータの断片が、HyperCard が何を目指していたかを伝えている。

### 痕跡1：HyperTalk——英語が命令になる瞬間

```
【従来のプログラミング言語（BASIC）】
LET X = 5 * 4
PRINT X
IF X > 15 THEN GOTO 100

【HyperTalk（1987年）】
put 5 * 4 into theResult
put theResult into field "answer"
if theResult > 15 then go to card "success"
```

Dan Winkler が設計した HyperTalk は、変数を「文の最後に置く」という選択をした。英語の自然な語順に合わせるために。

```hypertalk
-- テキスト操作：英語のまま読める
put the third word of field "content" into theWord
put the first character of theWord into initial

-- イベント処理
on mouseUp
  go to next card
end mouseUp

on openCard
  put the date into field "today"
  set the cursor to hand
end openCard
```

プログラマーではない人を「オーサー（著者）」と呼んだ。プログラミングではなく「スクリプティング」と呼んだ。**言葉を変えることで、参入の心理的障壁を下げた。**

Brendan Eich は後に HyperTalk から直接インスピレーションを得たと語っている。`onmouseup` というイベントハンドラの命名規則は、HyperCard で生まれた。

### 痕跡2：Stack と Card——ハイパーリンクの原型

```
HyperCard のデータモデル:

Stack（スタック）= ファイル（例: address_book.hcstack）
  └─ Background（背景）= テンプレート
       └─ Card（カード）= レコード
            ├─ Field（フィールド）= テキスト入力
            ├─ Button（ボタン）= クリックで別カードへ
            └─ Script（スクリプト）= HyperTalkコード

リンクの例:
  Button "詳細を見る" → on mouseUp
                          go to card "detail_01" of stack "products"
                        end mouseUp
```

これが 1987 年のハイパーリンクだった。

Web との違いは一つ。**ネットワークを越えられなかった。** カードからカードへ、スタックからスタックへ——全て同じ Mac の中だけで完結していた。

Robert Cailliau（後に Berners-Lee と共に WWW を実装した人物）は、CERN の内部ドキュメントシステムとして HyperCard を検討していた。「ネットワークさえあれば」と思いながら。

### 痕跡3：スタックファイルの内部構造

```
HyperCard Stack ファイル形式（バイナリ）:

Data Fork:
  Block 0: Stack ヘッダー（バージョン、カード数、背景数）
  Block 1〜N: Card データ
    - 4バイト: タイプコード（"CARD"）
    - 4バイト: ブロックID
    - フィールドデータ
    - スクリプトデータ

Resource Fork:
  ICON: カスタムアイコン
  PICT: 画像リソース
  STAK: スタックメタデータ

特徴: フィールドへの入力は即座にファイルに書き込まれる
（「保存」ボタンが存在しない設計）
```

「保存しなくていい」というのは、1987 年には革命的だった。データベースを意識させない——入力したら、それはもう記録されている。

この「即時永続化」の思想は、現代のクラウドサービス（Google Docs 等）の「自動保存」概念の先祖だ。

### 痕跡4：XCMD——Cでコアを拡張する脱出口

```c
/* HyperCard XCMD（外部コマンド）の実装例 */
/* Pascal、C、またはアセンブリで記述可能 */

pascal void MyXCMD(XCmdPtr paramPtr)
{
    /* HyperCardからパラメータを受け取る */
    char *param = *paramPtr->params[0];
    
    /* 独自処理を実行 */
    DoSomethingSpecial(param);
    
    /* 結果をHyperCardに返す */
    paramPtr->returnValue = PasToZero(result);
}
```

HyperTalk で書けないことは XCMD（外部コマンド）で拡張できた。C、Pascal、68000 アセンブリで書いたコードを Resource Fork に埋め込み、HyperTalk から呼び出す。

**「安全な言語に脱出口を用意する」**——Turbo Pascal の INLINE、HyperCard の XCMD、後の TypeScript の `any` 型。同じ設計哲学の繰り返し。

### 痕跡5：Bill Atkinson の後悔——平行世界の扉

```
1987年: HyperCard 公開（ネットワーク非対応、Mac専用）
1989年: Tim Berners-Lee、WWW を提案（ネットワーク対応、プラットフォーム中立）

もし HyperCard がネットワーク対応だったら:
  - Stack URL: hypercard://server/stack_name/card_id
  - リンク: go to card "news" of stack "nytimes" at "server.nyt.com"
  - カードを超えたスタック間リンク

これが 1987 年に実装されていれば...
```

Atkinson は後年、自分がなぜネットワーク対応にしなかったかを振り返っている。

「Apple の文化はボックス中心だった。私たちは製品を売る会社だった。Sun のようなネットワーク文化の中で育っていれば、インターネット対応は自然な発想だったはずだ。しかし私はそれを考えなかった。それが最大の後悔だ。」

Ward Cunningham（Wiki の発明者）は、HyperCard のスタックを「複数ユーザーが編集できる Web 版にしたい」という欲求から Wiki を作った。

**HyperCard は Web の父ではなく、Web の「もう一人の父になれた人」だった。**

### 痕跡6：Apple による廃止——Jobs の復讐

```
HyperCard の命運:

1987年: リリース。全 Mac に無料バンドル（Atkinson の条件）
1990年: Claris に移管。バージョン 2.0 から有料化（$199）
        → オーサリング機能を削除した「Player」のみ無料に
1998年: HyperCard 3.0（C++で完全書き直し、ネット対応）を開発中
        → Steve Jobs が中止命令
2004年: 販売終了。Mac OS X には非対応のまま終了

Jobs が廃止した理由（Atkinson の証言）:
「Jobs は私が NeXT に参加しなかったことを怒っていた。
 HyperCard は Sculley（前 CEO）の匂いがした。
 それで廃止されたのだと思う。」
```

技術的理由ではなかった。**個人的な感情と組織の記憶が、一つのソフトウェアを葬った。**

HyperCard 3.0 はほぼ完成していた。ネットワーク対応、カラー表示、QuickTime 統合——Atkinson が後悔し続けた「ネットワーク」が、ようやく実装されようとしていた。Jobs が戻った年に中止された。

---

## 年表

**1985年**: Bill Atkinson、HyperCard の開発開始。最初は個人プロジェクト。Apple に採用を訴えるため非公式に開発を続ける。

**1987年8月11日**: MacWorld Boston で公開。「ソフトウェアの組み立てセット」として発表。全 Mac に無料バンドル（Atkinson の条件）。

**1989年3月13日**: Tim Berners-Lee、「Information Management: A Proposal」を提出。WWW の誕生。

**1990年**: Apple が HyperCard を Claris に移管。バージョン 2.0 から有料化。Ward Cunningham、HyperCard にインスパイアされ Wiki の構想を始める。

**1991年**: Brendan Eich、HyperTalk から影響を受けた設計思想を持つ言語の実験を開始（後の JavaScript に繋がる）。

**1995年**: JavaScript 誕生。`onmouseup` 等、HyperTalk の命名規則を継承。

**1996年**: Ward Cunningham、WikiWikiWeb 公開。HyperCard スタックの「複数人で編集できる Web 版」として。

**1998年**: Steve Jobs、HyperCard 3.0 の開発を中止命令。

**2004年3月**: HyperCard、販売終了。Mac OS X への移植なし。

**2017年**: Internet Archive、HyperCard 30周年記念でブラウザ上でオリジナルスタックを実行できるプロジェクトを開始。

---

## AI 解析データ

| 指標 | 値 |
|:---|---:|
| 実装言語 | 68000 Assembly + C（後期は C++） |
| スクリプト言語 | HyperTalk（設計：Dan Winkler） |
| リリース日 | 1987年8月11日 |
| 価格 | 無料（全 Mac バンドル）→ 1990年から $199 |
| WWW 提案より前 | 約2年（HyperCard 1987、WWW提案 1989） |
| 廃止年 | 2004年 |
| 影響を与えた技術 | WWW、JavaScript、Wiki、Flash |
| ソースコード | 非公開（Apple 管理） |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.056
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Apple HyperCard (1987, 68000 Assembly + C)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年4月

■ 鑑定結果
  希少度:          ★★★★★
  技術的負債密度:    ★★★☆☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★★

ソースコードは Apple の管理下に非公開。HyperTalk のスクリプトと当時のスタックファイルが唯一の痕跡。「Web を発明できた」という歴史的 if が宿るコードとして最高の希少価値。

### 技術的負債密度: ★★★☆☆

ネットワーク非対応という設計上の「穴」が致命的だった。即時永続化、XCMD の拡張性、HyperTalk の設計——個々は優秀だが、ローカル限定という壁が全てを制限した。Jobs による廃止は「外部要因の負債」と言える。

### 考古学的価値: ★★★★★

WWW、JavaScript、Wiki、Flash——現代 Web の根幹をなす技術の複数に直接影響を与えた。「最初のノーコード環境」として、今日の Notion、Airtable、Bubble の先祖でもある。**2年先にいながら、2年先に行けなかった。**

### 読み物としての面白さ: ★★★★★

「Web を発明できたのにしなかった」という Atkinson の後悔。ネットワーク対応版が完成目前で Jobs に中止された悲劇。Ward Cunningham が「ネットワーク版 HyperCard を作りたい」という欲求から Wiki を発明した事実——技術史最大の「if」が詰まっている。

---

## 鑑定人所見

HyperCard は「扉」だ。

1987 年、Atkinson は扉を作った。カードからカードへ、ボタンをクリックして跳び移る扉。それは WWW の扉と同じ形をしていた。しかし扉は壁の中にあった——ネットワークという壁の内側だけに。

2年後、Berners-Lee は同じ形の扉を、壁の外に向けて取り付けた。それが Web になった。

Atkinson はその後ずっとその扉を見ている。「もし私がネットワークを考えていれば」と。しかし 1987 年の Apple はボックスを売る会社だった。ネットワークを売る会社ではなかった。文化が技術の射程を決めた。

Ward Cunningham は HyperCard の扉をコピーしてネットワークに繋ぎ、Wiki を作った。Brendan Eich は HyperTalk の文法を使って JavaScript を書いた。HyperCard が作れなかったものを、他の人々が HyperCard から学んで作った。

**扉は消えた。でも扉を通った風は、今も吹いている。**

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
