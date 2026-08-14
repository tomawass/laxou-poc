/**
 * AccessibilityManager - Gestionnaire d'accessibilité (a11y) & navigation clavier.
 * Fournit les raccourcis clavier pour la carte (+/-, flèches, Échap),
 * la gestion de la région ARIA live et les contours de focus.
 */
export class AccessibilityManager {
  /**
   * @param {Object} eventBus - Instance d'EventBus
   * @param {Object} viewport - Instance de ViewportController
   * @param {Object} elements - { liveRegion, mapView }
   */
  constructor(eventBus, viewport, elements = {}) {
    this.eventBus = eventBus;
    this.viewport = viewport;
    this.elements = elements;

    this.liveRegionEl = null;
    this._initLiveRegion();
    this._setupKeyboardNavigation();
    this._setupEventListeners();
  }

  /**
   * Crée un élément d'annonce ARIA Live récursif.
   * @private
   */
  _initLiveRegion() {
    if (typeof document === 'undefined') return;

    let el = document.getElementById('a11y-live-region');
    if (!el) {
      el = document.createElement('div');
      el.id = 'a11y-live-region';
      el.className = 'sr-only';
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      el.style.position = 'absolute';
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.padding = '0';
      el.style.margin = '-1px';
      el.style.overflow = 'hidden';
      el.style.clip = 'rect(0, 0, 0, 0)';
      el.style.whiteSpace = 'nowrap';
      el.style.border = '0';
      document.body.appendChild(el);
    }
    this.liveRegionEl = el;
  }

  /**
   * Configure les raccourcis clavier pour le contrôle de la carte.
   * @private
   */
  _setupKeyboardNavigation() {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (e) => {
      // Ignorer si l'utilisateur saisit dans un champ texte
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT'
      );

      if (isInput && e.key !== 'Escape') return;

      const panStep = 50;

      switch (e.key) {
        // Zoom clavier (+ / -)
        case '+':
        case '=':
          if (this.viewport) {
            this.viewport.zoomAt(this.viewport.width / 2, this.viewport.height / 2, 1.25);
            this.announce(`Zoom avant (Niveau ${this.viewport.zoom.toFixed(1)})`);
          }
          break;

        case '-':
        case '_':
          if (this.viewport) {
            this.viewport.zoomAt(this.viewport.width / 2, this.viewport.height / 2, 0.8);
            this.announce(`Zoom arrière (Niveau ${this.viewport.zoom.toFixed(1)})`);
          }
          break;

        // Déplacement par flèches
        case 'ArrowUp':
          if (this.viewport) {
            this.viewport.panBy(0, panStep);
            e.preventDefault();
          }
          break;

        case 'ArrowDown':
          if (this.viewport) {
            this.viewport.panBy(0, -panStep);
            e.preventDefault();
          }
          break;

        case 'ArrowLeft':
          if (this.viewport) {
            this.viewport.panBy(panStep, 0);
            e.preventDefault();
          }
          break;

        case 'ArrowRight':
          if (this.viewport) {
            this.viewport.panBy(-panStep, 0);
            e.preventDefault();
          }
          break;

        // Touche Échap
        case 'Escape':
          this.eventBus.emit('drawer:toggled', { isOpen: false });
          break;
      }
    });
  }

  /**
   * Écoute les événements du bus pour annoncer les changements aux lecteurs d'écran.
   * @private
   */
  _setupEventListeners() {
    if (!this.eventBus) return;

    this.eventBus.on('place:selected', ({ place }) => {
      if (place && place.name) {
        this.announce(`Lieu sélectionné : ${place.name}, ${place.address || ''}`);
      }
    });

    this.eventBus.on('filter:changed', ({ count, categoryId }) => {
      this.announce(`${count} lieu${count > 1 ? 'x' : ''} trouvé${count > 1 ? 's' : ''}`);
    });
  }

  /**
   * Annonce un message vocal au lecteur d'écran via ARIA live region.
   * @param {string} message 
   */
  announce(message) {
    if (!this.liveRegionEl || !message) return;
    this.liveRegionEl.textContent = '';
    // Décalage léger pour garantir la détection de modification DOM par les lecteurs d'écran
    setTimeout(() => {
      if (this.liveRegionEl) {
        this.liveRegionEl.textContent = message;
      }
    }, 50);
  }
}
