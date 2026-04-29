# `#define EVER ;;`——shutdown→single→runcom→merge→multipleの状態機械、setjmp/longjmpでSIGHUPをリセットに変えるinit.cの302行

**Bell Telephone Laboratories / Bell-32V Unix** | **1979年** | **C**

---

## はじめに

```c
#define ALL   p = &itab[0]; p < &itab[TABSIZ]; p++
#define EVER  ;;

main()
{
    int reset();

    setjmp(sjbuf);
    signal(SIGHUP, reset);
    for(EVER) {
        shutdown();
        single();
        runcom();
        merge();
        multiple();
    }
}
```

`for(EVER)` は `for(;;)` だ。`#define EVER ;;` でセミコロン2つに名前をつける。`for(ALL)` は `itab[0]` から `itab[TABSIZ]` まで全エントリを走査するforループの本体を1行のマクロに収める。Bell-32V の `init.c` は302行——すべてのプロセスの親、PID 1 の全体だ。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

---

## `setjmp` と `longjmp`——SIGHUPをプロセス再起動ではなく状態リセットに変える

```c
jmp_buf sjbuf;

main()
{
    setjmp(sjbuf);       /* この地点をリセット先として記憶 */
    signal(SIGHUP, reset);
    for(EVER) { ... }
}

reset()
{
    longjmp(sjbuf, 1);   /* main() の setjmp 直後に戻る */
}
```

`SIGHUP` が届くと `reset()` が呼ばれ、`longjmp()` で `main()` の `setjmp(sjbuf)` 直後に制御が戻る。`for(EVER)` の先頭から再実行される——`init` プロセス自体は死なず、状態機械を最初からやり直す。

`init` を再起動できない——PID 1 を kill すればシステムが崩壊する。だから `setjmp/longjmp` で「プロセスを死なせずに初期化する」仕組みを実装した。`kill -HUP 1` が「設定の再読み込み」を意味する慣習はここから始まった。

---

## shutdown→single→runcom→merge→multiple——5段階の状態機械

```c
for(EVER) {
    shutdown();   /* 全プロセスをKILL */
    single();     /* シングルユーザーシェル */
    runcom();     /* /etc/rc を実行 */
    merge();      /* /etc/ttys を読んでテーブル同期 */
    multiple();   /* マルチユーザーループ */
}
```

5つの関数がブート手順を表現する：

- `shutdown()` — 全子プロセスに `SIGKILL` を5回送り `wait()` で回収。60秒タイムアウト付き
- `single()` — `/dev/console` でシングルユーザーシェルを起動し完了を待つ
- `runcom()` — `/bin/sh /etc/rc` を実行。"rc" は "run commands" の略——現代の `/etc/rc.local` の原型
- `merge()` — `/etc/ttys` を読み、`itab[]` テーブルと同期。新しい端末は `dfork()` で getty を起動
- `multiple()` — 子プロセスの終了を `wait()` で待ち続ける。getty が死んだら `dfork()` で再起動

`multiple()` が `-1` を返す（子がいない）と `for(EVER)` の先頭に戻り `shutdown()` から再実行される。

---

## `#define ALL`——for ループの本体をマクロに収める

```c
#define TABSIZ  100
#define ALL     p = &itab[0]; p < &itab[TABSIZ]; p++

register struct tab *p;

for(ALL)
    if(p->pid == pid || p->pid == -1) { ... }
```

`for(ALL)` は展開すると `for(p = &itab[0]; p < &itab[TABSIZ]; p++)` になる。全100端末エントリの走査を短い名前で書く——読む者に「全エントリを対象とする」意図を伝えるマクロだ。

`TABSIZ = 100` は同時に管理できる端末の上限。1979年のUnixが想定するシステム規模だ。

---

## `/*alarm(300);*/`——コメントアウトされたシングルユーザータイムアウトの痕跡

```c
single()
{
    register pid;

    pid = fork();
    if(pid == 0) {
/*
        alarm(300);
*/
        signal(SIGHUP, SIG_DFL);
        signal(SIGINT, SIG_DFL);
        signal(SIGALRM, SIG_DFL);
        open(ctty, 2);
        dup(0); dup(0);
        execl(shell, minus, (char *)0);
        exit(0);
    }
    while(wait((int *)0) != pid)
        ;
}
```

コメントアウトされた `alarm(300)` — 5分でシングルユーザーシェルを強制終了する仕組みが設計されていた。コメントアウトして無効化された。シングルユーザーモードでの作業が5分を超えることが多かったのか、あるいは `alarm` と `SIGALRM` をリセットするコードの複雑さを避けたのか——削除ではなくコメントアウトという形で設計意図が残っている。

`login.c`（#102）の `alarm(60)` と対照的だ——ログイン画面は60秒、シングルユーザーモードは「時間無制限」。

---

## `signal(SIGINT, merge)`——Ctrl+Cが `/etc/ttys` の再読み込みをトリガー

```c
merge()
{
    register struct tab *p, *q;

    close(creat(utmp, 0644));  /* /etc/utmp を初期化 */
    signal(SIGINT, merge);      /* SIGINT で再実行 */
    fi = open(ifile, 0);       /* /etc/ttys を開く */
    ...
}
```

`merge()` の先頭で `signal(SIGINT, merge)` を設定する——`SIGINT` が届くと `merge()` が再度呼ばれ `/etc/ttys` を再読み込みする。マルチユーザー動作中に端末設定を変更したとき、`kill -INT 1`（または `SIGHUP` 経由の完全リセット）で新しい端末を活性化できる。

`close(creat(utmp, 0644))` で `/etc/utmp` を空ファイルに初期化してから再構築を始める——`who`（#096）が読むファイルをクリーンな状態から再建する。

---

## `dfork()`——getty を fork して端末を有効にする

```c
dfork(p)
struct tab *p;
{
    register pid;

    pid = fork();
    if(pid == 0) {
        signal(SIGHUP, SIG_DFL);
        signal(SIGINT, SIG_DFL);
        maktty(p->line);
        chown(tty, 0, 0);
        chmod(tty, 0622);
        open(tty, 2);
        dup(0); dup(0);
        tty[0] = p->comn;
        tty[1] = 0;
        execl(getty, minus, tty, (char *)0);
        exit(0);
    }
    p->pid = pid;
}
```

`p->comn` は `/etc/ttys` の1文字——ボーレートを指定する。`tty[0] = p->comn; tty[1] = 0;` で1文字の文字列を作り `getty` の引数に渡す。`chown(tty, 0, 0)` と `chmod(tty, 0622)` で端末の所有者と権限を設定してから `open(tty, 2)` — `dup(0)` × 2 で stdin/stdout/stderr を端末に束ねる。

`execl(getty, minus, tty, ...)` の `minus` は `"-"` — `login.c` の `minusnam = "-sh"` と同じ慣習で、getty にログインプロセスとして起動されたと伝える。

---

## 鑑定

```
初版          : Bell-32V Unix（1979年）
実装          : C（302行）
EVER / ALL    : #defineで;;と全テーブル走査を命名——読めるコードへの意志
setjmp/longjmp: SIGHUP→reset()→longjmp()でPID 1を死なせずに状態リセット
状態機械      : shutdown→single→runcom→merge→multiple の5段階ループ
runcom()      : /bin/sh /etc/rc——/etc/rc.local の原型、"rc"="run commands"
alarm(300)    : コメントアウト——シングルユーザータイムアウトの未実装痕跡
signal(SIGINT,merge): Ctrl+C が /etc/ttys 再読み込みをトリガー
dfork()       : chown/chmod/open/dup/execl の起動シーケンスでgettyを有効化
rmut()        : lseek(-sizeof,1) で utmp を上書き、wtmp に追記（login.cと同じパターン）
後継          : sysvinit、upstart、systemd
```

**`init.c` は「すべての始まり」だ。**

302行の中に、プロセス管理の全原則が揃っている。`setjmp/longjmp` でSIGHUPを再起動ではなくリセットに変え、5段階の状態機械でブートシーケンスを表現し、`for(EVER)` と `for(ALL)` で意図を読めるコードに変える。login.c（#102）はユーザーセッションを開始し、passwd.c（#103）は認証情報を更新し、su.c（#104）は特権を委譲し、init.c はそれら全員の親として動き続ける——1979年のUnixはPID 1から始まる木構造でシステムを設計した。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
