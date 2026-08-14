# Handoff Report — Explorer 1 (Milestone 2)

**Author**: Explorer 1 (Milestone 2)  
**Recipient**: Sub-Orchestrator M2 / Implementer M2  
**Working Directory**: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m2_1`  
**Date**: 2026-08-06  

---

## 1. Observation

1. **Leaflet CSS in `index.html` (Lines 17–18)**:
   ```html
   <!-- Leaflet CSS -->
   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
   ```

2. **Leaflet JS in `index.html` (Lines 112–113)**:
   ```html
   <!-- Leaflet JS -->
   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
   ```

3. **Leaflet Initialization in `app.js` (Lines 63–78)**:
   ```javascript
   function setupMap() {
     map = L.map('map-view', { zoomControl: false }).setView(appData.center, appData.zoom);
     L.control.zoom({ position: 'topright' }).addTo(map);
     L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', ...).addTo(map);
     markersGroup = L.layerGroup().addTo(map);
   }
   ```

4. **Leaflet Markers & FlyTo in `app.js` (Lines 155, 181, 202, 257)**:
   ```javascript
   const customIcon = L.divIcon({ ... });
   const marker = L.marker([place.lat, place.lng], { icon: customIcon });
   marker.bindPopup(popupHtml);
   markersGroup.addLayer(marker);
   map.flyTo([place.lat, place.lng], 16, { duration: 1.2 });
   ```

5. **Interface Contracts in `PROJECT.md` (Lines 68–76)** & **`SCOPE.md` (Lines 13–27)**:
   - `ViewportController` requires methods: `getState()`, `panBy(dx, dy)`, `zoomAt(screenX, screenY, factor)`, `centerOnGeo(lat, lng, zoomLevel)`, `fitBounds(geoBounds)`, `attachEventListeners(containerEl, zoomInBtnEl, zoomOutBtnEl)`.
   - EventBus emission: `viewport:changed` with payload `{ x, y, zoom, width, height, bounds }`.

---

## 2. Logic Chain

1. **From Observation 1, 2, 3, 4**:
   `index.html` and `app.js` import and invoke Leaflet 1.9.4 to construct `L.map`, `L.tileLayer`, and `L.marker` objects. Requirement **R1** forbids all third-party map libraries (Leaflet, Mapbox, OpenLayers). Therefore, removing lines 17-18 and 112-113 in `index.html` and replacing `setupMap()` / `renderMarkers()` in `app.js` is strictly required to achieve 100% compliance with Requirement R1.

2. **From Observation 5**:
   The canvas map engine relies on a camera state manager (`ViewportController`) to maintain pan position $(x, y)$, zoom scale $z \in [1, 10]$, screen dimensions $(width, height)$, and bounds clamping.

3. **From Mathematical Analysis**:
   - Cursor-centered zooming requires solving for new camera pan offset $(x_{\text{new}}, y_{\text{new}})$ such that the world point under cursor $(S_x, S_y)$ remains invariant:
     $$x_{\text{new}} = \left(S_x - \frac{V_w}{2}\right) \left(1 - \frac{z_{\text{new}}}{z_{\text{old}}}\right) + x_{\text{old}} \cdot \frac{z_{\text{new}}}{z_{\text{old}}}$$
     $$y_{\text{new}} = \left(S_y - \frac{V_h}{2}\right) \left(1 - \frac{z_{\text{new}}}{z_{\text{old}}}\right) + y_{\text{old}} \cdot \frac{z_{\text{new}}}{z_{\text{old}}}$$
   - Pointer events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) with `setPointerCapture(pointerId)` guarantee smooth, continuous drag-panning across screen boundaries without losing gesture tracking.

---

## 3. Caveats

- **DOM Marker Positioning**: Leaflet HTML popups are removed in M2; rendering interactive DOM SVG/HTML markers aligned to canvas projection is assigned to `MarkerManager` in Milestone 3. In M2, placeholder marker layer container `<div id="marker-overlay">` is created to ensure full forward-compatibility.
- **Gesture Touch Pinch Zoom**: Dual-touch pinch-to-zoom relies on tracking two pointer IDs simultaneously; initial M2 implementation focuses on mouse pointer drag, wheel zoom, double-click zoom, and zoom buttons as specified in scope.

---

## 4. Conclusion

1. **Leaflet Removal Plan**: Complete line-by-line removal specification of Leaflet CSS/JS links in `index.html` and Leaflet primitives in `app.js` is fully documented in `analysis.md`.
2. **ViewportController Design**: Architectural design for `js/viewport.js` fulfilling all exact interface contracts (`getState`, `panBy`, `zoomAt`, `centerOnGeo`, `fitBounds`, `attachEventListeners`), math derivations, bounds clamping, and `viewport:changed` event bus emissions is ready for implementation.

---

## 5. Verification Method

1. **Leaflet Absence Verification**:
   ```bash
   grep -rn "leaflet" /Users/carlair/.gemini/antigravity/scratch/laxou-map-app/index.html /Users/carlair/.gemini/antigravity/scratch/laxou-map-app/app.js
   ```
   *Expected result*: Zero matches in `index.html` or `app.js`.

2. **Viewport Mathematics & Interface Unit Test**:
   Execute Node test suite once implementer creates `tests/test_viewport.js`:
   ```bash
   node --test tests/test_viewport.js
   ```
   *Expected result*: All tests pass for initial state, `panBy`, `zoomAt`, `centerOnGeo`, `fitBounds`, and `viewport:changed` event emission.

3. **Playwright Feature Verification**:
   ```bash
   pytest tests/test_tier1_features.py
   ```
   *Expected result*: Tier 1 tests for R1-1 through R1-6 pass cleanly.
