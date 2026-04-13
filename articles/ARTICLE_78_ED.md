# すべての正規表現は1969年から——ed、g/re/p、そして継承されたopcode

## はじめに

`grep` のopcodeを読んだとき、既視感があった。

`CBRA=1`、`CCHR=2`、`CDOT=4`、`CCL=6`、`STAR=01`。

`sed.h` を開いたときも同じだった。まったく同じ定数が並んでいた。

答えは `usr/src/cmd/ed.c` にあった。**1762行**。1969年、Ken Thompson。grep（1973年）より4年前。sed（1974年）より5年前。これがすべての起源だ。

---

## 発掘されたコード

- **リポジトリ**: [dspinellis/unix-history-repo](https://github.com/dspinellis/unix-history-repo)（Bell-32V-Snapshot-Development ブランチ）
- **スター数**: 7,215
- **実装言語**: C
- **設計者**: Ken Thompson（Bell Telephone Laboratories）
- **初版**: 1969年

```
ed.c — 単一ファイル、1762行

main()       # setjmp/longjmpで例外ループを確立
commands()   # コマンドディスパッチ（a/c/d/e/g/m/p/q/s/w/!...）
compile()    # 正規表現 → バイトコードに変換（opcodeの起源）
execute()    # パターンマッチング実行
advance()    # バイトコード実行エンジン（goto starパターン）
global()     # g/re/p の実体
getblock()   # 一時ファイルへのブロックI/O（ディスクベース行管理）
```

---

## g/re/pはこのファイルにある

grepの名前の由来は ed のコマンド `g/re/p` だ。これは比喩ではない——`global()` 関数が文字通りその処理を実装している。

```c
global(k)
{
    register char *gp;
    register c;
    register int *a1;
    char globuf[GBSIZE];

    if (globp) error(Q);
    setall();
    nonzero();
    if ((c=getchr())=='\n') error(Q);
    compile(c);          /* 正規表現をコンパイル */
    gp = globuf;
    while ((c = getchr()) != '\n') {  /* 実行するコマンドを読む */
        /* ... */
        *gp++ = c;
    }
    *gp++ = '\n';
    *gp++ = 0;
    for (a1=zero; a1<=dol; a1++) {
        *a1 &= ~01;
        if (a1>=addr1 && a1<=addr2 && execute(0, a1)==k)
            *a1 |= 01;     /* マッチした行にフラグを立てる */
    }
    /*
     * Special case: g/.../d (avoid n^2 algorithm)
     */
    if (globuf[0]=='d' && globuf[1]=='\n' && globuf[2]=='\0') {
        gdelete();
        return;
    }
    for (a1=zero; a1<=dol; a1++) {
        if (*a1 & 01) {
            *a1 &= ~01;
            dot = a1;
            globp = globuf;
            commands();    /* マッチした各行でコマンドを実行 */
            a1 = zero;
        }
    }
}
```

`g/.../p` と入力すると、まずすべての行を正規表現でスキャンしてフラグを立て、次にフラグの立った行に `p`（print）を実行する。これが `g/re/p` だ。

Doug McIlroyは1973年、Thompsonに「これをスタンドアロンのコマンドにしてほしい」と頼んだ。Thompsonはedの正規表現エンジンを取り出してラップした。コマンド名はそのまま——`grep`。

コメントの中の `/* Special case: g/.../d (avoid n^2 algorithm) */` ——最も一般的な使い方（`g/pattern/d` で行削除）をインライン最適化している。1969年のプロファイリング結果がコードに残っている。

---

## STAR=01——三世代に渡ったopcode

`ed.c` の冒頭に定義がある。

```c
#define CBRA    1   /* \( — キャプチャグループ開始 */
#define CCHR    2   /* 文字リテラル */
#define CDOT    4   /* . — 任意1文字 */
#define CCL     6   /* [...] — 文字クラス */
#define NCCL    8   /* [^...] — 否定文字クラス */
#define CDOL   10   /* $ — 行末 */
#define CEOF   11   /* パターン終端 */
#define CKET   12   /* \) — キャプチャグループ終端 */
#define CBACK  14   /* \1〜\9 — 後方参照 */

#define STAR   01   /* 直前のopcodeにORして「0回以上」 */
```

この `STAR=01`（8進数の1）を他のopcodeにORするトリック——`CCHR|STAR=3`、`CDOT|STAR=5`——は1969年にedで生まれた。

4年後、GrepはこのopcodeをCBRA/CCHR/CDOT/CCL/CEOF/CBACK/STARすべてそのまま引き継いだ。翌年sedも同じ定数を引き継いだ（`sed.h`の`Owner: lem`=Lee McMahon）。

`compile()` の中の `*lastep |= STAR` が起源だ。

```c
case '*':
    if (lastep==0 || *lastep==CBRA || *lastep==CKET)
        goto defchar;
    *lastep |= STAR;    /* 直前のopcodeにSTARビットをOR */
    continue;
```

三世代にわたって同じ1行が生きている。

---

## advance()——goto starの起源

`advance()` のSTARケースは `goto star` で共通処理に合流する。greaterコード（1973）で見たパターンだ。しかし起源はここ、1969年のedにある。

```c
case CDOT|STAR:
    curlp = lp;
    while (*lp++)
        ;
    goto star;

case CCHR|STAR:
    curlp = lp;
    while (*lp++ == *ep)
        ;
    ep++;
    goto star;

case CCL|STAR:
case NCCL|STAR:
    curlp = lp;
    while (cclass(ep, *lp++, ep[-1]==(CCL|STAR)))
        ;
    ep += *ep;
    goto star;

star:
    do {
        lp--;
        if (lp==locs) break;
        if (advance(lp, ep))
            return(1);
    } while (lp > curlp);
    return(0);
```

grepの `goto star` と見比べると、ほぼ同一だ。Thompson自身がgrepを書いたとき、edのコードを参照したのではなく、**自分が4年前に書いたコードをそのまま引き継いだ**。

文字クラスの表現はedとgrepで異なる。edは**カウントベース**（`[CCL][n][char1][char2]...`）、grepは**16バイトビットマップ**に進化した。これがgrepの唯一の重要な改善だ。

```c
/* edの文字クラスチェック（カウントベース） */
cclass(set, c, af)
register char *set, c;
{
    register n;
    n = *set++;       /* 最初のバイトは要素数 */
    while (--n)
        if (*set++ == c)
            return(af);   /* 線形探索 */
    return(!af);
}
```

grepのビットマップは1命令でO(1)。edの線形探索は文字クラスのサイズに比例する。

---

## char Q[] = ""——?の謎が解けた

edを使ったことがある人は知っている。エラーが起きると ed は `?` とだけ答える。なぜか。

```c
char Q[] = "";   /* 空文字列 */

error(s)
char *s;
{
    register c;

    wrapp = 0;
    listf = 0;
    putchr('?');      /* まず ? を出力 */
    puts(s);          /* 次にエラーメッセージ */
    count = 0;
    /* ... */
    longjmp(savej, 1);  /* mainのsetjmpに戻る */
}
```

`error(Q)` は `?` を出力し、次に空文字列 `""` を出力する。結果は `?` だけ。

1969年の設計哲学だ——エラーの詳細を教えない。ユーザーは何が間違っているかを自分で考えろ。`Q` という変数名が空文字列であることも、その哲学を体現している。

`error(Q)` はソース中に60回以上現れる。すべてのエラーケースが同じ1文字の応答に集約される。

---

## setjmp/longjmpによる例外処理——1969年

`main()` の構造が興味深い。

```c
jmp_buf savej;

main(argc, argv)
char **argv;
{
    /* ... シグナル設定、初期化 ... */
    setjmp(savej);    /* ここに飛び戻るポイントを設定 */
    commands();       /* コマンドループを開始 */
    quit();
}

error(s)
char *s;
{
    /* ... エラー処理 ... */
    longjmp(savej, 1);    /* mainのsetjmpに戻る */
}
```

どのコールスタックの深みからでも `error()` を呼べば、`longjmp` で `main()` のコマンドループに戻ってくる。今日の言語で言えば例外処理だ——1969年にsetjmp/longjmpで実現されていた。

---

## onhup()——ed.hupへの救済

SIGHUP（端末切断）を受けると、edは編集中のバッファを `ed.hup` として保存する。

```c
onhup()
{
    signal(SIGINT, SIG_IGN);
    signal(SIGHUP, SIG_IGN);
    if (dol > zero) {
        addr1 = zero+1;
        addr2 = dol;
        io = creat("ed.hup", 0666);
        if (io > 0)
            putfile();
    }
    fchange = 0;
    quit();
}
```

回線が切断されても作業を失わないための安全網。1969年のネットワーク環境では、端末が突然切断されることは珍しくなかった。

---

## 鑑定

```
ファイル     : usr/src/cmd/ed.c（単一ファイル、1762行）
言語         : C
誕生         : 1969年、AT&T Bell Labs
設計者       : Ken Thompson
opcode       : CBRA/CCHR/CDOT/CCL/NCCL/CDOL/CEOF/CKET/CBACK/STAR=01
継承         : grep（1973）、sed（1974）——同一opcode定義
影響         : すべてのPOSIX正規表現、PCRE、Python re、Ruby Regexp
```

`g/re/p` はedのコマンドだった。その概念がgrep（1973）になった。そのopcodeがsed（1974）に引き継がれた。`STAR=01`という1ビットのトリックが三世代にわたって生きている。

`char Q[] = ""` ——空文字列に `Q` という名前をつけ、エラー時に `?` だけを返す。edの哲学がこの1行に凝縮されている。

1969年にThompsonが書いたこのエンジンの子孫が、今日のすべての正規表現ライブラリの中に生きている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
