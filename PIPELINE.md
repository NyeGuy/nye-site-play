# Pipeline

Owner Anvil (Forge family) · Lead Forge · CoS Nyborg · Merge Nye only.

This repo is Nye Warburton’s personal homepage playground. Vercel hosts the static Astro build at the project root (`base /`). Do not nest STEC Satellite Lab site content here.

## Edit copy

Non-devs can change words in `content/` without touching layouts:

- `content/hero.json` — name, role, students line, lead
- `content/ethos.json` — ethos wording (preserve unless Nye changes it)
- `content/work.json` — outbound writing links
- `content/background.md` — short bio paragraphs
- `content/meta.json` — document title and description

## Ship

1. Edit on a branch.
2. `npm run build` must succeed.
3. Open a PR. Nye merges.
4. Vercel rebuilds `main` as a public static site. No CMS, no extra routes in v1.
