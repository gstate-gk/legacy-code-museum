# インターネットメールの守門者——sendmail という30年の混沌

## はじめに

世界のすべてのメールは、一度は sendmail に触れた。

1981年、Eric Allman は UC Berkeley のワークステーションで、3つのネットワークが入り乱れる混沌の中でコードを書き始めた。ARPANET（大学・研究機関をつなぐ黎明期のインターネット）、UUCP（電話回線でつながるコンピュータ間転送）、そして BerkNet（Berkeley キャンパス内LAN）——これら3つのアドレス体系が共存し、互いに翻訳できる者がいなかった。

Allman は後にインタビューでこう言っている。

> 「There is some sort of perverse pleasure in knowing that it's basically impossible to send a piece of hate mail through the Internet without its being touched by a gay program.」

（インターネット上のヘイトメールが、ゲイのプログラムに触れなければ届かないというのには、ある種のねじれた喜びがある。）

---

## 発掘された痕跡

`weiss/original-bsd` リポジトリに、BSD Unix からの変換版ソースコードが残っている。`@(#)main.c 8.139 (Berkeley) 6/22/95` ——1983年の初版から積み重なった歴史が、リビジョン番号に刻まれている。

### 痕跡1：雇用主への自虐的な感謝

`main.c` の冒頭コメントに、Allman の人柄が凝縮されている。

```c
/*
**  SENDMAIL -- Post mail to a set of destinations.
**
**	Author:
**		Eric Allman, UCB/INGRES (until 10/81)
**			     Britton-Lee, Inc., purveyors of fine
**				database computers (from 11/81)
**			     Now back at UCB at the Mammoth project.
**		The support of the INGRES Project and Britton-Lee is
**			gratefully acknowledged.  Britton-Lee in
**			particular had absolutely nothing to gain from
**			my involvement in this project.
*/
```

「Britton-Lee は特に、私がこのプロジェクトに関わることから何も得るものがなかった。」

1981年10月、Allman は UCB/INGRES を離れ Britton-Lee 社に転職した。そして会社時間を使って sendmail を書き続けた。雇用主は会社の利益にならない OSS 開発を黙認していた。その事実を、著作権表示の直下に残した。

### 痕跡2：3つのネットワークが混在した時代

`parseaddr.c` の PARSEADDR 関数のコメントに、1981年のインターネットが見える。

```c
/*
**  PARSEADDR -- Parse an address
**
**	Parses an address and breaks it up into three parts: a
**	net to transmit the message on, the host to transmit it
**	to, and a user on that host.  These are loaded into an
**	ADDRESS header with the values squirreled away if necessary.
**	The "user" part may not be a real user; the process may
**	just reoccur on that machine.  For example, on a machine
**	with an arpanet connection, the address
**		csvax.bill@berkeley
**	will break up to a "user" of 'csvax.bill' and a host
**	of 'berkeley' -- to be transmitted over the arpanet.
```

`csvax.bill@berkeley`——このアドレス形式は、もはや誰も使わない。`.` で区切られたホスト名（UUCP 式）と `@` で区切られたドメイン名（ARPANET 式）が混在している。sendmail はこの「二つの世界」を自動的に判別し、適切なネットワークに転送した。

### 痕跡3：`M_UGLYUUCP`——正直すぎる命名

`sendmail.h` の mailer フラグ定義。

```c
# define M_UGLYUUCP	'U'	/* this wants an ugly UUCP from line */
```

UUCP の「From 」行（スペース付き）は、RFC 822 の標準フォーマットと互換性がない。それを「ugly（醜い）」と名付け、フラグ `'U'` で管理した。`M_EXPENSIVE`（「このメーラーを使うとコストがかかる」）というフラグも隣に並んでいる。

sendmail のコードには、エレガントな命名と率直すぎる命名が混在している。

### 痕跡4：`#error` がない時代のトリック

`main.c` に、奇妙なコードがある。

```c
#ifdef DAEMON
#ifndef SMTP
ERROR %%%%   Cannot have daemon mode without SMTP   %%%% ERROR
#endif /* SMTP */
#endif /* DAEMON */
```

`ERROR %%%%`——これはコードではない。コンパイル時に意図的に文法エラーを起こすためのトリックだ。

当時（1983年）、`#error` ディレクティブは ANSI C に含まれていなかった。Allman は「DAEMON モードは SMTP なしでは動かせない」という制約を、コンパイル時にチェックするために、意図的に不正な行を書いた。エラーメッセージはコンパイラが吐き出す「syntax error」の一部として表示される。

### 痕跡5：25以上の OS に対応した `conf.h`

`conf.h` は 1,697行。OSの種類ごとに `#ifdef` が並ぶ。

```c
/*
**  HP-UX -- tested for 8.07, 9.00, and 9.01.
**
**	If V4FS is defined, compile for HP-UX 10.0.
*/
```

HP-UX、SunOS、SCO Unix、IRIX、AIX、Solaris、Ultrix、OSF/1、NeXT、BSD、Linux、FreeBSD、NetBSD、Mach386、UNICOS（Cray のスーパーコンピュータ）、Apollo、UnixWare、NCR3000、Tandem NonStop、Hitachi HI-UX……。

「テーブルのサイズ等、変更する必要はほとんどないはず」というコメントに続いて、200 個のルール書き換えセット、25 個の mailer 定義、12 個のエイリアスデータベースが定義されている。1995 年時点の Unix エコシステムの全景がここにある。

### 痕跡6：BerkNet の `\@` 問題

`parseaddr.c` の PRESCAN 関数コメントに、実際の運用現場の苦労が透けて見える。

```c
/*
**  PRESCAN -- Prescan name and make it canonical
**
**	...There are certain subtleties to this routine.  The one that
**	comes to mind now is that backslashes on the ends of names
**	are silently stripped off; this is intentional.  The problem
**	is that some versions of sndmsg (like at LBL) set the kill
**	character to something other than @ when reading addresses;
**	so people type "csvax.eric\@berkeley" -- which screws up the
**	berknet mailer.
```

Lawrence Berkeley Laboratory（LBL）の `sndmsg` が `kill` キャラクターを `@` 以外に設定しているため、ユーザーが `csvax.eric\@berkeley` と打ってしまい、BerkNet mailer が壊れる——という、極めて具体的な運用トラブルが記録されている。

「`\@` は黙って取り除く」という仕様は、こうした現場の泥臭い問題から生まれた。

### 痕跡7：アドレス解析のステートマシン

`parseaddr.c` のメールアドレスパーサーは、6状態のステートマシンで実装されている。

```c
/* states and character types */
# define OPR		0	/* operator */
# define ATM		1	/* atom */
# define QST		2	/* in quoted string */
# define SPC		3	/* chewing up spaces */
# define ONE		4	/* pick up one character */
# define ILL		5	/* illegal character */

static short StateTab[NSTATES][NSTATES] =
{
   /*	oldst	chtype>	OPR	ATM	QST	SPC	ONE	ILL	*/
	/*OPR*/		OPR|B,	ATM|B,	QST|B,	SPC|MB,	ONE|B,	ILL|MB,
	/*ATM*/		OPR|B,	ATM,	QST|B,	SPC|MB,	ONE|B,	ILL|MB,
	/*QST*/		QST,	QST,	OPR,	QST,	QST,	QST,
	/*SPC*/		OPR,	ATM,	QST,	SPC|M,	ONE,	ILL|MB,
	/*ONE*/		OPR,	OPR,	OPR,	OPR,	OPR,	ILL|MB,
	/*ILL*/		OPR|B,	ATM|B,	QST|B,	SPC|MB,	ONE|B,	ILL|M,
};
```

`user@host`、`"First Last" <user@host>`、`user%relay@gateway`、`!uucp!host!user`——これら全てを一つのステートマシンで処理する。`B`（break）と `MB`（meta-break）のビットマスクで状態遷移を表現する手法は、1980年代のCプログラマーの美意識だ。

---

## 年表

**1981年3月**: Eric Allman、UCB/INGRES で「delivermail」として書き始める。ARPANET、UUCP、BerkNet の3ネットワーク統合を目標とする。

**1981年10月**: Allman、Britton-Lee 社に転職。会社の業務とは無関係に sendmail の開発を継続。

**1983年**: 4.1c BSD に同梱されて初めて一般配布。RFC 821（SMTP）準拠。

**1988年**: バージョン 5.x。多くのサイトで採用が始まる。

**1988年**:『sendmail』（Bryan Costales・Eric Allman 共著、O'Reilly）出版。通称「Bat Book」（コウモリ本）。初版 882ページ。sendmail.cf の「解読」に一冊が費やされた。

**1993年**: セキュリティ脆弱性の多発。Robert T. Morris（Morris Worm 作者）の worm はsendmail の脆弱性を利用した一つではない——だが sendmail はその後の標的になり続けた。

**1993年**: バージョン 8.0。Eric Allman が書き直し。現在も継続する 8.x 系の始まり。

**1998年**: sendmail 社設立。Allman が商用サポートを開始。

**2000年代**: Postfix（Wietse Venema 作、1998年）、Exim の台頭。多くのディストリビューションが sendmail から移行。

**現在**: sendmail 8.18.x（2024年）。40年以上、開発継続中。

---

## AI 解析データ

| 指標 | 値 |
|:---|---:|
| 実装言語 | C |
| 初版リリース日 | 1983年（4.1c BSD 同梱） |
| 起源 | delivermail（1981年、UCB/INGRES） |
| 作者 | Eric Allman（UC Berkeley） |
| main.c のリビジョン | 8.139（1995-06-22時点） |
| conf.h のリビジョン | 8.196（1995-06-21時点） |
| 対応 OS 数（conf.h） | 25以上 |
| sendmail.cf のルールセット最大数 | 200（MAXRWSETS） |
| O'Reilly 本の初版ページ数 | 882ページ |
| 現在のバージョン | 8.18.x（2024年） |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.059
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】sendmail (1983, C)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年4月

■ 鑑定結果
  希少度:          ★★☆☆☆
  技術的負債密度:    ★★★★★
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★☆☆☆

`weiss/original-bsd` リポジトリで全ソースが閲覧でき、現行の sendmail.org でも開発継続中。消えた伝説ではなく、現役——しかし設定ファイルを書ける者はほとんどいない。「コードは存在するが、読める者がいない」という希少性だ。

### 技術的負債密度: ★★★★★

`sendmail.cf`——この設定ファイルの名前だけで、ベテランエンジニアは遠い目をする。O'Reilly の「Bat Book」が 882ページに及ぶのは、設定ファイルの構文がそれだけの説明を必要とするからだ。`R`（rewrite）ルール、`S`（ruleset）定義、`%1` `$>` といった暗号的な記法。Eric Allman 自身が後に「人間が読むより機械が解析しやすいように設計した」と認めている。GNU Make のタブ問題が「呪い」なら、sendmail.cf は「呪文」だ。

### 考古学的価値: ★★★★★

ARPANET が UUCP と共存していた時代——1981年から1990年代前半——の技術的記憶が、コードの随所に化石として残っている。`M_UGLYUUCP`、`MD_ARPAFTP`、BerkNet の `\@` 問題。これらは今やほとんどの開発者が知らないネットワークアーキテクチャの痕跡だ。インターネット創成期の「翻訳者」の役割を、コードが証言している。

### 読み物としての面白さ: ★★★★★

Eric Allman の個性が随所に出る。「雇用主は何も得ていない」という直言、「ugly UUCP from line」という率直な命名、`ERROR %%%%` という `#error` のない時代のハック。Morris Worm（1988年）はsendmail とは別経路だったが、その後 sendmail は幾度もセキュリティ問題に苦しんだ——これは「インターネットの守門者」が受け続けた攻撃の歴史でもある。

---

## 鑑定人所見

sendmail は「翻訳者」として生まれた。

1981年、インターネットの前身が複数の互換性のないネットワークとして存在していた。ARPANET は大学と研究所をつなぎ、UUCP は電話線でコンピュータをつなぎ、BerkNet はキャンパス内をつなぐ。それぞれのアドレス形式は異なり、相互に変換できる共通の仕組みがなかった。

Eric Allman は一人でその翻訳者を書いた。会社の業務時間外に。雇用主は「何も得るものがなかった」と記録されている。

sendmail.cf の複雑さは、設計の失敗ではなく「翻訳の複雑さ」そのものだ。3つのネットワーク、RFC 822/821 の新しい標準、既存の互換性——これら全てを1つのルールエンジンで記述しようとすれば、必然的にあの設定ファイルになる。「機械が読みやすく」設計したのは、起動のたびに解析するコストを最小化するためだ。1980年代、CPU サイクルは今よりずっと貴重だった。

**O'Reilly の「Bat Book」が 882ページ必要だったのは、sendmail.cf が複雑すぎるからではない。インターネットのメール配送が、それだけ複雑な問題だからだ。**

Allman は後に Postfix の台頭を見た。「送信者の検証」「キューの設計」——sendmail が苦労した問題を、Postfix はよりシンプルに解決した。しかし sendmail なしにインターネットのメールインフラは存在しなかった。それは疑いようのない事実だ。

「インターネットのヘイトメールは、ゲイのプログラムに触れなければ届かない」——Allman のこの言葉は、自分のコードがインターネットの血管として機能していることへの、静かな誇りと皮肉の混合だ。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
