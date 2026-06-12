"use client";

import { useCallback, useEffect, useState } from "react";
import type { Story } from "./types";

const STORAGE_KEY = "technews-bookmarks";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Story[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setBookmarks(JSON.parse(raw));
    } catch {
      // corrupted storage — start fresh
    }
  }, []);

  const toggleBookmark = useCallback((story: Story) => {
    setBookmarks((current) => {
      const next = current.some((s) => s.id === story.id)
        ? current.filter((s) => s.id !== story.id)
        : [story, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (id: string) => bookmarks.some((s) => s.id === id),
    [bookmarks]
  );

  return { bookmarks, toggleBookmark, isBookmarked };
}
