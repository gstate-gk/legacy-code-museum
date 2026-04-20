# `fold[128+']']`——256要素の変換テーブル4枚、MEM=32768バイトのメモリソートとN=7本のN-wayマージが作る902行のsort

**Bell Labs, 1979年。C言語で書かれたUnix sort。**

---

## はじめに

Unix `sort` の本体、`sort.c` は902行だ。

`-f`（大文字小文字無視）、`-d`（辞書順）、`-n`（数値ソート）、`-r`（逆順）、`-k`（キーフィールド指定）——現代でも使う全オプションが1979年に完成していた。実装の核心は4枚の256要素テーブルと、メモリが足りなくなったら自動でテンポラリファイルに切り替える戦略だ。

---

## 256要素テーブル——O(1)の文字変換

ファイルの先頭近くに4つのテーブルが並ぶ：

```c
char fold[256], nofold[256];
char nonprint[256], dict[256];
```

初期化は `tables()` が行う：

```c
for (i=0; i<256; i++) {
    fold[i] = isupper(i) ? tolower(i) : i;
    nofold[i] = i;
    nonprint[i] = isprint(i) ? i : 0;
    dict[i] = (isalpha(i) || isdigit(i) || i == ' ') ? i : 0;
}
```

- `fold[]` — `-f` フラグ用。大文字を小文字に変換する写像
- `nofold[]` — `-f` なし用。恒等写像（`nofold[i] == i`）
- `nonprint[]` — `-i` フラグ用。印字不可文字を 0 に潰す
- `dict[]` — `-d` フラグ用。文字・数字・スペース以外を 0 に潰す

比較関数 `cmp()` はこのテーブルをポインタとして受け取る：

```c
int cmp(pa, pb)
register struct field *pa, *pb;
{
    ...
    r = cmpc(ap, aend, bp, bend, pa->code, pa->ignore);
    ...
}
```

`pa->code` と `pa->ignore` がテーブルへのポインタだ。`-f -d` を組み合わせると `code=fold[]` かつ `ignore=dict[]` が選ばれ、比較ループは1文字ずつ2回テーブルを引くだけになる。分岐なし、O(1)。

---

## `struct field`——フィールド記述子

ソートキーの定義は：

```c
struct field {
    char *code;
    char *ignore;
    int nflg;
    int rflg;
    int bflg[2];
    int m[2];
    int n[2];
} fields[10];
```

- `code` — 変換テーブル（`fold` or `nofold`）へのポインタ
- `ignore` — マスクテーブル（`nonprint`, `dict`, `nofold`）へのポインタ
- `nflg` — `-n`（数値比較）フラグ
- `rflg` — `-r`（逆順）フラグ
- `bflg[2]` — `-b`（先頭・末尾の空白無視）フラグ（開始側/終了側）
- `m[2]` — フィールド番号（`-k m.n`）
- `n[2]` — フィールド内オフセット

最大10フィールド。`-k 2,3 -k 5` のような複合キー指定を配列で管理する。

---

## MEM=32768——メモリが足りなければファイルへ

```c
#define MEM (16*2048)
```

32768バイト。`sort()` 関数がテキスト行を読み込む：

```c
char *lspace;
char *cp, *ep;
...
lspace = malloc(MEM);
ep = lspace + MEM;
```

行ポインタと行データを同じバッファに詰め込む：

```c
while ((n=getline(s, sptr)) != EOF) {
    if (cp + n >= ep) {
        /* メモリが足りない → ここまでをソートしてテンポラリファイルへ */
        qsort(brk, (int)(lp-brk), sizeof(*lp), compare);
        ...
        setfil(nfiles++);
        ...
        cp = lspace;
        lp = brk;
    }
    ...
}
```

バッファが満杯になるたびに `qsort()` でソートし、テンポラリファイルに書き出す。全行を読み終えたら `merge()` で全ファイルを1つにまとめる。

---

## `setfil()`——テンポラリファイルの命名

```c
char filep[2] = {'a', 'a'};

char *setfil(n)
{
    ...
    sprintf(file, "%s/stm%05d%c%c", dirtry[0], getpid(), filep[0], filep[1]);
    if (++filep[1] > 'z') {
        filep[1] = 'a';
        filep[0]++;
    }
    ...
}
```

テンポラリファイルは `stm12345aa`、`stm12345ab`、……`stm12345az`、`stm12345ba`……という名前になる。PIDを含むので複数の `sort` プロセスが同時に走っても衝突しない。

検索ディレクトリはリストで管理：

```c
char *dirtry[] = {"/usr/tmp", "/tmp", 0};
```

`/usr/tmp` がなければ `/tmp` を試す。`getenv("TMPDIR")` は1979年にはまだない。

---

## `qsort()`——自作のクイックソート

標準ライブラリの `qsort()` ではなく、自前の実装が入っている：

```c
static qsort(a, n, es, qcmp)
char *a;
int n, es;
int (*qcmp)();
{
    register char *i, *j;
    register int m;
    ...
}
```

`qsexc` と `qstexc` という2つのマクロで要素を交換する：

```c
#define qsexc(p,q) t= *p; *p= *q; *q=t
#define qstexc(p,q,r) t= *p; *p= *r; *r= *q; *q=t
```

`qsexc` は2要素の単純交換、`qstexc` は3要素の循環シフト（3-way partition）。教科書的なクイックソートをマクロで高速化している。

---

## `merge()`——N=7のN-wayマージ

```c
#define N 7

merge(nf1, nf2, outf)
int nf1, nf2;
FILE *outf;
{
    ...
    for (n = nf1; n < nf2 && n < nf1+N; n++) {
        iop[n-nf1] = fopen(filnames[n], "r");
    }
    ...
}
```

テンポラリファイルが7本以上できた場合は、7本ずつN-wayマージして中間ファイルを作り、また7本ずつマージする。最終的に1ファイルになるまで繰り返す。

N=7は経験則だ。ファイルディスクリプタの上限と、マージの効率（Nが大きいほどパス数が減るが、比較コストが増える）のバランス点として選ばれた。

---

## `cmp()` と `cmpa()`——2段階の比較

フィールド指定がある場合は `cmp()` が呼ばれる：

```c
compare(p1, p2)
char **p1, **p2;
{
    ...
    for (i=0; i < nfields && (r=cmp(*p1, *p2, &fields[i]))==0; i++)
        ;
    if (r == 0)
        r = cmpa(*p1, *p2);
    ...
}
```

全フィールドが等しいとき、最後に `cmpa()` が差をつける——生のバイト列比較だ：

```c
cmpa(pa, pb)
register char *pa, *pb;
{
    while (*pa == *pb) {
        if (*pa == '\n') return(0);
        pa++; pb++;
    }
    return(*pa - *pb);
}
```

`cmpa()` は速い。テーブル引きも分岐もない。全要素の安定比較のために最後に呼ばれる「最終審判」だ。

---

## `skip()`——フィールド境界の計算

```c
skip(p, fp, which)
char *p;
register struct field *fp;
int which;
```

`-k m.n` で指定されたフィールドの開始・終了ポインタを返す。区切り文字が設定されている場合（`-t`）は指定文字で分割、なければ空白（ホワイトスペース）の連続を区切りとする：

```c
if (tabchar == 0) {
    /* whitespace delimiter */
    while (p < ep && isspace(*p)) p++;
    while (m-- > 0) {
        while (p < ep && !isspace(*p)) p++;
        while (p < ep && isspace(*p)) p++;
    }
} else {
    /* explicit tab character */
    while (m-- > 0) {
        while (p < ep && *p != tabchar) p++;
        if (p < ep) p++;
    }
}
```

`-t:` でコロン区切りを指定できる。`/etc/passwd` のソートはこれで行う。

---

## 数値ソート——`-n` の実装

数値比較は `cmp()` の中で直接処理する：

```c
if (fp->nflg) {
    int na, nb;
    na = atoi(a);
    nb = atoi(b);
    if (na != nb) return(na > nb ? 1 : -1);
    continue;
}
```

`atoi()` で整数に変換して比較する。浮動小数点は1979年には対応していない。`-n` は整数ソートだ。

---

## 鑑定

```
初版       : Bell Labs Unix（Ken Thompson / 推定1973年頃）
このバージョン: Bell-32V（1979年、AT&T）
行数       : 902行
テーブル   : fold[256], nofold[256], nonprint[256], dict[256]——4枚の変換テーブル
メモリ     : MEM=32768バイト（満杯でテンポラリへ）
マージ     : N=7のN-wayマージ（7本ずつ再帰的にマージ）
クイックソート: 自前実装（qsexc/qstexcマクロ）
フィールド : struct field {code, ignore, nflg, rflg, bflg[2], m[2], n[2]} 最大10フィールド
テンポラリ : stm{pid}aa〜 形式（/usr/tmp → /tmp のフォールバック）
比較       : cmp()（フィールド対応）→ cmpa()（バイト列最終比較）
後継       : GNU coreutils sort（安定ソートに対応、-S でメモリ上限指定可能）
```

**`fold[128+']']`——4枚の256要素テーブルがポインタで切り替わり、32768バイトのバッファが溢れるたびにN=7本ずつテンポラリファイルにこぼれていく。902行のsortは、メモリと外部記憶の間を自動的に行き来する機械だった。**
