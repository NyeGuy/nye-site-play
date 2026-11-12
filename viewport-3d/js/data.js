// Data layer: Paragraph public API (live) with snapshot fallback, themes, filtering, HTML cleanup.
// Ported from the round 1/2 shared app.js so all concepts share the same rules.
const S = window.SITE, P = S.paragraph;
export const params = new URLSearchParams(location.search);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const fmtDate = (ms, o = { year: "numeric", month: "short", day: "numeric" }) => new Date(+ms).toLocaleDateString("en-US", o);
export const THEMES = window.THEMES_OVERRIDE;
export const themeById = id => THEMES.find(t => t.id === id) || { id: "other", label: "Other", short: "OTHER", color: "#8a9099" };
export const themeLabel = id => themeById(id).label;

function themesFor(p) {
  const text = `${p.title} ${p.subtitle || ""}`, tags = (p.categories || []).map(t => t.toLowerCase());
  const prim = window.THREAD_BY_SLUG[p.slug];
  const extra = THEMES.filter(t => t.id !== prim && ((t.also || []).includes(p.slug) || (t.kw && t.kw.test(text)) || (t.tags && tags.some(g => t.tags.includes(g))))).map(t => t.id);
  const out = [prim, ...extra].filter(Boolean);
  return out.length ? out : ["other"];
}

export const Posts = { list: [], bySlug: {}, mode: "loading", detail: "", contentReady: false, fetchedAt: null };
window.Posts = Posts;
function withTimeout(url, ms = 9000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  return fetch(url, { signal: c.signal, headers: { Accept: "application/json" } }).then(r => { clearTimeout(t); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });
}
async function fetchAllLive(includeContent) {
  let cursor = null, items = [];
  do {
    const d = await withTimeout(`${P.api}/publications/${P.publicationId}/posts?limit=50${includeContent ? "&includeContent=true" : ""}${cursor ? `&cursor=${cursor}` : ""}`, includeContent ? 20000 : 9000);
    items = items.concat(d.items);
    cursor = d.pagination && d.pagination.hasMore ? d.pagination.cursor : null;
  } while (cursor);
  return items;
}
const stripHtml = h => { const d = document.createElement("div"); d.innerHTML = h.replace(/<img[^>]*>/g, ""); return (d.textContent || "").replace(/\s+/g, " "); };
function ingest(items) {
  Posts.list = items.filter(p => p.publishOnline !== false).map(p => ({
    id: p.id, title: (p.title || "").trim(), subtitle: (p.subtitle || "").trim(), slug: p.slug, publishedAt: +p.publishedAt,
    imageUrl: p.imageUrl, categories: p.categories || [], html: p.staticHtml || null
  })).sort((a, b) => b.publishedAt - a.publishedAt);
  Posts.bySlug = {};
  Posts.list.forEach((p, i) => { p.themes = themesFor(p); p.index = i; p.n = Posts.list.length - i; p.year = new Date(p.publishedAt).getFullYear(); p.text = p.html ? stripHtml(p.html) : ""; Posts.bySlug[p.slug] = p; });
}
let snapP = null;
const snapshot = () => snapP || (snapP = fetch("data/posts-snapshot.json").then(r => r.json()));
async function loadSnapshot(reason) {
  const snap = await snapshot();
  ingest(snap.items); Posts.mode = "snapshot"; Posts.fetchedAt = snap.fetchedAt; Posts.detail = reason; Posts.contentReady = true;
}
Posts.ready = (async () => {
  if (params.has("offline")) { await loadSnapshot("forced with ?offline"); return; }
  try {
    ingest(await fetchAllLive(false)); Posts.mode = "live"; Posts.fetchedAt = new Date().toISOString();
    fetchAllLive(true).then(items => {   // background: full HTML for full-text search
      const map = Object.fromEntries(items.map(i => [i.id, i.staticHtml]));
      Posts.list.forEach(p => { if (map[p.id]) { p.html = map[p.id]; p.text = stripHtml(p.html); } });
      Posts.contentReady = true; document.dispatchEvent(new Event("posts:content"));
    }).catch(() => {});
  } catch (e) {
    console.warn("Live Paragraph fetch failed, using snapshot:", e);
    await loadSnapshot(`live fetch failed (${e.message})`);
  }
})();
export async function ensureContent(p) {
  if (p.html) return p.html;
  try { const d = await withTimeout(`${P.api}/posts/${p.id}?includeContent=true`, 12000); p.html = d.staticHtml; }
  catch (e) { const s = (await snapshot()).items.find(i => i.id === p.id); p.html = s ? s.staticHtml : "<p>Couldn’t load this essay.</p>"; }
  p.text = stripHtml(p.html); return p.html;
}
export function cleanHtml(h) {
  const doc = new DOMParser().parseFromString(h, "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed,form").forEach(n => n.remove());
  doc.querySelectorAll("*").forEach(n => {
    [...n.attributes].forEach(a => { if (/^on/i.test(a.name) || a.name === "style" || a.name === "class" || /blurdataurl/i.test(a.name)) n.removeAttribute(a.name); });
    if (n.tagName === "A") { n.target = "_blank"; n.rel = "noopener"; }
    if (n.tagName === "IMG") { n.loading = "lazy"; n.decoding = "async"; }
  });
  doc.querySelectorAll("div:empty").forEach(n => n.remove());
  doc.querySelectorAll("body > br").forEach(n => n.remove());
  doc.querySelectorAll("p").forEach(n => { if (!n.textContent.trim() && !n.querySelector("img,video,iframe")) n.remove(); });
  return doc.body.innerHTML;
}
export const readMins = p => p.text ? Math.max(1, Math.round(p.text.split(" ").length / 230)) : null;
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Filter state is the single source of truth for the outliner list, the reader index and the 3D scene.
export const state = { q: "", theme: "all", year: "all", sort: "new" };
export function filtered(st = state) {
  const q = st.q.trim();
  let arr = Posts.list.filter(p => (st.theme === "all" || p.themes.includes(st.theme)) && (st.year === "all" || p.year == st.year));
  if (q) { const re = new RegExp("\\b" + reEsc(q), "i"); arr = arr.filter(p => re.test(`${p.title} ${p.subtitle} ${p.categories.join(" ")} ${p.text}`)); }
  return st.sort === "old" ? [...arr].reverse() : arr;
}
export const titleHit = (p, q) => new RegExp("\\b" + reEsc(q), "i").test(`${p.title} ${p.subtitle} ${p.categories.join(" ")}`);
export const mark = (t, q) => q ? esc(t).replace(new RegExp(reEsc(esc(q)), "ig"), m => `<mark>${m}</mark>`) : esc(t);
export const years = () => [...new Set(Posts.list.map(p => p.year))].sort((a, b) => b - a);
export const countTheme = id => Posts.list.filter(p => p.themes.includes(id)).length;
