# 3人の頭文字がPerlを生んだ——AWK、48年現役の1行言語

## はじめに

GitHubに「著者本人が2025年12月25日にコミットした」コードがある。

**onetrueawk/awk**。Brian Kernighan自身が保守するリポジトリだ。最新コミットのメッセージは「adjust version date: 20251225」——クリスマスの日にバージョン文字列を更新した。1977年生まれの言語を、著者が48年後も手入れし続けている。

**AWK**。AT&T Bell Labsで3人の研究者が設計した、テキスト処理のための言語だ。名前は設計者3人の頭文字——**A**lfred Aho、Peter **W**einberger、Brian **K**ernighan。偶然にも「awkward（不格好）」と同音になった。しかし彼らは名前を変えなかった。

2024年、Aho・Kernighan・Weinbergerは初版（1988年）から36年越しで**第2版の教科書**を出版した。1977年に設計した言語の本を、著者自ら47年後に書き直した。

---

## 発掘されたコード

- **リポジトリ**: [onetrueawk/awk](https://github.com/onetrueawk/awk)
- **スター数**: 2,183
- **実装言語**: C（yacc文法ファイル含む）
- **設計者**: Alfred V. Aho、Peter J. Weinberger、Brian W. Kernighan（AT&T Bell Labs）
- **誕生年**: 1977年
- **最終コミット**: 2025年12月25日（Kernighan本人）

```
awk/
├── main.c      # エントリーポイント
├── lex.c       # 字句解析
├── awkgram.y   # yacc文法（パターン-アクション定義）
├── parse.c     # 構文木構築
├── run.c       # 実行エンジン（59KB・最大ファイル）
├── tran.c      # シンボルテーブル・連想配列
├── b.c         # 正規表現エンジン（38KB）
└── awk.h       # Cell構造体・型定義
```

---

## sedとgrepの間にあった空白

1977年のBell Labs。Unix開発者たちは日常的にテキスト処理をしていた。

`grep`はパターンに合う行を検索できる。`sed`はパターンに合う行を置換できる。しかし「パターンに合う行の**数値を集計する**」「特定の列だけ**抽出して計算する**」——これを1行で書ける道具がなかった。

3人が解いた問題はシンプルだった。

```
「行を読む。条件を評価する。条件が真なら処理を実行する。
 これを全行に繰り返す。」
```

この「パターン-アクション」モデルが、AWKの全てだ。

```awk
# 3列目が1000を超える行を表示する
$3 > 1000 { print }

# /error/にマッチする行を数える
/error/ { count++ }
END { print count }

# CSVの2列目の合計
BEGIN { FS = "," }
{ sum += $2 }
END { print sum }
```

プログラムはルールのリストだ。パターンがなければ全行に適用される。アクションがなければ行を表示する。`BEGIN`と`END`は特殊なパターンで、処理の前後に実行される。

---

## 文法の中核——pastat

`awkgram.y`の中に、AWKの本質が1行で表現されている。

```c
/* awkgram.y — パターン-アクション文の文法定義 */
pa_stat:
    pa_pat                    { $$ = stat2(PASTAT, $1,
                                  stat2(PRINT, rectonode(), NIL)); }
  | pa_pat lbrace stmtlist '}' { $$ = stat2(PASTAT, $1, $3); }
  | lbrace stmtlist '}'       { $$ = stat2(PASTAT, NIL, $2); }
  | XBEGIN lbrace stmtlist '}' { beginloc = linkum(beginloc, $3); }
  | XEND   lbrace stmtlist '}' { endloc   = linkum(endloc,   $3); }
```

`PASTAT`（Pattern-Action Statement）——これがAWKの中核だ。パターン単独ならデフォルトでprintを実行する。アクション単独（`lbrace stmtlist`）なら全行に適用する。`BEGIN`と`END`はリンクリストで連結されて先頭・末尾に配置される。

プログラム全体は、この`pa_stat`の連なりに過ぎない。

---

## 連想配列という革命

AWKが1977年に導入した機能のひとつが**連想配列**だ。文字列をキーとしてランダムアクセスできる配列——今日のPythonの辞書型、JavaScriptのオブジェクトの先祖。

```awk
# アクセスログの各IPアドレスのリクエスト数を集計
{ count[$1]++ }
END { for (ip in count) print ip, count[ip] }
```

`tran.c`の中に、連想配列の多次元添字を実現するハックがある。

```c
/* tran.c — 多次元配列の添字分離文字 */
subseploc = setsymtab("SUBSEP", "\034", 0.0, STR|DONTFREE, symtab);
SUBSEP = &subseploc->sval;
```

`\034`（ASCII文字列分離符）——AWKには本来の多次元配列がない。`a[i,j]`は内部で`a[i SUBSEP j]`という文字列連結に変換される。`\034`は通常のテキストには現れない制御文字なので、誤衝突を防げる。

多次元配列を「1次元配列 + 特殊文字の結合」で実現するこの設計は、制約から生まれた実用主義だ。

---

## 全変数は文字列であり数値である

AWKの型システムは独特だ。すべての値は「文字列」であり「数値」でもある。

```c
/* awk.h — すべての値を表すCell構造体 */
typedef struct Cell {
    uschar    ctype;   /* OCELL, OBOOL, OJUMP, etc. */
    uschar    csub;    /* CCON, CTEMP, CFLD, etc. */
    char     *nval;    /* name, for variables only */
    char     *sval;    /* string value */
    Awkfloat  fval;    /* value as number */
    int       tval;    /* type フラグ: STR|NUM|ARR|FCN|FLD|CON|DONTFREE */
    char     *fmt;     /* CONVFMT/OFMT value used to convert from number */
    struct Cell *cnext; /* ptr to next if chained */
} Cell;
```

`sval`と`fval`の両方を同時に持つ。コンテキストに応じて自動変換される——数値演算には`fval`を使い、文字列操作には`sval`を使う。`tval`のフラグが現在どちらが有効かを記録する。

これは1977年当時の「シェルスクリプトの世界観」だ。変数は基本的に文字列だが、必要なら数値として扱える。この曖昧さが、1行でログを集計できる柔軟性を生んだ。

---

## AWKがPerlを生んだ

1987年、Larry WallはAWKを起点にPerlを設計した。

WallはAWKの設計を称賛しながら、こう語った。

> **「AWKはテキスト処理の問題を1行で解けるが、AWKで解けない問題が出てきたとき、逃げ場がなかった。Perlはその逃げ場だ。」**

AWKができること——パターンマッチ、フィールド分割、連想配列、数値演算。
AWKにできないこと——複雑なデータ構造、ファイルシステム操作、プロセス制御。

PerlはAWKの語彙とsedの置換構文を吸収し、その上に「逃げ場」を追加した。`$_`、`@array`、`%hash`——AWKの`$0`、フィールド、連想配列の直系の子孫だ。

AWKがなければPerlはなかった。PerlがなければRubyの誕生も違う形だった。1977年のBell Labsで設計された「パターン-アクション」の思想は、現代のスクリプト言語に連綿と流れている。

---

## 鑑定

```
リポジトリ : github.com/onetrueawk/awk
言語       : C（+ yacc）
誕生       : 1977年、AT&T Bell Labs
設計者     : Alfred Aho、Peter Weinberger、Brian Kernighan
名前の由来 : 3人の頭文字（A・W・K）——偶然"awkward"と同音
核心技術   : パターン-アクションモデル、連想配列
影響を与えた言語: Perl（1987）→ Ruby、Python（間接的に）
最終コミット: 2025年12月25日（Kernighan本人、クリスマスに）
2024年     : 第2版教科書出版（初版から36年後、著者自ら）
```

Kernighanはクリスマスの日にコミットした。「adjust version date: 20251225」——バージョン文字列を更新しただけだ。しかしその1コミットが、1977年から48年続く保守の証明だ。

2024年、3人は第2版を書いた。47年前に設計した言語の本を、著者自らが書き直した。第2版ではUTF-8とCSV対応が追加された——1977年の設計が、2024年のデータ形式に対応した。

「1行で書ける」という思想は死んでいない。今日もサーバー管理者がAWKで1行のログ解析スクリプトを書いている。Larry WallがPerlで「逃げ場」を作ったにもかかわらず、AWKはPerlに取って代わられなかった。**「1行で済む問題にPerlは重すぎる」**——これがAWKが生き続ける理由だ。

3人の頭文字。48年後もクリスマスにコミットする男。Perlを生んだ道具。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
