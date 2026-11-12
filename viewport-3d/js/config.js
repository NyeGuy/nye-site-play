/* Viewport 3D config.
   NYE_SCAN: drop a glTF/GLB scan of Nye in assets/scan/ and set url to swap out the cartoon card,
   e.g. url: "assets/scan/nye-scan.glb". Leave null to keep the cartoon. ?scan=<url> overrides for testing.
   height is the scan's height in scene units (the pedestal is 2.5 wide); rotateY turns it to face +Z. */
window.NYE_SCAN = { url: null, height: 2.3, rotateY: 0 };
