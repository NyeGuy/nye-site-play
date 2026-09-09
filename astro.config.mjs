import { defineConfig } from "astro/config";
import paragraphPosts from "./src/integrations/paragraph-posts.mjs";

export default defineConfig({
  output: "static",
  integrations: [paragraphPosts()],
});
