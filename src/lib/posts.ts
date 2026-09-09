import { readFileSync } from "node:fs";
import { join } from "node:path";
import writing from "../../content/writing.json";

export type Post = {
  title: string;
  date: string;
  url: string;
  description: string;
};

export type PostsFile = {
  fetchedAt?: string;
  source?: string;
  sources?: string[];
  posts?: Post[];
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CACHE = join(process.cwd(), "content/posts.json");

export function loadPosts(): Post[] {
  try {
    const file = JSON.parse(readFileSync(CACHE, "utf8")) as PostsFile;
    const posts = Array.isArray(file.posts) ? file.posts : [];
    return posts
      .filter((post) => post.title && post.url)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  } catch {
    return [];
  }
}

export function loadWriting() {
  return writing;
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map((part) => Number(part));
  if (!year || !month || !day) return iso;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}
