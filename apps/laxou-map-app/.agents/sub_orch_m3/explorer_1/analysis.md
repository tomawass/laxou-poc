# Technical Analysis: Interactive Marker Overlay & Selection Synchronization (Milestone 3)

**Author**: Explorer 1  
**Milestone**: M3 — Interactive Marker Overlay & Selection Synchronization  
**Target Module**: `js/markerManager.js`  
**Related Components**: `js/projection.js`, `js/viewport.js`, `js/dataProvider.js`, `js/eventBus.js`, `js/app.js`, `index.html`, `styles.css`  

---

## Executive Summary
This document provides a comprehensive technical investigation and architecture specification for `js/markerManager.js`, which implements the interactive DOM/SVG marker layer for the Laxou & Nancy custom interactive map. `MarkerManager` creates and manages HTML/SVG marker elements inside `#marker-overlay`, maps geographic coordinates (`lat`, `lng`) to pixel positions using `Projection.geoToScreen()`, efficiently updates marker transform positions on viewport changes without DOM destruction, renders category-specific icons and NPRNU badges, handles hover tooltips and selection states (pulse halo, scaling, z-index elevation), and synchronizes selections bidirectionally via `EventBus`.

---

## Detailed Investigation Findings

### 1. Projection Math & Screen Pixel Conversion
* **Source**: `js/projection.js` (lines 138–236) & `js/viewport.js` (lines 44–53, 365–369).
* **Mechanism**:
  1. `geoToWorld(lat, lng)`: Converts geographic coordinates `(lat, lng)` into normalized world coordinates `(wx, wy) ∈ [0, 1] × [0, 1]`:
     $$\text{wx} = \frac{\text{lng} - \text{minLng}}{\Delta\text{lng}}$$
     $$\text{wy} = \frac{\text{maxLat} - \text{lat}}{\Delta\text{lat}}$$
  2. `worldToScreen(wx, wy, viewportState)`: Translates normalized world coordinates to screen pixel coordinates `(screenX, screenY)` relative to `#map-view` container:
     $$\text{screenX} = (\text{wx} - 0.5) \cdot \text{baseWidth} \cdot \text{zoom} + \frac{\text{width}}{2} + \text{panX}$$
     $$\text{screenY} = (\text{wy} - 0.5) \cdot \text{baseHeight} \cdot \text{zoom} + \frac{\text{height}}{2} + \text{panY}$$
  3. `geoToScreen(lat, lng, viewportState)` executes both steps sequentially.
* **Overlay Alignment**:
  * `#marker-overlay` is styled with `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;` inside `#map-view`.
  * Therefore, `(screenX, screenY)` returned by `geoToScreen()` corresponds exactly to pixel coordinates in `#marker-overlay`.
  * **Anchor Point**: For a classic teardrop pin, the tip points at `(screenX, screenY)`. Applying CSS `transform: translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -100%)` anchors the bottom-center tip of the pin precisely onto the geographical coordinate.

---

### 2. DOM Marker Structure & SVG/HTML Rendering
* **DOM Container**: `#marker-overlay` (`index.html` line 61).
* **Pointer Events**: `#marker-overlay` has `pointer-events: none` to let map pan/zoom drag gestures pass through to `#map-canvas`. Marker elements MUST explicitly set `pointer-events: auto` to allow hover, click, and keyboard focus.
* **Accessibility**:
  * Use native `<button>` element or `<div role="button" tabindex="0">`.
  * Include `aria-label="${place.name} - ${categoryLabel}"`.
  * Support keyboard navigation (`Enter` / `Space` key selection).
* **Proposed DOM Node Structure**:
  ```html
  <button class="map-marker category-${place.category} ${isNprnu ? 'is-nprnu' : ''}"
          data-place-id="${place.id}"
          aria-label="${place.name} (${categoryLabel})"
          tabindex="0">
    <div class="marker-pin">
      <svg class="marker-pin-svg" viewBox="0 0 36 48" aria-hidden="true">
        <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.059 27.941 0 18 0z" />
      </svg>
      <i class="fa-solid ${categoryIcon} marker-icon" aria-hidden="true"></i>
      ${isNprnu ? '<span class="nprnu-badge" title="Quartier en Renouvellement Urbain">NPRNU</span>' : ''}
    </div>
    <div class="marker-tooltip" role="tooltip">
      <span class="tooltip-title">${place.name}</span>
      <span class="tooltip-category">${categoryLabel}</span>
    </div>
  </button>
  ```

---

### 3. High-Efficiency Viewport Synchronization (Zero DOM Destruction)
* **Problem**: Re-creating DOM elements on every `viewport:changed` event (firing at ~60fps during pan/zoom) causes DOM thrashing, garbage collection spikes, loss of hover/active states, and keyboard focus displacement.
* **Solution**:
  1. **Persistent DOM Instances**: Create DOM elements ONCE during dataset loading (`setPlaces(places)`) or when filter changes. Store references in `this.markerMap = new Map<string, { place: Object, element: HTMLElement }>()`.
  2. **Transform-based Positioning**: On `viewport:changed` event, iterate over `this.markerMap` and update `element.style.transform` using GPU hardware-accelerated 3D transforms:
     ```javascript
     element.style.transform = `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0) translate(-50%, -100%)`;
     ```
  3. **AnimationFrame Batching**: Throttle update calls via `requestAnimationFrame` to ensure max 1 transform update per display refresh cycle.
  4. **Viewport Culling (Optional Optimization)**: If a marker's `(screenX, screenY)` falls outside screen boundaries `[-60, -60, viewportWidth + 60, viewportHeight + 60]`, set `element.style.display = 'none'` (or `visibility: hidden`), avoiding rendering work for off-screen markers.
  5. **Filtering**: When category/search filters change, toggle `.filtered-out` class (`display: none`) on existing elements instead of removing/rebuilding DOM nodes.

---

### 4. Category-Specific Mappings & NPRNU Badging

#### Category Icon & Color Mappings
| Category ID | Category Name (FR) | FontAwesome Icon Class | Accent Color |
|-------------|-------------------|-----------------------|--------------|
| `services`  | Services Publics  | `fa-building-columns`  | `#2563eb` (Blue) |
| `parcs`     | Parcs & Nature    | `fa-tree`             | `#16a34a` (Green) |
| `culture`   | Culture & Patrimoine | `fa-landmark` (or `fa-book-open`) | `#9333ea` (Purple) |
| `sports`    | Sports & Santé    | `fa-futbol`           | `#ea580c` (Orange) |
| `ecoles`    | Écoles & Éducation | `fa-graduation-cap`   | `#d97706` (Amber) |

#### NPRNU Identification & Badging Logic
* **Condition**: A place is NPRNU if `place.isNprnu === true` OR `Array.isArray(place.tags) && place.tags.some(t => t.toUpperCase() === 'NPRNU')`.
* **Dataset Verification**: 5 POIs in `data.json` are NPRNU:
  1. `cilm-champ-le-boeuf` (`isNprnu: true`)
  2. `centre-social-champ-le-boeuf` (`isNprnu: true`)
  3. `parc-urbain-provinces` (`isNprnu: true`)
  4. `gymnase-champ-le-boeuf` (`isNprnu: true`)
  5. `ecole-champ-le-boeuf` (`isNprnu: true`)
* **Badge Rendering**: Attach a compact pill/badge `.nprnu-badge` to the upper-right of the marker pin SVG with text `"NPRNU"` styled with cyan/gold gradient, subtle shadow, and tooltip title `"Quartier en Renouvellement Urbain (NPRNU)"`.

---

### 5. Hover Tooltips & Active Selection States

#### Hover Tooltip Specification
* **CSS Class**: `.marker-tooltip`
* **Visibility**: Hidden by default (`opacity: 0; pointer-events: none; transform: translate(-50%, -100%) scale(0.9); transition: opacity 0.2s ease, transform 0.2s ease;`).
* **On Hover / Focus**: When `.map-marker:hover` or `.map-marker:focus-visible`:
  * `opacity: 1`
  * `transform: translate(-50%, -125%) scale(1)`
  * `z-index: 200`
* **EventBus Notification**: Emit `place:hovered` (`{ placeId }` on enter, `{ placeId: null }` on leave).

#### Active Selection State Specification
* **CSS Class**: `.map-marker.selected`
* **Visual Effects**:
  1. **Elevated Z-Index**: `z-index: 500` to sit above all unselected markers.
  2. **Magnified Scale**: `transform: translate3d(x, y, 0) translate(-50%, -100%) scale(1.25)`
  3. **Pulsing Ring Halo**: `@keyframes marker-pulse`:
     ```css
     @keyframes marker-pulse {
       0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
       70% { box-shadow: 0 0 0 16px rgba(99, 102, 241, 0); }
       100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
     }
     ```
  4. **Distinct Border / Glow**: Accent glow color matching category or primary accent `--accent-primary`.

---

### 6. Event Bus Integration & Bidirectional Selection
* **Subscribed Events**:
  1. `viewport:changed` → Recalculates marker screen positions `(x, y)` via `projection.geoToScreen()`.
  2. `place:selected` → Updates `.selected` state class on markers (`setSelected(placeId)`).
  3. `data:loaded` → Loads place data and initializes markers (`setPlaces(places)`).
  4. `filter:changed` → Shows/hides markers according to active category and search filter.
* **Emitted Events**:
  1. `place:selected` → Emitted on marker click (`{ placeId, place, source: 'map' }`).
  2. `place:hovered` → Emitted on marker hover (`{ placeId, place }` or `{ placeId: null }`).

---

## Technical Recommendations for Implementation

### Architecture of `js/markerManager.js`
```javascript
/**
 * MarkerManager - Interactive DOM/SVG Marker Overlay Manager
 * Manages rendering, position updates, category icons, NPRNU badges,
 * hover tooltips, selection states, and EventBus synchronization.
 */
export class MarkerManager {
  /**
   * @param {HTMLElement} containerEl - DOM container (#marker-overlay)
   * @param {Object} projection - Projection instance
   * @param {Object} viewport - ViewportController instance
   * @param {Object} eventBus - EventBus instance
   */
  constructor(containerEl, projection, viewport, eventBus) {
    this.containerEl = containerEl;
    this.projection = projection;
    this.viewport = viewport;
    this.eventBus = eventBus;

    this.places = [];
    this.markerMap = new Map(); // placeId -> { place, element, x, y, isVisible }
    this.selectedPlaceId = null;
    this.rafPending = false;

    this._setupEventBusListeners();
  }

  // Set places dataset and build DOM elements
  setPlaces(places) { ... }

  // Create single marker DOM node
  _createMarkerElement(place) { ... }

  // Update positions for all markers based on current viewport
  updatePositions(viewportState = null) { ... }

  // Set active selection
  setSelectedPlace(placeId) { ... }

  // Filter markers by category & query
  filterMarkers(filteredPlaces) { ... }
}
```

---

## Proposed CSS Additions for `styles.css`
The following CSS rules should be added to `styles.css` under a new section `/* ========================================== MARKER OVERLAY & STYLES ========================================== */`:

```css
/* Marker Overlay Container */
.marker-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

/* Base Map Marker */
.map-marker {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease-out, filter 0.2s ease, opacity 0.2s ease;
  will-change: transform;
}

.map-marker.filtered-out {
  display: none !important;
}

.map-marker:focus-visible {
  outline: 3px solid var(--accent-primary);
  outline-offset: 4px;
  border-radius: 50%;
}

/* Marker Pin Outer Container */
.marker-pin-wrapper {
  position: relative;
  width: 34px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.map-marker:hover .marker-pin-wrapper {
  transform: scale(1.15);
}

/* Pin SVG path styling */
.marker-pin-svg {
  width: 100%;
  height: 100%;
  fill: var(--marker-color, var(--accent-primary));
  transition: fill 0.2s ease;
}

.marker-icon {
  position: absolute;
  top: 10px;
  color: white;
  font-size: 0.85rem;
  pointer-events: none;
}

/* NPRNU Badge */
.nprnu-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  color: white;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.1rem 0.35rem;
  border-radius: 8px;
  border: 1.5px solid #0f172a;
  box-shadow: 0 2px 6px rgba(6, 182, 212, 0.5);
  letter-spacing: 0.02em;
}

/* Active Selected Marker State */
.map-marker.selected {
  z-index: 100 !important;
}

.map-marker.selected .marker-pin-wrapper {
  transform: scale(1.3);
  filter: drop-shadow(0 0 12px var(--marker-color, var(--accent-primary)));
  animation: marker-pulse 2s infinite;
}

@keyframes marker-pulse {
  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
  70% { box-shadow: 0 0 0 16px rgba(99, 102, 241, 0); }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}

/* Marker Tooltip */
.marker-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translate(-50%, -8px) scale(0.9);
  opacity: 0;
  pointer-events: none;
  background: var(--bg-glass);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border: 1px solid var(--glass-border);
  padding: 0.4rem 0.7rem;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-main);
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 200;
}

.map-marker:hover .marker-tooltip,
.map-marker:focus-visible .marker-tooltip {
  opacity: 1;
  transform: translate(-50%, -12px) scale(1);
}

.tooltip-title {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.tooltip-category {
  font-size: 0.68rem;
  color: var(--text-secondary);
}
```

---

## Conclusion & Readiness
All requirements, mathematical transformations, DOM structures, optimization patterns, and event bus contracts for `js/markerManager.js` have been thoroughly analyzed and verified against the existing codebase. The implementer can directly follow these specifications to deliver Milestone 3 seamlessly.
