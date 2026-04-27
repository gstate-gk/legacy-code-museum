# `nouser = {"", "nope"}`——存在しないユーザーに必ず失敗する偽パスワードを与え、`/etc/utmp` に書いて `who` に伝えるloginの149行

## はじめに

```c
struct passwd nouser = {"", "nope"};
```

ユーザー名が `/etc/passwd` に存在しない場合、`pwd = &nouser` が使われる。パスワードフィールドは `"nope"` ——`crypt()` でどんな入力を渡しても一致しない文字列だ。ユーザー名の有無を攻撃者に悟らせない、1979年の静かな防衛。Bell-32V の `login.c` は149行。

`login` は `who`（#096）と対になる——`who` が `/etc/utmp` を読んで「今誰がいるか」を表示するとき、そのデータを書いたのは `login` だ。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

---

## `nouser = {"", "nope"}`——タイミング攻撃を防ぐ偽ユーザー

```c
struct passwd nouser = {"", "nope"};

setpwent();
if ((pwd = getpwnam(utmp.ut_name)) == NULL)
    pwd = &nouser;
endpwent();
if (*pwd->pw_passwd != '\0') {
    namep = crypt(getpass("Password:"), pwd->pw_passwd);
    if (strcmp(namep, pwd->pw_passwd)) {
        printf("Login incorrect\n");
        goto loop;
    }
}
```

存在しないユーザー名を入力しても、コードは `"Password:"` プロンプトを表示してから失敗する。`nouser.pw_passwd = "nope"` は有効な `crypt()` ハッシュではないため、どんなパスワードを入力しても `strcmp` は一致しない。

「存在しないユーザーなら即座に "Login incorrect"」とせず、パスワード入力まで待つことで、攻撃者はユーザー名の有効性を応答速度から判定できない。

`*pwd->pw_passwd != '\0'` のチェック——パスワードフィールドが空（`""`）なら認証なしでログインできる。ゲストアカウントや特殊ユーザーの設定だ。

---

## `alarm(60)`——60秒で強制終了するログインタイムアウト

```c
alarm(60);
signal(SIGQUIT, SIG_IGN);
signal(SIGINT, SIG_IGN);
/* ... ログイン処理 ... */
alarm(0);  /* 成功時にキャンセル */
```

`main()` の冒頭で `alarm(60)` を設定する——60秒以内にログインが完了しなければ `SIGALRM` でプロセスが終了する。SIGQUIT と SIGINT は無視（ログイン画面から抜けられないように）。

成功してシェルを起動する直前に `alarm(0)` でキャンセルする。`alarm(60)` と `alarm(0)` が149行の両端を挟む対称な構造だ。

---

## `nice(-100); nice(20); nice(0)`——3段階の優先度リセット

```c
nice(-100);
nice(20);
nice(0);
```

3つの連続した `nice()` 呼び出し。旧Unix の `nice(n)` は現在のnice値に `n` を加算する：

- `nice(-100)`: rootなら最高優先度（-20相当）、非rootなら0のまま
- `nice(20)`: +20して、rootなら0（通常）、非rootなら20（最低）
- `nice(0)`: 変化なし

結果：**rootが呼び出せば通常優先度、一般ユーザーが呼び出せば最低優先度**になる。`getty` が残した優先度を正規化し、ログイン処理がCPUを占有しないよう保証する。

---

## `for (t=3; t<20; t++) close(t)`——継承したファイル記述子を全て閉じる

```c
for (t=3; t<20; t++)
    close(t);
```

fd 0（stdin）、fd 1（stdout）、fd 2（stderr）を除く全ての継承ファイル記述子を閉じる。上限が20なのはBell-32Vの `NOFILE=20`——プロセスが開けるファイル数の上限だ。`close()` は存在しないfdに対して無害に失敗するため、ループで全部試す。

---

## `/etc/utmp` と `/usr/adm/wtmp`——`who`（#096）との producer-consumer

```c
time(&utmp.ut_time);
t = ttyslot();
if (t>0 && (f = open("/etc/utmp", 1)) >= 0) {
    lseek(f, (long)(t*sizeof(utmp)), 0);
    SCPYN(utmp.ut_line, rindex(ttyn, '/')+1);
    write(f, (char *)&utmp, sizeof(utmp));
    close(f);
}
if (t>0 && (f = open("/usr/adm/wtmp", 1)) >= 0) {
    lseek(f, 0L, 2);
    write(f, (char *)&utmp, sizeof(utmp));
    close(f);
}
```

`login` は2つのファイルに `struct utmp` を書く：

- `/etc/utmp` — **現在のログインユーザー**。`who`（#096）が `fread()` で読む。`ttyslot()` が端末番号を返し `lseek()` でその位置に上書きする——インデックスアクセス
- `/usr/adm/wtmp` — **ログイン履歴**。`lseek(f, 0L, 2)` でファイル末尾に追記——`last(1)` コマンドが読む

`SCPYN(utmp.ut_line, rindex(ttyn, '/')+1)` — `rindex(ttyn,'/')` で最後の `/` を見つけ `+1` でデバイス名を取り出す（`/dev/tty5` → `tty5`）。who.c（#096）の `rindex(tp,'/')+1` と同じイディオムだ。

---

## `environ = envinit`——環境変数ごと置き換える

```c
char homedir[64] = "HOME=";
char *envinit[] = {homedir, "PATH=:/bin:/usr/bin", 0};

environ = envinit;
strncat(homedir, pwd->pw_dir, sizeof(homedir)-6);
```

シェル起動直前に `environ` ポインタ自体を `envinit` で置き換える——継承した環境変数を**全て捨てる**。新しい環境は `HOME=<ホームディレクトリ>` と `PATH=:/bin:/usr/bin` の2つだけだ。

`PATH=:/bin:/usr/bin` の先頭コロン——空文字列は「カレントディレクトリ」を意味する。1979年のデフォルト `PATH` はカレントディレクトリを先頭に含んでいた。

---

## `strcat(minusnam, namep)`——先頭ダッシュでログインシェルを起動

```c
char minusnam[16] = "-";

if ((namep = rindex(pwd->pw_shell, '/')) == NULL)
    namep = pwd->pw_shell;
else
    namep++;
strcat(minusnam, namep);
/* ... */
execlp(pwd->pw_shell, minusnam, 0);
```

`pwd->pw_shell = "/bin/sh"` なら `namep = "sh"`、`minusnam = "-sh"` になる。`execlp()` の第2引数（argv[0]）を `"-sh"` とすることで、シェルは「ログインシェルとして起動された」と認識してプロファイルを読む——Unix の歴史的な慣習だ。

---

## `showmotd()`——Ctrl+Cで読み飛ばせるMessage of the Day

```c
int stopmotd;

catch()
{
    signal(SIGINT, SIG_IGN);
    stopmotd++;
}

showmotd()
{
    FILE *mf;
    signal(SIGINT, catch);
    if((mf = fopen("/etc/motd","r")) != NULL) {
        while((c = getc(mf)) != EOF && stopmotd == 0)
            putchar(c);
        fclose(mf);
    }
    signal(SIGINT, SIG_IGN);
}
```

`/etc/motd`（message of the day）を表示する。Ctrl+C（SIGINT）で `catch()` が呼ばれ `stopmotd++` するとループを脱出——読み飛ばし可能。`stopmotd` はグローバルなフラグで、シグナルハンドラとメインループが共有する古典的な設計だ。

---

## 鑑定

```
初版       : Bell-32V Unix（1979年）
実装       : C（149行）
nouser     : {"", "nope"}——常に失敗する偽ユーザー（タイミング攻撃対策）
alarm(60)  : 60秒タイムアウト、alarm(0)が両端を挟む対称構造
nice×3     : (-100)+(20)+(0)でrootは通常/非rootは最低優先度に正規化
fd close   : for(t=3;t<20;t++) close(t)——NOFILE=20まで全継承fdを閉じる
utmp書き込み: ttyslot()でインデックス→lseek→write（who.cのproducer）
wtmp追記   : lseek(f,0L,2)でファイル末尾に追記（last(1)コマンドの源）
environ置換: 環境変数を全破棄してHOME+PATHの2変数のみで再構築
PATH      : ":/bin:/usr/bin"——先頭コロンがカレントディレクトリ
minusnam  : "-sh"でログインシェルをシグナル
showmotd(): stopmotdフラグでCtrl+C読み飛ばし
後継       : PAM(Pluggable Authentication Module)、shadow password
```

**`login.c` は「認証の原型」だ。**

149行の中に、偽ユーザーによるタイミング攻撃対策、60秒タイムアウト、継承ファイル記述子のクリーンアップ、2ファイルへの utmp 書き込み、環境変数の完全置換——セキュリティ設計の基本要素が全て揃っている。`nouser = {"", "nope"}` は「正しい答えを返さないことで情報を守る」原則だ。who.c（#096）が読み、login.c が書く——1979年の Unix は producer-consumer の対称性でシステムを設計していた。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
