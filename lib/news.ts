import type { Story } from "./types";

const REVALIDATE_SECONDS = 300;

interface HNHit {
  objectID: string;
  title: string | null;
  url: string | null;
  points: number | null;
  num_comments: number | null;
  author: string;
  created_at: string;
}

async function fetchHackerNews(): Promise<Story[]> {
  const res = await fetch(
    "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30",
    { next: { revalidate: REVALIDATE_SECONDS } }
  );
  if (!res.ok) throw new Error(`Hacker News API responded ${res.status}`);
  const data: { hits: HNHit[] } = await res.json();

  return data.hits
    .filter((hit) => hit.title)
    .map((hit) => {
      const commentsUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;
      return {
        id: `hn-${hit.objectID}`,
        title: hit.title!,
        url: hit.url ?? commentsUrl,
        commentsUrl,
        source: "hackernews" as const,
        score: hit.points ?? 0,
        comments: hit.num_comments ?? 0,
        author: hit.author,
        publishedAt: hit.created_at,
        tags: [],
      };
    });
}

interface DevToArticle {
  id: number;
  title: string;
  url: string;
  positive_reactions_count: number;
  comments_count: number;
  published_at: string;
  description: string;
  user: { username: string };
  // The list endpoint returns tag_list as an array and tags as a string;
  // single-article responses swap them.
  tag_list: string[] | string;
}

async function fetchDevTo(): Promise<Story[]> {
  const res = await fetch("https://dev.to/api/articles?top=2&per_page=30", {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`DEV API responded ${res.status}`);
  const articles: DevToArticle[] = await res.json();

  return articles.map((article) => ({
    id: `devto-${article.id}`,
    title: article.title,
    url: article.url,
    commentsUrl: `${article.url}#comments`,
    source: "devto" as const,
    score: article.positive_reactions_count,
    comments: article.comments_count,
    author: article.user.username,
    publishedAt: article.published_at,
    tags: Array.isArray(article.tag_list)
      ? article.tag_list
      : article.tag_list.split(",").map((t) => t.trim()).filter(Boolean),
    excerpt: article.description?.trim() || undefined,
  }));
}

export async function fetchAllStories(): Promise<Story[]> {
  const results = await Promise.allSettled([fetchHackerNews(), fetchDevTo()]);
  const stories = results
    .filter(
      (result): result is PromiseFulfilledResult<Story[]> =>
        result.status === "fulfilled"
    )
    .flatMap((result) => result.value);

  if (stories.length === 0) {
    const reasons = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => String(r.reason));
    throw new Error(`All news sources failed: ${reasons.join("; ")}`);
  }

  return stories.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
