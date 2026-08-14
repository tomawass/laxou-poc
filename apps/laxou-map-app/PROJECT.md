# PROJECT: Custom Interactive Map Web Application for Laxou & Nancy

## Architecture
The application uses a pure Vanilla JS (HTML5 / CSS3 / ES6+) architecture with a **Hybrid Map Engine** (Canvas 2D vector background + DOM/SVG interactive marker overlay) to eliminate all third-party GIS library dependencies (Leaflet, Mapbox, OpenLayers).

### Data & Rendering Pipeline
1. **Data Layer (`DataProvider`)**: Loads `data.json` containing POIs and district boundaries. Provides filtering, search indexing, and spatial query APIs.
2. **Projection Layer (`Projection`)**: Applies a Localized Equirectangular Projection with Cosine Latitude Scaling centered on Laxou ($\phi_0 = 48.6865^\circ, \lambda_0 = 6.1504^\circ$) to convert lat/lng to normalized $(0..1)$ world coordinates.
3. **Viewport Controller (`ViewportController`)**: Maintains camera position $(x, y)$, zoom level $z \in [1, 10]$, and canvas pan matrix. Handles pointer events (drag/pan), wheel zoom, button zoom, and bounds clamping.
4. **Canvas Engine (`CanvasEngine`)**: Draws background vector elements (grid lines, Laxou/Nancy city boundary, district polygons, roads, parks, rivers, scale bar) on an HTML5 `<canvas>` at 60fps.
5. **Marker Overlay Manager (`MarkerManager`)**: Renders interactive HTML/SVG marker elements in a DOM overlay aligned to canvas projection. Ensures native DOM accessibility (`tabindex="0"`, `aria-label`, visible focus state).
6. **Sidebar & UI Controller (`SidebarController`)**: Manages the right-hand detail drawer (desktop) / bottom sheet (mobile), rendering full POI details, images, tags, links, and NPRNU status.
7. **Filter & Search Engine (`FilterSearchController`)**: Real-time filtering by category pill buttons and search input matching name, description, address, and tags with debounced updates.
8. **Accessibility Manager (`AccessibilityManager`)**: Keyboard navigation traps, visible focus rings, ARIA live region announcements, keyboard pan/zoom shortcuts, ESC drawer dismissal.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Custom Canvas Map Engine | Pure Vanilla JS 2D Canvas rendering without Leaflet/Mapbox/OpenLayers | M2 | R1 |
| 2 | Fluid Drag & Pan | Smooth pan gesture handling via pointer events | M2 | R1 |
| 3 | Multi-input Zoom | Zoom via mouse wheel, +/- controls, double click | M2 | R1 |
| 4 | Responsive Canvas Resizing | Auto-resizing to container bounds with DPR scaling | M2 | R1 |
| 5 | Dynamic `data.json` Ingestion | Dynamic fetch & parse of Laxou/Nancy POIs & NPRNU data | M1 | R2 |
| 6 | Coordinate Projection | Accurate lat/lng to pixel coordinate transformation | M1 | R2 |
| 7 | Stylized Marker Overlay | SVG/HTML marker elements with category icons & active states | M3 | R2 |
| 8 | Interactive Detail Sidebar | Responsive side drawer displaying full POI metadata | M3 | R3 |
| 9 | Bidirectional Selection Sync | Selecting marker centers map & opens sidebar; selecting list item highlights marker & pans map | M3 | R3 |
| 10 | Category Filter Bar | Multi-category filter pills (Services publics, Parcs, Culture, Sports, Écoles) | M4 | R4 |
| 11 | Real-time Text Search | Reactive search matching names, descriptions, tags, addresses | M4 | R4 |
| 12 | Responsive Mobile Layout | Desktop sidebar + Mobile bottom sheet / tab toggle | M4 | R5 |
| 13 | Full Keyboard Accessibility | Full keyboard nav, visible focus rings, Enter/Space select, ESC close, ARIA attributes | M5 | R5 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Data Model & Coordinate Projection Engine | `data.json` dataset (18 POIs), `projection.js` (equirectangular math), `dataProvider.js` (data fetching, filtering, search logic) | None | DONE |
| M2 | Canvas Vector Map Engine & Viewport Controller | Remove Leaflet from `index.html` & `app.js`; `viewport.js` (pan/zoom transform math, pointer/wheel events) & `canvasEngine.js` (procedural vector background drawing loop) | M1 | DONE |
| M3 | Interactive Marker Overlay & Selection Synchronization | `markerManager.js` (DOM marker overlay aligned with canvas projection, hover/active states) & `sidebarController.js` (detail drawer UI, bidirectional selection sync) | M1, M2 | DONE |
| M4 | Category Filtering, Real-Time Search & Responsive UI | `filterSearchController.js` (category pills, search bar with debouncing) & responsive CSS layout (`styles.css` for desktop drawer + mobile bottom sheet) | M1, M2, M3 | DONE |
| M5 | Accessibility (a11y) & Keyboard Navigation | `accessibilityManager.js` (keyboard marker navigation, visible focus rings, ARIA live region, keyboard pan/zoom shortcuts, ESC dismissal) | M1, M2, M3, M4 | DONE |
| E2E | E2E Testing Suite Track | Playwright-based test suite (Tiers 1-4) verifying feature coverage, boundaries, combinations, and application workflows. Publishes `TEST_READY.md`. | Parallel | IN_PROGRESS (Conv ID: b3e92240-916b-4f32-9672-7674f45115f9) |

---

## Interface Contracts

### 1. Coordinate Projection Interface (`Projection`)
```javascript
export class Projection {
  constructor(bounds, canvasSize) {}
  // Convert lat/lng to normalized (0..1) world coordinates
  geoToWorld(lat, lng) -> { x: number, y: number }
  // Convert normalized world coordinates to screen pixel coordinates given viewport state
  worldToScreen(worldX, worldY, viewport) -> { x: number, y: number }
  // Convert lat/lng directly to screen pixel coordinates
  geoToScreen(lat, lng, viewport) -> { x: number, y: number }
  // Reverse conversion: screen pixel coordinates to lat/lng
  screenToGeo(screenX, screenY, viewport) -> { lat: number, lng: number }
}
```

### 2. Viewport Controller Interface (`ViewportController`)
```javascript
export class ViewportController {
  getState() -> { x: number, y: number, zoom: number, width: number, height: number }
  panBy(dx, dy)
  zoomAt(screenX, screenY, factor)
  centerOnGeo(lat, lng, zoomLevel)
  fitBounds(geoBounds)
}
```

### 3. Data Provider Interface (`DataProvider`)
```javascript
export class DataProvider {
  async loadData(url) -> AppData
  getPlaces() -> Place[]
  filterPlaces(categoryId, searchQuery) -> Place[]
  getPlaceById(id) -> Place | null
  getCategories() -> Category[]
}
```

### 4. Event Bus Contract (`EventBus`)
Event Types:
- `viewport:changed` -> `{ x, y, zoom }`
- `place:selected` -> `{ placeId, source: 'map' | 'list' }`
- `place:hovered` -> `{ placeId | null }`
- `filter:changed` -> `{ categoryId, query }`
- `drawer:toggled` -> `{ isOpen }`

---

## Code Layout
```
laxou-map-app/
├── index.html                  # Main application HTML shell
├── styles.css                  # Comprehensive CSS (CSS grid/flexbox, variables, responsive breakpoints, a11y focus)
├── data.json                   # POI dataset (18 places, 5 categories, Laxou/Nancy bounds)
├── js/
│   ├── app.js                  # Main entrypoint & component orchestrator
│   ├── eventBus.js             # Lightweight pub/sub event bus
│   ├── projection.js           # Equirectangular coordinate projection math
│   ├── viewport.js             # Viewport state, pan/zoom gesture controller
│   ├── canvasEngine.js         # HTML5 2D Canvas background & map vector rendering
│   ├── markerManager.js        # DOM SVG/HTML marker overlay positioning & interactions
│   ├── dataProvider.js         # Fetch, schema parse, filtering & search index
│   ├── sidebarController.js    # Detail sidebar drawer & list synchronization
│   ├── filterSearchController.js # Category filter pills & text search input binding
│   └── accessibilityManager.js # ARIA attributes, keyboard navigation & focus handling
└── .agents/                    # Coordination metadata (orchestration plans, handoffs)
```
