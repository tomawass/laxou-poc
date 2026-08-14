## 2026-08-06T12:11:35Z
You are Worker 1 for Milestone 1 (Data Model & Coordinate Projection Engine) of the Laxou & Nancy Custom Interactive Map project.

Your working directory is: /Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/worker_m1
Project workspace root: /Users/carlair/.gemini/antigravity/scratch/laxou-map-app
Scope document: /Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/sub_orch_m1/SCOPE.md
Project document: /Users/carlair/.gemini/antigravity/scratch/laxou-map-app/PROJECT.md
Original request: /Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/ORIGINAL_REQUEST.md

Explorer handoffs to review:
- Explorer 1 (Data Model & POIs): /Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m1_1/handoff.md
- Explorer 2 (Projection Math): /Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m1_2/handoff.md
- Explorer 3 (EventBus, DataProvider & Tests): /Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m1_3/handoff.md

Exclusive Write Ownership:
- `data.json`
- `js/eventBus.js`
- `js/projection.js`
- `js/dataProvider.js`
- `package.json`
- `tests/test_milestone1.js` (or similar unit test files under `tests/`)

Task & Requirements:
1. Ensure `package.json` exists in project root with `"type": "module"`.
2. Construct `data.json`:
   - Must contain exactly 18 POIs across 5 categories (`services`, `parcs`, `culture`, `sports`, `ecoles`).
   - Must include NPRNU locations in Laxou (Champ-le-Bœuf).
   - Fields for each POI: id, name, category, lat, lng, address, description, image, tags, link.
3. Implement `js/eventBus.js`:
   - Lightweight ES6 class or module implementing pub/sub with `on(event, callback)`, `off(event, callback)`, `emit(event, data)`.
   - Returns unsubscribe handle or function from `on()`.
4. Implement `js/projection.js`:
   - Class `Projection` implementing Localized Equirectangular Projection with Cosine Latitude Scaling centered on Laxou ($\phi_0 = 48.6865^\circ, \lambda_0 = 6.1504^\circ$).
   - Standard interface: `geoToWorld(lat, lng)`, `worldToScreen(worldX, worldY, viewport)`, `geoToScreen(lat, lng, viewport)`, `screenToGeo(screenX, screenY, viewport)`.
   - Defensive checks for invalid input and zero bounds.
5. Implement `js/dataProvider.js`:
   - Class `DataProvider` implementing `loadData(urlOrPath)`, `getPlaces()`, `filterPlaces(categoryId, searchQuery)`, `getPlaceById(id)`, `getCategories()`.
   - Support accent-insensitive search (`normalizeText()`) matching name, description, tags, and address.
6. Create comprehensive unit tests in `tests/test_milestone1.js` covering projection identity roundtrips, eventBus pub/sub, dataset validation, filtering, and accent-insensitive search.
7. Execute unit tests (`node --test tests/test_milestone1.js` or `node tests/test_milestone1.js`) using `run_command`. Verify all tests pass with 0 exit code.
8. Document execution commands and test output in your handoff report at `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/worker_m1/handoff.md`.
