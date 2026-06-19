# TechNews

Developer news in one fast feed. Aggregates top stories from Hacker News, DEV,
and Reddit into a single dark, searchable feed — **no API keys, no accounts, no
cost.**

## Features

- **Three sources, one feed** — merged and de-duplicated, newest first
- **Filter by source** — All / Hacker News / DEV / Reddit tabs
- **Sort** — Latest or Top (by score)
- **Search** — full-text across titles and tags, client-side and instant
- **Bookmarks** — save stories for later in `localStorage`; no login
- **Live refresh** — server cache revalidates every 5 minutes; manual Refresh button
- **Resilient** — one source failing never blanks the feed (`Promise.allSettled`)
- Dark theme, responsive layout

## Sources

| Source | Endpoint | Key? | Notes |
|--------|----------|------|-------|
| Hacker News | [Algolia Search API](https://hn.algolia.com/api) `front_page` | No | Score + comment counts |
| DEV | [Forem API](https://developers.forem.com/api) `articles?top=2` | No | Score + comments + tags |
| Reddit | Atom RSS of `r/technology+programming+webdev` | No | RSS gives no score/comments (Reddit blocks unauthenticated JSON); cards show "discussion" |

All free, all public. Adding a paid or key-gated source is a deliberate choice — not a default.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) with TypeScript
- Tailwind CSS v4
- Home page server-rendered with ISR (`revalidate = 300`); `/api/news` route
  serves the same data for client-side refreshes

## Getting started

```bash
npm install
npm run dev      # dev server at http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

## How it works

1. `lib/news.ts` fetches each source, normalizes every item to a single `Story`
   shape, and merges them sorted by publish time.
2. The home page (`app/page.tsx`) renders the first batch server-side with ISR.
3. `components/Feed.tsx` owns tabs, sort, search, and the Refresh button, which
   re-fetches `/api/news` on the client.
4. Bookmarks live in `localStorage` via the `useBookmarks` hook — fully offline.

## Project structure

```
app/
  page.tsx            # Home feed (server component, ISR)
  layout.tsx          # Shell: header, footer, theme
  api/news/route.ts   # Aggregated news endpoint
components/
  Feed.tsx            # Tabs, search, sort, refresh
  StoryCard.tsx       # Story row with bookmark toggle
lib/
  news.ts             # Source fetchers + normalization
  types.ts            # Story model + source labels
  useBookmarks.ts     # localStorage bookmarks hook
  format.ts           # time-ago / hostname helpers
```

## Deploy

Any Node host works. [Vercel](https://vercel.com) is the zero-config path —
push the repo, import, done. No environment variables required.
