# `setgid()` の後に `setuid()`——rootを手放す前にグループを変える順序と、`execl(shell,"su",0)` でログインシェルにならない45行

**Bell Telephone Laboratories / Bell-32V Unix** | **1979年** | **C**

---

## はじめに

```c
setgid(pwd->pw_gid);
setuid(pwd->pw_uid);
execl(shell, "su", 0);
```

たった3行が `su` の本体だ。`setgid()` を先に呼び、`setuid()` を後で呼ぶ——順序を逆にするとグループの変更が失敗する。Bell-32V の `su.c` は45行。`login.c`（#102）・`passwd.c`（#103）と並ぶ認証3部作の末尾だ。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

---

## `setgid()` の後に `setuid()`——順序が命の特権降格

```c
setgid(pwd->pw_gid);  /* 先にグループを変える */
setuid(pwd->pw_uid);  /* 後でユーザーを変える */
```

`setuid()` を先に呼ぶと root 権限を失う。root でなくなった後では `setgid()` は自分のグループにしか変更できない——目的のグループへの変更が失敗する。`setgid()` を先に呼べば root のまま任意のグループに変更でき、その後 `setuid()` で root を手放す。

1行の順序がシステムセキュリティに直結する——特権降格の鉄則だ。現代の Linux でも `setgroups()`/`setgid()`/`setuid()` の順序はセキュリティドキュメントで繰り返し強調される。

---

## `getuid() == 0`——root はパスワードなしで全員にsuできる

```c
if(pwd->pw_passwd[0] == '\0' || getuid() == 0)
    goto ok;
password = getpass("Password:");
if(badsw || (strcmp(pwd->pw_passwd, crypt(password, pwd->pw_passwd)) != 0)) {
    printf("Sorry\n");
    exit(2);
}
ok:
```

パスワード確認を飛ばす条件は2つ——対象ユーザーのパスワードが空（`'\0'`）か、呼び出し元が root（`getuid() == 0`）か。root は `su` に対してパスワードを入力しなくてよい。システム管理者が任意のユーザーとして作業できる設計だ。

`goto ok` の1行が root の全権を表現している。`login.c` の `nouser = {"", "nope"}` が「誰でも同じ経路」を目指したのとは逆に、`su.c` は root を明示的に特別扱いする。

---

## `execl(shell, "su", 0)`——`"-su"` でなく `"su"`、ログインシェルにならない

```c
execl(shell, "su", 0);   /* su.c の起動方法 */
```

```c
execlp(pwd->pw_shell, minusnam, 0);  /* login.c の起動方法（minusnam = "-sh"） */
```

`login.c` は `argv[0]` を `"-sh"` にしてシェルを起動する——先頭のダッシュがシェルに「ログインシェルとして起動された」と伝え、`.profile` や `ENV` を読み込ませる。

`su.c` は `argv[0]` を `"su"` として起動する——ログインシェルにならない。環境変数もホームディレクトリも変わらない。`su` した後も元のユーザーの環境が残る。現代の `su -` に相当するオプションは1979年の `su.c` には実装されていない。

---

## `badsw = 0`——宣言されて永遠に0のまま、未実装スイッチの痕跡

```c
int badsw = 0;
/* ... badsw は一度も変更されない ... */
if(badsw || (strcmp(pwd->pw_passwd, crypt(password, pwd->pw_passwd)) != 0)) {
    printf("Sorry\n");
    exit(2);
}
```

`badsw` は `int badsw = 0` と初期化され、その後一度も変更されない。`if(badsw || ...)` は常に `if(0 || ...)` と等価——`badsw` は条件分岐に影響しない死んだ変数だ。

名前の `badsw` は "bad switch" の略だろう——オプション解析時に不正なフラグが渡されたら立てるはずだったフラグ。`passwd.c` に `insist` があるように、`su.c` にも `-f`（force）や `-`（login shell）オプションを追加する計画があったのかもしれない。45行の中に未実装の設計意図が残っている。

---

## exit コードの3段階——`passwd.c` の「成功も exit(1)」との対比

```c
exit(1);  /* Unknown id */
exit(2);  /* Sorry（パスワード不一致） */
exit(3);  /* No shell */
```

`passwd.c`（#103）は成功時も `exit(1)` だった——goto迷路の副産物。`su.c` は失敗理由を3段階に分けて報告する。`su` を呼び出すスクリプトが終了コードで失敗種別を判定できる。正常終了は `execl()` が成功すれば `su` プロセス自体が置き換わるため、exit コードは存在しない。

---

## 鑑定

```
初版         : Bell-32V Unix（1979年）
実装         : C（45行）
setgid→setuid: 特権降格の順序——逆にするとグループ変更が失敗
goto ok      : pw_passwd[0]=='\0' || getuid()==0 → パスワードスキップ
execl("su")  : argv[0]="su"（非ログインシェル）——login.cのminusnam="-sh"と対照的
badsw        : 初期化されて永遠に0——未実装スイッチの痕跡（dead code）
exit 1/2/3   : 失敗理由を3種類に分類——passwd.cの「成功も exit(1)」と対比
後継         : sudo（1980年代〜）、PAM su、polkit
```

**`su.c` は「最小の特権委譲」だ。**

45行の中に、setgid→setuidの鉄則、rootの全権、ログインシェルにならない設計、未実装の痕跡——特権委譲の本質が詰まっている。`login.c` がセッションの「開始」を担い、`passwd.c` が認証情報の「更新」を担い、`su.c` が実行中の「昇格と降格」を担う。1979年の Unix は認証を3つの独立したプログラムに分割した。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
