import backgroundMd from "../../content/background.md?raw";
import ethos from "../../content/ethos.json";
import hero from "../../content/hero.json";
import meta from "../../content/meta.json";
import work from "../../content/work.json";

export type WorkLink = {
  label: string;
  href: string;
  quiet?: boolean;
};

export type Site = {
  meta: typeof meta;
  hero: typeof hero;
  ethos: typeof ethos;
  work: {
    heading: string;
    links: WorkLink[];
  };
  background: {
    heading: string;
    paragraphs: string[];
  };
};

export function loadSite(): Site {
  const paragraphs = backgroundMd
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  return {
    meta,
    hero,
    ethos,
    work,
    background: {
      heading: "Background",
      paragraphs,
    },
  };
}
