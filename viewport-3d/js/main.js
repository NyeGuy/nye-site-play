// App shell: router, outliner, inspector, reader, console, keyboard — all driven by one route + filter state.
import { Posts, state, filtered, esc, fmtDate, THEMES, themeById, themeLabel, ensureContent, cleanHtml, readMins, titleHit, mark, years, countTheme, params } from "./data.js";
import { cvPage, booksPage } from "./pages.js";
import { createViewport } from "./scene.js";

const S = window.SITE, BOOKS = window.BOOKS, PAR = S.paragraph;
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $("#app");
const route = { name: "home", arg: null };
let cursor = -1;                       // keyboard cursor in the Writing index
let vp = null;

/* ---------------- Viewport ---------------- */
try {
  vp = createViewport({ themes: THEMES, avatarUrl: S.avatar, bookCoverUrl: BOOKS.current.cover, bookProjects: window.BOOK_PROJECTS });
  const scan = params.get("scan") || (window.NYE_SCAN && window.NYE_SCAN.url);
  if (scan) vp.loadScan(scan, window.NYE_SCAN || {}).then(() => log(`scan loaded: ${scan}`)).catch(e => log(`scan failed (${e.message}); keeping cartoon`, "warn"));
} catch (e) {
  console.error(e); document.body.classList.add("no-webgl");
}
window.VP = vp;

/* ---------------- Routing ---------------- */
// #/  #/blog?q=&theme=&year=&sort=  #/theme/:id  #/search/:q  #/year/:y  #/post/:slug  #/cv  #/books  #/books/:n
function parse() {
  const [h, qs] = location.hash.replace(/^#\/?/, "").split("?");
  const [name, ...rest] = h.split("/"); const arg = rest.length ? decodeURIComponent(rest.join("/")) : null;
  const u = new URLSearchParams(qs || "");
  if (name === "blog") { state.q = u.get("q") || ""; state.theme = u.get("theme") || "all"; state.year = u.get("year") || "all"; state.sort = u.get("sort") || "new"; }
  if (name === "theme") { state.theme = arg || "all"; state.q = ""; }
  if (name === "search") { state.q = arg || ""; }
  if (name === "year") { state.year = arg || "all"; }
  const n = { "": "home", home: "home", blog: "blog", theme: "blog", search: "blog", year: "blog", post: "post", cv: "cv", books: "books" }[name] || "home";
  return { name: n, arg };
}
export function blogHash(st = state) {
  const u = new URLSearchParams();
  if (st.q) u.set("q", st.q); if (st.theme !== "all") u.set("theme", st.theme); if (st.year !== "all") u.set("year", st.year); if (st.sort !== "new") u.set("sort", st.sort);
  const s = u.toString(); return `#/blog${s ? "?" + s : ""}`;
}
function setFilter(patch, { push = false } = {}) {     // change filters without a full re-render (keeps focus in search)
  Object.assign(state, patch); cursor = -1;
  const h = blogHash();
  if (route.name !== "blog") { location.hash = h; return; }
  push ? history.pushState(null, "", h) : history.replaceState(null, "", h);
  refreshLists(); renderInspector(); syncScene({ focus: !!patch.theme });
}

/* ---------------- Shell ---------------- */
function shell() {
  app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#/"><img src="${S.avatar}" alt=""><span>${esc(S.name)}</span></a>
    <nav class="tabs" aria-label="Primary">${[["home", "#/", "Scene"], ["blog", "#/blog", "Writing"], ["cv", "#/cv", "CV"], ["books", "#/books", "Books"]].map(([k, h, l]) => `<a href="${h}" data-tab="${k}">${l}</a>`).join("")}</nav>
    <label class="gsearch"><span class="sr">Search essays</span><input id="q" type="search" placeholder="Search essays…  /" autocomplete="off" spellcheck="false"></label>
    <span id="status" class="status"></span>
    <button class="ol-toggle" id="ol-toggle" aria-controls="outliner" aria-expanded="false">Outliner</button>
  </header>
  <aside class="outliner" id="outliner" aria-label="Outliner">
    <div class="pane-h">Outliner</div>
    <ul class="tree" id="tree"></ul>
    <div class="pane-h sub">Year</div><div class="years" id="years"></div>
    <div class="pane-h sub"><span id="list-h">Essays</span><button class="link" id="sort"></button></div>
    <ol class="elist" id="elist"></ol>
  </aside>
  <main class="stage" id="stage">
    <div class="viewport" id="vp-main" aria-label="3D viewport">
      <div class="hud tl">Perspective · Lit <span class="dim">· drag orbit · right-drag pan · scroll zoom</span></div>
      <div class="hud tr" id="hud-stats"></div>
      <div class="hud bl"><kbd>F</kbd> frame <kbd>H</kbd> home view <kbd>/</kbd> search <kbd>[</kbd><kbd>]</kbd> theme <kbd>J</kbd><kbd>K</kbd> essays</div>
      <div class="vp-tools"><button data-vp="frame" title="Frame selection (F)">Frame</button><button data-vp="home" title="Home view (H)">Home view</button></div>
      <div class="tip" id="tip" hidden></div><div class="sel-label" id="sel-label" hidden></div>
      <div class="vp-title" id="vp-title"><h1>${esc(S.name)}</h1><p>${S.roles.map(esc).join(" · ")}</p></div>
      <noscript>JavaScript and WebGL are needed for the viewport.</noscript>
    </div>
    <section class="console" id="console" aria-label="Console"><div class="pane-h">Console <a href="#/blog">open writing →</a></div><ul id="con"></ul></section>
    <div class="doc" id="doc" tabindex="-1"></div>
  </main>
  <aside class="inspector" aria-label="Inspector">
    <div class="mini" id="vp-mini"><button class="mini-x" data-vp="expand" title="Back to the scene">⤢ Scene</button></div>
    <div class="pane-h">Inspector</div>
    <div id="insp"></div>
  </aside>`;
  if (vp) vp.mount($("#vp-main"));
  bindShell();
}

function bindShell() {
  const q = $("#q"); let t;
  q.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => setFilter({ q: q.value }), 110); });
  q.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); const first = filtered()[0]; if (route.name !== "blog") setFilter({ q: q.value }); else if (first) { cursor = 0; moveCursor(0); } }
    if (e.key === "Escape") { q.value = ""; setFilter({ q: "" }); q.blur(); }
    if (e.key === "ArrowDown") { e.preventDefault(); q.blur(); moveCursor(1); }
  });
  $("#ol-toggle").onclick = () => { const o = document.body.classList.toggle("ol-open"); $("#ol-toggle").setAttribute("aria-expanded", o); };
  $("#sort").onclick = () => setFilter({ sort: state.sort === "new" ? "old" : "new" });
  app.addEventListener("click", e => {
    const b = e.target.closest("[data-vp]"); if (b && vp) {
      if (b.dataset.vp === "frame") vp.frameSelected();
      if (b.dataset.vp === "home") vp.resetView();
      if (b.dataset.vp === "expand") location.hash = "#/";
    }
    const th = e.target.closest("[data-set-theme]"); if (th) { e.preventDefault(); setFilter({ theme: th.dataset.setTheme, q: route.name === "blog" ? state.q : "" }, { push: true }); }
    const yr = e.target.closest("[data-set-year]"); if (yr) { e.preventDefault(); setFilter({ year: yr.dataset.setYear }, { push: true }); }
    if (e.target.closest(".outliner a")) document.body.classList.remove("ol-open");
  });
  // Hovering a list row lights up its block in the scene
  app.addEventListener("pointerover", e => {
    if (!vp) return; const a = e.target.closest("[data-slug],[data-theme-id]");
    if (a) a.dataset.slug ? vp.highlight("essay", a.dataset.slug) : vp.highlight("theme", a.dataset.themeId); else vp.highlight(null);
  });
  if (vp) {
    vp.onPick(d => {
      if (!d) return;
      const go = { essay: `#/post/${encodeURIComponent(d.id)}`, theme: `#/theme/${d.id}`, book: "#/books", next: `#/books/${d.id}`, cv: "#/cv", avatar: "#/" }[d.kind];
      if (d.kind === "avatar" && route.name === "home") { vp.select("avatar", "nye"); renderInspector("avatar"); return; }
      log(`select ${d.kind}:${d.id}`);
      if (go) location.hash = go;
    });
    vp.onHover((d, e) => {
      const tip = $("#tip"); if (!tip) return;
      if (!d || !e) { tip.hidden = true; return; }
      const host = tip.parentElement.getBoundingClientRect();
      const p = d.kind === "essay" ? Posts.bySlug[d.id] : null;
      tip.innerHTML = p ? `<b>${esc(p.title)}</b><span>${fmtDate(p.publishedAt)} · ${esc(themeLabel(p.themes[0]))}</span>` : `<b>${esc(d.label)}</b><span>${{ theme: "Theme · click to filter", book: "Book · click to open", next: "Coming soon", cv: "CV · click to open", avatar: "Nye" }[d.kind] || ""}</span>`;
      tip.style.left = Math.min(e.clientX - host.left + 14, host.width - 260) + "px"; tip.style.top = (e.clientY - host.top + 14) + "px"; tip.hidden = false;
    });
    vp.onFps(fps => { const s = $("#hud-stats"); if (s) s.textContent = `${Posts.list.length} essays · ${THEMES.length} themes · ${fps} fps`; });
  }
}

/* ---------------- Outliner ---------------- */
function refreshLists() {
  const tree = $("#tree");
  tree.innerHTML = `<li class="root"><a href="#/" data-kind="avatar" class="${route.name === "home" ? "on" : ""}">▾ <b>scene: nye_warburton</b></a></li>
    <li><a href="${blogHash({ ...state, theme: "all" })}" data-set-theme="all" class="${state.theme === "all" ? "on" : ""}"><i class="dot all"></i>All themes<em>${Posts.list.length}</em></a></li>
    ${THEMES.map(t => `<li><a href="#/theme/${t.id}" data-set-theme="${t.id}" data-theme-id="${t.id}" class="${state.theme === t.id ? "on" : ""}"><i class="dot" style="background:${t.color}"></i>${esc(t.label)}<em>${countTheme(t.id)}</em></a></li>`).join("")}
    <li class="sep"></li>
    <li><a href="#/cv" class="${route.name === "cv" ? "on" : ""}"><i class="sq"></i>cv.json</a></li>
    <li><a href="#/books" class="${route.name === "books" ? "on" : ""}"><i class="sq bk"></i>books/ <em>1 + 1</em></a></li>`;
  $("#years").innerHTML = [["all", "All"], ...years().map(y => [String(y), y])].map(([v, l]) => `<button data-set-year="${v}" aria-pressed="${state.year == v}">${l}</button>`).join("");
  const arr = filtered();
  const desc = [state.theme !== "all" && themeLabel(state.theme), state.year !== "all" && state.year, state.q && `“${state.q}”`].filter(Boolean).join(" · ");
  $("#list-h").textContent = `Essays · ${arr.length}${desc ? " · " + desc : ""}`;
  $("#sort").textContent = state.sort === "new" ? "newest ↓" : "oldest ↑";
  const cur = route.name === "post" ? route.arg : null;
  $("#elist").innerHTML = arr.map(p => `<li><a href="#/post/${encodeURIComponent(p.slug)}" data-slug="${esc(p.slug)}" class="${p.slug === cur ? "on" : ""}" style="--tc:${themeById(p.themes[0]).color}"><i></i><span>${mark(p.title, state.q)}</span><time>${fmtDate(p.publishedAt, { month: "short", year: "2-digit" })}</time></a></li>`).join("") || `<li class="empty">No essays match.</li>`;
  const on = $("#elist a.on"); if (on) on.scrollIntoView({ block: "nearest" });
  $("#q").value !== state.q && document.activeElement !== $("#q") && ($("#q").value = state.q);
  $$(".tabs a").forEach(a => a.toggleAttribute("aria-current", a.dataset.tab === (route.name === "post" ? "blog" : route.name)));
  if (route.name === "blog") renderResults();
}

/* ---------------- Status + console ---------------- */
function status() {
  const el = $("#status"); if (!el) return;
  if (Posts.mode === "live") el.innerHTML = `<span class="badge live" title="Fetched in your browser from ${PAR.api}">● Live · Paragraph API · ${Posts.list.length}${Posts.contentReady ? " · full text" : " · loading text…"}</span>`;
  else if (Posts.mode === "snapshot") el.innerHTML = `<span class="badge snap" title="${esc(Posts.detail)}">◌ Snapshot ${esc((Posts.fetchedAt || "").slice(0, 10))} · ${esc(Posts.detail)}</span>`;
  else el.innerHTML = `<span class="badge">Loading…</span>`;
}
const logLines = [];
function log(msg, lvl = "info") { logLines.unshift({ t: new Date(), msg, lvl }); logLines.length = Math.min(logLines.length, 4); renderConsole(); }
function renderConsole() {
  const el = $("#con"); if (!el) return;
  el.innerHTML = logLines.map(l => `<li class="log ${l.lvl}"><time>${l.t.toLocaleTimeString("en-US", { hour12: false })}</time><span class="lvl">${l.lvl.toUpperCase()}</span><span>${esc(l.msg)}</span></li>`).join("")
    + Posts.list.slice(0, 8).map(p => { const t = themeById(p.themes[0]); return `<li><a href="#/post/${encodeURIComponent(p.slug)}" data-slug="${esc(p.slug)}"><time>${fmtDate(p.publishedAt, { year: "numeric", month: "2-digit", day: "2-digit" })}</time><span class="lvl" style="color:${t.color}">${t.short}</span><b>${esc(p.title)}</b><span class="sub">${esc(p.subtitle)}</span></a></li>`; }).join("");
}

/* ---------------- Writing index (reader) ---------------- */
function blogDoc() {
  return `<section class="page blog">
    <div class="page-head"><p class="kicker"><span>scene /</span> writing</p><h1>Writing</h1>
      <p class="lede">Nye’s Digital Lab: a weekly scribble on creativity in an age of rapid change. Search, filter by theme or year, then read with ← → or J / K.</p></div>
    <div class="chips" role="group" aria-label="Theme"><button data-set-theme="all" aria-pressed="${state.theme === "all"}">All</button>${THEMES.map(t => `<button data-set-theme="${t.id}" aria-pressed="${state.theme === t.id}" style="--tc:${t.color}"><i></i>${esc(t.label)} <em>${countTheme(t.id)}</em></button>`).join("")}</div>
    <div id="results" class="results"></div></section>`;
}
function renderResults() {
  const el = $("#results"); if (!el) return;
  $$(".blog .chips button").forEach(b => b.setAttribute("aria-pressed", b.dataset.setTheme === state.theme));
  const arr = filtered(), q = state.q.trim();
  const row = (p, i) => `<li><a href="#/post/${encodeURIComponent(p.slug)}" data-slug="${esc(p.slug)}" data-i="${i}" style="--tc:${themeById(p.themes[0]).color}"><time>${fmtDate(p.publishedAt, { month: "short", day: "numeric", year: "numeric" })}</time><span class="rt">${mark(p.title, q)}</span><span class="rs">${mark(p.subtitle, q)}</span><span class="rth">${p.themes.map(themeLabel).join(" · ")}${readMins(p) ? ` · ${readMins(p)} min` : ""}</span></a></li>`;
  if (!arr.length) { el.innerHTML = `<p class="empty">No essays match${q ? ` “${esc(q)}”` : ""}. <button class="link" data-set-theme="all">Clear theme</button></p>`; return; }
  let i = 0;
  if (q) {
    const strong = arr.filter(p => titleHit(p, q)), weak = arr.filter(p => !strong.includes(p));
    el.innerHTML = `<p class="count">${arr.length} essays · ${strong.length} with “${esc(q)}” in the title or tags · ${weak.length} mention it in the text${Posts.contentReady ? "" : " (full text still loading)"}</p>`
      + (strong.length ? `<h2 class="grp">In titles &amp; tags</h2><ul class="rows">${strong.map(p => row(p, i++)).join("")}</ul>` : "")
      + (weak.length ? `<h2 class="grp">Mentioned in the text</h2><ul class="rows">${weak.map(p => row(p, i++)).join("")}</ul>` : "");
  } else {
    const groups = []; let key = null;
    arr.forEach(p => { const k = fmtDate(p.publishedAt, { month: "long", year: "numeric" }); if (k !== key) { groups.push({ k, items: [] }); key = k; } groups.at(-1).items.push(p); });
    el.innerHTML = `<p class="count">${arr.length} essays</p>` + groups.map(g => `<h2 class="grp">${g.k}</h2><ul class="rows">${g.items.map(p => row(p, i++)).join("")}</ul>`).join("");
  }
  if (cursor >= 0) moveCursor(0);
}
function orderedResults() { return $$("#results a[data-slug]"); }
function moveCursor(d) {
  if (route.name !== "blog") return;
  const rows = orderedResults(); if (!rows.length) return;
  cursor = Math.max(0, Math.min(rows.length - 1, (cursor < 0 ? -1 : cursor) + d));
  rows.forEach((r, k) => r.classList.toggle("cur", k === cursor));
  const r = rows[cursor]; r.scrollIntoView({ block: "nearest" }); r.focus({ preventScroll: true });
  if (vp) vp.select("essay", r.dataset.slug, { focus: true });
  renderInspector("essay", r.dataset.slug);
}

/* ---------------- Essay page ---------------- */
function neighbours(p) {
  const active = !!(state.q || state.theme !== "all" || state.year !== "all");
  let ctx = active ? filtered() : Posts.list; if (!ctx.includes(p)) ctx = Posts.list;   // move within the current filter when the essay is in it
  const byDate = [...ctx].sort((a, b) => b.publishedAt - a.publishedAt), i = byDate.indexOf(p);
  return { newer: byDate[i - 1], older: byDate[i + 1], pos: i + 1, total: byDate.length, inFilter: active && ctx !== Posts.list };
}
async function postDoc(slug) {
  const p = Posts.bySlug[slug];
  if (!p) return `<section class="page"><p>Essay not found. <a href="#/blog">Back to writing</a></p></section>`;
  const html = cleanHtml(await ensureContent(p));
  const nb = neighbours(p);
  const ctxLabel = nb.inFilter ? [state.theme !== "all" && themeLabel(state.theme), state.year !== "all" && state.year, state.q && `“${state.q}”`].filter(Boolean).join(" · ") : "All essays";
  return `<article class="post">
    <nav class="crumbs"><a href="${blogHash()}">← ${esc(ctxLabel)}</a><span>${nb.pos} of ${nb.total} · newest first</span></nav>
    <header class="post-head"><p class="kicker">Essay ${p.n} of ${Posts.list.length} · ${p.themes.map(t => `<a href="#/theme/${t}" style="color:${themeById(t).color}">${esc(themeLabel(t))}</a>`).join(" · ")}</p>
      <h1>${esc(p.title)}</h1>${p.subtitle ? `<p class="post-sub">${esc(p.subtitle)}</p>` : ""}
      <p class="post-meta"><time>${fmtDate(p.publishedAt, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</time>${readMins(p) ? ` · ${readMins(p)} min read` : ""} · <a href="${PAR.postUrl(p.slug)}" target="_blank" rel="noopener">Read on Paragraph ↗</a></p></header>
    ${p.imageUrl ? `<img class="post-cover" src="${p.imageUrl}" alt="">` : ""}
    <div class="prose">${html}</div>
    ${p.categories.length ? `<p class="tags">${p.categories.map(t => `<a href="#/search/${encodeURIComponent(t)}">#${esc(t)}</a>`).join(" ")}</p>` : ""}
    <nav class="pager" aria-label="Essay navigation">
      ${nb.older ? `<a class="prev" href="#/post/${encodeURIComponent(nb.older.slug)}"><small>← Older</small><b>${esc(nb.older.title)}</b></a>` : "<span></span>"}
      ${nb.newer ? `<a class="next" href="#/post/${encodeURIComponent(nb.newer.slug)}"><small>Newer →</small><b>${esc(nb.newer.title)}</b></a>` : "<span></span>"}
    </nav></article>`;
}

/* ---------------- Inspector ---------------- */
function renderInspector(kind, id) {
  const el = $("#insp"); if (!el) return;
  if (!kind) {
    if (route.name === "post") { kind = "essay"; id = route.arg; }
    else if (route.name === "books") { kind = route.arg != null ? "next" : "book"; id = route.arg; }
    else if (route.name === "cv") kind = "cv";
    else if (route.name === "blog" && state.theme !== "all") { kind = "theme"; id = state.theme; }
    else if (route.name === "blog") kind = "filter";
    else kind = "avatar";
  }
  const dl = rows => `<dl>${rows.filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
  if (kind === "essay") {
    const p = Posts.bySlug[id]; if (!p) { el.innerHTML = ""; return; }
    const nb = neighbours(p);
    el.innerHTML = `<p class="obj">essay_${String(p.n).padStart(3, "0")}</p><h3>${esc(p.title)}</h3>${p.subtitle ? `<p class="isub">${esc(p.subtitle)}</p>` : ""}
      ${p.imageUrl ? `<img class="ithumb" src="${p.imageUrl}" alt="">` : ""}
      ${dl([["date", fmtDate(p.publishedAt)], ["themes", p.themes.map(t => `<a href="#/theme/${t}" style="color:${themeById(t).color}">${esc(themeLabel(t))}</a>`).join(", ")], readMins(p) && ["length", `${readMins(p)} min`], ["in view", `${nb.pos} of ${nb.total}`], p.categories.length && ["tags", p.categories.slice(0, 6).map(esc).join(", ")]])}
      <div class="ibtns">${route.name !== "post" || route.arg !== id ? `<a class="btn primary" href="#/post/${encodeURIComponent(p.slug)}">Open essay ↵</a>` : ""}<a class="btn" href="${PAR.postUrl(p.slug)}" target="_blank" rel="noopener">Paragraph ↗</a></div>
      ${route.name === "post" ? `<p class="ph2">Keys</p><p class="keys"><kbd>←</kbd> older <kbd>→</kbd> newer <kbd>Esc</kbd> back to list</p>` : ""}`;
  } else if (kind === "theme") {
    const t = themeById(id), list = Posts.list.filter(p => p.themes.includes(id));
    const ys = list.map(p => p.year);
    el.innerHTML = `<p class="obj"><i class="dot" style="background:${t.color}"></i>collection</p><h3>${esc(t.label)}</h3>
      ${dl([["essays", list.length], ["span", ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}` : "—"], ["latest", list[0] ? fmtDate(list[0].publishedAt) : "—"]])}
      <p class="ph2">Latest in ${esc(t.label)}</p><ul class="ilist">${list.slice(0, 6).map(p => `<li><a href="#/post/${encodeURIComponent(p.slug)}" data-slug="${esc(p.slug)}">${esc(p.title)}</a></li>`).join("")}</ul>`;
  } else if (kind === "book") {
    const b = BOOKS.current;
    el.innerHTML = `<p class="obj">book</p><h3>${esc(b.title)}</h3><p class="isub">${esc(b.subtitle)}</p><img class="ithumb cover" src="${b.cover}" alt="">
      ${dl([["year", esc(b.year)], ["essays", "28, in three threads"]])}<div class="ibtns">${b.buy.slice(0, 2).map((l, i) => `<a class="btn ${i ? "" : "primary"}" href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div>`;
  } else if (kind === "next") {
    const t = window.BOOK_PROJECTS[+id];
    el.innerHTML = `<p class="obj">book · placeholder</p><h3>${esc(t)}</h3><p class="isub">Coming soon.</p>
      <div class="ibtns"><a class="btn" href="https://paragraph.com/@nyewarburton.eth/subscribe" target="_blank" rel="noopener">Subscribe to hear first</a></div>`;
  } else if (kind === "cv") {
    el.innerHTML = `<p class="obj">cv.json</p><h3>${esc(S.fullName)}</h3>${dl(window.CV.highlights.map(h => [esc(h.k.toLowerCase()), esc(h.v)]))}<p class="hint">Add <code>?notes=1</code> to see sources and confirm flags.</p>`;
  } else if (kind === "filter") {
    el.innerHTML = `<p class="obj">view</p><h3>All writing</h3>${dl([["essays", Posts.list.length], ["themes", THEMES.length], ["years", years().join(", ")], ["source", Posts.mode === "live" ? "Paragraph API (live)" : "Snapshot"]])}
      <p class="hint">Pick a theme in the outliner, the chips or the scene. Arrow down from search, or <kbd>J</kbd>/<kbd>K</kbd>, to move through results; <kbd>Enter</kbd> opens.</p>`;
  } else {
    el.innerHTML = `<p class="obj">avatar · cartoon stand-in</p><h3>${esc(S.name)}</h3>
      ${dl([["role", "Dean, School of Creative Technology, SCAD"], ["built", "Six years building game development and rebooting the graduate interactive track; redeveloping the year-long production pipeline with game teams deploying and shipping game capstones; Princeton Review #9"], ["history", "25 years of Hollywood characters, rigs and mocap"], ["now", "Applied AI, Robotics, and SCAD Satellite for Creative Technology"], ["output", `${Posts.list.length || "~105"} essays, weekly`]])}
      <p class="ph2">Constraints</p><ol class="ethos">${S.ethos.map(e => `<li>${esc(e)}</li>`).join("")}</ol><p class="close">${esc(S.close)}</p>`;
  }
}

/* ---------------- Scene sync ---------------- */
function syncScene({ focus = true } = {}) {
  if (!vp) return;
  const match = (state.q || state.theme !== "all" || state.year !== "all") ? new Set(filtered().map(p => p.slug)) : null;
  vp.setFilter(match, state.theme);
  const r = route.name;
  if (r === "post") vp.select("essay", route.arg, { focus });
  else if (r === "books") vp.select(route.arg != null ? "next" : "book", route.arg ?? "current", { focus });
  else if (r === "cv") vp.select("cv", "cv", { focus });
  else if (r === "blog" && state.theme !== "all") vp.select("theme", state.theme, { focus });
  else { vp.select(r === "home" ? "avatar" : null, "nye", { focus: false }); if (focus && r === "home") vp.resetView(); }
}

/* ---------------- Render ---------------- */
let renderSeq = 0;
// On a phone the window scrolls; the desktop reader column (#doc) and inspector scroll on their own.
// A route change used to leave whichever of those was in use where it was, so the next view opened mid-content.
function pageToTop() {
  window.scrollTo(0, 0);
  const root = document.scrollingElement;
  if (root) root.scrollTop = 0;
  const doc = $("#doc"); if (doc) doc.scrollTop = 0;
  const insp = $(".inspector"); if (insp) insp.scrollTop = 0;
}
async function render() {
  const seq = ++renderSeq;
  const prev = route.name, prevArg = route.arg;
  Object.assign(route, parse());
  document.body.dataset.route = route.name;
  if (vp) vp.mount(route.name === "home" ? $("#vp-main") : $("#vp-mini"));
  await Posts.ready;
  const doc = $("#doc");
  let html = "";
  if (route.name === "blog") html = blogDoc();
  else if (route.name === "post") html = await postDoc(route.arg);
  else if (route.name === "cv") html = cvPage();
  else if (route.name === "books") html = booksPage(route.arg ?? "current");
  if (seq !== renderSeq) return;
  const keepScroll = prev === "blog" && route.name === "blog"; // filters stay put inside Writing
  const viewChanged = prev !== route.name || prevArg !== route.arg;
  if (route.name !== "home") { doc.innerHTML = html; if (!keepScroll) doc.scrollTop = 0; }
  cursor = -1;
  refreshLists(); renderInspector(); status(); renderConsole(); syncScene();
  const t = { home: "Scene", blog: "Writing", post: Posts.bySlug[route.arg]?.title || "Essay", cv: "CV", books: "Books" }[route.name];
  document.title = `${t} — Nye Warburton · Viewport`;
  if (route.name === "post") doc.focus({ preventScroll: true });
  if (viewChanged && !keepScroll) {
    pageToTop();
    requestAnimationFrame(pageToTop);
    if (route.name === "home") vp?.canvas?.focus({ preventScroll: true });
  }
}

/* ---------------- Keyboard ---------------- */
const THEME_CYCLE = ["all", ...THEMES.map(t => t.id)];
document.addEventListener("keydown", e => {
  const typing = /input|textarea|select/i.test(e.target.tagName);
  if (e.key === "/" && !typing) { e.preventDefault(); $("#q").focus(); $("#q").select(); return; }
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (route.name === "post") {
    if (k === "ArrowLeft") { $(".pager .prev")?.click(); return; }
    if (k === "ArrowRight") { $(".pager .next")?.click(); return; }
    if (k === "j" || k === "J") { $(".pager .prev")?.click(); return; }
    if (k === "k" || k === "K") { $(".pager .next")?.click(); return; }
    if (k === "Escape") { location.hash = blogHash(); return; }
  }
  if (route.name === "blog") {
    if (k === "j" || k === "J" || (k === "ArrowDown" && e.target === document.body)) { e.preventDefault(); moveCursor(1); return; }
    if (k === "k" || k === "K" || (k === "ArrowUp" && e.target === document.body)) { e.preventDefault(); moveCursor(-1); return; }
    if (k === "Enter" && cursor >= 0) { orderedResults()[cursor]?.click(); return; }
    if (k === "Escape") { if (state.q || state.theme !== "all" || state.year !== "all") setFilter({ q: "", theme: "all", year: "all" }); return; }
  }
  if (e.target.closest && e.target.closest(".vp-canvas") && /^[wasd]$/i.test(k)) return;   // WASD pans the camera
  if (k === "[" || k === "]") { const i = THEME_CYCLE.indexOf(state.theme), n = THEME_CYCLE[(i + (k === "]" ? 1 : -1) + THEME_CYCLE.length) % THEME_CYCLE.length]; setFilter({ theme: n }, { push: true }); return; }
  if ((k === "f" || k === "F") && vp) { vp.frameSelected(); return; }
  if ((k === "h" || k === "H" || k === "Home") && vp) { vp.resetView(); return; }
});

/* ---------------- Boot ---------------- */
shell(); status(); renderConsole();
Posts.ready.then(() => {
  if (vp) vp.setPosts(Posts.list, p => window.THREAD_BY_SLUG[p.slug] || p.themes[0], p => readMins(p) || 4);
  log(Posts.mode === "live" ? `paragraph: live · ${Posts.list.length} posts` : `paragraph: snapshot · ${Posts.detail}`, Posts.mode === "live" ? "info" : "warn");
  syncScene({ focus: false });
});
document.addEventListener("posts:content", () => { status(); if (vp) vp.setPosts(Posts.list, p => window.THREAD_BY_SLUG[p.slug] || p.themes[0], p => readMins(p) || 4); syncScene({ focus: false }); if (route.name === "blog" && state.q) renderResults(); log("full text loaded · search covers essay bodies"); });
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.addEventListener("hashchange", render);
render();
