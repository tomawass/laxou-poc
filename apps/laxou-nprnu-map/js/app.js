/**
 * Laxou Horizon 2028 - Application Carte Illustrée NPRNU
 * Orchestrateur principal avec moteur d'image interactif.
 */

import { EventBus } from './eventBus.js';
import { DataProvider } from './dataProvider.js';
import { ImageMapEngine } from './imageMapEngine.js';
import { MarkerManager } from './markerManager.js';
import { SidebarController } from './sidebarController.js';
import { FilterSearchController } from './filterSearchController.js';
import { AccessibilityManager } from './accessibilityManager.js';
import { AdminController } from './adminController.js';

export class App {
  constructor() {
    this.eventBus = new EventBus();
    this.dataProvider = new DataProvider(this.eventBus);
    this.imageEngine = null;
    this.markerManager = null;
    this.sidebarController = null;
    this.filterSearchController = null;
    this.accessibilityManager = null;
    this.adminController = null;

    this.selectedPlaceId = null;
    this.elements = {};
  }

  async init() {
    this._cacheDOMElements();
    this._initEngineComponents();
    this.setupEventListeners();
    await this.loadData();
  }

  _cacheDOMElements() {
    this.elements = {
      mapView: document.getElementById('map-view'),
      mapImageContainer: document.getElementById('map-image-container'),
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

  _initEngineComponents() {
    const { mapView, mapImageContainer, markerOverlay, zoomInBtn, zoomOutBtn } = this.elements;

    // 1. Moteur de carte sur image
    if (mapView && mapImageContainer) {
      this.imageEngine = new ImageMapEngine(mapView, mapImageContainer, this.eventBus);
    }

    if (zoomInBtn && this.imageEngine) {
      zoomInBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.imageEngine.zoomIn();
      });
    }

    if (zoomOutBtn && this.imageEngine) {
      zoomOutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.imageEngine.zoomOut();
      });
    }

    // 2. Gestionnaire de marqueurs sur l'image
    if (markerOverlay && this.imageEngine) {
      this.markerManager = new MarkerManager(
        markerOverlay,
        this.imageEngine,
        this.eventBus,
        this.dataProvider
      );
    }

    // 3. Panneau Latéral
    this.sidebarController = new SidebarController(
      this.eventBus,
      this.dataProvider,
      this.elements
    );

    // 4. Filtres & Recherche
    this.filterSearchController = new FilterSearchController(
      this.eventBus,
      this.dataProvider,
      this.elements
    );

    // 5. Accessibilité
    this.accessibilityManager = new AccessibilityManager(
      this.eventBus,
      { zoom: 1.0 },
      this.elements
    );

    // 6. Administration
    this.adminController = new AdminController(
      this.eventBus,
      this.dataProvider,
      this.elements
    );

    // 7. Sélection d'un lieu : La carte reste fixe à 100% (pas de zoom), seul le marqueur se surélève
    this.eventBus.on('place:selected', ({ placeId }) => {
      this.selectedPlaceId = placeId;
    });

    // 8. Synchroniser le filtrage
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

  async loadData() {
    try {
      const appData = await this.dataProvider.loadData('./data.json');

      if (this.filterSearchController) {
        this.filterSearchController.renderCategories();
      }

      if (this.markerManager) {
        this.markerManager.renderMarkers(this.dataProvider.getPlaces());
      }

      if (this.filterSearchController) {
        this.filterSearchController.setCategory('all');
      }

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

  selectPlace(placeId) {
    const place = this.dataProvider.getPlaceById(placeId);
    if (!place) return;
    this.eventBus.emit('place:selected', { placeId, place, source: 'external' });
  }

  setupEventListeners() {
    const { toggleSidebarBtn, closeSidebarBtn, sidebar, themeToggleBtn } = this.elements;

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

function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  if (url.includes('embed/')) {
    return url.includes('autoplay=1') ? url : `${url}${url.includes('?') ? '&' : '?'}autoplay=1`;
  }
  const idMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (!idMatch) return url;
  const videoId = idMatch[1];
  const startMatch = url.match(/[?&]t=(\d+)s?/) || url.match(/[?&]start=(\d+)/);
  const startParam = startMatch ? `?start=${startMatch[1]}&autoplay=1` : '?autoplay=1';
  return `https://www.youtube.com/embed/${videoId}${startParam}`;
}

function getYouTubeThumbnailUrl(url) {
  if (!url) return '';
  const idMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (!idMatch) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400';
  return `https://img.youtube.com/vi/${idMatch[1]}/hqdefault.jpg`;
}

    // Modale Vidéo & Cartes dynamiques
    const videoBtn = document.getElementById('video-btn');
    const videoModal = document.getElementById('video-modal');
    const closeVideoModalBtn = document.getElementById('close-video-modal');
    const youtubeIframe = document.getElementById('youtube-iframe');
    const dualVideoCards = document.getElementById('dual-video-cards');

    const renderVideoModal = (selectedIdx = 0) => {
      if (!dualVideoCards) return;
      const videos = this.dataProvider.getVideos();
      dualVideoCards.innerHTML = '';

      if (videos.length === 0) {
        dualVideoCards.innerHTML = '<p style="color: #64748b; font-size: 0.9rem;">Aucune vidéo disponible pour le moment.</p>';
        if (youtubeIframe) youtubeIframe.src = '';
        return;
      }

      videos.forEach((vid, idx) => {
        const thumbUrl = getYouTubeThumbnailUrl(vid.youtubeUrl);
        const isSelected = idx === selectedIdx;
        const card = document.createElement('div');
        card.className = `video-card${isSelected ? ' active' : ''}`;
        card.style.cssText = `
          background: ${isSelected ? '#eff6ff' : '#f8fafc'};
          border: 2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'};
          border-radius: 16px;
          padding: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          box-shadow: ${isSelected ? '0 4px 15px rgba(59,130,246,0.2)' : 'none'};
        `;
        card.innerHTML = `
          <div class="vcard-thumb" style="position: relative; width: 105px; height: 64px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #000;">
            <img src="${thumbUrl}" alt="${vid.title}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;">
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3);">
              <i class="fa-solid fa-circle-play" style="color: #ffffff; font-size: 1.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));"></i>
            </div>
          </div>
          <div class="vcard-info" style="flex: 1;">
            <div style="font-size: 0.7rem; font-weight: 700; color: ${isSelected ? '#2563eb' : '#64748b'}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.2rem;">Vidéo ${idx + 1}</div>
            <h4 style="font-size: 0.9rem; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.25;">${vid.title}</h4>
          </div>
        `;

        card.addEventListener('click', () => {
          renderVideoModal(idx);
        });

        dualVideoCards.appendChild(card);
      });

      const activeVid = videos[selectedIdx] || videos[0];
      if (youtubeIframe && activeVid) {
        youtubeIframe.src = getYouTubeEmbedUrl(activeVid.youtubeUrl);
      }
    };

    if (videoBtn && videoModal) {
      videoBtn.addEventListener('click', () => {
        videoModal.classList.remove('hidden');
        renderVideoModal(0);
      });
    }

    if (closeVideoModalBtn && videoModal) {
      closeVideoModalBtn.addEventListener('click', () => {
        videoModal.classList.add('hidden');
        if (youtubeIframe) youtubeIframe.src = '';
      });
    }

    if (videoModal) {
      videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
          videoModal.classList.add('hidden');
          if (youtubeIframe) youtubeIframe.src = '';
        }
      });
    }

    // Modal Admin Gestion des Vidéos
    const adminAddVideoBtn = document.getElementById('admin-add-video-btn');
    const adminVideoModal = document.getElementById('admin-video-modal');
    const closeAdminVideoModal = document.getElementById('close-admin-video-modal');
    const adminVideosList = document.getElementById('admin-videos-list');
    const btnSaveNewVideo = document.getElementById('btn-save-new-video');

    const renderAdminVideosList = () => {
      if (!adminVideosList) return;
      const videos = this.dataProvider.getVideos();
      adminVideosList.innerHTML = '';

      if (videos.length === 0) {
        adminVideosList.innerHTML = '<p style="color: #64748b; font-size: 0.85rem;">Aucune vidéo enregistrée.</p>';
        return;
      }

      videos.forEach((vid, idx) => {
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.8rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.88rem;';
        item.innerHTML = `
          <div>
            <strong style="color: #0f172a;">Vidéo ${idx + 1} : ${vid.title}</strong>
            <div style="font-size: 0.75rem; color: #64748b; font-family: monospace;">${vid.youtubeUrl}</div>
          </div>
          <button class="btn-del-vid" data-id="${vid.id}" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 0.3rem 0.6rem; cursor: pointer; font-size: 0.8rem;"><i class="fa-solid fa-trash-can"></i> Supprimer</button>
        `;

        item.querySelector('.btn-del-vid').addEventListener('click', () => {
          if (confirm(`Supprimer la vidéo "${vid.title}" ?`)) {
            this.dataProvider.deleteVideo(vid.id);
            renderAdminVideosList();
          }
        });

        adminVideosList.appendChild(item);
      });
    };

    if (adminAddVideoBtn && adminVideoModal) {
      adminAddVideoBtn.addEventListener('click', () => {
        if (!this.adminController.isAdmin) {
          alert('Mode Administrateur connecté requis.');
          return;
        }
        adminVideoModal.classList.remove('hidden');
        renderAdminVideosList();
      });
    }

    if (closeAdminVideoModal && adminVideoModal) {
      closeAdminVideoModal.addEventListener('click', () => {
        adminVideoModal.classList.add('hidden');
      });
    }

    if (btnSaveNewVideo) {
      btnSaveNewVideo.addEventListener('click', (e) => {
        e.preventDefault();
        const titleEl = document.getElementById('new-video-title');
        const urlEl = document.getElementById('new-video-url');

        const title = titleEl ? titleEl.value.trim() : '';
        const youtubeUrl = urlEl ? urlEl.value.trim() : '';

        if (!title || !youtubeUrl) {
          alert('Veuillez renseigner le titre et le lien YouTube.');
          return;
        }

        this.dataProvider.addVideo({ title, youtubeUrl });
        if (titleEl) titleEl.value = '';
        if (urlEl) urlEl.value = '';
        renderAdminVideosList();
        alert('Vidéo ajoutée et enregistrée avec succès !');
      });
    }

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        themeToggleBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        this.eventBus.emit('theme:changed', { isDark: !isLight });
      });
    }

    // Modal Admin Login
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const adminLoginModal = document.getElementById('admin-login-modal');
    const closeAdminLoginModalBtn = document.getElementById('close-admin-login-modal');
    const adminLoginForm = document.getElementById('admin-login-form');
    const loginErrorMsg = document.getElementById('login-error-msg');

    if (adminLoginBtn) {
      adminLoginBtn.addEventListener('click', () => {
        if (this.adminController.isAdmin) {
          alert('Connecté en tant qu\'administrateur (@laxou.fr).');
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

    // Bannière Admin
    const adminAddBtn = document.getElementById('admin-add-place-btn');
    const adminExportBtn = document.getElementById('admin-export-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    // Clic sur l'image en Mode Admin pour placer directement un nouveau point (X%, Y%)
    if (this.elements.mapImageContainer) {
      this.elements.mapImageContainer.addEventListener('click', (e) => {
        if (this.adminController && this.adminController.isAdmin && !e.target.closest('.map-marker')) {
          const rect = this.elements.mapImageContainer.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          const xPct = Math.max(0, Math.min(100, parseFloat(((clickX / rect.width) * 100).toFixed(1))));
          const yPct = Math.max(0, Math.min(100, parseFloat(((clickY / rect.height) * 100).toFixed(1))));
          this.adminController.showEditorModal(null, xPct, yPct);
        }
      });
    }

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

    // Modal Editeur
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

let app = null;

if (typeof document !== 'undefined') {
  const launchApp = () => {
    app = new App();
    app.init();
    window.selectPlace = (id) => app.selectPlace(id);
    window.laxouApp = app;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', launchApp);
  } else {
    launchApp();
  }
}
