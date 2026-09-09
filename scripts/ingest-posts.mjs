/**
 * Build-time Paragraph ingest.
 * RSS is the canonical field source (title, date, url, short description).
 * The public posts API paginates past the RSS 20-item cap (~96 posts).
 * Never stores essay HTML.
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HANDLE = "nyewarburton.eth";
const RSS_URL = `https://paragraph.com/@${HANDLE}/rss`;
const BLOG_URL = `https://api.paragraph.com/blogs/@${HANDLE}`;
const POSTS_API = "https://public.api.paragraph.com/api/v1/publications";
const PUBLIC_BASE = `https://paragraph.com/@${HANDLE}`;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "content", "posts.json");

const HEADERS = {
  Accept: "application/rss+xml, application/json, */*",
  "User-Agent": "nye-site-play/2 (personal homepage ingest)",
};

/** @typedef {{ title: string, date: string, url: string, description: string }} Post */

export async function ingestPosts(log = console) {
  /** @type {Map<string, Post>} */
  const byUrl = new Map();
  const sources = [];

  try {
    const apiPosts = await fetchAllFromApi();
    for (const post of apiPosts) byUrl.set(post.url, post);
    sources.push(`api:${apiPosts.length}`);
    say(log, "info", `Paragraph API: ${apiPosts.length} posts`);
  } catch (error) {
    say(log, "warn", `Paragraph API ingest failed: ${errorMessage(error)}`);
  }

  try {
    const rssPosts = await fetchFromRss();
    for (const post of rssPosts) {
      const existing = byUrl.get(post.url);
      byUrl.set(post.url, existing ? { ...existing, ...post } : post);
    }
    sources.push(`rss:${rssPosts.length}`);
    say(log, "info", `Paragraph RSS: ${rssPosts.length} posts`);
  } catch (error) {
    say(log, "warn", `Paragraph RSS ingest failed: ${errorMessage(error)}`);
  }

  const posts = [...byUrl.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  if (!posts.length) {
    throw new Error("No posts from RSS or API");
  }

  const payload = {
    fetchedAt: new Date().toISOString(),
    source: RSS_URL,
    sources,
    posts,
  };

  await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  say(log, "info", `Wrote ${posts.length} posts to content/posts.json`);
  return payload;
}

async function fetchFromRss() {
  const xml = await readText(RSS_URL);
  const items = xml.split(/<item[\s>]/i).slice(1);
  /** @type {Post[]} */
  const posts = [];

  for (const chunk of items) {
    const item = chunk.split(/<\/item>/i)[0] ?? "";
    const title = decode(stripCdata(inner(item, "title")));
    const link = stripCdata(inner(item, "link"));
    const pubDate = stripCdata(inner(item, "pubDate"));
    const description = decode(stripHtml(stripCdata(inner(item, "description"))));
    if (!title || !link) continue;
    posts.push({
      title,
      date: toIsoDate(pubDate),
      url: canonicalizeUrl(link),
      description,
    });
  }

  return posts;
}

async function fetchAllFromApi() {
  const blog = await readJson(BLOG_URL);
  const publicationId = typeof blog?.id === "string" ? blog.id : "";
  if (!publicationId) throw new Error("Missing publication id");

  /** @type {Post[]} */
  const posts = [];
  let cursor = "";

  for (let page = 0; page < 12; page += 1) {
    const url = new URL(`${POSTS_API}/${publicationId}/posts`);
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("cursor", cursor);
    const data = await readJson(url);
    const items = Array.isArray(data?.items) ? data.items : [];

    for (const item of items) {
      const slug = typeof item?.slug === "string" ? item.slug : "";
      const title = typeof item?.title === "string" ? item.title.trim() : "";
      if (!slug || !title) continue;
      posts.push({
        title,
        date: toIsoDate(item?.publishedAt),
        url: canonicalizeUrl(`${PUBLIC_BASE}/${slug}`),
        description: decode(stripHtml(String(item?.subtitle ?? ""))),
      });
    }

    const next = data?.pagination?.cursor;
    if (!data?.pagination?.hasMore || !next || next === cursor) break;
    cursor = next;
  }

  return posts;
}

async function readText(url) {
  const response = await fetch(String(url), { headers: HEADERS });
  if (!response.ok) throw new Error(`${url} → ${response.status}`);
  return response.text();
}

async function readJson(url) {
  const response = await fetch(String(url), {
    headers: { ...HEADERS, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${url} → ${response.status}`);
  return response.json();
}

function inner(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function stripCdata(value) {
  return value.replace(/^<!\[CDATA\[/i, "").replace(/\]\]>$/i, "").trim();
}

function stripHtml(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)));
}

function toIsoDate(value) {
  if (value == null || value === "") return "";
  const numeric = typeof value === "number" ? value : Number(String(value).trim());
  const date =
    Number.isFinite(numeric) && numeric > 10_000
      ? new Date(numeric < 1e12 ? numeric * 1000 : numeric)
      : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function canonicalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function say(log, level, message) {
  if (typeof log?.[level] === "function") {
    log[level](message);
    return;
  }
  if (level === "warn") console.warn(message);
  else console.log(message);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestPosts().catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}
