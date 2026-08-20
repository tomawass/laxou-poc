/**
 * MarkerManager - Gestionnaire de marqueurs DOM interactifs
 * Positionne des éléments HTML/SVG sur un overlay aligné avec le Canvas.
 *
 * Les marqueurs sont des éléments DOM (pas Canvas) pour bénéficier de
 * l'accessibilité native (tabindex, aria-label, focus visible).
 */
export class MarkerManager {
  /** Correspondance catégorie → icône FontAwesome */
  static CATEGORY_ICONS = {
    services: "building-columns",
    parcs: "tree",
    culture: "landmark",
    sports: "futbol",
    ecoles: "graduation-cap",
  };

  /** Correspondance catégorie → couleur */
  static CATEGORY_COLORS = {
    services: "#2563eb",
    parcs: "#16a34a",
    culture: "#9333ea",
    sports: "#ea580c",
    ecoles: "#d97706",
  };

  /**
   * @param {HTMLElement} overlayEl - Conteneur overlay (#marker-overlay)
   * @param {Object} projection - Instance de Projection
   * @param {Object} viewport - Instance de ViewportController
   * @param {Object} eventBus - Instance de EventBus
   * @param {Object} dataProvider - Instance de DataProvider
   */
  constructor(overlayEl, projection, viewport, eventBus, dataProvider) {
    this.overlayEl = overlayEl;
    this.projection = projection;
    this.viewport = viewport;
    this.eventBus = eventBus;
    this.dataProvider = dataProvider;

    /** @type {Map<string, HTMLElement>} Carte id → élément DOM du marqueur */
    this.markerElements = new Map();

    /** @type {Map<string, Object>} Carte id → données du lieu */
    this.markerData = new Map();

    /** @type {string|null} ID du marqueur actuellement actif/sélectionné */
    this.activeMarkerId = null;

    /** @type {Set<string>} IDs des marqueurs visibles (filtrés) */
    this.visibleIds = new Set();

    this._setupEventListeners();
  }

  /**
   * Écoute les événements du bus pour synchroniser les marqueurs.
   * @private
   */
  _setupEventListeners() {
    // Repositionner les marqueurs à chaque changement de viewport (pan/zoom)
    this.eventBus.on("viewport:changed", (vpState) => {
      this.updatePositions(vpState);
      this._updateLabelVisibility(vpState.zoom);
    });

    // Mettre en surbrillance le marqueur sélectionné
    this.eventBus.on("place:selected", ({ placeId }) => {
      this.setActiveMarker(placeId);
    });
  }

  /**
   * Crée ou met à jour les marqueurs DOM / Leaflet pour une liste de lieux.
   * @param {Array<Object>} places - Tableau de lieux depuis DataProvider
   */
  renderMarkers(places) {
    // Supprimer les anciens marqueurs
    this.clearMarkers();

    const leafletEngine =
      (this.viewport && this.viewport.leafletEngine) ||
      (typeof window !== "undefined" &&
        window.laxouApp &&
        window.laxouApp.leafletEngine);

    if (leafletEngine && leafletEngine.map && typeof L !== "undefined") {
      // --- MODE LEAFLET NATIVE CLUSTERING ---
      if (typeof L.markerClusterGroup === "function") {
        this.clusterGroup = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 30, // Clusters moins agressifs
          disableClusteringAtZoom: 14, // Déclusterise dès le niveau de zoom de Laxou (>= 14)
          spiderfyOnMaxZoom: true,
          iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount();
            let cClass = "marker-cluster-small";
            if (count > 15) cClass = "marker-cluster-medium";
            if (count > 40) cClass = "marker-cluster-large";

            return L.divIcon({
              html: `<div class="custom-cluster-inner"><span>${count}</span></div>`,
              className: `custom-marker-cluster ${cClass}`,
              iconSize: L.point(38, 38),
            });
          },
        });
        leafletEngine.map.addLayer(this.clusterGroup);
      }

      for (const place of places) {
        const iconName =
          MarkerManager.CATEGORY_ICONS[place.category] || "map-pin";
        const color =
          MarkerManager.CATEGORY_COLORS[place.category] || "#6366f1";

        const divIcon = L.divIcon({
          className: "custom-div-icon",
          html: `
            <div class="map-marker ${place.isNprnu ? "nprnu" : ""}" data-place-id="${place.id}">
              <div class="marker-pin" style="--marker-color: ${color}">
                <i class="fa-solid fa-${iconName}"></i>
              </div>
              <div class="marker-label">${place.name}</div>
            </div>
          `,
          iconSize: [36, 42],
          iconAnchor: [18, 42],
        });

        const marker = L.marker([place.lat, place.lng], { icon: divIcon });

        marker.on("click", (e) => {
          if (e.originalEvent) e.originalEvent.stopPropagation();
          this.eventBus.emit("place:selected", {
            placeId: place.id,
            place,
            source: "map",
          });
        });

        if (this.clusterGroup) {
          this.clusterGroup.addLayer(marker);
        } else {
          marker.addTo(leafletEngine.map);
        }

        this.markerElements.set(place.id, marker);
        this.markerData.set(place.id, place);
        this.visibleIds.add(place.id);
      }
    } else {
      // --- MODE FALLBACK OVERLAY DOM ---
      for (const place of places) {
        const el = this._createMarkerElement(place);
        if (this.overlayEl) this.overlayEl.appendChild(el);
        this.markerElements.set(place.id, el);
        this.markerData.set(place.id, place);
        this.visibleIds.add(place.id);
      }

      const vpState = this.viewport ? this.viewport.getState() : {};
      this.updatePositions(vpState);
    }
  }

  /**
   * Crée un élément DOM de marqueur pour un lieu donné (mode fallback).
   * @param {Object} place - Données du lieu
   * @returns {HTMLElement}
   * @private
   */
  _createMarkerElement(place) {
    const icon = MarkerManager.CATEGORY_ICONS[place.category] || "map-pin";
    const color = MarkerManager.CATEGORY_COLORS[place.category] || "#6366f1";

    const marker = document.createElement("div");
    marker.className = "map-marker";
    marker.dataset.placeId = place.id;
    marker.setAttribute("tabindex", "0");
    marker.setAttribute("role", "button");
    marker.setAttribute("aria-label", `${place.name} — ${place.address}`);

    marker.innerHTML = `
      <div class="marker-pin" style="--marker-color: ${color}">
        <i class="fa-solid fa-${icon}"></i>
      </div>
      <div class="marker-label">${place.name}</div>
    `;

    if (place.isNprnu) {
      marker.classList.add("nprnu");
    }

    marker.addEventListener("click", (e) => {
      e.stopPropagation();
      this.eventBus.emit("place:selected", {
        placeId: place.id,
        place,
        source: "map",
      });
    });

    marker.addEventListener("mouseenter", () => {
      this.eventBus.emit("place:hovered", { placeId: place.id });
      marker.classList.add("hovered");
    });

    marker.addEventListener("mouseleave", () => {
      this.eventBus.emit("place:hovered", { placeId: null });
      marker.classList.remove("hovered");
    });

    marker.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        this.eventBus.emit("place:selected", {
          placeId: place.id,
          place,
          source: "map",
        });
      }
    });

    return marker;
  }

  /**
   * Helper pour vérifier sans erreur sous Node.js ou navigateur si un objet est un élément DOM.
   * @param {*} el
   * @returns {boolean}
   * @private
   */
  _isHtmlElement(el) {
    if (!el || typeof el !== "object") return false;
    if (typeof HTMLElement !== "undefined" && el instanceof HTMLElement)
      return true;
    return Boolean(el.classList && typeof el.classList.add === "function");
  }

  /**
   * Met à jour la position écran de tous les marqueurs en mode DOM fallback.
   * Appelée à chaque viewport:changed.
   * @param {Object} [vpState] - État du viewport { x, y, zoom, width, height }
   */
  updatePositions(vpState) {
    if (!vpState && this.viewport) {
      vpState = this.viewport.getState();
    }

    const leafletEngine =
      (this.viewport && this.viewport.leafletEngine) ||
      (typeof window !== "undefined" &&
        window.laxouApp &&
        window.laxouApp.leafletEngine);

    if (leafletEngine && leafletEngine.map && typeof L !== "undefined") {
      // Leaflet gère son propre repositionnement à 60 FPS
      return;
    }

    for (const [id, el] of this.markerElements) {
      if (!this._isHtmlElement(el)) continue;
      const place = this.markerData.get(id);
      if (!place) continue;

      let screen = { x: 0, y: 0 };
      if (this.projection) {
        screen = this.projection.geoToScreen(
          place.lat,
          place.lng,
          vpState || {},
        );
      }

      el.style.transform = `translate(${screen.x}px, ${screen.y}px)`;

      const width = (vpState && vpState.width) || 800;
      const height = (vpState && vpState.height) || 600;

      const isOnScreen =
        screen.x > -60 &&
        screen.x < width + 60 &&
        screen.y > -60 &&
        screen.y < height + 60;
      el.style.display = isOnScreen && this.visibleIds.has(id) ? "" : "none";
    }
  }

  /**
   * Affiche/masque les labels des marqueurs.
   * Désormais les labels apparaissent UNIQUEMENT au survol ou à la sélection !
   * @param {number} zoom
   * @private
   */
  _updateLabelVisibility(zoom) {
    // Les labels sont affichés uniquement au survol/sélection pour éviter la surcharge visuelle
  }

  /**
   * Active visuellement un marqueur (ajoute .active, retire des autres).
   * @param {string|null} placeId - ID du lieu à activer (null pour tout désactiver)
   */
  setActiveMarker(placeId) {
    // Retirer la classe active et réinitialiser le zIndexOffset de tous les marqueurs
    for (const [id, marker] of this.markerElements) {
      if (marker && typeof marker.setZIndexOffset === "function") {
        marker.setZIndexOffset(0);
      }

      let domNode = null;
      if (marker && marker.getElement) {
        domNode = marker.getElement();
      } else if (this._isHtmlElement(marker)) {
        domNode = marker;
      }

      if (domNode) {
        if (domNode.classList) domNode.classList.remove("active");
        const innerMarker = domNode.querySelector
          ? domNode.querySelector(".map-marker")
          : null;
        if (innerMarker && innerMarker.classList)
          innerMarker.classList.remove("active");
      }
    }

    this.activeMarkerId = placeId;

    // Appliquer la classe active et monter le zIndexOffset à 10000 pour le marqueur sélectionné
    if (placeId && this.markerElements.has(placeId)) {
      const activeMarker = this.markerElements.get(placeId);

      const applyActiveStyles = () => {
        if (
          activeMarker &&
          typeof activeMarker.setZIndexOffset === "function"
        ) {
          activeMarker.setZIndexOffset(10000);
        }

        let domNode = null;
        if (activeMarker && activeMarker.getElement) {
          domNode = activeMarker.getElement();
        } else if (this._isHtmlElement(activeMarker)) {
          domNode = activeMarker;
        }

        if (domNode) {
          if (domNode.classList) domNode.classList.add("active");
          const innerMarker = domNode.querySelector
            ? domNode.querySelector(".map-marker")
            : null;
          if (innerMarker && innerMarker.classList)
            innerMarker.classList.add("active");
        }
      };

      if (
        this.clusterGroup &&
        activeMarker &&
        typeof activeMarker.getLatLng === "function"
      ) {
        this.clusterGroup.zoomToShowLayer(activeMarker, () => {
          applyActiveStyles();
        });
      } else {
        applyActiveStyles();
      }
    }
  }

  /**
   * Met à jour la liste des marqueurs visibles (après filtrage par catégorie/recherche).
   * @param {Array<string>} placeIds - IDs des lieux visibles
   */
  setVisiblePlaces(placeIds) {
    this.visibleIds = new Set(placeIds);

    const leafletEngine =
      (this.viewport && this.viewport.leafletEngine) ||
      (typeof window !== "undefined" &&
        window.laxouApp &&
        window.laxouApp.leafletEngine);

    if (
      leafletEngine &&
      leafletEngine.map &&
      this.clusterGroup &&
      typeof L !== "undefined"
    ) {
      this.clusterGroup.clearLayers();
      for (const id of placeIds) {
        const marker = this.markerElements.get(id);
        if (marker && marker instanceof L.Marker) {
          this.clusterGroup.addLayer(marker);
        }
      }
    } else {
      for (const [id, el] of this.markerElements) {
        if (this._isHtmlElement(el)) {
          el.style.display = this.visibleIds.has(id) ? "" : "none";
        }
      }
    }
  }

  /**
   * Supprime tous les marqueurs du conteneur overlay / Leaflet.
   */
  clearMarkers() {
    const leafletEngine =
      (this.viewport && this.viewport.leafletEngine) ||
      (typeof window !== "undefined" &&
        window.laxouApp &&
        window.laxouApp.leafletEngine);

    if (this.clusterGroup && leafletEngine && leafletEngine.map) {
      this.clusterGroup.clearLayers();
      leafletEngine.map.removeLayer(this.clusterGroup);
      this.clusterGroup = null;
    }

    for (const [, el] of this.markerElements) {
      if (this._isHtmlElement(el)) {
        el.remove();
      }
    }

    this.markerElements.clear();
    this.markerData.clear();
    this.visibleIds.clear();
    this.activeMarkerId = null;
  }

  /**
   * Retourne l'élément DOM d'un marqueur par son ID.
   * @param {string} placeId
   * @returns {HTMLElement|Object|null}
   */
  getMarkerElement(placeId) {
    const marker = this.markerElements.get(placeId);
    if (!marker) return null;
    if (marker.getElement) {
      return marker.getElement() || marker;
    }
    return marker;
  }
}
