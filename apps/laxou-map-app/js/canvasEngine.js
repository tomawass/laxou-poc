/**
 * CanvasEngine - Pure HTML5 2D Canvas Vector Map Engine
 * Renders procedural vector background layers for Laxou & Nancy at 60fps.
 */
export class CanvasEngine {
  /**
   * @param {HTMLCanvasElement} canvas - HTML5 Canvas DOM Element
   * @param {Object} projection - Instance of Projection class
   * @param {Object} viewportController - Instance of ViewportController class
   * @param {Object} [eventBus] - Instance of EventBus class
   */
  constructor(canvas, projection, viewportController, eventBus = null) {
    if (!canvas) {
      throw new Error('CanvasEngine requires a valid canvas element.');
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.projection = projection;
    this.viewportController = viewportController;
    this.eventBus = eventBus;
    this.isDarkMode = true;

    this.dpr = 1;
    this.cssWidth = 800;
    this.cssHeight = 600;
    this.needsRedraw = false;
    this.rafId = null;

    this._initVectorGeometry();
    this.init();
  }

  /**
   * Initialize engine, binding resize and event listeners.
   */
  init() {
    this.resize();
    this.setupListeners();
    this.requestRedraw();
  }

  /**
   * Auto-scale canvas for High-DPI / Retina displays and update Projection size.
   */
  resize() {
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    let cssWidth = 800;
    let cssHeight = 600;

    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      cssWidth = Math.floor(rect.width) || this.canvas.clientWidth || 800;
      cssHeight = Math.floor(rect.height) || this.canvas.clientHeight || 600;
    }

    this.dpr = dpr;
    this.cssWidth = cssWidth;
    this.cssHeight = cssHeight;

    this.canvas.width = Math.floor(cssWidth * dpr);
    this.canvas.height = Math.floor(cssHeight * dpr);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

    if (this.projection && typeof this.projection.setCanvasSize === 'function') {
      this.projection.setCanvasSize(cssWidth, cssHeight);
    }
    this.requestRedraw();
  }

  /**
   * Setup EventBus and window resize listeners.
   */
  setupListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.resize());
    }

    if (this.eventBus && typeof this.eventBus.on === 'function') {
      this.eventBus.on('viewport:changed', () => this.requestRedraw());
      this.eventBus.on('theme:changed', (e) => {
        this.setDarkMode(e?.isDark ?? true);
      });
    }
  }

  /**
   * Set theme mode (Dark / Light).
   * @param {boolean} isDark 
   */
  setDarkMode(isDark) {
    this.isDarkMode = Boolean(isDark);
    this.requestRedraw();
  }

  /**
   * Schedule a redraw frame via requestAnimationFrame (dirty-flag).
   */
  requestRedraw() {
    if (!this.needsRedraw) {
      this.needsRedraw = true;
      if (typeof requestAnimationFrame === 'function') {
        this.rafId = requestAnimationFrame(() => this.render());
      } else {
        this.render();
      }
    }
  }

  /**
   * Core 60fps procedural render frame.
   */
  render() {
    this.needsRedraw = false;
    this.rafId = null;

    const viewport = this.viewportController ? this.viewportController.getState() : { x: 0, y: 0, zoom: 1, width: this.cssWidth, height: this.cssHeight };
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (typeof ctx.scale === 'function') {
      ctx.scale(this.dpr, this.dpr);
    }

    // Render Layer Stack
    this.drawBackground(viewport);
    this.drawGrid(viewport);
    this.drawDistricts(viewport);
    this.drawParks(viewport);
    this.drawWaterways(viewport);
    this.drawRoads(viewport);
    this.drawScaleBar(viewport);

    ctx.restore();
  }

  // --- LAYER DRAWING IMPLEMENTATIONS ---

  drawBackground(viewport) {
    this.ctx.fillStyle = this.isDarkMode ? '#0f172a' : '#f1f5f9';
    this.ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
  }

  drawGrid(viewport) {
    const { ctx, projection } = this;
    if (!projection) return;

    const zoom = viewport.zoom || 1;
    const gridStep = zoom < 2.0 ? 0.01 : (zoom < 5.0 ? 0.005 : 0.002);
    const bounds = projection.getBounds();

    ctx.save();
    ctx.strokeStyle = this.isDarkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)';
    ctx.fillStyle = this.isDarkMode ? '#64748b' : '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    if (typeof ctx.setLineDash === 'function') {
      ctx.setLineDash([4, 4]);
    }

    for (let lng = Math.ceil(bounds.minLng / gridStep) * gridStep; lng <= bounds.maxLng; lng += gridStep) {
      const p1 = projection.geoToScreen(bounds.minLat, lng, viewport);
      const p2 = projection.geoToScreen(bounds.maxLat, lng, viewport);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      if (p1.y >= 0 && p1.y <= this.cssHeight) {
        ctx.fillText(`${lng.toFixed(3)}°E`, p1.x + 4, this.cssHeight - 8);
      }
    }

    for (let lat = Math.ceil(bounds.minLat / gridStep) * gridStep; lat <= bounds.maxLat; lat += gridStep) {
      const p1 = projection.geoToScreen(lat, bounds.minLng, viewport);
      const p2 = projection.geoToScreen(lat, bounds.maxLng, viewport);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      if (p1.x >= 0 && p1.x <= this.cssWidth) {
        ctx.fillText(`${lat.toFixed(3)}°N`, 8, p1.y - 4);
      }
    }
    ctx.restore();
  }

  drawDistricts(viewport) {
    const { ctx, projection } = this;
    if (!projection) return;

    const zoom = viewport.zoom || 1;

    for (const district of this.districts) {
      if (!district.polygon || district.polygon.length === 0) continue;

      ctx.save();
      ctx.beginPath();
      const first = projection.geoToScreen(district.polygon[0].lat, district.polygon[0].lng, viewport);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < district.polygon.length; i++) {
        const pt = projection.geoToScreen(district.polygon[i].lat, district.polygon[i].lng, viewport);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      ctx.fillStyle = district.color[this.isDarkMode ? 'dark' : 'light'];
      ctx.fill();

      ctx.strokeStyle = district.stroke[this.isDarkMode ? 'dark' : 'light'];
      ctx.lineWidth = 1.5;
      if (typeof ctx.setLineDash === 'function') {
        ctx.setLineDash([6, 3]);
      }
      ctx.stroke();

      // Centroid Label
      if (zoom >= 1.3 && district.center) {
        const centerPt = projection.geoToScreen(district.center.lat, district.center.lng, viewport);
        ctx.fillStyle = this.isDarkMode ? '#f8fafc' : '#0f172a';
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(district.name, centerPt.x, centerPt.y);
      }
      ctx.restore();
    }
  }

  drawParks(viewport) {
    const { ctx, projection } = this;
    if (!projection) return;

    for (const park of this.parks) {
      if (!park.polygon || park.polygon.length === 0) continue;
      ctx.save();
      ctx.beginPath();
      const first = projection.geoToScreen(park.polygon[0].lat, park.polygon[0].lng, viewport);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < park.polygon.length; i++) {
        const pt = projection.geoToScreen(park.polygon[i].lat, park.polygon[i].lng, viewport);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      ctx.fillStyle = this.isDarkMode ? 'rgba(16, 185, 129, 0.20)' : 'rgba(34, 197, 94, 0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawWaterways(viewport) {
    const { ctx, projection } = this;
    if (!projection) return;

    const zoom = viewport.zoom || 1;
    for (const water of this.waterways) {
      if (!water.path || water.path.length === 0) continue;
      ctx.save();
      ctx.beginPath();
      const first = projection.geoToScreen(water.path[0].lat, water.path[0].lng, viewport);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < water.path.length; i++) {
        const pt = projection.geoToScreen(water.path[i].lat, water.path[i].lng, viewport);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = Math.max(2, (water.width || 4) * Math.sqrt(zoom));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  drawRoads(viewport) {
    const { ctx, projection } = this;
    if (!projection) return;

    const zoom = viewport.zoom || 1;

    for (const road of this.roads) {
      if (road.type === 'local' && zoom < 1.2) continue; // LOD Culling

      ctx.save();
      ctx.beginPath();
      const first = projection.geoToScreen(road.path[0].lat, road.path[0].lng, viewport);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < road.path.length; i++) {
        const pt = projection.geoToScreen(road.path[i].lat, road.path[i].lng, viewport);
        ctx.lineTo(pt.x, pt.y);
      }

      if (road.type === 'highway') {
        ctx.strokeStyle = this.isDarkMode ? '#f59e0b' : '#d97706';
        ctx.lineWidth = Math.max(3, 4 * Math.sqrt(zoom));
      } else if (road.type === 'primary') {
        ctx.strokeStyle = this.isDarkMode ? '#38bdf8' : '#0284c7';
        ctx.lineWidth = Math.max(2, 3 * Math.sqrt(zoom));
      } else {
        ctx.strokeStyle = this.isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = Math.max(1, 1.5 * Math.sqrt(zoom));
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  drawScaleBar(viewport) {
    const { ctx, projection } = this;
    if (!projection) return;

    const zoom = viewport.zoom || 1;
    const centerLat = projection.getCenter().lat;
    const bounds = projection.getBounds();

    // 1. Calculate meters per pixel
    const centerCos = Math.cos((centerLat * Math.PI) / 180);
    const degPerPx = bounds.dLng / ((projection.baseWidth || this.cssWidth) * zoom);
    const metersPerPx = degPerPx * 111320 * centerCos;

    // 2. Select target metric distance
    const targetPxWidth = 120;
    const rawMeters = targetPxWidth * metersPerPx;

    const steps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
    let chosenMeters = steps[0];
    for (const step of steps) {
      if (rawMeters >= step) chosenMeters = step;
      else break;
    }

    const actualBarPx = Math.max(20, chosenMeters / (metersPerPx || 1));

    // 3. Render Bar on Canvas Bottom-Left
    const x = 20;
    const y = this.cssHeight - 20;
    const barHeight = 6;

    ctx.save();
    ctx.strokeStyle = this.isDarkMode ? '#f8fafc' : '#0f172a';
    ctx.fillStyle = this.isDarkMode ? '#f8fafc' : '#0f172a';
    ctx.lineWidth = 2;

    // Main Bar line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + actualBarPx, y);
    // End Ticks
    ctx.moveTo(x, y - barHeight);
    ctx.lineTo(x, y + 2);
    ctx.moveTo(x + actualBarPx, y - barHeight);
    ctx.lineTo(x + actualBarPx, y + 2);
    ctx.stroke();

    // Label Text
    const label = chosenMeters >= 1000 ? `${chosenMeters / 1000} km` : `${chosenMeters} m`;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + actualBarPx + 8, y + 3);
    ctx.restore();
  }

  /**
   * Internal procedural vector geometry datasets for Laxou & Nancy.
   * @private
   */
  _initVectorGeometry() {
    // 1. District Boundaries
    this.districts = [
      {
        id: 'champ-le-boeuf',
        name: 'Champ-le-Bœuf (NPRNU)',
        center: { lat: 48.6970, lng: 6.1430 },
        color: { dark: 'rgba(16, 185, 129, 0.12)', light: 'rgba(16, 185, 129, 0.15)' },
        stroke: { dark: 'rgba(16, 185, 129, 0.5)', light: 'rgba(16, 185, 129, 0.6)' },
        polygon: [
          { lat: 48.7020, lng: 6.1350 },
          { lat: 48.7020, lng: 6.1480 },
          { lat: 48.6930, lng: 6.1480 },
          { lat: 48.6930, lng: 6.1350 }
        ]
      },
      {
        id: 'laxou-village',
        name: 'Laxou Village',
        center: { lat: 48.6870, lng: 6.1490 },
        color: { dark: 'rgba(99, 102, 241, 0.12)', light: 'rgba(99, 102, 241, 0.15)' },
        stroke: { dark: 'rgba(99, 102, 241, 0.5)', light: 'rgba(99, 102, 241, 0.6)' },
        polygon: [
          { lat: 48.6920, lng: 6.1420 },
          { lat: 48.6920, lng: 6.1560 },
          { lat: 48.6820, lng: 6.1560 },
          { lat: 48.6820, lng: 6.1420 }
        ]
      },
      {
        id: 'laxou-provinces',
        name: 'Laxou Sapinière & Provinces (NPRNU)',
        center: { lat: 48.6795, lng: 6.1500 },
        color: { dark: 'rgba(236, 72, 153, 0.12)', light: 'rgba(236, 72, 153, 0.15)' },
        stroke: { dark: 'rgba(236, 72, 153, 0.5)', light: 'rgba(236, 72, 153, 0.6)' },
        polygon: [
          { lat: 48.6840, lng: 6.1400 },
          { lat: 48.6840, lng: 6.1600 },
          { lat: 48.6750, lng: 6.1600 },
          { lat: 48.6750, lng: 6.1400 }
        ]
      },
      {
        id: 'nancy-centre',
        name: 'Nancy Centre',
        center: { lat: 48.6925, lng: 6.1800 },
        color: { dark: 'rgba(245, 158, 11, 0.08)', light: 'rgba(245, 158, 11, 0.12)' },
        stroke: { dark: 'rgba(245, 158, 11, 0.4)', light: 'rgba(245, 158, 11, 0.5)' },
        polygon: [
          { lat: 48.7000, lng: 6.1650 },
          { lat: 48.7000, lng: 6.1950 },
          { lat: 48.6850, lng: 6.1950 },
          { lat: 48.6850, lng: 6.1650 }
        ]
      }
    ];

    // 2. Parks & Woodland
    this.parks = [
      {
        id: 'champ-de-boufflers',
        polygon: [
          { lat: 48.6860, lng: 6.1460 },
          { lat: 48.6860, lng: 6.1500 },
          { lat: 48.6830, lng: 6.1500 },
          { lat: 48.6830, lng: 6.1460 }
        ]
      },
      {
        id: 'parc-provinces',
        polygon: [
          { lat: 48.6840, lng: 6.1540 },
          { lat: 48.6840, lng: 6.1590 },
          { lat: 48.6815, lng: 6.1590 },
          { lat: 48.6815, lng: 6.1540 }
        ]
      },
      {
        id: 'pepiniere-nancy',
        polygon: [
          { lat: 48.6990, lng: 6.1820 },
          { lat: 48.6990, lng: 6.1880 },
          { lat: 48.6950, lng: 6.1880 },
          { lat: 48.6950, lng: 6.1820 }
        ]
      },
      {
        id: 'parc-sainte-marie',
        polygon: [
          { lat: 48.6825, lng: 6.1700 },
          { lat: 48.6825, lng: 6.1740 },
          { lat: 48.6795, lng: 6.1740 },
          { lat: 48.6795, lng: 6.1700 }
        ]
      }
    ];

    // 3. Rivers & Waterways
    this.waterways = [
      {
        id: 'la-meurthe',
        width: 6,
        path: [
          { lat: 48.7050, lng: 6.1960 },
          { lat: 48.6980, lng: 6.1930 },
          { lat: 48.6900, lng: 6.1910 },
          { lat: 48.6800, lng: 6.1950 }
        ]
      },
      {
        id: 'canal-marne-rhin',
        width: 4,
        path: [
          { lat: 48.7040, lng: 6.1900 },
          { lat: 48.6960, lng: 6.1870 },
          { lat: 48.6880, lng: 6.1850 }
        ]
      }
    ];

    // 4. Vector Roads
    this.roads = [
      {
        id: 'a31-highway',
        type: 'highway',
        path: [
          { lat: 48.7080, lng: 6.1280 },
          { lat: 48.6950, lng: 6.1320 },
          { lat: 48.6800, lng: 6.1360 },
          { lat: 48.6650, lng: 6.1400 }
        ]
      },
      {
        id: 'av-boufflers',
        type: 'primary',
        path: [
          { lat: 48.6880, lng: 6.1350 },
          { lat: 48.6870, lng: 6.1550 },
          { lat: 48.6890, lng: 6.1750 }
        ]
      },
      {
        id: 'av-europe',
        type: 'primary',
        path: [
          { lat: 48.6830, lng: 6.1400 },
          { lat: 48.6820, lng: 6.1600 },
          { lat: 48.6840, lng: 6.1780 }
        ]
      },
      {
        id: 'rue-saint-exupery',
        type: 'local',
        path: [
          { lat: 48.6975, lng: 6.1400 },
          { lat: 48.6965, lng: 6.1460 }
        ]
      },
      {
        id: 'rue-deroulede',
        type: 'local',
        path: [
          { lat: 48.6890, lng: 6.1480 },
          { lat: 48.6875, lng: 6.1530 }
        ]
      }
    ];
  }
}
