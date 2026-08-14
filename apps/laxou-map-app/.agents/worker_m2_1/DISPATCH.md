## 2026-08-06T10:18:09Z

<USER_REQUEST>
You are the Worker for Milestone 2 (Canvas Vector Map Engine & Viewport Controller) of the Laxou & Nancy Custom Interactive Map project.

Your working directory is: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/worker_m2_1`
Workspace root: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app`

Required Documents to Read First:
- `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/ORIGINAL_REQUEST.md`
- `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/PROJECT.md`
- `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/sub_orch_m2/SCOPE.md`
- Explorer 1 Report: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m2_1/analysis.md`
- Explorer 2 Report: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m2_2/analysis.md`
- Explorer 3 Report: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m2_3/analysis.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implementation Tasks:
1. `index.html` Cleanup:
   - Completely remove Leaflet CSS link tag (`https://unpkg.com/leaflet...`) and Leaflet JS script tag.
   - Clean legacy Leaflet references. Ensure `#map-view` contains `<canvas id="map-canvas">`, `<div id="marker-overlay">`, and zoom control buttons `#zoom-in-btn` and `#zoom-out-btn`.
   - Update `app.js` import tag to `<script type="module" src="js/app.js"></script>`.

2. Viewport Controller (`js/viewport.js`):
   - Implement `ViewportController` class in ES6 module format.
   - Manage camera position (x, y) in normalized world space, zoom level z in [1, 10], viewport width/height, bounds clamping.
   - Pointer events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) with `setPointerCapture` for fluid drag/pan.
   - Cursor-anchored mouse wheel zoom keeping world coordinate under cursor invariant.
   - Double-click zoom centered on click location.
   - Zoom +/- button event listener bindings.
   - Emit `viewport:changed` (`{ x, y, zoom, width, height, bounds }`) via `eventBus`.
   - Exact methods: `getState()`, `panBy(dx, dy)`, `zoomAt(screenX, screenY, zoomFactor)`, `centerOnGeo(lat, lng, zoomLevel)`, `fitBounds(geoBounds)`, `attachEventListeners(containerEl, zoomInBtnEl, zoomOutBtnEl)`.

3. Canvas Vector Map Engine (`js/canvasEngine.js`):
   - Implement `CanvasEngine` class in ES6 module format.
   - Pure HTML5 2D Canvas vector map background renderer.
   - High-DPI / Retina DPR auto-scaling (`window.devicePixelRatio`).
   - 60fps `requestAnimationFrame` redraw loop triggered on viewport changes.
   - Render layers:
     - Grid lines (subtle distance / lat-lng coordinate grid)
     - District boundary polygons (Champ-le-Bœuf, Laxou Village, Laxou Sapinière, Nancy Centre) with clean styling and district labels
     - Vector roads (major arteries and local streets)
     - Green parks & natural areas
     - Rivers / waterways (Meurthe / Canal)
     - Dynamic metric scale bar (calculating meters per pixel dynamically at zoom level)

4. App Integration (`js/app.js`):
   - Clean out all legacy `L.map` / Leaflet logic.
   - Instantiate `Projection`, `ViewportController`, `CanvasEngine`, `DataProvider`, and `EventBus`.
   - Wire `viewport:changed` event to update `CanvasEngine` and `Projection`.

5. Automated Tests & Build Verification:
   - Create unit/integration tests (e.g., in `tests/` directory) for viewport math, canvas engine render pipeline, Leaflet CDN removal assertions, and eventBus emissions.
   - Run all tests using pytest / node test runner and document the exact commands and pass/fail outputs.

Write your changes report and handoff report to `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/worker_m2_1/handoff.md` and send a message back with the path and summary.
</USER_REQUEST>
