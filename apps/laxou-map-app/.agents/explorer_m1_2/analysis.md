# Technical Analysis & Implementation Plan: `js/projection.js`

## Executive Summary
This document presents the mathematical specification, architectural design, and technical implementation plan for `js/projection.js`, the core spatial coordinate projection engine for the Laxou & Nancy Custom Interactive Map application. 

The projection engine employs a **Localized Equirectangular Projection with Cosine Latitude Scaling** centered on Laxou ($\phi_0 = 48.6865^\circ\text{ N}, \lambda_0 = 6.1504^\circ\text{ E}$). This approach achieves sub-millimeter geographic positioning accuracy over the Laxou/Nancy area while requiring zero external mapping libraries (Leaflet, Mapbox, OpenLayers).

---

## 1. Mathematical Fundamentals & Coordinate Systems

### 1.1 Geographic Coordinates & Reference System
- **Ellipsoid/Datum**: WGS 84 (EPSG:4326) standard latitude ($\phi$) and longitude ($\lambda$) in decimal degrees.
- **Laxou Reference Center**:
  - Center Latitude ($\phi_0$): $48.6865^\circ\text{ N}$
  - Center Longitude ($\lambda_0$): $6.1504^\circ\text{ E}$
- **Radiational Conversion**:
  $$\phi_0^{\text{rad}} = \phi_0 \times \frac{\pi}{180} = 48.6865 \times \frac{\pi}{180} \approx 0.849740626\text{ rad}$$
- **Cosine Scaling Factor**:
  $$S_{\cos} = \cos(\phi_0^{\text{rad}}) = \cos(48.6865^\circ) \approx 0.660183626$$

### 1.2 Physical Unit Conversions (Meters vs. Degrees)
Earth radius $R \approx 6,371,000\text{ meters}$.
1. **Latitude Distance**:
   $$\Delta d_{\text{lat}} = R \cdot \Delta\phi^{\text{rad}} = 111,194.9\text{ m/degree}$$
2. **Longitude Distance at Laxou ($\phi_0 = 48.6865^\circ$)**:
   $$\Delta d_{\text{lng}} = R \cdot \Delta\lambda^{\text{rad}} \cdot \cos(\phi_0^{\text{rad}}) \approx 111,194.9 \times 0.6601836 \approx 73,409.2\text{ m/degree}$$

Because 1 degree of longitude spans only ~66.02% of the distance of 1 degree of latitude at $48.6865^\circ$, unscaled equirectangular projections distort geographic shapes (stretching north-south). Cosine scaling eliminates this distortion.

---

## 2. Bounding Box & World Coordinate Space

### 2.1 Regional Bounds Definition
The Laxou & Nancy geographic area encompasses Laxou, Nancy city center, Champ-le-Bœuf (NPRNU district), Maxéville, and surrounding municipal boundaries.

- **Default Bounds Specification**:
  - `minLat`: $48.6650^\circ\text{ N}$ (South Laxou/Vandœuvre border)
  - `maxLat`: $48.7150^\circ\text{ N}$ (North Champ-le-Bœuf / Maxéville)
  - `minLng`: $6.1200^\circ\text{ E}$ (West Laxou forest / Maron border)
  - `maxLng`: $6.2000^\circ\text{ E}$ (East Nancy center / Saint-Max border)

- **Dynamic Bounds Calculation**:
  Given an array of POIs or spatial points $P = \{(\text{lat}_i, \text{lng}_i)\}$, bounds are calculated with optional padding ($p = 0.10$):
  $$\text{minLat} = \min(\text{lat}_i) - p \cdot \Delta\text{lat}, \quad \text{maxLat} = \max(\text{lat}_i) + p \cdot \Delta\text{lat}$$
  $$\text{minLng} = \min(\text{lng}_i) - p \cdot \Delta\text{lng}, \quad \text{maxLng} = \max(\text{lng}_i) + p \cdot \Delta\text{lng}$$

### 2.2 Normalized World Coordinates $[0, 1] \times [0, 1]$
World coordinates normalize geographic positions into a unit square $(x_{\text{world}}, y_{\text{world}}) \in [0, 1]^2$:
- $x_{\text{world}} = 0$ corresponds to `minLng` (West)
- $x_{\text{world}} = 1$ corresponds to `maxLng` (East)
- $y_{\text{world}} = 0$ corresponds to `maxLat` (North / Top of Canvas)
- $y_{\text{world}} = 1$ corresponds to `minLat` (South / Bottom of Canvas)

**Forward Formula (`geoToWorld`)**:
$$x_{\text{world}} = \frac{\lambda - \text{minLng}}{\text{maxLng} - \text{minLng}}$$
$$y_{\text{world}} = \frac{\text{maxLat} - \phi}{\text{maxLat} - \text{minLat}}$$

**Inverse Formula (`worldToGeo`)**:
$$\lambda = \text{minLng} + x_{\text{world}} \cdot (\text{maxLng} - \text{minLng})$$
$$\phi = \text{maxLat} - y_{\text{world}} \cdot (\text{maxLat} - \text{minLat})$$

---

## 3. Aspect Ratio Preservation & Viewport Transformation Pipeline

### 3.1 Bounding Box Metric Aspect Ratio
The physical aspect ratio ($AR_{\text{geo}}$) of the bounding box accounts for meridian convergence:
$$AR_{\text{geo}} = \frac{(\text{maxLng} - \text{minLng}) \cdot \cos(\phi_0^{\text{rad}})}{\text{maxLat} - \text{minLat}}$$

For default Laxou bounds ($\Delta\text{lng} = 0.0800^\circ, \Delta\text{lat} = 0.0500^\circ$):
$$AR_{\text{geo}} = \frac{0.0800 \times 0.6601836}{0.0500} = \frac{0.0528147}{0.0500} \approx 1.05629$$

### 3.2 Base Scale Computation ($W_0, H_0$)
When fitting the bounding box into a target canvas screen size $(C_w, C_h)$ at base scale ($\text{zoom} = 1$):
- Canvas Aspect Ratio: $AR_{\text{canvas}} = \frac{C_w}{C_h}$
- If $AR_{\text{canvas}} > AR_{\text{geo}}$ (canvas is wider than map aspect):
  $$H_0 = C_h, \quad W_0 = C_h \cdot AR_{\text{geo}}$$
- If $AR_{\text{canvas}} \le AR_{\text{geo}}$ (canvas is taller than map aspect):
  $$W_0 = C_w, \quad H_0 = \frac{C_w}{AR_{\text{geo}}}$$

### 3.3 Screen Pixel Transformation Pipeline

Given Viewport State $V = \{\text{x (panX)}, \text{y (panY)}, \text{zoom}, \text{width}, \text{height}\}$:

#### 1. Forward Transformation (`worldToScreen`)
$$S_x = (x_{\text{world}} - 0.5) \cdot W_0 \cdot \text{zoom} + \frac{C_w}{2} + \text{panX}$$
$$S_y = (y_{\text{world}} - 0.5) \cdot H_0 \cdot \text{zoom} + \frac{C_h}{2} + \text{panY}$$

#### 2. Inverse Transformation (`screenToWorld`)
$$x_{\text{world}} = \frac{S_x - \frac{C_w}{2} - \text{panX}}{W_0 \cdot \text{zoom}} + 0.5$$
$$y_{\text{world}} = \frac{S_y - \frac{C_h}{2} - \text{panY}}{H_0 \cdot \text{zoom}} + 0.5$$

#### 3. Direct Compound Transformations (`geoToScreen` & `screenToGeo`)
- `geoToScreen(lat, lng, viewport)` = `worldToScreen(geoToWorld(lat, lng), viewport)`
- `screenToGeo(screenX, screenY, viewport)` = `worldToGeo(screenToWorld(screenX, screenY, viewport))`

#### 4. Mathematical Roundtrip Identity
For any valid coordinate $(\phi, \lambda)$ and viewport state $V$:
$$\text{screenToGeo}(\text{geoToScreen}(\phi, \lambda, V), V) \equiv (\phi, \lambda) \quad (\pm 10^{-12}\text{ error})$$

---

## 4. Edge Cases & Defensive Programming Strategy

| Edge Case | Potential Issue | Defensive Resolution Strategy |
|-----------|-----------------|-------------------------------|
| `minLat === maxLat` or `minLng === maxLng` | Division by zero ($\text{dLat} = 0$) resulting in `NaN` | Enforce `dLat = Math.max(maxLat - minLat, 1e-6)` and `dLng = Math.max(maxLng - minLng, 1e-6)`. |
| `canvasSize.width <= 0` or `height <= 0` | Infinite aspect ratio / zero height scaling | Fall back to default dimensions `{ width: 800, height: 600 }`. |
| Undefined or partial `viewport` object | `TypeError` on missing properties | Deep fallback default: `{ x: 0, y: 0, zoom: 1, width: canvasWidth, height: canvasHeight }`. Support both `.x`/`.y` and `.panX`/`.panY`. |
| `NaN`, `null`, or non-numeric lat/lng input | Breakdown of mathematical operations | Input validation check: if `!isFinite(lat) || !isFinite(lng)`, return `{ x: 0, y: 0 }` (or bounds center). |
| High Latitude Edge Cases ($\phi \to \pm 90^\circ$) | $\cos(\phi) \to 0$ causing division instability | Clamp $\cos(\phi_0^{\text{rad}})$ to range $[0.0001, 1.0]$. |
| Out-of-bounds coordinates | Coordinates outside Laxou region | `geoToWorld` correctly produces values $< 0$ or $> 1$. Provide `isPointInBounds(lat, lng)` helper. |

---

## 5. Technical Implementation Plan for `js/projection.js`

### 5.1 ES6 Class API Structure
```javascript
/**
 * Projection Engine for Laxou & Nancy Custom Interactive Map.
 * Localized Equirectangular Projection with Cosine Latitude Scaling.
 */
export class Projection {
  /**
   * Default Laxou / Nancy bounding box coordinates.
   */
  static DEFAULT_BOUNDS = Object.freeze({
    minLat: 48.6650,
    maxLat: 48.7150,
    minLng: 6.1200,
    maxLng: 6.2000
  });

  /**
   * @param {Object} [bounds] - Bounding box { minLat, maxLat, minLng, maxLng }
   * @param {Object} [canvasSize] - Target canvas dimensions { width, height }
   */
  constructor(bounds = Projection.DEFAULT_BOUNDS, canvasSize = { width: 800, height: 600 }) {
    this.setBounds(bounds);
    this.setCanvasSize(canvasSize.width, canvasSize.height);
  }

  setBounds(bounds) { ... }
  setCanvasSize(width, height) { ... }
  getBounds() { ... }
  getCenter() { ... }
  getAspectRatio() { ... }

  geoToWorld(lat, lng) { ... }
  worldToGeo(worldX, worldY) { ... }

  worldToScreen(worldX, worldY, viewport = {}) { ... }
  screenToWorld(screenX, screenY, viewport = {}) { ... }

  geoToScreen(lat, lng, viewport = {}) { ... }
  screenToGeo(screenX, screenY, viewport = {}) { ... }

  isPointInBounds(lat, lng) { ... }

  static calculateBounds(points, paddingPercent = 0.10) { ... }
  static degreesToRadians(deg) { return deg * (Math.PI / 180); }
  static radiansToDegrees(rad) { return rad * (180 / Math.PI); }
}
```

### 5.2 Implementation Details

```javascript
  setBounds(bounds) {
    const raw = bounds || Projection.DEFAULT_BOUNDS;
    const minLat = Number(raw.minLat) || Projection.DEFAULT_BOUNDS.minLat;
    const maxLat = Number(raw.maxLat) || Projection.DEFAULT_BOUNDS.maxLat;
    const minLng = Number(raw.minLng) || Projection.DEFAULT_BOUNDS.minLng;
    const maxLng = Number(raw.maxLng) || Projection.DEFAULT_BOUNDS.maxLng;

    const dLat = Math.max(Math.abs(maxLat - minLat), 1e-6);
    const dLng = Math.max(Math.abs(maxLng - minLng), 1e-6);

    const actualMinLat = Math.min(minLat, maxLat);
    const actualMaxLat = Math.max(minLat, maxLat);
    const actualMinLng = Math.min(minLng, maxLng);
    const actualMaxLng = Math.max(minLng, maxLng);

    this.bounds = {
      minLat: actualMinLat,
      maxLat: actualMaxLat,
      minLng: actualMinLng,
      maxLng: actualMaxLng,
      dLat,
      dLng
    };

    this.centerLat = (actualMinLat + actualMaxLat) / 2;
    this.centerLng = (actualMinLng + actualMaxLng) / 2;

    const latRad = Projection.degreesToRadians(this.centerLat);
    this.cosRefLat = Math.max(Math.cos(latRad), 0.0001);

    this._recomputeBaseDimensions();
  }
```

---

## 6. Verification & Test Suite Requirements

1. **Center Point Projection**:
   - `geoToWorld(48.6900, 6.1600)` $\to \{ x: 0.5, y: 0.5 \}$.
2. **Corner Projection**:
   - `geoToWorld(48.7150, 6.1200)` $\to \{ x: 0, y: 0 \}$.
   - `geoToWorld(48.6650, 6.2000)` $\to \{ x: 1, y: 1 \}$.
3. **Cosine Scaling Ratio Test**:
   - Verify `getAspectRatio()` equals $\frac{\Delta\text{lng} \cdot \cos(48.69^\circ)}{\Delta\text{lat}} \approx 1.05629$.
4. **Bidirectional Identity Test**:
   - For random 100 sample coordinates in Laxou/Nancy:
     - `screenToGeo(geoToScreen(lat, lng, vp), vp)` returns original `lat, lng` with $< 10^{-7}$ error.
5. **Zero-span & Invalid Input Robustness**:
   - Verify `Projection({ minLat: 48.68, maxLat: 48.68, minLng: 6.15, maxLng: 6.15 })` does not throw or produce `NaN`.

---
*Report prepared by Explorer 2 (Milestone 1 — Projection Engine Specialist).*
