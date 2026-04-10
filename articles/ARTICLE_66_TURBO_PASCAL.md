# $49.95の稲妻——デンマーク人のコンパイラが観光ビザのフランス人とIDEを発明した

## はじめに

1983年11月、Las Vegas で COMDEX が開催された。

Philippe Kahn（フィリップ・カン）には、ブースを借りる2,000ドルがなかった。観光ビザで渡米して2年、法的に「働いて」はいけない身だった。それでも彼は会場に来た。

展示スペースの一角に、空きテーブルを持て余している会社があった。Kahn は交渉した。「あなたの広告を Turbo Pascal のマニュアルに載せる。その代わり、テーブルの端を使わせてほしい」。

合意した。

初日だけで、注文が150本以上届いた。**$49.95 × 150 = 約7,500ドル。** 製造コストを回収するのに十分だった。

Turbo Pascal の核心部分を書いたのは、コペンハーゲンの学生 **Anders Hejlsberg**（アンダース・ヘイルスバーグ）だった。Borland がデンマークで見つけた彼のコンパイラ「PolyPascal」をライセンス取得し、IBM PC向けに仕上げた。

その日 COMDEX で売られた1本は、後に C# と TypeScript につながる最初の一歩だった。

---

## 発掘された痕跡

Turbo Pascal のソースコードは公開されていない。しかし、コンパイラの動作はリバースエンジニアリングと当時のドキュメントから詳細に記録されている。

### 痕跡1：シングルパスの奇跡——読んだ瞬間に機械語が出る

```
【従来のコンパイラ（Multi-Pass）】

ソース → [字句解析] → トークン列
      → [構文解析] → 構文木
      → [意味解析] → 中間コード
      → [最適化]   → 最適化済み中間コード
      → [コード生成] → 機械語
      ※ ディスクへの読み書きが各フェーズ間で発生

【Turbo Pascal（Single-Pass）】

ソース → [字句解析 + 構文解析 + コード生成] → 機械語（同時）
      ※ メモリ内で完結。ディスクアクセスなし
```

Turbo Pascal はソースを一行読むごとに、**そのまま機械語を出力した。**

当時の競合コンパイラ（UCSD Pascal、Microsoft Pascal）はマルチパスで設計されており、各フェーズの中間結果をディスクに書いてから次のフェーズを実行していた。CP/M フロッピーディスクの時代、ディスクアクセスは致命的に遅かった。

Turbo Pascal のコンパイル速度の計測値：
- **UCSD Pascal**: 約 100〜200 行/分
- **Turbo Pascal 1.0**: 約 **6,000〜12,000 行/分**

60倍速い。「Turbo」の名は伊達ではなかった。

### 痕跡2：再帰下降パーサー——Pascal が Pascal を読む構造

```pascal
{ Turbo Pascal パーサーの概念的構造 }

procedure ParseStatement;
begin
  if Token = IF then
    ParseIfStatement
  else if Token = WHILE then
    ParseWhileStatement
  else if Token = BEGIN then
    ParseBlock
  else
    ParseExpression;
end;

procedure ParseIfStatement;
begin
  Expect(IF);
  ParseExpression;   { 条件式を解析しながら比較コードを出力 }
  Expect(THEN);
  EmitJumpIfFalse(patchAddr);  { ジャンプ先は後で埋める }
  ParseStatement;              { THEN節 }
  if Token = ELSE then
  begin
    EmitJump(endAddr);
    PatchJump(patchAddr);      { 先ほどのジャンプ先をここに確定 }
    ParseStatement;
  end;
  PatchJump(endAddr);
end;
```

Pascal という言語自体が「使用前に定義」を強制する構造になっている。変数も関数も、使う前に宣言しなければならない。これがシングルパスを可能にした。**言語仕様がコンパイラの設計を決めていた。**

### 痕跡3：64KBの中の IDE——エディタ+コンパイラ+リンカを全部詰め込む

```
Turbo Pascal 1.0 のメモリマップ（64KB CP/M 環境）:

+------------------+ 0000h
|  CP/M BIOS/BDOS  |
+------------------+ 0100h  ← プログラムロード開始
|  TPC.COM本体     |
|  - テキストエディタ|
|  - コンパイラ     |
|  - リンカ        |
|  - ランタイム    |
+------------------+ 〜B000h
|  ユーザーソースコード|
|  （最大64KB）    |
+------------------+ FFFFh
```

競合製品はエディタが別ファイル、コンパイラが別ファイル、リンカが別ファイルだった。Turbo Pascal は **全部が .COM ファイル1本** に収まっていた。

合計サイズ：**約32KB**（バージョンによって異なる）。

32KBの中にエディタ、コンパイラ、リンカ、ランタイムライブラリが同居していた。当時のフロッピー1枚（180KB）に余裕で収まった。

### 痕跡4：INLINE命令——コンパイラにアセンブリを埋め込む

```pascal
{ Turbo Pascal 3.0 のインラインアセンブリ }

procedure SetVideoMode(mode: byte);
begin
  INLINE(
    $B4/$00 /      { MOV AH, 00h   }
    $8A/$46/$04 /  { MOV AL, [BP+4] (mode パラメータ) }
    $CD/$10        { INT 10h  (BIOS ビデオ割り込み) }
  );
end;

{ Turbo Pascal 6.0 以降のASMブロック }
procedure FastMemCopy(src, dst: Pointer; count: Word);
begin
  asm
    push  ds
    lds   si, src
    les   di, dst
    mov   cx, count
    rep   movsb
    pop   ds
  end;
end;
```

Pascal は「安全な言語」として設計されていたが、Borland はインラインアセンブリ機能を追加した。`INLINE` 命令で機械語バイトを直接埋め込めるようにしたのがバージョン3.0（1985年）。バージョン6.0（1990年）で `asm...end` ブロックが追加された。

**「Pascal の安全性とアセンブリの速度を一本で。」** Turbo Pascal がシステムプログラミングにも使われた理由がここにある。

### 痕跡5：$49.95 と IBM の「最低価格の壁」

```
当時のプログラミング環境の価格比較（1983年）:

  Microsoft Pascal     : $495
  IBM Pascal           : $338
  UCSD Pascal          : $495
  Lattice C            : $500
  ─────────────────────────────
  Turbo Pascal 1.0     : $ 49.95  ← ???

IBM の販売価格ポリシー: 「$200以下の製品は我々のチャンネルでは扱えない」
IBM への Kahn の回答: ────────────────── （なし）
```

IBM はBorlandに販売拒否を通告した。ソフトウェアは「200ドル以上でなければプロフェッショナル向けとはみなせない」という、1983年当時のソフトウェア流通の常識だった。

Kahn は無視した。

郵便注文（Mail Order）とデパートのソフトウェアコーナーに直接売り込んだ。Byte Magazine に全面広告を打ち、注文が来たらその収益で製造した。

リリースから4ヶ月で**15,000本以上**を販売。6ヶ月で500,000ドルを超えた。IBMが「扱えない」と言った商品が、IBM PC最速で売れるソフトウェアになった。

### 痕跡6：PolyPascal → Delphi → C# → TypeScript——一本の線

```
Anders Hejlsberg の系譜:

1979年 Nascom 2 向け Pascal     (Hejlsbergが高校生で作成)
1981年 CP/M向け "PolyPascal"    (Z80 Assembly, 学生時代)
       ↓ Borlandがライセンス取得
1983年 Turbo Pascal 1.0          (IBM PC 8086向け移植)
1985年 Turbo Pascal 3.0          (インラインASM追加)
1987年 Turbo Pascal 4.0          (Unit システム、.EXE対応)
       ↓ BorlandがHejlsbergを正式採用 (1989年)
1990年 Turbo Pascal 6.0          (オブジェクト指向、asm構文)
1995年 Delphi 1.0                (Windows GUI、VCL設計)
       ↓ MicrosoftがHejlsbergを引き抜く (1996年)
2001年 C# 1.0                    (Java対抗、Delphiの思想継承)
2012年 TypeScript 0.8            (JavaScriptへの型、今もCore Developer)
```

Hejlsberg が19歳のときに書いた Z80 アセンブリコンパイラが、40年後も彼の手によって進化し続けている。

Delphi で設計した「プロパティ（property）」「デリゲート（delegate）」「コンポーネントベース開発」は、C# に直接継承された。TypeScript の「段階的型付け（Gradual Typing）」の設計思想も、Turbo Pascal の「型安全を保ちながら脱出口（INLINE）を用意する」精神と同じ系譜にある。

**Turbo Pascal を買った人は知らないまま、C# を設計した人と同じコンパイラを使っていた。**

---

## 年表

**1979〜1981年**: コペンハーゲンのAnders Hejlsberg、Nascom 2向けPascalコンパイラを自作。Z80アセンブリで書かれた「PolyPascal」が完成。

**1982年**: Philippe Kahn、フランスから観光ビザで渡米。資金200ドルでBorland International を設立（カリフォルニア州 Scott's Valley）。Hejlsberg の PolyPascal をライセンス取得。

**1983年11月20日**: Turbo Pascal 1.0（CP/M版）リリース。$49.95。

**1983年11月末**: COMDEX（ラスベガス）。Kahn がブース代なしで参加、テーブルの端を交渉で確保。初日に150本以上の注文。

**1984年**: リリース4ヶ月で15,000本突破。IBM PC版リリース。Byte Magazine が「Best Software Product of 1984」を授与。

**1985年**: Turbo Pascal 3.0。インラインアセンブリ（INLINE命令）追加。CP/M版最終バージョン。

**1987年**: Turbo Pascal 4.0。Unitシステム（モジュール化）、.EXEファイル生成対応。IDE の「現代的」デザインへ。

**1989年**: Hejlsberg、Borland に正式入社。Turbo Pascal の全バージョンに関与。

**1990年**: Turbo Pascal 6.0。オブジェクト指向、`asm...end` ブロック追加。

**1995年**: Borland Delphi 1.0。Windows GUIアプリ開発。Hejlsberg が Visual Component Library を設計。

**1996年**: MicrosoftがHejlsbergを引き抜く（年俸不明、業界最高水準と報じられる）。

**2001年**: C# 1.0。Hejlsberg が Lead Architect。Delphiの思想（プロパティ、デリゲート）を継承。

**2012年**: TypeScript 0.8 公開。Hejlsberg が Core Developer として現在も開発継続中。

---

## AI 解析データ

| 指標 | 値 |
|:---|---:|
| 実装言語 | Z80 Assembly（PolyPascal）→ 8086 Assembly（Turbo Pascal） |
| コンパイラサイズ | 約32KB（エディタ+コンパイラ+リンカ込み） |
| コンパイル速度 | 約6,000〜12,000行/分（競合の60倍） |
| 価格 | $49.95（競合の1/10） |
| 主要開発者 | Anders Hejlsberg（コンパイラ）+ Philippe Kahn（ビジネス） |
| リリース日 | 1983年11月20日 |
| 初期販売 | 4ヶ月で15,000本以上 |
| 系譜 | Turbo Pascal → Delphi → C# → TypeScript |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.055
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Turbo Pascal 1.0 (1983, Z80→8086 Assembly)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年4月

■ 鑑定結果
  希少度:          ★★★★☆
  技術的負債密度:    ★★☆☆☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★☆

ソースコードは非公開。しかしリバースエンジニアリング分析が複数存在し、動作原理は詳細に記録されている。「IDE」という概念の最初の実装として最高の考古学的価値を持ちながら、完全なオリジナルソースへのアクセスは現状困難。

### 技術的負債密度: ★★☆☆☆

シングルパスの設計は「最適化パス」の欠如を意味し、後の Pascal コンパイラと比べると生成コードの品質は低い。しかし速度と小ささを目標とした設計としては **完璧に意図通り**。負債というより「意図的なトレードオフ」。

### 考古学的価値: ★★★★★

**現代の IDE の原型。** エディタ+コンパイラ+リンカを一体化した設計は、Visual Studio から VS Code まで全ての統合開発環境の先祖。C# と TypeScript の設計者が書いたコンパイラとして、今日書かれているコードの直接の祖先でもある。

### 読み物としての面白さ: ★★★★★

観光ビザのフランス人とデンマークの学生。$49.95 という価格への IBM の拒絶。COMDEX のテーブルの端で始まった注文。そして Hejlsberg が40年かけて同じ思想を C# と TypeScript に引き継いだ——全てのピースが劇的だ。

---

## 鑑定人所見

Turbo Pascal は「稲妻」だ。

1983年の冬、稲妻のように来た。競合が数秒かけてディスクを読み書きしていた間、Turbo Pascal は読んだ瞬間に機械語を吐き出した。$49.95 という価格が「ソフトウェアは高くなければならない」という常識を焼き払った。

Kahn は観光ビザの身で COMDEX のテーブルの端に立ち、Hejlsberg はコペンハーゲンで Z80 アセンブリのコンパイラを書いた。二人が出会ったとき、IDE という概念が生まれた——エディタとコンパイラとリンカを「ツール」ではなく「一つの思考空間」として使う体験が。

40年後、Hejlsberg は TypeScript のコードを書いている。C# の `property` キーワードは、Turbo Pascal の `UNIT` 設計から来ている。VS Code の体験は、32KB の TPC.COM が始めた「全部メモリに入れる」思想の延長にある。

**稲妻は一瞬で消えるが、その後の空気は変わっている。**

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
