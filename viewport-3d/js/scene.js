// The live viewport: a Three.js scene of the site. Avatar at the origin, one arm per theme,
// one block per essay (primary theme, oldest nearest the centre), the book shelf and a CV panel.
// Picking emits {kind, id}; the app turns that into a route, and the route drives selection back here.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const ACCENT = 0xffa24a, BG = 0x16171a;
const tmpV = new THREE.Vector3();

export function createViewport({ themes, avatarUrl, bookCoverUrl, bookProjects, comics }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(BG);
  const canvas = renderer.domElement; canvas.className = "vp-canvas"; canvas.tabIndex = 0;
  canvas.setAttribute("aria-label", "3D viewport. Drag to orbit, right-drag or shift-drag to pan, scroll to zoom. Click an object to open it.");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.028);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
  const HOME_POS = new THREE.Vector3(13.5, 11, 18), HOME_TARGET = new THREE.Vector3(0, 0.6, 0);
  camera.position.copy(HOME_POS);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(HOME_TARGET);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  controls.minDistance = 2.5; controls.maxDistance = 70;
  controls.maxPolarAngle = Math.PI * 0.495;           // stay above the floor
  controls.keys = { LEFT: "KeyA", UP: "KeyW", RIGHT: "KeyD", BOTTOM: "KeyS" };
  controls.listenToKeyEvents(canvas);                 // WASD pans when the viewport has focus
  canvas.addEventListener("pointerdown", e => { if (e.shiftKey && e.button === 0) controls.mouseButtons.LEFT = THREE.MOUSE.PAN; });
  window.addEventListener("pointerup", () => { controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE; });

  // Lights + floor grid (two densities) + axis lines, like an engine editor
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x1a1b1f, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(6, 12, 8); scene.add(sun);
  const gridMajor = new THREE.GridHelper(120, 30, 0x3a3e46, 0x30333a); scene.add(gridMajor);
  const gridMinor = new THREE.GridHelper(120, 150, 0x22252a, 0x22252a); gridMinor.position.y = -0.002; scene.add(gridMinor);
  const axis = (a, b, c) => { const g = new THREE.BufferGeometry().setFromPoints([a, b]); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: .7 })); l.position.y = 0.003; scene.add(l); };
  axis(new THREE.Vector3(-60, 0, 0), new THREE.Vector3(60, 0, 0), 0xff5c5c);
  axis(new THREE.Vector3(0, 0, -60), new THREE.Vector3(0, 0, 60), 0x5c9dff);

  const pickables = [];
  const byKey = new Map();                           // "essay:slug" -> mesh
  const reg = (obj, kind, id, label) => { obj.userData = { kind, id, label }; pickables.push(obj); byKey.set(`${kind}:${id}`, obj); return obj; };
  const loader = new THREE.TextureLoader();
  const tex = url => { const t = loader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

  // ---------- Avatar (cartoon stand-in; see loadScan for the glTF/GLB hook) ----------
  const avatarRig = new THREE.Group(); scene.add(avatarRig);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.8, 0.18, 64), new THREE.MeshStandardMaterial({ color: 0x24272d, roughness: .8 }));
  pedestal.position.y = 0.09; avatarRig.add(pedestal);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.9, 1.97, 96), new THREE.MeshBasicMaterial({ color: ACCENT, side: THREE.DoubleSide, transparent: true, opacity: .5 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; avatarRig.add(ring);
  const avatarCard = new THREE.Group(); avatarCard.position.y = 2.0; avatarRig.add(avatarCard);
  const face = new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), new THREE.MeshBasicMaterial({ map: tex(avatarUrl), transparent: true, side: THREE.DoubleSide }));
  const rim = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.57, 64), new THREE.MeshBasicMaterial({ color: 0xececec, side: THREE.DoubleSide }));
  avatarCard.add(face, rim);
  reg(face, "avatar", "nye", "Nye Warburton");
  let scanRoot = null;                                // set when a scan is loaded

  // ---------- Theme arms + essay blocks ----------
  const themeObjs = {};
  const labelSprite = (text, color, scale = 1) => {
    const c = document.createElement("canvas"); const ctx = c.getContext("2d"); const fs = 44;
    ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`; const w = Math.ceil(ctx.measureText(text).width) + 56;
    c.width = w; c.height = 76; ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = "rgba(22,23,26,.86)"; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(2, 2, w - 4, 72, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(26, 38, 9, 0, 7); ctx.fill();
    ctx.fillStyle = "#ecebe8"; ctx.textBaseline = "middle"; ctx.fillText(text, 44, 40);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true }));
    s.scale.set(w / 76 * 0.5 * scale, 0.5 * scale, 1); return s;
  };
  const N = themes.length;
  themes.forEach((t, i) => {
    const ang = (i + 0.5) / N * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
    const g = new THREE.Group(); scene.add(g);
    const col = new THREE.Color(t.color);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 40), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .35, roughness: .4 }));
    base.position.copy(dir).multiplyScalar(5.0).setY(0.04); g.add(base);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), new THREE.MeshBasicMaterial({ color: col }));
    post.position.copy(base.position).setY(0.8); g.add(post);
    const lab = labelSprite(t.label, t.color, 1.35); lab.position.copy(base.position).setY(1.95); g.add(lab);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([dir.clone().multiplyScalar(2.1), dir.clone().multiplyScalar(40)]),
      new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .28 }));
    line.position.y = 0.004; g.add(line);
    reg(base, "theme", t.id, t.label); lab.userData = base.userData; pickables.push(lab); post.userData = base.userData; pickables.push(post);
    themeObjs[t.id] = { group: g, base, label: lab, line, dir, ang, color: col };
  });

  let essayMeshes = [];
  const essayGeo = new THREE.BoxGeometry(1, 1, 1);
  function setPosts(list, primaryOf, lengthOf) {
    essayMeshes.forEach(m => { scene.remove(m); m.material.dispose(); const k = pickables.indexOf(m); if (k > -1) pickables.splice(k, 1); byKey.delete(`essay:${m.userData.id}`); });
    essayMeshes = [];
    const perTheme = {};
    [...list].reverse().forEach(p => { const th = primaryOf(p); (perTheme[th] = perTheme[th] || []).push(p); }); // oldest first
    Object.entries(perTheme).forEach(([th, arr]) => {
      const T = themeObjs[th] || themeObjs[themes.at(-1).id];
      const side = new THREE.Vector3(-T.dir.z, 0, T.dir.x);
      arr.forEach((p, k) => {
        const h = 0.28 + Math.min(1.2, (lengthOf(p) || 4) * 0.075);
        const m = new THREE.Mesh(essayGeo, new THREE.MeshStandardMaterial({ color: T.color, roughness: .55, metalness: .05, emissive: T.color, emissiveIntensity: .12, transparent: true }));
        m.scale.set(0.36, h, 0.36);
        const r = 6.2 + Math.floor(k / 2) * 0.62;
        m.position.copy(T.dir).multiplyScalar(r).addScaledVector(side, (k % 2 ? 1 : -1) * 0.32).setY(h / 2);
        m.rotation.y = -T.ang;
        reg(m, "essay", p.slug, p.title); m.userData.theme = th; m.userData.baseColor = T.color.clone();
        scene.add(m); essayMeshes.push(m);
      });
    });
  }

  // ---------- Books: the 2025 book + one coming-soon wireframe ----------
  const shelf = new THREE.Group(); shelf.position.set(-2.7, 0, 2.3); shelf.rotation.y = 0.64; scene.add(shelf);
  const coverMat = new THREE.MeshStandardMaterial({ map: tex(bookCoverUrl), roughness: .7 });
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xe9e4d8, roughness: .9 }), backMat = new THREE.MeshStandardMaterial({ color: 0x8c4a2f, roughness: .8 });
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.35, 0.16), [pageMat, backMat, pageMat, pageMat, coverMat, backMat]);
  book.position.set(0, 0.95, 0); book.rotation.y = 0; shelf.add(book);
  reg(book, "book", "current", "Nye’s Digital Lab 2025");
  (bookProjects || []).forEach((title, i) => {
    const x = [-1.85, -1.45, -1.05, 1.05, 1.45][i] ?? 1.85 + (i - 5) * 0.4;
    const geo = new THREE.BoxGeometry(0.3, 1.15, 0.85);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x1d1f23, transparent: true, opacity: .55 }));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineDashedMaterial({ color: 0x9aa0a8, dashSize: .08, gapSize: .06 }));
    edges.computeLineDistances(); m.add(edges);
    m.position.set(x, 0.6, -0.05); shelf.add(m);
    reg(m, "next", String(i), `${title} (coming soon)`);
  });

  // ---------- Comics arm: one standing page per NyeToon chapter (first page of the chapter as its card) ----------
  const comicCards = [];
  if (comics && themeObjs.comics) {
    const T = themeObjs.comics, side = new THREE.Vector3(-T.dir.z, 0, T.dir.x);
    comics.chapters.forEach((c, k) => {
      const w = 0.78, h = Math.min(1.45, w / (c.cardAspect || 0.75));
      const g = new THREE.Group();
      const back = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.08, h + 0.08), new THREE.MeshBasicMaterial({ color: 0x0d0e10, side: THREE.DoubleSide }));
      const page = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(c.card), side: THREE.DoubleSide, transparent: true }));
      page.position.z = 0.006; back.position.z = 0.0; g.add(back, page);
      const r = 5.9 + Math.floor(k / 2) * 0.78;
      g.position.copy(T.dir).multiplyScalar(r).addScaledVector(side, (k % 2 ? 1 : -1) * 0.5).setY(h / 2 + 0.12);
      g.userData.baseY = g.position.y;
      scene.add(g);
      reg(page, "comic", c.slug, c.title); back.userData = page.userData; pickables.push(back);
      byKey.set(`comic:${c.slug}`, g);
      comicCards.push(g);
    });
  }
  function setComicsFocus(on) {
    comicCards.forEach(g => g.children[1].material.opacity = on === false ? .35 : 1);
  }

  // ---------- CV panel ----------
  const cvC = document.createElement("canvas"); cvC.width = 512; cvC.height = 320; const cx = cvC.getContext("2d");
  cx.fillStyle = "#1d1f23"; cx.fillRect(0, 0, 512, 320); cx.strokeStyle = "#3a3e46"; cx.lineWidth = 4; cx.strokeRect(2, 2, 508, 316);
  cx.fillStyle = "#ffa24a"; cx.font = "600 30px 'JetBrains Mono', monospace"; cx.fillText("cv.json", 28, 54);
  cx.fillStyle = "#ecebe8"; cx.font = "500 22px Inter, sans-serif";
  ["Dean · STEC @ SCAD", "Six years building game development", "Rebooting the graduate interactive track", "Princeton Review #9", "25 yrs Hollywood characters", "Mocap · previz · real-time"].forEach((l, i) => cx.fillText(l, 28, 100 + i * 34));
  const cvTex = new THREE.CanvasTexture(cvC); cvTex.colorSpace = THREE.SRGBColorSpace;
  const cvPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ map: cvTex, side: THREE.DoubleSide }));
  cvPanel.position.set(2.9, 1.0, 1.9); scene.add(cvPanel);
  reg(cvPanel, "cv", "cv", "CV");

  // ---------- Selection + hover ----------
  const selBox = new THREE.Box3Helper(new THREE.Box3(), ACCENT); selBox.visible = false; scene.add(selBox);
  const hovBox = new THREE.Box3Helper(new THREE.Box3(), 0xffffff); hovBox.visible = false; hovBox.material.transparent = true; hovBox.material.opacity = .45; scene.add(hovBox);
  let selected = null, hovered = null;
  const boxOf = o => new THREE.Box3().setFromObject(o).expandByScalar(0.06);
  function fit(helper, o) { if (!o) { helper.visible = false; return; } helper.box.copy(boxOf(o)); helper.visible = true; }

  // ---------- Filter: dim what doesn't match ----------
  let activeTheme = "all";
  function setFilter(matchSlugs, theme) {
    activeTheme = theme || "all";
    essayMeshes.forEach(m => {
      const on = !matchSlugs || matchSlugs.has(m.userData.id);
      m.material.color.copy(on ? m.userData.baseColor : new THREE.Color(0x2a2d33));
      m.material.emissiveIntensity = on ? .14 : 0; m.material.opacity = on ? 1 : .35;
      m.userData.dim = !on;
    });
    Object.entries(themeObjs).forEach(([id, T]) => {
      const on = activeTheme === "all" || activeTheme === id;
      T.line.material.opacity = activeTheme === id ? .8 : on ? .28 : .08;
      T.labelBase = on ? 1 : .35;
      T.base.material.emissiveIntensity = activeTheme === id ? 1 : .35;
    });
  }

  // ---------- Camera moves ----------
  let goal = null;                                    // {pos, target}
  controls.addEventListener("start", () => { goal = null; });
  function focusOn(o, dist, fixedDir) {
    if (!o) return;
    const b = boxOf(o), c = b.getCenter(new THREE.Vector3()), size = b.getSize(new THREE.Vector3()).length();
    const d = dist || Math.max(4.5, size * 2.6);
    const dir = fixedDir ? fixedDir.clone().normalize() : camera.position.clone().sub(controls.target).normalize();
    if (dir.y < 0.25) dir.y = 0.35, dir.normalize();
    goal = { target: c, pos: c.clone().addScaledVector(dir, d) };
  }
  function resetView() { goal = { target: HOME_TARGET.clone(), pos: HOME_POS.clone() }; }
  function frameTheme(id) {
    const T = themeObjs[id]; if (!T) return;
    const c = T.dir.clone().multiplyScalar(8).setY(0.6);
    const side = new THREE.Vector3(-T.dir.z, 0, T.dir.x);
    goal = { target: c, pos: c.clone().addScaledVector(side, 9).addScaledVector(T.dir, -4).setY(8) };
  }

  function select(kind, id, { focus = true } = {}) {
    if (!kind) { selected = null; fit(selBox, null); return null; }
    if (kind === "theme") { selected = themeObjs[id]?.base || null; fit(selBox, selected); if (focus) frameTheme(id); return selected; }
    const o = byKey.get(`${kind}:${id}`) || null; selected = o; fit(selBox, o);
    const facing = new THREE.Vector3(Math.sin(0.64), 0.55, Math.cos(0.64));
    if (o && focus) focusOn(o, kind === "essay" ? 9 : kind === "avatar" ? 8 : kind === "cv" ? 3.0 : kind === "comic" ? 4.6 : 3.3, (kind === "book" || kind === "next" || kind === "cv") ? facing : null);
    return o;
  }

  // ---------- Picking ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const listeners = { pick: [], hover: [] };
  let downAt = null;
  function hit(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables.filter(o => o.visible !== false), false);
    return hits.length ? hits[0].object : null;
  }
  canvas.addEventListener("pointerdown", e => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener("pointerup", e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    const o = hit(e); listeners.pick.forEach(f => f(o ? o.userData : null, e));
  });
  canvas.addEventListener("pointermove", e => {
    if (e.buttons) return;
    const o = hit(e);
    if (o !== hovered) { hovered = o; fit(hovBox, o && o !== selected && o.userData.kind !== "theme" ? o : null); canvas.style.cursor = o ? "pointer" : "grab"; }
    listeners.hover.forEach(f => f(o ? o.userData : null, e));
  });
  canvas.addEventListener("pointerleave", () => { hovered = null; hovBox.visible = false; listeners.hover.forEach(f => f(null)); });
  canvas.addEventListener("dblclick", e => { const o = hit(e); if (o) focusOn(o); });

  // ---------- Mounting / resize / loop ----------
  let host = null;
  const ro = new ResizeObserver(() => resize());
  function mount(el) {
    if (host === el) return; host = el; el.prepend(canvas); ro.disconnect(); ro.observe(el); resize();
  }
  function resize() {
    if (!host) return; const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); canvas.style.width = w + "px"; canvas.style.height = h + "px";
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  let last = performance.now(), elapsed = 0; let frames = 0, fpsT = 0, fps = 60;
  const fpsListeners = [];
  renderer.setAnimationLoop(() => {
    const now = performance.now(), dt = Math.min((now - last) / 1000, 0.1); last = now; elapsed += dt; const t = elapsed;
    if (goal) {
      const k = 1 - Math.pow(0.0015, dt);
      controls.target.lerp(goal.target, k); camera.position.lerp(goal.pos, k);
      if (camera.position.distanceTo(goal.pos) < 0.02) goal = null;
    }
    controls.update();
    if (!scanRoot) {                                  // the cartoon card turns to face the camera (yaw only)
      tmpV.copy(camera.position).sub(avatarRig.position); avatarCard.rotation.y = Math.atan2(tmpV.x, tmpV.z);
      avatarCard.position.y = 2.0 + Math.sin(t * 1.3) * 0.04;
    }
    cvPanel.lookAt(camera.position.x, cvPanel.position.y, camera.position.z);
    for (const g of comicCards) g.lookAt(camera.position.x, g.position.y, camera.position.z);
    ring.material.opacity = .35 + Math.sin(t * 2) * .15;
    for (const id in themeObjs) {                      // fade labels the camera is close to, so close-ups stay clear
      const T = themeObjs[id], d = camera.position.distanceTo(T.label.position);
      T.label.material.opacity = (T.labelBase ?? 1) * Math.min(1, Math.max(0, (d - 4) / 4));
    }
    if (selected) fit(selBox, selected);
    renderer.render(scene, camera);
    frames++; fpsT += dt; if (fpsT > 0.5) { fps = Math.round(frames / fpsT); frames = 0; fpsT = 0; fpsListeners.forEach(f => f(fps)); }
  });

  // Screen position of an object (for DOM labels that follow the selection)
  function screenOf(kind, id) {
    const o = kind === "theme" ? themeObjs[id]?.label : byKey.get(`${kind}:${id}`); if (!o || !host) return null;
    const b = boxOf(o); const p = b.getCenter(new THREE.Vector3()); p.y = b.max.y; p.project(camera);
    if (p.z > 1) return null;
    return { x: (p.x + 1) / 2 * host.clientWidth, y: (1 - p.y) / 2 * host.clientHeight };
  }

  /* ---------- glTF / GLB scan hook ----------
     loadScan(url) swaps the cartoon card for a 3D scan of Nye. The model is scaled to ~2.3 units tall,
     centred on the pedestal, made pickable as the "avatar" object and the card is hidden.
     If loading fails the cartoon stays. Configure in js/config.js (NYE_SCAN.url) or with ?scan=<url>. */
  async function loadScan(url, { height = 2.3, rotateY = 0 } = {}) {
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    const gltf = await new GLTFLoader().loadAsync(url);
    const root = gltf.scene;
    const b = new THREE.Box3().setFromObject(root), size = b.getSize(new THREE.Vector3());
    const s = height / (size.y || 1); root.scale.setScalar(s);
    const b2 = new THREE.Box3().setFromObject(root), c = b2.getCenter(new THREE.Vector3());
    root.position.set(-c.x, 0.18 - b2.min.y, -c.z); root.rotation.y = rotateY;
    root.traverse(o => { if (o.isMesh) { o.userData = { kind: "avatar", id: "nye", label: "Nye Warburton (scan)" }; pickables.push(o); } });
    if (scanRoot) avatarRig.remove(scanRoot);
    scanRoot = root; avatarRig.add(root); avatarCard.visible = false;
    byKey.set("avatar:nye", root);
    return root;
  }

  function highlight(kind, id) { const o = kind ? (kind === "theme" ? themeObjs[id]?.base : byKey.get(`${kind}:${id}`)) : null; fit(hovBox, o && o !== selected ? o : null); }
  return {
    canvas, mount, highlight, setComicsFocus, setPosts, setFilter, select, focusOn: (k, id) => focusOn(byKey.get(`${k}:${id}`)), frameTheme, resetView,
    frameSelected: () => selected && focusOn(selected), screenOf, loadScan,
    onPick: f => listeners.pick.push(f), onHover: f => listeners.hover.push(f), onFps: f => fpsListeners.push(f),
    stats: () => ({ objects: pickables.length, essays: essayMeshes.length, fps }),
    _debug: { scene, camera, controls }
  };
}
