# 一晩で書かれた道具、動詞になった名前——grep、1973年の300行

## はじめに

GitHubにUnixの全歴史がある。

**dspinellis/unix-history-repo**。Bell-32VブランチにはBell Labs 1979年当時のソースが入っている。その中に `usr/src/cmd/grep.c` がある。**300行弱の単一ファイル**だ。

1973年、Doug McIlroy（Unix開発チームのリーダー）はKen Thompsonに頼んだ。「ファイルの中から特定のパターンを含む行を探せるツールが欲しい。」Thompsonは一晩でこれを書いた。

名前の由来は `ed` のコマンド — **`g/re/p`**。`g`（global）、`re`（regular expression）、`p`（print）。全行を正規表現で検索してprintする——それだけだ。略してgrep。

今日「grepする」は英語の動詞だ。

---

## 発掘されたコード

- **リポジトリ**: [dspinellis/unix-history-repo](https://github.com/dspinellis/unix-history-repo)（Bell-32V-Snapshot-Development ブランチ）
- **スター数**: 7,215
- **実装言語**: C
- **設計者**: Ken Thompson（Bell Telephone Laboratories）
- **初版**: 1973年

```
grep.c — 単一ファイル、約300行

main()     # 引数解析（-v/-c/-n/-l/-b/-h/-y）
compile()  # 正規表現コンパイラ（バイトコード生成）
execute()  # ファイルスキャンループ
advance()  # パターンマッチングエンジン（バイトコード実行）
succeed()  # マッチした行の出力
ecmp()     # 文字列比較
errexit()  # エラー終了
```

---

## 名前はedから来た

Ken Thompsonは1969年にUnixを書いた。1971年に `ed`（ラインエディタ）を書いた。`ed` には正規表現によるコマンドがあった。

```
g/re/p
```

`g` — global（全行に適用）  
`re` — regular expression（正規表現パターン）  
`p` — print（マッチした行を印刷）

McIlroyが「これをスタンドアロンのコマンドにしてほしい」と頼んだとき、Thompsonは `ed` の正規表現エンジンを取り出してラップした。コマンド名はそのまま——`g/re/p` の略だから `grep`。

一晩で書いた。

---

## compile()——正規表現をバイトコードに変換する

`grep.c` の中核は `compile()` 関数だ。正規表現パターンを受け取り、バイトコード列に変換する。

```c
/* opcode定義 */
#define CBRA    1   /* \( — キャプチャグループ開始 */
#define CCHR    2   /* 文字リテラル */
#define CDOT    4   /* . — 任意1文字 */
#define CCL     6   /* [...] — 文字クラス */
#define NCCL    8   /* [^...] — 否定文字クラス */
#define CDOL   10   /* $ — 行末 */
#define CEOF   11   /* パターン終端 */
#define CKET   12   /* \) — キャプチャグループ終端 */
#define CBACK  18   /* \1〜\9 — 後方参照 */

#define STAR   01   /* 直前のopcodeにORして「0回以上」 */
```

`STAR` が面白い。独立したopcodeではなく、**他のopcodeに1ビットORするだけ**だ。`CCHR|STAR = 3`、`CDOT|STAR = 5`、`CCL|STAR = 7`——1つのバイトに2つの情報が詰まっている。

文字クラス `[a-z]` の実装は16バイト（128ビット）のビットマップを使う。

```c
case '[':
    *ep++ = CCL;
    /* ... */
    do {
        if (c=='-' && sp>cstart && *sp!=']') {
            for (c = sp[-2]; c<*sp; c++)
                ep[c>>3] |= bittab[c&07];  /* ビット立て */
            sp++;
        }
        ep[c>>3] |= bittab[c&07];
    } while((c = *sp++) != ']');
    ep += 16;  /* 16バイト分のビットマップを進める */
```

`c>>3` でビットマップの何バイト目か、`c&07` でそのバイトの何ビット目かを決める。ASCII文字128種を16バイト（= 128ビット）で表現する。マッチは `ep[c>>3] & bittab[c&07]` で1命令。

---

## advance()——バイトコードを実行するエンジン

`advance()` は `switch` の無限ループでバイトコードを1命令ずつ処理する。

```c
advance(lp, ep)
register char *lp, *ep;  /* lp=行ポインタ, ep=バイトコードポインタ */
{
    for (;;) switch (*ep++) {

    case CCHR:
        if (*ep++ == *lp++)   /* 文字が一致したら */
            continue;          /* 次の命令へ */
        return(0);             /* 不一致 */

    case CDOT:
        if (*lp++)             /* NULL以外なら任意にマッチ */
            continue;
        return(0);

    case CEOF:
        return(1);             /* パターン終端 = マッチ成功 */

    case CCL:
        c = *lp++ & 0177;
        if(ep[c>>3] & bittab[c & 07]) {  /* ビットマップ参照 */
            ep += 16;
            continue;
        }
        return(0);
```

`STAR` のマッチングは「できるだけ多く消費してから右から左へ戻る」方式だ。

```c
case CDOT|STAR:
    curlp = lp;
    while (*lp++);      /* 行末まで全部消費 */
    goto star;          /* STARの共通処理へ */

case CCHR|STAR:
    curlp = lp;
    while (*lp++ == *ep);  /* 同じ文字を消費し続ける */
    ep++;
    goto star;

case CCL|STAR:
    curlp = lp;
    do {
        c = *lp++ & 0177;
    } while(ep[c>>3] & bittab[c & 07]);
    ep += 16;
    goto star;

star:
    /* 最長マッチから右へ戻りながら試す（greedy + backtracking） */
    do {
        if (advance(lp, ep))
            return(1);
    } while (lp-- > curlp);
    return(0);
```

`goto star` — 3つの異なる `STAR` ケースが同じ `star:` ラベルに合流する。gotoを使うことで、共通の後退処理を重複なく書いている。

---

## -yフラグ——ケース無視の奇妙な実装

`grep` の `-y` オプション（大文字小文字を区別しない）の実装が面白い。

```c
if (yflag) {
    register char *p, *s;
    for (s = ybuf, p = *argv; *p; ) {
        /* ... */
        } else if (islower(*p)) {
            *s++ = '[';
            *s++ = toupper(*p);  /* 'a' → '[Aa]' */
            *s++ = *p++;
            *s++ = ']';
        } else
            *s++ = *p++;
    }
    *argv = ybuf;  /* 変換後のパターンで上書き */
}
```

`hello` というパターンを `-y` で渡すと、内部で `[Hh][Ee][Ll][Ll][Oo]` に変換してからコンパイルする。大文字小文字対応を「正規表現への事前変換」で解決している。エンジン自体は何も変えていない。

---

## 実行ループの高速化

`execute()` にはひとつの最適化がある。

```c
/* fast check for first character */
if (*p2==CCHR) {
    c = p2[1];
    do {
        if (*p1!=c)    /* 最初の文字が違えばskip */
            continue;
        if (advance(p1, p2))
            goto found;
    } while (*p1++);
    goto nfound;
}
/* regular algorithm */
do {
    if (advance(p1, p2))
        goto found;
} while (*p1++);
```

パターンが文字リテラルで始まる場合（最も一般的なケース）、最初の文字をチェックしてから `advance()` を呼ぶ。`advance()` を呼ぶコストは高い——最初の1バイトで弾ける場合は呼ばない。1973年の、シンプルな最適化だ。

---

## 300行に収まった完全な正規表現エンジン

grep.cには以下がすべて入っている。

```
正規表現の機能:
  .       任意1文字（CDOT）
  *       0回以上の繰り返し（STAR修飾子）
  ^       行頭アンカー（circfフラグ）
  $       行末アンカー（CDOL）
  [...]   文字クラス（16バイトビットマップ）
  [^...]  否定文字クラス
  \(  \)  キャプチャグループ（CBRA/CKET）
  \1〜\9  後方参照（CBACK）

コマンドラインオプション:
  -v  マッチしない行を表示（反転）
  -c  マッチ行数を表示
  -n  行番号を表示
  -l  マッチしたファイル名だけ表示
  -b  ブロック番号を表示
  -h  ファイル名を表示しない
  -y  大文字小文字を区別しない
```

後方参照まで1973年のgrepに入っている。

---

## 鑑定

```
ファイル   : usr/src/cmd/grep.c（単一ファイル、約300行）
言語       : C
誕生       : 1973年、AT&T Bell Labs
設計者     : Ken Thompson
名前の由来 : ed コマンド "g/re/p"（global/regular expression/print）
制作時間   : 一晩
正規表現   : バイトコード方式（CCHR/CDOT/CCL/CBRA/STAR）
影響       : egrep（1979）、grep -E、POSIX grep、ripgrep（2016、47k⭐）
```

Thompsonは一晩で書いた。300行に——正規表現コンパイラ、バイトコード実行エンジン、ファイルスキャナ、8つのコマンドラインオプション、後方参照——すべてを詰め込んだ。

`goto star` という1行が、3つの `STAR` ケースを1つの後退処理に束ねる。16バイトのビットマップが文字クラスを表現する。`-y` は正規表現変換でケース無視を実現する。何も余分なものがない。

「grepする」は英語の動詞になった。IT業界以外でも使われる。1973年の一晩が作った言葉が、英語の語彙に刻まれている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
