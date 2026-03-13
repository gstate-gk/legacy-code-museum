"use client";

import { useState } from "react";
import antiques from "@/data/antiques.json";
import type { Antique } from "@/types";

const items = antiques as unknown as Antique[];

const PUBLISHED_ARTICLES = [
  {
    number: "001",
    title: "変愚蛮怒 Lua Fork — 33万行のCコードから発掘されたTODOコメント",
    url: "https://note.com/gstate_kamiya/n/n39c6590f3372",
    language: "C + Lua",
    year: 2002,
  },
  {
    number: "002",
    title: "COBOL会計システム — メインフレームの記憶",
    url: null,
    language: "COBOL",
    year: 2011,
  },
  {
    number: "003",
    title: "Habitat — 世界初のMMOサーバー (1986年 Lucasfilm)",
    url: null,
    language: "PL/I",
    year: 1986,
  },
  {
    number: "004",
    title: "CardDemo — COBOL+CICSクレジットカードシステム",
    url: null,
    language: "COBOL + ASM",
    year: 2022,
  },
  {
    number: "005",
    title: "VB6 POS — 神フォーム3,150行の解体",
    url: null,
    language: "VB6",
    year: 2020,
  },
  {
    number: "006",
    title: "変愚蛮怒 Web — 33万行のCをブラウザで遊べるように",
    url: null,
    language: "C → Python+React",
    year: "2002→2026",
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
