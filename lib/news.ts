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

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&");
}

const REDDIT_SUBS = "technology+programming+webdev";
const REDDIT_UA =
  "web:technews-aggregator:1.0 (by /u/technews-app)";

// --- Reddit via official OAuth (works from cloud/datacenter IPs) ---------
// Reddit blocks unauthenticated requests from datacenter IPs (Vercel) with 403.
// With a free "script" app (client id + secret) we get an app-only OAuth token
// and hit oauth.reddit.com, which is allowed and also returns score/comments.

interface RedditListing {
  data: {
    children: {
      data: {
        id: string;
        title: string;
        url: string;
        permalink: string;
        score: number;
        num_comments: number;
        author: string;
        created_utc: number;
        subreddit: string;
        stickied: boolean;
        is_self: boolean;
      };
    }[];
  };
}

async function getRedditToken(
  id: string,
  secret: string
): Promise<string> {
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": REDDIT_UA,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Reddit token responded ${res.status}`);
  const data: { access_token?: string } = await res.json();
  if (!data.access_token) throw new Error("Reddit token missing in response");
  return data.access_token;
}

async function fetchRedditOAuth(
  id: string,
  secret: string
): Promise<Story[]> {
  const token = await getRedditToken(id, secret);
  const res = await fetch(
    `https://oauth.reddit.com/r/${REDDIT_SUBS}/hot?limit=30&raw_json=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": REDDIT_UA,
      },
      next: { revalidate: REVALIDATE_SECONDS },
    }
  );
  if (!res.ok) throw new Error(`Reddit API responded ${res.status}`);
  const listing: RedditListing = await res.json();

  return listing.data.children
    .filter(({ data }) => !data.stickied)
    .map(({ data }) => {
      const permalink = `https://www.reddit.com${data.permalink}`;
      return {
        id: `reddit-${data.id}`,
        title: data.title,
        url: data.is_self ? permalink : data.url,
        commentsUrl: permalink,
        source: "reddit" as const,
        score: data.score,
        comments: data.num_comments,
        author: data.author,
        publishedAt: new Date(data.created_utc * 1000).toISOString(),
        tags: [data.subreddit.toLowerCase()],
      };
    });
}

// --- Reddit via public Atom RSS (fallback, works from residential IPs) ----
// Used when no OAuth credentials are set (e.g. local dev). RSS carries no
// score or comment count, so those stay 0.
async function fetchRedditRSS(): Promise<Story[]> {
  const res = await fetch(
    `https://www.reddit.com/r/${REDDIT_SUBS}/.rss?limit=30`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TechNews-aggregator/1.0",
      },
      next: { revalidate: REVALIDATE_SECONDS },
    }
  );
  if (!res.ok) throw new Error(`Reddit RSS responded ${res.status}`);
  const xml = await res.text();

  return xml
    .split("<entry>")
    .slice(1)
    .flatMap((entry) => {
      const field = (tag: string) =>
        entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1] ??
        "";
      const permalink = entry.match(/<link href="([^"]+)"/)?.[1];
      const title = decodeXmlEntities(field("title"));
      if (!permalink || !title) return [];

      // Link posts embed the external URL in the content HTML as
      // <a href="...">[link]</a>; self posts have no such anchor. The content
      // is HTML-escaped inside the XML, so the URL needs two decode passes.
      const external = entry.match(
        /href=&quot;((?:(?!&quot;).)*)&quot;&gt;\[link\]/
      )?.[1];
      const subreddit = entry
        .match(/<category term="([^"]+)"/)?.[1]
        ?.toLowerCase();

      return [
        {
          id: `reddit-${field("id").replace(/^t3_/, "")}`,
          title,
          url: external
            ? decodeXmlEntities(decodeXmlEntities(external))
            : permalink,
          commentsUrl: permalink,
          source: "reddit" as const,
          score: 0,
          comments: 0,
          author: field("name").replace(/^\/u\//, ""),
          publishedAt: field("published") || field("updated"),
          tags: subreddit ? [subreddit] : [],
        },
      ];
    });
}

async function fetchReddit(): Promise<Story[]> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (id && secret) {
    try {
      return await fetchRedditOAuth(id, secret);
    } catch {
      // Creds bad or Reddit hiccup — fall back to public RSS.
      return fetchRedditRSS();
    }
  }
  return fetchRedditRSS();
}

export async function fetchAllStories(): Promise<Story[]> {
  const results = await Promise.allSettled([
    fetchHackerNews(),
    fetchDevTo(),
    fetchReddit(),
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
