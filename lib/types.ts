export type Source = "hackernews" | "devto" | "reddit";

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
}

export const SOURCE_LABELS: Record<Source, string> = {
  hackernews: "Hacker News",
  devto: "DEV",
  reddit: "Reddit",
};
