# Project & Workspace Survey Analysis

**Project**: Laxou / Nancy Custom Interactive Map Web Application  
**Root Directory**: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app`  
**Agent**: Explorer 1 (`.agents/explorer_survey_1`)  
**Date**: 2026-08-06  

---

## 1. Executive Summary

A complete survey of the project workspace was conducted. The project aims to deliver a responsive, accessible, custom-engine interactive map web application for the city of Laxou (54520) and surrounding Nancy.

Currently, the workspace contains a functional prototype built with **HTML5, CSS3, ES6+ JavaScript, and Leaflet.js**. However, **Requirement R1 explicitly forbids third-party mapping libraries (Leaflet, Mapbox, OpenLayers)** and mandates a **custom Canvas / SVG map engine built from scratch in Vanilla JS**.

---

## 2. Workspace Directory Structure & File Map

```
/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/
├── index.html          # Main HTML structure (118 lines, 4.4 KB)
├── styles.css          # CSS Design System & Layout (601 lines, 12.4 KB)
├── app.js              # Application Logic & Event Handlers (356 lines, 11.3 KB)
├── data.json           # GeoJSON-like dataset of Laxou POIs (92 lines, 3.4 KB)
└── .agents/            # Agent metadata directory
    ├── ORIGINAL_REQUEST.md  # Original project specifications & acceptance criteria
    ├── explorer_survey_1/   # Explorer 1 working directory (analysis.md, handoff.md, etc.)
    ├── explorer_survey_2/
    ├── explorer_survey_3/
    ├── orchestrator/
    └── sentinel/
```

### Detailed File Analysis

#### `index.html` (118 lines)
- **Role**: Single-page application structure.
- **Includes**:
  - Fonts: Inter & Outfit from Google Fonts.
  - Icons: FontAwesome 6.5.1 via CDN.
  - Leaflet CSS (`https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`) and Leaflet JS (`https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`). *(Violation of R1 - needs removal)*.
  - Custom CSS (`styles.css`) and App JS (`app.js`).
- **DOM Structure**:
  - `header.glass-header`: Brand logo, subtitle, search input `#search-input`, clear button, sidebar toggle button `#toggle-sidebar-btn` with counter badge `#places-badge`, and theme toggle `#theme-toggle-btn`.
  - `main.main-content`:
    - `#map-view`: Map container div.
    - `nav.categories-wrapper`: `#categories-bar` floating pill container.
    - `aside#sidebar.glass-sidebar`: Collapsible panel containing `#results-count` and `#places-list` grid.
    - `div#detail-drawer.detail-drawer`: Detail view for selected place, containing `#drawer-content` and `#close-drawer-btn`.
  - `footer.glass-footer`: Footer info and `#app-status` status indicator.

#### `styles.css` (601 lines)
- **Role**: Complete visual styling, dark/light theme switcher, responsive layout, glassmorphism UI.
- **CSS Variables**:
  - Dark mode by default (`:root`): Dark slate background `--bg-primary: #0f172a`, glass card overlays, indigo accent `--accent-primary: #6366f1`, cyan secondary `--accent-secondary: #06b6d4`.
  - Light mode overrides (`body.light-mode`): Soft slate background `#f1f5f9`, elevated white cards.
- **Key UI Components**:
  - Header: 70px fixed height, backdrop-filter blur.
  - Search box with rounded input and absolute icon positioning.
  - Floating category pills with horizontal scrolling.
  - Collapsible right sidebar (width: 380px) with slide transition (`transform: translateX`).
  - Detail drawer floating modal (width: 360px, bottom-left) with slide up transition.
  - Responsive breakpoints for screen width ≤ 768px.

#### `app.js` (356 lines)
- **Role**: Application logic, state management, data fetching, DOM manipulation.
- **State**:
  ```js
  let appData = { city: 'Laxou', center: [48.6865, 6.1504], zoom: 14, categories: [], places: [] };
  let map = null, markersGroup = null;
  let activeCategory = 'all', searchQuery = '', selectedPlaceId = null;
  ```
- **Functions**:
  - `init()`: Triggers map setup, event listeners, and data loading.
  - `setupMap()`: Initializes Leaflet map centered at `[48.6865, 6.1504]`, attaches OpenStreetMap/Carto tiles. *(Violation of R1 - needs replacement)*.
  - `loadData()`: Asynchronously fetches `data.json`, renders category pills, and calls `filterAndRender()`.
  - `renderCategories()`: Generates category filter chips.
  - `filterAndRender()`: Filters `appData.places` by `activeCategory` and `searchQuery` (matching name, address, description, tags), then updates markers and sidebar cards.
  - `renderMarkers()`: Clears layers and builds `L.marker` with `L.divIcon`. *(Violation of R1)*.
  - `renderSidebarList()`: Generates card HTML for sidebar list.
  - `selectPlace(placeId)`: Triggers `map.flyTo()` to coordinates and displays detail drawer. *(Violation of R1)*.
  - `showDetailDrawer(place)`: Formats and displays detail drawer HTML.
  - `setupEventListeners()`: Input listeners for live search, sidebar toggle, detail drawer close, theme toggle.

#### `data.json` (92 lines)
- **Role**: Structured JSON dataset for Laxou.
- **Metadata**: City: Laxou, Postal: 54520, Center: `[48.6865, 6.1504]`, Zoom: 14.
- **Categories** (6 entries):
  1. `all` ("Tous")
  2. `public` ("Services Publics")
  3. `nature` ("Parcs & Nature")
  4. `culture` ("Culture & Loisirs")
  5. `sports` ("Sports & Santé")
  6. `education` ("Écoles & Jeunesse")
- **Places** (6 POIs):
  1. `mairie-laxou` - Hôtel de Ville de Laxou (48.6882, 6.1511)
  2. `parc-boufflers` - Parc du Champ-de-Boufflers (48.6845, 6.1480)
  3. `mediatheque-thirion` - Médiathèque Gérard Thirion (48.6870, 6.1530)
  4. `complexe-saussaie` - Complexe Sportif de la Saussaie (48.6912, 6.1455)
  5. `centre-culturel-cascade` - Espace Culturel La Cascade (48.6850, 6.1560)
  6. `college-victor-hugo` - Collège Victor Hugo (48.6895, 6.1490)

---

## 3. Requirement Gap Analysis

| Requirement ID | Requirement Description | Current Implementation Status | Gap / Required Action |
|---|---|---|---|
| **R1** | Moteur cartographique Canvas / SVG sur-mesure (sans Leaflet/Mapbox/OpenLayers) | ❌ **Non-compliant** (Uses Leaflet 1.9.4 CDN) | Remove Leaflet JS/CSS. Implement a custom Canvas or SVG map engine with pan, zoom (buttons, wheel, touch/double click), and window resize handling. |
| **R2** | Projection des données et conversion lat/lng -> écran | ❌ **Non-compliant** (Delegated to Leaflet `setView`/`marker`) | Implement geographic projection math (Web Mercator or Bounding Equirectangular for Laxou domain) to convert `(lat, lng)` to Canvas/SVG `(x, y)` screen space. Render custom interactive markers. |
| **R3** | Navigation & Panneau latéral interactif | ⚠️ **Partial** (UI & Drawer exist, but rely on `map.flyTo`) | Rebind marker click and sidebar list item click to custom smooth pan/zoom animation on the Canvas/SVG engine. |
| **R4** | Filtrage par catégories & Recherche textuelle | ✅ **Compliant** (Functional in `app.js`) | Retain logic, wire filter updates to trigger Canvas/SVG re-render. |
| **R5** | Responsive Design & Accessibilité (a11y) | ⚠️ **Partial** (Responsive CSS exists; keyboard navigation incomplete) | Add explicit keyboard focus states (`tabindex`, `aria-*` attributes, KeyboardEvent handlers for Enter, Space, Escape on markers and controls). |

---

## 4. Development & Testing Environment Capabilities

The local system environment was checked via shell commands:

- **Node.js**: `v24.9.0`
- **npm**: `11.6.0`
- **npx**: `11.6.0`
- **Python**: `3.12.5` (Includes built-in HTTP server: `python3 -m http.server [port]`)
- **Playwright**: Installed via Python framework (`v1.62.0` at `/Library/Frameworks/Python.framework/Versions/3.12/bin/playwright`)
- **Puppeteer**: Installed (`/opt/homebrew/bin/puppeteer`)
- **Static HTTP Server Options**:
  - Python: `python3 -m http.server 8000`
  - Node: `npx serve` or `npx http-server`

---

## 5. Architectural Recommendations for Implementation Phase

1. **Map Engine Architecture (Canvas vs. SVG)**:
   - **Canvas Recommendation**: A standard `<canvas id="map-canvas">` inside `#map-view`.
   - **Background Rendering**: Render vector grid lines, administrative boundary vector path / background styling, road/river features or stylized vector map representation of Laxou/Nancy.
   - **Projection**: Standard Web Mercator projection centered around Laxou (`lat: 48.6865, lng: 6.1504`).
     ```js
     // Mercator Projection Helper
     function latLngToPoint(lat, lng, zoom, width, height, centerLat, centerLng) { ... }
     ```
   - **Transform State**: Maintain `{ offsetX, offsetY, scale }` state. Handle `mousedown`/`mousemove`/`mouseup` for pan, `wheel` for zoom, and touch gesture handlers.
   - **Marker Rendering & Hit Testing**: Render stylized markers on canvas with icons/badges. Implement hit detection on click/hover based on distance from mouse coordinates to projected marker coordinates.
   - **Accessibility Overlay**: Provide invisible SVG or HTML DOM button overlays positioned over active markers for keyboard navigation (`tabindex="0"`, `aria-label`, `focus` ring).

2. **Clean Code & Refactoring**:
   - Modularize JS: Create clean modules or clear functional namespaces (e.g. `MapEngine`, `DataManager`, `UIController`, `A11yManager`).
   - Remove all Leaflet CDN references from `index.html` and code from `app.js`.

---
