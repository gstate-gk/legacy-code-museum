import Link from "next/link";
import commentsIndex from "@/data/comments_index.json";
import langEmotions from "@/data/language_emotions.json";
import type { CommentsIndex, LanguageEmotions } from "@/types";

const index = commentsIndex as CommentsIndex;
const emotions = langEmotions as LanguageEmotions;

const FEATURES = [
  {
    href: "/explorer",
    title: "Comment Explorer",
    subtitle: "コメント・エクスプローラー",
    description: `${index.total.toLocaleString()}件のコメントを検索・フィルタ。言語、感情、タグで絞り込み。`,
    icon: "🔍",
    stat: `${index.total.toLocaleString()} comments`,
  },
  {
    href: "/appraisal",
    title: "Appraisal Corner",
    subtitle: "鑑定コーナー",
    description: "鑑定人の推理 vs AI の解析。同じコメントを人間と機械がどう読むか。",
    icon: "🔎",
    stat: "Human vs AI",
  },
  {
    href: "/quiz",
    title: "Archaeology Quiz",
    subtitle: "コード考古学クイズ",
    description: "コメントの背景を推理せよ。正解はない。解釈の多様性を楽しむ。",
    icon: "❓",
    stat: "Infinite plays",
  },
  {
    href: "/discovery",
    title: "Today's Discovery",
    subtitle: "今日の発掘品",
    description: "ページを開くたびに、発掘されたコメントが1件表示される。",
    icon: "💎",
    stat: "Random find",
  },
];

export default function HomePage() {
  const totalEmotional = Object.values(emotions).reduce(
    (sum, lang) => sum + Object.values(lang.emotions).reduce((s, e) => s + e.count, 0), 0
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 font-mono text-4xl font-bold text-[var(--lca-gold)] sm:text-5xl">
          Legacy Code Museum
        </h1>
        <p className="mx-auto mb-2 max-w-2xl text-lg text-[var(--lca-text)]">
          コード考古学のインタラクティブ博物館
        </p>
        <p className="mx-auto max-w-2xl text-[var(--lca-text-dim)]">
          {index.total.toLocaleString()}件のコメントから読み解く、プログラマたちの声。
          <br />
          {index.languages.length}言語、{index.repos.length}リポジトリ、1986年から2022年まで。
        </p>
      </section>

      {/* Stats bar */}
      <section className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Comments" value={index.total.toLocaleString()} />
        <StatCard label="Languages" value={index.languages.length.toString()} />
        <StatCard label="Repositories" value={index.repos.length.toString()} />
        <StatCard label="With Emotion" value={totalEmotional.toLocaleString()} />
      </section>

      {/* Language breakdown */}
      <section className="mb-16">
        <h2 className="mb-6 font-mono text-2xl text-[var(--lca-gold)]">
          Collection by Language
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(emotions)
            .sort((a, b) => b.total_comments - a.total_comments)
            .map((lang) => (
              <div
                key={lang.language}
                className="rounded-lg border border-[var(--lca-brass)]/20 bg-[var(--lca-bg-card)] p-4"
              >
                <div className="mb-1 font-mono text-sm text-[var(--lca-teal)]">{lang.language}</div>
                <div className="text-2xl font-bold text-[var(--lca-gold)]">
                  {lang.total_comments.toLocaleString()}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {lang.top_emotions.slice(0, 3).map((emotion) => (
                    <span
                      key={emotion}
                      className="rounded-full bg-[var(--lca-brass)]/10 px-2 py-0.5 text-xs text-[var(--lca-brass)]"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="mb-16">
        <h2 className="mb-6 font-mono text-2xl text-[var(--lca-gold)]">
          Exhibits
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group rounded-xl border border-[var(--lca-brass)]/20 bg-[var(--lca-bg-card)] p-6 transition-all hover:border-[var(--lca-brass)]/50 hover:bg-[var(--lca-bg-light)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-3xl">{feature.icon}</span>
                <span className="rounded-full bg-[var(--lca-teal)]/10 px-3 py-1 text-xs font-mono text-[var(--lca-teal)]">
                  {feature.stat}
                </span>
              </div>
              <h3 className="mb-1 font-mono text-xl text-[var(--lca-gold)] group-hover:text-[var(--lca-copper)]">
                {feature.title}
              </h3>
              <p className="mb-2 text-sm text-[var(--lca-brass)]">{feature.subtitle}</p>
              <p className="text-sm text-[var(--lca-text-dim)]">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="rounded-xl border border-[var(--lca-brass)]/20 bg-[var(--lca-bg-card)] p-8 text-center">
        <h2 className="mb-4 font-mono text-xl text-[var(--lca-gold)]">About This Museum</h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--lca-text-dim)]">
          Legacy Code Archive (LCA) は、消えゆく古いコードを収集・分析するプロジェクトです。
          COBOL、PL/I、RPG、VB6、C+Lua、そして米陸軍CADやQEMU — 1978年から2022年までの{index.repos.length}リポジトリから
          {index.total.toLocaleString()}件のコメントを発掘しました。
          プログラマたちが残した TODO、FIXME、HACK、そして呟きから、
          ソフトウェア開発の歴史と人間の営みを読み解きます。
        </p>
        <p className="mt-4 text-xs text-[var(--lca-text-dim)]">
          G.state Inc. / AI + Human Collaboration
        </p>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--lca-brass)]/20 bg-[var(--lca-bg-card)] p-4 text-center">
      <div className="font-mono text-2xl font-bold text-[var(--lca-gold)]">{value}</div>
      <div className="mt-1 text-xs text-[var(--lca-text-dim)]">{label}</div>
    </div>
  );
}
