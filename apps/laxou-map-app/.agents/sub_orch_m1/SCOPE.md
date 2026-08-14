# Scope: Milestone 1 — Data Model & Coordinate Projection Engine

## Overview
Milestone 1 establishes the foundational data layer and spatial coordinate transformation engine for the Laxou & Nancy Custom Interactive Map project.

## Components & Deliverables
1. `data.json`:
   - Comprehensive POI dataset with 18 locations in Laxou & Nancy across 5 categories (`services`, `parcs`, `culture`, `sports`, `ecoles`).
   - Must include NPRNU locations (Champ-le-Bœuf).
   - Fields: `id`, `name`, `category`, `lat`, `lng`, `address`, `description`, `image`, `tags` (array), `link` (optional/URL).
2. `js/eventBus.js`:
   - Pub/sub event bus supporting `on(event, callback)`, `off(event, callback)`, `emit(event, data)`.
3. `js/projection.js`:
   - Equirectangular projection math converting lat/lng coordinates centered on Laxou (Lat 48.6865, Lng 6.1504) to normalized (0..1) and pixel coordinates (x, y for canvas/SVG viewport).
   - Functions for forward projection (lat/lng -> x,y) and inverse projection (x,y -> lat/lng), bounding box calculation, scaling, and panning conversions.
4. `js/dataProvider.js`:
   - Data fetching (`loadData()`), schema validation/parsing, filtering by category, text search matching (name, description, tags, address), ID lookups, and event emitting on data changes.
5. Unit & Integration Tests:
   - Verification suite to test projection math, data provider filtering/search, and event bus functionality.

## Verification Requirements
- Clean execution of tests.
- 100% test coverage for projection formulas and data searching/filtering logic.
- 18 valid POI records in `data.json`.
