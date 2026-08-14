/**
 * SidebarController - Gestion du panneau latéral et du tiroir de détails
 * Synchronisation bidirectionnelle entre la liste de lieux et les marqueurs carte.
 */
export class SidebarController {
  /** Correspondance catégorie → couleur */
  static CATEGORY_COLORS = {
    services: '#2563eb',
    parcs: '#16a34a',
    culture: '#9333ea',
    sports: '#ea580c',
    ecoles: '#d97706'
  };

  /**
   * @param {Object} eventBus - Instance de EventBus
   * @param {Object} dataProvider - Instance de DataProvider
   * @param {Object} elements - Références DOM { sidebar, placesList, detailDrawer, drawerContent, closeDrawerBtn, resultsCount, placesBadge }
   */
  constructor(eventBus, dataProvider, elements) {
    this.eventBus = eventBus;
    this.dataProvider = dataProvider;
    this.elements = elements;

    /** @type {string|null} ID du lieu actuellement sélectionné */
    this.selectedPlaceId = null;

    this._setupEventListeners();
  }

  /**
   * Écoute les événements du bus pour la synchronisation.
   * @private
   */
  _setupEventListeners() {
    // Réagir à la sélection d'un lieu (depuis la carte OU la sidebar)
    this.eventBus.on('place:selected', ({ placeId, place, source }) => {
      this.selectedPlaceId = placeId;

      // Afficher le tiroir de détails
      if (place) {
        this.showDetailDrawer(place);
      } else {
        const resolved = this.dataProvider.getPlaceById(placeId);
        if (resolved) this.showDetailDrawer(resolved);
      }

      // Si la sélection vient de la carte, mettre en surbrillance la carte sidebar
      if (source === 'map') {
        this.highlightCard(placeId);
      }
    });

    // Bouton de fermeture du tiroir
    if (this.elements.closeDrawerBtn) {
      this.elements.closeDrawerBtn.addEventListener('click', () => {
        this.hideDetailDrawer();
      });
    }

    // Masquer le tiroir de détails si clic sur le fond neutre de la carte
    this.eventBus.on('map:clicked', () => {
      this.hideDetailDrawer();
    });

    // Fermeture par touche Échap
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.hideDetailDrawer();
        }
      });
    }
  }

  /**
   * Affiche la liste des lieux dans le panneau latéral.
   * @param {Array<Object>} places - Lieux filtrés à afficher
   */
  renderPlacesList(places) {
    const { placesList } = this.elements;
    if (!placesList) return;

    placesList.innerHTML = '';

    // Message si aucun résultat
    if (places.length === 0) {
      placesList.innerHTML = `
        <div class="empty-results">
          <i class="fa-solid fa-map-location-dot"></i>
          <p>Aucun résultat correspondant à votre recherche.</p>
        </div>
      `;
      return;
    }

    const categories = this.dataProvider.getCategories();

    places.forEach(place => {
      const card = this._createPlaceCard(place, categories);
      placesList.appendChild(card);
    });

    // Mettre à jour les compteurs
    this.updateCounts(places.length);
  }

  /**
   * Crée un élément carte de lieu pour le panneau latéral.
   * @param {Object} place - Données du lieu
   * @param {Array} categories - Liste des catégories
   * @returns {HTMLElement}
   * @private
   */
  _createPlaceCard(place, categories) {
    const card = document.createElement('div');
    card.className = `place-card${place.id === this.selectedPlaceId ? ' selected' : ''}`;
    card.dataset.placeId = place.id;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Voir les détails de ${place.name}`);

    const categoryObj = categories.find(c => c.id === place.category) || {};
    const catColor = SidebarController.CATEGORY_COLORS[place.category] || '#6366f1';
    const catLabel = categoryObj.name || categoryObj.label || place.category;

    const isAdmin = Boolean(typeof window !== 'undefined' && window.laxouApp && window.laxouApp.adminController && window.laxouApp.adminController.isAdmin);

    card.innerHTML = `
      <div class="place-card-header">
        <h3 class="place-title">${place.name}</h3>
        <span class="category-tag" style="--cat-color: ${catColor}">${catLabel}</span>
      </div>
      <div class="place-address">
        <i class="fa-solid fa-location-dot"></i> ${place.address}
      </div>
      <p class="place-desc">${place.description || ''}</p>
      ${place.isNprnu ? '<span class="nprnu-badge"><i class="fa-solid fa-hammer"></i> NPRNU</span>' : ''}
      ${isAdmin ? `
        <div class="admin-card-actions">
          <button class="btn-admin-edit" data-place-id="${place.id}"><i class="fa-solid fa-pen-to-square"></i> Modifier</button>
          <button class="btn-admin-delete" data-place-id="${place.id}"><i class="fa-solid fa-trash-can"></i> Supprimer</button>
        </div>
      ` : ''}
    `;

    // Événements d'administration (Modifier / Supprimer)
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

    // Clic : sélectionner le lieu (source 'sidebar')
    card.addEventListener('click', () => {
      this.eventBus.emit('place:selected', {
        placeId: place.id,
        place,
        source: 'sidebar'
      });
    });

    // Clavier : Entrée ou Espace
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

  /**
   * Affiche le tiroir de détails avec les informations complètes d'un lieu.
   * @param {Object} place - Données complètes du lieu
   */
  showDetailDrawer(place) {
    const { detailDrawer, drawerContent } = this.elements;
    if (!detailDrawer || !drawerContent) return;

    const isAdmin = Boolean(typeof window !== 'undefined' && window.laxouApp && window.laxouApp.adminController && window.laxouApp.adminController.isAdmin);

    const categories = this.dataProvider.getCategories();
    const categoryObj = categories.find(c => c.id === place.category) || {};
    const catColor = SidebarController.CATEGORY_COLORS[place.category] || '#6366f1';
    const catLabel = categoryObj.name || categoryObj.label || place.category;

    // Images par défaut thématiques par catégorie si l'image spécifique est absente
    const CATEGORY_FALLBACK_IMAGES = {
      services: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop',
      parcs: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop',
      culture: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop',
      sports: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
      ecoles: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop'
    };

    const imageUrl = place.image || CATEGORY_FALLBACK_IMAGES[place.category] || null;

    drawerContent.innerHTML = `
      ${imageUrl ? `
        <div class="detail-image-header" style="background-image: url('${imageUrl}')">
          <div class="detail-image-overlay"></div>
        </div>
      ` : ''}

      <div class="detail-body">
        <div class="detail-header">
          <span class="category-tag" style="--cat-color: ${catColor}">${catLabel}</span>
          ${place.isNprnu ? '<span class="nprnu-badge"><i class="fa-solid fa-hammer"></i> NPRNU</span>' : ''}
          <h3>${place.name}</h3>
        </div>

        <div class="detail-info-row">
          <i class="fa-solid fa-location-dot"></i>
          <span>${place.address}</span>
        </div>

        ${place.phone ? `
          <div class="detail-info-row">
            <i class="fa-solid fa-phone"></i>
            <span>${place.phone}</span>
          </div>
        ` : ''}

        ${place.hours ? `
          <div class="detail-info-row">
            <i class="fa-solid fa-clock"></i>
            <span>${place.hours}</span>
          </div>
        ` : ''}

        ${place.link ? `
          <div class="detail-info-row">
            <i class="fa-solid fa-globe"></i>
            <a href="${place.link}" target="_blank" rel="noopener noreferrer" class="detail-link">Visiter le site web</a>
          </div>
        ` : ''}

        <div class="detail-description">
          ${place.description || ''}
        </div>

        ${place.tags && place.tags.length > 0 ? `
          <div class="tags-cloud">
            ${place.tags.map(t => `<span class="tag-badge">#${t}</span>`).join('')}
          </div>
        ` : ''}

        ${place.lat && place.lng ? `
          <div class="detail-coords">
            <i class="fa-solid fa-crosshairs"></i>
            <span>${Number(place.lat).toFixed(4)}°N, ${Number(place.lng).toFixed(4)}°E</span>
          </div>
        ` : ''}

        ${isAdmin ? `
          <div class="admin-drawer-actions">
            <button id="drawer-admin-edit-btn" class="btn-admin-primary"><i class="fa-solid fa-pen-to-square"></i> Modifier ce lieu</button>
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

    detailDrawer.classList.remove('hidden');
    this.eventBus.emit('drawer:toggled', { isOpen: true });
  }

  /**
   * Masque le tiroir de détails.
   */
  hideDetailDrawer() {
    const { detailDrawer } = this.elements;
    if (!detailDrawer) return;

    detailDrawer.classList.add('hidden');
    this.eventBus.emit('drawer:toggled', { isOpen: false });
  }

  /**
   * Met en surbrillance une carte de lieu dans la sidebar et la fait défiler.
   * @param {string} placeId - ID du lieu à mettre en surbrillance
   */
  highlightCard(placeId) {
    const { placesList } = this.elements;
    if (!placesList) return;

    // Retirer la sélection de toutes les cartes
    placesList.querySelectorAll('.place-card').forEach(card => {
      card.classList.remove('selected');
    });

    // Sélectionner la carte correspondante et scroller
    const targetCard = placesList.querySelector(`[data-place-id="${placeId}"]`);
    if (targetCard) {
      targetCard.classList.add('selected');
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Met à jour les compteurs de résultats affichés.
   * @param {number} count - Nombre de lieux affichés
   */
  updateCounts(count) {
    const { resultsCount, placesBadge } = this.elements;

    if (resultsCount) {
      resultsCount.textContent = `${count} lieu${count > 1 ? 'x' : ''} trouvé${count > 1 ? 's' : ''}`;
    }
    if (placesBadge) {
      placesBadge.textContent = count;
    }
  }
}
