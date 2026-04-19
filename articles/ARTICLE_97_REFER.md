# `false drops`——ハッシュ衝突を後から弾く2段階検索、Mike Leskの参考文献エンジンと`/usr/dict/papers`に眠るBell Labs論文データベース

**Bell Labs, 1978年。Cで書かれた参考文献管理システム。**

---

## はじめに

troff（#082）で論文を書いているとき、参考文献をどう管理するか。引用する場所にこう書く：

```
.[
ritchie thompson unix
.]
```

`.[`と`.]`の間はキーワードだ。referがデータベースを検索し、一致した文献のtroffマクロを自動生成する。手動で番号を振らなくてよい。

BibTeX（1985年）が現れる前、これが答えだった。

---

## 作者——Mike Lesk

**Mike Lesk**——tbl（#083）を書いた男。1978年にreferを書いた。

document processingパイプライン（eqn→tbl→pic→troff）の設計者と同一人物が、そのパイプラインの上流に参考文献エンジンを置いた。

---

## 5つのプログラムが分業する

referは1つのコマンドではない。相互に呼び合う5つのプログラムのシステムだ：

```
mkey   — 文献ファイルからキーワードを抽出してインデックスを作る
inv    — 転置インデックスを .ia/.ib/.ic の3ファイルで構築する
hunt   — インデックスを検索し、文献のファイル位置を返す
deliv  — 文献テキストを整形して渡す
refer  — 以上をオーケストレートし、troffマクロを出力する
```

`refer1.c`の`main()`は`.[`行を見つけると`doref()`を呼ぶ：

```c
while (input(line)) {
    if (!prefix(".[", line))
        output(line);
    else
        doref(line);
}
```

`.[`以外の行は素通し。`.PS`〜`.PE`のpicと同じ哲学だ。

---

## `%A`から始まる文献フォーマット

データベースファイルは1行1フィールドの `%X` 形式：

```
%A M. E. Lesk
%T Some Applications of Inverted Indexes on the Unix System
%R Bell Laboratories memorandum
%D 1978
%K refer inverted index unix
```

`%A`=著者、`%T`=タイトル、`%J`=雑誌、`%B`=書籍、`%R`=技術報告書、`%D`=日付、`%P`=ページ、`%V`=巻——この`%`フィールド形式は、BibTeXの `author = {}` の直接の祖先だ。

---

## `mkey`——6文字キーと1978年フィルター

`mkey2.c`のキー抽出ロジック：

```c
if (isdigit(ky[0]))
    if (ky[0] != '1' || ky[1] != '9' || n != 4) return(0);
```

年を表す数字は `1900〜1999` の4桁のみ通す。1978年時点での実用的な判断——21世紀は想定外だ。

各単語は先頭6文字だけを使う。3文字未満は捨てる。"common words"リスト（`/usr/lib/eign`）に載っている語は無視する。

出力は `filename:byte-offset,length TAB key1 key2 key3` 形式。ファイルの物理的な位置とキーワードの対応表だ。

---

## `inv`——`.ia`/`.ib`/`.ic` の転置インデックス

`inv1.c`が3ファイルを生成する：

```
.ia — ハッシュテーブル（nhash個のポインタ、デフォルト256エントリ）
.ib — レコード番号リスト（各ハッシュバケットが指すリスト）
.ic — レコードの物理位置（byte-offset）
```

`inv2.c`の`newkeys()`：

```c
fprintf(outf, "%04d %06ld\n", hash(keyv[i]) % nhash, lp);
```

キーのハッシュ値（mod nhash）と、そのキーが属するレコードのファイル位置を対応付ける。`sort`コマンドに通してソートし、同じハッシュ値のレコードをグループ化する。

インデックスの再構築は差分更新に対応（`-a` append フラグ）。論文を追加するたびに全部作り直す必要はない。

---

## `hunt` と `false drops`——2段階の検索

`hunt2.c`の`doquery()`は各クエリキーのハッシュ値でインデックスを引き、AND検索でレコードを絞り込む。

しかし**ハッシュ衝突**がある。256エントリのテーブルで全論文を管理すれば、違う単語が同じバケットに入る。`doquery()`だけでは誤ヒット（**false drops**）が生じる。

それを弾くのが`baddrop()`だ：

```c
if (falseflg == 0)
    nfound = baddrop(master, nfound, fc, nitem, qitem, rprog, full);
```

`.ic`ファイルから実際のレコードテキストを読み直し、クエリキーが本当に存在するか確認する。ハッシュで候補を絞り、テキストで検証する——2段階の設計だ。

コードにそのまま `false drops` という用語が出てくる。情報検索の専門用語がコメントなしにコードに埋まっている。

---

## `refer2.c`——クエリの実行

`doref()`が引用ブロックを処理する：

```c
switch (newline(answer)) {
case 0:
    fprintf(stderr, "No such paper %s\n", buff);
    return;
default:
    fprintf(stderr, "too many hits for '%s'\n", trimnl(buff));
    choices(answer);
    /* fall through, use first hit */
case 1:
    /* found exactly one: proceed */
    break;
}
```

- ヒット0件：stderrに警告、出力は空
- ヒット1件：そのまま採用
- ヒット複数：各文献の `%T` タイトルをstderrに表示してユーザーに選ばせ、最初の候補を暫定採用

---

## `refer6.c`——troffへの変換

`putref()`が文献データをtroff変数として出力する：

```c
fprintf(fo, ".ds [A %s\n", author);
fprintf(fo, ".ds [T %s\n", title);
fprintf(fo, ".ds [J %s\n", journal);
fprintf(fo, ".][ %s\n", class(n, tvec));
```

`class()`が文献種別を判定する：

```c
if (hastype(nt, tv, 'J')) return("1 journal-article");
if (hastype(nt, tv, 'B')) return("3 article-in-book");
if (hastype(nt, tv, 'R')) return("4 tech-report");
if (hastype(nt, tv, 'I')) return("2 book");
if (hastype(nt, tv, 'M')) return("5 bell-tm");
return("0 other");
```

"5 bell-tm"——Bell Labsのテクニカルメモランダムが独立したカテゴリとして存在する。Bell Labsの中で生まれた道具だからだ。

`caps()`は著者名をスモールキャプスに変換する——`\s-2SMALL CAPS\s+2`というtroff呪文を生成する。

---

## `/usr/dict/papers/Ind`——Bell Labsの論文データベース

`refer1.c`のデフォルト設定：

```c
if (nodeflt == 0)
    *search++ = "/usr/dict/papers/Ind";
```

`-p`フラグなしでreferを使うと、自動的に `/usr/dict/papers/Ind` を検索する。このインデックスはBell Labs内部の論文データベースだ。当時のUnixには、Bell Labsが書いたCS論文のコレクションが付属していた。

spell（#085）の `/usr/dict` と同じ場所——Unixのシステム辞書ディレクトリが、論文データベースの格納場所でもあった。

---

## `-e` と `$LIST$`——文末一括出力

`-e`フラグで文中引用と文献リストを分離できる：

```c
case 'e':
    endpush++; break;
```

本文中に `.[`〜`.]` を書き、文献リストを置きたい場所で：

```
.[
$LIST$
.]
```

`doref()`が `$LIST$` を検出するとそれまでに収集した全文献を一括出力する——現代の`\bibliography{}`と同じ発想だ。

---

## 鑑定

```
初版       : 1978年（Mike Lesk、Bell Telephone Laboratories）
このバージョン: Bell-32V（1979年、AT&T）
実装       : C（5プログラム、refer/mkey/inv/hunt/deliv、約4,000行）
文献フォーマット: %A/%T/%J/%B/%R/%D/%P/%V（BibTeXの直接の祖先）
インデックス: .ia（ハッシュ表）.ib（レコードリスト）.ic（文字位置）
2段階検索  : doquery()（ハッシュ検索）→ baddrop()（false drops除去）
キー抽出   : 単語先頭6文字、3文字未満・common words・非19xx年数字は捨てる
troff出力  : .ds [A/.ds [T/.ds [J + .][ 1 journal-article など5分類
デフォルトDB: /usr/dict/papers/Ind（Bell Labs CS論文コレクション）
後継       : BibTeX（1985年）、biber（2009年〜）
```

**`false drops`——Mike Leskはハッシュ衝突を「誤検知」と名付け、2段階で弾いた。`%A`から始まる文献フォーマットはBibTeXに引き継がれ、`/usr/dict/papers`のBell Labs論文データベースはUnixに付属していた。**
