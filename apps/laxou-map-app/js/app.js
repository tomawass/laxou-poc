/**
 * Laxou Map App - Main Application Entrypoint & Component Orchestrator
 * Leaflet Tile Engine + Hybrid Custom Canvas/DOM Architecture.
 */

import { EventBus } from './eventBus.js';
import { Projection } from './projection.js';
import { DataProvider } from './dataProvider.js';
import { ViewportController } from './viewport.js';
import { CanvasEngine } from './canvasEngine.js';
import { LeafletEngine } from './leafletEngine.js';
import { MarkerManager } from './markerManager.js';
import { SidebarController } from './sidebarController.js';
import { FilterSearchController } from './filterSearchController.js';
import { AccessibilityManager } from './accessibilityManager.js';
import { AdminController } from './adminController.js';

export class App {
  constructor() {
    // Core Component Instances
    this.eventBus = new EventBus();
    this.dataProvider = new DataProvider(this.eventBus);
    this.projection = null;
    this.viewport = null;
    this.canvasEngine = null;
    this.leafletEngine = null;
    this.markerManager = null;
    this.sidebarController = null;
    this.filterSearchController = null;
    this.accessibilityManager = null;
    this.adminController = null;

    // UI State
    this.selectedPlaceId = null;

    // DOM Elements Cache
    this.elements = {};
  }

  /**
   * Initialize Application components, DOM listeners, and data ingestion.
   */
  async init() {
    this._cacheDOMElements();
    this._initEngineComponents();
    this.setupEventListeners();
    await this.loadData();
  }

  /**
   * Cache DOM elements.
   * @private
   */
  _cacheDOMElements() {
    this.elements = {
      mapView: document.getElementById('map-view'),
      mapCanvas: document.getElementById('map-canvas'),
      markerOverlay: document.getElementById('marker-overlay'),
      zoomInBtn: document.getElementById('zoom-in-btn'),
      zoomOutBtn: document.getElementById('zoom-out-btn'),
      searchInput: document.getElementById('search-input'),
      clearSearchBtn: document.getElementById('clear-search-btn'),
      categoriesBar: document.getElementById('categories-bar'),
      placesList: document.getElementById('places-list'),
      placesBadge: document.getElementById('places-badge'),
      resultsCount: document.getElementById('results-count'),
      sidebar: document.getElementById('sidebar'),
      toggleSidebarBtn: document.getElementById('toggle-sidebar-btn'),
      closeSidebarBtn: document.getElementById('close-sidebar-btn'),
      themeToggleBtn: document.getElementById('theme-toggle-btn'),
      detailDrawer: document.getElementById('detail-drawer'),
      drawerContent: document.getElementById('drawer-content'),
      closeDrawerBtn: document.getElementById('close-drawer-btn')
    };
  }

  /**
   * Instantiate Projection, ViewportController, LeafletEngine, CanvasEngine, MarkerManager, SidebarController, FilterSearchController, and AccessibilityManager.
   * @private
   */
  _initEngineComponents() {
    const { mapView, mapCanvas, markerOverlay, zoomInBtn, zoomOutBtn } = this.elements;

    let width = 800;
    let height = 600;

    if (mapView) {
      const rect = mapView.getBoundingClientRect();
      width = Math.floor(rect.width) || mapView.clientWidth || 800;
      height = Math.floor(rect.height) || mapView.clientHeight || 600;
    }

    // 1. Projection (M1)
    this.projection = new Projection(Projection.DEFAULT_BOUNDS, { width, height });

    // 2. Viewport Controller (M2)
    this.viewport = new ViewportController(this.projection, this.eventBus, { width, height });

    // 3. Leaflet Tile Engine (CartoDB / OpenStreetMap real street map)
    if (mapView && typeof L !== 'undefined') {
      this.leafletEngine = new LeafletEngine(mapView, this.eventBus);
      this.viewport.leafletEngine = this.leafletEngine;
    } else if (mapView) {
      this.viewport.attachEventListeners(mapView, zoomInBtn, zoomOutBtn);
    }

    // Attach zoom buttons to viewport / leaflet
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.leafletEngine) this.leafletEngine.zoomIn();
        else this.viewport.zoomAt(this.viewport.width / 2, this.viewport.height / 2, 1.25);
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.leafletEngine) this.leafletEngine.zoomOut();
        else this.viewport.zoomAt(this.viewport.width / 2, this.viewport.height / 2, 0.8);
      });
    }

    // 4. Canvas Engine (M2 fallback / vector layers)
    if (mapCanvas && !this.leafletEngine) {
      this.canvasEngine = new CanvasEngine(mapCanvas, this.projection, this.viewport, this.eventBus);
    }

    // 5. Marker Manager (M3)
    if (markerOverlay) {
      this.markerManager = new MarkerManager(
        markerOverlay,
        this.projection,
        this.viewport,
        this.eventBus,
        this.dataProvider
      );
    }

    // 6. Sidebar Controller (M3)
    this.sidebarController = new SidebarController(
      this.eventBus,
      this.dataProvider,
      this.elements
    );

    // 7. Filter & Search Controller (M4)
    this.filterSearchController = new FilterSearchController(
      this.eventBus,
      this.dataProvider,
      this.elements
    );

    // 8. Accessibility Manager (M5)
    this.accessibilityManager = new AccessibilityManager(
      this.eventBus,
      this.viewport,
      this.elements
    );

    // 9. Admin Controller (Auth & Data Management)
    this.adminController = new AdminController(
      this.eventBus,
      this.dataProvider,
      this.elements
    );

    // 10. Wire viewport:changed to synchronize Projection & CanvasEngine
    this.eventBus.on('viewport:changed', (vpState) => {
      if (this.projection && vpState.width) {
        this.projection.setCanvasSize(vpState.width, vpState.height);
      }
      if (this.canvasEngine) {
        this.canvasEngine.requestRedraw();
      }
    });

    // 11. Wire place:selected to recenter map camera (Leaflet or Viewport)
    this.eventBus.on('place:selected', ({ placeId, place }) => {
      this.selectedPlaceId = placeId;
      const targetPlace = place || this.dataProvider.getPlaceById(placeId);
      if (targetPlace && isFinite(targetPlace.lat) && isFinite(targetPlace.lng)) {
        if (this.leafletEngine) {
          this.leafletEngine.centerOnGeo(targetPlace.lat, targetPlace.lng);
        } else if (this.viewport) {
          this.viewport.centerOnGeo(targetPlace.lat, targetPlace.lng, Math.max(3.0, this.viewport.zoom));
        }
      }
    });

    // 12. Wire filter:changed to update Sidebar & Markers
    this.eventBus.on('filter:changed', ({ places }) => {
      const activePlaces = places || this.dataProvider.getPlaces();
      if (this.markerManager) {
        this.markerManager.renderMarkers(this.dataProvider.getPlaces());
        this.markerManager.setVisiblePlaces(activePlaces.map(p => p.id));
      }
      if (this.sidebarController) {
        this.sidebarController.renderPlacesList(activePlaces);
      }
    });
  }

  /**
   * Load data.json and render initial UI.
   */
  async loadData() {
    try {
      const appData = await this.dataProvider.loadData('./data.json');

      // Render Categories Filter Chips
      if (this.filterSearchController) {
        this.filterSearchController.renderCategories();
      }

      // Render Map Markers
      if (this.markerManager) {
        this.markerManager.renderMarkers(this.dataProvider.getPlaces());
      }

      // Center viewport camera on Laxou center
      if (appData.metadata && appData.metadata.center) {
        const c = appData.metadata.center;
        if (this.leafletEngine) {
          this.leafletEngine.centerOnGeo(c.lat, c.lng, appData.metadata.defaultZoom || 14);
        } else if (this.viewport) {
          this.viewport.centerOnGeo(c.lat, c.lng, appData.metadata.defaultZoom || 1.0);
        }
      }

      // Initial filter render
      if (this.filterSearchController) {
        this.filterSearchController.setCategory('all');
      }

      // Update Admin UI state
      if (this.adminController) {
        this.adminController.updateAdminUI();
      }

    } catch (error) {
      console.error('Erreur lors du chargement de data.json:', error);
      if (this.elements.resultsCount) {
        this.elements.resultsCount.textContent = 'Erreur de chargement des données.';
      }
    }
  }

  /**
   * Select a place programmatically by ID.
   * @param {string} placeId 
   */
  selectPlace(placeId) {
    const place = this.dataProvider.getPlaceById(placeId);
    if (!place) return;
    this.eventBus.emit('place:selected', { placeId, place, source: 'external' });
  }

  /**
   * Setup UI event listeners.
   */
  setupEventListeners() {
    const {
      toggleSidebarBtn,
      closeSidebarBtn,
      sidebar,
      themeToggleBtn
    } = this.elements;

    // Sidebar Toggles
    if (toggleSidebarBtn && sidebar) {
      toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    if (closeSidebarBtn && sidebar) {
      closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
      });
    }

    // Theme Toggle
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        themeToggleBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        this.eventBus.emit('theme:changed', { isDark: !isLight });
      });
    }

    // Admin UI Event Listeners
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const adminLoginModal = document.getElementById('admin-login-modal');
    const closeAdminLoginModalBtn = document.getElementById('close-admin-login-modal');
    const adminLoginForm = document.getElementById('admin-login-form');
    const loginErrorMsg = document.getElementById('login-error-msg');

    if (adminLoginBtn) {
      adminLoginBtn.addEventListener('click', () => {
        if (this.adminController.isAdmin) {
          alert('Vous êtes actuellement connecté en tant qu\'administrateur (@laxou.fr).');
        } else {
          this.adminController.showLoginModal();
        }
      });
    }

    if (closeAdminLoginModalBtn && adminLoginModal) {
      closeAdminLoginModalBtn.addEventListener('click', () => {
        adminLoginModal.classList.add('hidden');
      });
    }

    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        const success = this.adminController.login(email, password);
        if (success) {
          if (loginErrorMsg) loginErrorMsg.classList.add('hidden');
          adminLoginModal.classList.add('hidden');
          adminLoginForm.reset();
        } else {
          if (loginErrorMsg) loginErrorMsg.classList.remove('hidden');
        }
      });
    }

    // Admin Controls Banner Actions
    const adminAddBtn = document.getElementById('admin-add-place-btn');
    const adminExportBtn = document.getElementById('admin-export-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    if (adminAddBtn) {
      adminAddBtn.addEventListener('click', () => {
        this.adminController.showEditorModal(null);
      });
    }

    if (adminExportBtn) {
      adminExportBtn.addEventListener('click', () => {
        this.adminController.exportJSON();
      });
    }

    if (adminLogoutBtn) {
      adminLogoutBtn.addEventListener('click', () => {
        this.adminController.logout();
      });
    }

    // Admin Editor Modal
    const adminEditorModal = document.getElementById('admin-editor-modal');
    const closeAdminEditorModalBtn = document.getElementById('close-admin-editor-modal');
    const adminEditorForm = document.getElementById('admin-editor-form');

    if (closeAdminEditorModalBtn && adminEditorModal) {
      closeAdminEditorModalBtn.addEventListener('click', () => {
        adminEditorModal.classList.add('hidden');
      });
    }

    if (adminEditorForm) {
      adminEditorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.adminController.savePlaceFromForm();
      });
    }
  }
}

// Global Application Auto-initialization
let app = null;

if (typeof document !== 'undefined') {
  const launchApp = () => {
    app = new App();
    app.init();
    // Expose selectPlace on window for backward compatibility / marker popups
    window.selectPlace = (id) => app.selectPlace(id);
    window.laxouApp = app;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', launchApp);
  } else {
    launchApp();
  }
}
