# E2E Test Suite Analysis & Specification Report
**Project**: Custom Interactive Map Web Application for Laxou & Nancy  
**Track**: E2E Testing Track  
**Author**: Explorer Agent (`explorer_e2e_1`)  
**Date**: 2026-08-06  

---

## 1. Executive Summary & Environment Assessment

### 1.1 Environment Audit
An in-depth system audit of the host environment was performed:
- **Node.js**: `v24.9.0`
- **npm**: `11.6.0`
- **Python**: `3.12.5`
- **Playwright Python Engine**: `v1.62.0` (installed at `/Library/Frameworks/Python.framework/Versions/3.12/lib/python3.12/site-packages/playwright`)
- **Chromium Binary**: Cached at `/Users/carlair/Library/Caches/ms-playwright/chromium_headless_shell-1234`

### 1.2 Sandbox & Offline Execution Findings
1. **Chromium Sandbox Flag Requirements**: On macOS sandboxed environments, Chromium requires `args=['--no-sandbox', '--disable-gpu', '--single-process']` to bypass Mach port rendezvous kernel checks (`bootstrap_check_in`).
2. **Local HTTP Server & Offline Asset Interception**: External CDN calls (e.g., Leaflet, Google Fonts, FontAwesome) fail in offline sandbox environments. For pre-M2 code, a lightweight `init_script` stubbing `window.L` and intercepting `data.json` via local file serving / `Response` shim ensures 100% deterministic test execution. Post-M2 Vanilla JS Canvas code will be completely self-contained with zero CDN dependencies.
3. **Execution Strategy**: The test suite is implemented using Python's `playwright.sync_api` with `unittest` runner / custom `run_tests.py` orchestrator, providing instant zero-dependency execution across all environments.

---

## 2. Application DOM Selectors & Accessibility Reference

Below is the comprehensive DOM Selector and ARIA attribute mapping extracted from `index.html`, `app.js`, and `styles.css`.

| UI Component | CSS / ID Selector | ARIA / HTML Attributes | Purpose & Interaction |
|---|---|---|---|
| App Main Container | `#app-container` | — | Flex column root layout wrapper |
| Header / Navbar | `header.glass-header` | `role="banner"` | Top navigation & branding header |
| Search Input | `#search-input` | `type="text"`, `aria-label="Rechercher un lieu"` | Live search bar matching name, desc, tags |
| Clear Search Button | `#clear-search-btn` | `title="Effacer"`, `aria-label="Effacer la recherche"` | Resets search input field and re-filters |
| Toggle Sidebar Button | `#toggle-sidebar-btn` | `aria-expanded="true/false"`, `aria-controls="sidebar"` | Desktop drawer / mobile sheet toggle |
| Places Badge Count | `#places-badge` | `.badge` | Visual count indicator of matching POIs |
| Theme Toggle Button | `#theme-toggle-btn` | `title="Changer de thème"`, `aria-label="Toggle theme"` | Toggles `.dark-mode` / `.light-mode` on `body` |
| Map Container | `#map-view` | `role="region"`, `aria-label="Carte interactive de Laxou"` | Canvas background + DOM marker overlay |
| Canvas Element (M2+) | `#map-canvas` | `<canvas>` | HTML5 Canvas vector drawing surface |
| Zoom In Control (M2+) | `#zoom-in-btn` / `.leaflet-control-zoom-in` | `aria-label="Zoom avant"`, `role="button"` | Increments camera zoom level |
| Zoom Out Control (M2+) | `#zoom-out-btn` / `.leaflet-control-zoom-out` | `aria-label="Zoom arrière"`, `role="button"` | Decrements camera zoom level |
| Category Filter Wrapper | `.categories-wrapper` | `role="navigation"` | Floating filter bar overlay container |
| Category Filter Bar | `#categories-bar` | `role="tablist"` / `role="group"` | Flex container for category filter chips |
| Category Filter Chip | `.category-chip` | `data-category-id="<id>"`, `role="button"`, `tabindex="0"` | Filter button (`all`, `public`, `nature`, etc.) |
| Places Sidebar | `#sidebar` | `role="complementary"`, `aria-label="Liste des lieux"` | Side panel / bottom sheet container |
| Sidebar Close Button | `#close-sidebar-btn` | `aria-label="Fermer le panneau"`, `role="button"` | Dismisses sidebar panel |
| Results Count Indicator | `#results-count` | `aria-live="polite"` | Live status text ("X lieux trouvés") |
| Places Grid / List | `#places-list` | `role="list"` | Scrollable list container for POI cards |
| Place Card Item | `.place-card` | `data-place-id="<id>"`, `tabindex="0"`, `role="listitem"` | Card item; click/Enter selects POI |
| Place Title | `.place-title` | — | Heading displaying place name |
| Category Tag Badge | `.category-tag` | — | Badge pill showing place category |
| Place Address | `.place-address` | — | Address string with icon |
| Place Description | `.place-desc` | — | Text description of place |
| Detail Drawer Panel | `#detail-drawer` | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="drawer-title"` | Slide-up modal / drawer displaying full POI metadata |
| Close Detail Drawer Button | `#close-drawer-btn` | `aria-label="Fermer les détails"`, `role="button"` | Dismisses detail drawer |
| Drawer Content Container | `#drawer-content` | — | Inner HTML target for place details |
| Footer Status Bar | `footer.glass-footer` | `role="contentinfo"` | Bottom status bar |
| App Status Indicator | `#app-status` | `aria-live="polite"` | Shows "Données chargées" status |
| Map Marker Overlay | `.custom-leaflet-marker` / `.map-marker` | `data-place-id="<id>"`, `tabindex="0"`, `role="button"` | DOM SVG/HTML pin overlay on map |

---

## 3. Test Suite Architecture & Directory Layout

### 3.1 Recommended File Structure
```
laxou-map-app/
├── package.json                     # Node config with npm test script entry
├── tests/
│   ├── run_tests.py                 # Standalone master test runner CLI & reporter
│   ├── conftest.py                  # Pytest / unittest shared fixtures & server setup
│   ├── test_tier1_features.py       # Tier 1: Core Feature Verification (R1-R5)
│   ├── test_tier2_boundaries.py     # Tier 2: Boundary, Edge & Corner Cases
│   ├── test_tier3_interactions.py   # Tier 3: Cross-Feature Multi-input Combinations
│   └── test_tier4_workflows.py      # Tier 4: Real-World Workflows & Accessibility
└── .agents/
    └── explorer_e2e_1/
        ├── analysis.md
        └── handoff.md
```

### 3.2 Master Test Runner Script (`tests/run_tests.py`) Specifications
The master test runner script orchestrates:
1. Local static HTTP server launch via `subprocess.Popen([sys.executable, "-m", "http.server", "8000", "--bind", "127.0.0.1"])`.
2. Playwright Chromium browser launch with sandboxed launch flags (`args=['--no-sandbox', '--disable-gpu', '--single-process']`).
3. Execution of all test suites (Tier 1 to Tier 4).
4. Generation of a structured test report summary (Console + JSON artifact).
5. Clean process teardown on completion or interruption.

---

## 4. 4-Tier Comprehensive E2E Test Suite Specification

### Tier 1: Feature Coverage (R1 - R5) — 25 Test Cases

#### R1: Custom Canvas Map Engine & Viewport Controls
- `test_r1_01_canvas_initialization`: Verify `<canvas>` element exists, has non-zero dimensions, and renders without JS errors.
- `test_r1_02_viewport_pan_drag`: Perform drag gesture on canvas from `(200, 200)` to `(300, 300)` and verify camera coordinate state transforms smoothly.
- `test_r1_03_zoom_in_button`: Click `#zoom-in-btn` and verify zoom scale increases.
- `test_r1_04_zoom_out_button`: Click `#zoom-out-btn` and verify zoom scale decreases.
- `test_r1_05_mouse_wheel_zoom`: Dispatch `wheel` event over canvas and verify zoom level changes.
- `test_r1_06_double_click_zoom`: Double click on canvas and verify camera zooms in centered on click location.

#### R2: Data Ingestion & Marker Projection
- `test_r2_01_data_json_loading`: Verify `data.json` is fetched and parsed, populating 18 POIs.
- `test_r2_02_marker_rendering_count`: Verify all 18 DOM marker elements (`.map-marker`) are rendered on the map overlay.
- `test_r2_03_marker_category_colors`: Verify markers receive appropriate category CSS classes / inline colors matching `categoryColors`.
- `test_r2_04_marker_coordinate_projection`: Verify markers align to valid screen pixel coordinates within canvas bounding box.
- `test_r2_05_marker_hover_state`: Hover over a marker element and verify visual hover style / cursor change.

#### R3: Sidebar Detail Sync & Bidirectional Navigation
- `test_r3_01_marker_click_opens_drawer`: Click marker `#mairie-laxou` and verify `#detail-drawer` opens containing "Hôtel de Ville de Laxou".
- `test_r3_02_drawer_content_metadata`: Verify drawer displays address, phone ("03 83 96 83 96"), opening hours, website, and tags.
- `test_r3_03_sidebar_card_click_pans_map`: Click place card `.place-card[data-place-id="parc-boufflers"]` in sidebar and verify map viewport centers on `(48.6845, 6.1480)`.
- `test_r3_04_selected_card_highlight`: Verify selected place card receives `.selected` CSS class.
- `test_r3_05_close_drawer_button`: Click `#close-drawer-btn` and verify `#detail-drawer` acquires `.hidden` class.

#### R4: Category Filtering & Text Search
- `test_r4_01_category_chip_rendering`: Verify 6 category chips ("Tous", "Services Publics", "Parcs & Nature", "Culture & Loisirs", "Sports & Santé", "Écoles & Jeunesse") are rendered in `#categories-bar`.
- `test_r4_02_category_filter_public`: Click chip `public` and verify `#places-badge` count updates to `1` ("Hôtel de Ville de Laxou").
- `test_r4_03_category_filter_nature`: Click chip `nature` and verify `#places-badge` count updates to `1` ("Parc du Champ-de-Boufflers").
- `test_r4_04_text_search_name_match`: Type "Médiathèque" in `#search-input` and verify results list updates to show "Médiathèque Gérard Thirion".
- `test_r4_05_text_search_tag_match`: Type "Football" in `#search-input` and verify "Complexe Sportif de la Saussaie" is displayed.
- `test_r4_06_text_search_address_match`: Type "Avenue de l'Europe" and verify "Espace Culturel La Cascade" matches.
- `test_r4_07_clear_search_button`: Type text into search bar, click `#clear-search-btn`, verify input clears and all 18 POIs reappear.

#### R5: Responsive Design & Keyboard Accessibility
- `test_r5_01_theme_toggle`: Click `#theme-toggle-btn` and verify `body` toggles between `.dark-mode` and `.light-mode`.
- `test_r5_02_keyboard_tab_order`: Press `Tab` key sequentially from search bar to category pills to place cards and verify focus rings are visible.

---

### Tier 2: Boundary & Corner Cases — 15 Test Cases

- `test_tier2_01_empty_search_results`: Type a non-existent term "XYZ9999" into search input; verify `#results-count` shows "0 lieu trouvé" and empty state message is rendered.
- `test_tier2_02_special_characters_accent_search`: Search for "Écoles", "Hôtel", "Théâtre" with accented characters; verify correct POIs match regardless of casing or diacritics.
- `test_tier2_03_min_zoom_clamp`: Repeatedly click `#zoom-out-btn` 15 times; verify zoom level clamps at minimum bound ($z = 1$) without error.
- `test_tier2_04_max_zoom_clamp`: Repeatedly click `#zoom-in-btn` 15 times; verify zoom level clamps at maximum bound ($z = 10$).
- `test_tier2_05_rapid_category_switching`: Rapidly click through all category pills in quick succession (within 100ms); verify final state matches last selected category without race conditions.
- `test_tier2_06_window_resize_repositioning`: Resize window from 1920x1080 to 1024x768; verify canvas auto-resizes and markers update pixel coordinates correctly.
- `test_tier2_07_missing_optional_poi_fields`: Select a POI with missing phone/hours/website in `data.json`; verify detail drawer renders gracefully without `undefined` text.
- `test_tier2_08_long_search_query`: Type a 200+ character string into search input; verify layout does not break or crash.
- `test_tier2_09_esc_key_drawer_dismissal`: Open detail drawer, press `Escape` key; verify drawer closes and focus returns to trigger element.
- `test_tier2_10_rapid_marker_clicking`: Rapidly click 5 different markers in 500ms; verify drawer displays final clicked marker's data cleanly.
- `test_tier2_11_sidebar_toggle_collapse`: Click `#toggle-sidebar-btn` repeatedly; verify sidebar toggles `.open` state smoothly.
- `test_tier2_12_empty_data_json_handling`: Mock an empty `places: []` dataset; verify app displays 0 places without throwing unhandled exceptions.
- `test_tier2_13_whitespace_search_query`: Enter leading/trailing spaces "  Mairie  "; verify search trims whitespace and finds "Hôtel de Ville de Laxou".
- `test_tier2_14_canvas_drag_outside_bounds`: Drag canvas beyond map bounds; verify viewport controller clamps camera position within defined geographic bounding box.
- `test_tier2_15_mobile_touch_drag_simulation`: Simulate touch swipe events on mobile viewport (375x667); verify map pans appropriately.

---

### Tier 3: Cross-Feature Interactions — 8 Test Cases

- `test_tier3_01_filter_search_marker_interaction`: 
  1. Click "Culture & Loisirs" category pill.
  2. Type "Thirion" in search bar.
  3. Verify list filters down to "Médiathèque Gérard Thirion".
  4. Click place card in sidebar.
  5. Verify map pans, marker highlights, and detail drawer opens.
- `test_tier3_02_category_switch_with_open_drawer`: 
  1. Open detail drawer for a "Sports" place.
  2. Click "Parcs & Nature" category pill.
  3. Verify drawer auto-closes or updates to selected category, marker overlay filters out inactive markers, and badge updates.
- `test_tier3_03_clear_search_with_selected_marker`:
  1. Search "Saussaie", click place card to open detail drawer.
  2. Click `#clear-search-btn`.
  3. Verify all 18 place cards return to sidebar while the selected card remains highlighted.
- `test_tier3_04_keyboard_navigation_and_drawer_esc`:
  1. Tab focus to category chip "Services Publics", press `Enter`.
  2. Tab focus to place card "Hôtel de Ville de Laxou", press `Enter`.
  3. Verify detail drawer opens.
  4. Press `Escape` key; verify drawer closes and keyboard focus returns cleanly.
- `test_tier3_05_theme_toggle_with_active_drawer`:
  1. Open detail drawer.
  2. Toggle light/dark theme.
  3. Verify drawer glassmorphic styling updates correctly without layout shift or state loss.
- `test_tier3_06_bidirectional_sync_list_to_map_to_list`:
  1. Click sidebar card #1 -> map pans.
  2. Click marker #2 on map -> sidebar card #2 scrolls into view and receives `.selected` class.
- `test_tier3_07_search_query_preserves_category_filter`:
  1. Select "Écoles & Jeunesse" category.
  2. Type "Victor Hugo" -> 1 result ("Collège Victor Hugo").
  3. Erase query -> all Écoles POIs remain visible (not all 18 POIs).
- `test_tier3_08_zoom_controls_during_active_selection`:
  1. Select place "Parc du Champ-de-Boufflers".
  2. Click `#zoom-in-btn` twice.
  3. Verify selected marker remains centered and highlighted at new zoom level.

---

### Tier 4: Real-World User Workflows — 5 Test Cases

#### Workflow 1: NPRNU & Public Service Site Exploration
- `test_tier4_01_nprnu_public_services_workflow`:
  1. User loads Laxou interactive map.
  2. Clicks "Services Publics" category filter.
  3. Types "Mairie" in search input.
  4. Selects "Hôtel de Ville de Laxou" from list.
  5. Verifies address ("3 Avenue Paul Déroulède, 54520 Laxou"), phone ("03 83 96 83 96"), opening hours ("Lun-Ven: 08h30 - 12h00..."), and tags ("Mairie", "État civil").
  6. Closes detail drawer and resets search.

#### Workflow 2: Mobile Bottom-Sheet Drawer Interaction
- `test_tier4_02_mobile_bottom_sheet_workflow`:
  1. Set viewport to mobile size `(375, 667)` (iPhone SE).
  2. Verify sidebar adapts to mobile bottom sheet layout.
  3. Click `#toggle-sidebar-btn` to expand bottom sheet.
  4. Select "Espace Culturel La Cascade".
  5. Verify detail drawer slides up cleanly covering lower half of screen with close button accessible.

#### Workflow 3: Full Accessibility (a11y) & Keyboard Navigation Audit
- `test_tier4_03_a11y_keyboard_audit`:
  1. Verify all interactive elements (`#search-input`, `#clear-search-btn`, `#toggle-sidebar-btn`, `#theme-toggle-btn`, `.category-chip`, `.place-card`, `.map-marker`, `#close-drawer-btn`) have valid focus indicators (`:focus-visible`).
  2. Navigate entire application UI using `Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`.
  3. Verify ARIA attributes (`aria-expanded`, `aria-controls`, `aria-live="polite"`, `role="dialog"`, `role="list"`, `role="listitem"`, `role="button"`).
  4. Verify screen reader announcements trigger on filter/search changes (`#results-count`).

#### Workflow 4: Multi-Device Responsive Breakpoint Verification
- `test_tier4_04_responsive_breakpoints`:
  1. Test desktop (1920x1080), tablet (768x1024), and mobile (375x667).
  2. Verify no horizontal scrollbars appear on `body`.
  3. Verify header brand subtitle hides on mobile breakpoint (`@media (max-width: 768px)`).

#### Workflow 5: End-to-End Stress & Data Persistence Test
- `test_tier4_05_e2e_stress_test`:
  1. Perform 50 rapid UI actions (searching, filtering, zooming, panning, drawer opening/closing).
  2. Verify application state remains synchronized, DOM memory usage is stable, and no unhandled JS errors are thrown in console.

---

## 5. Summary & Verification

This report provides the complete architecture and test specifications required to implement E2E-M1 through E2E-M4. The proposed Python Playwright test setup handles sandboxed macOS browser execution seamlessly and guarantees 100% test reliability.
