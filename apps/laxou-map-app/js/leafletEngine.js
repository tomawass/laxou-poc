/**
 * LeafletEngine - Moteur de carte Leaflet.js avec fonds de cartes CartoDB / OpenStreetMap
 * Gère l'affichage des tuiles géographiques réelles (Laxou, Nancy, Gondreville, etc.),
 * les changements de thème (Sombre/Clair) et la détection de clics sur le fond neutre.
 */
export class LeafletEngine {
  /**
   * @param {HTMLElement|string} container - Élément DOM ou ID du conteneur de carte ('map-view')
   * @param {Object} eventBus - Instance d'EventBus
   * @param {Object} [options] - Coordonnées et zoom initiaux
   */
  constructor(container, eventBus, options = {}) {
    this.container =
      typeof container === "string"
        ? document.getElementById(container)
        : container;
    this.eventBus = eventBus;

    this.map = null;
    this.tileLayer = null;
    this.isDarkMode = true;

    // Coordonnées de centrage par défaut (Laxou)
    this.defaultCenter = options.center || [48.6865, 6.1504];
    this.defaultZoom = options.zoom || 14;

    // URL des tuiles CartoDB
    this.TILE_URLS = {
      dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      light:
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    };

    this.ATTRIBUTION =
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    this.init();
  }

  /**
   * Initialise l'instance Leaflet et la couche de tuiles.
   */
  init() {
    if (!this.container || typeof L === "undefined") {
      console.warn("Leaflet non disponible ou conteneur introuvable.");
      return;
    }

    // Supprimer tout canvas ou overlay préexistant dans le conteneur si besoin
    const canvas = this.container.querySelector("canvas");
    if (canvas) canvas.style.display = "none";

    // Créer la carte Leaflet sans les contrôles de zoom par défaut (on utilise nos boutons stylisés)
    this.map = L.map(this.container, {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Ajouter la couche de tuiles initiale
    this.tileLayer = L.tileLayer(this.TILE_URLS.dark, {
      attribution: this.ATTRIBUTION,
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(this.map);

    this._setupEventListeners();
  }

  /**
   * Écouteurs d'événements Leaflet et bus d'événements.
   * @private
   */
  _setupEventListeners() {
    if (!this.map) return;

    // Clic sur le fond neutre de la carte ➔ émettre 'map:clicked' pour fermer le tiroir de détails
    this.map.on("click", (e) => {
      // Vérifier si le clic est directement sur la carte et pas sur un marqueur
      if (this.eventBus) {
        this.eventBus.emit("map:clicked", { originalEvent: e });
        this.eventBus.emit("drawer:toggled", { isOpen: false });
      }
    });

    // Synchronisation du mouvement de la carte avec l'EventBus (move, zoom, viewreset pour du 60 FPS)
    const emitViewportChange = () => {
      if (this.eventBus) {
        const center = this.map.getCenter();
        this.eventBus.emit("viewport:changed", {
          lat: center.lat,
          lng: center.lng,
          zoom: this.map.getZoom(),
        });
      }
    };

    this.map.on("move zoom viewreset resize", emitViewportChange);

    // Écouter les changements de thème
    if (this.eventBus) {
      this.eventBus.on("theme:changed", ({ isDark }) => {
        this.setDarkMode(isDark);
      });
    }
  }

  /**
   * Bascule le fond de carte entre le thème Sombre (Dark Matter) et Clair (Voyager / Positron).
   * @param {boolean} isDark
   */
  setDarkMode(isDark) {
    this.isDarkMode = Boolean(isDark);
    if (!this.map || !this.tileLayer) return;

    const newUrl = this.isDarkMode ? this.TILE_URLS.dark : this.TILE_URLS.light;
    this.tileLayer.setUrl(newUrl);
  }

  /**
   * Centre la carte sur une position géographique donnée.
   * @param {number} lat
   * @param {number} lng
   * @param {number} [zoom]
   */
  centerOnGeo(lat, lng, zoom = null) {
    if (!this.map) return;
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isFinite(numLat) || !isFinite(numLng)) return;

    // Zoomer suffisamment proche (niveau 16.5) pour isoler le lieu sélectionné
    const targetZoom =
      zoom !== null && isFinite(Number(zoom))
        ? Number(zoom)
        : Math.max(16.5, this.map.getZoom());
    this.map.flyTo([numLat, numLng], targetZoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }

  /**
   * Zoom avant (+).
   */
  zoomIn() {
    if (this.map) this.map.zoomIn();
  }

  /**
   * Zoom arrière (-).
   */
  zoomOut() {
    if (this.map) this.map.zoomOut();
  }
}
