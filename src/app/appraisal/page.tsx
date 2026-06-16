"use client";

import { useState } from "react";
import antiques from "@/data/antiques.json";
import type { Antique } from "@/types";

const items = antiques as unknown as Antique[];

const PUBLISHED_ARTICLES = [
  // === 変換シリーズ ===
  {
    number: "02",
    title: "C+Lua → Python+React（変愚蛮怒 Lua Fork）",
    url: "https://note.com/gstate_kamiya/n/n39c6590f3372",
    language: "C + Lua",
    year: 2002,
  },
  {
    number: "03",
    title: "COBOL → Web（ACAS GL 会計システム）",
    url: null,
    language: "COBOL",
    year: 2011,
  },
  {
    number: "03B",
    title: "C → Rust（変愚蛮怒 33万行→1万行、2日で完了）",
    url: null,
    language: "C → Rust",
    year: 2002,
  },
  {
    number: "04",
    title: "RPG → Web（AS/400 顧客マスタ、約15分で完了）",
    url: null,
    language: "RPG → Python+React",
    year: 2020,
  },
  {
    number: "05",
    title: "COBOL+ASM → Web（CardDemo クレジットカード）",
    url: null,
    language: "COBOL + ASM",
    year: 2022,
  },
  {
    number: "06",
    title: "VB6 → Web（POS 神フォーム3,150行の解体）",
    url: null,
    language: "VB6",
    year: 2020,
  },
  {
    number: "07",
    title: "PL/I → Web（Habitat 世界初MMO 1986年）",
    url: null,
    language: "PL/I",
    year: 1986,
  },
  {
    number: "08",
    title: "C+Lua → Python+React（変愚蛮怒 Web版）",
    url: null,
    language: "C+Lua → Python+React",
    year: "2002→2026",
  },
  {
    number: "09",
    title: "MUMPS → Web（VistA Problem List）",
    url: null,
    language: "MUMPS → Python+React",
    year: 2020,
  },
  {
    number: "10",
    title: "Fortran → Web（Saturn磁場モデル 3D可視化）",
    url: null,
    language: "Fortran → Python+Plotly",
    year: 1980,
  },
  // === 鑑定書シリーズ ===
  {
    number: "11",
    title: "鑑定書#002 BRL-CAD — 米陸軍が40年メンテし続けたCコード",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "12",
    title: "鑑定書#003 DSPython — Nintendo DSの4MBにPythonを載せた話",
    url: null,
    language: "C / Python",
    year: 2007,
  },
  {
    number: "13",
    title: "鑑定書#004 QEMU — 天才が書いた47万行のCPUエミュレータ",
    url: null,
    language: "C",
    year: 2003,
  },
  {
    number: "14",
    title: "鑑定書#005 Whitaker's WORDS — 米空軍大佐がAdaでラテン語辞書",
    url: null,
    language: "Ada",
    year: 1993,
  },
  {
    number: "15",
    title: "鑑定書#006 NASA NASTRAN-95 — 宇宙を飛ばすFortran",
    url: null,
    language: "Fortran",
    year: "1960s",
  },
  {
    number: "16",
    title: "鑑定書#007 DikuMUD II — MMORPG始祖",
    url: null,
    language: "C + DIL",
    year: 1991,
  },
  {
    number: "17",
    title: "鑑定書#008 NCSA Mosaic — 世界初のWebブラウザ",
    url: null,
    language: "C",
    year: 1993,
  },
  {
    number: "18",
    title: "鑑定書#009 Minix 1 — Linuxの祖先",
    url: null,
    language: "C + ASM",
    year: 1987,
  },
  {
    number: "19",
    title: "鑑定書#010 Mocha — JavaScriptは10日間で書かれた",
    url: null,
    language: "C",
    year: 1995,
  },
  {
    number: "20",
    title: "鑑定書#011 farbrausch — 96KBにFPSゲームを詰め込んだ",
    url: null,
    language: "C++ / ASM / GLSL",
    year: 2004,
  },
  {
    number: "21",
    title: "鑑定書#012 Lisp Machine — 96万行のLispで書かれたOS",
    url: null,
    language: "Lisp",
    year: 1984,
  },
  {
    number: "22",
    title: "鑑定書#013 MPC-HC — みんな使ってたMedia Player Classic",
    url: null,
    language: "C++",
    year: 2002,
  },
  // === 変換シリーズ（追加分） ===
  {
    number: "23",
    title: "QBasic → React 変換 + 鑑定書#014 Oregon Trail（1971年の教育ゲーム）",
    url: null,
    language: "QBasic → React+TypeScript",
    year: 1971,
  },
  {
    number: "24",
    title: "Ada → React 変換 Whitaker's WORDS（ラテン語辞書）",
    url: null,
    language: "Ada → React+TypeScript",
    year: 1993,
  },
  {
    number: "25",
    title: "Java/Forth → TypeScript 変換 Mako VM（仮想ゲームコンソール）",
    url: null,
    language: "Java/Forth → TypeScript+Canvas",
    year: 2012,
  },
  {
    number: "54",
    title: "鑑定書#054 Lotus 1-2-3 — VisiCalcを1年で葬ったキラーアプリ",
    url: null,
    language: "8086 Assembly → C",
    year: 1983,
  },
  {
    number: "55",
    title: "鑑定書#055 Turbo Pascal — $49.95の稲妻、観光ビザでIDEを発明",
    url: null,
    language: "Z80 → 8086 Assembly",
    year: 1983,
  },
  {
    number: "56",
    title: "鑑定書#056 HyperCard — Webを発明できたのに、しなかった扉",
    url: null,
    language: "68000 Assembly + C",
    year: 1987,
  },
  {
    number: "57",
    title: "鑑定書#057 Perl 1.0 — awkとsedを殺すつもりはなかった実用主義の奇跡",
    url: null,
    language: "C + yacc",
    year: 1987,
  },
  {
    number: "58",
    title: "鑑定書#058 GNU Make — タブ文字の呪い、35年の共犯者",
    url: null,
    language: "C",
    year: 1988,
  },
  {
    number: "59",
    title: "鑑定書#059 sendmail — インターネットメールの守門者、30年の混沌",
    url: null,
    language: "C",
    year: 1983,
  },
  {
    number: "60",
    title: "鑑定書#060 dBase II — 「dBase I」は存在しない、.DBFの不死",
    url: null,
    language: "8080 Assembly",
    year: 1981,
  },
  {
    number: "61",
    title: "鑑定書#061 Dartmouth BASIC — 教授が無償で配った種、商人が刈り取った実",
    url: null,
    language: "FORTRAN II + GE-235 Assembly",
    year: 1964,
  },
  {
    number: "62",
    title: "鑑定書#062 X Window System — 仕組みを提供する、ポリシーは提供しない",
    url: null,
    language: "C",
    year: 1984,
  },
  {
    number: "63",
    title: "鑑定書#063 AWK — 3人の頭文字がPerlを生んだ、48年現役の1行言語",
    url: null,
    language: "C + yacc",
    year: 1977,
  },
  {
    number: "64",
    title: "鑑定書#064 Bourne Shell — Cで書いたAlgol、45年後も/bin/shに宿る",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "65",
    title: "鑑定書#065 grep — 一晩で書かれた道具、動詞になった名前",
    url: null,
    language: "C",
    year: 1973,
  },
  {
    number: "66",
    title: "鑑定書#066 diff — jackpot、git diffの祖先、1974年の645行",
    url: null,
    language: "C",
    year: 1974,
  },
  {
    number: "67",
    title: "鑑定書#067 ed — すべての正規表現は1969年から、g/re/pの産室",
    url: null,
    language: "C",
    year: 1969,
  },
  {
    number: "68",
    title: "鑑定書#068 dc — bcより古い、1969年のRPN電卓とチューリング完全マクロ",
    url: null,
    language: "C",
    year: 1969,
  },
  {
    number: "69",
    title: "鑑定書#069 sed — edの子、grepの兄弟、holdspaceで記憶を持った1974年のストリームエディタ",
    url: null,
    language: "C",
    year: 1974,
  },
  {
    number: "70",
    title: "鑑定書#070 yacc — コンパイラを生むコンパイラ、AWK/bc/Perlを産んだメタツール",
    url: null,
    language: "C",
    year: 1975,
  },
  {
    number: "71",
    title: "鑑定書#071 bc.y — yacc文法1枚が生んだ2プロセスJIT、パイプ越しにdcを動かす300行のコンパイラ",
    url: null,
    language: "C + yacc",
    year: 1975,
  },
  {
    number: "72",
    title: "鑑定書#072 Lua 1.0 — 公開されなかった最初のLua、失われたソースと@()の時代",
    url: null,
    language: "C",
    year: 1993,
  },
  {
    number: "73",
    title: "鑑定書#073 lex — Eric Schmidtが1976年に書いたコード生成器、lexはyaccで書かれyaccはlexを使う",
    url: null,
    language: "C + yacc",
    year: 1976,
  },
  {
    number: "74",
    title: "鑑定書#074 make — タブ文字という小さな罪、Stuart Feldmanが54回直せなかった1976年の接着剤",
    url: null,
    language: "C + yacc",
    year: 1976,
  },
  {
    number: "75",
    title: "鑑定書#075 lint — yaccを書いた男が書いた2パスのCコード品質検査、/* VARARGS */とstruct lineの1977年",
    url: null,
    language: "C",
    year: 1977,
  },
  {
    number: "76",
    title: "鑑定書#076 pcc — UNARY MUL、Steve Johnsonが2ビットシフトで型を表現した1977年の移植可能なCコンパイラ",
    url: null,
    language: "C + yacc",
    year: 1977,
  },
  {
    number: "77",
    title: "鑑定書#077 m4 — マクロは自分自身を展開する、KernighanとRitchieが900行で書いたプッシュバックバッファの機械",
    url: null,
    language: "C + yacc",
    year: 1977,
  },
  {
    number: "78",
    title: "鑑定書#078 Ratfor — GOKという名のトークン、Brian KernighanがFortranに構造化プログラミングを接ぎ木した1974年",
    url: null,
    language: "C + yacc",
    year: 1974,
  },
  {
    number: "79",
    title: "鑑定書#079 crypt — considerably trivialized、Ken ThompsonがEnigmaを意図的に骨抜きにした1976年と同じUnixに共存したFIPS DESの完全実装",
    url: null,
    language: "C",
    year: 1976,
  },
  {
    number: "80",
    title: "鑑定書#080 f77 — FAMILY==SCJ、Steve JohnsonのCコンパイラ第2パスを乗っ取ったBell Labsの1978年Fortran 77コンパイラ",
    url: null,
    language: "C + yacc",
    year: 1978,
  },
  {
    number: "81",
    title: "鑑定書#081 eqn — int from 0 to inf、KernighanとCherryの1974年数式翻訳機、ギリシャ文字24字がtroff呪文に変わる166行の文法",
    url: null,
    language: "C + yacc",
    year: 1974,
  },
  {
    number: "82",
    title: "鑑定書#082 troff — #define INCH 432、CAT写植機に話しかける言語、Joe OssannaとKernighanが継いだ8,224行",
    url: null,
    language: "C",
    year: 1973,
  },
  {
    number: "83",
    title: "鑑定書#083 tbl — l c r n、Mike Leskの4文字が表を定義し、tblがtroff呪文を生成する2,391行",
    url: null,
    language: "C",
    year: 1975,
  },
  {
    number: "84",
    title: "鑑定書#084 pic — of the way between、英語を食べる図形言語、KernighanのFOR/IF付きDSL、4,624行",
    url: null,
    language: "C + lex + yacc",
    year: 1984,
  },
  {
    number: "85",
    title: "鑑定書#085 spell — ssen→ily、逆順で並ぶ接尾辞テーブル、McIlroyのBloom filterと600行が英語の形態論を解く",
    url: null,
    language: "C + Shell",
    year: 1975,
  },
  {
    number: "86",
    title: "鑑定書#086 refer — false drops、ハッシュ衝突を後から弾く2段階検索、Mike Leskの参考文献エンジンと/usr/dict/papersに眠るBell Labs論文データベース",
    url: null,
    language: "C",
    year: 1978,
  },
  {
    number: "87",
    title: "鑑定書#087 sort — fold[128+']']、256要素の変換テーブル4枚、MEM=32768バイトのメモリソートとN=7本のN-wayマージが作る902行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "88",
    title: "鑑定書#088 fgrep — c->fail、goto nstateとgoto istateが走り続ける、Alfred AhoのAho-Corasick自動機械と349行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "89",
    title: "鑑定書#089 struct — 消せるものだけ消す、Fortran 66のGOTOをRatforのWHILE/UNTILに変換する4フェーズ構造化器",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "90",
    title: "鑑定書#090 units — `dollar *f*`、次元の一つがドル、1978年11月10日のWSJ相場と10次元ベクトルが全ての単位を表現する",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "91",
    title: "鑑定書#091 dd — etoa[] atoe[] atoibm[]、3枚の256バイト変換表、IBMメインフレームのテープをUnixで読むための1979年とJCLが転生したif= of=構文",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "92",
    title: "鑑定書#092 expr — \"0\"と\"\"が偽、すべてが文字列の算術評価器、$((...))以前のシェルスクリプト計算機とcase LEQ: i = i>=0のバグ",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "93",
    title: "鑑定書#093 cpio — TRAILER!!!と070707、mkdirをforkで呼んだ1979年のアーカイバとLinux initramfsに今も生きるcpio形式",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "94",
    title: "鑑定書#094 od — base = 010、自分自身も8進数で初期化するバイナリダンパー、PDP-11の語単位と`*`繰り返し圧縮",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "95",
    title: "鑑定書#095 find — (*exlist->F)(exlist)、述語を関数ポインタのASTで評価する1979年のfind、{}の誕生とopendir()がなかった時代のディレクトリ生読み",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "96",
    title: "鑑定書#096 who — `who am i` は `argc==3`、utmpの20バイトを読んで接続者を列挙する62行と `cbuf+4` の日付フォーマット",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "97",
    title: "鑑定書#097 ar — `ARMAG = 0177545`、PDP-11のワード境界と `ar_name[14]`、静的リンクを可能にした705行のライブラリアーカイバ",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "98",
    title: "鑑定書#098 nm — `A_MAGIC1 = 0407`、a.outの4つのマジックと `toupper()` で外部性を表すシンボル型文字、239行のオブジェクトファイル読み手",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "99",
    title: "鑑定書#099 csh — `\"Too dangerous to alias that\"`、alias が alias を上書きできない1979年の csh、! がLexerで展開されるhistory置換とBill Joyの発明",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "100",
    title: "鑑定書#100 at — `HOUR = 100`、HHMMを「粒」で刻む時刻表現、`popen(\"pwd\",\"r\")` でサブプロセスから現在ディレクトリを取得する1979年のジョブスケジューラ",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "101",
    title: "鑑定書#101 cal — `mon[9] = 19`、1752年9月は19日しかない、グレゴリオ暦改革をコードが記憶するカレンダー計算の204行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "102",
    title: "鑑定書#102 login — `nouser = {\"\" , \"nope\"}`、存在しないユーザーに必ず失敗する偽パスワードを与え `/etc/utmp` に書いて `who` に伝えるloginの149行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "103",
    title: "鑑定書#103 passwd — `salt & 077`、time()+getpid()を6ビットに刻み`+7`/`+6`でASCII塩文字に変換し `/etc/ptmp` で守るpasswdの140行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "104",
    title: "鑑定書#104 su — `setgid()` の後に `setuid()`、rootを手放す前にグループを変える順序と `execl(shell,\"su\",0)` でログインシェルにならない45行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "105",
    title: "鑑定書#105 init — `#define EVER ;;`、shutdown→single→runcom→merge→multipleの状態機械、setjmp/longjmpでSIGHUPをリセットに変えるPID 1の302行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "106",
    title: "鑑定書#106 write — `stbuf.st_mode & 02`、mesg n/y の実装原理、`write -` で全ユーザー一斉送信、`buf[0]=='!'` でシェルエスケープする183行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "107",
    title: "鑑定書#107 getty — `ERASE = '#'` と `KILL = '@'`、Backspaceより前の消去文字、`partab[128]` のパリティ付加、300→1200→150→110でボーレートを巡回する238行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "108",
    title: "鑑定書#108 date — `{\"|\", \"\", 0}` と `{\"{\", \"\", 0}`、`|` と `{` がwtmpに刻む時刻変更の前後、`gtime()` が逆転する入力文字列、163行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "109",
    title: "鑑定書#109 ps — `nlist(\"/unix\", nl)` でカーネルシンボルを読み `/dev/kmem` を直接走査、`\"0SWRIZT\"[p_stat]` でプロセス状態を変換する323行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "110",
    title: "鑑定書#110 ls — `union { char lname[15]; char *namep; }` でSSO、`6L*30L*24L*60L*60L` の6ヶ月境界で日付フォーマットが変わる、`nomocore` が静かに守る424行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "111",
    title: "鑑定書#111 pwd — `chdir(dotdot)` で `..` を辿りinode番号で逆歩行、マウント越えは `dev` まで比較、`cat()` が右シフトで先頭挿入する80行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "112",
    title: "鑑定書#112 tr — `code[256]`/`squeez[256]`/`vect[256]` の三枚のテーブルが `if(c = code[c&0377]&0377)` の一行に合流する132行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "113",
    title: "鑑定書#113 time — `quant[] = { 6, 10, 10, 6, 10, 6, 10, 10, 10 }` の9数字が60HzティックをHHH:MM:SS.Tに分解する78行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "114",
    title: "鑑定書#114 wall — `ttyslot(2)` でfd=2から自分のutmpスロットを特定し `fork()` で各ttyに `sleep(1)` 間隔で全員送信する78行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "115",
    title: "鑑定書#115 wc — `' '<c&&c<0177` のASCII範囲比較1行が単語を定義し `wd = \"lwc\"` 文字列を `while(*wd) switch(*wd++)` で走査する86行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "116",
    title: "鑑定書#116 mesg — `chmod(tty, 0622)` でttyのパーミッション変更が「通信の許可」になり `sbuf.st_mode & 02` で状態を判定する55行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "117",
    title: "鑑定書#117 yes — `for(;;) printf(\"%s\\n\", argc>1? argv[1]: \"y\")` で無限ループと三項演算子が「永遠にYと答え続ける」6行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "118",
    title: "鑑定書#118 tee — `int openf[20] = { 1 }` でstdoutを先頭に埋め込み、lseek(ESPIPE)でパイプを検出し16バイト刻みで全出力先に書く95行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "119",
    title: "鑑定書#119 cat — `statb.st_dev==dev && statb.st_ino==ino` でinode番号が「入力と出力が同じファイル」を検出し警告する63行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "120",
    title: "鑑定書#120 tty — `ttyname(0)` と `exit(p? 0: 1)` でfd=0のstdin端末名を表示し「端末かどうか」を終了コードで返す18行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "121",
    title: "鑑定書#121 rev — `default: continue` がswitch内からforを継続し `goto eof` で二重ネストを一撃脱出、`while(--i>=0)` で逆順出力する44行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "122",
    title: "鑑定書#122 kill — `atoi(argv[1]+1)` でハイフンをスキップし `**argv` の二重間接でPIDを検証、`goto usage` でifブロック内ラベルに飛ぶ40行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "123",
    title: "鑑定書#123 sync — `main() { sync(); }` 引数なしmain・ゼロロジック・カーネルシステムコールをそのままコマンドにする5行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "124",
    title: "鑑定書#124 echo — `fputs(argv[i], stdout)` でprintf不使用、`argv[1][0]=='-' && argv[1][1]=='n'` の2文字比較だけで-nフラグを処理する23行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "125",
    title: "鑑定書#125 sleep — `while(c = *s++)` でポインタを進めながら `n = n*10 + c - '0'` で10進変換する21行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "126",
    title: "鑑定書#126 mknod — `m = 060666` と `(a<<8) | b` ——8進数の魔法定数でファイルタイプを表し、メジャー/マイナー番号を1つのintに詰める42行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "127",
    title: "鑑定書#127 nice — `nice(nicarg); execvp(argv[1], &argv[1])` ——プロセス優先度を下げてから自分を別プログラムに置き換える、ラッパーパターンの26行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "128",
    title: "鑑定書#128 basename — `if(*p1++ == '/') p2 = p1` ——最後の/の次の位置を1パスで覚え、`*--p3 != *--p1`で末尾から逆比較する29行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "129",
    title: "鑑定書#129 random — `#define MAXINT 32768.` の `.` 一つで浮動小数点除算に変え、`exit()` 自体を乱数にする30行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "130",
    title: "鑑定書#130 split — `fname[f++] = fnumber/26 + 'a'` ——base-26エンコーディングで xaa〜xzz を676ファイルまで生成する81行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "131",
    title: "鑑定書#131 uniq — `static char b1[1000], b2[1000]` ——2バッファ交互比較で隣接行重複を判定し、`mode = argv[1][1]` の1文字で `-c`/`-d`/`-u` を切り替える142行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "132",
    title: "鑑定書#132 comm — `ldr[0]=\"\"; ldr[1]=\"\\t\"; ldr[2]=\"\\t\\t\"` ——3列を進行的タブ文字列で表現し、`compare()`が0/1/2を返してそのまま列番号になる166行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "133",
    title: "鑑定書#133 bcd — `chtab[64]` の8進数66個と `(chtab[c]>>(j-1))&1` ——1979年UnixがASCIIアートでIBMパンチカードを描く133行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "134",
    title: "鑑定書#134 paste — `inptr[MAXOPNF]` で12ファイル並列、`del[k]; k = (k+1) % delcount` で区切り文字巡回、`RUB '\\177'` を「区切りなし」の番人にする137行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "135",
    title: "鑑定書#135 test — `[ expression ]` の `[` と `]` は同じプログラム、`exit(exp() ? 0 : 1)` で終了コードに真偽を渡す189行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "136",
    title: "鑑定書#136 cmp — `lflg = 1`を`-s`で`--`、`-l`で`++`する1変数3モード制御、`otoi()`がC数値リテラル準拠で先頭0=8進数を解釈する121行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "137",
    title: "鑑定書#137 rew — `tape[i] = args[1][j]` ——文字列リテラル書き換えでデバイスパスを構築し、`open()`→`read()`→`close()` で磁気テープを巻き戻す26行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "138",
    title: "鑑定書#138 tsort — `DEAD/LIVE/VISITED`の3状態と`firstnode`「成長する番人」、再帰DFSで循環検出する205行のトポロジカルソート",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "139",
    title: "鑑定書#139 file — `0410/0411/0407` の a.out 魔法数と4言語のキーワード辞書、`english()`のETAOIN SHRDLU統計でファイル種別を当てる321行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "140",
    title: "鑑定書#140 cron — `for(;; itime+=60, slp())` の毎分ティック、`EXACT/ANY/LIST/RANGE/EOS`の5状態でcrontabをバイナリ符号化、double-forkで子プロセスを切り離す252行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "141",
    title: "鑑定書#141 rm — `rmdir` システムコールがまだなかった1979年の `rm.c` — fork() + execl(\"/bin/rmdir\") で別コマンドを呼ぶ162行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "142",
    title: "鑑定書#142 cp — 90行で済むBell-32V Unix `cp.c` — `while(*bp = *p1++) if (*bp++ == '/') bp = p2;` が basename を抽出する K&R 流ループ、st_dev+st_ino で「同じファイル」を検出",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "143",
    title: "鑑定書#143 mv — `rename(2)` システムコールがまだなかった1979年の `mv.c` — `link() + unlink()` で同一デバイス、cross-device は `execl(\"/bin/cp\")`、ディレクトリ移動には `..` link 修正まで手作業の297行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "144",
    title: "鑑定書#144 ln — シンボリックリンクがまだ存在しなかった1979年の `ln.c` 56行 — `link(argv[1], name)` 1行が本体、`-f` で superuser がディレクトリへのハードリンクを許す",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "145",
    title: "鑑定書#145 chmod — `chmod u=rwx,g+w,o-x` の symbolic mode を `abs() / who() / what() / where()` の4関数パーサで解釈する1979年の `chmod.c` 177行 — `chmod g=u` で `u` のビットをシフトで `g` に複製する",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "146",
    title: "鑑定書#146 chown — 1979 年は誰でもファイル所有者を変えられた — Bell-32V `chown.c` 55行、`isnumber()` で uid と user 名を判別、`stbuf.st_gid` を stat で読んで gid を保存",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "147",
    title: "鑑定書#147 stty — ASR-33 / Teletype 37 / TI Silent 700 / Tektronix まで端末機種名がそのまま書かれている1979年の `stty.c` 301行 — `sgtty.h` 時代の termio、`134.5` baud、`'^X' & 037` で制御文字を作る古典",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "148",
    title: "鑑定書#148 df — `/dev/rp0a` `/dev/rp1g` がデフォルト引数の1979年 `df.c` 96行 — super block を直接 `open()` して空きブロックを `while(alloc())` で巡回カウントする V7 file system の心臓部",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "149",
    title: "鑑定書#149 du — `chdir()` で潜って `chdir(\"..\")` で戻る1979年の `du.c` 167行 — `ml[1000]` でハードリンクを二重カウントしない、`fd > 10` で `close` する fd 枯渇対策、V7 ディレクトリを生 `read()` する",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "150",
    title: "鑑定書#150 mount — `/etc/mtab` をユーザー空間で手作業更新する1979年の `mount.c` 65行 — `mount(2)` 呼び出し後に固定 32×16 テーブルを `creat()` で全書き直し、レースコンディションは織り込み済み",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "151",
    title: "鑑定書#151 umount — `sync()` してから `umount(2)` を呼ぶ1979年の `umount.c` 54行 — `/etc/mtab` の該当エントリを 0 で塗りつぶし、末尾空きを切り詰めて全書き直しする mount の対",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "152",
    title: "鑑定書#152 touch — `utime(2)` を使わず 1 バイト read/write で mtime を更新する1979年の `touch.c` 70行 — `lseek(fd, 0L, 0)` で先頭に戻して同じバイトを書き戻すだけ、空ファイルは `creat()` で新規作成、`-c` で作成抑制",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "153",
    title: "鑑定書#153 tail — `-f` フラグがまだ無かった1979年の `tail.c` 163行 — `lseek(0, -di, 2)` で末尾から逆走、piped なら頭から全部読んで覚える、`+n` で先頭から / `-n` で末尾からの対称設計",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "154",
    title: "鑑定書#154 size — `<a.out.h>` の `struct exec` を `fread()` する1979年の `size.c` 46行 — text/data/BSS のセグメント構成を 4 種類のマジック数 (`0407/0410/0411`) で識別、後の ELF へ継承される実行可能形式の祖先",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "155",
    title: "鑑定書#155 strip — `mktemp(\"/tmp/sXXXXX\")` でテンポラリ確保、 `signal(SIGHUP/SIGINT/SIGQUIT, SIG_IGN)` で 3 シグナル無視、 `a_syms = a_trsize = a_drsize = 0` でシンボル削除——1979 年の `strip.c` 110 行が見せる「実行可能ファイルの整形術」",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "156",
    title: "鑑定書#156 ar — `mrxtdpq` 7 コマンドを 1 バイナリで切り替える 1979 年の `ar.c` 705 行——`comfun` 関数ポインタディスパッチ、 `struct ar_hdr` 14 文字ファイル名、 3 つの temp ファイルで実現する位置指定挿入、 PDP-11 ワード境界の 2 バイトアラインメント",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "157",
    title: "鑑定書#157 m4 — 23 ビルトイン + 9 ストリーム diversion + putbak プッシュバック——1979 年の `m4.c` 899 行 + `m4y.y` 94 行で完成したマクロプロセッサ、 sendmail.cf / autoconf / GNU configure の祖先",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "158",
    title: "鑑定書#158 who — `fread(struct utmp)` で `/etc/utmp` をレコード単位読み、 `argc == 3` で「`who am i`」 を検出する 1979 年の `who.c` 62 行——`last`/`w`/`finger` 系統の祖先、 `#ifdef vax` で見える VAX 移植期の痕跡",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "159",
    title: "鑑定書#159 dd — `if=`/`of=`/`bs=`/`conv=ebcdic` の IBM JCL 由来引数、 `etoa`/`atoe`/`atoibm` 3 つの 256 バイト EBCDIC 変換表、 `100k` / `4w` の単位サフィックス——1979 年の `dd.c` 541 行が見せる「Unix で最も異質な道具」",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "160",
    title: "鑑定書#160 cal — `mon[9] = 19` で 1752 年 9 月の 11 日を消し去り、 `if(y > 1800)` で 400 年閏年規則を切替、 `jan1()` で Jan 1 の曜日を 6 行で計算する 1979 年の `cal.c` 204 行——イギリスのグレゴリオ暦切替を 1979 年の Unix に刻んだ歴史的カレンダー",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "161",
    title: "鑑定書#161 crypt — 「A one-rotor machine designed along the lines of Enigma」——1979 年の `crypt.c` 91 行が見せる Enigma の Unix 化、 3 つの 256 要素順列テーブル、 `fork`+`execl(/usr/lib/makekey)` でパスワード拡張、 `t2[(t3[(t1[(i+n1)&MASK]+n2)&MASK]-n2)&MASK]-n1` の中心暗号式",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "162",
    title: "鑑定書#162 dc — `[command]` でマクロを定義、 `S`/`L` で 256 レジスタにアクセス、 `struct blk` の `rd`/`wt`/`beg`/`last` 4 ポインタで任意精度数を表現——1979 年の `dc.c` 1940 行 + `dc.h` 117 行が見せる **bc の祖、 RPN プログラム言語の完成形**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "163",
    title: "鑑定書#163 init — `for(EVER) { shutdown; single; runcom; merge; multiple; }` 永久ループ、 `multiple()` の `wait + dfork` で **respawn** 文化を発明、 `setjmp/longjmp + SIGHUP reset` で設定リロード——1979 年の `init.c` 302 行が打ち立てた **PID 1 / Unix 全プロセスの祖**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "164",
    title: "鑑定書#164 getty — `tabp->nname` でテーブルチェイン、 110/150/300/1200/2400/4800/9600 baud を **巡回試行**、 `partab[]` で偶数パリティを計算、 ERASE='#' / KILL='@' で手動行編集——1979 年の `getty.c` 238 行が見せる **ダイヤルアップ時代のターミナル自動適応**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "165",
    title: "鑑定書#165 login — `getpass(\"Password:\") + crypt()` でパスワード照合、 `nouser = {\"\", \"nope\"}` で存在しないユーザーにも常にパスワードを聞く、 `setgid + setuid + chown(tty)` で root から user へ権限降下、 `execlp(shell, minusnam, 0)` で **`-bash`** ログインシェル起動——1979 年の `login.c` 149 行が定めた Unix 認証の全工程",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "166",
    title: "鑑定書#166 grep — `g/re/p` の `ed` から独立して 1973 年に誕生、 `compile()` で regex → opcode バイトコード化、 `advance()` 再帰 VM で `*` をバックトラック、 32 バイトビットマップで `[a-z]` 表現、 fast path で `if (*p2 == CCHR)` 先頭文字スキャン——1979 年の `grep.c` 477 行が見せる **Unix 正規表現エンジンの典型実装**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "167",
    title: "鑑定書#167 ed — `commands()` の 25 個 1 文字コマンド + `address()` の行アドレス解析、 `compile/execute` で regex VM (grep と同じ opcode)、 `g/re/p` を内蔵 (grep の語源)、 `s/old/new/` を実装 (sed の祖)、 `getblock()` で 256 ブロック × 512 バイト = 128KB の tempfile バッファ——1762 行の `ed.c` が **vi/sed/grep すべての祖**として 1971 年に書き上げた **Unix 行エディタ言語**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "168",
    title: "鑑定書#168 sed — `fcomp()` で 1 度だけスクリプトコンパイル → `execute()` で毎行繰り返し、 `union reptr` でコマンドをコンパイル済み命令配列に、 `linebuf` (pattern space) + `holdsp` (hold space) を h/H/g/G/x で操作、 ラベル `b`/`t` の goto で Turing 完備、 ed/grep と同じ opcode + CNL/CLNUM/CEND を拡張——1975 年 Lee McMahon 作 `sed` の 1771 行が確立した「Stream Editor」 の祖型",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "169",
    title: "鑑定書#169 awk — `awk.g.y` の **yacc 文法**で完全な式言語を定義、 `XBEGIN/PASTAT/XEND` で **pattern { action }** モデルを実現、 `tran.c` で **動的型 (string ↔ number)** を自動変換、 **連想配列 `a[\"key\"]`** を 1977 年に発明、 **MATCHOP `~`** を演算子として組み込み——14275 行の `run.c` が走らせる **Aho/Weinberger/Kernighan 1977 年作** awk が完成させた **「ed の発展形** = フル言語」",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "170",
    title: "鑑定書#170 echo — `for(i=1; i<argc; i++) fputs(argv[i], stdout)` だけで実装、 `-n` フラグで改行抑制、 バックスラッシュ解釈一切なし、 `exit(0)` で必ず成功——23 行の `echo.c` が 1979 年に確立した **Unix 最小コマンド**、 後に **「echo wars」** を生む BSD vs System V の分岐点",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "171",
    title: "鑑定書#171 find — `e1()`/`e2()`/`e3()` の operator-precedence parser で **述語式 AST** を構築、 `descend()` で **chdir + 再帰**してディレクトリ走査、 `-exec command {} \\;` で **fork + execvp + `{}` 置換**、 `struct anode` の **関数ポインタ `int (*F)()`** で述語を **第一級オブジェクト**として保存——708 行の `find.c` が確立した **「**Unix ファイルシステム検索の DSL**」**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "172",
    title: "鑑定書#172 cc — `cpp` → `ccom` → `c2` → `as` → `ld` の 5 パスを `callsys()` で順次起動、 `/tmp/ctm0a`〜`5a` のテンポラリ管理、 `getsuf`/`setsuf` で `.c → .o` 変換、 `/lib/crt0.o` を先頭リンクして main 呼び出しの startup を提供——464 行の `cc.c` が打ち立てた **Unix コンパイラドライバの祖型**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "173",
    title: "鑑定書#173 ld — `load1()` でシンボル収集、 `load2()` で本体コピー + リロケーション の 2 パス設計、 OMAGIC (0407) と NMAGIC (0410) の a.out 形式生成、 UNDEF/TEXT/DATA/BSS/COMM のシンボル分類、 `-l libc.a` で **必要なオブジェクトだけ archive から引き抜く smart library**——1376 行の `ld.c` が確立した **Unix リンカの祖型**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "174",
    title: "鑑定書#174 make — `doname()` の再帰下降で **依存グラフを DFS 評価**、 `if(ptime < td)` で **mtime ベース staleness 判定**、 `.c.o:` の **サフィックス規則**で暗黙ルール、 `$@`/`$<`/`$?`/`$*` の **自動変数**を `setvar` でコンテキスト切替、 `.IGNORE`/`.SILENT`/`.SUFFIXES`/`.DEFAULT` の **特殊ターゲット**——1979 年 Stuart Feldman 作 `make` 1500+ 行が確立した **ビルドシステムの祖型**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "175",
    title: "鑑定書#175 sh — `IF/THEN/FI/WHILE/DO/OD/LOOP/POOL/SWITCH/IN/ENDSW` の **ALGOL 68 風マクロ**で C を別言語化、 `execute()` で **TCOM/TFORK/TFIL/TLST/TAND/TORF/TFOR/TWH/TIF/TSW** の AST dispatcher、 `TFIL` で **`chkpipe` + 左右 execute** によるパイプ、 `SYSCD/SYSEXIT/SYSTRAP` の **built-in** vs `execa()` の **external** ——Stephen R. Bourne 作の **`/bin/sh` (Bourne shell)** が打ち立てた **Unix shell の言語化**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "176",
    title: "鑑定書#176 bc — `e '+' e = bundle(3, $1, $3, \"+\")` で **代数式を RPN に翻訳**、 `if/while/for/define` を `[...] sx ... lFx` 形式の **dc マクロ**にコンパイル、 yacc + lex で前置構文を後置に変換、 `popen(\"dc\", \"w\")` で実行を **dc に委譲**——597 行の `bc.y` が確立した **「代数計算機 = dc のフロントエンド」**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "177",
    title: "鑑定書#177 expr — `OR/AND/EQ/GT/ADD/MULT/MATCH/SUBSTR/LENGTH/INDEX` を yacc 文法 50 行で網羅、 `yylex` が **argv から 1 引数 = 1 トークン**として読む (`find` 流)、 `ematch(\"[0-9]*$\")` で **string/number 自動切替**、 `MCH (`:`)` で正規表現マッチ + 部分文字列抽出——669 行の `expr.y` が確立した **「シェルスクリプトの式評価ツール**」",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "178",
    title: "鑑定書#178 mail — `/usr/spool/mail/$USER` 個人メールボックス、 `From ` 行で **mbox フォーマット**メッセージ区切り、 `lock`/`unlock` で **同時アクセス保護**、 `!host!user` の **UUCP bang path** + `uux` で **store-and-forward** リモート転送、 13 個の 1 文字コマンド (`?qxpsw-+dnm!`) の対話 UI——554 行の `mail.c` が確立した **Unix メールシステムの祖型**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "179",
    title: "鑑定書#179 cpp — `#define`/`#include`/`#if`/`#ifdef`/`#undef`/`#line` のディレクティブを `control()` で dispatch、 `dodef()` で **マクロ + 仮引数**を symtab に登録、 **`scw1` superimposed code bit array** で 「**マクロ名にあり得ない識別子**」 を高速フィルタ、 yacc 文法 (`cpy.y`) で `#if` 式評価——1132 行の `cpp.c` が確立した **C プリプロセッサの祖型**、 John F. Reiser 1978 年 7-8 月作",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "180",
    title: "鑑定書#180 od — `-o/-d/-x/-c/-b` の 5 フォーマット同時表示、 `+offset` で **基数自動判定**シーク (0x=hex、 0=oct、 末尾.=dec、 末尾 b=block)、 `*` で **連続同一行**を省略、 `putn(n, b, c)` の **再帰呼び出し**で任意基数表示、 8 word = 16 バイト / 行レイアウト——250 行の `od.c` が確立した **「**バイナリダンプの祖型**」**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "181",
    title: "鑑定書#181 tar — 512 バイトの `union hblock` ヘッダで **name[100]/mode/uid/gid/size/mtime/chksum/linkflag/linkname** を埋める、 `putfile()` 再帰でディレクトリ走査 (`chdir` + `read dir` + 再帰)、 `linkbuf` で **ハードリンク追跡** (`inum + devnum`)、 `chksum` フィールドで **ヘッダ整合性検証**、 デフォルトターゲットは **`/dev/mt1`** (磁気テープユニット 1)——918 行の `tar.c` が確立した **「Tape ARchive 形式」**、 半世紀のソフトウェア配布の基盤",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "182",
    title: "鑑定書#182 cpio — MAGIC = `070707` の **バイナリヘッダ** (tar の ASCII 8 進と対照的)、 `-o`/`-i`/`-p` の **3 モード** (out/in/pass-through)、 ファイル名は **stdin から読む** (`find . | cpio -o`)、 `mklong`/`MKSHORT` で **endian-aware** な short ペア処理、 `-p` で **コピー専用モード** (アーカイブなし)——789 行の `cpio.c` が確立した **System V 流アーカイブ**、 tar の対",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "183",
    title: "鑑定書#183 diff — Harold Stone の **LCS アルゴリズム** (Longest Common Subsequence) で 2 ファイル間の最長共通部分列を探す、 ハッシュで **等価類**を作って高速化、 `struct cand` (`x`, `y`, `pred`) の **k-candidate チェイン**で部分列を再構築、 メモリ overlay (`file[0] → class → klist → J`) で省メモリ、 `-e` で **ed/sed 互換の patch 出力**——645 行の `diff.c` が確立した **「差分**」 という概念の祖、 git diff/Mercurial/patch すべての DNA",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "184",
    title: "鑑定書#184 diff3 — `diff3.sh` で **diff を 2 回呼んで** (f1 vs f3、 f2 vs f3)、 `/usr/lib/diff3` バイナリが **2 つの diff 出力を merge**、 `struct range` で変更範囲、 `merge()` の **5 ケース dispatch** で「片方だけ変更/両方同じ/両方違う conflict/範囲オーバーラップ」 を処理、 `====` セパレータで未解決 conflict を表示——438 行の `diff3` が確立した **3-way merge アルゴリズム**、 git merge/Mercurial/svn merge の祖",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "185",
    title: "鑑定書#185 cmp — `c1 = getc(file1); c2 = getc(file2)` の **バイト単位**比較ループ、 exit code **0/1/2** で「同じ/違う/エラー」 を区別 (Unix 標準慣習)、 `-s` (silent) と `-l` (long) で **3 つの詳細レベル**、 `%6ld %3o %3o` の printf width 指定で違いを 8 進ダンプ、 `otoi(s)` で 8 進/10 進**自動判定**——わずか 121 行の `cmp` が確立した **「**バイナリ比較**」** の祖",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "186",
    title: "鑑定書#186 comm — `ldr[0] = \"\"`/`ldr[1] = \"\\t\"`/`ldr[2] = \"\\t\\t\"` の **タブインデント 3 列出力** で「f1 only / f2 only / 両方」、 線形 merge アルゴリズム (LCS 不要、 ソート済み前提)、 `-1`/`-2`/`-3` で **列省略**して集合演算 (差集合・積集合)、 166 行で完全実装——`comm` が確立した **「ソート済み行集合の比較**」 の祖、 SQL JOIN/Python set/Pandas merge の概念的祖",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "187",
    title: "鑑定書#187 join — `-j1 N`/`-j2 M` で各ファイルの **join カラム指定**、 `-o 1.1 2.3 1.2` で **SELECT カラムリスト**、 `-a1`/`-a2` で **OUTER JOIN**、 `-e \"NULL\"` で **欠損値代入**、 線形 merge join + `fseek` の **多対多バックトラッキング**——214 行の `join` が 1979 年に確立した **「リレーショナル結合**」、 SQL JOIN (1986) より 7 年早い祖型",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "188",
    title: "鑑定書#188 sort — `sbrk()` で **32KB メモリブロック確保**、 入力を qsort で内部ソート → temp ファイル `/usr/tmp/stmXXXXXaa` に書き出し、 **`N=7` way マージ**で連結、 `+pos -pos` でソートキー指定 (後の `-k`)、 `fold[]`/`nofold[]`/`dict[]`/`nonprint[]` の **256 バイト変換表**で照合順制御——902 行の `sort` が確立した **外部マージソート + フィールド指定**、 巨大データの処理基盤",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "189",
    title: "鑑定書#189 uniq — `b1`/`b2` の **2 バッファ交互比較**で隣接行の重複検出、 `-u`/`-d`/`-c` で **3 モード dispatch** (unique 出力/duplicate 出力/カウント付き)、 `-N`/`+M` で **field/char skip** して比較、 `sort | uniq -c | sort -rn` の **frequency analysis** イディオム——142 行の `uniq` が確立した **「**重複除去**」 の祖**、 sort の最も自然なペア",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "190",
    title: "鑑定書#190 tr — `code[256]` の **変換テーブル**で O(1) 文字置換、 `next()` の **range expansion (a-z)** を `struct string { last, max }` で遅延展開、 `-c`/`-d`/`-s` の 3 フラグ組み合わせで補集合・削除・squeeze、 `\\NNN` 8 進エスケープで任意バイト指定——132 行の `tr` が確立した **「**文字単位ストリーム変換**」 の原型**、 McIlroy one-liner の入口",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "191",
    title: "鑑定書#191 wc — `token` 状態機械の **0→1 立ち上がりで単語境界**検出、 `' '<c&&c<0177` で **isprint() 不使用の ASCII 範囲判定**、 `wd = \"lwc\"` の **フラグ文字列駆動 dispatch** で出力順序も指定、 1 パスで line/word/char を同時集計する **streaming 設計**——86 行の `wc` が確立した **「テキスト統計の三種の神器**」 、 パイプライン終点の集計ツール",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "192",
    title: "鑑定書#192 look — `top`/`bot`/`mid` の **二分探索**で /usr/dict/words を O(log N) 走査、 `fseek(dfile, mid, 0)` 後の **getc ループで改行まで再同期** (random offset → line boundary)、 `compare()` の **5 値返却** (-2/-1/0/1/2) で **prefix match** を表現、 `canon()` で **-d (英数字のみ) + -f (大文字小文字無視) の正規化**——162 行の `look` が確立した **「**辞書二分探索**」 の祖**、 spell checker と fgrep の DNA",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "193",
    title: "鑑定書#193 pr — `2+head+2+page[56]+5` の **66 行ページレイアウト**、 `buffer[6720]` の **循環バッファ + 0375/0376 センチネル**で多段組みカラム出力、 `colp[72]` で **N カラム同時走査**、 `-m` で **複数ファイル並行表示**、 `fixtty()` で **印刷中の他ユーザー write を chmod 0600 で抑止**——421 行の `pr` が確立した **「line printer 時代の組版**」 、 ページネーション・ヘッダ・多段組みの祖",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "194",
    title: "鑑定書#194 tee — `openf[20] = { 1 }` の **fd 1 (stdout) を 0 番目にハードコード**、 `creat(argv[1], 0666)` で出力ファイル作成 (`-a` なら append)、 `S_IFCHR` と `lseek ESPIPE` で **tty/pipe 検出**、 `d = t ? 16 : p` で **tty/pipe は 16 バイトずつ・file は 512 バイトまとめて書く**——95 行の `tee` が確立した **「**T 字パイプ分岐**」 、 ロギング + 続行を 1 行で書く Unix シェル哲学の極**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "195",
    title: "鑑定書#195 nm — `struct exec exp` の **a.out ヘッダ読み取り**で magic number (A_MAGIC1〜4) 検証、 `a_text + a_data + a_trsize + a_drsize` で **シンボルテーブル offset 算出**、 N_UNDF/N_ABS/N_TEXT/N_DATA/N_BSS/N_FN を **`u`/`a`/`t`/`d`/`b`/`f` に map**、 N_EXT (global) で **`toupper()`** で大文字化、 ARMAG で **`ar(1)` archive を iterate**——239 行の `nm` が確立した **「**シンボル一覧出力フォーマット**」 の祖**、 GNU nm/llvm-nm が 50 年継承する出力規約",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "196",
    title: "鑑定書#196 time — `fork + execvp + wait` の **古典 Unix 子プロセス実行モデル**、 `times()` システムコールで **user/sys/cumulative-child の 4 値取得**、 `time()` の wall clock 差分で **real time** 算出、 `SIGINT`/`SIGQUIT` を **親 (time コマンド) で無視**して子に届ける、 `printt()` の **混合進数フォーマッタ** (6/10/10/6/10/6/10/10/10) で 9 桁を時:分:秒.小数に変換——78 行の `time` が確立した **「**real/user/sys 三分類**」 、 ベンチマーク文化の祖**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "197",
    title: "鑑定書#197 pwd — `stat(\"/\", ...)` で **root の device/inode を anchor** に、 `chdir(\"..\")` で **親ディレクトリへ上昇**、 親内の direct entries を読んで **自分の inode 番号と一致するエントリ (= 自分の名前)** を発見、 `cat()` で **末端から前置構築**して path を作る、 マウントポイント越えは `stat()` で再照合——80 行の `pwd` が体現する **「**getcwd() 前の時代の自力 path 構築**」 、 Unix ファイルシステムの inode + ディレクトリエントリの教科書実装**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "198",
    title: "鑑定書#198 date — `for(i=1970; i<year; i++) timbuf += dysize(i)` の **Unix epoch (1970-01-01) からの秒数積算**、 `gtime()` の **文字列逆転して 2 桁ずつ取り出す**巧妙な YYMMDDHHMM パース、 `localtime()`/`gmtime()` の構造体逆変換 + `asctime()` の人間可読化、 `-u` で GMT 表示 + timezone() で TZ 名 + DST 補正、 wtmp ログに時刻変更を記録——163 行の `date` が確立した **「Unix 時刻の二重表現**」 (epoch seconds ↔ 構造体ぶら下げ)、 Y2K の根本構造",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "199",
    title: "鑑定書#199 kill — `kill(pid, signo)` syscall の薄いラッパー、 デフォルト `SIGTERM` (graceful termination) で `-9` (SIGKILL) は強制終了、 `atoi(argv[1]+1)` で `-NN` 形式の **数値シグナル指定** (シグナル名展開はシェル/POSIX 拡張)、 複数 pid を **並列処理**して partial failure を errlev に集約、 `sys_errlist[errno]` で人間可読エラー——わずか **40 行**の `kill` が体現する **「signal というプロセス間通信プリミティブ**」 、 Ctrl-C/Ctrl-Z/SIGSEGV/SIGTERM すべての送信器",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "201",
    title: "鑑定書#201 mkfs — `block 0 = boot loader, block 1 = superblock, block 2-N = inodes, N+ = data blocks` の **V7 FS 7 領域 layout**、 proto ファイル `d--777 0 0 $` 構文で **初期 directory ツリーを宣言的記述**、 `s_free[NICFREE]` の **free block list chain** で bitmap 不使用の空き block 管理、 **回転式 (f_m/f_n) interleaving** で disk arm seek 距離を統計的に均等化、 dinode の `i_addr[NADDR=13]` で **10 direct + 1 indirect + 1 double-indirect + 1 triple-indirect**——615 行の `mkfs` が確立した **「**Unix V7 FS の鋳型**」 、 ext2/ext3/UFS が継承する基本構造**",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "202",
    title: "鑑定書#202 rmdir — `unlink` を3回(`..`→`.`→本体)唱えてディレクトリを消すSUID-root、`rm` が fork+execl で呼んでいた相手の104行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "203",
    title: "鑑定書#203 mkdir — `mknod` でディレクトリinodeを生み `link`×2 で `.`/`..` を張る、signal 5つ無視で不可分を守るSUID-rootの71行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "204",
    title: "鑑定書#204 egrep — `cstat = gotofn[cstat][c]` で正規表現をDFAにコンパイルし1文字1テーブル引きで線形マッチ、Ahoのfollow位置構成(ドラゴンブック)、grep/fgrepに続く正規表現トリオ完成の590行",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "205",
    title: "鑑定書#205 makekey — 「10バイト送ると13バイト返る」read/read/write だけの19行、crypt を呼ぶ鍵生成フィルタと「わざと遅い」鍵ストレッチング(bcrypt/scrypt/Argon2)の祖先",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "206",
    title: "鑑定書#206 newgrp — `setgid` してから `execl(\"/bin/sh\")` で新グループのシェルになる55行、`su` の gid 版、`/etc/group` のグループパスワードを `crypt` で検証する認証一族",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "207",
    title: "鑑定書#207 chgrp — `chgrp(2)` がないので `stat` で uid を取り `chown(file, 同じuid, 新gid)` でグループだけ変える53行、`chown` の薄いラッパー、`newgrp` のファイル版",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "208",
    title: "鑑定書#208 dump — `pass(mark/add/dump)` の4パスとダンプレベル0-9、`/etc/ddate` で前回より新しいinodeだけを拾う増分バックアップを発明した639行、全バックアップツールの祖",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "209",
    title: "鑑定書#209 restor — 「Last chance before scribbling on」、dumpのテープを checksum==CHECKSUM で検証しつつ balloc/bmap で生ディスクに自前FSを書き戻す1145行、穴も復元しパス名をinode解決するdumpの対",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "210",
    title: "鑑定書#210 cb — パーサもASTも持たず switch(c) で `{`→tabs++ `}`→tabs-- する文字単位状態機械357行、stabs[clevel][iflev] に if 文脈を退避してぶら下がり else を整列するコード整形ツールの祖",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "211",
    title: "鑑定書#211 number — 数字を英語の綴りに変える199行、card[]は vigintillion(10^63) まで、\"00\"詰めで3桁グループ化してconv()が再帰、tens()はp[2]=0の破壊的書き換えで「thirteen three」の二重印字を消す",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "212",
    title: "鑑定書#212 sum — 1バイトごとに16ビット和を右ローテートしてから足す48行、単純加算では見逃す「バイト転置」を捕まえる、cksum/md5/sha の祖先",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "213",
    title: "鑑定書#213 ptx — putc(TILDE)で行を「回転」させ /usr/bin/sort に丸投げする551行、各キーワードを文脈ごと並べるKWIC索引、/usr/lib/eign のストップワードを自作ハッシュ表で弾く、McIlroyの索引機械でありParnas論文の題材",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "214",
    title: "鑑定書#214 deroff — #define C で全入力を1マクロに集約し troff/eqn/tbl 命令を「剥がして」素のテキストを残す494行、組版一族の唯一の「逆」、spell と wc への橋渡し",
    url: null,
    language: "C",
    year: 1978,
  },
  {
    number: "215",
    title: "鑑定書#215 col — ESC-7/8/9 の「上向きの紙送り」を page[256] のスライディングウィンドウで平坦化する309行、前にしか進めない装置のために troff の逆行出力を組み直すデバイス適応器",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "216",
    title: "鑑定書#216 tabs — 8スペース打って ESC '1' で停止位置を「物理的に」刻み、DEL を連打して機械の動作完了を待つ197行、タブストップが機械の歯車だった時代の端末調律師",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "217",
    title: "鑑定書#217 quiz — a{eroplane}|airplane のような「ありうる答え方」を一つの文法で許す472行、解答照合・列名照合・正答表示を同じパターン言語で兼ね、正解すると出題範囲が広がる適応学習を1979年に実装したCAIゲーム",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "218",
    title: "鑑定書#218 arithmetic — 間違えた問題の数字を出題プールに増殖させ苦手な数ほど頻繁に出す215行、答えが必ず整数になる出題構成、三角分布と乗算シフト(剰余バイアス無し)の乱数の職人技",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "219",
    title: "鑑定書#219 spline — 140行の数学的導出をコメントに刻みHammingの教科書を出典に三重対角系を解く333行、「後ろ向きの再計算は野放図に不安定」と記録された三次スプライン補間、コードは数式の忠実な転写",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "220",
    title: "鑑定書#220 cu — 行頭の ~. で切断・~< でファイル送信、fork で全二重を作り端末ストリームの上にシェルコマンドでファイル転送を載せる539行(call Unix)、ssh の ~. がいまも受け継ぐモデムダイヤラの祖",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "221",
    title: "鑑定書#221 icheck — bmap[n] |= m でデータブロック1個を1ビットに刻み二重割り当て(dup)と迷子(missing)を暴く475行(inode check)、small/large/huge/garg の4段indirect走査・回転遅延ぶんずらす -s 自由リスト再構築・OSが起動せずとも動く STANDALONE 構成、fsck の祖",
    url: null,
    language: "C",
    year: 1979,
  },
  {
    number: "222",
    title: "鑑定書#222 ncheck — inode は自分の名前を知らない。全ディレクトリを生ディスクから読み素数2503サイズのハッシュ表でディレクトリだけを集め、3パスで親ポインタの木を組み直し pname() の再帰でパス名を逆算する322行(name check)、find と fsck の lost+found の祖",
    url: null,
    language: "C",
    year: 1979,
  },
];

export default function AppraisalPage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const current = items[selectedIdx];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 font-mono text-3xl font-bold text-[var(--lca-gold)]">
        Appraisal Corner
      </h1>
      <p className="mb-8 text-sm text-[var(--lca-text-dim)]">
        鑑定人の推理 vs AI の解析 — 同じコメントを人間と機械がどう読むか
      </p>

      {/* Published articles */}
      <section className="mb-12">
        <h2 className="mb-4 font-mono text-xl text-[var(--lca-gold)]">Published Appraisals</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLISHED_ARTICLES.map((article) => (
            <div
              key={article.number}
              className="rounded-lg border border-[var(--lca-brass)]/20 bg-[var(--lca-bg-card)] p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-[var(--lca-teal)]/15 px-2 py-0.5 font-mono text-xs text-[var(--lca-teal)]">
                  #{article.number}
                </span>
                <span className="text-xs text-[var(--lca-text-dim)]">{article.language}</span>
                <span className="text-xs text-[var(--lca-text-dim)]">{article.year}</span>
              </div>
              <p className="mb-3 text-sm text-[var(--lca-text)]">{article.title}</p>
              {article.url ? (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--lca-teal)] hover:underline"
                >
                  Read on note.com →
                </a>
              ) : (
                <span className="text-xs text-[var(--lca-text-dim)]">Coming soon</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Human vs AI comparison */}
      <section>
        <h2 className="mb-4 font-mono text-xl text-[var(--lca-gold)]">
          Human vs AI — コメント鑑定対決
        </h2>

        {/* Navigation */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setSelectedIdx(Math.max(0, selectedIdx - 1))}
            disabled={selectedIdx === 0}
            className="rounded-lg border border-[var(--lca-brass)]/30 px-3 py-1.5 text-sm disabled:opacity-30"
          >
            ← Prev
          </button>
          <span className="font-mono text-sm text-[var(--lca-text-dim)]">
            {selectedIdx + 1} / {items.length}
          </span>
          <button
            onClick={() => setSelectedIdx(Math.min(items.length - 1, selectedIdx + 1))}
            disabled={selectedIdx >= items.length - 1}
            className="rounded-lg border border-[var(--lca-brass)]/30 px-3 py-1.5 text-sm disabled:opacity-30"
          >
            Next →
          </button>
          <button
            onClick={() => setSelectedIdx(Math.floor(Math.random() * items.length))}
            className="rounded-lg border border-[var(--lca-teal)]/30 px-3 py-1.5 text-sm text-[var(--lca-teal)]"
          >
            Random
          </button>
        </div>

        {current && (
          <div className="space-y-4">
            {/* The comment */}
            <div className="rounded-xl border border-[var(--lca-brass)]/30 bg-[var(--lca-bg-card)] p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded bg-[var(--lca-teal)]/15 px-2 py-0.5 font-mono text-xs text-[var(--lca-teal)]">
                  {current.language}
                </span>
                <span className="text-xs text-[var(--lca-text-dim)]">{current.repo_name}</span>
                <span className="text-xs text-[var(--lca-text-dim)]">{current.year}</span>
                <span className="text-xs text-[var(--lca-text-dim)]">
                  {current.file_path}:{current.line_number}
                </span>
              </div>
              <p className="font-mono text-base leading-relaxed text-[var(--lca-text)]">
                {current.text}
              </p>
              {current.tags.length > 0 && (
                <div className="mt-3 flex gap-1">
                  {current.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[var(--lca-copper)]/20 px-2 py-0.5 text-xs text-[var(--lca-copper)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Comparison grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* AI Analysis */}
              <div className="rounded-xl border border-[var(--lca-teal)]/30 bg-[var(--lca-bg-card)] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <h3 className="font-mono text-sm font-bold text-[var(--lca-teal)]">
                    AI Analysis
                  </h3>
                </div>
                <p className="mb-3 text-sm text-[var(--lca-text)]">
                  {current.ai_analysis.interpretation}
                </p>
                {Object.keys(current.ai_analysis.emotions).length > 0 && (
                  <div className="space-y-1.5">
                    {Object.entries(current.ai_analysis.emotions).map(([emotion, score]) => (
                      <div key={emotion} className="flex items-center gap-2">
                        <span className="w-24 text-xs text-[var(--lca-text-dim)]">{emotion}</span>
                        <div className="h-2 flex-1 rounded-full bg-[var(--lca-bg)]">
                          <div
                            className="h-full rounded-full bg-[var(--lca-teal)]"
                            style={{ width: `${Math.min(100, score * 20)}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-xs text-[var(--lca-text-dim)]">
                          {score}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Human Appraiser */}
              <div className="rounded-xl border border-[var(--lca-gold)]/30 bg-[var(--lca-bg-card)] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">👤</span>
                  <h3 className="font-mono text-sm font-bold text-[var(--lca-gold)]">
                    Appraiser&apos;s Note
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-[var(--lca-text)]">
                  {current.appraiser_note}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
