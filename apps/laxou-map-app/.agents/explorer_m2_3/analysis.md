# Milestone 2 — Technical Integration & Automated Testing Analysis Report

**Author**: Explorer 3 (`explorer_m2_3`)  
**Milestone**: M2 — Canvas Vector Map Engine & Viewport Controller  
**Workspace**: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app`  
**Date**: 2026-08-06  

---

## 1. Executive Summary

Milestone 2 transitions the Laxou & Nancy Interactive Map Application from legacy Leaflet.js rendering to a custom, dependency-free HTML5 2D Canvas vector map engine and interactive viewport controller.

This report provides the full architectural blueprint for:
1. **Component Integration (`js/app.js`)**: Orchestrating `ViewportController` and `CanvasEngine` alongside M1 core components (`Projection`, `DataProvider`, `EventBus`).
2. **M1 Zero-Regression Audit**: Comprehensive contract check across all existing source files (`index.html`, `styles.css`, `js/app.js`, `js/projection.js`, `js/dataProvider.js`, `js/eventBus.js`) to guarantee 100% backward compatibility.
3. **Automated & Unit Testing Strategy**: A complete test specification covering viewport camera transform math, canvas rendering context state updates, Leaflet DOM purge validation, and event bus pub/sub emissions.

---

## 2. Task 1: Component Integration Architecture (`js/app.js`)

### 2.1 System Composition & Lifecycle Flow

In M2, `js/app.js` transitions to an ES module acting as the central application orchestrator. The initialization flow operates as follows:

```
+-----------------------------------------------------------------------------------+
|                                  js/app.js                                        |
+-----------------------------------------------------------------------------------+
        |                         |                         |                      |
        v                         v                         v                      v
+---------------+        +-----------------+        +---------------+     +------------------+
|   EventBus    |        |  DataProvider   |        |  Projection   |     | ViewportControl. |
+---------------+        +-----------------+        +---------------+     +------------------+
        |                         |                         |                      |
        +-------------------------+-------------------------+                      |
                                  |                                                |
                                  v                                                v
                       +----------------------+                          +-------------------+
                       |    CanvasEngine      | <=== viewport:changed == | Pointer & Wheel   |
                       | (2D Canvas Renderer) |                          | Event Listeners   |
                       +----------------------+                          +-------------------+
```

#### Initialization Sequence:
1. **EventBus Instantiation**: Instantiates `const eventBus = new EventBus()`.
2. **DataProvider Setup**: Instantiates `const dataProvider = new DataProvider(eventBus)`.
3. **Projection Initialization**: Instantiates `const projection = new Projection(Projection.DEFAULT_BOUNDS, { width: rect.width, height: rect.height })`.
4. **ViewportController Initialization**:
   - Binds to container element `#map-view` and zoom control buttons `#zoom-in-btn`, `#zoom-out-btn`.
   - Uses `projection` for coordinate conversions (`geoToWorld`, `worldToScreen`, etc.).
   - Emits `viewport:changed` on gesture updates.
5. **CanvasEngine Setup**:
   - Obtains HTML5 `<canvas id="map-canvas">` inside `#map-view`.
   - Configures High-DPI / Retina device pixel ratio (`window.devicePixelRatio`).
   - Subscribes to `viewport:changed` and triggers `requestAnimationFrame` render loop.
6. **Data Ingestion**:
   - Calls `await dataProvider.loadData('./data.json')`.
   - On completion, passes POI data and district vectors to `CanvasEngine`.
   - Calls `viewport.centerOnGeo(appData.center[0], appData.center[1], appData.zoom || 14)` to focus camera.

### 2.2 Event Synchronization Matrix

| Source Event | Payload | Handler Action in `app.js` | Downstream Effect |
|---|---|---|---|
| `viewport:changed` | `{ x, y, zoom, width, height, bounds }` | `canvasEngine.requestRender()` | Redraws background grid, districts, roads, parks, scale bar at 60fps |
| `place:selected` | `{ placeId, source }` | `viewport.centerOnGeo(place.lat, place.lng, 16)` + `showDetailDrawer(place)` | Camera pans smoothly to POI, card highlights, drawer opens |
| `filter:changed` | `{ categoryId, query }` | `dataProvider.filterPlaces(categoryId, query)` | Updates sidebar card list and updates visible POI rendering |
| `data:loaded` | `{ places, categories, metadata }` | Renders category filter pills & initial sidebar cards | UI elements populated |

### 2.3 Window Resize & High-DPI (Retina) Handling

When the browser window or viewport container resizes:
1. Obtain new container bounding rect: `const rect = mapContainer.getBoundingClientRect()`.
2. Update `Projection` canvas size: `projection.setCanvasSize(rect.width, rect.height)`.
3. Update `ViewportController` dimensions: `viewport.setDimensions(rect.width, rect.height)`.
4. Update `CanvasEngine` buffer dimensions with DPR scaling:
   ```javascript
   const dpr = window.devicePixelRatio || 1;
   canvas.width = rect.width * dpr;
   canvas.height = rect.height * dpr;
   canvas.style.width = `${rect.width}px`;
   canvas.style.height = `${rect.height}px`;
   ctx.scale(dpr, dpr);
   ```
5. Trigger immediate redraw loop.

---

## 3. Task 2: M1 Component Contract Audit & Zero-Regression Analysis

### 3.1 Inspection Summary of Core Files

| File | Status | Required Changes for M2 | M1 Contract Risks |
|---|---|---|---|
| `index.html` | Needs Update | Remove Leaflet CSS/JS links. Insert `<canvas id="map-canvas">` and zoom controls inside `#map-view`. Update script tag to type `module`. | **Low**: DOM element IDs (`#map-view`, `#search-input`, `#sidebar`, `#detail-drawer`, `.place-card`) must remain unchanged to preserve E2E test locator integrity. |
| `styles.css` | Needs Update | Add styles for `#map-canvas`, cursor states (`grab`, `grabbing`), and map overlay control buttons (`#zoom-in-btn`, `#zoom-out-btn`). | **None**: Additive CSS only. Existing glassmorphism theme and sidebar layouts remain unchanged. |
| `js/projection.js` | **UNCHANGED** | Zero modifications required. | **Zero**: API contract (`geoToWorld`, `worldToScreen`, `geoToScreen`, `screenToGeo`, `setBounds`, `setCanvasSize`) remains 100% intact. |
| `js/dataProvider.js` | **UNCHANGED** | Zero modifications required. | **Zero**: Data parsing and schema validation remain identical. |
| `js/eventBus.js` | **UNCHANGED** | Zero modifications required. | **Zero**: Pub/Sub interface (`on`, `off`, `once`, `emit`, `clear`) remains identical. |
| `app.js` | Overwrite / Move | Replace Leaflet `L.map` calls with `ViewportController` and `CanvasEngine` instantiation. | **Medium**: Functionality must preserve `window.selectPlace` callback if triggered by popups/cards, while adopting ES module imports. |

### 3.2 HTML Shell Contract Audit (`index.html`)

To prevent breaking existing E2E tests (`tests/test_tier1_features.py`), the following DOM elements must be preserved:

```html
<!-- REQUIRED DOM STRUCTURE FOR M2 -->
<main class="main-content">
  <!-- Container element MUST retain id="map-view" -->
  <div id="map-view">
    <!-- HTML5 2D Canvas for vector rendering -->
    <canvas id="map-canvas"></canvas>
    
    <!-- Map Control Buttons (Required for test locators #zoom-in-btn / #zoom-out-btn) -->
    <div class="map-controls">
      <button id="zoom-in-btn" class="map-control-btn" title="Zoom +">
        <i class="fa-solid fa-plus"></i>
      </button>
      <button id="zoom-out-btn" class="map-control-btn" title="Zoom -">
        <i class="fa-solid fa-minus"></i>
      </button>
      <button id="recenter-btn" class="map-control-btn" title="Recentrer">
        <i class="fa-solid fa-crosshairs"></i>
      </button>
    </div>
  </div>
  ...
</main>
```

---

## 4. Task 3: Unit & Automated Testing Strategy for M2

### 4.1 Viewport Math & State Testing (`tests/test_viewport.js`)

Unit tests for `ViewportController` must verify camera matrix transformations, focal point zoom, centering, and bounds clamping.

#### Test Cases:
1. **Initial State Verification**:
   - `getState()` returns initial camera position `{ x: 0, y: 0, zoom: 1, width: 800, height: 600 }`.
2. **Pan Offset Operations (`panBy`)**:
   - Calling `panBy(50, -30)` updates camera coordinates to `{ x: 50, y: -30 }`.
   - Sequential `panBy` calls accumulate delta offsets correctly.
3. **Focal Point Zoom Math (`zoomAt`)**:
   - Zooming at cursor coordinate $(s_x, s_y) = (400, 300)$ with factor $1.5$ increases zoom level to $1.5$.
   - Verifies that the world coordinate located under $(s_x, s_y)$ prior to zoom remains at $(s_x, s_y)$ after zoom (zero camera drift).
4. **Geographic Centering (`centerOnGeo`)**:
   - Calling `centerOnGeo(48.6865, 6.1504, 15)` calculates exact pan offsets to position Laxou center at $(\frac{width}{2}, \frac{height}{2})$.
   - `projection.geoToScreen(48.6865, 6.1504, viewport.getState())` returns $(400, 300)$ pixel coordinates.
5. **Bounding Box Fitting (`fitBounds`)**:
   - Given Laxou bounding box, `fitBounds(bounds)` calculates zoom and center pan offset fitting all coordinates within canvas dimensions with specified padding.
6. **Camera Bounds Clamping**:
   - Panning extreme distances (e.g. `panBy(100000, 100000)`) clamps pan offsets within maximum allowed geographic margin (`minLat`, `maxLat`, `minLng`, `maxLng`).
   - Zooming beyond $z_{\text{max}} = 10.0$ or below $z_{\text{min}} = 1.0$ clamps zoom level to limits.

### 4.2 Canvas Engine Rendering & State Testing (`tests/test_canvasEngine.js`)

To test `CanvasEngine` in Node.js / headless environments without a native GPU canvas:

#### Mocking Strategy:
- Use a lightweight mock for `HTMLCanvasElement` and `CanvasRenderingContext2D` or JSDOM canvas mock.
- Track call history for `ctx.beginPath()`, `ctx.moveTo()`, `ctx.lineTo()`, `ctx.stroke()`, `ctx.fill()`, `ctx.fillRect()`, `ctx.fillText()`.

#### Test Cases:
1. **High-DPI Scaling Setup**:
   - Mock `window.devicePixelRatio = 2.0`.
   - Assert `canvas.width` is set to `width * 2` and `canvas.height` is set to `height * 2`.
   - Assert `ctx.scale(2.0, 2.0)` is executed.
2. **Layer Render Execution**:
   - Assert `render()` executes drawing pipeline: background fill -> coordinate grid -> district polygons -> road vectors -> parks -> scale bar.
   - Assert grid lines call `ctx.stroke()` with grid style.
   - Assert district polygons (Champ-le-Bœuf, Laxou Village, Nancy Centre) draw closed paths and execute `ctx.fill()`.
3. **Dynamic Scale Bar Calculation**:
   - Verify metric scale calculation: at zoom level 14, screen bar length corresponds to metric scale (e.g., 500m bar = 120px).
   - Assert scale text (e.g., "500 m" or "1 km") is drawn via `ctx.fillText()`.
4. **Frame Synchronization**:
   - Verify `requestAnimationFrame` loop schedules redraws efficiently when viewport state changes.

### 4.3 Leaflet Dependency Removal Validation (`tests/test_leaflet_removal.js`)

Automated tests asserting complete removal of Leaflet.js from the application runtime:

#### Test Cases:
1. **HTML CDN Link Check**:
   - Assert `document.querySelector('link[href*="leaflet"]') === null`.
   - Assert `document.querySelector('script[src*="leaflet"]') === null`.
2. **Global Namespace Cleanliness**:
   - Assert `typeof window.L === 'undefined'`.
   - Assert `window._leafletStubbed` is not invoked in production build.
3. **DOM Class Assertions**:
   - Assert no `.leaflet-container`, `.leaflet-control`, or `.leaflet-tile` classes exist in the DOM shell.

### 4.4 Event Bus Emissions Testing (`tests/test_event_emissions.js`)

Unit tests verifying pub/sub notifications for camera and viewport changes:

#### Test Cases:
1. **`viewport:changed` Event Emission**:
   - Subscribe listener to `eventBus.on('viewport:changed', callback)`.
   - Execute `viewport.panBy(20, 10)`.
   - Assert callback fires with payload `{ x: 20, y: 10, zoom: 1, width: 800, height: 600, bounds: { ... } }`.
2. **Zoom Event Emission**:
   - Execute `viewport.zoomAt(400, 300, 1.2)`.
   - Assert callback fires with updated zoom level.
3. **Listener Unsubscribe Integrity**:
   - Unsubscribe listener and trigger gesture; verify callback is not executed again.

---

## 5. Handoff & Verification Specification

### 5.1 Observation

1. **Existing Code Base**:
   - `index.html`: Contains Leaflet CSS link (line 18) and Leaflet JS script tag (line 113).
   - `app.js`: Uses `L.map('map-view')` (line 64), `L.tileLayer` (line 72), `L.layerGroup` (line 77), and `L.marker` (line 181).
   - `js/projection.js`, `js/dataProvider.js`, `js/eventBus.js`: 100% modular, pure ES modules with 0 Leaflet dependencies.
   - `tests/test_milestone1.js`: Passes all 18 unit tests for M1 components.
   - `tests/test_tier1_features.py`: Uses Playwright to verify map view, sidebar, search, and category filters.

2. **Target M2 Components to Create**:
   - `js/viewport.js`: `ViewportController` class with drag, wheel, double click, zoom +/- button handlers, bounds clamping, and `viewport:changed` emissions.
   - `js/canvasEngine.js`: `CanvasEngine` class with HTML5 2D Canvas procedural background vector rendering, High-DPI scaling, and 60fps render loop.

### 5.2 Logic Chain

1. Removing Leaflet dependencies requires stripping `<link rel="stylesheet" href="...leaflet.css">` and `<script src="...leaflet.js">` from `index.html`.
2. Replacing Leaflet's map viewport and tile rendering requires initializing `ViewportController` to manage camera transforms $(x, y, z)$ and `CanvasEngine` to render vector layers on an HTML5 `<canvas>`.
3. To prevent breaking existing E2E tests, `#map-view` must remain the parent container, and `#zoom-in-btn` / `#zoom-out-btn` controls must be provided in HTML.
4. M1 components (`Projection`, `DataProvider`, `EventBus`) must be imported without modifying their source code, ensuring zero contract breaking.

### 5.3 Caveats

- **Canvas Performance**: Ensure `requestAnimationFrame` renders only when viewport changes or animations are active, avoiding continuous unneeded redraw loops when idle.
- **Touch & Gesture Handling**: Pointer events (`pointerdown`, `pointermove`, `pointerup`) cover both mouse drag and touch gestures on modern mobile browsers.

### 5.4 Conclusion

Milestone 2 implementation is ready to proceed. `js/viewport.js` and `js/canvasEngine.js` will integrate cleanly with M1 components via `js/app.js` without breaking any existing interface contracts or E2E test locators.

### 5.5 Verification Method

1. **Unit Test Suite**:
   ```bash
   node --test tests/test_milestone1.js
   node --test tests/test_milestone2.js
   ```
2. **Leaflet Purge Verification**:
   ```bash
   grep -rn "leaflet" index.html js/ app.js
   # Expected output: 0 matches
   ```
3. **E2E Test Suite**:
   ```bash
   python3 -m unittest tests/test_tier1_features.py
   ```
