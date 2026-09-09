# nye-site-play

Personal homepage (v2) for Nye Warburton. Fast Astro static site. Vercel playground — root hosting, base `/`.

Routes: `/` · `/writing` · `/cv`. Essays stay on [Paragraph](https://paragraph.com/@nyewarburton.eth).

## Ownership

| Role | Who |
| --- | --- |
| Owner | Anvil (Forge family) |
| Lead | Forge |
| CoS | Nyborg |
| Merge | Nye only |

This is personal brand. Do not nest STEC Satellite Lab site content here.

## Local

Requires Node >= 22.

```bash
npm install
npm run ingest
npm run dev
npm run build
npm run preview
```

Edit copy in `content/`. Hero, ethos, work links, CV, writing intro, and meta live in JSON. Background bio is `content/background.md`. `content/posts.json` is generated from Paragraph at ingest/build time.
