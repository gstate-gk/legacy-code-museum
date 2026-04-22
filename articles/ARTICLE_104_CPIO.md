# `TRAILER!!!` と `070707`——mkdirをforkで呼んだ1979年のアーカイバと、Linux initramfsに今も生きるcpio形式

## はじめに

```c
strcpy(Hdr.h_name, "TRAILER!!!");
MKSHORT(Hdr.h_filesize, 0L);
Hdr.h_namesize = strlen("TRAILER!!!") + 1;
bwrite(&Hdr, HDRSIZE+Hdr.h_namesize);
```

cpio アーカイブの終端は `TRAILER!!!` という文字列だ。1979年にBell Labsが書いたこの文字列は、2024年のLinuxカーネルが起動するとき、initramfs（初期RAMファイルシステム）の中にそのまま存在する。RPMパッケージの内部形式も cpio だ。tarに「負けた」はずのcpioは、45年後も現役だった。

Bell-32V（1979年）の `cpio.c` は789行。コアとなる設計は3モード——**OUT**（`-o`）でアーカイブ作成、**IN**（`-i`）で展開、**PASS**（`-p`）でディレクトリ間コピー。名前は "copy in/out" の略だ。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories, Inc.
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

```
cpio.c — 789行
  main()     — 3モードの分岐（IN/OUT/PASS）
  getname()  — stdinから1行読んでstatを取る
  gethdr()   — アーカイブからヘッダを読む
  openout()  — ファイルを作成（ディレクトリ/特殊ファイル/通常ファイル）
  bread()    — バッファ付き読み込み（テープ対応）
  bwrite()   — バッファ付き書き込み（テープ対応）
  makdir()   — fork+exec /bin/mkdirでディレクトリ作成
  chgreel()  — テープリール交換
  gmatch()   — グロブパターンマッチ
  postml()   — ハードリンク追跡（最大1000件）
  cd()       — 相対パスをchdir()で追跡する複雑な関数
  pwd()      — popen("pwd", "r")でカレントディレクトリを取得
```

---

## `070707`——cpio のマジックナンバー

```c
#define MAGIC   070707

struct header {
    short   h_magic,      /* = 070707 */
            h_dev,
            h_ino,
            h_mode,
            h_uid,
            h_gid,
            h_nlink,
            h_rdev;
    short   h_mtime[2];
    short   h_namesize;
    short   h_filesize[2];
    char    h_name[256];
} Hdr;

#define HDRSIZE ((sizeof Hdr)-256)
```

マジックナンバー `070707`（8進数）はcpio形式の識別子だ。ファイルサイズを `short h_filesize[2]`——2つの16bit整数——で表現する。1979年、32bitの `long` をそのまま書き込めなかった（エンディアンが機種によって異なる）ためだ。

`HDRSIZE = (sizeof Hdr) - 256` で `h_name[256]` フィールドを除いたヘッダサイズを計算する。ヘッダとファイル名は別々に書き込まれる——名前の長さが固定ではないからだ。

---

## `MKSHORT` / `mklong`——エンディアン問題を1行で解く

```c
/* for VAX, Interdata, ... */
#define MKSHORT(v,lv) {U.l=1L;if(U.c[0]) U.l=lv,v[0]=U.s[1],v[1]=U.s[0]; \
                       else U.l=lv,v[0]=U.s[0],v[1]=U.s[1];}

union { long l; short s[2]; char c[4]; } U;

long mklong(v)
short v[];
{
    U.l = 1;
    if(U.c[0])
        U.s[0] = v[1], U.s[1] = v[0];
    else
        U.s[0] = v[0], U.s[1] = v[1];
    return U.l;
}
```

`U.c[0]` が 1 かどうかで自機のエンディアンを実行時に判断する。VAX（リトルエンディアン）では `s[0]` と `s[1]` を入れ替えて格納し、Interdata（ビッグエンディアン）ではそのまま。`union` を使ってメモリの同じ位置を `long`・`short[2]`・`char[4]` として読み書きする——C言語のtype punningの古典的用法だ。

コメントの "for VAX, Interdata, ..." が1979年のコンピュータ業界の多様性を映している。

---

## `find | cpio`——パイプライン哲学の結晶

```sh
# アーカイブ作成: find が名前リストを生成、cpio が受け取る
find . -name "*.c" | cpio -o > backup.cpio

# 展開
cpio -i < backup.cpio

# ディレクトリ間コピー（-pモード）
find . | cpio -p /backup/dir
```

`getname()` の実装がパイプライン設計を明確に示す：

```c
getname()
{
    register char *namep = Name;
    for(;;) {
        if(gets(namep) == NULL)
            return 0;           /* EOFで終了 */
        if(*namep == '.' && namep[1] == '/')
            namep += 2;         /* "./" を除去 */
        strcpy(Hdr.h_name, namep);
        if(stat(namep, &Statb) < 0) {
            err("< %s > ?\n", Hdr.h_name);
            continue;           /* stat失敗はスキップ */
        }
        ...
        return 1;
    }
}
```

`gets()` で標準入力から1行ずつ読む。`find` の出力をそのままパイプで受け取る。cpio は「ファイルのリストをどう作るか」を知らない——それは `find` の仕事だ。Bell Labs の「一つのことだけをうまくやれ」という哲学の体現。

---

## `makdir()` ——mkdirはまだsyscallではなかった

```c
makdir(namep)
register char *namep;
{
    static status;

    if(fork())
        wait(&status);
    else {
        close(2);
        execl("/bin/mkdir", "mkdir", namep, 0);
        exit(1);
    }
    return ((status>>8) & 0377)? 0: 1;
}
```

ディレクトリを作成するのに `fork()` してから `execl("/bin/mkdir", ...)` を呼び出す。`mkdir()` システムコールはまだ存在しなかった——それはBSD 4.2（1983年）で追加されたSVr3（1983年）以降の機能だ。1979年のUnixでは `mkdir` は `/bin/mkdir` という独立した実行ファイルで、特権を使ってディレクトリを作成していた。

`close(2)` でstderrを閉じてから exec している——エラーメッセージを捨てる小技だ。

---

## `popen("pwd", "r")` ——getcwd()がなかった時代

```c
pwd()
{
    FILE *dir;

    dir = popen("pwd", "r");
    fgets(Fullname, 128, dir);
    pclose(dir);
    Pathend = strlen(Fullname);
    Fullname[Pathend - 1] = '/';
}
```

カレントディレクトリの取得に `popen("pwd", "r")` を使う。`getcwd()` はまだ存在しない。`/bin/pwd` コマンドをサブプロセスとして起動し、その出力を読む——1979年のUnixでは外部コマンドが唯一の手段だった。

`Fullname[Pathend - 1] = '/'` で末尾の改行を `/` に置き換えてパス区切り文字にする。

---

## `chgreel()` ——テープリールを交換するUI

```c
chgreel(x, fl)
{
    ...
    err("Can't %s\n", x? "write output": "read input");
    fstat(fl, &statb);
    if((statb.st_mode&S_IFMT) != S_IFCHR)
        exit(1);          /* キャラクタデバイスでなければ終了 */
again:
    err("If you want to go on, type device/file name when ready\n");
    devtty = fopen("/dev/tty", "r");
    fgets(str, 20, devtty);
    ...
    if((f = open(str, x? 1: 0)) < 0) {
        err("That didn't work");
        goto again;
    }
    return f;
}
```

`bread()` や `bwrite()` が読み書きに失敗したとき、対象がキャラクタデバイス（テープドライブ）であれば `chgreel()` を呼ぶ。ユーザーに新しいデバイスファイル名を `/dev/tty` から入力させ、テープを交換して続行する。

1979年のバックアップはマグネティックテープだった。cpioはテープが満杯になっても止まらない——オペレータが次のリールをセットして続きを入力すれば処理を再開できる。

---

## `#include` が関数の中にある

```c
pentry(namep)
register char *namep;
{
    register i;
    static short lastid = -1;
#include <pwd.h>              /* ← 関数の中にinclude! */
    static struct passwd *pw;
    struct passwd *getpwuid();
    ...
}
```

`pentry()` 関数（`-tv` オプションで詳細一覧を表示する）の中に `#include <pwd.h>` がある。C言語の仕様上は有効だが、現代では誰もやらない書き方だ。`struct passwd` がこの関数でしか使われないため、スコープを限定する意図と思われる——1979年の「局所化」の試み。

---

## ハードリンク追跡——`LINKS = 1000`

```c
#define LINKS   1000

postml(namep, np)
{
    static struct ml {
        short   m_dev, m_ino;
        char    m_name[2];   /* 実際はmallocで可変長 */
    } *ml[LINKS];
    static mlinks = 0;
    ...
    if(mlinks == LINKS ...) {
        err("Too many links\n");
    }
}
```

ハードリンクを追跡するため、`ml[]` 配列にデバイス番号・inode番号・ファイル名を記録する。最大1000件。2本のファイルが同じ `dev+ino` を持てばハードリンクと判断し、実データをコピーせず `link()` で繋ぐ。メモリが足りなければ `malloc` 失敗——エラーメッセージを出して `1` を返すことで「リンクとして扱わず通常コピー」にフォールバックする。

---

## 45年後の `TRAILER!!!`

現代のLinuxカーネルが起動するとき：

```sh
# initramfsの中身を確認
zcat /boot/initrd.img | cpio -tv 2>/dev/null | head
# → 070707形式のcpioアーカイブ
```

`070707` のマジックナンバー、`TRAILER!!!` の終端文字列——1979年のBell-32V `cpio.c` で定義されたこれらの定数は、今日のLinuxカーネルのコードに文字通り埋め込まれている。RockyLinux・Debian・Ubuntu、全てのinitramfsが同じ文字列でアーカイブを終える。

---

## 鑑定

```
初版       : Bell-32V Unix（1979年）
実装       : C（789行）
名称の由来 : "copy in/out"の略
モード     : OUT(-o) / IN(-i) / PASS(-p)の3モード
マジック   : 070707（8進数）——今もLinux initramfsで使用
終端       : "TRAILER!!!"——45年後も同じ文字列
makdir()   : fork+exec /bin/mkdirでディレクトリ作成（mkdirはsyscallではなかった）
pwd()      : popen("pwd","r")でカレントディレクトリ取得（getcwd()がなかった）
エンディアン: MKSHORT/mklongマクロでVAX/Interdata両対応
テープ     : chgreel()でリール交換をインタラクティブにサポート
ハードリンク: postml()でdev+inoで追跡（最大LINKS=1000件）
find連携   : getname()がstdinを1行ずつ読む設計で find | cpio が自然に成立
#include   : pentry()関数の中にある（局所スコープの試み）
後継       : Linux initramfs / RPMパッケージ形式として現役
```

**cpioは「負けたのに消えなかった」アーカイバだ。**

tarに標準の座を譲り、GNUツールにも採用されず、それでも2024年のLinuxカーネルはcpioで起動する。`TRAILER!!!` と `070707`——Bell-32V 1979年の定数が、45年後のinitramfsの中に眠っている。`makdir()` がforkしてmkdirを呼んでいた時代、`popen("pwd","r")` でカレントディレクトリを取得していた時代——789行に1979年のUnixの現実が刻まれている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
