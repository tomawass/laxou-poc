# Scope: Milestone 3 — Interactive Marker Overlay & Selection Synchronization

## Objective
Build and verify Milestone 3 components for the Laxou & Nancy Custom Interactive Map project:
- `js/markerManager.js`: DOM marker overlay aligned with canvas projection. Dynamic creation, screen positioning via `Projection.geoToScreen()`, repositioning on `viewport:changed`, category styling & icons, NPRNU badges, hover tooltips, marker click events, and active selection state.
- `js/sidebarController.js`: Detail sidebar drawer and list UI controller. List view with category badges and NPRNU markers, detail drawer with full POI metadata (title, category, address, description, photo image, links, NPRNU badge). Bidirectional synchronization (marker click <-> sidebar detail + map recenter).
- Integration in `js/app.js`: Instantiate and wire `MarkerManager` and `SidebarController` with `Projection`, `ViewportController`, `DataProvider`, and `EventBus`.
- Comprehensive Unit Tests: `tests/test_milestone3.js` covering marker creation, coordinate placement, hover/active selection states, sidebar list & drawer rendering, and bidirectional selection synchronization.

## Work Items
| # | Component | Task | Status |
|---|-----------|------|--------|
| 1 | `js/markerManager.js` | Create DOM marker overlay manager with projection positioning, category styling, NPRNU badges, tooltips, click handlers, and active selection states | PLANNED |
| 2 | `js/sidebarController.js` | Create sidebar and detail drawer UI controller with category badges, NPRNU badges, full metadata display, and list/detail rendering | PLANNED |
| 3 | `js/app.js` Integration | Wire `MarkerManager` and `SidebarController` into `App` lifecycle and EventBus listeners | PLANNED |
| 4 | `tests/test_milestone3.js` | Unit test suite verifying MarkerManager, SidebarController, and bidirectional selection sync | PLANNED |

## Interface Contracts & Events
- `EventBus` events:
  - `viewport:changed` -> reposition DOM markers overlay
  - `place:selected` -> payload `{ placeId, place, source: 'map'|'list' }` -> highlight marker & open detail view
  - `place:hovered` -> payload `{ placeId | null }` -> hover highlight state
  - `filter:changed` -> payload `{ categoryId, query }` or update markers visibility
  - `drawer:toggled` -> payload `{ isOpen }`
