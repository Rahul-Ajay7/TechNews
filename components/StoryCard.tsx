"use client";

import type { Story } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";
import { hostname, timeAgo } from "@/lib/format";

const SOURCE_STYLES: Record<Story["source"], string> = {
  hackernews: "bg-orange-500/15 text-orange-400",
  devto: "bg-violet-500/15 text-violet-400",
};

export default function StoryCard({
  story,
  bookmarked,
  onToggleBookmark,
}: {
  story: Story;
  bookmarked: boolean;
  onToggleBookmark: (story: Story) => void;
}) {
  const host = hostname(story.url);

  return (
    <article className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${SOURCE_STYLES[story.source]}`}
            >
              {SOURCE_LABELS[story.source]}
            </span>
            {host && <span className="text-zinc-500">{host}</span>}
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500">{timeAgo(story.publishedAt)}</span>
          </div>
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[15px] font-semibold leading-snug text-zinc-100 hover:text-cyan-400"
          >
            {story.title}
          </a>
          {story.excerpt && (
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-zinc-400">
              {story.excerpt}
            </p>
          )}
          {story.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {story.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-xs text-zinc-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onToggleBookmark(story)}
          aria-label={bookmarked ? "Remove bookmark" : "Save story"}
          title={bookmarked ? "Remove bookmark" : "Save story"}
          className={`shrink-0 rounded-lg p-1.5 transition-colors ${
            bookmarked
              ? "text-cyan-400 hover:text-cyan-300"
              : "text-zinc-600 hover:text-zinc-300"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill={bookmarked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4z" />
          </svg>
        </button>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        {story.score > 0 && (
          <span className="font-medium text-zinc-400">▲ {story.score}</span>
        )}
        <a
          href={story.commentsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-300"
        >
          {story.comments > 0
            ? `${story.comments} comment${story.comments === 1 ? "" : "s"}`
            : "discussion"}
        </a>
        <span>by {story.author}</span>
      </div>
    </article>
  );
}
