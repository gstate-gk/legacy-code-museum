# edの子、grepの兄弟——sed、holdspaceで記憶を持った1974年のストリームエディタ

## はじめに

`grep` はstatelessだ。1行読んで、マッチすれば出力する。前の行を覚えない。後の行を見ない。

`ed` はstatefulだが、インタラクティブだ。端末の前に人間がいる前提で設計されている。

1974年、Lee McMahon（Bell Labs）はその中間を埋めた。スクリプトで動き、状態を持ち、ストリームを流れる——`sed`。

`dspinellis/unix-history-repo` の Bell-32V ブランチに `usr/src/cmd/sed/` がある。`sed.h`（2347バイト）、`sed0.c`（15104バイト）、`sed1.c`（9469バイト）。1975年の著作権表示。`Owner: lem`。

---

## 発掘されたコード

- **リポジトリ**: [dspinellis/unix-history-repo](https://github.com/dspinellis/unix-history-repo)（Bell-32V-Snapshot-Development ブランチ）
- **スター数**: 7,215
- **実装言語**: C
- **設計者**: Lee E. McMahon（Bell Telephone Laboratories）
- **初版**: 1974年（1975年著作権表示）

```
sed/ — 4ファイル
  sed.h   ( ~110行) — オペコード定義、グローバル変数、union reptr定義
  sed0.c  ( ~500行) — コンパイラ：スクリプトをptrspace[]に変換
  sed1.c  ( ~370行) — エグゼキュータ：各行にコマンドを適用
  Makefile
```

---

## 同じDNA——edからコピーされた正規表現エンジン

`sed.h` の冒頭を見た瞬間、既視感がある。

```c
#define CBRA	1
#define	CCHR	2
#define	CDOT	4
#define	CCL	6
#define	CEOF	11
#define	STAR	01
```

`ed.c`（1969年、Ken Thompson）と完全に同じ数値だ。`grep.c`（1973年）とも同じ。sed はこの正規表現エンジンを ed から引き継いだ。`advance()` 関数の実装も `goto star` パターンも、ed の遺伝子がそのまま入っている。

```c
case CCL:
    c = *lp++ & 0177;
    if(ep[c>>3] & bittab[c & 07]) {   /* 16バイトビットマップ */
        ep += 16;
        continue;
    }
    return(0);
```

`ep[c>>3] & bittab[c & 07]`——8要素の `bittab[]` でビット位置を引く。ed の文字クラス実装がそのままsedに入っている。1969年に書かれたコードが1974年のsedに生きている。

---

## holdsp——記憶を持ったバッファ

sed が grep と本質的に違う理由はここにある。

```c
char	linebuf[LBSIZE+1];   /* パターンスペース：現在行 */
char	holdsp[LBSIZE+1];    /* ホールドスペース：補助記憶 */
```

`linebuf` は現在処理中の行。`holdsp` は任意の内容を保持できる補助バッファだ。

コマンド `h`/`H` でパターンスペースをホールドスペースへ、`g`/`G` でその逆。`x` で交換する。

```c
case XCOM:
    p1 = linebuf;
    p2 = genbuf;
    while(*p2++ = *p1++);          /* linebuf → genbuf（一時） */
    p1 = holdsp;
    p2 = linebuf;
    while(*p2++ = *p1++);          /* holdsp → linebuf */
    spend = p2 - 1;
    p1 = genbuf;
    p2 = holdsp;
    while(*p2++ = *p1++);          /* genbuf → holdsp */
    hspend = p2 - 1;
    break;
```

`x` コマンドが2つのバッファを交換する。前の行の内容を保持したまま次の行を処理できる。grep には絶対にできないことだ。

---

## ラベルと分岐——チューリング完全への道

`b` コマンドは無条件分岐。`t` コマンドは条件分岐——直前の `s` 置換が成功した場合のみ飛ぶ。

```c
case TCOM:
    if(sflag == 0)	break;    /* s成功フラグが立っていなければ何もしない */
    sflag = 0;
    jflag = 1;
    break;
```

`sflag` は直前の `s` コマンドが成功したとき（または新しい行の読み込み時）にリセットされる。「置換が成功したあいだループを続ける」——これが `t` の意味だ。

`holdsp` による状態保持 + `b`/`t` によるループ + 行の読み飛ばし（`n`/`N`）で、sedはチューリング完全になる。1974年に。

ラベル解決は `dechain()` が担当する。

```c
dechain()
{
    struct label	*lptr;
    union reptr	*rptr, *trptr;

    for(lptr = labtab; lptr < lab; lptr++) {
        if(lptr->address == 0) {
            fprintf(stderr, "Undefined label: %s\n", lptr->asc);
            exit(2);
        }
        if(lptr->chain) {
            rptr = lptr->chain;
            while(trptr = rptr->lb1)
                rptr->lb1 = lptr->address;
                rptr = trptr;
            }
            rptr->lb1 = lptr->address;
        }
    }
}
```

前方参照（`b label` がラベル定義より前にある場合）のリンクを、コンパイル後に遡って解決する。リンカの縮小版だ。

---

## ycomp——256バイトの変換テーブル

`y/abc/xyz/` コマンドは文字変換だ。`tr` と同じ発想。`ycomp()` の実装は鮮やかだ。

```c
char *ycomp(expbuf)
char	*expbuf;
{
    register char	c, *ep, *tsp;
    char	*sp;

    ep = expbuf;
    sp = cp;
    /* ...前半の文字列を解析... */
    while((c = *sp++ & 0177) != seof) {
        if(c == '\\' && *sp == 'n') { sp++; c = '\n'; }
        if((ep[c] = *tsp++) == '\\' && *tsp == 'n') {
            ep[c] = '\n';
            tsp++;
        }
        if(ep[c] == seof || ep[c] == '\0')
            return(badp);
    }
    /* 変換されない文字は自分自身にマップ */
    for(c = 0; !(c & 0200); c++)
        if(ep[c] == 0)
            ep[c] = c;

    return(ep + 0200);   /* 256バイトのテーブルを返す */
}
```

`ep[c] = *tsp++` ——入力文字 `c` を添字として、変換後の文字を格納する。実行時は `while(*p1 = p2[*p1]) p1++` の1行で変換が完了する。256バイトの配列が変換テーブルそのものだ。

---

## union reptr——コマンドを1つの構造体に

sedのコマンドはすべて `union reptr` に詰め込まれる。

```c
union	reptr {
    struct reptr1 {
        char	*ad1;      /* アドレス1（開始条件） */
        char	*ad2;      /* アドレス2（終了条件） */
        char	*re1;      /* 正規表現またはテキスト */
        char	*rhs;      /* 置換文字列 */
        FILE	*fcode;    /* ファイル出力先 */
        char	command;   /* コマンド種別 */
        char	gfl;       /* グローバルフラグ */
        char	pfl;       /* printフラグ */
        char	inar;      /* アドレス範囲内フラグ */
        char	negfl;     /* 否定フラグ */
    };
    struct reptr2 {
        char	*ad1;
        char	*ad2;
        union reptr	*lb1;  /* 分岐先ポインタ（b/tコマンド用） */
        /* ... */
    };
} ptrspace[PTRSIZE], *rep;
```

`union` の2つの `struct` は `lb1` フィールドの型だけが違う——`char*`（テキストポインタ）か `union reptr*`（分岐先ポインタ）か。これで同じメモリ上のコマンド列を、テキストコマンドとしても分岐コマンドとしても扱える。

すべての命令は `ptrspace[PTRSIZE]` に並ぶ。正規表現とテキストは `respace[RESIZE]` に詰まる。sed全体が2つの固定サイズ配列に収まる。

---

## 2段構造——コンパイラとエグゼキュータ

sed は2パスだ。

**sed0.c（コンパイラ）**：スクリプトをスキャンし、`ptrspace[]` に `reptr` を積む。正規表現は `compile()` で `respace[]` に変換する。ラベルは `dechain()` で解決する。

**sed1.c（エグゼキュータ）**：ファイルを1行ずつ読み（`gline()`）、`ptrspace[]` を先頭から走査し、アドレス条件を評価し、コマンドを実行する。

```c
for(ipc = ptrspace; ipc->command; ) {
    p1 = ipc->ad1;
    p2 = ipc->ad2;
    /* アドレス範囲チェック */
    if(p1) {
        if(ipc->inar) { /* 範囲内か確認 */ }
        else if(*p1 == CLNUM) {
            c = p1[1];
            if(lnum != tlno[c]) { ipc++; continue; }
        } else if(match(p1, 0)) {
            if(p2) ipc->inar = 1;   /* 範囲開始 */
        } else {
            ipc++; continue;
        }
    }
    if(ipc->negfl) { ipc++; continue; }
yes:
    command(ipc);
    /* ... */
}
```

`ipc->inar` フラグが「今、2アドレス範囲の中にいるか」を追跡する。`!` による否定も `negfl` 1ビットで表現する。

---

## 鑑定

```
ファイル     : usr/src/cmd/sed/sed0.c + sed1.c + sed.h（計 ~980行）
言語         : C
誕生         : 1974年（著作権1975年）、AT&T Bell Labs
設計者       : Lee E. McMahon（Owner: lem）
正規表現     : ed.c（1969年）から直接継承（CBRA=1, CCHR=2, CDOT=4, CCL=6, STAR=01）
状態管理     : holdsp[LBSIZE+1]——パターンスペースと独立した補助記憶
チューリング完全 : holdsp + b/t + n コマンドの組み合わせで実現
継承         : GNU sed（1989〜）、現代Linuxの全sed実装
```

`grep` は stateless。`ed` は interactive。`sed` はその中間を埋めた。

1974年に書かれた `advance()` 関数は1969年のedのコードを継承し、その子孫は今日のLinuxの `/bin/sed` に動いている。`grep -p` を名乗った1文字フィルタが、`holdsp` を手に入れてチューリング完全になった。

`echo "hello" | sed 's/hello/world/'` は今日も動く。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
