# Analysis Report: EventBus, DataProvider & Non-Browser Unit Test Strategy (Milestone 1)

**Agent**: Explorer 3 (Milestone 1)  
**Working Directory**: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m1_3`  
**Date**: 2026-08-06  

---

## 1. Executive Summary

Milestone 1 establishes the foundational data, communication, and coordinate transformation layer for the Laxou & Nancy Custom Interactive Map application. This analysis provides the detailed specification and implementation design for:
1. **`js/eventBus.js`**: A decoupled, publish/subscribe event handling utility.
2. **`js/dataProvider.js`**: An async data fetching, validation, indexing, and multi-criteria searching engine supporting dual environment execution (Browser `fetch` vs. Node `fs/promises`).
3. **Unit Test Strategy**: A native, zero-dependency unit test runner utilizing Node.js built-in `node:test` and `node:assert/strict` modules to achieve 100% test coverage across non-browser components (`eventBus.js`, `dataProvider.js`, `projection.js`).

---

## 2. Component Specification: `js/eventBus.js`

### 2.1 Architecture & Design

`EventBus` provides event-driven decoupling between application modules (e.g., `DataProvider` firing `data:loaded`, `FilterSearchController` emitting `filter:changed`, `ViewportController` emitting `viewport:changed`).

```javascript
// Interface Blueprint
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
  }

  on(event, callback) { ... }
  off(event, callback) { ... }
  emit(event, data) { ... }
  once(event, callback) { ... }
  clear() { ... }
}

export const defaultEventBus = new EventBus();
```

### 2.2 Key Implementation Details

1. **Storage Structure**: Uses `Map<string, Set<Function>>`.
   - Using a `Set` ensures duplicate callback registrations for the same event are ignored ($O(1)$ lookup and delete).
2. **Unsubscribe Ergonomics**: `on(event, callback)` returns an anonymous unsubscribe function `() => off(event, callback)`. This allows controllers to store clean unsubscribe handles during component teardown.
3. **Safe Iteration Snapshot**: `emit(event, data)` creates an array snapshot (`Array.from(callbacks)`) before iteration. If a callback calls `off()` during emit execution, it will not corrupt or break the iteration loop.
4. **Fault Tolerance**: Each callback invocation is wrapped in a `try...catch` block. An unhandled exception inside a listener is logged via `console.error` and will NOT prevent remaining listeners from executing.
5. **Standard Event Contracts**:
   - `data:loaded`: `{ places, categories, bounds }`
   - `viewport:changed`: `{ x, y, zoom }`
   - `place:selected`: `{ placeId, source }`
   - `place:hovered`: `{ placeId }`
   - `filter:changed`: `{ categoryId, query }`
   - `drawer:toggled`: `{ isOpen }`

---

## 3. Component Specification: `js/dataProvider.js`

### 3.1 Architecture & Design

`DataProvider` manages the lifecycle of `data.json`: fetching, parsing, schema validation, array indexing, and reactive search queries.

```javascript
// Interface Blueprint
export class DataProvider {
  constructor(eventBus = null) {
    this.eventBus = eventBus;
    this.places = [];
    this.categories = [];
    this.bounds = null;
    this.isLoaded = false;
  }

  async loadData(source = './data.json') { ... }
  getPlaces() { ... }
  getPlaceById(id) { ... }
  getCategories() { ... }
  filterPlaces(categoryId, searchQuery) { ... }
}
```

### 3.2 Key Implementation Details

1. **Dual Environment Loading (`_fetchOrReadFile`)**:
   - **Browser**: Executed via standard asynchronous `fetch(url)`.
   - **Node.js**: Executed during non-browser unit tests. When running under Node (`typeof process !== 'undefined' && process.versions.node`), `loadData` dynamically imports `node:fs/promises` and `node:path` to resolve and read relative paths directly from the filesystem.
   - **Direct Object Injection**: `loadData` accepts raw JSON objects directly (e.g. `loadData({ categories: [...], places: [...] })`), facilitating fast mock testing without I/O overhead.

2. **French Text Normalization (`_normalizeText`)**:
   - Accents and diacritics in French text (e.g. `é`, `è`, `ê`, `à`, `ç`, `œ`) are stripped using Unicode normalization:
     ```javascript
     _normalizeText(str) {
       if (!str) return '';
       return str
         .normalize('NFD')
         .replace(/[\u0300-\u036f]/g, '')
         .toLowerCase();
     }
     ```
   - This ensures query `"cedre"` matches `"Tour Cèdre"`, `"ecole"` matches `"Écoles"`, and `"boeuf"` matches `"Champ-le-Bœuf"`.

3. **Filter & Search Execution Pipeline (`filterPlaces`)**:
   - **Step 1: Category Filter**: If `categoryId` is provided and is not `'all'` or empty, filter places by exact match on `place.category === categoryId`.
   - **Step 2: Multi-Field Search**: If `searchQuery` is provided and non-empty, test normalized query substring against:
     - `place.name`
     - `place.description`
     - `place.address`
     - `place.tags` (using `.some()`)
   - Returns a fresh array of matching POI objects.

4. **Event Bus Integration**:
   - Upon successful completion of `loadData()`, if an `eventBus` instance was provided, emit `data:loaded`.

---

## 4. Technical Specification: Non-Browser Unit Testing Framework

### 4.1 Native Environment Strategy

- **Runtime**: Node.js v24.9.0 (verified native support).
- **Test Runner**: Node.js built-in runner `node:test` (`import { test, describe, it } from 'node:test'`).
- **Assertion Library**: Node.js built-in `node:assert/strict` (`import assert from 'node:assert/strict'`).
- **Module Configuration**: `package.json` with `"type": "module"` enabling direct ES module imports (`import { EventBus } from '../js/eventBus.js'`).
- **Execution Command**: `npm test` or `node --test tests/**/*.test.js`.

### 4.2 Benefits over External Frameworks

1. Zero third-party `npm` dependencies (no Jest, Vitest, Mocha required).
2. Extremely fast startup and execution (< 100ms total suite runtime).
3. Direct execution of native ES modules without transpilations, bundlers, or Babel transformers.

---

## 5. Detailed Test Matrix

### 5.1 `tests/eventBus.test.js`
| Test Case | Method / Scenario | Expected Outcome |
|---|---|---|
| Subscriber registration | `on('test', fn)` | Callback added to event listeners map |
| Event emission | `emit('test', { data: 123 })` | Callback called with `{ data: 123 }` |
| Specific unsubscription | `off('test', fn1)` | `fn1` removed, `fn2` remains active |
| All unsubscription | `off('test')` | All listeners for `'test'` deleted |
| Return handler unsubscribe | `const unbinding = on('test', fn); unbinding()` | Callback unsubscribed cleanly |
| One-time listener | `once('test', fn)` | Fires on first emit, unbinds automatically for second emit |
| Fault isolation | Callback throws error inside `emit` | Error logged, remaining callbacks still execute |
| Unregistered event emit | `emit('non_existent')` | Safe execution without throwing |

### 5.2 `tests/dataProvider.test.js`
| Test Case | Method / Scenario | Expected Outcome |
|---|---|---|
| Direct object loading | `loadData(mockObject)` | `places` and `categories` loaded and formatted |
| File path loading in Node | `loadData('./data.json')` | Reads and parses file via `node:fs/promises` |
| Schema validation | Missing `places` or `categories` | Throws descriptive validation `Error` |
| Place lookup | `getPlaceById('p1')` | Returns exact POI object; returns `null` for unknown ID |
| Category filter | `filterPlaces('services')` | Returns only POIs matching category `'services'` |
| Text search in name | `filterPlaces(null, 'Mairie')` | Matches "Mairie de Laxou" |
| Text search in tags | `filterPlaces(null, 'NPRNU')` | Matches all NPRNU tagged POIs (e.g. Tour Cèdre) |
| Accent-insensitive search | `filterPlaces(null, 'cedre')` | Matches "Tour Cèdre" |
| Case-insensitive search | `filterPlaces(null, 'LAXOU')` | Matches places containing "Laxou" |
| Combined category + query | `filterPlaces('parcs', 'champ')` | Filters category first, then applies search query |
| Event emission | `loadData()` with `eventBus` | Emits `data:loaded` payload on eventBus |

### 5.3 `tests/projection.test.js`
| Test Case | Method / Scenario | Expected Outcome |
|---|---|---|
| Geo to World center | `geoToWorld(48.6865, 6.1504)` | Returns normalized world coordinates |
| Latitude cosine scaling | Cosine math verification | Verifies $\cos(48.6865^\circ) \approx 0.66018$ longitude compression factor |
| Geo to Screen | `geoToScreen(lat, lng, viewport)` | Transforms to canvas pixel coordinates |
| Screen to Geo inverse | `screenToGeo(x, y, viewport)` | Inverts screen pixel coordinate back to lat/lng |
| Roundtrip accuracy | `screenToGeo(geoToScreen(lat, lng))` | Lat/lng matches original within $\pm 10^{-6}$ degrees |
| Out of bounds handling | Lat/Lng beyond map boundary | Clamps or handles safely without NaN values |

---

## 6. Proposed Code Layout & Files to Create

```
laxou-map-app/
├── package.json               # Root ES Module config & npm test script
├── js/
│   ├── eventBus.js            # Pub/sub EventBus implementation
│   ├── dataProvider.js        # DataProvider class with Node/browser dual loading & search
│   └── projection.js          # Equirectangular coordinate projection math
└── tests/
    ├── eventBus.test.js       # Node:test suite for EventBus
    ├── dataProvider.test.js   # Node:test suite for DataProvider
    └── projection.test.js     # Node:test suite for Projection
```

---

## 7. Verification Method for Implementer

1. Run `npm test` or `node --test tests/**/*.test.js`.
2. Inspect output to ensure all test suites (`eventBus.test.js`, `dataProvider.test.js`, `projection.test.js`) pass cleanly with 0 failures.
