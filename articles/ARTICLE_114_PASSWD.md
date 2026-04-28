# `salt & 077`——time()+getpid()を6ビットに刻み`+7`/`+6`でASCII塩文字に変換し、`/etc/ptmp` で守るpasswdの140行

**Bell Telephone Laboratories / Bell-32V Unix** | **1979年** | **C**

---

## はじめに

```c
time(&salt);
salt += getpid();

saltc[0] = salt & 077;
saltc[1] = (salt>>6) & 077;
for(i=0;i<2;i++){
    c = saltc[i] + '.';
    if(c>'9') c += 7;
    if(c>'Z') c += 6;
    saltc[i] = c;
}
pw = crypt(pwbuf, saltc);
```

`time()` と `getpid()` を足してランダム性を得、`& 077` で6ビットに刻み、`+7`/`+6` のジャンプで crypt() が受け付けるソルト文字集合にマップする。Bell-32V の `passwd.c` は140行。`login.c` が読む `/etc/passwd` を書き換えるプログラムだ。

---

## 発掘されたコード

- **オリジナル**: Bell Telephone Laboratories
- **参照先**: dspinellis/unix-history-repo Bell-32V-Snapshot-Development ブランチ
- **実装言語**: C
- **年**: Bell-32V版（1979年）

---

## `salt & 077`——6ビットと`+7`/`+6`ジャンプのソルト生成

```c
saltc[0] = salt & 077;      /* 0〜63 */
saltc[1] = (salt>>6) & 077; /* 0〜63 */
for(i=0;i<2;i++){
    c = saltc[i] + '.';  /* '.' = ASCII 46、範囲 46〜109 */
    if(c>'9') c += 7;    /* ':'';<=>?@'の7文字を跳ぶ */
    if(c>'Z') c += 6;    /* '[\\]^_`'の6文字を跳ぶ */
    saltc[i] = c;
}
```

`crypt()` のソルトに使える文字は64種——`.`、`/`、`0-9`（10）、`A-Z`（26）、`a-z`（26）。ASCII上で連続していないため、`'9'` と `'A'` の間（`:;<=>?@` の7文字）と、`'Z'` と `'a'` の間（`[\]^_\`` の6文字）を跳ぶ必要がある。

`salt & 077` は6ビットマスク——077は8進数で63、2進数で `0b111111`。6ビット×2で12ビット、64×64＝4096通りのソルトが生まれる。同じパスワードでも4096通りの異なるハッシュになる——辞書攻撃を4096倍難しくする1979年の設計だ。

---

## `access(temp, 0) >= 0`——`/etc/ptmp` ロックと割り込み禁止

```c
signal(SIGHUP, SIG_IGN);
signal(SIGINT, SIG_IGN);
signal(SIGQUIT, SIG_IGN);

if(access(temp, 0) >= 0) {
    printf("Temporary file busy -- try again\n");
    goto bex;
}
close(creat(temp, 0600));  /* ロックファイル作成 */
if((tf=fopen(temp,"w")) == NULL) {
    printf("Cannot create temporary file\n");
    goto bex;
}
/* ... 書き換え処理 ... */
out:
    unlink(temp);  /* ロック解除 */
```

`/etc/ptmp` が存在すれば他の `passwd` プロセスが動いている——"Temporary file busy" として諦める。存在しなければ `creat()` でロックファイルを作り書き換えを開始する。

シグナルを3つ無視するのは書き換え途中での中断を防ぐため。`SIGHUP`（端末切断）、`SIGINT`（Ctrl+C）、`SIGQUIT`（Ctrl+\\）どれが来ても `/etc/ptmp` を書き続ける。`unlink(temp)` はエラー時も正常時も `out:` ラベルで必ず実行される。

現代の `rename()` による原子的置き換えはまだない——`read()/write()` のループで手動コピーする方式だ。

---

## `flags >= 7 && pwlen >= 4`——bitORで文字種を分類する1979年のパスワード品質検査

```c
ok = 0;
flags = 0;
p = pwbuf;
while(c = *p++){
    if(c>='a' && c<='z') flags |= 2;   /* 小文字 */
    else if(c>='A' && c<='Z') flags |= 4;   /* 大文字 */
    else if(c>='0' && c<='9') flags |= 1;   /* 数字 */
    else flags |= 8;                         /* 記号 */
}
if(flags >= 7 && pwlen >= 4) ok = 1;        /* 3種類以上: 4文字でOK */
if(((flags==2)||(flags==4)) && pwlen >= 6) ok = 1;  /* 1種類のみ: 6文字必要 */
if(((flags==3)||(flags==5)||(flags==6)) && pwlen >= 5) ok = 1;  /* 2種類: 5文字必要 */
```

`flags >= 7` は `1+2+4=7`——数字・小文字・大文字の3種類がすべて揃った状態。bitORで文字種を4ビットに圧縮し、その値で複雑度を判定する。「文字の多様性」という概念をビット演算に落とした設計だ。

`insist` カウンタで2回まで再入力を促し、それでも弱いパスワードなら受け付ける——`insist < 2` を超えると `ok == 0` のままでも通過する。強制はしない。

---

## `getpwent()` を2回呼ぶ——認証フェーズと書き換えフェーズの分離

```c
/* 第1パス: 認証 */
while(((pwd=getpwent()) != NULL) && (strcmp(pwd->pw_name,uname)!=0));
endpwent();
/* ... 旧パスワード確認 ... */

/* 第2パス: 全行書き換え */
while((pwd=getpwent()) != NULL) {
    if(strcmp(pwd->pw_name,uname) == 0) {
        pwd->pw_passwd = pw;  /* 新ハッシュで上書き */
    }
    fprintf(tf,"%s:%s:%d:%d:%s:%s:%s\n", ...);
}
endpwent();
```

`getpwent()` はファイルを順に読む。第1パスで対象ユーザーを見つけて認証し、`endpwent()` でファイルポインタをリセット。第2パスで全行を `/etc/ptmp` に書き出し、該当行だけ新ハッシュに差し替える。

`/etc/passwd` はデータベースではなくテキストファイル——特定行だけ更新する手段がなく、全行の書き直しが必要だ。第2パスの中でも `u != 0 && u != pwd->pw_uid` を再確認する——認証後の権限検査の二重化だ。

---

## 成功しても `exit(1)`——`goto bex` の迷路

```c
/* 正常完了のパス */
while((u=read(fi,buf,sizeof(buf))) > 0) write(fo,buf,u);
/* fallthrough */
out:
    unlink(temp);
/* fallthrough */
bex:
    exit(1);  /* ← 成功時も exit(1) */
```

エラーはすべて `goto bex` で終端する。正常完了も `out:` から `bex:` へ落ちて同じ `exit(1)` に到達する。成功時の終了コードは1——失敗と区別がない。

1979年の Unix では `exit(0)` が成功の慣習として完全には定着していなかった。あるいは `goto` の連鎖で正常パスに `exit(0)` を置き忘れた。どちらにせよ、呼び出し側は `passwd` の終了コードを信頼できない。

---

## 鑑定

```
初版       : Bell-32V Unix（1979年）
実装       : C（140行）
ソルト生成 : time()+getpid() → & 077（6ビット）→ +7/+6ジャンプでASCII塩文字に変換
品質検査   : flags bitOR（4ビット）で文字種分類、insist<2 で最大2回再入力
ロック     : /etc/ptmp の存在確認→creat→unlink（access/creat/unlink 3点セット）
シグナル   : SIGHUP/SIGINT/SIGQUIT を SIG_IGN で無視（書き換え中断防止）
2パス      : getpwent() × 2回（認証 + 全行書き直し）
exit(1)    : 成功時も失敗時も同じ終了コード——gotoの迷路の副産物
後継       : shadow password（/etc/shadow 分離）、PAM（Pluggable Authentication Module）
```

**`passwd.c` は「書き換えの原型」だ。**

認証して、品質を確認し、ロックして、全行書き直す——140行がパスワード変更の全手順を実装している。`salt & 077` の6ビットマスクと `+7/+6` のジャンプは crypt() のソルト文字集合をASCIIの隙間から拾い出す精密な計算だ。`login.c`（#102）が `/etc/passwd` を読み、`passwd.c` が書く——1979年の Unix はファイルの producer と consumer を別プログラムとして分けた。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
