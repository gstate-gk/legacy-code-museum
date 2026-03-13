"use client";

import { useState, useCallback } from "react";
import antiques from "@/data/antiques.json";
import type { Antique } from "@/types";

const items = antiques as unknown as Antique[];

const CHOICES_SETS = [
  [
    "深夜のデバッグ中に書いた怒りのコメント",
    "新人が先輩のコードを読んで困惑した記録",
    "仕様変更の嵐の中で諦めた痕跡",
    "リファクタリング計画のメモ",
  ],
  [
    "納期直前の応急処置",
    "バグの原因がわからず途方に暮れた瞬間",
    "チームメンバーへの申し送り",
    "将来の自分への警告",
  ],
  [
    "技術的負債を認めつつも先に進んだ記録",
    "コードレビューで指摘されたが直さなかった箇所",
    "テスト環境でのみ発生するバグへの対処",
    "パフォーマンス最適化を後回しにした判断",
  ],
  [
    "経験豊富な開発者の設計メモ",
    "プロトタイプから本番に昇格したコードの名残",
    "外部ライブラリの挙動に振り回された記録",
    "セキュリティホールを見つけたが修正できなかった痕跡",
  ],
];

function getRandomItem(): Antique {
  return items[Math.floor(Math.random() * items.length)];
}

function getChoices(): string[] {
  return CHOICES_SETS[Math.floor(Math.random() * CHOICES_SETS.length)];
}

export default function QuizPage() {
  const [current, setCurrent] = useState<Antique>(getRandomItem);
  const [choices] = useState<string[]>(getChoices);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const handleChoice = useCallback((idx: number) => {
    setSelectedChoice(idx);
    setRevealed(true);
    setTotal((t) => t + 1);
    setScore((s) => s + 1); // Every answer is valid
  }, []);

  const nextQuestion = useCallback(() => {
    setCurrent(getRandomItem());
    setSelectedChoice(null);
    setRevealed(false);
  }, []);

  const shareText = `Legacy Code Museum Quiz: ${total}問中${score}問を考古学的に解釈しました！ #LegacyCodeMuseum #コード考古学`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-mono text-3xl font-bold text-[var(--lca-gold)]">
          Archaeology Quiz
        </h1>
        {total > 0 && (
          <span className="font-mono text-sm text-[var(--lca-teal)]">
            {score}/{total} explored
          </span>
        )}
      </div>
      <p className="mb-8 text-sm text-[var(--lca-text-dim)]">
        コメントの背景を推理せよ。正解はない — 解釈の多様性を楽しむ。
      </p>

      {/* Question */}
      <div className="mb-6 rounded-xl border border-[var(--lca-brass)]/30 bg-[var(--lca-bg-card)] p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded bg-[var(--lca-teal)]/15 px-2 py-0.5 font-mono text-xs text-[var(--lca-teal)]">
            {current.language}
          </span>
          <span className="text-xs text-[var(--lca-text-dim)]">{current.repo_name}</span>
          <span className="text-xs text-[var(--lca-text-dim)]">{current.year}</span>
        </div>
        <p className="mb-4 font-mono text-base leading-relaxed text-[var(--lca-text)]">
          {current.text}
        </p>
        <p className="font-mono text-sm text-[var(--lca-gold)]">
          このコメントの背景にあったのは？
        </p>
      </div>

      {/* Choices */}
      {!revealed && (
        <div className="mb-6 space-y-3">
          {choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => handleChoice(idx)}
              className="w-full rounded-lg border border-[var(--lca-brass)]/20 bg-[var(--lca-bg-card)] p-4 text-left text-sm text-[var(--lca-text)] transition-all hover:border-[var(--lca-brass)]/50 hover:bg-[var(--lca-bg-light)]"
            >
              <span className="mr-2 font-mono text-[var(--lca-brass)]">
                {String.fromCharCode(65 + idx)}.
              </span>
              {choice}
            </button>
          ))}
        </div>
      )}

      {/* Revealed */}
      {revealed && (
        <div className="space-y-4">
          {/* Your choice */}
          {selectedChoice !== null && (
            <div className="rounded-lg border border-[var(--lca-teal)]/30 bg-[var(--lca-bg-card)] p-4">
              <div className="mb-1 text-xs text-[var(--lca-teal)]">Your interpretation:</div>
              <p className="text-sm text-[var(--lca-text)]">{choices[selectedChoice]}</p>
            </div>
          )}

          {/* AI vs Human */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--lca-teal)]/30 bg-[var(--lca-bg-card)] p-5">
              <div className="mb-2 flex items-center gap-2">
                <span>🤖</span>
                <span className="font-mono text-sm font-bold text-[var(--lca-teal)]">AI Analysis</span>
              </div>
              <p className="text-sm text-[var(--lca-text)]">
                {current.ai_analysis.interpretation}
              </p>
              {Object.keys(current.ai_analysis.emotions).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(current.ai_analysis.emotions).map(([e, s]) => (
                    <span key={e} className="rounded bg-[var(--lca-teal)]/10 px-2 py-0.5 text-xs text-[var(--lca-teal)]">
                      {e}: {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-[var(--lca-gold)]/30 bg-[var(--lca-bg-card)] p-5">
              <div className="mb-2 flex items-center gap-2">
                <span>👤</span>
                <span className="font-mono text-sm font-bold text-[var(--lca-gold)]">Appraiser</span>
              </div>
              <p className="text-sm text-[var(--lca-text)]">{current.appraiser_note}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={nextQuestion}
              className="rounded-lg bg-[var(--lca-brass)] px-6 py-2.5 text-sm font-bold text-[var(--lca-bg)]"
            >
              Next Question →
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[var(--lca-brass)]/30 px-4 py-2.5 text-sm text-[var(--lca-text-dim)] hover:text-[var(--lca-text)]"
            >
              Share on X
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
