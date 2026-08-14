/**
 * ImageMapEngine - Moteur de carte interactif basé sur une image illustrée (Laxou Horizon 2028)
 * Gère le pan (glisser), le zoom focal (molette / boutons / tactile) et le positionnement relatif (x%, y%).
 */
export class ImageMapEngine {
  /**
   * @param {HTMLElement} containerEl - Conteneur DOM (#map-view)
   * @param {HTMLElement} imageOverlayEl - Élément conteneur de l'image (#map-image-container)
   * @param {Object} eventBus - Instance d'EventBus
   */
  constructor(containerEl, imageOverlayEl, eventBus) {
    this.container = containerEl;
    this.imageContainer = imageOverlayEl;
    this.eventBus = eventBus;

    // Viewport State
    this.zoom = 1.0;
    this.minZoom = 0.8;
    this.maxZoom = 4.0;
    this.panX = 0;
    this.panY = 0;

    this.imageWidth = 1600;
    this.imageHeight = 900;

    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    this.init();
  }

  init() {
    this.attachEventListeners();
    this.updateTransform();
  }

  /**
   * Convertit des coordonnées relatives en pourcentage (0-100%) sur l'image en pixels écran.
   * @param {number} xPct - Pourcentage X (0 à 100)
   * @param {number} yPct - Pourcentage Y (0 à 100)
   * @returns {{x: number, y: number}}
   */
  geoToScreen(xPct, yPct) {
    const containerRect = this.container.getBoundingClientRect();
    const cx = containerRect.width / 2;
    const cy = containerRect.height / 2;

    // Position du centre de l'image par rapport au conteneur
    const imgX = (xPct / 100 - 0.5) * this.imageWidth * this.zoom;
    const imgY = (yPct / 100 - 0.5) * this.imageHeight * this.zoom;

    const screenX = cx + this.panX + imgX;
    const screenY = cy + this.panY + imgY;

    return { x: screenX, y: screenY };
  }

  /**
   * Centre la caméra sur des coordonnées relatives (xPct, yPct) avec un zoom cible.
   * @param {number} xPct 
   * @param {number} yPct 
   * @param {number} [targetZoom] 
   */
  centerOnPct(xPct, yPct, targetZoom = null) {
    if (targetZoom !== null && isFinite(targetZoom)) {
      this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, targetZoom));
    }

    // Le centre de l'image (50%, 50%) correspond à panX=0, panY=0
    // Pour centrer (xPct, yPct), on inverse le décalage
    this.panX = -(xPct / 100 - 0.5) * this.imageWidth * this.zoom;
    this.panY = -(yPct / 100 - 0.5) * this.imageHeight * this.zoom;

    this.updateTransform();
  }

  zoomIn() {
    this.zoomAt(this.container.clientWidth / 2, this.container.clientHeight / 2, 1.3);
  }

  zoomOut() {
    this.zoomAt(this.container.clientWidth / 2, this.container.clientHeight / 2, 0.77);
  }

  zoomAt(pivotX, pivotY, factor) {
    const newZoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * factor));
    if (newZoom === this.zoom) return;

    const containerRect = this.container.getBoundingClientRect();
    const cx = containerRect.width / 2;
    const cy = containerRect.height / 2;

    const mouseOffsetX = pivotX - cx - this.panX;
    const mouseOffsetY = pivotY - cy - this.panY;

    const zoomRatio = newZoom / this.zoom;

    this.panX = pivotX - cx - mouseOffsetX * zoomRatio;
    this.panY = pivotY - cy - mouseOffsetY * zoomRatio;
    this.zoom = newZoom;

    this.updateTransform();
  }

  updateTransform() {
    if (this.imageContainer) {
      this.imageContainer.style.transform = `translate(-50%, -50%) translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }

    if (this.eventBus) {
      this.eventBus.emit('viewport:changed', {
        zoom: this.zoom,
        panX: this.panX,
        panY: this.panY,
        width: this.container.clientWidth,
        height: this.container.clientHeight
      });
    }
  }

  attachEventListeners() {
    if (!this.container) return;

    // Pan / Drag souris
    this.container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.map-marker') || e.target.closest('.map-ctrl-btn')) return;
      this.isDragging = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.container.style.cursor = 'grabbing';
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', (e) => {
        if (!this.isDragging) return;
        this.panX = e.clientX - this.startX;
        this.panY = e.clientY - this.startY;
        this.updateTransform();
      });

      window.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          this.container.style.cursor = 'grab';
        }
      });
    }

    // Zoom molette
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      this.zoomAt(mouseX, mouseY, factor);
    }, { passive: false });

    // Touch events mobile
    let touchStartDist = 0;
    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX - this.panX;
        this.startY = e.touches[0].clientY - this.panY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    this.container.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        this.panX = e.touches[0].clientX - this.startX;
        this.panY = e.touches[0].clientY - this.startY;
        this.updateTransform();
      } else if (e.touches.length === 2 && touchStartDist > 0) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / touchStartDist;
        const rect = this.container.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        this.zoomAt(midX, midY, factor);
        touchStartDist = dist;
      }
    }, { passive: true });

    this.container.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Resize
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.updateTransform();
      });
    }
  }
}
