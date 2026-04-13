# Cで書いたAlgol——Bourneの手癖が今日の/bin/shを作った

## はじめに

GitHubにUnixの全歴史がある。

**dspinellis/unix-history-repo**。Diomidis Spinellisがスキャン画像や論文から復元した、1970年から現在までの連続したUnixコミット履歴だ。⭐7,215。Bell-32VブランチにはBell Labs 1979年当時のソースが丸ごと入っている。

その中に `usr/src/cmd/sh/` がある。**Steve BourneがBell Telephone Laboratoriesで書いたシェル**——Unix V7に同梱され、1979年に世界に配布された。このコードが今日の `/bin/sh` の直接の祖先だ。

コードを開いた瞬間、目を疑う。

```c
IF c>0 ANDF any('r', *v) THEN rflag=0 FI
```

これはCだ。しかし見た目はCではない。

---

## 発掘されたコード

- **リポジトリ**: [dspinellis/unix-history-repo](https://github.com/dspinellis/unix-history-repo)（Bell-32V-Snapshot-Development ブランチ）
- **スター数**: 7,215
- **実装言語**: C
- **設計者**: Steve R. Bourne（Bell Telephone Laboratories）
- **収録バージョン**: Bell-32V（Unix V7のVAX移植版、1979年）

```
usr/src/cmd/sh/
├── main.c    # エントリーポイント
├── mac.h     # Algolスタイルマクロ定義（核心）
├── defs.h    # 全体定義
├── xec.c     # コマンド実行エンジン
├── word.c    # 字句解析・変数展開
├── name.c    # 変数管理（二分探索木）
├── expand.c  # ファイル名展開（グロブ）
├── io.c      # 入出力リダイレクション
├── cmd.c     # コマンド解析
└── ...       # 他18ファイル
```

---

## mac.h——Cで書いたAlgol

`mac.h`は28行のヘッダーファイルだ。しかしこの28行が、Bourne Shellコード全体の「文体」を決定している。

```c
/* mac.h — S. R. Bourne, Bell Telephone Laboratories */

#define IF    if(
#define THEN  ){
#define ELSE  } else {
#define ELIF  } else if (
#define FI    ;}

#define WHILE while(
#define DO    ){
#define OD    ;}

#define FOR   for(
#define SWITCH switch(
#define IN    ){
#define ENDSW }

#define BEGIN {
#define END   }
#define REP   do{
#define PER   }while(
#define DONE  );

#define ANDF  &&
#define ORF   ||
```

これにより、`xec.c`はこう書かれている。

```c
IF (t=argt) ANDF execbrk==0
THEN  REG INT type;
      SWITCH type IN

      case TCOM:
          IF argn ANDF (flags&noexec)==0
          THEN  IF flags&execpr
                THEN  WHILE com[argn]!=ENDARGS
                      DO prs(com[argn++]); blank() OD
                FI
          FI

      case SYSBREAK:
          IF (execbrk=loopcnt) ANDF a1
          THEN  breakcnt=stoi(a1);
          FI
          break;
FI
```

Cコンパイラにはこれが通常のCに見える。しかし人間が読むと、これはAlgol 68だ。

---

## なぜAlgolなのか

Steve Bourneは1970年代初頭、**Algol 68の実装者**だった。

Cambridge大学でAlgol 68のコンパイラを書き、その後Bell Labsに移った。彼はAlgolの思想で考え、Algolの構文で書く人間だった。Cに移ってもその習慣は変わらなかった——変えるつもりもなかった。

Cには`if(...){...}`と書く。Bourneは`IF ... THEN ... FI`と書きたかった。マクロで解決した。

この設計についてDennis Ritchieは快く思っていなかった、と伝えられている。しかしBourneのマクロは動いた。コードはコンパイルされ、シェルは動作した。

ただし皮肉がある。**シェル言語の構文自体も、Algolそのものだ。**

```sh
if [ "$x" -gt 0 ]; then
    echo "positive"
elif [ "$x" -eq 0 ]; then
    echo "zero"
else
    echo "negative"
fi                      # ← fi = "if"の逆さ読み

case "$1" in
    start) ;;
    stop)  ;;
esac                    # ← esac = "case"の逆さ読み

while [ $i -lt 10 ]; do
    i=$((i+1))
done
```

`fi`は`if`の逆さ読み。`esac`は`case`の逆さ読み。Algol 68はブロックを`begin/end`で閉じるが、Bourneは各キーワードの逆読みで閉じた。C実装でも、シェル言語でも、彼はAlgolの宇宙の中にいた。

---

## 変数は二分探索木に住んでいる

`name.h`の`namnod`構造体は、変数管理の設計を示している。

```c
/* name.h — シェル変数の格納構造 */
struct namnod {
    NAMPTR  namlft;   /* 左子ノード */
    NAMPTR  namrgt;   /* 右子ノード */
    STRING  namid;    /* 変数名 */
    STRING  namval;   /* 変数値 */
    STRING  namenv;   /* 環境変数としての値 */
    INT     namflg;   /* N_RDONLY / N_EXPORT フラグ */
};
```

変数は**二分探索木**に格納される。`export VAR`を実行すると`N_EXPORT`フラグが立ち、`namenv`に値がコピーされ、子プロセス起動時に`execve()`に渡される。`readonly VAR`は`N_RDONLY`フラグで代入を拒否する。

`name.c`の先頭には、初期状態の木がハードコードされている。

```c
NAMNOD  ps2nod  = { NIL, NIL,     ps2name  },  /* PS2  */
        fngnod  = { NIL, NIL,     fngname  },  /* FIGNORE */
        pathnod = { NIL, NIL,     pathname },  /* PATH */
        ifsnod  = { NIL, NIL,     ifsname  },  /* IFS  */
        ps1nod  = { &pathnod, &ps2nod,  ps1name  },  /* PS1  */
        homenod = { &fngnod,  &ifsnod,  homename },  /* HOME */
        mailnod = { &homenod, &ps1nod,  mailname };  /* MAIL */
```

`$PATH`、`$HOME`、`$PS1`、`$PS2`、`$IFS`、`$MAIL`——これらすべてがBourne Shellで初めて定義された変数だ。今日のLinuxで`echo $PATH`と打つとき、その仕組みはこの木から始まっている。

---

## Bourne Shellが発明したもの

1979年以前の**Thompson Shell**（1971年）にはスクリプト機能がほとんどなかった。Bourne Shellが持ち込んだものは多い。

```sh
# 位置パラメータ（今も完全に同じ）
$1  $2  $3 ...  # 引数
$@              # 全引数リスト
$*              # 全引数を1文字列に
$#              # 引数の個数
$?              # 直前コマンドの終了コード
$$              # 現在のシェルのPID
$!              # バックグラウンドジョブのPID

# ヒアドキュメント（1979年から変わらない構文）
cat <<EOF
Hello, World.
This is here-document.
EOF

# コマンド置換
today=`date +%Y-%m-%d`
```

`$?`、`$$`、`$!`——これらは1979年のコードが定義した記法だ。45年後の今日、まったく同じ記法がすべてのPOSIXシェルで動いている。

---

## bashはBourneの再来

1989年、Brian FoxはGNUプロジェクトのためにBourne Shell互換のシェルを書いた。

名前は**bash**——**B**ourne **A**gain **SH**ell。「Bourneをもう一度」という名前自体が、Bourne Shellへの最大の敬意だ。

ksh（Korn Shell, 1983）、zsh（1990）、dash（2002）——Bourneの後継たちはすべて、1979年のインターフェースを基準にした。`if...then...fi`の構文を変えたシェルは一つもない。`$?`の意味を変えたシェルもない。

今日のDockerfileの`RUN`、GitHub Actionsのワークフロー、サーバーの`cron`スクリプト——すべてはBourne Shellの上に立っている。

---

## 鑑定

```
リポジトリ : dspinellis/unix-history-repo（Bell-32V branch）
言語       : C（Algolスタイルマクロ使用）
誕生       : 1979年、AT&T Bell Labs、Unix V7
設計者     : Steve R. Bourne
前身       : Thompson Shell（1971）
後継       : ksh（1983）、bash（1989）、zsh（1990）、dash（2002）
核心技術   : mac.h（Algolマクロ）、namnod二分探索木、変数展開
現在       : すべてのPOSIXシェルの共通祖先、/bin/sh として生存
```

BourneはAlgolの人間だった。Cを書いても、シェルを設計しても、彼の思考はAlgolで動いていた。`mac.h`の28行はその証拠だ——Cのコンパイラには通常のコードに見えるが、Bourneの目にはAlgolが見えていた。

シェル言語の`fi`と`esac`はその二重性の象徴だ。実装（C）でも言語（sh）でも、Bourneは同じ宇宙にいた。

45年後、その宇宙は `/bin/sh` という名前で、すべてのLinuxサーバーで起動し続けている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
