/**
 * ViewportController - Interactive Camera & Viewport Transform Controller
 * Manages camera position (x, y), zoom level z in [minZoom, maxZoom], bounds clamping,
 * and pointer/wheel/button gesture events.
 */
export class ViewportController {
  /**
   * @param {Object} projection - Projection instance (from js/projection.js)
   * @param {Object} [eventBus] - EventBus instance (from js/eventBus.js)
   * @param {Object} [options] - Initial configuration options
   */
  constructor(projection, eventBus = null, options = {}) {
    this.projection = projection;
    this.eventBus = eventBus;

    // Viewport Camera State
    this.x = options.x ?? 0; // Camera pan offset X (screen pixels from center)
    this.y = options.y ?? 0; // Camera pan offset Y (screen pixels from center)
    this.zoom = options.zoom ?? 1.0; // Zoom level scale factor z in [minZoom, maxZoom]
    this.minZoom = options.minZoom ?? 1.0;
    this.maxZoom = options.maxZoom ?? 10.0;

    // Screen Dimensions (CSS pixels)
    this.width = options.width ?? (projection?.canvasWidth || 800);
    this.height = options.height ?? (projection?.canvasHeight || 600);

    // Drag Gesture Tracking State
    this.isDragging = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.activePointerId = null;

    // Bound DOM elements
    this.containerEl = null;
    this.zoomInBtnEl = null;
    this.zoomOutBtnEl = null;
    this.resizeObserver = null;
  }

  /**
   * Get complete current viewport camera state and visible geographic bounds.
   * @returns {{ x: number, y: number, zoom: number, width: number, height: number, bounds: { minLat: number, maxLat: number, minLng: number, maxLng: number } }}
   */
  getState() {
    return {
      x: this.x,
      y: this.y,
      zoom: this.zoom,
      width: this.width,
      height: this.height,
      bounds: this.getVisibleGeoBounds(),
    };
  }

  /**
   * Set viewport screen dimensions.
   * @param {number} width
   * @param {number} height
   */
  setDimensions(width, height) {
    const w = Number(width);
    const h = Number(height);
    if (!isFinite(w) || w <= 0 || !isFinite(h) || h <= 0) return;

    this.width = w;
    this.height = h;

    if (
      this.projection &&
      typeof this.projection.setCanvasSize === "function"
    ) {
      this.projection.setCanvasSize(w, h);
    }

    this._clampBounds();
    this._emitChanged();
  }

  /**
   * Translate camera pan position by (dx, dy) screen pixels.
   * @param {number} dx
   * @param {number} dy
   */
  panBy(dx, dy) {
    const deltaX = Number(dx) || 0;
    const deltaY = Number(dy) || 0;

    this.x += deltaX;
    this.y += deltaY;

    this._clampBounds();
    this._emitChanged();
  }

  /**
   * Adjust camera zoom centered at screen coordinate (screenX, screenY).
   * Keeps the world coordinate beneath (screenX, screenY) invariant.
   * @param {number} screenX - Screen X focal point
   * @param {number} screenY - Screen Y focal point
   * @param {number} zoomFactor - Relative zoom multiplier (e.g. 1.25 or 0.8)
   */
  zoomAt(screenX, screenY, zoomFactor) {
    const sx = Number(screenX);
    const sy = Number(screenY);
    const factor = Number(zoomFactor);

    if (!isFinite(sx) || !isFinite(sy) || !isFinite(factor) || factor <= 0)
      return;

    const oldZoom = this.zoom;
    const newZoom = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, oldZoom * factor),
    );

    if (Math.abs(newZoom - oldZoom) < 1e-6) return;

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const scaleRatio = newZoom / oldZoom;

    // Cursor invariant focal math:
    // x_new = (screenX - centerX) * (1 - scaleRatio) + x_old * scaleRatio
    this.x = (sx - centerX) * (1 - scaleRatio) + this.x * scaleRatio;
    this.y = (sy - centerY) * (1 - scaleRatio) + this.y * scaleRatio;
    this.zoom = newZoom;

    this._clampBounds();
    this._emitChanged();
  }

  /**
   * Center camera on target geographic coordinate (lat, lng) at optional zoom level.
   * @param {number} lat
   * @param {number} lng
   * @param {number} [zoomLevel]
   */
  centerOnGeo(lat, lng, zoomLevel = null) {
    if (!this.projection) return;

    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isFinite(numLat) || !isFinite(numLng)) return;

    if (zoomLevel !== null && isFinite(Number(zoomLevel))) {
      this.zoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, Number(zoomLevel)),
      );
    }

    const world = this.projection.geoToWorld(numLat, numLng);
    const baseW = this.projection.baseWidth || this.width;
    const baseH = this.projection.baseHeight || this.height;

    // Center equation: screen position of (world.x, world.y) should equal (width/2, height/2)
    // (world.x - 0.5) * baseW * zoom + width/2 + panX = width/2
    // => panX = -(world.x - 0.5) * baseW * zoom
    this.x = -(world.x - 0.5) * baseW * this.zoom;
    this.y = -(world.y - 0.5) * baseH * this.zoom;

    this._clampBounds();
    this._emitChanged();
  }

  /**
   * Calculate zoom and camera position to fit geographic bounding box with padding.
   * @param {Object} geoBounds - { minLat, maxLat, minLng, maxLng }
   * @param {number} [paddingPercent=0.05]
   */
  fitBounds(geoBounds, paddingPercent = 0.05) {
    if (!this.projection || !geoBounds) return;

    const minLat = Number(geoBounds.minLat);
    const maxLat = Number(geoBounds.maxLat);
    const minLng = Number(geoBounds.minLng);
    const maxLng = Number(geoBounds.maxLng);

    if (
      !isFinite(minLat) ||
      !isFinite(maxLat) ||
      !isFinite(minLng) ||
      !isFinite(maxLng)
    )
      return;

    const wMin = this.projection.geoToWorld(maxLat, minLng);
    const wMax = this.projection.geoToWorld(minLat, maxLng);

    const dWorldX = Math.max(Math.abs(wMax.x - wMin.x), 1e-5);
    const dWorldY = Math.max(Math.abs(wMax.y - wMin.y), 1e-5);

    const p = Math.max(0, Math.min(0.4, Number(paddingPercent) || 0.05));
    const availW = this.width * (1 - 2 * p);
    const availH = this.height * (1 - 2 * p);

    const baseW = this.projection.baseWidth || this.width;
    const baseH = this.projection.baseHeight || this.height;

    const fitZoomX = availW / (dWorldX * baseW);
    const fitZoomY = availH / (dWorldY * baseH);

    const fitZoom = Math.min(fitZoomX, fitZoomY);
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, fitZoom));

    const centerWorldX = (wMin.x + wMax.x) / 2;
    const centerWorldY = (wMin.y + wMax.y) / 2;

    this.x = -(centerWorldX - 0.5) * baseW * this.zoom;
    this.y = -(centerWorldY - 0.5) * baseH * this.zoom;

    this._clampBounds();
    this._emitChanged();
  }

  /**
   * Compute visible geographic bounding box in current viewport.
   * @returns {{ minLat: number, maxLat: number, minLng: number, maxLng: number }}
   */
  getVisibleGeoBounds() {
    if (!this.projection) {
      return { minLat: 48.665, maxLat: 48.708, minLng: 6.12, maxLng: 6.2 };
    }

    const state = {
      x: this.x,
      y: this.y,
      zoom: this.zoom,
      width: this.width,
      height: this.height,
    };
    const topLeft = this.projection.screenToGeo(0, 0, state);
    const bottomRight = this.projection.screenToGeo(
      this.width,
      this.height,
      state,
    );

    return {
      minLat: Math.min(topLeft.lat, bottomRight.lat),
      maxLat: Math.max(topLeft.lat, bottomRight.lat),
      minLng: Math.min(topLeft.lng, bottomRight.lng),
      maxLng: Math.max(topLeft.lng, bottomRight.lng),
    };
  }

  /**
   * Attach gesture event listeners to container element and optional zoom buttons.
   * @param {HTMLElement} containerEl
   * @param {HTMLElement} [zoomInBtnEl]
   * @param {HTMLElement} [zoomOutBtnEl]
   */
  attachEventListeners(containerEl, zoomInBtnEl = null, zoomOutBtnEl = null) {
    if (!containerEl || !(containerEl instanceof HTMLElement)) return;

    this.containerEl = containerEl;
    this.zoomInBtnEl = zoomInBtnEl;
    this.zoomOutBtnEl = zoomOutBtnEl;

    // Set cursor styling
    this.containerEl.style.cursor = "grab";
    this.containerEl.style.touchAction = "none";

    // Pointer Events (Pan / Drag)
    const onPointerDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      this.isDragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.activePointerId = e.pointerId;

      if (typeof containerEl.setPointerCapture === "function") {
        try {
          containerEl.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
      this.containerEl.style.cursor = "grabbing";
    };

    const onPointerMove = (e) => {
      if (
        !this.isDragging ||
        (this.activePointerId !== null && e.pointerId !== this.activePointerId)
      )
        return;
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;

      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      this.panBy(dx, dy);
    };

    const onPointerUpCancel = (e) => {
      if (
        this.activePointerId !== null &&
        e.pointerId === this.activePointerId
      ) {
        if (typeof containerEl.releasePointerCapture === "function") {
          try {
            containerEl.releasePointerCapture(e.pointerId);
          } catch (_) {}
        }
        this.isDragging = false;
        this.activePointerId = null;
        if (this.containerEl) {
          this.containerEl.style.cursor = "grab";
        }
      }
    };

    containerEl.addEventListener("pointerdown", onPointerDown);
    containerEl.addEventListener("pointermove", onPointerMove);
    containerEl.addEventListener("pointerup", onPointerUpCancel);
    containerEl.addEventListener("pointercancel", onPointerUpCancel);
    containerEl.addEventListener("pointerleave", onPointerUpCancel);

    // Mouse Wheel Zoom
    const onWheel = (e) => {
      e.preventDefault();
      const rect = containerEl.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const delta =
        e.deltaY * (e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 600 : 1);
      const zoomFactor = Math.pow(0.999, delta);

      this.zoomAt(screenX, screenY, zoomFactor);
    };

    containerEl.addEventListener("wheel", onWheel, { passive: false });

    // Double-click Zoom
    const onDblClick = (e) => {
      e.preventDefault();
      const rect = containerEl.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      this.zoomAt(screenX, screenY, 1.5);
    };

    containerEl.addEventListener("dblclick", onDblClick);

    // Zoom Buttons
    if (zoomInBtnEl) {
      zoomInBtnEl.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.leafletEngine) {
          this.leafletEngine.zoomIn();
        } else {
          this.zoomAt(this.width / 2, this.height / 2, 1.25);
        }
      });
    }

    if (zoomOutBtnEl) {
      zoomOutBtnEl.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.leafletEngine) {
          this.leafletEngine.zoomOut();
        } else {
          this.zoomAt(this.width / 2, this.height / 2, 0.8);
        }
      });
    }

    // ResizeObserver
    if (
      typeof window !== "undefined" &&
      typeof window.ResizeObserver === "function"
    ) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          if (w > 0 && h > 0) {
            this.setDimensions(w, h);
          }
        }
      });
      this.resizeObserver.observe(containerEl);
    }
  }

  /**
   * Clamp camera pan offset to prevent panning away from map bounds.
   * @private
   */
  _clampBounds() {
    if (!this.projection) return;

    const baseW = (this.projection.baseWidth || this.width) * this.zoom;
    const baseH = (this.projection.baseHeight || this.height) * this.zoom;

    // Allow panning up to 25% viewport edge margin
    const maxX = Math.max(0, (baseW - this.width) / 2 + 0.25 * this.width);
    const maxY = Math.max(0, (baseH - this.height) / 2 + 0.25 * this.height);

    this.x = Math.max(-maxX, Math.min(maxX, this.x));
    this.y = Math.max(-maxY, Math.min(maxY, this.y));
  }

  /**
   * Emit 'viewport:changed' event via eventBus.
   * @private
   */
  _emitChanged() {
    if (this.eventBus && typeof this.eventBus.emit === "function") {
      this.eventBus.emit("viewport:changed", this.getState());
    }
  }
}
