# GitCMS Site

A site scaffolded by [GitCMS](https://github.com). Content lives in `content/` as JSON, committed by the GitCMS editor. This app reads those files at request time and renders them.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy

One-click deploy on Vercel — the `content/` directory ships with the build, so every push updates the live site.

## Structure

- `content/posts/*.json` — blog posts
- `content/pages/*.json` — standalone pages
- `app/posts/[slug]/page.tsx` — post template
- `app/pages/[slug]/page.tsx` — page template
- `lib/content.ts` — JSON loader

Edit content through the GitCMS dashboard; code changes go through git as normal.
