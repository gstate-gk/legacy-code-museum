"use client";

import { useState, useMemo, useCallback } from "react";
import commentsIndex from "@/data/comments_index.json";
import interestingFinds from "@/data/interesting_finds.json";
import type { CommentsIndex, FullComment } from "@/types";

const index = commentsIndex as CommentsIndex;
const allComments = interestingFinds as unknown as FullComment[];

const EMOTIONS = ["neutral", "frustration", "uncertainty", "urgency", "resignation", "humor", "pride", "apology", "warning"];
const PAGE_SIZE = 50;

export default function ExplorerPage() {
  const [search, setSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("");
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selectedComment, setSelectedComment] = useState<FullComment | null>(null);

  const filtered = useMemo(() => {
    let result = allComments;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((c) => c.text.toLowerCase().includes(lower));
    }
    if (selectedLang) {
      result = result.filter((c) => c.language === selectedLang);
    }
    if (selectedRepo) {
      result = result.filter((c) => c.repo_id === selectedRepo);
    }
    if (selectedTag) {
      result = result.filter((c) => c.tags.includes(selectedTag));
    }
    if (selectedEmotion) {
      if (selectedEmotion === "neutral") {
        result = result.filter((c) => c.primary_emotion === "neutral");
      } else {
        result = result.filter((c) => c.primary_emotion === selectedEmotion);
      }
    }

    return result;
  }, [search, selectedLang, selectedRepo, selectedTag, selectedEmotion]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const resetFilters = useCallback(() => {
    setSearch("");
    setSelectedLang("");
    setSelectedRepo("");
    setSelectedTag("");
    setSelectedEmotion("");
    setPage(0);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 font-mono text-3xl font-bold text-[var(--lca-gold)]">
        Comment Explorer
      </h1>
      <p className="mb-6 text-sm text-[var(--lca-text-dim)]">
        スコア上位500件のコメントを検索・フィルタ（全{index.total.toLocaleString()}件中）
      </p>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search comments..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="flex-1 min-w-[200px] rounded-lg border border-[var(--lca-brass)]/30 bg-[var(--lca-bg-card)] px-4 py-2 text-sm text-[var(--lca-text)] placeholder-[var(--lca-text-dim)] focus:border-[var(--lca-teal)] focus:outline-none"
        />
        <FilterSelect
          value={selectedLang}
          onChange={(v) => { setSelectedLang(v); setPage(0); }}
          options={index.languages}
          placeholder="Language"
        />
        <FilterSelect
          value={selectedRepo}
          onChange={(v) => { setSelectedRepo(v); setPage(0); }}
          options={index.repos}
          placeholder="Repository"
        />
        <FilterSelect
          value={selectedTag}
          onChange={(v) => { setSelectedTag(v); setPage(0); }}
          options={index.tags}
          placeholder="Tag"
        />
        <FilterSelect
          value={selectedEmotion}
          onChange={(v) => { setSelectedEmotion(v); setPage(0); }}
          options={EMOTIONS}
          placeholder="Emotion"
        />
        <button
          onClick={resetFilters}
          className="rounded-lg border border-[var(--lca-brass)]/30 bg-[var(--lca-bg-card)] px-4 py-2 text-sm text-[var(--lca-text-dim)] hover:text-[var(--lca-text)]"
        >
          Reset
        </button>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-[var(--lca-text-dim)]">
        {filtered.length} results {page > 0 && `(page ${page + 1}/${pageCount})`}
      </div>

      {/* Comment list */}
      <div className="space-y-3">
        {paged.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            onClick={() => setSelectedComment(comment)}
          />
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-lg border border-[var(--lca-brass)]/30 px-3 py-1.5 text-sm disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-sm text-[var(--lca-text-dim)]">
            {page + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
            disabled={page >= pageCount - 1}
            className="rounded-lg border border-[var(--lca-brass)]/30 px-3 py-1.5 text-sm disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selectedComment && (
        <CommentDetail
          comment={selectedComment}
          onClose={() => setSelectedComment(null)}
        />
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[var(--lca-brass)]/30 bg-[var(--lca-bg-card)] px-3 py-2 text-sm text-[var(--lca-text)] focus:border-[var(--lca-teal)] focus:outline-none"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

function CommentCard({
  comment,
  onClick,
}: {
  comment: FullComment;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-[var(--lca-brass)]/15 bg-[var(--lca-bg-card)] p-4 text-left transition-all hover:border-[var(--lca-brass)]/40"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded bg-[var(--lca-teal)]/15 px-2 py-0.5 font-mono text-xs text-[var(--lca-teal)]">
          {comment.language}
        </span>
        <span className="text-xs text-[var(--lca-text-dim)]">
          {comment.repo_name}
        </span>
        <span className="text-xs text-[var(--lca-text-dim)]">
          {comment.file_path}:{comment.line_number}
        </span>
        {comment.tags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-[var(--lca-copper)]/20 px-1.5 py-0.5 text-xs text-[var(--lca-copper)]"
          >
            {tag}
          </span>
        ))}
        {comment.primary_emotion !== "neutral" && (
          <span className="rounded bg-[var(--lca-gold)]/15 px-1.5 py-0.5 text-xs text-[var(--lca-gold)]">
            {comment.primary_emotion} ({comment.emotion_intensity})
          </span>
        )}
      </div>
      <p className="font-mono text-sm leading-relaxed text-[var(--lca-text)]">
        {comment.text.length > 200 ? comment.text.slice(0, 200) + "..." : comment.text}
      </p>
    </button>
  );
}

function CommentDetail({
  comment,
  onClose,
}: {
  comment: FullComment;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[var(--lca-brass)]/30 bg-[var(--lca-bg)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-lg text-[var(--lca-gold)]">Comment Detail</h3>
          <button onClick={onClose} className="text-[var(--lca-text-dim)] hover:text-[var(--lca-text)]">
            Close
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-[var(--lca-bg-card)] p-4">
          <p className="font-mono text-sm leading-relaxed text-[var(--lca-text)]">{comment.text}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <DetailRow label="Repository" value={comment.repo_name} />
          <DetailRow label="Language" value={comment.language} />
          <DetailRow label="File" value={comment.file_path} />
          <DetailRow label="Line" value={comment.line_number.toString()} />
          <DetailRow label="Year" value={comment.year.toString()} />
          <DetailRow label="Score" value={comment.interesting_score.toString()} />
        </div>

        {comment.tags.length > 0 && (
          <div className="mt-4">
            <span className="text-xs text-[var(--lca-text-dim)]">Tags: </span>
            {comment.tags.map((tag) => (
              <span
                key={tag}
                className="mr-1 rounded bg-[var(--lca-copper)]/20 px-2 py-0.5 text-xs text-[var(--lca-copper)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {Object.keys(comment.emotions).length > 0 && (
          <div className="mt-4">
            <span className="text-xs text-[var(--lca-text-dim)]">Emotions: </span>
            <div className="mt-1 flex flex-wrap gap-2">
              {Object.entries(comment.emotions).map(([emotion, score]) => (
                <div key={emotion} className="flex items-center gap-1">
                  <span className="text-xs text-[var(--lca-gold)]">{emotion}</span>
                  <div className="h-1.5 w-16 rounded-full bg-[var(--lca-bg-card)]">
                    <div
                      className="h-full rounded-full bg-[var(--lca-teal)]"
                      style={{ width: `${Math.min(100, score * 20)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--lca-text-dim)]">{score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--lca-text-dim)]">{label}</div>
      <div className="font-mono text-sm text-[var(--lca-text)]">{value}</div>
    </div>
  );
}
