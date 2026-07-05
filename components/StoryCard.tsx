"use client";

import { useState } from "react";
import type { Story } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";
import { hostname, timeAgo } from "@/lib/format";

const SOURCE_STYLES: Record<Story["source"], string> = {
  hackernews: "bg-orange-500/15 text-orange-400",
  devto: "bg-violet-500/15 text-violet-400",
  lobsters: "bg-red-500/15 text-red-400",
  github: "bg-emerald-500/15 text-emerald-400",
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
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: story.title, url: story.url });
      } catch {
        // user dismissed the share sheet — nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(story.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — silently ignore
    }
  }

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
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={share}
            aria-label="Share story"
            title={copied ? "Link copied!" : "Share story"}
            className={`rounded-lg p-1.5 transition-colors ${
              copied
                ? "text-cyan-400"
                : "text-zinc-600 hover:text-zinc-300"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
            </svg>
          </button>
          <button
            onClick={() => onToggleBookmark(story)}
            aria-label={bookmarked ? "Remove bookmark" : "Save story"}
            title={bookmarked ? "Remove bookmark" : "Save story"}
            className={`rounded-lg p-1.5 transition-colors ${
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
