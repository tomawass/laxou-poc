# Handoff Report: Milestone 1 — Coordinate Projection Engine (`js/projection.js`)

## 1. Observation
- **Project Files Inspected**:
  - `PROJECT.md` (lines 52-65): Defined `Projection` class interface contract (`geoToWorld`, `worldToScreen`, `geoToScreen`, `screenToGeo`).
  - `SCOPE.md` (lines 13-15): Defined projection requirements centered on Laxou ($\phi_0 = 48.6865^\circ, \lambda_0 = 6.1504^\circ$) using Equirectangular projection with cosine latitude scaling.
  - `data.json` (lines 1-92): Contains initial POIs around Laxou with coordinates ranging from Lat 48.6845 to 48.6912 and Lng 6.1455 to 6.1560.
- **Key Mathematical Values**:
  - Center Latitude ($\phi_0$): $48.6865^\circ\text{ N}$
  - Cosine Scaling Factor: $\cos(48.6865^\circ) \approx 0.660183626$
  - Metric Equivalence: $1^\circ\text{ lat} \approx 111,195\text{ m}$; $1^\circ\text{ lng at Laxou} \approx 73,409\text{ m}$.
  - Default Bounding Box for Laxou/Nancy region: `minLat: 48.6650`, `maxLat: 48.7150`, `minLng: 6.1200`, `maxLng: 6.2000`.

## 2. Logic Chain
1. **Observation**: `PROJECT.md` and `SCOPE.md` require converting geographic coordinates ($\phi, \lambda$) to 2D canvas/screen positions without third-party mapping libraries.
2. **Reasoning**: Standard 2D equirectangular mapping ($X = \lambda, Y = \phi$) distorts aspect ratios at non-equatorial latitudes because meridians converge towards the poles. At Laxou's latitude ($48.6865^\circ$), a degree of longitude is shorter than a degree of latitude by a factor of $\cos(48.6865^\circ) \approx 0.6601836$.
3. **Reasoning**: Applying cosine latitude scaling to longitude dimensions ensures that distances along the X-axis match distances along the Y-axis in real-world meters, maintaining 1:1 shape aspect ratio.
4. **Reasoning**: Mapping through normalized world coordinates $[0, 1] \times [0, 1]$ decouples geographic bounds from screen pixel sizes. Combining this with base scale dimensions ($W_0, H_0$) and viewport pan/zoom transformations produces a complete, invertible, distortion-free projection pipeline.
5. **Observation**: Missing viewport parameters or zero-span bounding boxes could produce runtime `NaN` or division-by-zero errors.
6. **Reasoning**: Defensive fallbacks (clamping deltas to $\ge 1e-6$, clamping cosine to $\ge 0.0001$, providing default viewports) ensure 100% runtime robustness under all edge conditions.

## 3. Caveats
- **Local Scope Limitation**: Equirectangular projection with constant reference cosine is highly accurate for local/regional maps (like Laxou & Nancy, span ~10 km). It is not suitable for global or continent-scale maps without spherical/ellipsoidal Mercator transformations.
- **Rotation**: The current specification assumes a standard north-up map orientation (0° rotation). If rotation is added in future milestones, `worldToScreen` will need a 2D rotation matrix around camera center.

## 4. Conclusion
The technical implementation plan for `js/projection.js` is fully formulated and ready for code implementation by the Implementer. The specified ES6 `Projection` class will provide exact, invertible forward (`geoToWorld`, `worldToScreen`, `geoToScreen`) and inverse (`screenToWorld`, `worldToGeo`, `screenToGeo`) coordinate transformations with complete aspect-ratio preservation and defensive edge-case handling.

## 5. Verification Method
- **Analysis File Inspection**:
  Inspect detailed formulas and architecture in `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/explorer_m1_2/analysis.md`.
- **Unit Test Verification**:
  Once implemented in `js/projection.js`, verify using test runner:
  ```bash
  node --test tests/projection.test.js
  ```
  Expected results:
  - `geoToWorld(48.6900, 6.1600)` returns `{ x: 0.5, y: 0.5 }`.
  - Identity test `screenToGeo(geoToScreen(lat, lng, viewport), viewport)` matches input coordinates to $\le 10^{-7}$ degrees.
  - Zero-span bounds handling runs without throwing `NaN` or `Infinity`.
