# Scope: E2E Testing Track

## Architecture
Opaque-box, requirement-driven E2E test suite built with Playwright (Node.js or Python). Serves as automated test harness for the Laxou & Nancy Custom Interactive Map application.
Local static server dependency: `python3 -m http.server 8000`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Custom Canvas Map Engine | Pure Vanilla JS 2D Canvas rendering without Leaflet/Mapbox/OpenLayers | Tier 1 | R1 |
| 2 | Fluid Drag & Pan | Smooth pan gesture handling via pointer events | Tier 1 | R1 |
| 3 | Multi-input Zoom | Zoom via mouse wheel, +/- controls, double click | Tier 1 | R1 |
| 4 | Responsive Canvas Resizing | Auto-resizing to container bounds with DPR scaling | Tier 1 / Tier 2 | R1 |
| 5 | Dynamic `data.json` Ingestion | Dynamic fetch & parse of Laxou/Nancy POIs & NPRNU data | Tier 1 | R2 |
| 6 | Coordinate Projection | Accurate lat/lng to pixel coordinate transformation | Tier 1 | R2 |
| 7 | Stylized Marker Overlay | SVG/HTML marker elements with category icons & active states | Tier 1 | R2 |
| 8 | Interactive Detail Sidebar | Responsive side drawer displaying full POI metadata | Tier 1 | R3 |
| 9 | Bidirectional Selection Sync | Selecting marker centers map & opens sidebar; selecting list item highlights marker & pans map | Tier 1 / Tier 3 | R3 |
| 10 | Category Filter Bar | Multi-category filter pills (Services publics, Parcs, Culture, Sports, Écoles) | Tier 1 / Tier 3 | R4 |
| 11 | Real-time Text Search | Reactive search matching names, descriptions, tags, addresses | Tier 1 / Tier 2 / Tier 3 | R4 |
| 12 | Responsive Mobile Layout | Desktop sidebar + Mobile bottom sheet / tab toggle | Tier 1 / Tier 4 | R5 |
| 13 | Full Keyboard Accessibility | Full keyboard nav, visible focus rings, Enter/Space select, ESC close, ARIA attributes | Tier 1 / Tier 4 | R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E-M1 | Framework Infra & Tier 1 Feature Coverage | Playwright setup, server scripts, Tier 1 test cases (25+ tests for R1-R5) | None | IN_PROGRESS |
| E2E-M2 | Tier 2 Boundary & Corner Cases | Empty search, zoom limits, resize, quick toggles (25+ tests) | E2E-M1 | PLANNED |
| E2E-M3 | Tier 3 Cross-Feature Interactions | Filter + Search + Marker Click + Keyboard nav combined tests (5+ complex tests) | E2E-M1, E2E-M2 | PLANNED |
| E2E-M4 | Tier 4 Real-World User Workflows & Publication | NPRNU site exploration, mobile bottom sheet, a11y audit, TEST_INFRA.md, TEST_READY.md | E2E-M1..M3 | PLANNED |

## Interface Contracts
- Application URL: `http://localhost:8000`
- Test Runner Command: `npm test` or `pytest` / custom test runner script
- Artifacts: `TEST_INFRA.md` & `TEST_READY.md`
