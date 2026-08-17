/**
 * SidebarController - Gestion du panneau latéral et du Grand Panneau Éditorial Genially (Laxou Horizon 2028)
 * Code épuré, robuste et sans effets de bord.
 */
export class SidebarController {
  static PASTEL_PALETTE = [
    { hex: '#f7baba', label: 'Corail Doux' },
    { hex: '#f9d1bb', label: 'Pêche Pastel' },
    { hex: '#f9e7b9', label: 'Jaune Crème' },
    { hex: '#d8f0c1', label: 'Vert Sauge' },
    { hex: '#bae1f7', label: 'Bleu Ciel' },
    { hex: '#c2baf7', label: 'Bleu Pervenche' },
    { hex: '#d4baf7', label: 'Violet Lavande' },
    { hex: '#f4bee9', label: 'Rose Poudré' }
  ];

  static DEFAULT_CATEGORY_HIGHLIGHTS = {
    ecoles: '#c2baf7',
    parcs: '#d8f0c1',
    services: '#bae1f7',
    sports: '#f9d1bb',
    mobilites: '#d4baf7'
  };

  /**
   * @param {Object} eventBus - Instance d'EventBus
   * @param {Object} dataProvider - Instance de DataProvider
   * @param {Object} elements - Références DOM
   */
  constructor(eventBus, dataProvider, elements) {
    this.eventBus = eventBus;
    this.dataProvider = dataProvider;
    this.elements = elements;

    this.selectedPlaceId = null;
    this.isDrawerOpen = false;
    this.isTransitioning = false;

    this._setupEventListeners();
  }

  _setupEventListeners() {
    this.eventBus.on('place:selected', ({ placeId, place, source }) => {
      const targetPlace = place || this.dataProvider.getPlaceById(placeId);
      if (!targetPlace) return;

      if (source === 'map') {
        this.highlightCard(placeId);
      }

      if (this.isDrawerOpen && this.selectedPlaceId === placeId) return;

      this.selectedPlaceId = placeId;

      if (this.isDrawerOpen) {
        this.switchPlaceDrawer(targetPlace);
      } else {
        this.showDetailDrawer(targetPlace);
      }
    });

    if (this.elements.closeDrawerBtn) {
      this.elements.closeDrawerBtn.addEventListener('click', () => {
        this.hideDetailDrawer();
      });
    }

    const backdrop = document.getElementById('genially-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        this.hideDetailDrawer();
      });
    }

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('click', (e) => {
        const drawer = this.elements.detailDrawer;
        if (drawer && this.isDrawerOpen && !this.isTransitioning) {
          const isClickInsideDrawer = e.target.closest('#detail-drawer');
          const isClickOnMarker = e.target.closest('.map-marker');
          const isClickOnCard = e.target.closest('.place-card');
          const isClickOnAdminModal = e.target.closest('.modal-content');
          const isClickOnHeaderBtn = e.target.closest('.header-actions');

          if (!isClickInsideDrawer && !isClickOnMarker && !isClickOnCard && !isClickOnAdminModal && !isClickOnHeaderBtn) {
            this.hideDetailDrawer();
          }
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.hideDetailDrawer();
        }
      });
    }
  }

  renderPlacesList(places) {
    const { placesList } = this.elements;
    if (!placesList) return;

    placesList.innerHTML = '';

    if (places.length === 0) {
      placesList.innerHTML = `
        <div class="empty-results">
          <i class="fa-solid fa-map-location-dot"></i>
          <p>Aucun aménagement disponible.</p>
        </div>
      `;
      return;
    }

    const categories = this.dataProvider.getCategories();

    places.forEach(place => {
      const card = this._createPlaceCard(place, categories);
      placesList.appendChild(card);
    });

    this.updateCounts(places.length);
  }

  _createPlaceCard(place, categories) {
    const card = document.createElement('div');
    card.className = `place-card${place.id === this.selectedPlaceId ? ' selected' : ''}`;
    card.dataset.placeId = place.id;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Détails de ${place.name}`);

    const categoryObj = categories.find(c => c.id === place.category) || {};
    const catLabel = categoryObj.name || categoryObj.label || place.category;
    const catColor = SidebarController.DEFAULT_CATEGORY_HIGHLIGHTS[place.category] || '#3b82f6';

    const isAdmin = Boolean(typeof window !== 'undefined' && window.laxouApp && window.laxouApp.adminController && window.laxouApp.adminController.isAdmin);
    const highlightColor = place.highlightColor || SidebarController.DEFAULT_CATEGORY_HIGHLIGHTS[place.category] || '#d8f0c1';
    const fallbackSvg = this._getCategoryFallbackSvg(place.category, place.name);
    const imageUrl = place.image || fallbackSvg;

    const statusText = place.status || (place.isNprnu ? 'En cours' : '');
    let statusBadgeHtml = '';
    if (statusText === 'En cours') {
      statusBadgeHtml = '<span class="status-badge-active status-encours">En cours</span>';
    } else if (statusText === 'À venir') {
      statusBadgeHtml = '<span class="status-badge-active status-avenir">À venir</span>';
    } else if (statusText === 'Livré') {
      statusBadgeHtml = '<span class="status-badge-active status-livre">Livré</span>';
    } else if (statusText && statusText !== 'Aucun') {
      statusBadgeHtml = `<span class="status-badge-active status-encours">${statusText}</span>`;
    }

    card.innerHTML = `
      <div class="place-card-content">
        <div class="place-card-top">
          <span class="category-tag" style="--cat-color: ${catColor}">${catLabel}</span>
          ${statusBadgeHtml}
        </div>
        <h3 class="place-title">${place.name}</h3>
        <div class="place-address">
          <i class="fa-solid fa-location-dot"></i> ${place.address}
        </div>
        <p class="place-desc">${this._stripHtml(place.description || '')}</p>
        ${isAdmin ? `
          <div class="admin-card-actions">
            <button class="btn-admin-edit" data-place-id="${place.id}"><i class="fa-solid fa-pen-to-square"></i> Modifier</button>
            <button class="btn-admin-delete" data-place-id="${place.id}"><i class="fa-solid fa-trash-can"></i> Supprimer</button>
          </div>
        ` : ''}
      </div>
    `;

    if (isAdmin) {
      const editBtn = card.querySelector('.btn-admin-edit');
      const deleteBtn = card.querySelector('.btn-admin-delete');

      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.laxouApp && window.laxouApp.adminController) {
            window.laxouApp.adminController.showEditorModal(place);
          }
        });
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.laxouApp && window.laxouApp.adminController) {
            window.laxouApp.adminController.deletePlace(place.id);
          }
        });
      }
    }

    card.addEventListener('click', () => {
      this.eventBus.emit('place:selected', {
        placeId: place.id,
        place,
        source: 'sidebar'
      });
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.eventBus.emit('place:selected', {
          placeId: place.id,
          place,
          source: 'sidebar'
        });
      }
    });

    return card;
  }

  _stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  }

  _formatRichContent(text) {
    if (!text) return '';
    
    if (text.includes('<ul') || text.includes('<p>') || text.includes('<strong>')) {
      return text;
    }

    const lines = text.split('\n');
    let htmlResult = '';
    let inList = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        if (!inList) {
          htmlResult += '<ul>';
          inList = true;
        }
        const content = trimmed.substring(1).trim();
        const formattedLine = content.replace(/^([^:]+):/, '<strong>$1 :</strong>');
        htmlResult += `<li>${formattedLine}</li>`;
      } else {
        if (inList) {
          htmlResult += '</ul>';
          inList = false;
        }
        const formattedLine = trimmed.replace(/^([^:]+):/, '<strong>$1 :</strong>');
        htmlResult += `<p>${formattedLine}</p>`;
      }
    });

    if (inList) htmlResult += '</ul>';
    return htmlResult;
  }

  switchPlaceDrawer(nextPlace) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const { detailDrawer } = this.elements;
    if (detailDrawer) {
      detailDrawer.classList.remove('open');
      detailDrawer.classList.add('closing');
    }

    setTimeout(() => {
      if (detailDrawer) {
        detailDrawer.classList.remove('closing');
      }
      this.isDrawerOpen = false;
      this.isTransitioning = false;

      this.showDetailDrawer(nextPlace);
    }, 220);
  }

  showDetailDrawer(place) {
    const { detailDrawer, drawerContent } = this.elements;
    if (!detailDrawer || !drawerContent) return;

    const isAdmin = Boolean(typeof window !== 'undefined' && window.laxouApp && window.laxouApp.adminController && window.laxouApp.adminController.isAdmin);

    const fallbackSvg = this._getCategoryFallbackSvg(place.category, place.name);
    const imageUrl = place.image || fallbackSvg;
    const highlightColor = place.highlightColor || SidebarController.DEFAULT_CATEGORY_HIGHLIGHTS[place.category] || '#d8f0c1';
    const formattedBody = this._formatRichContent(place.description || '');

    drawerContent.innerHTML = `
      <div class="genially-large-panel">
        <div class="genially-photo-hero-container">
          <img src="${imageUrl}" alt="${place.name}" class="genially-photo-hero" onerror="this.onerror=null; this.src='${fallbackSvg}';">
        </div>

        <div class="genially-panel-header">
          <h1 class="genially-highlight-title" style="--title-bg: ${highlightColor}">${place.name}</h1>
        </div>

        <div class="genially-panel-body">
          ${formattedBody}
        </div>

        ${isAdmin ? `
          <div class="admin-drawer-actions">
            <button id="drawer-admin-edit-btn" class="btn-admin-primary"><i class="fa-solid fa-pen-to-square"></i> Modifier</button>
            <button id="drawer-admin-delete-btn" class="btn-admin-danger"><i class="fa-solid fa-trash-can"></i> Supprimer</button>
          </div>
        ` : ''}
      </div>
    `;

    if (isAdmin) {
      const editBtn = drawerContent.querySelector('#drawer-admin-edit-btn');
      const deleteBtn = drawerContent.querySelector('#drawer-admin-delete-btn');

      if (editBtn) {
        editBtn.addEventListener('click', () => {
          if (window.laxouApp && window.laxouApp.adminController) {
            window.laxouApp.adminController.showEditorModal(place);
          }
        });
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (window.laxouApp && window.laxouApp.adminController) {
            window.laxouApp.adminController.deletePlace(place.id);
          }
        });
      }
    }

    const backdrop = document.getElementById('genially-backdrop');
    if (backdrop) backdrop.classList.add('show');

    detailDrawer.classList.remove('hidden', 'closing');
    detailDrawer.classList.add('open');
    this.isDrawerOpen = true;
    this.eventBus.emit('drawer:toggled', { isOpen: true });
  }

  hideDetailDrawer() {
    const { detailDrawer } = this.elements;
    if (!detailDrawer) return;

    const backdrop = document.getElementById('genially-backdrop');
    if (backdrop) backdrop.classList.remove('show');

    detailDrawer.classList.remove('open');
    detailDrawer.classList.add('closing');
    this.isTransitioning = true;

    setTimeout(() => {
      detailDrawer.classList.add('hidden');
      detailDrawer.classList.remove('closing');
      this.isDrawerOpen = false;
      this.isTransitioning = false;
      this.eventBus.emit('drawer:toggled', { isOpen: false });
    }, 220);
  }

  highlightCard(placeId) {
    const { placesList, sidebar } = this.elements;
    if (!placesList) return;

    placesList.querySelectorAll('.place-card').forEach(card => {
      card.classList.remove('selected');
    });

    const targetCard = placesList.querySelector(`[data-place-id="${placeId}"]`);
    if (targetCard) {
      targetCard.classList.add('selected');
      
      // Scroll ONLY inside the sidebar container if it is currently open
      const isSidebarOpen = sidebar && sidebar.classList.contains('open');
      if (isSidebarOpen) {
        const listRect = placesList.getBoundingClientRect();
        const cardRect = targetCard.getBoundingClientRect();
        const relativeTop = cardRect.top - listRect.top;
        placesList.scrollTo({
          top: placesList.scrollTop + relativeTop - 20,
          behavior: 'smooth'
        });
      }
    }
  }

  updateCounts(count) {
    const { resultsCount, placesBadge } = this.elements;
    if (resultsCount) {
      resultsCount.textContent = `${count} aménagement${count > 1 ? 's' : ''}`;
    }
    if (placesBadge) {
      placesBadge.textContent = count;
    }
  }

  _getCategoryFallbackSvg(category, name) {
    const configs = {
      ecoles: { bg1: '#d97706', bg2: '#b45309', label: 'Éducation & Écoles', icon: 'M12 3L1 9l11 6 9-4.91V17h2V9L12 3z' },
      parcs: { bg1: '#16a34a', bg2: '#15803d', label: 'Parc & Nature', icon: 'M12 2L4.5 13h4v8h7v-8h4L12 2z' },
      services: { bg1: '#2563eb', bg2: '#1d4ed8', label: 'Service & Aménagement', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' },
      sports: { bg1: '#ea580c', bg2: '#c2410c', label: 'Sport & Santé', icon: 'M20.57 14.86L18 12.29l1.43-1.43' },
      mobilites: { bg1: '#9333ea', bg2: '#7e22ce', label: 'Mobilité & Connexion', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13' }
    };
    const cfg = configs[category] || configs.services;
    const cleanName = (name || 'Laxou Aménagement').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
      <defs>
        <linearGradient id="g_${category}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${cfg.bg1}" />
          <stop offset="100%" stop-color="${cfg.bg2}" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#g_${category})" />
      <circle cx="340" cy="30" r="100" fill="rgba(255,255,255,0.08)"/>
      <circle cx="50" cy="180" r="80" fill="rgba(255,255,255,0.06)"/>
      <text x="200" y="105" font-family="Outfit, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">${cleanName}</text>
      <text x="200" y="140" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.85)" text-anchor="middle" letter-spacing="1.5">${cfg.label.toUpperCase()}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
}
