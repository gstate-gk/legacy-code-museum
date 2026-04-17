# `ssen`→`ily`——逆順で並ぶ接尾辞テーブル、McIlroyのBloom filterと600行が英語の形態論を解く

**Bell Labs, 1975年。CとShellで書かれたスペルチェッカー。**

---

## はじめに

```sh
spell document.ms
```

これだけだ。troffで書いた文書を渡すと、スペルミスの単語が1行ずつ出てくる。どこに間違いがあるかは教えない。辞書にない単語だけを返す。

spellingを「spelling」と書いたのか「speling」と書いたのか、それを判断するのは人間だ。

---

## 作者——Doug McIlroy

**M. Douglas McIlroy**——パイプを発明した男。`sort`, `tr`, `diff` の設計にも関わった。1975年にspellを書いた。

spellはMcIlroyが自分自身の道具として必要としたものだ。Bell Labsの文書は全員がtroffで書く。スペルミスを自分で発見するより、機械に任せた方がいい。

---

## パイプラインとして動く

`spell.sh`——20行のShellスクリプトがspellの全体だ：

```sh
deroff -w $F | sort -u |
/usr/lib/spell ${S-/usr/dict/hstop} $T |
/usr/lib/spell ${D-/usr/dict/hlista} $V $B |
sort -u +0f +0 - $T |
tee -a $H
who am i >>$H 2>/dev/null
```

1. `deroff -w`——troffの `.` コマンドと `\` エスケープを除去し、単語だけを取り出す
2. `sort -u`——重複除去
3. 1回目の `/usr/lib/spell hstop`——`stop`リスト（`the`, `is`, `a` etc.）を除去
4. 2回目の `/usr/lib/spell hlista`——本辞書でチェック
5. `sort -u +0f +0`——大文字小文字を無視してソート、同スペルは1つに
6. `tee -a $H`——履歴ファイルに追記
7. `who am i`——誰がいつ実行したかをログに残す

パイプラインの各段が1つのことをする。McIlroyが設計したUnixの哲学そのものだ。

---

## Bloom filter——400,000ビットの辞書

`spell.h`：

```c
#define TABSIZE 25000   /* 25000 shorts = 400,000 bits */
short tab[TABSIZE];
long p[] = {399871, 399887, 399899, 399911, 399913,
            399937, 399941, 399953, 399979, 399983, 399989};
#define NP (sizeof(p)/sizeof(p[0]))  /* 11個のハッシュ関数 */
long pow2[NP][NW];  /* 多項式ハッシュの係数テーブル */

#define get(h) (tab[h>>SHIFT]&(1<<((int)h&((1<<SHIFT)-1))))
#define set(h) tab[h>>SHIFT] |= 1<<((int)h&((1<<SHIFT)-1))
```

11個の素数は全て399,871〜399,989の範囲——400,000ビットのテーブルに収まるよう選ばれた。

`dict()`関数は単語を各素数で多項式ハッシュし、11ビット全てが立っていれば辞書にある、と判断する。1ビットでも立っていなければ確実にない。11ビット全て立っていても、稀に偽陽性がある——それがBloom filterだ。

コメントにはその数学が書いてある：最適な `k=log(2)×m/n`。400,000ビット、25,000語で `k=11` が最適だと。

`spellin.c`が辞書テキストからこのバイナリテーブルを構築し、`spellout.c`がテーブルを参照する。辞書は25,000語のテキストが400,000ビットに圧縮されている。

---

## `suftab[]`——逆順で並ぶ接尾辞テーブル

`spell.c`のコアがこれだ：

```c
static struct suftab {
    char *suf;
    int (*p1)();
    int (*p2)();
} suftab[] = {
    "ssen", ily,   ily,    /* -ness */
    "ssel", ily,   ily,    /* -less */
    "ytilib", 0,   bility, /* -bility */
    "ylb",  0,     bility, /* -bly */
    "yb",   0,     0,      /* -by */
    "yrd",  0,     0,      /* -dry */
    "ylf",  0,     0,      /* -fly */
    "gni",  CCe,   VCe,    /* -ing */
    "ytic", 0,     city,   /* -city */
    "ylci", 0,     ily,    /* -icly */
    "ylac", 0,     ily,    /* -cally */
    "ylrae",0,     ily,    /* -early */
    "de",   strip, i_to_y, /* -ed */
    "es",   s,     es,     /* -es */
    "s",    0,     s,      /* -s */
    ...
};
```

**接尾辞が全て逆順で格納されている。** "ssen" は "-ness"、"gni" は "-ing"、"de" は "-ed"。

なぜ逆順か——`suffix()`関数が単語の末尾から前向きにスキャンするからだ。逆順に格納することで、文字列比較が先頭から始まる通常の `strcmp` で末尾マッチングができる。

各エントリには2つの変換関数 `p1`/`p2`。`suffix()`は接尾辞を取り除いた後、`p1`を試し、辞書にあればOK、なければ`p2`を試す。

---

## `CCe()` と `VCe()`——英語の形態音論

`-ing` の接尾辞処理（"gni"）は2つの関数を持つ：

```c
CCe(word)   /* Consonant-Consonant-e rule */
VCe(word)   /* Vowel-Consonant-e rule     */
```

`CCe()`——末尾の子音が2つ重なっていたら1つ取る。"running"→"runn"→`CCe()`→"run"。

`VCe()`——末尾に `e` を追加。"making"→"mak"→`VCe()`→"make"。

英語の綴り規則——短母音の後で子音を重ねる（"run"→"running"）、長母音+無声eで終わる語からeを落とす（"make"→"making"）——これを600行のCコードで実装している。

`monosyl()`は単音節語を検出する。子音重複は単音節語にしか起こらないからだ。

---

## `ize()` と British `-b` フラグ

```c
ize(word) {
    word[strlen(word)-3] = '\0';  /* strip -ize */
    return(tryword(word));
}
```

`-b` フラグはBritish spelling mode：

```c
ise() {
    ztos();    /* 全接尾辞の 'z' を 's' に置換 */
    ize(word);
}

ztos() {
    /* suftab[] を走査して 'z' → 's' に書き換える */
    for(i=0; suftab[i].suf; i++) {
        for(p=suftab[i].suf; *p; p++)
            if(*p == 'z') *p = 's';
    }
}
```

`-b` が渡されると、**実行時に接尾辞テーブルを書き換える**。"ize"→"ise"、"yze"→"yse"。プログラムが自分のデータ構造を変更して振る舞いを変える。

---

## `preftab[]`——34個の接頭辞

接尾辞だけでは不十分だ。接頭辞テーブルも持つ：

```c
char *preftab[] = {
    "anti", "bio", "dis", "electro", "en", "fore",
    "hyper", "intra", "inter", "iso", "kilo",
    "magneto", "meta", "micro", "milli", "mis",
    "mono", "multi", "non", "out", "over",
    "photo", "poly", "pre", "pseudo", "re",
    "semi", "stereo", "sub", "super", "thermo",
    "ultra", "under", "un",
    0
};
```

接頭辞を除いた残りの部分が辞書にあれば、その単語はスペルミスではない。"unhappy"→"un"+"happy"、"microwave"→"micro"+"wave"。

---

## 鑑定

```
初版       : 1975年（M. Douglas McIlroy、Bell Telephone Laboratories）
このバージョン: Bell-32V（1979年、AT&T）
実装       : C + Shell（spell.c ~400行 + spell.sh 20行 + spellin/spellout 各50行）
辞書圧縮   : Bloom filter（400,000ビット、11ハッシュ関数、素数399871〜399989）
形態論     : 接尾辞剥離（suftab[] 逆順格納）+ 接頭辞除去（preftab[] 34語）
音韻規則   : CCe（子音重複削除）、VCe（語末e補完）、monosyl（単音節検出）
British対応: -b フラグで実行時にsuftab[]をztos()が書き換える
パイプライン: deroff → sort-u → spell(stop) → spell(dict) → sort → tee → who
後継       : ispell（1978〜）、aspell（2000〜）、hunspell（2002〜）
```

**逆順接尾辞と11個の素数——McIlroyは英語の形態音論をデータ構造で表現し、400,000ビットに25,000語の辞書を詰め込んだ。deroffからwho am iまで、スペルチェックはUnixのパイプラインそのものだった。**
