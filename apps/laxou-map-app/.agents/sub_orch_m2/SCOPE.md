# Scope: Milestone 2 — Canvas Vector Map Engine & Viewport Controller

## Status: DONE

## Architecture
Milestone 2 implements the pure HTML5 2D Canvas vector map background and interactive Viewport Controller, replacing all legacy Leaflet.js references.

## Requirements & Component Deliverables

### 1. Leaflet Cleanup (`index.html`, `app.js`)
- Completely remove Leaflet CSS link (`https://unpkg.com/leaflet...`) and Leaflet JS script link from `index.html`.
- Clean legacy `L.map` initialization and markers from `app.js`.
- Integrate `ViewportController` and `CanvasEngine` into `app.js` workflow.

### 2. Viewport Controller (`js/viewport.js`)
- `ViewportController` class managing camera $(x, y)$, zoom level $z \in [1..10]$, viewport bounds, and window pixel dimensions.
- Mouse pointer drag/pan gesture handling (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`).
- Mouse wheel zoom centered on cursor location.
- Double-click zoom centered on double-click location.
- Zoom +/- button event listener bindings.
- Viewport bounds clamping (preventing camera from panning infinitely away from map bounds).
- Emits `viewport:changed` (`{ x, y, zoom, bounds }`) via `eventBus`.
- Interface Methods:
  - `getState()` -> `{ x, y, zoom, width, height }`
  - `panBy(dx, dy)`
  - `zoomAt(screenX, screenY, zoomFactor)`
  - `centerOnGeo(lat, lng, zoomLevel)`
  - `fitBounds(geoBounds)`
  - `attachEventListeners(containerEl, zoomInBtnEl, zoomOutBtnEl)`

### 3. Canvas Engine (`js/canvasEngine.js`)
- Pure HTML5 2D Canvas vector renderer without third-party dependencies.
- High-DPI / Retina DPR auto-scaling (`window.devicePixelRatio`).
- Smooth 60fps `requestAnimationFrame` redraw loop triggered by viewport changes.
- Vector background layers:
  - Grid lines (subtle geographical coordinate / distance grid)
  - District polygons & boundaries:
    - Champ-le-Bœuf
    - Laxou Village
    - Laxou Sapinière
    - Nancy Centre
  - Vector road network (primary arteries & local streets)
  - Green parks & natural areas
  - Rivers / waterways (Meurthe / canal vectors)
  - Dynamic scale bar (metric scale update based on current pixel-to-meter resolution at zoom level)

## Verification Verdicts
- Reviewer 1: APPROVE
- Reviewer 2: APPROVE
- Challenger 1: APPROVE
- Challenger 2: APPROVE
- Forensic Auditor: CLEAN
- Gate Result: PASS
