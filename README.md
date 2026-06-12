# TechNews

Developer news in one fast feed. Aggregates top stories from the public
[Hacker News (Algolia)](https://hn.algolia.com/api) and [DEV](https://developers.forem.com/api)
APIs — no API keys required.

## Features

- Unified feed from Hacker News and DEV, cached server-side and refreshed every 5 minutes
- Filter by source, sort by **Latest** or **Top**, full-text search across titles and tags
- Save stories for later (stored in localStorage — no account needed)
- Dark theme, responsive layout

## Tech stack

- [Next.js](https://nextjs.org) (App Router) with TypeScript
- Tailwind CSS v4
- Server route at `/api/news` for client refreshes; the home page is statically
  rendered with incremental revalidation

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
  types.ts            # Story model
  useBookmarks.ts     # localStorage bookmarks hook
  format.ts           # time-ago / hostname helpers
```
