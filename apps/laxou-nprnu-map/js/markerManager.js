/**
 * MarkerManager - Gestionnaire de marqueurs sur l'illustration de la carte (Laxou Horizon 2028)
 */
export class MarkerManager {
  static CATEGORY_ICONS = {
    ecoles: "graduation-cap",
    parcs: "tree",
    services: "building-columns",
    sports: "dumbbell",
    mobilites: "route",
  };

  static CATEGORY_COLORS = {
    ecoles: "#d97706",
    parcs: "#16a34a",
    services: "#2563eb",
    sports: "#ea580c",
    mobilites: "#9333ea",
  };

  /**
   * @param {HTMLElement} overlayEl - Conteneur #marker-overlay
   * @param {Object} imageEngine - Instance d'ImageMapEngine
   * @param {Object} eventBus - Instance d'EventBus
   * @param {Object} dataProvider - Instance de DataProvider
   */
  constructor(overlayEl, imageEngine, eventBus, dataProvider) {
    this.overlay = overlayEl;
    this.imageEngine = imageEngine;
    this.eventBus = eventBus;
    this.dataProvider = dataProvider;

    this.markerElements = new Map();
    this.activeMarkerId = null;
    this.visibleIds = new Set();

    this._setupEventListeners();
  }

  _setupEventListeners() {
    if (this.eventBus) {
      this.eventBus.on("place:selected", ({ placeId }) => {
        this.setActiveMarker(placeId);
      });
    }
  }

  /**
   * Génère les éléments DOM des marqueurs positionnés en pourcentage (x%, y%) sur le conteneur image.
   * @param {Array<Object>} places
   */
  renderMarkers(places) {
    this.clearMarkers();

    places.forEach((place) => {
      const markerEl = this._createMarkerElement(place);
      this.overlay.appendChild(markerEl);
      this.markerElements.set(place.id, markerEl);
      this.visibleIds.add(place.id);
    });
  }

  /**
   * Crée l'élément DOM d'un marqueur positionné.
   * @param {Object} place
   * @returns {HTMLElement}
   * @private
   */
  _createMarkerElement(place) {
    const el = document.createElement("div");
    el.className = `map-marker${place.isNprnu ? " nprnu" : ""}`;
    el.dataset.placeId = place.id;
    el.style.left = `${place.x}%`;
    el.style.top = `${place.y}%`;
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${place.name}`);

    const iconClass =
      MarkerManager.CATEGORY_ICONS[place.category] || "location-dot";
    const color = MarkerManager.CATEGORY_COLORS[place.category] || "#6366f1";

    el.innerHTML = `
      <div class="marker-pin" style="--marker-color: ${color}">
        <i class="fa-solid fa-${iconClass}"></i>
      </div>
      <div class="marker-label">${place.name}</div>
    `;

    // Clic
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.eventBus) {
        this.eventBus.emit("place:selected", {
          placeId: place.id,
          place,
          source: "map",
        });
      }
    });

    // Clavier
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (this.eventBus) {
          this.eventBus.emit("place:selected", {
            placeId: place.id,
            place,
            source: "map",
          });
        }
      }
    });

    return el;
  }

  /**
   * Active le marqueur sélectionné et lui donne la priorité visuelle.
   * @param {string|null} placeId
   */
  setActiveMarker(placeId) {
    for (const [id, el] of this.markerElements) {
      el.classList.remove("active");
    }

    this.activeMarkerId = placeId;

    if (placeId && this.markerElements.has(placeId)) {
      const activeEl = this.markerElements.get(placeId);
      activeEl.classList.add("active");
    }
  }

  /**
   * Filtre la visibilité des marqueurs.
   * @param {Array<string>} placeIds
   */
  setVisiblePlaces(placeIds) {
    this.visibleIds = new Set(placeIds);
    for (const [id, el] of this.markerElements) {
      el.style.display = this.visibleIds.has(id) ? "" : "none";
    }
  }

  clearMarkers() {
    for (const [, el] of this.markerElements) {
      el.remove();
    }
    this.markerElements.clear();
    this.visibleIds.clear();
    this.activeMarkerId = null;
  }

  getMarkerElement(placeId) {
    return this.markerElements.get(placeId) || null;
  }
}
