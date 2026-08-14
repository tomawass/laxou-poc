# Milestone 3 - Technical Analysis: Sidebar & Detail Drawer Controller (`js/sidebarController.js`)

## Executive Summary
This document provides a comprehensive technical analysis and specification for `js/sidebarController.js`, a key component of Milestone 3 (Interactive Marker Overlay & Selection Synchronization) for the Laxou & Nancy Custom Interactive Map project.

The `SidebarController` manages:
1. The places list view (`#places-list`) inside `#sidebar`, rendering place cards with category badges, NPRNU indicators, address, and short descriptions.
2. The place detail drawer (`#detail-drawer` / `#drawer-content`), rendering complete metadata (title, category badge, address, phone, hours, website link, description, image, tags, NPRNU badge).
3. Seamless bidirectional selection synchronization between map markers (`MarkerManager`) and the sidebar list/drawer.
4. Drawer and sidebar dismissal interactions (close buttons, `ESC` key, smooth selection replacement).

---

## 1. Codebase Investigation Findings

### 1.1 Existing HTML Structure (`index.html`)
The application layout uses semantic HTML5 containers in `index.html`:
- **Main Layout Container**: `<main class="main-content">` (lines 56–104)
- **Sidebar Container**: `<aside id="sidebar" class="glass-sidebar open">` (lines 80–94)
  - Header: `.sidebar-header` (lines 81–84) containing title `<h2>` and close button `<button id="close-sidebar-btn" class="icon-btn">`.
  - Stats: `.sidebar-stats` (lines 86–88) containing `<span id="results-count">`.
  - Places List Container: `<div id="places-list" class="places-grid">` (lines 91–93).
- **Detail Drawer Container**: `<div id="detail-drawer" class="detail-drawer glass-panel hidden">` (lines 97–102)
  - Close button: `<button id="close-drawer-btn" class="icon-btn drawer-close">`.
  - Dynamic content slot: `<div id="drawer-content">`.
- **Header Actions**: In `<header class="glass-header">` (lines 24–53):
  - Toggle button: `<button id="toggle-sidebar-btn" class="action-btn">` (lines 44–48) with `<span id="places-badge" class="badge">0</span>`.

### 1.2 Existing CSS Styling (`styles.css`)
- **Sidebar (`.glass-sidebar`)**:
  - Positioned absolutely on the right: `right: 1.2rem; top: 1.2rem; bottom: 1.2rem; width: 380px; z-index: 950;`.
  - Open state toggle: `.glass-sidebar.open`. When not open (`:not(.open)`), transforms off-screen `translateX(calc(100% + 2rem))`, `opacity: 0`, `pointer-events: none`.
- **Detail Drawer (`.detail-drawer`)**:
  - Positioned absolutely on the bottom left: `left: 1.2rem; bottom: 1.2rem; width: 360px; max-height: 75%; z-index: 960;`.
  - Open/Closed transition: `.detail-drawer.hidden` uses `transform: translateY(120%); opacity: 0; pointer-events: none;`.
  - Visible state: removing `.hidden` triggers smooth slide-in cubic-bezier transition.
- **Place Card (`.place-card`)**:
  - Background: `var(--card-bg)`, border: `1px solid var(--glass-border)`, radius: `var(--radius-md)`.
  - Card Header (`.place-card-header`), Title (`.place-title`), Category tag (`.category-tag`), Address (`.place-address`), Description (`.place-desc`).

#### CSS Enhancements Needed for Milestone 3
To ensure full visual quality, the following CSS rules should be added to `styles.css`:
```css
/* Selected state for Place Cards */
.place-card.selected {
  background: var(--card-hover);
  border-color: var(--accent-primary);
  box-shadow: 0 0 16px var(--accent-glow);
}

/* NPRNU Badge styling */
.nprnu-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.15);
  color: var(--accent-warning);
  border: 1px solid rgba(245, 158, 11, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive Image in Detail Drawer */
.detail-image-container {
  width: 100%;
  height: 160px;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 0.2);
}

.detail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### 1.3 Data Model Analysis (`data.json` & `dataProvider.js`)
Places in `data.json` contain the following fields:
- `id`: string (unique identifier, e.g. `"cilm-champ-le-boeuf"`)
- `name`: string (display title)
- `category`: string (category ID matching `categories` array: `services`, `parcs`, `culture`, `sports`, `ecoles`)
- `lat`, `lng`: numbers (WGS84 geographic coordinates)
- `address`: string (full physical address)
- `description`: string (detailed summary)
- `image`: string (URL to location photo)
- `tags`: Array<string> (e.g. `["NPRNU", "CILM", "Champ-le-Bœuf"]`)
- `link` / `website`: string (external URL)
- `isNprnu`: boolean (`true` if part of National Urban Renewal Programme)
- `phone`: string (optional)
- `hours`: string (optional)

### 1.4 Event Bus Event Mapping (`eventBus.js`)
The `SidebarController` will listen to and emit the following standard events:

| Event Name | Direction | Payload | Description / Handler |
|------------|-----------|---------|-----------------------|
| `data:loaded` | Listen | `{ places, categories }` | Triggers initial rendering of place cards list |
| `filter:changed` | Listen | `{ categoryId, query, filteredPlaces }` | Re-renders `#places-list` with matching filtered places |
| `place:selected` | Listen & Emit | `{ placeId, place, source }` | `source === 'map'`: open drawer, highlight card & scroll into view, center map.<br>`source === 'list'`: open drawer, center map.<br>`placeId === null`: close drawer and clear selection. |
| `drawer:toggled` | Emit | `{ isOpen, placeId }` | Emitted when detail drawer is opened or dismissed |
| `sidebar:toggled` | Listen & Emit | `{ isOpen }` | Emitted when sidebar panel open state changes |

---

## 2. Component Design & Implementation Plan for `js/sidebarController.js`

### 2.1 Architecture & Class API
`SidebarController` is designed as an ES Module class encapsulating all sidebar and detail drawer UI operations:

```javascript
/**
 * SidebarController - Manages the places list view, detail drawer rendering,
 * and bidirectional selection synchronization between map and sidebar.
 */
export class SidebarController {
  /**
   * @param {Object} config
   * @param {DataProvider} config.dataProvider
   * @param {ViewportController} config.viewportController
   * @param {EventBus} config.eventBus
   * @param {Object} [config.elements] DOM elements override cache
   */
  constructor({ dataProvider, viewportController, eventBus, elements = {} }) {
    this.dataProvider = dataProvider;
    this.viewportController = viewportController;
    this.eventBus = eventBus;
    
    // DOM Element References
    this.elements = {
      sidebar: elements.sidebar || document.getElementById('sidebar'),
      placesList: elements.placesList || document.getElementById('places-list'),
      placesBadge: elements.placesBadge || document.getElementById('places-badge'),
      resultsCount: elements.resultsCount || document.getElementById('results-count'),
      toggleSidebarBtn: elements.toggleSidebarBtn || document.getElementById('toggle-sidebar-btn'),
      closeSidebarBtn: elements.closeSidebarBtn || document.getElementById('close-sidebar-btn'),
      detailDrawer: elements.detailDrawer || document.getElementById('detail-drawer'),
      drawerContent: elements.drawerContent || document.getElementById('drawer-content'),
      closeDrawerBtn: elements.closeDrawerBtn || document.getElementById('close-drawer-btn')
    };

    this.selectedPlaceId = null;
    this.isDrawerOpen = false;
    this.isSidebarOpen = true;
    this.unsubscribers = [];
  }

  /**
   * Initialize controller: bind DOM listeners and EventBus subscriptions.
   */
  init() {
    this._setupDOMListeners();
    this._setupEventBusListeners();

    // If data is already loaded, perform initial render
    if (this.dataProvider && this.dataProvider.isLoaded) {
      this.renderList(this.dataProvider.getPlaces());
    }
  }

  /**
   * Bind internal DOM event listeners.
   * @private
   */
  _setupDOMListeners() { ... }

  /**
   * Bind EventBus subscriptions.
   * @private
   */
  _setupEventBusListeners() { ... }

  /**
   * Render list of place cards inside #places-list.
   * @param {Array<Object>} places 
   */
  renderList(places) { ... }

  /**
   * Render detail drawer content and set drawer visible.
   * @param {Object} place 
   */
  openDetailDrawer(place) { ... }

  /**
   * Close detail drawer and clear selection.
   * @param {boolean} [emitEvent=true] 
   */
  closeDetailDrawer(emitEvent = true) { ... }

  /**
   * Select a place programmatically or via UI click.
   * @param {string|null} placeId 
   * @param {Object} [options] 
   * @param {string} [options.source='list'] 
   * @param {boolean} [options.centerMap=true] 
   */
  selectPlace(placeId, options = {}) { ... }

  /**
   * Toggle sidebar visibility.
   * @param {boolean} [forceState] 
   */
  toggleSidebar(forceState) { ... }

  /**
   * Cleanup event listeners and EventBus subscriptions.
   */
  destroy() { ... }
}
```

---

## 3. Detailed Technical Requirements & Implementation Logic

### 3.1 List View Management (`#places-list`)
1. **Card Component Generation**:
   - For each place object in the provided array, generate a `.place-card` element.
   - Include category badge: lookup category label and color from `dataProvider.getCategories()`.
   - Include NPRNU badge if `place.isNprnu === true` or if `place.tags` contains `'NPRNU'`.
   - Display `place.name`, `place.address`, and truncated `place.description`.
   - Set `data-place-id="${place.id}"`.
   - Mark as `.selected` if `place.id === this.selectedPlaceId`.

2. **Empty State**:
   - If `places.length === 0`, render an accessible empty state message in `#places-list`:
     ```html
     <div class="empty-state">
       <i class="fa-solid fa-map-location-dot"></i>
       <p>Aucun lieu ne correspond à vos critères.</p>
     </div>
     ```

3. **Stats and Badge Updates**:
   - Update `#places-badge` text content with `places.length`.
   - Update `#results-count` text content with formatted text e.g. `"18 lieux trouvés"`.

### 3.2 Detail Drawer Management (`#detail-drawer` & `#drawer-content`)
1. **Full Metadata Rendering**:
   - **Image**: If `place.image` exists, render inside `.detail-image-container` with error fallback handling (`onerror="this.parentNode.style.display='none'"`).
   - **Category Tag**: Category label with matching category color/badge style.
   - **NPRNU Badge**: Prominent warning/highlight badge when `place.isNprnu === true`.
   - **Title**: `<h3>${place.name}</h3>`.
   - **Address**: Icon `<i class="fa-solid fa-location-dot"></i>` + `place.address`.
   - **Phone**: If present, icon `<i class="fa-solid fa-phone"></i>` + `<a href="tel:...">`.
   - **Hours**: If present, icon `<i class="fa-solid fa-clock"></i>` + `place.hours`.
   - **Website Link**: If `place.link` or `place.website` present, icon `<i class="fa-solid fa-globe"></i>` + target `_blank` link.
   - **Description**: Detailed multi-paragraph or clean text block.
   - **Tags Cloud**: Iteration over `place.tags` array to render `#tag` badges.

2. **Drawer Visibility Logic**:
   - Opening: remove `.hidden` class from `#detail-drawer`. Set `this.isDrawerOpen = true`.
   - Closing: add `.hidden` class to `#detail-drawer`. Set `this.isDrawerOpen = false`.
   - Emit `drawer:toggled` payload `{ isOpen: this.isDrawerOpen, placeId: this.selectedPlaceId }`.

### 3.3 Bidirectional Synchronization Logic

#### Case A: User Clicks Place Card in Sidebar List
1. User clicks card `[data-place-id="x"]`.
2. `SidebarController` updates `this.selectedPlaceId = x`.
3. Highlights active place card (adds `.selected` class to clicked card, removes from siblings).
4. Calls `viewportController.centerOnGeo(place.lat, place.lng, targetZoom)`.
5. Opens detail drawer with place details.
6. Emits `place:selected` payload `{ placeId: x, place, source: 'list' }`.
7. `MarkerManager` receives `place:selected`, highlights DOM marker overlay element for place `x`.

#### Case B: User Clicks Map Marker on Canvas/Overlay
1. User clicks marker on map.
2. `MarkerManager` handles DOM click, emits `place:selected` payload `{ placeId: y, place, source: 'map' }`.
3. `SidebarController` receives `place:selected` event:
   - Updates `this.selectedPlaceId = y`.
   - Opens detail drawer with place details.
   - Finds `.place-card[data-place-id="y"]` in `#places-list`.
   - Highlights the place card with `.selected` class.
   - Executes smooth auto-scroll: `card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`.
   - Ensures sidebar is open if closed (`this.toggleSidebar(true)`).
   - Pans camera to center on place coordinates `viewportController.centerOnGeo(place.lat, place.lng)`.

### 3.4 Drawer Dismissal Controls
1. **Close Button Click (`#close-drawer-btn`)**:
   - Calls `closeDetailDrawer()`.
   - Adds `.hidden` to `#detail-drawer`.
   - Clears `selectedPlaceId = null`.
   - Removes `.selected` class from cards.
   - Emits `place:selected` with `{ placeId: null, place: null, source: 'drawer_close' }`.
   - `MarkerManager` clears active marker state.

2. **ESC Key Keyboard Shortcut**:
   - Global `keydown` event listener attached to `document`.
   - Checks `if (e.key === 'Escape' && this.isDrawerOpen)`.
   - Invokes `closeDetailDrawer()`.

3. **Selecting Another Place**:
   - When selecting a new place while the drawer is already open, content in `#drawer-content` is immediately replaced, with smooth content update and list selection highlight shift.

---

## 4. Integration into `js/app.js`

In Milestone 3, `js/app.js` will instantiate `SidebarController` alongside `MarkerManager`:

```javascript
// In App._initEngineComponents() or init():
this.sidebarController = new SidebarController({
  dataProvider: this.dataProvider,
  viewportController: this.viewport,
  eventBus: this.eventBus
});
this.sidebarController.init();
```

All existing inline card rendering and drawer logic currently in `js/app.js` will be cleanly delegated to `SidebarController`.

---

## 5. Summary of Verification Methods

1. **Unit Testing**: Create `tests/test_milestone3.js` using `node:test` and `node:assert/strict` to verify:
   - `SidebarController` instantiation and DOM element caching.
   - List rendering with category and NPRNU badges.
   - Detail drawer rendering with image, metadata, and tags.
   - `place:selected` handling from both `'list'` and `'map'` sources.
   - Card auto-scroll and drawer visibility toggle.
   - Dismissal via close button and ESC key.
2. **Command**:
   ```bash
   node --test tests/test_milestone3.js
   ```
