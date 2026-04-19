# Legacy Code Museum — Project Instructions

## Language
常に日本語で返答すること。

## Project Overview

Bell Labs Unix（主にBell-32V, 1979年）を中心とした古いソースコードの鑑定書を作成する連載プロジェクト。
note.comで「Bell Labsの道具箱」として週次連載中。

## 鑑定書ワークフロー

1. **ソース発掘** — dspinellis/unix-history-repo から取得
2. **記事執筆** — `articles/ARTICLE_9X_XXX.md`
3. **NOTE_FORMAT作成** — `C:\G.state\articles\ARTICLE_9X_NOTE_FORMAT.txt`
4. **page.tsx更新** — `src/app/appraisal/page.tsx` の items[] に追加
5. **ビルド確認** — `npm run build`
6. **コミット＆push** — legacy-code-museum リポジトリ
7. **Issue #19更新** — gstate-gk/legacy-code-archive の Issue #19 にコメント
8. **メモリ更新** — `C:\Users\keita\.claude\projects\C--G-state\memory\`

## ソース取得方法

Bell-32V は unix-history-repo（dspinellis）の `Bell-32V-Snapshot-Development` ブランチ。
フルcloneは重いため一時ディレクトリでfetchする：

```sh
mkdir -p /c/G.state/tmp/bell32v-XXX
cd /c/G.state/tmp/bell32v-XXX
git init
git remote add origin https://github.com/dspinellis/unix-history-repo.git
git remote set-branches origin '*'
git fetch --depth=1 origin Bell-32V-Snapshot-Development
# 以後 git show FETCH_HEAD:usr/src/cmd/XXX でファイルを読む
```

主なソースパス: `usr/src/cmd/` 配下

## Bell-32V コードの読み方

### 文体パターン（共通）

**フラグ解析**（ほぼ全プログラム同じ形）:
```c
while (argv[1][0] == '-') {
    switch(argv[1][1]) {
        case 'x': ...; break;
    }
    argc--; argv++;
}
```

**デバッグ出力**（コンパイル時定数で制御）:
```c
# if D1
fprintf(stderr, "debug info %s\n", val);
# endif
```
`D1` が定義されていない通常ビルドでは消える。コードに大量に散在するが無視してよい。

**エラー処理**:
```c
err("message %s", arg);   /* stderrに出してexit */
assert(condition);         /* _assert() の場合も */
```

**プロセス間通信**:
```c
corout(input, output, "progname", args, len);
/* サブプロセスを起動してパイプで通信 */
```

**ファイル命名**: `cmd..c`（ヘッダ兼extern宣言）、`cmd0.c`（globals）、`cmd1.c`〜（機能別分割）

### 各作者の特徴

| 作者 | 特徴 |
|------|------|
| Ken Thompson | 極端に短い変数名、最小限のコード、再帰的な設計（ed, dc） |
| Brian Kernighan | 読みやすいDSL設計、yacc/lex活用、英語に近い構文（eqn, pic, AWK） |
| Mike Lesk | パイプライン分業、troff出力を生成するプログラム群（tbl, refer） |
| Stephen Johnson | コンパイラ技術の応用、ツール生成ツール（yacc, lint, pcc） |
| Doug McIlroy | データ構造の数学的最適化、パイプライン哲学の体現（spell） |

### 読む順序の指針

1. `xxx..c` または `xxx0.c` — extern宣言・定数定義でデータ構造を把握
2. `xxx1.c` — main()でフラグとエントリポイントを確認
3. 最も行数が多いファイル — コアロジック
4. 出力を生成するファイル — troff呪文や特殊フォーマットの確認

### よく登場する設計パターン

- **フィルターパターン**: `.PS`〜`.PE`、`.TS`〜`.TE`、`.[`〜`.]` で区切られた範囲だけ処理、それ以外は素通し（pic, tbl, refer）
- **転置インデックス**: `.ia`/`.ib`/`.ic` の3ファイル構成（refer/hunt）
- **Bloom filter**: prime moduli × ビット配列（spell）
- **逆順格納**: 末尾マッチングを先頭比較で実現（spell の suftab[]）
- **PAIRマクロ**: 2文字リクエストを1 int に圧縮（troff の contab[]）
- **fseek埋め戻し**: 仮値書き込み→確定後に戻って上書き（f77）
- **INCH=432**: CAT写植機の解像度、troff/picで共通

## 記事フォーマット

### ARTICLE_XX_NAME.md の構成
1. タイトル（比喩——説明、N行）
2. 太字サブタイトル（Bell Labs, 年, 実装言語）
3. 区切り `---`
4. ## はじめに（最も印象的なコード断片）
5. ## 作者——名前（他の鑑定書との関連）
6. ## 各セクション（コード引用＋解説）
7. ## 鑑定（コードブロックで鑑定表）
8. 末尾の太字まとめ文

### 鑑定表フォーマット
```
初版       : 年（作者、所属）
このバージョン: Bell-32V（1979年、AT&T）
実装       : 言語（ファイル数、行数）
[特徴項目] : 値
後継       : 後継ソフトウェア
```

### 比喩の方向性
- コードの最も奇妙/印象的な1点をタイトルにする
- 技術的事実を比喩にする（`INCH 432`、`false drops`、`ssen`）
- 作者の意図や時代背景を1行で表現する

## 累計進捗

`C:\Users\keita\.claude\projects\C--G-state\memory\project_appraisal_progress.md` を参照。
現在 #086 refer まで完了。次候補は同memoryの `appraisal_candidates.md` を参照。
