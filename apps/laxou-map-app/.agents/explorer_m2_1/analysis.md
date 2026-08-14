# Milestone 2 — ViewportController & Legacy Leaflet Cleanup Analysis

**Author**: Explorer 1 (Milestone 2)  
**Target Module**: `js/viewport.js`, `index.html`, `app.js`  
**Working Directory**: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m2_1`  
**Date**: 2026-08-06  

---

## 1. Executive Summary & Scope Overview

Milestone 2 transitions the Laxou & Nancy interactive map application from its legacy Leaflet.js prototype to a 100% custom, in-house HTML5 2D Canvas vector map engine and camera Viewport Controller.

Requirement **R1** explicitly dictates:
> *"Ne pas utiliser de bibliothèques tierces (Leaflet, Mapbox, OpenLayers interdits)."*

This investigation delivers:
1. A line-by-line audit of all legacy Leaflet.js dependencies in `index.html` and `app.js`, alongside exact diff specifications for zero-dependency removal.
2. An architectural design and interface contract for `ViewportController` in `js/viewport.js`.
3. Rigorous mathematical derivations for camera transforms, cursor-anchored zooming, bounds clamping, pointer gesture capturing, and event bus emissions (`viewport:changed`).

---

## 2. Task 1: Legacy Leaflet.js Audit & Complete Removal Plan

### 2.1 Audit of `index.html`
A comprehensive search reveals four legacy Leaflet dependencies in `index.html`:

| Line(s) | Current Content | Action / Replacement | Rationale |
|---|---|---|---|
| **17–18** | `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"...>` | **REMOVE** completely | Eliminates external Leaflet stylesheet dependency. |
| **61–62** | `<!-- Interactive Leaflet Map -->`<br>`<div id="map-view"></div>` | **UPDATE** comment & add canvas + overlay + zoom controls:<br>```html<div id="map-view" class="map-view-container"><canvas id="map-canvas"></canvas><div id="marker-overlay" class="marker-overlay"></div><div class="map-zoom-controls"><button id="zoom-in-btn" class="map-ctrl-btn" aria-label="Zoom avant" title="Zoom avant"><i class="fa-solid fa-plus"></i></button><button id="zoom-out-btn" class="map-ctrl-btn" aria-label="Zoom arrière" title="Zoom arrière"><i class="fa-solid fa-minus"></i></button></div></div>``` | Creates Canvas element for `CanvasEngine`, DOM overlay container for `MarkerManager`, and accessible zoom +/- buttons (`#zoom-in-btn`, `#zoom-out-btn`). |
| **103** | `<span>OpenStreetMap &amp; Leaflet</span>` | **UPDATE** to `<span>Moteur Carte Canvas Vectoriel sur-mesure</span>` | Updates UI footer attribution. |
| **112–113** | `<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"...></script>` | **REMOVE** completely | Eliminates external Leaflet JS library script. |
| **115** | `<script src="app.js"></script>` | **UPDATE** to `<script type="module" src="app.js"></script>` | Enables ES module imports (`Projection`, `ViewportController`, `CanvasEngine`, `EventBus`, `DataProvider`). |

---

### 2.2 Audit of `app.js`
`app.js` currently relies on global `L` object primitives for initialization and rendering:

| Line(s) | Legacy Leaflet Code | Required Modification / Replacement |
|---|---|---|
| **15–16** | `let map = null;`<br>`let markersGroup = null;` | **REMOVE** legacy variables. Instantiate `projection`, `viewport`, `canvasEngine`, `eventBus`, and `dataProvider`. |
| **57** | `setupMap();` | Replace with component pipeline initialization:<br>`viewport = new ViewportController(projection, eventBus);`<br>`viewport.attachEventListeners(container, zoomInBtn, zoomOutBtn);`<br>`canvasEngine = new CanvasEngine(canvas, projection, viewport, eventBus);` |
| **63–78** | `function setupMap() { map = L.map(...); L.control.zoom(...); L.tileLayer(...); markersGroup = L.layerGroup()...; }` | **DELETE** `setupMap()` entirely. Canvas setup is managed via `CanvasEngine`. |
| **92–93** | `map.setView(appData.center, appData.zoom || 14);` | Replace with `viewport.centerOnGeo(appData.center[0], appData.center[1], 1.0);` |
| **147–209** | `function renderMarkers(places) { markersGroup.clearLayers(); ... L.divIcon(...) ... L.marker(...) ... marker.bindPopup(...) ... }` | **REMOVE** Leaflet marker layer operations. DOM SVG/HTML marker overlay positioning will be managed by `MarkerManager` subscribing to `viewport:changed`. |
| **257–259** | `map.flyTo([place.lat, place.lng], 16, { duration: 1.2 });` | Replace with `viewport.centerOnGeo(place.lat, place.lng, 4.0);` (or smooth animated camera pan). |
| **265** | `window.selectPlace = selectPlace;` | **REMOVE** global window pollution; delegate marker selection to event bus (`place:selected`). |

---

## 3. Task 2: ViewportController Architecture & Requirements (`js/viewport.js`)

### 3.1 Class State & Parameters
`ViewportController` encapsulates the camera transform state and pointer/wheel gesture handling:

```javascript
export class ViewportController {
  constructor(projection, eventBus, options = {}) {
    this.projection = projection; // Projection instance (M1)
    this.eventBus = eventBus;     // EventBus instance (M1)
    
    // Viewport State
    this.x = 0;              // Camera pan offset X (screen pixels from screen center)
    this.y = 0;              // Camera pan offset Y (screen pixels from screen center)
    this.zoom = 1.0;         // Zoom factor z in [minZoom, maxZoom]
    this.minZoom = options.minZoom ?? 1.0;
    this.maxZoom = options.maxZoom ?? 10.0;
    
    // Screen Dimensions
    this.width = options.width ?? 800;
    this.height = options.height ?? 600;

    // Gesture State
    this.isDragging = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.activePointerId = null;
  }
}
```

---

### 3.2 Exact Interface Method Contracts

#### 1. `getState()`
Returns snapshot of camera position, zoom factor, viewport size, and visible geographic bounds.
- **Return Type**: `{ x: number, y: number, zoom: number, width: number, height: number, bounds: { minLat: number, maxLat: number, minLng: number, maxLng: number } }`

#### 2. `panBy(dx, dy)`
Translates camera pan position by $(\Delta x, \Delta y)$ screen pixels. Clamps new position to allowable map bounds and emits `'viewport:changed'`.
- **Parameters**: `dx: number`, `dy: number`
- **Return Type**: `void`

#### 3. `zoomAt(screenX, screenY, zoomFactor)`
Adjusts zoom centered on specified screen coordinate $(S_x, S_y)$ (such as cursor or double-click point). Keeps world coordinate under $(S_x, S_y)$ stationary during scale change. Clamps zoom to $[z_{\min}, z_{\max}]$ and emits `'viewport:changed'`.
- **Parameters**: `screenX: number`, `screenY: number`, `zoomFactor: number` (relative multiplier e.g. `1.25` or `0.8`, or new absolute scale)
- **Return Type**: `void`

#### 4. `centerOnGeo(lat, lng, zoomLevel)`
Centers camera on target geographic coordinate $(\text{lat}, \text{lng})$ at optional zoom level $z$.
- **Parameters**: `lat: number`, `lng: number`, `zoomLevel?: number`
- **Return Type**: `void`

#### 5. `fitBounds(geoBounds)`
Calculates optimal zoom level $z$ and camera position $(x, y)$ to display geographic bounding box `geoBounds` with defensive padding (e.g. 5–10%).
- **Parameters**: `geoBounds: { minLat: number, maxLat: number, minLng: number, maxLng: number }`
- **Return Type**: `void`

#### 6. `attachEventListeners(containerEl, zoomInBtnEl, zoomOutBtnEl)`
Attaches pointer drag listeners (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`), wheel zoom listener (`wheel`), double click listener (`dblclick`), zoom button click handlers, and `ResizeObserver`.
- **Parameters**: `containerEl: HTMLElement`, `zoomInBtnEl?: HTMLElement`, `zoomOutBtnEl?: HTMLElement`
- **Return Type**: `void`

#### 7. `getVisibleGeoBounds()`
Helper method computing current visible geographic bounds in viewport space.
- **Return Type**: `{ minLat: number, maxLat: number, minLng: number, maxLng: number }`

---

### 3.3 Gesture Handling & Pointer Capture Strategy

1. **Pointer Down (`pointerdown`)**:
   - Verify `e.button === 0` (primary button).
   - Record `this.isDragging = true`, `this.lastPointerX = e.clientX`, `this.lastPointerY = e.clientY`, `this.activePointerId = e.pointerId`.
   - Call `containerEl.setPointerCapture(e.pointerId)` to trap drag events even if cursor leaves element boundaries.

2. **Pointer Move (`pointermove`)**:
   - If `!this.isDragging` or `e.pointerId !== this.activePointerId`, return.
   - Calculate delta: `dx = e.clientX - this.lastPointerX`, `dy = e.clientY - this.lastPointerY`.
   - Update `this.lastPointerX = e.clientX`, `this.lastPointerY = e.clientY`.
   - Invoke `this.panBy(dx, dy)`.

3. **Pointer Up / Cancel (`pointerup`, `pointercancel`, `pointerleave`)**:
   - If `e.pointerId === this.activePointerId`:
     - Call `containerEl.releasePointerCapture(e.pointerId)`.
     - Reset `this.isDragging = false`, `this.activePointerId = null`.

4. **Wheel Zoom (`wheel`)**:
   - Call `e.preventDefault()` to block window scrolling.
   - Compute relative cursor screen coordinates: `screenX = e.clientX - containerRect.left`, `screenY = e.clientY - containerRect.top`.
   - Normalize wheel delta (`e.deltaY` sensitivity):
     ```javascript
     const delta = e.deltaY * (e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 600 : 1);
     const zoomFactor = Math.pow(0.999, delta); // Smooth exponential zoom scale
     this.zoomAt(screenX, screenY, zoomFactor);
     ```

5. **Double-Click Zoom (`dblclick`)**:
   - Call `e.preventDefault()`.
   - Compute screen position `(screenX, screenY)`.
   - Execute `this.zoomAt(screenX, screenY, 1.5)`.

6. **Zoom +/- Control Buttons**:
   - Zoom In button click: `this.zoomAt(this.width / 2, this.height / 2, 1.25)`.
   - Zoom Out button click: `this.zoomAt(this.width / 2, this.height / 2, 0.8)`.

---

## 4. Task 3: Mathematical Formalization, Edge Cases & Implementation Guidance

### 4.1 Coordinate Space Transformations

Let:
- $V_w, V_h$ be viewport width and height in screen pixels (`width`, `height`).
- $(W_0, H_0)$ be base screen dimensions calculated by `Projection` for $z = 1.0$ preserving geographical aspect ratio (`projection.baseWidth`, `projection.baseHeight`).
- $(w_x, w_y) \in [0, 1] \times [0, 1]$ be normalized world coordinates (where $w_x = 0$ at `minLng`, $w_x = 1$ at `maxLng`, $w_y = 0$ at `maxLat`, $w_y = 1$ at `minLat`).
- $(x, y)$ be camera pan offset in screen pixels (when $(x, y) = (0, 0)$, world center $(0.5, 0.5)$ maps to viewport center $(\frac{V_w}{2}, \frac{V_h}{2})$).
- $z \in [1.0, 10.0]$ be zoom level.

#### Forward Transformation (World to Screen):
$$S_x = (w_x - 0.5) \cdot W_0 \cdot z + \frac{V_w}{2} + x$$
$$S_y = (w_y - 0.5) \cdot H_0 \cdot z + \frac{V_h}{2} + y$$

#### Inverse Transformation (Screen to World):
$$w_x = \frac{S_x - \frac{V_w}{2} - x}{W_0 \cdot z} + 0.5$$
$$w_y = \frac{S_y - \frac{V_h}{2} - y}{H_0 \cdot z} + 0.5$$

---

### 4.2 Cursor-Anchored Zoom Math Derivation

When zooming at screen focal point $(S_x, S_y)$ from zoom level $z_{\text{old}}$ to $z_{\text{new}} = \text{clamp}(z_{\text{old}} \cdot f, z_{\min}, z_{\max})$:

We require world coordinate $(w_x, w_y)$ beneath screen point $(S_x, S_y)$ to remain invariant under zoom.

Prior to zoom:
$$w_x - 0.5 = \frac{S_x - \frac{V_w}{2} - x_{\text{old}}}{W_0 \cdot z_{\text{old}}}$$
$$w_y - 0.5 = \frac{S_y - \frac{V_h}{2} - y_{\text{old}}}{H_0 \cdot z_{\text{old}}}$$

After zoom to $z_{\text{new}}$, the new pan position $(x_{\text{new}}, y_{\text{new}})$ must satisfy:
$$S_x = (w_x - 0.5) \cdot W_0 \cdot z_{\text{new}} + \frac{V_w}{2} + x_{\text{new}}$$
$$S_y = (w_y - 0.5) \cdot H_0 \cdot z_{\text{new}} + \frac{V_h}{2} + y_{\text{new}}$$

Substituting $(w_x - 0.5) \cdot W_0$:
$$S_x = \left( \frac{S_x - \frac{V_w}{2} - x_{\text{old}}}{z_{\text{old}}} \right) z_{\text{new}} + \frac{V_w}{2} + x_{\text{new}}$$

Solving for $x_{\text{new}}$ and $y_{\text{new}}$:
$$x_{\text{new}} = \left(S_x - \frac{V_w}{2}\right) \left(1 - \frac{z_{\text{new}}}{z_{\text{old}}}\right) + x_{\text{old}} \cdot \frac{z_{\text{new}}}{z_{\text{old}}}$$
$$y_{\text{new}} = \left(S_y - \frac{V_h}{2}\right) \left(1 - \frac{z_{\text{new}}}{z_{\text{old}}}\right) + y_{\text{old}} \cdot \frac{z_{\text{new}}}{z_{\text{old}}}$$

This equation guarantees zero mouse cursor drift during high-speed wheel zooming or double-clicking!

---

### 4.3 Bounds Clamping Math

To prevent the camera from panning infinitely away from the map area:
Total map width on screen at zoom $z$: $W_z = W_0 \cdot z$  
Total map height on screen at zoom $z$: $H_z = H_0 \cdot z$  

Allowable pan offset bounds $(x_{\max}, y_{\max})$ with a $25\%$ viewport edge margin:
$$x_{\max} = \max\left(0, \frac{W_z - V_w}{2} + 0.25 \cdot V_w\right)$$
$$y_{\max} = \max\left(0, \frac{H_z - V_h}{2} + 0.25 \cdot V_h\right)$$

Clamping implementation:
$$x_{\text{clamped}} = \max(-x_{\max}, \min(x_{\max}, x))$$
$$y_{\text{clamped}} = \max(-y_{\max}, \min(y_{\max}, y))$$

---

### 4.4 Geographic Bounds Fitting (`fitBounds`)

Given target geographic bounds `{ minLat, maxLat, minLng, maxLng }`:
1. Convert top-left $(\text{maxLat}, \text{minLng})$ and bottom-right $(\text{minLat}, \text{maxLng})$ to world coordinates:
   $$w_{\min, x} = \text{geoToWorld}(\text{maxLat}, \text{minLng}).x, \quad w_{\max, x} = \text{geoToWorld}(\text{minLat}, \text{maxLng}).x$$
   $$w_{\min, y} = \text{geoToWorld}(\text{maxLat}, \text{minLng}).y, \quad w_{\max, y} = \text{geoToWorld}(\text{minLat}, \text{maxLng}).y$$
2. Compute world span: $\Delta w_x = w_{\max, x} - w_{\min, x}$, $\Delta w_y = w_{\max, y} - w_{\min, y}$.
3. Calculate required zoom with $5\%$ padding ($p = 0.05$):
   $$z_x = \frac{V_w (1 - 2p)}{\Delta w_x \cdot W_0}, \quad z_y = \frac{V_h (1 - 2p)}{\Delta w_y \cdot H_0}$$
   $$z_{\text{fit}} = \text{clamp}(\min(z_x, z_y), z_{\min}, z_{\max})$$
4. Set zoom $z = z_{\text{fit}}$ and center camera on world midpoint:
   $$w_{x, \text{center}} = \frac{w_{\min, x} + w_{\max, x}}{2}, \quad w_{y, \text{center}} = \frac{w_{\min, y} + w_{\max, y}}{2}$$
   $$x = -(w_{x, \text{center}} - 0.5) \cdot W_0 \cdot z$$
   $$y = -(w_{y, \text{center}} - 0.5) \cdot H_0 \cdot z$$

---

### 4.5 Edge Cases & Defensive Safeguards

1. **Zero-Dimension Initialization**:
   If container element is hidden or not attached to DOM on init (`clientWidth === 0`), fallback to `800x600`. Attach `ResizeObserver` to re-trigger `setCanvasSize` and update viewport dimensions upon container attachment or display change.

2. **Touch Gesture / Selection Conflicts**:
   Add CSS `touch-action: none; user-select: none;` to `#map-view` to prevent browser pull-to-refresh, page scrolling, or text highlight boxes during map dragging.

3. **High-DPI / Retina Screen Resolution**:
   `ViewportController` operates in logical CSS pixel coordinates. `CanvasEngine` will handle scaling by `window.devicePixelRatio` during background rendering.

4. **EventBus Emission Debouncing / RAF Alignment**:
   `emit('viewport:changed')` should be called synchronously during user interaction so DOM marker overlays (`MarkerManager`) update in lockstep with vector canvas redraws.

---

### 4.6 Recommended Unit Test Suite (`tests/test_viewport.js`)

Implementers should construct a Node test suite `tests/test_viewport.js` asserting:
1. `getState()` returns initial state `{ x: 0, y: 0, zoom: 1, ... }`.
2. `panBy(dx, dy)` correctly modifies $(x, y)$ and emits `viewport:changed`.
3. `zoomAt(screenX, screenY, factor)` clamps zoom within $[1, 10]$ and preserves cursor invariant.
4. `centerOnGeo(lat, lng, zoom)` correctly calculates pan offsets for Laxou center $(48.6865, 6.1504)$.
5. `fitBounds(geoBounds)` correctly fits Laxou bounds with padding.
6. Bounds clamping limits maximum pan offset from map boundaries.

---

## 5. Summary of Recommended Implementation Steps for Implementers

1. **Modify `index.html`**: Remove Leaflet CSS & JS CDN links; insert `<canvas id="map-canvas">`, `<div id="marker-overlay">`, and zoom control buttons `#zoom-in-btn` / `#zoom-out-btn`; change `app.js` tag to `type="module"`.
2. **Create `js/viewport.js`**: Implement `ViewportController` class strictly fulfilling interface contract and math equations detailed in Section 3 & 4.
3. **Refactor `app.js`**: Instantiate `ViewportController` and connect it to `Projection`, `CanvasEngine`, and `EventBus`.
4. **Run Verification**: Execute unit tests (`node --test tests/test_viewport.js`) and Playwright E2E suite (`pytest tests/test_tier1_features.py`).
