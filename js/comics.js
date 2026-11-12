// Comics track (concept): NyeToon chapters from github.com/NyeGuy/NyeToon, read as an image-first reader inside the Viewport app.
import { esc, fmtDate } from "./data.js";
const C = window.COMICS;
export const COMIC_COLOR = "#ff7eb6";
export const chapters = C.chapters;
export const bySlug = Object.fromEntries(chapters.map(c => [c.slug, c]));
export const seriesOf = id => C.series.find(s => s.id === id);
export const inSeries = id => chapters.filter(c => c.series === id);
const totalPages = chapters.reduce((a, c) => a + c.pages.length, 0);
const posted = c => fmtDate(new Date(c.posted + "T12:00:00"));
const drawn = c => c.drawn.length ? (c.drawn.length > 1 ? `${c.drawn[0]}–${c.drawn.at(-1)}` : c.drawn[0]) : null;
const partOf = c => { const s = inSeries(c.series); return c.series !== "nyetoon" && s.length > 1 ? `Part ${s.indexOf(c) + 1} of ${s.length}` : null; };
export const stats = { chapters: chapters.length, pages: totalPages };

export function tree(route) {
  const cur = route.name === "comic" ? route.arg : null;
  return `<li class="root"><a href="#/comics" class="${route.name === "comics" ? "on" : ""}">▾ <b>comics: nyetoon</b><em>${totalPages}</em></a></li>
    ${C.series.map(s => { const list = inSeries(s.id); return `<li class="grp-h"><span><i class="dot" style="background:${COMIC_COLOR}"></i>${esc(s.label)}</span><em>${list.length}</em></li>
      ${list.map(c => `<li class="leaf"><a href="#/comics/${c.slug}" data-comic="${c.slug}" class="${c.slug === cur ? "on" : ""}${c.pages.length ? "" : " nopages"}"><span class="cn">${c.n}</span><span class="ct">${esc(c.title)}</span><em>${c.pages.length || "–"}</em></a></li>`).join("")}`; }).join("")}`;
}

const cover = c => c.pages.length ? c.card : c.featured;
export function indexDoc() {
  return `<section class="page comics-index">
    <div class="page-head"><p class="kicker"><span>scene /</span> comics</p><h1>NyeToon</h1>
      <p class="lede">Nye’s web comic and other comic experiments: ${stats.chapters} chapters, ${stats.pages} pages, in three series. Drawn on paper, cleaned up and coloured in Photoshop, saved when nyetoon.com went down and reposted at nyetoon.net in 2018. “Nyetoon, and my other comic experiments, can be read in any order.”</p></div>
    <h2 class="grp">Series <span>${C.series.length}</span></h2>
    <div class="series-grid">${C.series.map(s => { const list = inSeries(s.id), first = list[0], art = (s.cover && chapters.find(c => c.n === s.cover)) || first, pages = list.reduce((a, c) => a + c.pages.length, 0), all = s.id === "nyetoon";
      const yrs = all ? [] : [...new Set(list.flatMap(c => c.drawn))].sort(); const span = yrs.length ? (yrs[0] === yrs.at(-1) ? yrs[0] : `${yrs[0]}–${yrs.at(-1)}`) : "";
      return `<a class="series-card" href="#/comics/${first.slug}" data-comic="${first.slug}"><img src="${cover(art)}" alt="" loading="lazy"><span class="sc-body"><b>${esc(s.label)}</b><small>${list.length > 1 ? `${list.length} ${all ? "chapters" : "parts"} · ` : ""}${pages} pages${span ? ` · ${span}` : ""}</small>${all ? `<small class="sc-inc">Incl. Recession Bear, TobyToon, intro</small>` : ""}</span></a>`; }).join("")}</div>
    <h2 class="grp">All chapters <span>${stats.chapters}</span></h2>
    <ol class="ch-grid">${chapters.map(c => `<li><a class="ch-card${c.pages.length ? "" : " nopages"}" href="#/comics/${c.slug}" data-comic="${c.slug}">
        <img src="${cover(c)}" alt="" loading="lazy"><span class="cc-body"><span class="cc-n">${c.n}</span><b>${esc(c.title)}</b>
        <small>${esc(seriesOf(c.series).label)} · ${c.pages.length ? `${c.pages.length} page${c.pages.length > 1 ? "s" : ""}` : "intro only"}${drawn(c) ? ` · ${drawn(c)}` : ""}</small></span></a></li>`).join("")}</ol>
    <p class="source">Artwork and words: Nye Warburton, from <a href="https://github.com/NyeGuy/NyeToon" target="_blank" rel="noopener">github.com/NyeGuy/NyeToon</a> (nyetoon.net).</p>
  </section>`;
}

export function readerDoc(slug) {
  const c = bySlug[slug]; if (!c) return `<section class="page"><p>Chapter not found. <a href="#/comics">All comics</a></p></section>`;
  const i = chapters.indexOf(c), prev = chapters[i - 1], next = chapters[i + 1], s = seriesOf(c.series);
  const meta = [`${c.pages.length} page${c.pages.length === 1 ? "" : "s"}`, drawn(c) && `drawn ${drawn(c)}`, `posted ${posted(c)}`].filter(Boolean).join(" · ");
  return `<article class="comic" data-slug="${c.slug}">
    <nav class="crumbs"><a href="#/comics">← NyeToon</a><span>Chapter ${c.n} of ${String(chapters.length - 1).padStart(2, "0")}</span></nav>
    <header class="comic-head"><p class="kicker"><a href="#/comics">Comics</a> · <span style="color:${COMIC_COLOR}">${esc(s.label)}</span>${partOf(c) ? ` · ${partOf(c)}` : ""}</p>
      <h1>${esc(c.title)}</h1>${c.dek ? `<p class="comic-dek">${esc(c.dek.split("\n")[0])}</p>` : ""}
      <p class="post-meta">${meta}</p></header>
    ${c.intro.length ? `<div class="comic-note"><p>${esc(c.intro[0])}</p>${c.intro.length > 1 ? `<details><summary>Read the rest of the note</summary>${c.intro.slice(1).map(p => `<p>${esc(p)}</p>`).join("")}</details>` : ""}</div>` : ""}
    ${c.pages.length ? `<ol class="pages">${c.pages.map((p, k) => `<li id="p${k + 1}" class="pg" data-p="${k + 1}"><img src="${p.src}" width="${p.w}" height="${p.h}" alt="${esc(c.title)}, page ${k + 1}" ${k > 1 ? 'loading="lazy"' : ""} style="--w:${p.w}px"><span class="pg-cap">${k + 1} / ${c.pages.length}${p.drawn ? ` · ${p.drawn}` : ""}</span></li>`).join("")}</ol>`
      : `<img class="comic-banner" src="${c.featured}" alt=""><p class="empty">This chapter has no pages in the NyeToon repo.</p>`}
    <nav class="ch-pager" aria-label="Chapter navigation">
      ${prev ? `<a class="prev" href="#/comics/${prev.slug}"><img src="${cover(prev)}" alt=""><small>← Previous chapter</small><b>${esc(prev.title)}</b></a>` : "<span></span>"}
      ${next ? `<a class="next" href="#/comics/${next.slug}"><img src="${cover(next)}" alt=""><small>Next chapter →</small><b>${esc(next.title)}</b></a>` : "<span></span>"}
    </nav>
    <div class="comic-bar" role="toolbar" aria-label="Page controls">
      <button data-cpage="-1" aria-label="Previous page">‹ <span>Prev</span></button>
      <span class="cb-mid"><b id="cb-pos">1 / ${c.pages.length || 1}</b><small>${esc(s.label)}${partOf(c) ? ` · ${partOf(c).replace(" of ", "/")}` : ""}</small></span>
      <button data-cpage="1" aria-label="Next page"><span>Next</span> ›</button>
    </div>
  </article>`;
}

export function inspector(kind, slug) {
  const dl = rows => `<dl>${rows.filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
  if (kind === "comic") {
    const c = bySlug[slug]; if (!c) return "";
    const sib = inSeries(c.series);
    return `<p class="obj"><i class="dot" style="background:${COMIC_COLOR}"></i>comic_${c.n}</p><h3>${esc(c.title)}</h3><p class="isub">${esc(seriesOf(c.series).label)}${partOf(c) ? ` · ${partOf(c)}` : ""}</p>
      ${dl([["pages", c.pages.length || "none in repo"], drawn(c) && ["drawn", drawn(c)], ["posted", posted(c)], ["source", `<a href="https://github.com/NyeGuy/NyeToon/tree/master/src/pages/${c.slug}" target="_blank" rel="noopener">NyeToon repo ↗</a>`]])}
      ${c.pages.length ? `<p class="ph2">Pages</p><div class="strip">${c.pages.map((p, k) => `<a href="#p${k + 1}" data-goto-page="${k + 1}"><img src="${p.thumb}" alt="Page ${k + 1}" loading="lazy"><span>${k + 1}</span></a>`).join("")}</div>` : ""}
      ${sib.length > 1 && c.series !== "nyetoon" ? `<p class="ph2">In ${esc(seriesOf(c.series).label)}</p><ul class="ilist">${sib.map(x => `<li><a href="#/comics/${x.slug}" ${x === c ? 'class="on"' : ""}>${esc(x.title)}</a></li>`).join("")}</ul>` : ""}
      <p class="ph2">Keys</p><p class="keys"><kbd>J</kbd>/<kbd>K</kbd> page <kbd>←</kbd>/<kbd>→</kbd> chapter <kbd>Esc</kbd> index</p>`;
  }
  return `<p class="obj"><i class="dot" style="background:${COMIC_COLOR}"></i>collection</p><h3>NyeToon</h3>
    ${dl([["chapters", stats.chapters], ["pages", stats.pages], ["series", C.series.map(s => esc(s.label)).join(", ")], ["posted", "nyetoon.net, 2018"]])}
    <p class="hint">Click a page in the Comics arm of the scene, a card, or a chapter in the outliner to open the reader.</p>`;
}
