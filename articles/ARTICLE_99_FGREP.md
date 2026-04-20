# `c->fail`——`goto nstate`と`goto istate`が走り続ける、Alfred AhoのAho-Corasick自動機械と349行のfgrep

**Bell Labs, 1979年。C言語で書かれた複数パターン同時検索。**

---

## はじめに

`grep` は1つのパターンを検索する。100個のキーワードを検索したければ、`grep` を100回呼ぶか、長大な正規表現を書くしかない——1975年まで、そう思われていた。

Alfred AhoとMargaret Corasickは、複数のパターンをまとめて一度のスキャンで検索するアルゴリズムを論文として発表した。その名前は「Aho-Corasick法」。実装したのはAlfred Aho自身だ。`fgrep.c`の349行がそれだ。

---

## 作者——Alfred Aho

**Alfred Aho**——AWK（#063）の「A」。正規表現、コンパイラ理論、文字列アルゴリズムを生涯の仕事とした計算機科学者だ。

AWKを書いた3人のうちの1人が、同じBell Labsで複数パターン検索の問題を解き、その実装を`fgrep`として届けた。

---

## `struct words`——オートマトンのノード

```c
#define MAXSIZ 6000
struct words {
    char  inp;
    char  out;
    struct words *nst;
    struct words *link;
    struct words *fail;
} w[MAXSIZ], *smax, *q;
```

5フィールド。これがAho-Corasickオートマトンの1ノードだ：

- `inp` — このノードが受け付ける文字
- `out` — 1ならマッチ完了（パターンの末尾ノード）
- `nst` — 次の状態（子ノード、`inp`の文字で遷移した先）
- `link` — 兄弟ノード（同じ親から別の文字への枝）
- `fail` — 失敗リンク（遷移できないとき戻る先）

配列`w[MAXSIZ]`に6000ノードを確保する。動的メモリアロケーションなし。`smax`がスタックポインタのように次の空きノードを指す。

---

## `cgotofn()`——パターンをトライ木に登録

```c
cgotofn() {
    register c;
    register struct words *s;
    s = smax = w;
nword:
    for(;;) {
        c = getargc();
        if (c == '\n') {
            s->out = 1;
            s = w;
        } else {
        loop:
            if (s->inp == c) { s = s->nst; continue; }
            if (s->inp == 0) goto enter;
            if (s->link == 0) {
                s->link = ++smax;
                s = smax;
                goto enter;
            }
            s = s->link;
            goto loop;
        }
    }
enter:
    do {
        s->inp = c;
        s->nst = ++smax;
        s = smax;
    } while ((c = getargc()) != '\n' && c != EOF);
    smax->out = 1;
    s = w;
}
```

1文字ずつ読んで既存パスを辿る。パスが存在すれば`nst`（子）をたどる。存在しなければ`link`（兄弟）をたどる。兄弟もなければ新ノードを`enter`で作る。`'\n'`でパターン終端——そのノードに`out=1`を立てる。

複数のパターン（例：`fox\ncat\ndog`）をこのループで順に登録すると、共通プレフィックスを共有するトライ木が完成する。

---

## `cfail()`——幅優先探索で失敗リンクを計算

```c
cfail() {
    struct words *queue[QSIZE];
    struct words **front, **rear;
    ...
    while (rear != front) {
        s = *front++;
    cloop:
        if ((c = s->inp) != 0) {
            *rear++ = (q = s->nst);   /* 子をキューに追加 */
            state = s->fail;
        floop:
            if (state == 0) state = w;
            if (state->inp == c) {
                q->fail = state->nst;
                if ((state->nst)->out == 1) q->out = 1;
                continue;
            }
            else if ((state = state->link) != 0)
                goto floop;
        }
        if ((s = s->link) != 0)
            goto cloop;
    }
}
```

幅優先探索で全ノードを訪問し、各ノードの`fail`リンクを設定する。

`fail`リンクは「このパターンでマッチできないとき、どこへ戻れば効率よく続けられるか」を指す。KMPアルゴリズムの失敗関数を複数パターンに拡張したものだ。

`if ((state->nst)->out == 1) q->out = 1;` ——親のfail先がマッチ状態なら、自分もマッチ状態に継承する。これで「パターンAがパターンBの接尾辞」という場合も漏れなく検出できる。

---

## `execute()`——`goto nstate`と`goto istate`が走る

マッチングの核心：

```c
c = w;    /* 初期状態 */
for (;;) {
    /* バッファ読み込み ... */
nstate:
    if (c->inp == *p) {
        c = c->nst;
    }
    else if (c->link != 0) {
        c = c->link;
        goto nstate;
    }
    else {
        c = c->fail;
        if (c == 0) {
            c = w;
        istate:
            if (c->inp == *p) { c = c->nst; }
            else if (c->link != 0) { c = c->link; goto istate; }
        }
        else goto nstate;
    }
    if (c->out) {
        /* マッチ → 行を出力 */
    }
    if (*p++ == '\n') { lnum++; c = w; }
}
```

`nstate` と `istate` の2つのラベルが1文字ずつ消費しながら状態を進める。

- **`nstate`**: 現在の状態`c`で文字`*p`を試みる。`inp`が一致すれば`nst`（子）へ。`link`（兄弟）があれば兄弟を試す。どれも合わなければ`fail`リンクをたどって`nstate`に戻る
- **`istate`**: `fail`が`NULL`（ルートに戻った）ときの初期状態マッチ

`goto`を使うのは関数呼び出しコストの削減だ。1文字あたりの処理がループ1回に収まる。

---

## バッファ管理——1KBの折り返しリングバッファ

```c
char buf[1024];
...
if (p == &buf[1024]) p = buf;
if (p > &buf[512]) {
    if ((ccount = read(f, p, &buf[1024] - p)) <= 0) break;
}
else if ((ccount = read(f, p, 512)) <= 0) break;
```

512バイト単位で読み込み、`buf[1024]`の末尾に達したら先頭へ折り返す。マッチした行を出力するとき、`nlp`（行頭ポインタ）から`p`（現在位置）まで出力するが、折り返しを跨ぐ場合は2回に分けて出力する：

```c
if (p <= nlp) {
    while (nlp < &buf[1024]) putchar(*nlp++);
    nlp = buf;
}
while (nlp < p) putchar(*nlp++);
```

`malloc`なし、`realloc`なし。固定1KBバッファで任意長の行を扱う。

---

## `getargc()`——パターンの2つの入力源

```c
getargc() {
    register c;
    if (wordf)
        return(getc(wordf));
    if ((c = *argptr++) == '\0')
        return(EOF);
    return(c);
}
```

`-f patterns.txt` なら `wordf` からファイル読み込み、なければ `argptr`（コマンドライン文字列）から1文字ずつ返す。`cgotofn()` はこの関数だけを使うので、入力源を意識しない。

---

## MAXSIZ=6000、QSIZE=400

```c
#define MAXSIZ 6000
#define QSIZE 400
```

MAXSIZ=6000は全パターンの全文字数の合計の上限——6000文字分のパターンが登録できる。QSIZE=400は`cfail()`のBFSキューの深さ。超えると`overflo()`でexit(2)。

```c
overflo() {
    fprintf(stderr, "wordlist too large\n");
    exit(2);
}
```

エラーメッセージは5単語。1979年のエラー処理はこれで十分だった。

---

## 論文との関係

Aho-Corasickアルゴリズムの原論文は1975年：

> Alfred V. Aho and Margaret J. Corasick,  
> "Efficient string matching: An aid to bibliographic search,"  
> *Communications of the ACM*, 18(6):333–340, June 1975.

参考文献管理システム`refer`（#086）で使われる`hunt`の「false drops」（ハッシュ衝突後の再検査）と同じ著者環境から生まれた。`refer`がBell Labs論文データベースを検索するのに、`fgrep`のAho-Corasickが使われた可能性がある。

---

## 鑑定

```
初版       : 1975年論文 → Bell-32V実装（1979年、Alfred Aho）
行数       : 349行
オートマトン: struct words {inp, out, nst, link, fail}
フェーズ1  : cgotofn()——パターンをトライ木に登録
フェーズ2  : cfail()——幅優先探索で失敗リンクを計算
フェーズ3  : execute()——goto nstate / goto istate で1文字ずつ消費
バッファ   : char buf[1024]、512バイト単位のリング折り返し
上限       : MAXSIZ=6000ノード、QSIZE=400（BFSキュー）
計算量     : 前処理O(m)、検索O(n)——テキスト長nに対して線形
後継       : GNU grep -F、Snort（侵入検知）、ウイルス定義ファイル検索
```

**`c->fail`——失敗するたびにfailリンクをたどり、`goto nstate`と`goto istate`が1文字も無駄にせずテキストを走査する。Alfred Ahoが自分の論文を自分でCに落とした349行は、ウイルス検知エンジンの祖先でもある。**
