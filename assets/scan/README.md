# 3D scan slot (empty on purpose)

No scan exists yet. When there is one:

1. Export it as glTF binary (`.glb`), Y-up, metres or any unit (the loader rescales it). Keep it under ~15 MB; Draco/meshopt compression needs extra decoders, so export uncompressed or ask for them to be vendored.
2. Save it here as `nye-scan.glb`.
3. In `js/config.js` set `window.NYE_SCAN = { url: "assets/scan/nye-scan.glb", height: 2.3, rotateY: 0 }`.
   - `height`: how tall the scan stands on the pedestal, in scene units (the cartoon card is 3 units across).
   - `rotateY`: radians, to turn the scan so it faces the camera's home view.

To test without editing config: open `index.html?scan=assets/scan/nye-scan.glb` (any same-origin or CORS-enabled URL works).

What happens (`loadScan` in `js/scene.js`): GLTFLoader (vendored) loads the file, the model is scaled to `height`,
centred on the pedestal, made clickable as the "avatar" object, and the cartoon card is hidden. If loading fails,
the console logs a warning and the cartoon stays.
