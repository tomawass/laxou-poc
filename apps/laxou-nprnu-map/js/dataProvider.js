/**
 * DataProvider - Data loader, schema validator, and search engine for Laxou & Nancy Map
 */
export class DataProvider {
  /**
   * @param {Object} [eventBus] Optional EventBus instance for event notifications
   */
  constructor(eventBus = null) {
    this.eventBus = eventBus;
    this.data = null;
    this.places = [];
    this.categories = [];
    this.metadata = null;
    this.placeMap = new Map();
    this.isLoaded = false;
  }

  /**
   * Load and validate map data from URL/file path or direct object.
   * Dual-mode: Node.js fs vs Browser fetch vs Direct Object.
   * @param {string|Object} [urlOrPath='./data.json']
   * @returns {Promise<Object>} The loaded data object
   */
  async loadData(urlOrPath = "./data.json") {
    let rawData = null;

    if (typeof urlOrPath === "object" && urlOrPath !== null) {
      rawData = urlOrPath;
    } else if (
      typeof window === "undefined" &&
      typeof process !== "undefined" &&
      process.versions &&
      process.versions.node
    ) {
      // Node.js test environment ONLY
      try {
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const filePath = path.isAbsolute(urlOrPath)
          ? urlOrPath
          : path.resolve(process.cwd(), urlOrPath);
        const fileContent = await fs.readFile(filePath, "utf-8");
        rawData = JSON.parse(fileContent);
      } catch (err) {
        rawData = null;
      }
    } else {
      // Browser environment
      try {
        const response = await fetch(urlOrPath);
        if (response && response.ok) {
          rawData = await response.json();
        }
      } catch (err) {
        console.warn("Fetch fallback to embedded dataset:", err);
      }
    }

    // Always fallback to embedded dataset if fetch or file reading returned null
    if (!rawData || !rawData.places) {
      if (
        typeof window !== "undefined" &&
        (window.LAXOU_NPRNU_DATA || window.LAXOU_DATA)
      ) {
        rawData = window.LAXOU_NPRNU_DATA || window.LAXOU_DATA;
      }
    }

    this.data = rawData;
    this.places = rawData && rawData.places ? rawData.places : [];
    this.categories = rawData && rawData.categories ? rawData.categories : [];
    this.videos = rawData && rawData.videos ? rawData.videos : [];
    this.metadata = rawData && rawData.metadata ? rawData.metadata : null;

    this.placeMap = new Map();
    for (const place of this.places) {
      this.placeMap.set(place.id, place);
    }

    this.isLoaded = true;

    if (this.eventBus && typeof this.eventBus.emit === "function") {
      this.eventBus.emit("data:loaded", {
        places: this.places,
        categories: this.categories,
        metadata: this.metadata,
        placesCount: this.places.length,
        categoriesCount: this.categories.length,
      });
    }

    return this.data;
  }

  /**
   * Sauvegarde l'état actuel des lieux dans le localStorage du navigateur.
   * @private
   */
  _persistCustomData() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem(
          "LAXOU_CUSTOM_DATA_V2",
          JSON.stringify({
            places: this.places,
          }),
        );
      } catch (e) {
        console.warn("Erreur de sauvegarde localStorage:", e);
      }
    }
  }

  /**
   * Réinitialise les données modifiées et restaure le jeu de données d'origine.
   */
  resetCustomData() {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("LAXOU_CUSTOM_DATA");
    }
  }

  /**
   * Ajoute un nouveau lieu dans le jeu de données.
   * @param {Object} place
   */
  addPlace(place) {
    if (!place || !place.id || !place.name) return;
    this.places.unshift(place);
    this.placeMap.set(place.id, place);
    this.saveDataToDisk();

    if (this.eventBus) {
      this.eventBus.emit("place:created", { place });
      this.eventBus.emit("filter:changed", { places: this.places });
    }
  }

  /**
   * Met à jour un lieu existant.
   * @param {string} id
   * @param {Object} updatedFields
   */
  updatePlace(id, updatedFields) {
    const existing = this.getPlaceById(id);
    if (!existing) return;

    Object.assign(existing, updatedFields);
    this.placeMap.set(id, existing);
    this.saveDataToDisk();

    if (this.eventBus) {
      this.eventBus.emit("place:updated", { place: existing });
      this.eventBus.emit("filter:changed", { places: this.places });
    }
  }

  /**
   * Supprime un lieu du jeu de données.
   * @param {string} id
   */
  deletePlace(id) {
    const index = this.places.findIndex((p) => p.id === id);
    if (index === -1) return;

    const removed = this.places.splice(index, 1)[0];
    this.placeMap.delete(id);
    this.saveDataToDisk();

    if (this.eventBus) {
      this.eventBus.emit("place:deleted", { placeId: id, place: removed });
      this.eventBus.emit("filter:changed", { places: this.places });
    }
  }

  /**
   * Validate dataset schema.
   * @param {Object} rawData
   * @throws {Error} if schema is invalid
   */
  validateSchema(rawData) {
    if (!rawData || typeof rawData !== "object") {
      throw new Error("Invalid dataset: root content must be an object.");
    }

    if (!Array.isArray(rawData.places)) {
      throw new Error('Invalid dataset schema: "places" must be an array.');
    }

    if (!Array.isArray(rawData.categories)) {
      throw new Error('Invalid dataset schema: "categories" must be an array.');
    }

    for (let i = 0; i < rawData.places.length; i++) {
      const p = rawData.places[i];
      if (!p || typeof p !== "object") {
        throw new Error(`Invalid place at index ${i}: must be an object.`);
      }
      if (!p.id || typeof p.id !== "string") {
        throw new Error(
          `Invalid place at index ${i}: missing or invalid "id".`,
        );
      }
      if (!p.name || typeof p.name !== "string") {
        throw new Error(`Invalid place "${p.id}": missing or invalid "name".`);
      }
      if (!p.category || typeof p.category !== "string") {
        throw new Error(
          `Invalid place "${p.id}": missing or invalid "category".`,
        );
      }
      const hasLat = isFinite(Number(p.lat)) && isFinite(Number(p.lng));
      const hasXY = isFinite(Number(p.x)) && isFinite(Number(p.y));
      if (!hasLat && !hasXY) {
        throw new Error(
          `Invalid place "${p.id}": missing or invalid coordinates (lat/lng or x/y).`,
        );
      }
    }
  }

  /**
   * Return all places array copy.
   * @returns {Array<Object>}
   */
  getPlaces() {
    return [...this.places];
  }

  /**
   * Return all categories array copy.
   * @returns {Array<Object>}
   */
  getCategories() {
    return [...this.categories];
  }

  /**
   * Return dataset metadata.
   * @returns {Object|null}
   */
  getMetadata() {
    return this.metadata ? { ...this.metadata } : null;
  }

  /**
   * Find place by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getPlaceById(id) {
    if (!id) return null;
    return this.placeMap.get(id) || null;
  }

  /**
   * Normalize text for accent-insensitive and case-insensitive matching.
   * Converts French diacritics (e.g. é, è, ê, à, ç, œ) to ASCII equivalents.
   * @param {string} str
   * @returns {string}
   */
  normalizeText(str) {
    if (!str || typeof str !== "string") return "";
    return str
      .toLowerCase()
      .replace(/[\u0153\u0152]/g, "oe")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  /**
   * Filter places by category ID and multi-field text search query.
   * Matches name, description, address, and tags.
   * @param {string} [categoryId='all']
   * @param {string} [searchQuery='']
   * @returns {Array<Object>}
   */
  filterPlaces(categoryId = "all", searchQuery = "") {
    const normCategory =
      categoryId && typeof categoryId === "string" ? categoryId.trim() : "all";
    const normQuery = this.normalizeText(searchQuery).trim();

    return this.places.filter((place) => {
      // Category filter check
      if (
        normCategory !== "all" &&
        normCategory !== "" &&
        place.category !== normCategory
      ) {
        return false;
      }

      // Search query check
      if (normQuery.length > 0) {
        const nameNorm = this.normalizeText(place.name);
        const descNorm = this.normalizeText(place.description);
        const addrNorm = this.normalizeText(place.address);

        let tagsNormMatch = false;
        if (Array.isArray(place.tags)) {
          tagsNormMatch = place.tags.some((tag) =>
            this.normalizeText(tag).includes(normQuery),
          );
        }

        const matches =
          nameNorm.includes(normQuery) ||
          descNorm.includes(normQuery) ||
          addrNorm.includes(normQuery) ||
          tagsNormMatch;

        if (!matches) return false;
      }

      return true;
    });
  }

  getVideos() {
    return this.videos || [];
  }

  addVideo(video) {
    if (!video || !video.title || !video.youtubeUrl) return;
    const slug = video.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const newVideo = {
      id: video.id || `vid-${slug}-${Date.now().toString(36)}`,
      title: video.title,
      youtubeUrl: video.youtubeUrl,
    };
    if (!this.videos) this.videos = [];
    this.videos.push(newVideo);
    this.saveDataToDisk();
    if (this.eventBus) {
      this.eventBus.emit("videos:changed", { videos: this.videos });
    }
    return newVideo;
  }

  deleteVideo(id) {
    if (!this.videos) return;
    const idx = this.videos.findIndex((v) => v.id === id);
    if (idx !== -1) {
      this.videos.splice(idx, 1);
      this.saveDataToDisk();
      if (this.eventBus) {
        this.eventBus.emit("videos:changed", { videos: this.videos });
      }
    }
  }

  async saveDataToDisk() {
    const fullDataset = {
      metadata: this.metadata || { title: "Laxou Horizon 2028 - NPRNU" },
      categories: this.categories || [],
      videos: this.videos || [],
      places: this.places || [],
    };

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullDataset),
      });

      if (response && response.ok) {
        const result = await response.json();
        console.log("[DataProvider] Disk save success:", result.message);
        return { success: true, message: result.message };
      } else {
        return { success: false };
      }
    } catch (err) {
      console.warn("[DataProvider] API /api/save unavailable:", err);
      return { success: false };
    }
  }

  exportDataJson() {
    const fullDataset = {
      metadata: this.metadata || { title: "Laxou Horizon 2028 - NPRNU" },
      categories: this.categories || [],
      videos: this.videos || [],
      places: this.places || [],
    };
    const jsonStr = JSON.stringify(fullDataset, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(url);
  }
}
