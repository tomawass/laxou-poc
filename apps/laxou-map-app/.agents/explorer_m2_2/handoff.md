# Handoff Report: Canvas Vector Map Engine (`js/canvasEngine.js`)

**Agent**: Explorer 2 (Milestone 2)  
**Role**: Read-Only Architecture Investigator for Canvas Vector Map Engine  
**Working Directory**: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m2_2`  
**Target File Specification**: `js/canvasEngine.js`  
**Date**: 2026-08-06  

---

## 1. Observation

1. **Original Request (`/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/ORIGINAL_REQUEST.md`)**:
   - Requirement R1 states: "Implémenter en Vanilla JS (HTML5 / CSS3 / ES6+) un moteur de carte interactif basé sur Canvas et/or SVG. Gérer de manière fluide le déplacement (drag/pan), le zoom (+/-, molette, tactile/double-clic) et le redimensionnement du canevas. Ne pas utiliser de bibliothèques tierces (Leaflet, Mapbox, OpenLayers interdits)."
2. **Project Specification (`/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/PROJECT.md`)**:
   - Section 4 describes `CanvasEngine`: "Draws background vector elements (grid lines, Laxou/Nancy city boundary, district polygons, roads, parks, rivers, scale bar) on an HTML5 `<canvas>` at 60fps."
3. **Milestone 2 Scope (`/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/sub_orch_m2/SCOPE.md`)**:
   - Section 3 requires:
     - Pure HTML5 2D Canvas vector renderer without third-party dependencies.
     - High-DPI / Retina DPR auto-scaling (`window.devicePixelRatio`).
     - Smooth 60fps `requestAnimationFrame` redraw loop triggered by viewport changes.
     - Vector background layers: Grid lines, District polygons (Champ-le-Bœuf, Laxou Village, Laxou Sapinière, Nancy Centre), Road network, Parks & natural areas, Rivers/waterways, Dynamic metric scale bar.
4. **Existing Projection Layer (`/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/js/projection.js`)**:
   - `Projection.geoToScreen(lat, lng, viewport)` handles forward lat/lng to screen pixel coordinate translation given a viewport object `{ panX, panY, zoom, width, height }`.
   - `Projection.setCanvasSize(width, height)` recomputes base aspect ratio dimensions (`baseWidth`, `baseHeight`).
5. **Data Layer (`/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/data.json`)**:
   - `geoBounds` defined as `{ minLat: 48.6750, maxLat: 48.7020, minLng: 6.1350, maxLng: 6.1950 }` centered on Laxou `(48.6865, 6.1504)`.
   - Includes 5 NPRNU sites in Champ-le-Bœuf and Provinces sectors.

---

## 2. Logic Chain

1. **From Observation 1 & 3**: A completely pure, framework-free HTML5 2D Canvas renderer is required. To guarantee crisp rendering on Retina / 4K monitors, the engine must multiply physical `<canvas>` element buffer dimensions by `window.devicePixelRatio` while scaling the 2D rendering context via `ctx.scale(dpr, dpr)` and updating `Projection` canvas dimensions with logical CSS pixels.
2. **From Observation 2 & 4**: Coordinate transformations between geographical data (lat/lng) and 2D canvas pixel coordinates must delegate to `Projection.geoToScreen(lat, lng, viewport)`. This ensures seamless alignment between the canvas vector background and DOM interactive markers.
3. **From Observation 3**: The engine rendering pipeline must execute drawing commands in strict z-index order:
   - Layer 1: Background Fill (`#0f172a` dark / `#f1f5f9` light)
   - Layer 2: Geographical Grid Lines & Labels (`ctx.setLineDash([4, 4])`)
   - Layer 3: District Polygons & Boundaries (Champ-le-Bœuf, Laxou Village, Laxou Sapinière, Nancy Centre)
   - Layer 4: Green Parks & Natural Areas (Parc Champ-de-Boufflers, Parc Urbain des Provinces, Parc Pépinière, Parc Sainte-Marie, Forêt de Haye)
   - Layer 5: Rivers & Waterways (La Meurthe river & Canal de la Marne au Rhin, sky blue stroke width scaled by `Math.sqrt(zoom)`)
   - Layer 6: Vector Road Network (A31 highway, Av. de Boufflers, Av. de l'Europe, local streets with LOD zoom threshold $z \ge 1.2$)
   - Layer 7: Dynamic Metric Scale Bar & Compass (Meters per pixel calculated dynamically via $M_{\text{pixel}} = \frac{\text{dLng}}{\text{baseWidth} \times z} \times 111320 \times \cos(\phi_0)$)
4. **From Observation 3 & 4**: Redraws must be scheduled asynchronously using a dirty-flag (`needsRedraw`) with `requestAnimationFrame` triggered by `viewport:changed` events from `EventBus`, preventing unnecessary GPU rendering when camera position is static.

---

## 3. Caveats

- **No external GeoJSON loading library**: All vector feature geometries (districts, parks, rivers, highways) are embedded as lightweight, clean procedural coordinate arrays within `_initVectorGeometry()`.
- **Browser Canvas Limits**: Canvas buffer resizing on mobile devices should avoid allocating excessively large buffers by clamping `dpr` (e.g., `Math.min(window.devicePixelRatio || 1, 3)`).

---

## 4. Conclusion

`js/canvasEngine.js` can be fully implemented as a pure, modular ES6 class `CanvasEngine` that integrates seamlessly with `Projection`, `ViewportController`, and `EventBus`. Detailed architectural design, mathematical derivations, layer draw order, and full ES6 production code skeleton have been documented in `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m2_2/analysis.md`.

---

## 5. Verification Method

1. **File Inspection**:
   - Verify `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m2_2/analysis.md` contains the complete specification and class structure.
2. **Automated Unit Testing**:
   - Once `js/canvasEngine.js` is created by Implementer 2, run unit tests using Node test runner (`node --test tests/test_canvasEngine.js` or `pytest`) to verify context methods (`ctx.scale`, `ctx.clearRect`, `ctx.beginPath`, `ctx.stroke`), high-DPI sizing, scale bar meter calculations, and `requestAnimationFrame` execution.
3. **Invalidation Conditions**:
   - Any introduction of Leaflet, Mapbox, D3, or third-party GIS library imports inside `js/canvasEngine.js` invalidates compliance with Requirement R1.
