// CV and Books pages: same content, sources and review flags as rounds 1–2 (data in js/site-data.js).
import { esc, params } from "./data.js";
const S = window.SITE, CV = window.CV, BOOKS = window.BOOKS, SRC = window.SOURCES;
export const showNotes = params.has("notes");
const srcTag = keys => { keys = [].concat(keys || []); return showNotes ? `<span class="src">${keys.map(k => SRC[k] ? (SRC[k].href ? `<a href="${SRC[k].href}" target="_blank" rel="noopener">${SRC[k].label}</a>` : SRC[k].label) : k).join(" · ")}</span>` : ""; };
const flag = f => f ? (showNotes ? `<span class="flag-note">Confirm: ${esc(f)}</span>` : `<span class="flag" title="Needs confirmation: ${esc(f)}">◦</span>`) : "";
export function cvPage() {
  const toggle = showNotes ? location.pathname + location.hash : location.pathname + "?notes=1" + location.hash;
  return `<section class="page cv">
    <div class="page-head"><p class="kicker"><span>scene /</span> cv.json</p><h1>${esc(S.fullName)}</h1><p class="lede">${esc(S.title)}. Educator, creative technologist, animator and game developer.</p>
      <p class="cv-tools"><a href="${toggle}">${showNotes ? "Hide" : "Show"} sources &amp; review notes</a> · <a href="https://nyewarburton.com/cv-2/" target="_blank" rel="noopener">Full public CV ↗</a></p></div>
    <div class="highlights">${CV.highlights.map(h => `<div class="hl"><p class="hl-k">${esc(h.k)}</p><p class="hl-v">${esc(h.v)}${flag(h.flag)}</p><p class="hl-w">${esc(h.when)}</p>${srcTag(h.src)}</div>`).join("")}</div>
    ${CV.sections.map(s => `<div class="cv-sec"><h2>${esc(s.heading)}</h2><ul>${s.entries.map(e => `<li><span class="when">${esc(e.when)}</span><span class="what"><b>${esc(e.title)}</b>${showNotes ? "" : flag(e.flag)}${e.where ? `<span class="where">${esc(e.where)}</span>` : ""}${showNotes ? flag(e.flag) : ""}${srcTag(e.src)}</span></li>`).join("")}</ul></div>`).join("")}
  </section>`;
}
export function booksPage(sel) {
  const b = BOOKS.current;
  return `<section class="page books">
    <div class="page-head"><p class="kicker"><span>scene /</span> books/</p><h1>Books</h1></div>
    <div class="book ${sel === "current" ? "is-sel" : ""}" id="book-current">
      <img class="cover" src="${b.cover}" alt="Cover of ${esc(b.title)}: ${esc(b.subtitle)}">
      <div class="book-body"><p class="kicker">${esc(b.year)}</p><h2>${esc(b.title)}</h2><p class="book-sub">${esc(b.subtitle)}</p>
        <p>${esc(b.blurb)}</p>
        <ol class="threads">${b.threads.map(t => `<li><b>${esc(t.t)}</b><span>${esc(t.d)}</span></li>`).join("")}</ol>
        <p class="facts">${esc(b.facts)}</p>
        <div class="buy">${b.buy.map((l, i) => `<a class="btn ${i === 0 ? "primary" : ""}" href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}<small>${esc(l.note)}</small></a>`).join("")}
          ${b.missing.map(m => `<span class="btn placeholder" title="Placeholder — open question">${esc(m.label)}<small>${esc(m.note)}</small></span>`).join("")}</div>
      </div></div>
    <div class="projects"><p class="kicker">In the works · coming soon</p><h2>Next book</h2>
      <p class="projects-note">Coming soon.</p>
      <ul class="spines">${window.BOOK_PROJECTS.map((t, i) => `<li><a class="spine ${sel === String(i) ? "is-sel" : ""}" href="#/books/${i}" data-next="${i}"><span class="spine-n">0${i + 1}</span><b>${esc(t)}</b><small>Coming soon</small></a></li>`).join("")}</ul>
      <a class="btn" href="https://paragraph.com/@nyewarburton.eth/subscribe" target="_blank" rel="noopener">Subscribe on Paragraph<small>Hear first</small></a></div>
  </section>`;
}
