"use client";

import { useState, useCallback } from "react";
import interestingFinds from "@/data/interesting_finds.json";
import type { FullComment } from "@/types";

const finds = interestingFinds as unknown as FullComment[];
const TOP_FINDS = finds.slice(0, 100);

function getRandomFind(): FullComment {
  return TOP_FINDS[Math.floor(Math.random() * TOP_FINDS.length)];
}

export default function DiscoveryPage() {
  const [find, setFind] = useState<FullComment>(getRandomFind);

  const refresh = useCallback(() => {
    setFind(getRandomFind());
  }, []);

  const emotionEntries = Object.entries(find.emotions);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 font-mono text-3xl font-bold text-[var(--lca-gold)]">
        Today&apos;s Discovery
      </h1>
      <p className="mb-8 text-sm text-[var(--lca-text-dim)]">
        発掘されたコメントが1件表示される。リロードで次の発見。
      </p>

      {/* The discovery card */}
      <div className="mb-8 rounded-2xl border border-[var(--lca-gold)]/30 bg-[var(--lca-bg-card)] p-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-2xl">💎</span>
          <span className="rounded bg-[var(--lca-teal)]/15 px-2 py-0.5 font-mono text-xs text-[var(--lca-teal)]">
            {find.language}
          </span>
          <span className="text-xs text-[var(--lca-text-dim)]">{find.repo_name}</span>
          <span className="text-xs text-[var(--lca-text-dim)]">{find.year}</span>
          {find.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-[var(--lca-copper)]/20 px-2 py-0.5 text-xs text-[var(--lca-copper)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* The comment */}
        <blockquote className="mb-6 border-l-4 border-[var(--lca-gold)] pl-4 font-mono text-lg leading-relaxed text-[var(--lca-text)]">
          {find.text}
        </blockquote>

        {/* Source */}
        <div className="mb-6 text-xs text-[var(--lca-text-dim)]">
          {find.file_path}:{find.line_number}
        </div>

        {/* Emotion analysis */}
        {emotionEntries.length > 0 && (
          <div className="rounded-lg bg-[var(--lca-bg)] p-4">
            <div className="mb-2 text-xs font-bold text-[var(--lca-text-dim)]">EMOTION ANALYSIS</div>
            <div className="space-y-2">
              {emotionEntries.map(([emotion, score]) => (
                <div key={emotion} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-[var(--lca-text-dim)]">{emotion}</span>
                  <div className="h-3 flex-1 rounded-full bg-[var(--lca-bg-card)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--lca-teal)] to-[var(--lca-gold)]"
                      style={{ width: `${Math.min(100, score * 20)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-xs text-[var(--lca-text-dim)]">{score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interesting score */}
        <div className="mt-4 text-center">
          <span className="font-mono text-xs text-[var(--lca-text-dim)]">Interesting Score: </span>
          <span className="font-mono text-sm font-bold text-[var(--lca-gold)]">
            {find.interesting_score}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <button
          onClick={refresh}
          className="rounded-lg bg-[var(--lca-brass)] px-8 py-3 text-sm font-bold text-[var(--lca-bg)] transition-colors hover:bg-[var(--lca-gold)]"
        >
          Next Discovery
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `💎 発掘品: "${find.text.slice(0, 80)}..." — ${find.language} (${find.year}) #LegacyCodeMuseum #コード考古学`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-[var(--lca-brass)]/30 px-6 py-3 text-sm text-[var(--lca-text-dim)] hover:text-[var(--lca-text)]"
        >
          Share on X
        </a>
      </div>
    </div>
  );
}
