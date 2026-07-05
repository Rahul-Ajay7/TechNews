"use client";

import { useMemo, useState } from "react";
import type { Source, Story } from "@/lib/types";
import { useBookmarks } from "@/lib/useBookmarks";
import StoryCard from "./StoryCard";

type Tab = "all" | Source | "saved";
type Sort = "latest" | "top";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "hackernews", label: "Hacker News" },
  { id: "devto", label: "DEV" },
  { id: "lobsters", label: "Lobsters" },
  { id: "github", label: "GitHub" },
  { id: "saved", label: "Saved" },
];

const SOURCE_TABS: Source[] = ["hackernews", "devto", "lobsters", "github"];

export default function Feed({ initialStories }: { initialStories: Story[] }) {
  const [stories, setStories] = useState(initialStories);
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<Sort>("latest");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks();

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data: { stories: Story[] } = await res.json();
      setStories(data.stories);
    } catch {
      setError("Couldn't refresh the feed. Try again in a moment.");
    } finally {
      setRefreshing(false);
    }
  }

  const visible = useMemo(() => {
    let list = tab === "saved" ? bookmarks : stories;
    if (tab !== "all" && tab !== "saved" && SOURCE_TABS.includes(tab)) {
      list = list.filter((s) => s.source === tab);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) =>
      sort === "top"
        ? b.score - a.score
        : new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [stories, bookmarks, tab, query, sort]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-cyan-500/15 text-cyan-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {label}
              {id === "saved" && bookmarks.length > 0 && (
                <span className="ml-1.5 text-xs text-zinc-500">
                  {bookmarks.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-800 p-0.5 text-xs">
            {(["latest", "top"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
                  sort === s
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search stories and tags…"
        className="mb-5 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50"
      />

      {error && (
        <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">
          {tab === "saved"
            ? "No saved stories yet — tap the bookmark icon on any story."
            : "No stories match your search."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              bookmarked={isBookmarked(story.id)}
              onToggleBookmark={toggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
}
