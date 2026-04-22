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
