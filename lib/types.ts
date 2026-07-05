export type Source = "hackernews" | "devto" | "lobsters" | "github";

export interface Story {
  id: string;
  title: string;
  url: string;
  commentsUrl: string;
  source: Source;
  score: number;
  comments: number;
  author: string;
  publishedAt: string;
  tags: string[];
  // Short snippet from the source API (DEV only); one-line teaser under title.
  excerpt?: string;
}

export const SOURCE_LABELS: Record<Source, string> = {
  hackernews: "Hacker News",
  devto: "DEV",
  lobsters: "Lobsters",
  github: "GitHub",
};
