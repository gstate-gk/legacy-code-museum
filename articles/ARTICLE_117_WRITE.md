# `stbuf.st_mode & 02`——mesg n/y の実装原理、`write -` で全ユーザー一斉送信、`buf[0]=='!'` でシェルエスケープする183行

**Bell Telephone Laboratories / Bell-32V Unix** | **1979年** | **C**

---

## はじめに

```c
if (fstat(fileno(tf), &stbuf) < 0)
    goto perm;
if ((stbuf.st_mode & 02) == 0)
    goto perm;
```

`&02` は8進数——ビット1、「その他のユーザーの書き込み許可」だ。この1ビットが `mesg n` と `mesg y` の実装原理だ。Bell-32V の `write.c` は183行——端末間メッセージ送信の全体だ。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

---

## `stbuf.st_mode & 02`——`mesg n/y` の実装原理

```c
signal(SIGALRM, timout);
alarm(5);
if ((tf = fopen(histty, "w")) == NULL)
    goto perm;
alarm(0);
if (fstat(fileno(tf), &stbuf) < 0)
    goto perm;
if ((stbuf.st_mode & 02) == 0)
    goto perm;
```

`mesg n` は `chmod o-w /dev/tty*` と等価——端末デバイスファイルの「その他書き込みビット」を落とす。`mesg y` は `chmod o+w /dev/tty*` でそのビットを立てる。`write` コマンドは `fstat()` でそのビットを確認し、ゼロなら "Permission denied" で終了する。

`alarm(5)` は tty のオープンに5秒のタイムアウトを設ける——相手端末が何らかの理由でブロックしていても、`write` コマンドは永遠には待たない。

1つのパーミッションビットがメッセージの受け入れ/拒否を制御する——Unix の「ファイルはすべてだ」哲学の体現だ。

---

## `him[0] != '-'`——`write -` で全ユーザーに一斉送信、`wall` の原型

```c
him = argv[1];

/* utmp を走査する */
while (fread((char *)&ubuf, sizeof(ubuf), 1, uf) == 1) {
    if(him[0] != '-' || him[1] != 0)  /* ← "-" でなければ名前を比較 */
    for(i=0; i<8; i++) {
        c1 = him[i];
        c2 = ubuf.ut_name[i];
        if(c1 == 0)
            if(c2 == 0 || c2 == ' ')
                break;
        if(c1 != c2)
            goto nomat;
    }
    logcnt++;
    /* ... histty を設定 ... */
nomat:
    ;
}
```

`him == "-"` のとき条件 `him[0] != '-' || him[1] != 0` は偽——ユーザー名の比較をスキップして全 utmp エントリに `logcnt++` する。すべての端末に書き込む。`write -` が一斉送信コマンドになる。

現代の `wall`（write all）コマンドはここから分離独立した。1979年の `write.c` はその機能を内蔵していた。

`logcnt > 1` のとき「logged more than once writing to ...」と警告し最初に見つけた端末に書く——同一ユーザーが複数端末でログインしているケースへの対処だ。

---

## `buf[0] == '!'`——チャット中のシェルエスケープ

```c
for(;;) {
    char buf[128];
    i = read(0, buf, 128);
    if(i <= 0)
        eof();
    if(buf[0] == '!') {
        buf[i] = 0;
        ex(buf);
        continue;
    }
    write(fileno(tf), buf, i);
}

ex(bp)
char *bp;
{
    sigs(SIG_IGN);
    i = fork();
    if(i == 0) {
        sigs((int (*)())0);
        execl("/bin/sh", "sh", "-c", bp+1, 0);
        exit(0);
    }
    while(wait((int *)NULL) != i)
        ;
    printf("!\n");
    sigs(eof);
}
```

メッセージ送信中に先頭が `!` の行を入力すると、残りの文字列を `/bin/sh -c` で実行する。`!date` と入力すれば現在時刻を確認できる——チャット中にシェルを抜けずにコマンドを実行する「シェルエスケープ」だ。

`vi`、`ed`、`mail` など1970年代の Unix ツールに共通する慣習——`!` プレフィックスはシェルへの一時的な脱出を意味する。`write.c` もその系譜に従う。

実行後 `printf("!\n")` でシェルから戻ったことを示す。ed（#067）の `!` コマンドと同じシグナルだ。

---

## `sigs()` と `eof()`——シグナル管理の一括化

```c
int signum[] = {SIGHUP, SIGINT, SIGQUIT, 0};

sigs(sig)
int (*sig)();
{
    register i;
    for(i=0; signum[i]; i++)
        signal(signum[i], sig);
}

eof()
{
    fprintf(tf, "EOF\n");
    exit(0);
}
```

`sigs()` は SIGHUP・SIGINT・SIGQUIT の3つを一括で同じハンドラに設定するユーティリティ関数だ。`sigs(eof)` で3つのシグナルをすべて `eof()` に向ける。Ctrl+C でも端末切断でも "EOF\n" を相手端末に送ってから終了する——相手が `write` が終了したことを知れる。

`sigs(SIG_IGN)` でシェルエスケープ中のシグナルを無視し、終了後 `sigs(eof)` で戻す——3関数の切り替えが `sigs()` 1つで済む設計だ。

---

## `#ifdef interdata`——Interdata ミニコンピュータへの対応

```c
fprintf(tf, "Message from ");
#ifdef interdata
fprintf(tf, "(Interdata) " );
#endif
fprintf(tf, "%s %s...\n", me, mytty);
```

コンパイル時に `interdata` マクロが定義されていると、送信者情報に `"(Interdata) "` が挿入される。Interdata は1970年代に存在したミニコンピュータメーカー——Unix が複数のハードウェアに移植されていた時代の痕跡だ。

異なるアーキテクチャのマシン同士が同じネットワークに繋がり、どのマシンからのメッセージかを識別する必要があった。1行のコンパイル条件分岐がその時代を証言する。

---

## 鑑定

```
初版           : Bell-32V Unix（1979年）
実装           : C（183行）
mesg n/y       : stbuf.st_mode & 02——1ビットがメッセージ受信の可否を制御
write -        : him=="-"で全utmpエントリを対象——wall(1)の原型が内蔵
alarm(5)       : ttyオープンの5秒タイムアウト——永遠には待たない
buf[0]=='!'    : シェルエスケープ——ed/vi/mailと同じ慣習
sigs()         : SIGHUP/SIGINT/SIGQUITを一括切り替えるユーティリティ関数
eof()          : "EOF\n"を送信してから終了——相手への終了通知
#ifdef interdata: Interdataミニコンへのコンパイル条件分岐——マルチプラットフォームの痕跡
me[10]="???"   : utmpでユーザー名が見つからない場合のデフォルト
後継           : wall(1)、talk(1)、write(1)の現代版
```

**`write.c` は「端末間の声」だ。**

183行の中に、1ビットのパーミッションで受信可否を制御する設計、全員への一斉送信を `-` 1文字で表現する発明、チャット中のシェルエスケープ——端末が「物理的な場所」だった時代のコミュニケーションツールが揃っている。`mesg n` の仕組みは今日のUnixでも同じ原理で動く。init.c（#105）が `/etc/utmp` に書いた端末情報を、who.c（#096）が読み、write.c が送信先の特定に使う——1979年のUnixは `utmp` を中心に回っていた。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
