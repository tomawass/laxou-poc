# Technical Architecture & Engine Design: Custom Interactive Map Engine (Laxou/Nancy)

**Author:** Explorer 3 (`explorer_survey_3`)  
**Date:** 2026-08-06  
**Project:** Laxou Map Explorer (Pure Vanilla JS Canvas/SVG Custom Map Engine)  
**Target Region:** Laxou / Grand Nancy, Meurthe-et-Moselle (Center ~ 48.6865° N, 6.1504° E)

---

## 1. Executive Summary & Scope Analysis

The project objective is to replace the current third-party Leaflet.js mapping dependency with a custom, high-performance, lightweight, pure Vanilla JS (HTML5 Canvas / CSS3 / ES6+) interactive map engine tailored specifically for the town of Laxou and its surrounding district in Greater Nancy.

### Core Architectural Goals:
1. **Zero External Map Library Dependencies:** Remove Leaflet (`L.map`, `leaflet.js`, `leaflet.css`) and CartoDB tile loading in favor of an in-house vector rendering canvas engine.
2. **Mathematical Projection:** Convert WGS84 geographic coordinates (`lat`, `lng`) into precise 2D canvas coordinates centered at Laxou ($\phi_0 = 48.6865^\circ, \lambda_0 = 6.1504^\circ$).
3. **Smooth Viewport Transformations:** Support 60fps pan/drag, wheel zoom, double-click zoom, touch pinch-to-zoom, and window resize using affine 2D transform matrices and `requestAnimationFrame`.
4. **Decoupled Component Architecture:** Modular ES6 classes for Engine, Projection, Viewport, Marker Management, Filtering/Search, Sidebar UI, and Accessibility.
5. **Full Keyboard & Screen Reader Accessibility (a11y):** Native HTML/SVG overlay markers supporting keyboard navigation (`Tab`, `Enter`, `Space`, `Arrow` keys), focus rings, ARIA roles, and announcements.
6. **Automated Testing Suite:** Robust test infrastructure combining unit tests (projection math, filtering) and headless browser E2E tests (Playwright).

---

## 2. Rendering Engine Architecture: Canvas vs. SVG vs. Hybrid Model

To evaluate the rendering strategy, three technical paradigms were compared:

| Criteria | HTML5 2D Canvas | Pure SVG Engine | Hybrid (Canvas Vector Base + HTML/SVG Overlay) |
| :--- | :--- | :--- | :--- |
| **Performance (Rendering)** | Excellent (single context draw, 60 FPS) | Good for ~500 nodes, degrades with complex geometries | **Optimal** (Canvas handles background paths, HTML handles interactive POIs) |
| **DOM Overhead** | Zero extra DOM nodes | 1 DOM node per path/circle/marker | Minimal (DOM nodes only for active markers & UI elements) |
| **Hit Testing / Interactivity** | Requires manual ray casting or coordinate math | Built-in native browser DOM event listeners | **Native HTML event listeners** for markers and tooltips |
| **Accessibility (a11y)** | Poor (Canvas pixels are opaque to screen readers) | Good (SVG elements accept ARIA attributes) | **Native HTML Accessibility** (`<button role="option" aria-label="...">`) |
| **Styling & CSS Animations** | Manual pixel manipulation | Native CSS properties & animations | **Native CSS animations** (pulse effects, hover states, selection rings) |

### 🏆 Recommendation: Hybrid Architecture
- **Canvas Base Layer (`<canvas id="map-canvas">`):** Renders geographic background features (Laxou boundary, district zones, park polygons, road networks, water bodies) efficiently using `CanvasRenderingContext2D`.
- **DOM / SVG Interactive Marker & Overlay Layer (`<div id="map-overlay">`):** Positions interactive marker cards/icons absolutely over the canvas container using screen pixel coordinates calculated by the Projection & Viewport modules.

---

## 3. Mathematical Projection Models for Laxou/Nancy

Laxou is located at latitude $\phi_0 \approx 48.6865^\circ \text{N}$ and longitude $\lambda_0 \approx 6.1504^\circ \text{E}$. Over local municipal scales (~5 km × 5 km span), earth curvature distortion is negligible ($< 0.01\%$).

### Model 1: Localized Equirectangular Projection with Cosine Latitude Correction (Recommended for Speed & Simplicity)
Equirectangular projection scales longitude by $\cos(\phi_0)$ to compensate for the convergence of meridians away from the equator.

#### Forward Transformation ($\text{Lat/Lng} \to \text{World Pixels}$):
$$x_{\text{world}} = R \cdot (\lambda - \lambda_0) \cdot \frac{\pi}{180} \cdot \cos(\phi_0) \cdot S$$
$$y_{\text{world}} = R \cdot (\phi_0 - \phi) \cdot \frac{\pi}{180} \cdot S$$

Where:
- $\phi_0 = 48.6865^\circ, \quad \lambda_0 = 6.1504^\circ$
- $\cos(48.6865^\circ) \approx 0.660172$
- $R$: Earth radius in meters ($\approx 6,371,000\text{ m}$)
- $S$: Base scale factor (pixels per meter or pixels per degree)

#### Inverse Transformation ($\text{World Pixels} \to \text{Lat/Lng}$):
$$\lambda = \lambda_0 + \frac{x_{\text{world}}}{R \cdot S \cdot \cos(\phi_0)} \cdot \frac{180}{\pi}$$
$$\phi = \phi_0 - \frac{y_{\text{world}}}{R \cdot S} \cdot \frac{180}{\pi}$$

### Model 2: Standard Web Mercator Projection (EPSG:3857) Centered Model
Standard Web Mercator mapping formulas for compatibility with standard GIS GeoJSON data:

$$X = \frac{\text{tileSize}}{2\pi} \cdot 2^{\text{zoom}} \cdot (\lambda_{\text{rad}} + \pi)$$
$$Y = \frac{\text{tileSize}}{2\pi} \cdot 2^{\text{zoom}} \cdot \left(\pi - \ln\left(\tan\left(\frac{\pi}{4} + \frac{\phi_{\text{rad}}}{2}\right)\right)\right)$$

### Projection Class Specification (`src/engine/Projection.js`)
```javascript
export class Projection {
  constructor(centerLat = 48.6865, centerLng = 6.1504, baseZoom = 14) {
    this.centerLat = centerLat;
    this.centerLng = centerLng;
    this.centerLatRad = centerLat * (Math.PI / 180);
    this.cosLat = Math.cos(this.centerLatRad);
    this.scale = 150000; // Base pixel scale for zoom level 14
  }

  latLngToWorld(lat, lng) {
    const dLng = (lng - this.centerLng) * (Math.PI / 180);
    const dLat = (lat - this.centerLat) * (Math.PI / 180);
    const x = dLng * this.cosLat * this.scale;
    const y = -dLat * this.scale; // Y grows downwards on screen
    return { x, y };
  }

  worldToLatLng(x, y) {
    const dLngRad = x / (this.cosLat * this.scale);
    const dLatRad = -y / this.scale;
    const lng = this.centerLng + dLngRad * (180 / Math.PI);
    const lat = this.centerLat + dLatRad * (180 / Math.PI);
    return { lat, lng };
  }
}
```

---

## 4. Component Architecture & Class Structure

The application will be restructured into clean, unbundled modular ES6 modules (`type="module"`):

```
laxou-map-app/
├── index.html
├── styles.css
├── data.json
└── js/
    ├── main.js
    ├── core/
    │   ├── EventBus.js
    │   ├── Projection.js
    │   └── ViewportController.js
    ├── engine/
    │   ├── CanvasMapEngine.js
    │   └── VectorBackgroundRenderer.js
    ├── markers/
    │   └── MarkerManager.js
    ├── data/
    │   └── DataProvider.js
    ├── services/
    │   └── FilterSearchEngine.js
    ├── ui/
    │   ├── SidebarController.js
    │   └── DetailDrawer.js
    └── accessibility/
        └── AccessibilityManager.js
```

### Component Responsibilities & Communication Flow

```
                         ┌─────────────────────┐
                         │    DataProvider     │
                         └──────────┬──────────┘
                                    │ (emits data:loaded)
                                    ▼
┌──────────────────────┐  ┌────────────────────┐  ┌───────────────────────┐
│ FilterSearchEngine   │◄─┤      EventBus      ├─►│   MarkerManager       │
└──────────┬───────────┘  └─────────▲──────────┘  └───────────┬───────────┘
           │ (emits                 │                         │ (renders DOM
           │  filter:changed)       │ (emits map:transform)   │  overlay markers)
           ▼                        │                         ▼
┌──────────────────────┐  ┌─────────┴──────────┐  ┌───────────────────────┐
│  SidebarController   │  │ ViewportController │  │   CanvasMapEngine     │
└──────────────────────┘  └────────────────────┘  └───────────────────────┘
```

1. **`EventBus.js`**: Publish/Subscribe event system decoupling core components (`on(event, handler)`, `emit(event, data)`).
2. **`DataProvider.js`**: Asynchronously fetches `data.json`, validates schema, normalizes entries, calculates bounding boxes.
3. **`Projection.js`**: Handles Lat/Lng to World Pixel coordinate transformations.
4. **`ViewportController.js`**: Manages view state (`scale`, `panX`, `panY`), handles input gestures (`pointerdown`, `pointermove`, `pointerup`, `wheel`, keyboard arrows), calculates affine screen transforms, and manages kinetic damping.
5. **`CanvasMapEngine.js`**: Manages canvas resolution (`devicePixelRatio`), context configuration, render loop timing via `requestAnimationFrame`, and drawing local vector features (Laxou grid, boundaries, labels).
6. **`MarkerManager.js`**: Instantiates interactive marker elements in the overlay container. Updates marker `style.transform` based on screen coordinates:
   $$x_{\text{screen}} = (x_{\text{world}} \cdot \text{scale}) + \text{panX} + \frac{W}{2}$$
   $$y_{\text{screen}} = (y_{\text{world}} \cdot \text{scale}) + \text{panY} + \frac{H}{2}$$
7. **`FilterSearchEngine.js`**: Handles reactive full-text search (name, address, description, tags) and multi-category filtering, updating active result indices.
8. **`SidebarController.js` & `DetailDrawer.js`**: Renders places list, updates badges, syncs selection state between card list and map markers, controls drawer modal lifecycle.
9. **`AccessibilityManager.js`**: Implements `aria-live` status regions, keyboard shortcuts (`Escape`, `Arrow` keys), focus traps in detail drawers, and visible focus management.

---

## 5. Interactive Viewport Controller & Gestures Design

The `ViewportController` manages user interactions without external dependencies:

### Input Event Handlers:
- **Pan / Drag:** Unified `PointerEvents` (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) with `setPointerCapture` to support mouse drag and touch swipe seamlessly.
- **Zoom at Anchor Point (Mouse Wheel & Pinch):**
  When zooming around cursor $(mx, my)$:
  $$\text{scale}_{\text{new}} = \text{clamp}(\text{scale}_{\text{old}} \cdot \Delta_{\text{zoom}}, \text{minScale}, \text{maxScale})$$
  $$\text{panX}_{\text{new}} = mx - (mx - \text{panX}_{\text{old}}) \cdot \frac{\text{scale}_{\text{new}}}{\text{scale}_{\text{old}}}$$
  $$\text{panY}_{\text{new}} = my - (my - \text{panY}_{\text{old}}) \cdot \frac{\text{scale}_{\text{new}}}{\text{scale}_{\text{old}}}$$
- **Keyboard Pan & Zoom:**
  - `ArrowLeft` / `ArrowRight` / `ArrowUp` / `ArrowDown`: Pan map by 50px increments.
  - `+` / `-` / `=` / `_`: Zoom in / zoom out centered on viewport center.
  - `Home` / `Escape`: Reset map view to default center and zoom.

---

## 6. Accessibility (a11y) Strategy

To meet Requirement R5 and acceptance criteria:
1. **Interactive HTML Overlay Markers:**
   Each marker is rendered as a `<button>` with:
   - `tabindex="0"`
   - `role="button"`
   - `aria-label="[Place Name], [Category]"`
   - `aria-expanded="true/false"` when selected.
2. **Keyboard Navigation Flow:**
   - Logical tab ordering through header search $\to$ category filter chips $\to$ map marker overlay $\to$ sidebar cards.
   - `Enter` / `Space` on a marker or list item opens detail drawer.
   - `Escape` key closes detail drawer or resets selection.
3. **Screen Reader Live Regions:**
   - `<div class="sr-only" aria-live="polite" id="a11y-announcer"></div>` announces result counts when filters change (e.g., *"6 lieux trouvés dans la catégorie Parcs & Nature"*).
4. **Focus Rings:**
   - High-contrast CSS focus ring (`outline: 3px solid var(--accent-primary); outline-offset: 2px;`) visible on all focused markers and UI controls.

---

## 7. Recommended Testing Infrastructure

To ensure code quality and regression prevention:

### 1. Unit Testing Setup (Vitest + JSDOM)
- **Framework:** **Vitest** (fast ES module unit test runner) with `jsdom` or `happy-dom`.
- **Test Scopes:**
  - `Projection.test.js`: Verify Lat/Lng $\leftrightarrow$ World Pixel round-trip conversion accuracy within 0.0001 degrees.
  - `FilterSearchEngine.test.js`: Test text matching, tag filtering, case-insensitivity, and empty state returns.
  - `DataProvider.test.js`: Test JSON parsing, schema validation, and missing field handling.

### 2. End-to-End & Visual Testing (Playwright)
- **Framework:** **Playwright** (`@playwright/test`).
- **Test Scopes:**
  - **Pan & Zoom Verification:** Drag canvas element and assert viewport matrix shift.
  - **Marker Click & Drawer Open:** Click marker node, verify detail drawer transitions to visible and displays matching title.
  - **Search Synchronization:** Type query in search bar, verify marker count and sidebar list items update simultaneously.
  - **Keyboard Navigation Audit:** Press `Tab` key repeatedly, verify active element focus state, open drawer via `Enter`, close via `Escape`.
  - **Accessibility Audit:** Run `@axe-core/playwright` accessibility check against the app page.

### Sample Package Configuration (`package.json`)
```json
{
  "name": "laxou-map-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "vitest": "^1.2.0",
    "jsdom": "^24.0.0",
    "@playwright/test": "^1.41.0",
    "@axe-core/playwright": "^4.8.0"
  }
}
```

---

## 8. Summary of Migration Steps

1. **Remove Leaflet Dependencies:** Remove Leaflet CSS and JS `<script>` tags from `index.html`.
2. **Setup Canvas & Overlay Container:** Replace `<div id="map-view"></div>` with `<div id="map-container"><canvas id="map-canvas"></canvas><div id="map-overlay"></div></div>`.
3. **Modularize Codebase:** Split single `app.js` file into ES6 modules in `js/`.
4. **Implement Core Math & Engine:** Write `Projection.js`, `ViewportController.js`, and `CanvasMapEngine.js`.
5. **Implement Overlay Markers & UI:** Write `MarkerManager.js` and update `SidebarController.js`.
6. **Implement Test Suite:** Add unit tests for projection/filtering and Playwright scripts for keyboard a11y and interactive panning.
