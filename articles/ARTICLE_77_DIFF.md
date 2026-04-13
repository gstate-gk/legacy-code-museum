# すべてのgit diffの祖先——jackpot、1974年の645行

## はじめに

`git diff` を実行するたびに、1974年のアルゴリズムが動いている。

`dspinellis/unix-history-repo` の Bell-32V ブランチに `usr/src/cmd/diff.c` がある。**645行の単一ファイル**だ。このコードが今日のすべての差分計算の起源だ。

`git diff`、`patch`、Pull Requestのdiff表示、CI/CDのコード変化検出——それらのDNAはここにある。

そして、このファイルには `jackpot` という変数がある。

---

## 発掘されたコード

- **リポジトリ**: [dspinellis/unix-history-repo](https://github.com/dspinellis/unix-history-repo)（Bell-32V-Snapshot-Development ブランチ）
- **スター数**: 7,215
- **実装言語**: C
- **設計者**: Doug McIlroy（Bell Telephone Laboratories）
- **アルゴリズム**: Harold Stone の k候補法（最長共通部分列）
- **初版**: 1974年

```
diff.c — 単一ファイル、645行

prepare()    # 両ファイルをハッシュ化して読み込む
prune()      # 共通の先頭・末尾を除去（最適化）
sort()       # Shell sort（CACM #201）でハッシュ順にソート
equiv()      # 等価クラスを構築
stone()      # k候補法でLCSを発見（アルゴリズムの核心）
unravel()    # predチェーンをたどってJ[]を復元
check()      # ハッシュ衝突を検出（jackpot）
output()     # 差分を出力
```

---

## 歴史的なコメント——アルゴリズムの全説明

`diff.c` は冒頭の50行で、アルゴリズム全体を説明している。Unix源コードの中でも最高水準のドキュメントだ。

```c
/*	diff - differential file comparison
*
*	Uses an algorithm due to Harold Stone, which finds
*	a pair of longest identical subsequences in the two
*	files.
*
*	The major goal is to generate the match vector J.
*	J[i] is the index of the line in file1 corresponding
*	to line i file0. J[i] = 0 if there is no
*	such line in file1.
*
*	Lines are hashed so as to work in core. All potential
*	matches are located by sorting the lines of each file
*	on the hash (called value). In particular, this
*	collects the equivalence classes in file1 together.
*	Subroutine equiv replaces the value of each line in
*	file0 by the index of the first element of its 
*	matching equivalence in (the reordered) file1.
*	To save space equiv squeezes file1 into a single
*	array member in which the equivalence classes
*	are simply concatenated, except that their first
*	members are flagged by changing sign.
*
*	Next the indices that point into member are unsorted
*	into array class according to the original order of file0.
*
*	The cleverness lies in routine stone. This marches
*	through the lines of file0, developing a vector klist
*	of "k-candidates". At step i a k-candidate is a matched
*	pair of lines x,y (x in file0 y in file1) such that
*	there is a common subsequence of length k
*	between the first i lines of file0 and the first y 
*	lines of file1, but there is no such subsequence for
*	any smaller y. x is the earliest possible mate to y
*	that occurs in such a subsequence.
*
*	Whenever any of the members of the equivalence class of
*	lines in file1 matable to a line in file0 has serial number 
*	less than the y of some k-candidate, that k-candidate 
*	with the smallest such y is replaced. The new 
*	k-candidate is chained (via pred) to the current
*	k-1 candidate so that the actual subsequence can
*	be recovered. When a member has serial number greater
*	that the y of all k-candidates, the klist is extended.
*	At the end, the longest subsequence is pulled out
*	and placed in the array J by unravel.
```

「The cleverness lies in routine `stone`」——McIlroyは核心を一言で指摘している。

---

## k候補法——stone()関数

`stone()` が差分計算の核心だ。最長共通部分列（LCS）を `k候補（k-candidate）` の概念で解く。

```c
struct cand {
    int x;    /* file0の行番号 */
    int y;    /* file1の行番号 */
    int pred; /* 前のk-1候補へのインデックス */
} cand;
```

`pred` フィールドが重要だ。各k候補は前のk-1候補を指している。LCSが見つかった後、この連鎖を `unravel()` でたどれば共通部分列全体を復元できる。

```c
stone(a,n,b,c)  /* a=file0の等価クラス, b=member配列, c=klist */
{
    register int i, k, y;
    k = 0;
    c[0] = newcand(0,0,0);
    for(i=1; i<=n; i++) {
        j = a[i];
        if(j==0)
            continue;          /* マッチなし——スキップ */
        y = -b[j];
        oldl = 0;
        oldc = c[0];
        do {
            if(y <= clist[oldc].y)
                continue;
            l = search(c, k, y);  /* 二分探索でklist内の位置を決定 */
            if(l!=oldl+1)
                oldc = c[l-1];
            if(l<=k) {
                if(clist[c[l]].y <= y)
                    continue;
                tc = c[l];
                c[l] = newcand(i,y,oldc);  /* 既存候補を置き換え */
                oldc = tc;
                oldl = l;
            } else {
                c[l] = newcand(i,y,oldc);  /* klistを延長 */
                k++;
                break;
            }
        } while((y=b[++j]) > 0);
    }
    return(k);  /* 最長共通部分列の長さ */
}
```

`search()` は `klist` を二分探索する。O(log k)でk候補の挿入位置を決める。

```c
search(c, k, y)
{
    register int i, j, l;
    if(clist[c[k]].y<y)    /*quick look for typical case*/
        return(k+1);        /* 末尾への追加が最も一般的なケース */
    i = 0;
    j = k+1;
    while((l=(i+j)/2) > i) {
        t = clist[c[l]].y;
        if(t > y) j = l;
        else if(t < y) i = l;
        else return(l);
    }
    return(l+1);
}
```

「`quick look for typical case`」のコメント——最も頻繁なケースをO(1)でショートカットする。1974年のマイクロ最適化だ。

---

## jackpot——ハッシュ衝突の詩的な命名

`readhash()` は各行を16ビットのハッシュ値に変換する。ハッシュなので**衝突**が起きる可能性がある——異なる内容の行が同じハッシュ値を持つ場合だ。

```c
/* hashing has the effect of
 * arranging line in 7-bit bytes and then
 * summing 1-s complement in 16-bit hunks 
*/

readhash(f)
FILE *f;
{
    long sum;
    register unsigned shift;
    sum = 1;
    if(!bflag) for(shift=0; (t=getc(f))!='\n'; shift+=7) {
        if(t==-1) return(0);
        sum += (long)t << (shift%=HALFLONG);  /* 7ビットシフトで加算 */
    }
    sum = low(sum) + high(sum);
    return((short)low(sum) + (short)high(sum));
}
```

ハッシュ衝突が起きると、`check()` 関数が検出して `jackpot` に記録する。

```c
check(argv)
{
    int jackpot;
    jackpot = 0;
    for(i=1; i<=len[0]; i++) {
        /* ... 実際の行内容を比較 ... */
        if(c!=d) {
            jackpot++;     /* ハッシュは一致したが内容が違う */
            J[i] = 0;      /* この対応を無効化 */
            /* ... */
        }
    }
    /* コメントアウトされた診断: */
    /*
        if(jackpot)
            mesg("jackpot",empty);
    */
}
```

コメントには書いてある——「a harmless matter（無害なこと）」。ハッシュ衝突で誤った対応が生じても、`J[i]=0` で無効化するだけだ。正しいマッチが「変更」として報告されるかもしれないが、それだけだ。

そして `jackpot` という変数名。スロットマシンの当たりだ。実際の意味は「偽の当たり」——当たりに見えたが本物ではなかった。1974年のベル研究所の誰かがこの名前を選んだ。診断メッセージは最終的にコメントアウトされたが、変数名だけが残った。

---

## prune()——刈り込みの最適化

LCSアルゴリズムの前に、`prune()` が実行される。

```c
prune()
{
    register i,j;
    /* 共通の先頭を除去 */
    for(pref=0; pref<len[0] && pref<len[1] &&
        file[0][pref+1].value==file[1][pref+1].value;
        pref++) ;
    /* 共通の末尾を除去 */
    for(suff=0; suff<len[0]-pref && suff<len[1]-pref &&
        file[0][len[0]-suff].value==file[1][len[1]-suff].value;
        suff++) ;
}
```

2つのファイルの共通の先頭・末尾をLCSの対象から除外する。多くの実際のdiffでは変更は局所的——前後の大部分は同じだ。この最適化でstone()が処理する行数が大幅に減る。

---

## メモリの重ね合わせ——1974年の節約

```c
int *class;     /*will be overlaid on file[0]*/
int *member;    /*will be overlaid on file[1]*/
int *klist;     /*will be overlaid on file[0] after class*/
int *J;         /*will be overlaid on class*/
long *ixold;    /*will be overlaid on klist*/
long *ixnew;    /*will be overlaid on file[1]*/
```

各変数に「`will be overlaid on`（〜の上に重ねる）」というコメントがある。異なる処理フェーズで同じメモリを再利用する設計だ。`file[0]` のメモリは `class` として使われ、後に `J` として使われる。

コメントが**設計の意図を宣言している**。これはバグではなく、意図的な節約だ。1974年、メモリは貴重だった。

---

## 鑑定

```
ファイル     : usr/src/cmd/diff.c（単一ファイル、645行）
言語         : C
誕生         : 1974年、AT&T Bell Labs
設計者       : Doug McIlroy
アルゴリズム : Harold Stone の k候補法（最長共通部分列）
影響         : diff -u、patch、git diff（2005〜）、GitHub PR表示
```

McIlroyは1973年にKen Thompsonに「grepを書いてほしい」と頼んだ人間だ。翌年、自分でdiffを書いた。

`stone()` という関数は、ファイルの差分を最長共通部分列の問題に変換する。`pred` フィールドによる連鎖が経路を復元する。`prune()` が変化のない前後を除去する。`jackpot` がハッシュ衝突を記録する——診断メッセージはコメントアウトされたが変数名は残った。

50年後、全世界の開発者が `git diff` を実行するたびに、このアルゴリズムの子孫が動いている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
