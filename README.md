# Viewport 3D: nyewarburton.com concept (working prototype)

A live 3D "engine editor" for Nye Warburton's site: outliner of themes, a Three.js viewport you can orbit, pan and zoom,
an inspector for whatever is selected, a console of recent essays, and an app-like reader for 105 essays, plus CV and Books.
It's a static site with no build step and no CDN. Three.js r187 is vendored in `vendor/three/`.

## Run it locally

    ./serve.sh            # → http://127.0.0.1:8766/   (pass another port as the first argument)

Any static server works, and so does any base path: every URL is relative, and routes live in the hash.
That's why it runs at `https://<user>.github.io/<repo>/` (GitHub Pages project path) without changes.

## Routes (deep links)

| Hash | What |
|---|---|
| `#/` | Scene: big viewport + console |
| `#/blog` | Writing index; `?q=`, `?theme=`, `?year=`, `?sort=old` combine, e.g. `#/blog?theme=games&year=2025` |
| `#/theme/robotics` | Shortcut for a theme filter (ids: ai, robotics, networks, education, creativity, games, work, personal) |
| `#/search/engine` | Shortcut for a search |
| `#/year/2025` | Shortcut for a year filter |
| `#/post/<slug>` | An essay, e.g. `#/post/a-love-letter-to-the-commodore-64` |
| `#/comics`, `#/comics/<slug>` | NyeToon: three series, then a chapter reader, e.g. `#/comics/08-nyetoon-floydandnorm01` |
| `#/cv` | CV (`?notes=1#/cv` shows the source for every line and the "confirm" flags) |
| `#/books`, `#/books/0` | Books; `/0` selects the one coming-soon title |

Query flags: `?offline=1` forces the snapshot, `?notes=1` shows CV sources, `?scan=<url>` tries a glTF/GLB scan.

## Viewport controls

- Left-drag: orbit · right-drag or Shift+left-drag: pan · wheel or pinch: zoom · WASD pans when the viewport has focus.
- Hover shows a tooltip. Click opens: essay block → essay, theme marker or label → theme filter, book → Books,
  dashed boxes → that coming-soon title, cv.json panel → CV, avatar → Nye's card in the inspector.
- Double-click frames an object. **F** frames the selection, **H** returns to the home view (also buttons, bottom right).
- Hovering a row in the outliner, writing index or console lights up its block in the scene.
- The scene follows the reader: filters dim the essays that don't match, opening an essay flies the camera to its block,
  and away from the home route the viewport docks at the top of the inspector (⤢ Scene goes back).

## Keyboard (reader)

`/` search · `Esc` clear search, then filters (or leave an essay) · `[` `]` previous/next theme ·
in Writing: `J`/`K` or ↓/↑ move through results, `Enter` opens · on an essay: `←`/`J` older, `→`/`K` newer, within the
current filter when the essay is in it.

## Data

- `js/data.js`: Paragraph public API (`public.api.paragraph.com/api/v1`, publication `V98bkWzhrotAwDhbneW0`). It loads the list live,
  then full HTML in the background for full-text search. If the API fails (9 s timeout, network or CORS), it loads
  `data/posts-snapshot.json` (all 105 posts, 2026-11-11) and the top bar shows an amber "Snapshot" badge. Refresh the
  snapshot from this folder with `python3 data/fetch_snapshot.py`.
- `js/threads.js`: the eight themes (curated from Nye's essay list, plus Robotics & Simulation and Games) and the one coming-soon book title.
- `js/site-data.js`: profile, CV (each line keeps its source key and any "confirm" flag) and the book with verified buy links.

## 3D scan hook

See `assets/scan/README.md`. In short: put `nye-scan.glb` in `assets/scan/`, then set `NYE_SCAN.url` in `js/config.js`.
`loadScan(url, {height, rotateY})` in `js/scene.js` swaps the cartoon card for the model. Nothing is loaded until a URL is set.

## Files

    index.html          shell + import map (three → vendor/three)
    css/app.css         layout (outliner | stage | inspector), reader typography (Source Serif 4, 68ch, 1.75 line height)
    js/main.js          router, outliner, inspector, reader, console, keyboard
    js/scene.js         Three.js scene, picking, camera moves, loadScan()
    js/data.js          Paragraph client, snapshot fallback, themes, filtering
    js/pages.js         CV and Books
    vendor/three/       three.module.js + three.core.js r187, OrbitControls, GLTFLoader (+ utils). MIT, see LICENSE.
    assets/             fonts (OFL), cartoon avatar, book cover, scan slot
    tools/shoot.py      headless interaction test + screenshots (Playwright, SwiftShader WebGL)
