# `etoa[] atoe[] atoibm[]`——3枚の256バイト変換表、IBMメインフレームのテープをUnixで読むための1979年のddとJCLが転生した`if= of=`構文

## はじめに

`dd.c` の先頭付近にこういう配列がある。

```c
char	etoa[] = {
    0000,0001,0002,0003,0234,0011,0206,0177,
    ...（256バイト、純粋な8進数）
};
char	atoe[] = { ... };
char	atoibm[] = { ... };
```

3枚の256バイト変換テーブル——`etoa`（EBCDIC to ASCII）、`atoe`（ASCII to EBCDIC）、`atoibm`（ASCII to IBM 360/370 EBCDIC）。IBMメインフレームと通信するために、1979年のUnixは3種類の文字コード変換テーブルをソースコードに埋め込んでいた。

`dd` は「disk duplicator」でも「data dump」でもなく、**IBM JCL（Job Control Language）の `DD`（Data Definition）** だ。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

```
dd.c — 541行（単一ファイル）
  etoa[] / atoe[] / atoibm[] — 256バイト×3の変換テーブル
  ascii()  — EBCDIC→ASCII変換（固定長レコード処理付き）
  ebcdic() — ASCII→EBCDIC変換
  ibm()    — ASCII→IBM EBCDIC変換
  null()   / cnull() — 変換なし（大文字小文字変換のみ）
  flsh()   — 出力バッファをフラッシュ
  stats()  — 統計出力
```

---

## JCLから来た構文——`if=` `of=` `conv=`

ddの引数はJCL（IBM Job Control Language）の書式を模倣している。

```sh
dd if=/dev/tape of=data.bin bs=512 conv=ascii
```

IBM JCLでは `//DD1 DD DSN=...` のようなデータ定義を書く。UnixのddはこのJCLの書き方をコマンドライン引数に転写した——`if=`（input file）、`of=`（output file）。

1979年、多くの企業はIBMメインフレームとUnixが混在する環境で運用していた。メインフレームのテープをUnixで読む——そのためにddは`conv=ebcdic`オプションを持ち、変換テーブルを3枚埋め込んだ。

---

## 2種類のEBCDIC——`atoe` と `atoibm`

EBCDIC（Extended Binary Coded Decimal Interchange Code）はASCIIと全く異なる文字コード体系だ。IBMが1964年のSystem/360で採用し、以降のIBMメインフレームで使い続けた。

問題は「EBCDICにも方言がある」ことだ。

```c
char atoe[]   = { ... };  /* ASCII → 標準EBCDIC */
char atoibm[] = { ... };  /* ASCII → IBM 360/370 EBCDIC */
```

2つのテーブルはほとんど同じだが、特定の記号（`!`、`[`、`]`等）の位置が異なる。`!`（ASCII 0x21）は `atoe[33]=0117`、`atoibm[33]=0132`——同じ文字が異なるコードに割り当てられている。

Unixが相手にしたIBMシステムによって、どちらのテーブルを使うか選べる設計だ。

---

## 固定長レコードとUnix——`cbs=` の役割

IBMメインフレームのテープは「固定長レコード」形式だ。1レコード80バイト（パンチカードの名残）が延々と続く。Unixのテキストは改行で区切られる可変長。この2つを変換するのが `cbs=`（conversion buffer size）だ。

**EBCDIC→ASCII変換** (`ascii()` 関数):

```c
ascii(cc) {
    c = etoa[cc] & 0377;     /* EBCDIC→ASCII変換 */
    if(c == ' ') {
        nspace++;            /* 末尾スペースをカウント */
        goto out;
    }
    while(nspace > 0) {      /* 非スペース文字が来たらスペースを吐き出す */
        null(' ');
        nspace--;
    }
    cnull(c);
out:
    if(++cbc >= cbs) {
        null('\n');          /* cbsバイトごとに改行を挿入 */
        cbc = 0;
        nspace = 0;
    }
}
```

`cbs=80` のとき、80バイトごとに改行を挿入し、末尾スペースは出力しない。80バイト固定長のパンチカード形式をUnixのテキストに変換する。

**ASCII→EBCDIC変換** (`ebcdic()` 関数) は逆の処理:

```c
if(cc == '\n') {
    while(cbc < cbs) {
        null(atoe[' ']);     /* 改行位置までスペースで埋める */
        cbc++;
    }
    ...
}
```

改行をcbsバイトまでのスペースパディングに変換する——Unix行をIBM固定長レコードに変換。

---

## SWAB——バイト順序の変換

```c
#define SWAB 04

if(cflag & SWAB && c) {
    do {
        a = *ip++;
        ip[-1] = *ip;
        *ip++ = a;
    } while(--c);
}
```

`conv=swab` は隣接する2バイトを入れ替える。PDP-11（リトルエンディアン）とIBMメインフレーム（ビッグエンディアン）の間でバイト順序が逆になる場合の対処だ。ワード単位のバイトスワップを純粋なポインタ演算で実装している。

---

## number()——単位付き数値の解析

```c
number(big)
{
    n = 0;
    while(*cs >= '0' && *cs <= '9')
        n = n*10 + *cs++ - '0';
    for(;;) switch(*cs++) {
    case 'k': n *= 1024; continue;
    case 'w': n *= sizeof(int); continue;
    case 'b': n *= 512; continue;
    case '*':
    case 'x': string = cs; n *= number(BIG);
    case '\0': return(n);
    }
}
```

`bs=1k` → 1024バイト、`bs=2b` → 1024バイト、`bs=2x512` → 1024バイト。`k`（キロ）、`w`（ワード）、`b`（ブロック=512）、`x`/`*`（乗算）。

`BIG = 2147483647`（= 2^31 - 1）が上限チェックに使われる。32bit符号付き整数の最大値——これが「無制限」を表す。

---

## fflag——ゼロコピーの最適化

```c
if (bs) {
    ibs = obs = bs;
    if (conv == null)
        fflag++;   /* 変換なしかつbs=設定時 */
}
...
if (fflag)
    obuf = ibuf;   /* 入出力バッファを共有 */
```

`bs=` が設定され、文字コード変換なしの場合、入力バッファと出力バッファを同じ領域にする。`read()`したデータをそのまま`write()`に渡す——1979年のゼロコピー最適化だ。

---

## sbrk(64)——「念のため」の64バイト

```c
ibuf = sbrk(ibs);
if (fflag)
    obuf = ibuf;
else
    obuf = sbrk(obs);
sbrk(64);	/* For good measure */
```

入出力バッファを確保した後、さらに64バイトを確保する——コメントは "For good measure"（念のため）。バッファのすぐ上に64バイトの余白を置くことで、バッファオーバーランへの護符とした。1979年、それが実用的な防衛だった。

---

## stats()——記録統計

```
1024+3 records in
1024+0 records out
```

`nifr`（full records）と `nipr`（partial records）。`+` で区切られた2つの数字が「完全なブロック数+端数ブロック数」を示す。テープコピーの際に重要な情報——端数が多ければデータが汚染されている。

SIGINTシグナル（Ctrl-C）でも統計が出る：

```c
if (signal(SIGINT, SIG_IGN) != SIG_IGN)
    signal(SIGINT, term);
```

中断しても、何件処理したかが記録される。

---

## 鑑定

```
初版       : Bell-32V Unix（1979年）
実装       : C（541行）
名称の由来 : IBM JCL の DD（Data Definition）
構文       : if= of= bs= ibs= obs= cbs= skip= seek= count= conv=（JCL模倣）
変換テーブル: etoa[256]/atoe[256]/atoibm[256]（EBCDIC 2方言対応）
cbs=       : 固定長レコード（IBMメインフレーム）↔可変長行（Unix）変換
conv=swab  : ポインタ演算による2バイト入れ替え（エンディアン変換）
number()   : k/w/b/*のサフィックス付き数値解析（k=1024, b=512）
fflag      : bs=+変換なし時にibuf=obufで共有（ゼロコピー）
BIG        : 2147483647（2^31-1）= 「無制限」の表現
sbrk(64)   : "For good measure" ——64バイトのバッファ護符
stats()    : Ctrl-Cでも "N+M records in/out" を出力
後継       : GNU coreutils dd → 全Linuxディストリに今も付属
```

**ddはIBMとUnixの間の通訳者として生まれた。**

1979年、コンピュータの世界はASCIIとEBCDICに分裂していた。IBMメインフレームのテープをPDP-11で読むには、256バイトの対応表が3枚必要だった。JCLの書き方をコマンドラインに移植し、固定長レコードを改行区切りに変換し、バイト順序を逆転させる——これら全てを541行が実装した。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
