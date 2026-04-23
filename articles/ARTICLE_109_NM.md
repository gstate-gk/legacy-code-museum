# `A_MAGIC1 = 0407`——a.outの4つのマジックと `toupper()` で外部性を表すシンボル型文字、239行のオブジェクトファイル読み手

## はじめに

```c
#define A_MAGIC1    0407    /* normal */
#define A_MAGIC2    0410    /* read-only text */
#define A_MAGIC3    0411    /* separated I&D */
#define A_MAGIC4    0405    /* overlay */

#define BADMAG  MAGIC!=A_MAGIC1 && MAGIC!=A_MAGIC2 \
        && MAGIC!=A_MAGIC3 && MAGIC!=A_MAGIC4
```

`nm` はオブジェクトファイルやライブラリのシンボルテーブルを表示する道具だ。Bell-32V 1979年の `nm.c` は239行。`nm a.out` でリンク前のオブジェクトファイルに含まれるシンボルを列挙する——`main`、`printf`、未解決の `__undefined` など。デバッガとリンカをつなぐ「シンボルの窓」だ。

4つのマジックナンバー（全て8進数）は `a.out` の4形態を表す：
- `0407`（263）— 通常形式
- `0410`（264）— テキストセグメントが読み取り専用
- `0411`（265）— テキストとデータが別アドレス空間（I&D分離）
- `0405`（261）— オーバーレイ形式

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

```
nm.c  — 239行
  main()    — ファイル読み込み、シンボル蓄積、ソート、出力
  compare() — qsortのcomparator（数値/名前/逆順を切り替え）
  nextel()  — arアーカイブの次のエントリへ移動
```

---

## `struct exec`——a.outヘッダの8フィールド

```c
/* /usr/include/a.out.h */
struct exec {   /* a.out header */
    int      a_magic;   /* magic number */
    unsigned a_text;    /* size of text segment */
    unsigned a_data;    /* size of initialized data */
    unsigned a_bss;     /* size of uninitialized data */
    unsigned a_syms;    /* size of symbol table */
    unsigned a_entry;   /* entry point */
    unsigned a_trsize;  /* size of text relocation */
    unsigned a_drsize;  /* size of data relocation */
};
```

`a.out` とは **assembler output** の略だ。text（コード）・data（初期化済みデータ）・bss（初期化なしデータ）のセグメントサイズ、シンボルテーブルのバイト数、エントリポイント、再配置情報のサイズが詰まっている。`nm` はこのヘッダからシンボルテーブルの位置を計算して飛ぶ：

```c
o = (long)exp.a_text + exp.a_data + exp.a_trsize + exp.a_drsize;
fseek(fi, o, 1);  /* シンボルテーブルの先頭へ */
n = exp.a_syms / sizeof(struct nlist);  /* エントリ数 */
```

text + data + 再配置情報のバイト数を飛ばした先にシンボルテーブルがある。

---

## `struct nlist`——16バイトのシンボルエントリ

```c
struct nlist {  /* symbol table entry */
    char     n_name[8];   /* symbol name */
    char     n_type;      /* type flag */
    char     n_other;
    short    n_desc;
    unsigned n_value;     /* value */
};
```

シンボル名は最大8文字——`ar_name[14]`（ar.c、#097）より短い。`%.8s` フォーマットで出力される。`n_type` が1バイトでセグメント種別と外部性を両方持つ。

型フラグの定義：
```c
#define N_UNDF  0       /* undefined */
#define N_ABS   02      /* absolute */
#define N_TEXT  04      /* text */
#define N_DATA  06      /* data */
#define N_BSS   08
#define N_TYPE  037     /* mask */
#define N_FN    037     /* file name symbol */
#define N_EXT   01      /* external bit, or'ed in */
```

`N_TYPE = 037`（8進数）はマスク。`N_EXT = 01` は最下位ビット——type と external の情報を1バイトに同居させる設計だ。

---

## `N_EXT = 01`——`toupper()` で外部性を表す型文字

```c
switch (c & (N_TYPE - N_EXT)) {  /* 外部ビットを除いたtype */
case N_UNDF:  c = 'u'; if (symp[n].n_value) c = 'c'; break;
case N_ABS:   c = 'a'; break;
case N_TEXT:  c = 't'; break;
case N_DATA:  c = 'd'; break;
case N_BSS:   c = 'b'; break;
case N_FN:    c = 'f'; break;
}
if (symp[n].n_type & N_EXT)
    c = toupper(c);  /* 外部シンボルは大文字 */
```

型文字は `u/a/t/d/b/f` の6種類。そこに `toupper()` を1回かけるだけで外部シンボル（大文字 `U/A/T/D/B/F`）に変わる——`N_EXT` ビットが `0` か `1` かを文字の大小文字で表現する。今日の `nm` が出力する `T` や `U` はこの設計をそのまま引き継いでいる。

`N_UNDF` で `n_value != 0` なら `'c'`（common symbol）——初期化なしのグローバル変数。C言語の `int x;`（初期化なし）と `int x = 0;`（初期化あり）を区別する。

`STABTYPE` フラグが立っていれば別フォーマット：
```c
if (c & STABTYPE) {
    printf("%08x - %-8.8s %02x %02x %04x\n",
        symp[n].n_value,
        symp[n].n_name,
        symp[n].n_type & 0xff,
        symp[n].n_other & 0xff,
        symp[n].n_desc & 0xffff);
    continue;
}
```

デバッグ情報（stab）は `n_type/n_other/n_desc` を生の16進数で出力する——型文字の変換を経ない。

---

## `arch_flg` と `SELECT`——arアーカイブの透過的処理

```c
#define SELECT  arch_flg ? arp.ar_name : *argv

fread((char *)&exp, 1, sizeof(MAGIC), fi);
if (MAGIC == ARMAG)
    arch_flg++;      /* arアーカイブと判定 */
else if (BADMAG) {
    fprintf(stderr, "nm: %s-- bad format\n", *argv);
    continue;
}
```

先頭のマジックナンバーを読んで `ARMAG`（arのマジック）なら `arch_flg` を立てる。それ以降の処理はフラグで分岐せず、`SELECT` マクロが名前の取得先を切り替えるだけ——`.o` ファイルもライブラリも同じコードパスで処理できる。

```c
if ((arch_flg || narg>1) && prep_flg==0)
    printf("\n%s:\n", SELECT);  /* arなら arp.ar_name、直接なら *argv */
```

`-o` フラグで `prep_flg` が立つと行頭にファイル名を付ける：

```
archive.a:file.o:00000000 T main
```

---

## `nextel()`——ar.cの `getdir()` と同じ目的

```c
nextel(af)
FILE *af;
{
    register r;

    fseek(af, off, 0);
    r = fread((char *)&arp, 1, sizeof(struct ar_hdr), af);
    if (r <= 0)
        return(0);
    if (arp.ar_size & 1)
        ++arp.ar_size;   /* 奇数サイズは偶数に切り上げ */
    off = ftell(af) + arp.ar_size;  /* 次のエントリのオフセット */
    return(1);
}
```

ar.c（#097）の `getdir()` と同じ役割——arアーカイブのヘッダを順に読む。`arp.ar_size & 1` のワード境界チェックも同じだ。`off` を `ftell()` + `arp.ar_size` で更新して次のエントリへ。`do { ... } while(arch_flg && nextel(fi))` でアーカイブの全エントリを走査する。

---

## `qsort` と `realloc`——動的配列とソート

```c
while (--n >= 0) {
    fread((char *)&sym, 1, sizeof(sym), fi);
    if (globl_flg && (sym.n_type&N_EXT)==0)
        continue;
    if (symp==NULL)
        symp = (struct nlist *)malloc(sizeof(struct nlist));
    else
        symp = (struct nlist *)realloc(symp, (i+1)*sizeof(struct nlist));
    symp[i++] = sym;
}
if (nosort_flg==0)
    qsort(symp, i, sizeof(struct nlist), compare);
```

エントリ数が不定なので `realloc()` で1エントリずつ拡張——今日の視点では非効率だが、小さなオブジェクトファイルが前提の1979年だ。`-p` フラグ（`nosort_flg`）でソートを抑制できる。

```c
compare(p1, p2)
struct nlist *p1, *p2;
{
    register i;

    if (numsort_flg) {   /* -n: 数値ソート */
        if (p1->n_value > p2->n_value) return(revsort_flg);
        if (p1->n_value < p2->n_value) return(-revsort_flg);
    }
    for(i=0; i<sizeof(p1->n_name); i++)   /* デフォルト: 名前ソート */
        if (p1->n_name[i] != p2->n_name[i]) {
            if (p1->n_name[i] > p2->n_name[i]) return(revsort_flg);
            else return(-revsort_flg);
        }
    return(0);
}
```

`revsort_flg = 1`（デフォルト）を `-1` に変えるだけで逆順になる——`revsort_flg` を乗算することで正順/逆順を1つのcomparatorで表現する。`sizeof(p1->n_name)`（= 8）文字分をバイト比較する名前ソートは、ヌル終端を保証せず構造体サイズだけ比較する1979年式だ。

---

## デフォルトは `a.out`

```c
if (argc == 0) {
    argc = 1;
    argv[1] = "a.out";
}
```

引数なしで `nm` を実行すると `a.out` を読む。コンパイラのデフォルト出力ファイル名が `a.out` だった時代——`cc foo.c` すると `a.out` ができた。`nm` はそれを当然のデフォルトにする。

---

## 鑑定

```
初版       : Bell-32V Unix（1979年）
実装       : C（239行）
対象       : a.outオブジェクトファイル + arアーカイブ
a.outマジック: A_MAGIC1=0407/A_MAGIC2=0410/A_MAGIC3=0411/A_MAGIC4=0405（全て8進数）
struct exec: a_magic/text/data/bss/syms/entry/trsize/drsize = 8フィールド
struct nlist: n_name[8] + n_type + n_other + n_desc + n_value = 16バイト
N_EXT=01   : 最下位ビットが外部性、toupper()で大文字に変換
型文字     : u/a/t/d/b/f → U/A/T/D/B/F（toupper()1回で外部シンボル）
arch_flg   : ARMAG検出でarアーカイブも透過的に処理
SELECT     : arch_flg ? arp.ar_name : *argv（名前取得先を切り替えるマクロ）
nextel()   : ar.cのgetdir()と同じ役割、off=ftell()+arp.ar_sizeで追跡
realloc()  : 1エントリずつ動的拡張
compare()  : revsort_flg=±1の乗算で正順/逆順を切り替え
デフォルト : argc==0でa.outを読む
後継       : GNU nm、llvm-nm、objdump -t、readelf -s
```

**nmは「リンカの辞書索引」だ。**

`a.out` というバイナリの中に人間が読める名前が潜んでいる——`main`、`printf`、`errno`。リンカはそれらのシンボルをつないでプログラムを完成させる。`nm` はそのシンボルテーブルをテキストとして取り出す道具だ。`toupper()` の1呼び出しで内部/外部を表現し、`revsort_flg = ±1` の乗算で正順/逆順を切り替える——239行は最小限で最大限を表現している。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
