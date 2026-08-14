/**
 * FilterSearchController - Contrôleur des filtres par catégorie et de la barre de recherche textuelle (Laxou Horizon 2028)
 */
export class FilterSearchController {
  static CATEGORY_COLORS = {
    ecoles: '#d97706',
    parcs: '#16a34a',
    services: '#2563eb',
    sports: '#ea580c',
    mobilites: '#9333ea'
  };

  /**
   * @param {Object} eventBus - Instance d'EventBus
   * @param {Object} dataProvider - Instance de DataProvider
   * @param {Object} elements - Références DOM (searchInput, clearSearchBtn, categoriesBar)
   */
  constructor(eventBus, dataProvider, elements) {
    this.eventBus = eventBus;
    this.dataProvider = dataProvider;
    this.elements = elements;

    this.activeCategory = 'all';
    this.searchQuery = '';

    this._setupEventListeners();
  }

  _setupEventListeners() {
    const { searchInput, clearSearchBtn } = this.elements;

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        if (clearSearchBtn) {
          if (this.searchQuery.length > 0) {
            clearSearchBtn.classList.remove('hidden');
          } else {
            clearSearchBtn.classList.add('hidden');
          }
        }
        this._triggerFilterUpdate();
      });
    }

    if (clearSearchBtn && searchInput) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        this._triggerFilterUpdate();
      });
    }
  }

  renderCategories() {
    const { categoriesBar } = this.elements;
    if (!categoriesBar) return;

    const categories = this.dataProvider.getCategories();

    categoriesBar.innerHTML = '';

    // Chip "Tous"
    const allChip = document.createElement('button');
    allChip.className = `category-chip${this.activeCategory === 'all' ? ' active' : ''}`;
    allChip.dataset.category = 'all';
    allChip.innerHTML = `<i class="fa-solid fa-border-all"></i> Tous`;
    allChip.addEventListener('click', () => this.setCategory('all'));
    categoriesBar.appendChild(allChip);

    // Chips par catégorie
    categories.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = `category-chip${this.activeCategory === cat.id ? ' active' : ''}`;
      chip.dataset.category = cat.id;

      const iconClass = cat.icon || 'location-dot';
      const color = FilterSearchController.CATEGORY_COLORS[cat.id] || '#6366f1';
      chip.style.setProperty('--cat-color', color);

      chip.innerHTML = `
        <i class="fa-solid fa-${iconClass}"></i>
        <span>${cat.name}</span>
      `;

      chip.addEventListener('click', () => this.setCategory(cat.id));
      categoriesBar.appendChild(chip);
    });
  }

  setCategory(catId) {
    this.activeCategory = catId;

    const { categoriesBar } = this.elements;
    if (categoriesBar) {
      categoriesBar.querySelectorAll('.category-chip').forEach(chip => {
        if (chip.dataset.category === catId) {
          chip.classList.add('active');
        } else {
          chip.classList.remove('active');
        }
      });
    }

    this._triggerFilterUpdate();
  }

  _triggerFilterUpdate() {
    const filteredPlaces = this.dataProvider.filterPlaces(
      this.activeCategory,
      this.searchQuery
    );

    this.eventBus.emit('filter:changed', {
      category: this.activeCategory,
      query: this.searchQuery,
      places: filteredPlaces
    });
  }
}
