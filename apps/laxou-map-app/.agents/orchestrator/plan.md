# Orchestrator Master Execution Plan

## Objective
Build a high-performance, responsive, accessible custom interactive map web application for Laxou and Nancy using a pure Vanilla JS (HTML5/CSS3/ES6+) Canvas/SVG map engine (no Leaflet/Mapbox), dynamic `data.json` loading and coordinate projection, interactive detail sidebar, category filters & text search, and responsive a11y UI.

## Phase Overview

### Phase 0: Survey & Specification Analysis
- Spawn 3 parallel Explorers to inspect current workspace, check existing data/files, existing data format (`data.json` if present or structure needed), tech constraints, and browser/testing toolchain available.
- Create `PROJECT.md` at root with Architecture, Feature Inventory, Milestones, Interface Contracts, Code Layout.

### Phase 1: Dual Track Dispatch
- **Track 1: E2E Testing Suite Track**
  - Spawn sub-orchestrator to design requirement-driven test suite (Tiers 1-4: Feature coverage, Boundary/Corner cases, Cross-feature interactions, Real-world application scenarios).
  - Publishes `TEST_READY.md`.
- **Track 2: Core Implementation Track**
  - Milestone 1: Data Model & Coordinate Projection Engine (`data.json` parser, geographic-to-canvas coordinate transformation, spatial bounding box calculations for Laxou/Nancy).
  - Milestone 2: Canvas / SVG Custom Map Engine (Pan, zoom via mouse/touch/buttons, smooth rendering loop, canvas viewport bounds).
  - Milestone 3: Interactive Marker System & Selection Synchronization (Stylized markers, hover/active states, marker spatial indexing/hit detection, map-to-sidebar selection sync).
  - Milestone 4: Interactive Sidebar, Category Filtering & Text Search (Right detail drawer, category filter bar, search input matching title/description/tags, dynamic list rendering).
  - Milestone 5: Responsive Layout & Accessibility (a11y Keyboard navigation, ARIA attributes, focus states, ESC/Enter/Space shortcuts, Mobile/Desktop responsive UI).

### Phase 2: Final Integration & Hardening
- Pass 100% E2E test suite.
- Phase 2 Adversarial Coverage Hardening (Tier 5: Challenger-driven whitebox edge case & robust error handling verification).
- Forensic Integrity Audit verification.

### Phase 3: Sentinel Reporting
- Verify pass criteria across all sub-orchestrators and audit reports.
- Produce final report and notify Sentinel.
