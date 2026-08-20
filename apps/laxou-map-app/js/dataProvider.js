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
    let rawData;

    if (typeof urlOrPath === "object" && urlOrPath !== null) {
      rawData = urlOrPath;
    } else if (
      typeof process !== "undefined" &&
      process.versions &&
      process.versions.node
    ) {
      // Node.js environment
      try {
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const filePath = path.isAbsolute(urlOrPath)
          ? urlOrPath
          : path.resolve(process.cwd(), urlOrPath);
        const fileContent = await fs.readFile(filePath, "utf-8");
        rawData = JSON.parse(fileContent);
      } catch (err) {
        throw new Error(
          `Failed to load data file in Node.js environment from "${urlOrPath}": ${err.message}`,
        );
      }
    } else {
      // Browser environment
      try {
        const response = await fetch(urlOrPath);
        if (!response.ok) {
          throw new Error(
            `HTTP error ${response.status}: ${response.statusText}`,
          );
        }
        rawData = await response.json();
      } catch (err) {
        if (typeof window !== "undefined" && window.LAXOU_DATA) {
          console.warn("Fetch fallback to window.LAXOU_DATA:", err.message);
          rawData = window.LAXOU_DATA;
        } else {
          throw new Error(
            `Failed to fetch data from "${urlOrPath}": ${err.message}`,
          );
        }
      }
    }

    this.validateSchema(rawData);

    // Apply custom localStorage overrides if present in browser
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const savedData = localStorage.getItem("LAXOU_CUSTOM_DATA");
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (Array.isArray(parsed.places)) {
            rawData.places = parsed.places;
          }
        }
      } catch (e) {
        console.warn("Could not read custom places from localStorage:", e);
      }
    }

    this.data = rawData;
    this.places = rawData.places || [];
    this.categories = rawData.categories || [];
    this.metadata = rawData.metadata || null;

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
          "LAXOU_CUSTOM_DATA",
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
   * Ajoute un nouveau lieu dans le jeu de données.
   * @param {Object} place
   */
  addPlace(place) {
    if (!place || !place.id || !place.name) return;
    this.places.unshift(place);
    this.placeMap.set(place.id, place);
    this._persistCustomData();

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
    this._persistCustomData();

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
    this._persistCustomData();

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
      if (!isFinite(Number(p.lat)) || !isFinite(Number(p.lng))) {
        throw new Error(
          `Invalid place "${p.id}": missing or invalid lat/lng coordinates.`,
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
}
