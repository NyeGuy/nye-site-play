# Pipeline

Owner Anvil (Forge family) · Lead Forge · CoS Nyborg · Merge Nye only.

This repo is Nye Warburton’s personal homepage playground. Vercel hosts the static Astro build at the project root (`base /`). Do not nest STEC Satellite Lab site content here.

## Edit copy

Non-devs can change words in `content/` without touching layouts:

- `content/hero.json` — name, role, students line, lead
- `content/ethos.json` — ethos wording (preserve unless Nye changes it)
- `content/work.json` — home work links
- `content/background.md` — bio paragraphs
- `content/cv.json` — education and experience (public CV only; Dean STEC is current)
- `content/writing.json` — writing intro, search, and subscribe links
- `content/essays.json` — DRAFT provisional shortlist (~20). Set `draft: false` when Nye names the final set.
- `content/meta.json` — document title and description

## Writing

The published list is the curated set in `content/essays.json`, not a full RSS dump. Essays link out to Paragraph, Mirror, or the archive. `/writing` has a tiny client-side filter over titles and blurbs. The rest of the weekly archive stays on Paragraph.

## Ship

1. Edit on a branch.
2. `npm run build` must succeed.
3. Open a PR. Nye merges.
4. Vercel rebuilds `main` as a public static site.
