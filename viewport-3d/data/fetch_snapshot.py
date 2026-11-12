"""Pull every post (with HTML) from Paragraph's public API into data/posts-snapshot.json.
Used only as the offline fallback; the prototype fetches live first."""
import json, re, time, urllib.request
PUB = "V98bkWzhrotAwDhbneW0"
BASE = "https://public.api.paragraph.com/api/v1"
UA = {"User-Agent": "Mozilla/5.0 (mockup snapshot)"}
def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))
items, cursor = [], None
while True:
    url = f"{BASE}/publications/{PUB}/posts?limit=50&includeContent=true" + (f"&cursor={cursor}" if cursor else "")
    d = get(url); items += d["items"]
    if not d["pagination"].get("hasMore"): break
    cursor = d["pagination"]["cursor"]; time.sleep(0.3)
out = []
for p in items:
    html = p.get("staticHtml") or ""
    html = re.sub(r'\s(blurdataurl|nextheight|nextwidth)="[^"]*"', "", html)
    out.append({k: p.get(k) for k in ("id","title","subtitle","slug","publishedAt","imageUrl","categories")} | {"staticHtml": html})
json.dump({"fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "source": f"{BASE}/publications/{PUB}/posts", "total": len(out), "items": out},
          open("data/posts-snapshot.json","w"), ensure_ascii=False)
print(len(out))
