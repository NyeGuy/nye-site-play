import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ingestPosts } from "../../scripts/ingest-posts.mjs";

const CACHE = join(dirname(fileURLToPath(import.meta.url)), "../../content/posts.json");

export default function paragraphPosts() {
  return {
    name: "paragraph-posts",
    hooks: {
      "astro:config:setup": async ({ command, logger }) => {
        if (command !== "build") return;
        try {
          await ingestPosts(logger);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          try {
            const cached = JSON.parse(await readFile(CACHE, "utf8"));
            const count = Array.isArray(cached?.posts) ? cached.posts.length : 0;
            logger.warn(`Paragraph ingest failed (${message}); using cached ${count} posts.`);
          } catch {
            logger.warn(`Paragraph ingest failed (${message}); writing list will be empty.`);
          }
        }
      },
    },
  };
}
