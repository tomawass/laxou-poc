# Technical Analysis: HTML5 2D Canvas Vector Map Engine (`js/canvasEngine.js`)
**Agent**: Explorer 2 (Milestone 2)  
**Target File**: `js/canvasEngine.js`  
**Workspace Root**: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app`  
**Date**: 2026-08-06  

---

## Executive Summary

This report establishes the complete design, code architecture, drawing algorithms, styling rules, mathematical formulations, and integration patterns for `CanvasEngine` (`js/canvasEngine.js`). `CanvasEngine` is a pure HTML5 2D Canvas vector rendering engine built without external libraries (no Leaflet, Mapbox, or OpenLayers), designed to render a 60fps vector map background of Laxou and Nancy (Meurthe-et-Moselle, France).

---

## 1. Architectural Overview & Design Requirements

`CanvasEngine` acts as the procedural graphics pipeline of the hybrid map architecture. It receives camera state from `ViewportController` and coordinate transformations from `Projection`, and draws vector layers directly onto an HTML5 `<canvas>` element.

```
+------------------------+      viewport:changed       +--------------------------+
|  ViewportController    | --------------------------> |       CanvasEngine       |
|  (Camera pan/zoom state)|                            |  (2D Canvas Vector Loop) |
+------------------------+                             +--------------------------+
            |                                                        |
            v                                                        v
+------------------------+                             +--------------------------+
|       Projection       | <-------------------------- |    Canvas Context 2D     |
| (Geo <-> Screen Math)  |  geoToScreen(lat, lng, vp)  | (60fps procedural render)|
+------------------------+                             +--------------------------+
```

### Key Functional Requirements
1. **Zero External GIS Dependencies**: 100% native HTML5 Canvas 2D API (`CanvasRenderingContext2D`).
2. **High-DPI / Retina DPR Auto-scaling**: Dynamic pixel ratio scaling matching `window.devicePixelRatio`.
3. **60fps `requestAnimationFrame` Render Loop**: On-demand dirty-flag scheduled rendering to eliminate redundant GPU work while guaranteeing 60fps during pan/zoom gestures.
4. **Procedural Vector Layers**:
   - Geographical Coordinate Grid (latitude/longitude lines with labels).
   - District Polygons (Champ-le-Bœuf, Laxou Village, Laxou Sapinière/Provinces, Nancy Centre).
   - Green Parks & Woodland Areas (Parc Champ-de-Boufflers, Parc Urbain des Provinces, Parc Pépinière, Parc Sainte-Marie, Forêt de Haye).
   - Rivers & Waterways (La Meurthe river & Canal de la Marne au Rhin).
   - Vector Road Network (Highways A31, Primary Arteries, Local Streets).
   - Dynamic Metric Scale Bar & Compass (dynamic meter-per-pixel math at current latitude and zoom).
5. **Theme Support**: Seamless Dark Mode (`#0f172a` bg) and Light Mode (`#f1f5f9` bg) color schemes.

---

## 2. High-DPI (Retina) DPR Auto-Scaling & Canvas Resizing

### The DPR Problem
On High-DPI displays (Apple Retina, 4K displays), `window.devicePixelRatio` (DPR) is typically $2.0$ or $3.0$. If a `<canvas>` element with CSS dimensions $800 \times 600$ is rendered with a physical bitmap size of $800 \times 600$, the browser upscales the bitmap by $2\times$, resulting in blurry lines and fuzzy text.

### The Solution Algorithm
To maintain sharp pixel-perfect graphics:
1. Measure the container/CSS element bounds (`clientWidth`, `clientHeight` or `getBoundingClientRect()`).
2. Fetch `dpr = window.devicePixelRatio || 1`.
3. Set canvas physical buffer dimensions:
   $$\text{canvas.width} = \lfloor \text{cssWidth} \times \text{dpr} \rfloor$$
   $$\text{canvas.height} = \lfloor \text{cssHeight} \times \text{dpr} \rfloor$$
4. Set canvas CSS style dimensions:
   $$\text{canvas.style.width} = \text{cssWidth} + \text{"px"}$$
   $$\text{canvas.style.height} = \text{cssHeight} + \text{"px"}$$
5. Apply context scaling once at the beginning of each render frame:
   `ctx.scale(dpr, dpr)`
6. Update `Projection.setCanvasSize(cssWidth, cssHeight)` with logical CSS pixel dimensions so that `Projection` coordinate math aligns 1:1 with CSS pixel space and DOM marker overlay positions.

```javascript
resize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = this.canvas.getBoundingClientRect();
  const cssWidth = Math.floor(rect.width) || this.canvas.clientWidth || 800;
  const cssHeight = Math.floor(rect.height) || this.canvas.clientHeight || 600;

  this.dpr = dpr;
  this.cssWidth = cssWidth;
  this.cssHeight = cssHeight;

  this.canvas.width = Math.floor(cssWidth * dpr);
  this.canvas.height = Math.floor(cssHeight * dpr);
  this.canvas.style.width = `${cssWidth}px`;
  this.canvas.style.height = `${cssHeight}px`;

  this.projection.setCanvasSize(cssWidth, cssHeight);
  this.requestRedraw();
}
```

---

## 3. Render Loop Architecture (60fps Dirty-Flag Scheduler)

To avoid running an unthrottled continuous loop when the map is idle, `CanvasEngine` uses a **dirty-flag pattern** with `requestAnimationFrame`.

```javascript
requestRedraw() {
  if (!this.needsRedraw) {
    this.needsRedraw = true;
    this.rafId = requestAnimationFrame(() => this.render());
  }
}

render() {
  this.needsRedraw = false;
  this.rafId = null;

  const viewport = this.viewportController.getState();
  const ctx = this.ctx;

  ctx.save();
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  ctx.scale(this.dpr, this.dpr);

  // Layered drawing execution
  this.drawBackground(viewport);
  this.drawGrid(viewport);
  this.drawDistricts(viewport);
  this.drawParks(viewport);
  this.drawWaterways(viewport);
  this.drawRoads(viewport);
  this.drawScaleBar(viewport);

  ctx.restore();
}
```

---

## 4. Layered Vector Rendering Pipeline & Styling Rules

To ensure correct visual depth and contrast, layers are drawn in strict z-index order:

| Layer # | Layer Name | Dark Mode Style | Light Mode Style | Description |
|---|---|---|---|---|
| **1** | Canvas Background | `#0f172a` (Slate 900) | `#f1f5f9` (Slate 100) | Solid canvas base fill |
| **2** | Geo Coordinate Grid | `rgba(255, 255, 255, 0.07)` | `rgba(0, 0, 0, 0.07)` | Dashed grid lines (`[4, 4]`) & lat/lng text |
| **3** | District Polygons | Multi-color `rgba(..., 0.12)` | Multi-color `rgba(..., 0.15)` | District fills & dashed boundary outlines |
| **4** | Parks & Woodland | `rgba(16, 185, 129, 0.18)` | `rgba(34, 197, 94, 0.25)` | Natural green polygon areas |
| **5** | Rivers & Waterways | `#0284c7` (Sky 600, `4px * zoom`) | `#0284c7` (Sky 600, `4px * zoom`) | Meurthe river & canal polylines |
| **6a** | Local Streets | `rgba(255, 255, 255, 0.15)` | `rgba(0, 0, 0, 0.15)` | Secondary road network (drawn if zoom >= 1.2) |
| **6b** | Primary Arteries / Highways | `#38bdf8` / `#f59e0b` (`3px * zoom^0.5`) | `#0284c7` / `#d97706` (`3px * zoom^0.5`) | Major roads (A31, Av. de Boufflers, Av. Europe) |
| **7** | Dynamic Scale Bar & Compass | `#f8fafc` text & bar | `#0f172a` text & bar | Metric scale bar overlay on bottom-left |

---

## 5. Vector Drawing Algorithms & Geometries

### A. Geographical Grid Lines Algorithm
1. Derive visible geographic bounds from viewport screen corners:
   - `topLeftGeo = projection.screenToGeo(0, 0, viewport)`
   - `bottomRightGeo = projection.screenToGeo(cssWidth, cssHeight, viewport)`
2. Determine grid step $\Delta_{\text{grid}}$ based on zoom level $z$:
   - If $z < 2.0 \implies \Delta_{\text{grid}} = 0.01^\circ$ (~1.1 km)
   - If $2.0 \le z < 5.0 \implies \Delta_{\text{grid}} = 0.005^\circ$ (~550 m)
   - If $z \ge 5.0 \implies \Delta_{\text{grid}} = 0.002^\circ$ (~220 m)
3. Iterate grid steps across visible lat/lng range:
   - For longitude lines: project `(minLat, lng)` to `(maxLat, lng)` onto screen.
   - For latitude lines: project `(lat, minLng)` to `(lat, maxLng)` onto screen.
   - Render lines with `ctx.setLineDash([4, 4])` and append coordinate text (e.g. `48.69° N`, `6.15° E`).

### B. District Boundary Polygons
The engine renders 4 primary administrative / urban sectors of Laxou & Nancy:
1. **Champ-le-Bœuf** (NPRNU sector): North-West Laxou / Maxéville area `[48.693..48.702, 6.135..6.148]`.
2. **Laxou Village / Centre** (Historic municipal center): `[48.682..48.692, 6.142..6.156]`.
3. **Laxou Sapinière / Provinces** (NPRNU sector): South-West Laxou `[48.675..48.684, 6.140..6.160]`.
4. **Nancy Centre** (Metropolitan heart around Place Stanislas & Parc Pépinière): `[48.685..48.700, 6.165..6.195]`.

*Drawing Algorithm*:
- Convert geographic vertex array `[{lat, lng}, ...]` to screen points via `projection.geoToScreen(lat, lng, viewport)`.
- Use `ctx.beginPath()`, `ctx.moveTo()`, `ctx.lineTo()`, `ctx.closePath()`.
- Apply semi-transparent fill (`ctx.fillStyle`) and dashed boundary stroke (`ctx.strokeStyle`, `ctx.setLineDash([6, 3])`).
- Draw district title label centered at polygon centroid when $z \ge 1.5$.

### C. Green Parks & Natural Areas
Renders green polygon spaces:
- **Parc du Champ-de-Boufflers** (`48.6845, 6.1480`)
- **Parc Urbain des Provinces** (`48.6830, 6.1565`)
- **Parc de la Pépinière Nancy** (`48.6972, 6.1845`)
- **Parc Sainte-Marie Nancy** (`48.6810, 6.1720`)
- **Forêt de Haye** (Western woodland boundary `[48.675..48.698, 6.120..6.138]`).

*Drawing Algorithm*:
- Polygons with smooth curved vertices or polylines.
- Fill style: `rgba(16, 185, 129, 0.20)` (Dark) / `rgba(34, 197, 94, 0.25)` (Light).
- Stroke style: soft green border `rgba(16, 185, 129, 0.4)`.

### D. Rivers & Waterways
Renders key hydrographic features:
- **La Meurthe River**: Flowing NW-SE through East Nancy `[(48.705, 6.195), (48.698, 6.192), (48.690, 6.190), (48.680, 6.195)]`.
- **Canal de la Marne au Rhin**: Parallel waterway artery `[(48.704, 6.190), (48.696, 6.187), (48.688, 6.185)]`.

*Drawing Algorithm*:
- `ctx.beginPath()`, `ctx.moveTo()`, quadratic/bezier curved segment `ctx.quadraticCurveTo()`.
- Stroke width: $\max(2, 4 \times z^{0.5})$ pixels.
- Water fill color: Cyan/Blue `#0284c7`.

### E. Vector Road Network
Renders major arteries and local street mesh:
- **Highways & Main Arteries**:
  - **Autoroute A31**: Western bypass polyline.
  - **Avenue de Boufflers & Avenue de l'Europe**: Main Laxou east-west arteries.
  - **Boulevard de Scarpone & Rue Jeanne d'Arc**: Laxou-Nancy connectors.
- **Local Streets Mesh**:
  - Grid of secondary local streets connecting Champ-le-Bœuf, Laxou Village, and Nancy.
  - Drawn only when $z \ge 1.2$ for optimal performance.

### F. Dynamic Metric Scale Bar & Compass Math
The metric scale bar dynamically computes meters per pixel based on the current camera latitude $\phi$ and zoom level $z$.

#### Mathematical Formulation
1. Geographic distance of $1^\circ$ longitude at center latitude $\phi_0 = 48.6865^\circ$:
   $$M_{\text{lng}} = 111320 \times \cos(\phi_0) \approx 73,490.5 \text{ meters/degree}$$
2. In `Projection`, a full world span $\text{dLng} = \text{maxLng} - \text{minLng}$ maps to $\text{baseWidth} \times z$ CSS pixels at zoom $z$.
   Therefore, degrees per pixel:
   $$\text{degPerPx} = \frac{\text{dLng}}{\text{baseWidth} \times z}$$
3. Meters per pixel:
   $$\text{metersPerPx} = \text{degPerPx} \times 111320 \times \cos(\phi_0)$$
4. Target bar width in CSS pixels $W_{\text{target}} \approx 120 \text{ px}$.
   Raw target meters: $M_{\text{raw}} = W_{\text{target}} \times \text{metersPerPx}$.
5. Round $M_{\text{raw}}$ to the nearest nice metric step in $[50, 100, 200, 500, 1000, 2000, 5000, 10000]$ meters:
   - For example, if $M_{\text{raw}} = 380\text{m} \implies M_{\text{nice}} = 500\text{m}$.
6. Calculate exact bar pixel width:
   $$W_{\text{bar}} = \frac{M_{\text{nice}}}{\text{metersPerPx}}$$
7. Render scale bar on bottom-left canvas overlay:
   - Draw horizontal bar with vertical end ticks (`|-------|`).
   - Render label text: `${M_nice >= 1000 ? (M_nice / 1000) + ' km' : M_nice + ' m'}`.

---

## 6. Full Code Implementation Skeleton (`js/canvasEngine.js`)

Below is the complete ES6 implementation structure for `js/canvasEngine.js`:

```javascript
/**
 * CanvasEngine - Pure HTML5 2D Canvas Vector Map Rendering Engine
 * Renders procedural vector background layers for Laxou & Nancy at 60fps.
 */
export class CanvasEngine {
  /**
   * @param {HTMLCanvasElement} canvas - HTML5 Canvas DOM Element
   * @param {Object} projection - Instance of Projection class
   * @param {Object} viewportController - Instance of ViewportController class
   * @param {Object} [eventBus] - Instance of EventBus class
   */
  constructor(canvas, projection, viewportController, eventBus = null) {
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('CanvasEngine requires a valid HTMLCanvasElement instance.');
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.projection = projection;
    this.viewportController = viewportController;
    this.eventBus = eventBus;
    this.isDarkMode = true;

    this.dpr = 1;
    this.cssWidth = 800;
    this.cssHeight = 600;
    this.needsRedraw = false;
    this.rafId = null;

    this._initVectorGeometry();
    this.init();
  }

  /**
   * Initialize engine, binding resize and event listeners.
   */
  init() {
    this.resize();
    this.setupListeners();
    this.requestRedraw();
  }

  /**
   * Auto-scale canvas for High-DPI / Retina displays and update Projection size.
   */
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = Math.floor(rect.width) || this.canvas.clientWidth || 800;
    const cssHeight = Math.floor(rect.height) || this.canvas.clientHeight || 600;

    this.dpr = dpr;
    this.cssWidth = cssWidth;
    this.cssHeight = cssHeight;

    this.canvas.width = Math.floor(cssWidth * dpr);
    this.canvas.height = Math.floor(cssHeight * dpr);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

    if (this.projection && typeof this.projection.setCanvasSize === 'function') {
      this.projection.setCanvasSize(cssWidth, cssHeight);
    }
    this.requestRedraw();
  }

  /**
   * Setup EventBus and window resize listeners.
   */
  setupListeners() {
    window.addEventListener('resize', () => this.resize());

    if (this.eventBus) {
      this.eventBus.on('viewport:changed', () => this.requestRedraw());
      this.eventBus.on('theme:changed', (e) => {
        this.setDarkMode(e?.isDark ?? true);
      });
    }
  }

  /**
   * Set theme mode (Dark / Light).
   * @param {boolean} isDark 
   */
  setDarkMode(isDark) {
    this.isDarkMode = Boolean(isDark);
    this.requestRedraw();
  }

  /**
   * Schedule a redraw frame via requestAnimationFrame (dirty-flag).
   */
  requestRedraw() {
    if (!this.needsRedraw) {
      this.needsRedraw = true;
      this.rafId = requestAnimationFrame(() => this.render());
    }
  }

  /**
   * Core 60fps procedural render frame.
   */
  render() {
    this.needsRedraw = false;
    this.rafId = null;

    const viewport = this.viewportController ? this.viewportController.getState() : { x: 0, y: 0, zoom: 1, width: this.cssWidth, height: this.cssHeight };
    const ctx = this.ctx;

    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.scale(this.dpr, this.dpr);

    // Render Layer Stack
    this.drawBackground(viewport);
    this.drawGrid(viewport);
    this.drawDistricts(viewport);
    this.drawParks(viewport);
    this.drawWaterways(viewport);
    this.drawRoads(viewport);
    this.drawScaleBar(viewport);

    ctx.restore();
  }

  // --- LAYER DRAWING IMPLEMENTATIONS ---

  drawBackground(viewport) {
    this.ctx.fillStyle = this.isDarkMode ? '#0f172a' : '#f1f5f9';
    this.ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
  }

  drawGrid(viewport) {
    const { ctx, projection } = this;
    const zoom = viewport.zoom || 1;
    const gridStep = zoom < 2.0 ? 0.01 : (zoom < 5.0 ? 0.005 : 0.002);

    const bounds = projection.getBounds();
    ctx.save();
    ctx.strokeStyle = this.isDarkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)';
    ctx.fillStyle = this.isDarkMode ? '#64748b' : '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.setLineDash([4, 4]);

    for (let lng = Math.ceil(bounds.minLng / gridStep) * gridStep; lng <= bounds.maxLng; lng += gridStep) {
      const p1 = projection.geoToScreen(bounds.minLat, lng, viewport);
      const p2 = projection.geoToScreen(bounds.maxLat, lng, viewport);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      if (p1.y >= 0 && p1.y <= this.cssHeight) {
        ctx.fillText(`${lng.toFixed(3)}°E`, p1.x + 4, this.cssHeight - 8);
      }
    }

    for (let lat = Math.ceil(bounds.minLat / gridStep) * gridStep; lat <= bounds.maxLat; lat += gridStep) {
      const p1 = projection.geoToScreen(lat, bounds.minLng, viewport);
      const p2 = projection.geoToScreen(lat, bounds.maxLng, viewport);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      if (p1.x >= 0 && p1.x <= this.cssWidth) {
        ctx.fillText(`${lat.toFixed(3)}°N`, 8, p1.y - 4);
      }
    }
    ctx.restore();
  }

  drawDistricts(viewport) {
    const { ctx, projection } = this;
    const zoom = viewport.zoom || 1;

    for (const district of this.districts) {
      if (!district.polygon || district.polygon.length === 0) continue;

      ctx.save();
      ctx.beginPath();
      const first = projection.geoToScreen(district.polygon[0].lat, district.polygon[0].lng, viewport);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < district.polygon.length; i++) {
        const pt = projection.geoToScreen(district.polygon[i].lat, district.polygon[i].lng, viewport);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      ctx.fillStyle = district.color[this.isDarkMode ? 'dark' : 'light'];
      ctx.fill();

      ctx.strokeStyle = district.stroke[this.isDarkMode ? 'dark' : 'light'];
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.stroke();

      // Centroid Label
      if (zoom >= 1.3 && district.center) {
        const centerPt = projection.geoToScreen(district.center.lat, district.center.lng, viewport);
        ctx.fillStyle = this.isDarkMode ? '#f8fafc' : '#0f172a';
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(district.name, centerPt.x, centerPt.y);
      }
      ctx.restore();
    }
  }

  drawParks(viewport) {
    const { ctx, projection } = this;
    for (const park of this.parks) {
      if (!park.polygon || park.polygon.length === 0) continue;
      ctx.save();
      ctx.beginPath();
      const first = projection.geoToScreen(park.polygon[0].lat, park.polygon[0].lng, viewport);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < park.polygon.length; i++) {
        const pt = projection.geoToScreen(park.polygon[i].lat, park.polygon[i].lng, viewport);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      ctx.fillStyle = this.isDarkMode ? 'rgba(16, 185, 129, 0.20)' : 'rgba(34, 197, 94, 0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawWaterways(viewport) {
    const { ctx, projection } = this;
    const zoom = viewport.zoom || 1;
    for (const water of this.waterways) {
      if (!water.path || water.path.length === 0) continue;
      ctx.save();
      ctx.beginPath();
      const first = projection.geoToScreen(water.path[0].lat, water.path[0].lng, viewport);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < water.path.length; i++) {
        const pt = projection.geoToScreen(water.path[i].lat, water.path[i].lng, viewport);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = Math.max(2, (water.width || 4) * Math.sqrt(zoom));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  drawRoads(viewport) {
    const { ctx, projection } = this;
    const zoom = viewport.zoom || 1;

    for (const road of this.roads) {
      if (road.type === 'local' && zoom < 1.2) continue; // LOD Culling

      ctx.save();
      ctx.beginPath();
      const first = projection.geoToScreen(road.path[0].lat, road.path[0].lng, viewport);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < road.path.length; i++) {
        const pt = projection.geoToScreen(road.path[i].lat, road.path[i].lng, viewport);
        ctx.lineTo(pt.x, pt.y);
      }

      if (road.type === 'highway') {
        ctx.strokeStyle = this.isDarkMode ? '#f59e0b' : '#d97706';
        ctx.lineWidth = Math.max(3, 4 * Math.sqrt(zoom));
      } else if (road.type === 'primary') {
        ctx.strokeStyle = this.isDarkMode ? '#38bdf8' : '#0284c7';
        ctx.lineWidth = Math.max(2, 3 * Math.sqrt(zoom));
      } else {
        ctx.strokeStyle = this.isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = Math.max(1, 1.5 * Math.sqrt(zoom));
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  drawScaleBar(viewport) {
    const { ctx, projection } = this;
    const zoom = viewport.zoom || 1;
    const centerLat = projection.getCenter().lat;
    const bounds = projection.getBounds();

    // 1. Calculate meters per pixel
    const centerCos = Math.cos((centerLat * Math.PI) / 180);
    const degPerPx = bounds.dLng / (projection.baseWidth * zoom);
    const metersPerPx = degPerPx * 111320 * centerCos;

    // 2. Select target metric distance
    const targetPxWidth = 120;
    const rawMeters = targetPxWidth * metersPerPx;

    const steps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
    let chosenMeters = steps[0];
    for (const step of steps) {
      if (rawMeters >= step) chosenMeters = step;
      else break;
    }

    const actualBarPx = chosenMeters / metersPerPx;

    // 3. Render Bar on Canvas Bottom-Left
    const x = 20;
    const y = this.cssHeight - 20;
    const barHeight = 6;

    ctx.save();
    ctx.strokeStyle = this.isDarkMode ? '#f8fafc' : '#0f172a';
    ctx.fillStyle = this.isDarkMode ? '#f8fafc' : '#0f172a';
    ctx.lineWidth = 2;

    // Main Bar line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + actualBarPx, y);
    // End Ticks
    ctx.moveTo(x, y - barHeight);
    ctx.lineTo(x, y + 2);
    ctx.moveTo(x + actualBarPx, y - barHeight);
    ctx.lineTo(x + actualBarPx, y + 2);
    ctx.stroke();

    // Label Text
    const label = chosenMeters >= 1000 ? `${chosenMeters / 1000} km` : `${chosenMeters} m`;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + actualBarPx + 8, y + 3);
    ctx.restore();
  }

  /**
   * Internal procedural vector geometry datasets for Laxou & Nancy.
   * @private
   */
  _initVectorGeometry() {
    // 1. District Boundaries
    this.districts = [
      {
        id: 'champ-le-boeuf',
        name: 'Champ-le-Bœuf (NPRNU)',
        center: { lat: 48.6970, lng: 6.1430 },
        color: { dark: 'rgba(16, 185, 129, 0.12)', light: 'rgba(16, 185, 129, 0.15)' },
        stroke: { dark: 'rgba(16, 185, 129, 0.5)', light: 'rgba(16, 185, 129, 0.6)' },
        polygon: [
          { lat: 48.7020, lng: 6.1350 },
          { lat: 48.7020, lng: 6.1480 },
          { lat: 48.6930, lng: 6.1480 },
          { lat: 48.6930, lng: 6.1350 }
        ]
      },
      {
        id: 'laxou-village',
        name: 'Laxou Village',
        center: { lat: 48.6870, lng: 6.1490 },
        color: { dark: 'rgba(99, 102, 241, 0.12)', light: 'rgba(99, 102, 241, 0.15)' },
        stroke: { dark: 'rgba(99, 102, 241, 0.5)', light: 'rgba(99, 102, 241, 0.6)' },
        polygon: [
          { lat: 48.6920, lng: 6.1420 },
          { lat: 48.6920, lng: 6.1560 },
          { lat: 48.6820, lng: 6.1560 },
          { lat: 48.6820, lng: 6.1420 }
        ]
      },
      {
        id: 'laxou-provinces',
        name: 'Laxou Sapinière & Provinces (NPRNU)',
        center: { lat: 48.6795, lng: 6.1500 },
        color: { dark: 'rgba(236, 72, 153, 0.12)', light: 'rgba(236, 72, 153, 0.15)' },
        stroke: { dark: 'rgba(236, 72, 153, 0.5)', light: 'rgba(236, 72, 153, 0.6)' },
        polygon: [
          { lat: 48.6840, lng: 6.1400 },
          { lat: 48.6840, lng: 6.1600 },
          { lat: 48.6750, lng: 6.1600 },
          { lat: 48.6750, lng: 6.1400 }
        ]
      },
      {
        id: 'nancy-centre',
        name: 'Nancy Centre',
        center: { lat: 48.6925, lng: 6.1800 },
        color: { dark: 'rgba(245, 158, 11, 0.08)', light: 'rgba(245, 158, 11, 0.12)' },
        stroke: { dark: 'rgba(245, 158, 11, 0.4)', light: 'rgba(245, 158, 11, 0.5)' },
        polygon: [
          { lat: 48.7000, lng: 6.1650 },
          { lat: 48.7000, lng: 6.1950 },
          { lat: 48.6850, lng: 6.1950 },
          { lat: 48.6850, lng: 6.1650 }
        ]
      }
    ];

    // 2. Parks & Woodland
    this.parks = [
      {
        id: 'champ-de-boufflers',
        polygon: [
          { lat: 48.6860, lng: 6.1460 },
          { lat: 48.6860, lng: 6.1500 },
          { lat: 48.6830, lng: 6.1500 },
          { lat: 48.6830, lng: 6.1460 }
        ]
      },
      {
        id: 'parc-provinces',
        polygon: [
          { lat: 48.6840, lng: 6.1540 },
          { lat: 48.6840, lng: 6.1590 },
          { lat: 48.6815, lng: 6.1590 },
          { lat: 48.6815, lng: 6.1540 }
        ]
      },
      {
        id: 'pepiniere-nancy',
        polygon: [
          { lat: 48.6990, lng: 6.1820 },
          { lat: 48.6990, lng: 6.1880 },
          { lat: 48.6950, lng: 6.1880 },
          { lat: 48.6950, lng: 6.1820 }
        ]
      },
      {
        id: 'parc-sainte-marie',
        polygon: [
          { lat: 48.6825, lng: 6.1700 },
          { lat: 48.6825, lng: 6.1740 },
          { lat: 48.6795, lng: 6.1740 },
          { lat: 48.6795, lng: 6.1700 }
        ]
      }
    ];

    // 3. Rivers & Waterways
    this.waterways = [
      {
        id: 'la-meurthe',
        width: 6,
        path: [
          { lat: 48.7050, lng: 6.1960 },
          { lat: 48.6980, lng: 6.1930 },
          { lat: 48.6900, lng: 6.1910 },
          { lat: 48.6800, lng: 6.1950 }
        ]
      },
      {
        id: 'canal-marne-rhin',
        width: 4,
        path: [
          { lat: 48.7040, lng: 6.1900 },
          { lat: 48.6960, lng: 6.1870 },
          { lat: 48.6880, lng: 6.1850 }
        ]
      }
    ];

    // 4. Vector Roads
    this.roads = [
      {
        id: 'a31-highway',
        type: 'highway',
        path: [
          { lat: 48.7080, lng: 6.1280 },
          { lat: 48.6950, lng: 6.1320 },
          { lat: 48.6800, lng: 6.1360 },
          { lat: 48.6650, lng: 6.1400 }
        ]
      },
      {
        id: 'av-boufflers',
        type: 'primary',
        path: [
          { lat: 48.6880, lng: 6.1350 },
          { lat: 48.6870, lng: 6.1550 },
          { lat: 48.6890, lng: 6.1750 }
        ]
      },
      {
        id: 'av-europe',
        type: 'primary',
        path: [
          { lat: 48.6830, lng: 6.1400 },
          { lat: 48.6820, lng: 6.1600 },
          { lat: 48.6840, lng: 6.1780 }
        ]
      },
      {
        id: 'rue-saint-exupery',
        type: 'local',
        path: [
          { lat: 48.6975, lng: 6.1400 },
          { lat: 48.6965, lng: 6.1460 }
        ]
      },
      {
        id: 'rue-deroulede',
        type: 'local',
        path: [
          { lat: 48.6890, lng: 6.1480 },
          { lat: 48.6875, lng: 6.1530 }
        ]
      }
    ];
  }
}
```

---

## 7. Performance Optimizations & Edge Case Handling

1. **Frustum Culling**:
   Before performing path drawing for any geometry, compare its geographic bounding box against `projection.getBounds()` or current viewport view bounds. Skip offscreen geometries to maintain 60fps during rapid panning.
2. **Level-of-Detail (LOD) Filtering**:
   - At $z < 1.2$: Suppress rendering of local streets to keep the vector canvas clean.
   - At $z < 1.3$: Suppress district text labels.
   - Adaptive grid lines spacing ($0.01^\circ \to 0.005^\circ \to 0.002^\circ$).
3. **Garbage Collection (GC) Avoidance in Render Loop**:
   - Pre-allocate geometry objects inside `_initVectorGeometry()`.
   - Avoid creating temporary arrays or closures inside the `render()` loop.
4. **Defensive Inputs & NaN Safety**:
   - `projection.geoToScreen()` includes defensive fallback (`{ x: 0, y: 0 }`) if coordinates are invalid or non-finite.
   - `requestAnimationFrame` IDs are tracked and cancelled/cleared cleanly on destroy.

---

## 8. Summary of Interface Contracts

- **Inputs**:
  - `canvas`: `HTMLCanvasElement`
  - `projection`: `Projection` instance (`geoToScreen`, `setCanvasSize`, `getBounds`, `getCenter`)
  - `viewportController`: `ViewportController` instance (`getState()` returning `{ x, y, zoom, width, height }`)
  - `eventBus`: `EventBus` instance emitting `viewport:changed`, `theme:changed`
- **Output Methods**:
  - `resize()`: Recalculates canvas buffer size based on DPR and notifies Projection.
  - `requestRedraw()`: Schedules a dirty-flag 60fps frame via rAF.
  - `render()`: Core canvas 2D procedural rendering pipeline.
  - `setDarkMode(isDark)`: Switches color palette between Dark and Light mode.

This specification provides everything necessary for Implementer 2 to build `js/canvasEngine.js` with full test passing assurance.
