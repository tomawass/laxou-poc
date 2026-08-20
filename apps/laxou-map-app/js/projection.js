/**
 * Projection - Localized Equirectangular Projection with Cosine Latitude Scaling
 * Centered on Laxou (Lat 48.6865, Lng 6.1504).
 */
export class Projection {
  /**
   * Default Laxou / Nancy geographic bounding box coordinates
   */
  static DEFAULT_BOUNDS = Object.freeze({
    minLat: 48.665,
    maxLat: 48.708,
    minLng: 6.12,
    maxLng: 6.2,
  });

  /**
   * Reference center coordinates for Laxou
   */
  static LAXOU_CENTER = Object.freeze({
    lat: 48.6865,
    lng: 6.1504,
  });

  /**
   * @param {Object} [bounds] - Geographic bounding box { minLat, maxLat, minLng, maxLng }
   * @param {Object} [canvasSize] - Target canvas size { width, height }
   */
  constructor(
    bounds = Projection.DEFAULT_BOUNDS,
    canvasSize = { width: 800, height: 600 },
  ) {
    this.setBounds(bounds);
    this.setCanvasSize(canvasSize?.width, canvasSize?.height);
  }

  /**
   * Set geographic bounds with defensive zero-span & inversion handling.
   * @param {Object} bounds
   */
  setBounds(bounds) {
    const raw = bounds || Projection.DEFAULT_BOUNDS;
    let minLat = Number(raw.minLat) || Projection.DEFAULT_BOUNDS.minLat;
    let maxLat = Number(raw.maxLat) || Projection.DEFAULT_BOUNDS.maxLat;
    let minLng = Number(raw.minLng) || Projection.DEFAULT_BOUNDS.minLng;
    let maxLng = Number(raw.maxLng) || Projection.DEFAULT_BOUNDS.maxLng;

    const actualMinLat = Math.min(minLat, maxLat);
    const actualMaxLat = Math.max(minLat, maxLat);
    const actualMinLng = Math.min(minLng, maxLng);
    const actualMaxLng = Math.max(minLng, maxLng);

    // Defensive zero-span prevention
    const dLat = Math.max(actualMaxLat - actualMinLat, 1e-6);
    const dLng = Math.max(actualMaxLng - actualMinLng, 1e-6);

    this.bounds = {
      minLat: actualMinLat,
      maxLat: actualMaxLat,
      minLng: actualMinLng,
      maxLng: actualMaxLng,
      dLat,
      dLng,
    };

    this.centerLat = (actualMinLat + actualMaxLat) / 2;
    this.centerLng = (actualMinLng + actualMaxLng) / 2;

    const centerLatRad = (this.centerLat * Math.PI) / 180;
    // Cosine scaling factor with defensive clamping to prevent division by zero near poles
    this.cosRefLat = Math.max(Math.cos(centerLatRad), 0.0001);

    if (this.canvasWidth && this.canvasHeight) {
      this._recomputeBaseDimensions();
    }
  }

  /**
   * Set target canvas screen dimensions.
   * @param {number} width
   * @param {number} height
   */
  setCanvasSize(width, height) {
    const w = Number(width);
    const h = Number(height);

    this.canvasWidth = isFinite(w) && w > 0 ? w : 800;
    this.canvasHeight = isFinite(h) && h > 0 ? h : 600;

    this._recomputeBaseDimensions();
  }

  /**
   * Recompute base scale dimensions (W0, H0) preserving aspect ratio.
   * @private
   */
  _recomputeBaseDimensions() {
    const canvasAR = this.canvasWidth / this.canvasHeight;
    const geoAR = this.getAspectRatio();

    if (canvasAR > geoAR) {
      this.baseHeight = this.canvasHeight;
      this.baseWidth = this.canvasHeight * geoAR;
    } else {
      this.baseWidth = this.canvasWidth;
      this.baseHeight = this.canvasWidth / geoAR;
    }
  }

  /**
   * Calculate geographic metric aspect ratio (width / height with cosine correction).
   * @returns {number}
   */
  getAspectRatio() {
    return (this.bounds.dLng * this.cosRefLat) / this.bounds.dLat;
  }

  /**
   * Get current bounds object.
   * @returns {Object}
   */
  getBounds() {
    return { ...this.bounds };
  }

  /**
   * Get center coordinate.
   * @returns {{ lat: number, lng: number }}
   */
  getCenter() {
    return { lat: this.centerLat, lng: this.centerLng };
  }

  /**
   * Convert lat/lng to normalized (0..1) world coordinates.
   * x = 0 at minLng, 1 at maxLng
   * y = 0 at maxLat, 1 at minLat (top-down 2D coordinate system)
   * @param {number} lat
   * @param {number} lng
   * @returns {{ x: number, y: number }}
   */
  geoToWorld(lat, lng) {
    const numLat = Number(lat);
    const numLng = Number(lng);

    if (!isFinite(numLat) || !isFinite(numLng)) {
      return { x: 0.5, y: 0.5 };
    }

    const x = (numLng - this.bounds.minLng) / this.bounds.dLng;
    const y = (this.bounds.maxLat - numLat) / this.bounds.dLat;

    return { x, y };
  }

  /**
   * Convert normalized (0..1) world coordinates to lat/lng.
   * @param {number} worldX
   * @param {number} worldY
   * @returns {{ lat: number, lng: number }}
   */
  worldToGeo(worldX, worldY) {
    const wx = Number(worldX);
    const wy = Number(worldY);

    if (!isFinite(wx) || !isFinite(wy)) {
      return { lat: this.centerLat, lng: this.centerLng };
    }

    const lng = this.bounds.minLng + wx * this.bounds.dLng;
    const lat = this.bounds.maxLat - wy * this.bounds.dLat;

    return { lat, lng };
  }

  /**
   * Convert normalized world coordinates to screen pixel coordinates given viewport state.
   * @param {number} worldX
   * @param {number} worldY
   * @param {Object} [viewport] { x/panX, y/panY, zoom, width, height }
   * @returns {{ x: number, y: number }}
   */
  worldToScreen(worldX, worldY, viewport = {}) {
    const wx = Number(worldX);
    const wy = Number(worldY);

    if (!isFinite(wx) || !isFinite(wy)) {
      return { x: 0, y: 0 };
    }

    const panX = Number(viewport.panX ?? viewport.x ?? 0) || 0;
    const panY = Number(viewport.panY ?? viewport.y ?? 0) || 0;
    const zoom = Number(viewport.zoom) || 1;
    const vw = Number(viewport.width) || this.canvasWidth;
    const vh = Number(viewport.height) || this.canvasHeight;

    const screenX = (wx - 0.5) * this.baseWidth * zoom + vw / 2 + panX;
    const screenY = (wy - 0.5) * this.baseHeight * zoom + vh / 2 + panY;

    return { x: screenX, y: screenY };
  }

  /**
   * Convert screen pixel coordinates to normalized world coordinates.
   * @param {number} screenX
   * @param {number} screenY
   * @param {Object} [viewport]
   * @returns {{ x: number, y: number }}
   */
  screenToWorld(screenX, screenY, viewport = {}) {
    const sx = Number(screenX);
    const sy = Number(screenY);

    if (!isFinite(sx) || !isFinite(sy)) {
      return { x: 0.5, y: 0.5 };
    }

    const panX = Number(viewport.panX ?? viewport.x ?? 0) || 0;
    const panY = Number(viewport.panY ?? viewport.y ?? 0) || 0;
    const zoom = Number(viewport.zoom) || 1;
    const vw = Number(viewport.width) || this.canvasWidth;
    const vh = Number(viewport.height) || this.canvasHeight;

    const worldX = (sx - vw / 2 - panX) / (this.baseWidth * zoom) + 0.5;
    const worldY = (sy - vh / 2 - panY) / (this.baseHeight * zoom) + 0.5;

    return { x: worldX, y: worldY };
  }

  /**
   * Direct forward conversion: lat/lng to screen pixel coordinates.
   * @param {number} lat
   * @param {number} lng
   * @param {Object} [viewport]
   * @returns {{ x: number, y: number }}
   */
  geoToScreen(lat, lng, viewport = {}) {
    const world = this.geoToWorld(lat, lng);
    return this.worldToScreen(world.x, world.y, viewport);
  }

  /**
   * Direct inverse conversion: screen pixel coordinates to lat/lng.
   * @param {number} screenX
   * @param {number} screenY
   * @param {Object} [viewport]
   * @returns {{ lat: number, lng: number }}
   */
  screenToGeo(screenX, screenY, viewport = {}) {
    const world = this.screenToWorld(screenX, screenY, viewport);
    return this.worldToGeo(world.x, world.y);
  }

  /**
   * Check if a geographic point is within current bounding box.
   * @param {number} lat
   * @param {number} lng
   * @returns {boolean}
   */
  isPointInBounds(lat, lng) {
    const l = Number(lat);
    const g = Number(lng);
    if (!isFinite(l) || !isFinite(g)) return false;

    return (
      l >= this.bounds.minLat &&
      l <= this.bounds.maxLat &&
      g >= this.bounds.minLng &&
      g <= this.bounds.maxLng
    );
  }

  /**
   * Calculate bounding box from an array of point objects with lat/lng.
   * @param {Array<{lat: number, lng: number}>} points
   * @param {number} [paddingPercent=0.10]
   * @returns {{ minLat: number, maxLat: number, minLng: number, maxLng: number }}
   */
  static calculateBounds(points, paddingPercent = 0.1) {
    if (!Array.isArray(points) || points.length === 0) {
      return { ...Projection.DEFAULT_BOUNDS };
    }

    let minLat = Infinity,
      maxLat = -Infinity;
    let minLng = Infinity,
      maxLng = -Infinity;

    for (const p of points) {
      const lat = Number(p.lat);
      const lng = Number(p.lng);
      if (isFinite(lat) && isFinite(lng)) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      }
    }

    if (!isFinite(minLat)) {
      return { ...Projection.DEFAULT_BOUNDS };
    }

    const dLat = maxLat - minLat;
    const dLng = maxLng - minLng;
    const p = Math.max(0, paddingPercent);

    return {
      minLat: minLat - dLat * p,
      maxLat: maxLat + dLat * p,
      minLng: minLng - dLng * p,
      maxLng: maxLng + dLng * p,
    };
  }
}
