/**
 * FilterSearchController - Contrôleur pour le filtrage par catégories et la recherche textuelle réactive.
 * Gère la barre de puces par catégories, le champ de recherche avec anti-rebond (debounce),
 * et la mise à jour des états actifs.
 */
export class FilterSearchController {
  /**
   * @param {Object} eventBus - Instance d'EventBus
   * @param {Object} dataProvider - Instance de DataProvider
   * @param {Object} elements - { categoriesBar, searchInput, clearSearchBtn }
   */
  constructor(eventBus, dataProvider, elements) {
    this.eventBus = eventBus;
    this.dataProvider = dataProvider;
    this.elements = elements;

    this.activeCategory = "all";
    this.searchQuery = "";
    this.debounceTimer = null;

    this._setupEventListeners();
  }

  /**
   * Configure les écouteurs d'événements DOM sur les éléments de filtre/recherche.
   * @private
   */
  _setupEventListeners() {
    const { searchInput, clearSearchBtn } = this.elements;

    // Recherche en temps réel avec anti-rebond
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value;
        this.setSearchQuery(query);
      });
    }

    // Bouton de réinitialisation de recherche
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        this.setSearchQuery("");
      });
    }

    // Auto-basculement de catégorie lors de la sélection d'un lieu
    if (this.eventBus) {
      this.eventBus.on("place:selected", ({ place, placeId }) => {
        const p =
          place ||
          (this.dataProvider ? this.dataProvider.getPlaceById(placeId) : null);
        if (p && p.category && p.category !== this.activeCategory) {
          this.setCategory(p.category);
        }
      });
    }
  }

  /**
   * Rendu des puces de catégories dans la barre flottante.
   */
  renderCategories() {
    const { categoriesBar } = this.elements;
    if (!categoriesBar) return;

    categoriesBar.innerHTML = "";
    const categories = this.dataProvider.getCategories();

    // S'assurer d'inclure l'option "Tous"
    const allCat = {
      id: "all",
      name: "Tous les lieux",
      label: "Tous",
      icon: "layer-group",
    };
    const fullCategories = categories.some((c) => c.id === "all")
      ? categories
      : [allCat, ...categories];

    const categoryIcons = {
      services: "building-columns",
      parcs: "tree",
      culture: "landmark",
      sports: "futbol",
      ecoles: "graduation-cap",
      all: "layer-group",
    };

    fullCategories.forEach((cat) => {
      const chip = document.createElement("button");
      chip.className = `category-chip ${cat.id === this.activeCategory ? "active" : ""}`;
      chip.dataset.categoryId = cat.id;
      chip.setAttribute("type", "button");
      chip.setAttribute(
        "aria-pressed",
        cat.id === this.activeCategory ? "true" : "false",
      );

      const iconName = cat.icon
        ? cat.icon.replace(/^fa-/, "")
        : categoryIcons[cat.id] || "tag";
      chip.innerHTML = `<i class="fa-solid fa-${iconName}"></i> <span>${cat.label || cat.name}</span>`;

      chip.addEventListener("click", () => {
        this.setCategory(cat.id);
      });

      categoriesBar.appendChild(chip);
    });
  }

  /**
   * Modifie la catégorie active et émet un événement.
   * @param {string} categoryId
   */
  setCategory(categoryId) {
    this.activeCategory = categoryId || "all";

    // Mettre à jour la classe active sur les puces
    const { categoriesBar } = this.elements;
    if (categoriesBar) {
      categoriesBar.querySelectorAll(".category-chip").forEach((chip) => {
        const isActive = chip.dataset.categoryId === this.activeCategory;
        chip.classList.toggle("active", isActive);
        chip.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    this._emitFilterChanged();
  }

  /**
   * Modifie le texte de recherche avec anti-rebond léger.
   * @param {string} query
   * @param {number} [debounceMs=150]
   */
  setSearchQuery(query, debounceMs = 150) {
    this.searchQuery = query || "";

    // Gérer l'affichage du bouton d'effacement
    const { clearSearchBtn } = this.elements;
    if (clearSearchBtn) {
      clearSearchBtn.classList.toggle("hidden", !this.searchQuery.trim());
    }

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (debounceMs > 0) {
      this.debounceTimer = setTimeout(() => {
        this._emitFilterChanged();
      }, debounceMs);
    } else {
      this._emitFilterChanged();
    }
  }

  /**
   * Émet l'événement 'filter:changed' via l'EventBus.
   * @private
   */
  _emitFilterChanged() {
    const filteredPlaces = this.dataProvider.filterPlaces(
      this.activeCategory,
      this.searchQuery,
    );

    this.eventBus.emit("filter:changed", {
      categoryId: this.activeCategory,
      query: this.searchQuery,
      places: filteredPlaces,
      count: filteredPlaces.length,
    });
  }
}
