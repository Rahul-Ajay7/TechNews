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

interface LobstersStory {
  short_id: string;
  title: string;
  url: string;
  score: number;
  comment_count: number;
  comments_url: string;
  created_at: string;
  submitter_user: string | { username: string };
  tags: string[];
}

async function fetchLobsters(): Promise<Story[]> {
  const res = await fetch("https://lobste.rs/hottest.json", {
    headers: { "User-Agent": "Cometry-aggregator/1.0" },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`Lobsters API responded ${res.status}`);
  const stories: LobstersStory[] = await res.json();

  return stories.map((story) => ({
    id: `lobsters-${story.short_id}`,
    title: story.title,
    // Text-only posts have an empty url; fall back to the discussion page.
    url: story.url || story.comments_url,
    commentsUrl: story.comments_url,
    source: "lobsters" as const,
    score: story.score,
    comments: story.comment_count,
    author:
      typeof story.submitter_user === "string"
        ? story.submitter_user
        : story.submitter_user.username,
    publishedAt: story.created_at,
    tags: story.tags,
  }));
}

interface GitHubRepo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  owner: { login: string };
  created_at: string;
}

async function fetchGitHub(): Promise<Story[]> {
  // No official "trending" API — approximate it with repos created in the last
  // month, ranked by stars. Unauthenticated search is rate-limited but the
  // 5-min ISR cache keeps us well under the cap.
  const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const res = await fetch(
    `https://api.github.com/search/repositories?q=created:>${since}+stars:>50&sort=stars&order=desc&per_page=25`,
    {
      headers: {
        "User-Agent": "Cometry-aggregator/1.0",
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: REVALIDATE_SECONDS },
    }
  );
  if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
  const data: { items: GitHubRepo[] } = await res.json();

  return data.items.map((repo) => ({
    id: `github-${repo.id}`,
    title: repo.full_name,
    url: repo.html_url,
    commentsUrl: repo.html_url,
    source: "github" as const,
    score: repo.stargazers_count,
    comments: 0,
    author: repo.owner.login,
    publishedAt: repo.created_at,
    tags: repo.language ? [repo.language.toLowerCase()] : [],
    excerpt: repo.description?.trim() || undefined,
  }));
}

export async function fetchAllStories(): Promise<Story[]> {
  const results = await Promise.allSettled([
    fetchHackerNews(),
    fetchDevTo(),
    fetchLobsters(),
    fetchGitHub(),
  ]);
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
