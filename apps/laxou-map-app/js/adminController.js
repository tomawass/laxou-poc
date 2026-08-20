/**
 * AdminController - Gestionnaire d'authentification et du mode Administration
 * Permet la connexion avec identifiants @laxou.fr / Laxou2026!
 * Gère l'ajout, la modification et la suppression de lieux avec persistance.
 */
export class AdminController {
  /**
   * @param {Object} eventBus - Instance d'EventBus
   * @param {Object} dataProvider - Instance de DataProvider
   * @param {Object} elements - Références DOM globales
   */
  constructor(eventBus, dataProvider, elements) {
    this.eventBus = eventBus;
    this.dataProvider = dataProvider;
    this.elements = elements;

    this.isAdmin = false;
    this.editingPlaceId = null;

    this._checkSession();
  }

  /**
   * Vérifie si l'administrateur est déjà connecté dans la session.
   * @private
   */
  _checkSession() {
    if (typeof window !== "undefined" && window.sessionStorage) {
      this.isAdmin = sessionStorage.getItem("LAXOU_ADMIN_LOGGED") === "true";
    }
  }

  /**
   * Tente de connecter l'administrateur avec l'email et le mot de passe.
   * @param {string} email
   * @param {string} password
   * @returns {boolean} true si connexion réussie
   */
  login(email, password) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    // Validation : email terminant par @laxou.fr et mot de passe Laxou2026!
    if (cleanEmail.endsWith("@laxou.fr") && cleanPassword === "Laxou2026!") {
      this.isAdmin = true;
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem("LAXOU_ADMIN_LOGGED", "true");
      }

      if (this.eventBus) {
        this.eventBus.emit("admin:status", { isAdmin: true });
      }

      this.updateAdminUI();
      return true;
    }

    return false;
  }

  /**
   * Déconnecte l'administrateur.
   */
  logout() {
    this.isAdmin = false;
    if (typeof window !== "undefined" && window.sessionStorage) {
      sessionStorage.removeItem("LAXOU_ADMIN_LOGGED");
    }

    if (this.eventBus) {
      this.eventBus.emit("admin:status", { isAdmin: false });
    }

    this.updateAdminUI();
  }

  /**
   * Ouvre la modale de connexion administrateur.
   */
  showLoginModal() {
    const modal = document.getElementById("admin-login-modal");
    if (modal) modal.classList.remove("hidden");
  }

  /**
   * Ouvre la modale d'édition/création de lieu.
   * @param {Object} [place] - Lieu à modifier (null pour un nouveau lieu)
   */
  showEditorModal(place = null) {
    if (!this.isAdmin) {
      this.showLoginModal();
      return;
    }

    const modal = document.getElementById("admin-editor-modal");
    if (!modal) return;

    this.editingPlaceId = place ? place.id : null;

    // Remplir le formulaire avec les valeurs du lieu ou les valeurs par défaut
    document.getElementById("edit-place-name").value = place ? place.name : "";
    document.getElementById("edit-place-category").value = place
      ? place.category
      : "services";
    document.getElementById("edit-place-lat").value = place
      ? place.lat
      : 48.6865;
    document.getElementById("edit-place-lng").value = place
      ? place.lng
      : 6.1504;
    document.getElementById("edit-place-address").value = place
      ? place.address
      : "Laxou (54520)";
    document.getElementById("edit-place-desc").value = place
      ? place.description
      : "";
    document.getElementById("edit-place-image").value = place
      ? place.image || ""
      : "";
    document.getElementById("edit-place-phone").value = place
      ? place.phone || ""
      : "";
    document.getElementById("edit-place-email").value = place
      ? place.email || ""
      : "";
    document.getElementById("edit-place-link").value = place
      ? place.link || ""
      : "";
    document.getElementById("edit-place-nprnu").checked = place
      ? Boolean(place.isNprnu)
      : false;

    document.getElementById("editor-modal-title").textContent = place
      ? `Modifier : ${place.name}`
      : "Ajouter un nouveau lieu";

    modal.classList.remove("hidden");
  }

  /**
   * Soumet et enregistre les données du formulaire d'édition/création.
   */
  savePlaceFromForm() {
    if (!this.isAdmin) return;

    const name = document.getElementById("edit-place-name").value.trim();
    const category = document.getElementById("edit-place-category").value;
    const lat = parseFloat(document.getElementById("edit-place-lat").value);
    const lng = parseFloat(document.getElementById("edit-place-lng").value);
    const address = document.getElementById("edit-place-address").value.trim();
    const description = document.getElementById("edit-place-desc").value.trim();
    const image = document.getElementById("edit-place-image").value.trim();
    const phone = document.getElementById("edit-place-phone").value.trim();
    const email = document.getElementById("edit-place-email").value.trim();
    const link = document.getElementById("edit-place-link").value.trim();
    const isNprnu = document.getElementById("edit-place-nprnu").checked;

    if (!name || !isFinite(lat) || !isFinite(lng)) {
      alert(
        "Veuillez remplir au moins le nom et les coordonnées géographiques valides.",
      );
      return;
    }

    if (this.editingPlaceId) {
      // Modification
      this.dataProvider.updatePlace(this.editingPlaceId, {
        name,
        category,
        lat,
        lng,
        address,
        description,
        image,
        phone,
        email,
        link,
        isNprnu,
        tags: [
          category.capitalize ? category.capitalize() : category,
          "Laxou",
          name.split(" ")[0],
        ],
      });
    } else {
      // Création
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const newId = `${slug}-${Date.now().toString(36)}`;

      this.dataProvider.addPlace({
        id: newId,
        name,
        category,
        lat,
        lng,
        address,
        description: description || `${name} à Laxou.`,
        image:
          image ||
          "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop",
        phone,
        email,
        link,
        isNprnu,
        tags: ["Custom", category, "Laxou"],
      });
    }

    const modal = document.getElementById("admin-editor-modal");
    if (modal) modal.classList.add("hidden");
  }

  /**
   * Supprime un lieu avec confirmation.
   * @param {string} placeId
   */
  deletePlace(placeId) {
    if (!this.isAdmin) return;

    const place = this.dataProvider.getPlaceById(placeId);
    if (!place) return;

    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement le lieu "${place.name}" ?`,
      )
    ) {
      this.dataProvider.deletePlace(placeId);

      // Fermer le tiroir de détails si le lieu supprimé était ouvert
      const drawer = document.getElementById("detail-drawer");
      if (drawer) drawer.classList.add("hidden");
    }
  }

  /**
   * Exporte le jeu de données actuel au format JSON téléchargeable.
   */
  exportJSON() {
    const data = {
      metadata: this.dataProvider.getMetadata(),
      categories: this.dataProvider.getCategories(),
      places: this.dataProvider.getPlaces(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laxou_data_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Met à jour l'interface graphique selon l'état administrateur.
   */
  updateAdminUI() {
    const adminBanner = document.getElementById("admin-banner");
    const adminBtn = document.getElementById("admin-login-btn");

    if (this.isAdmin) {
      if (adminBanner) adminBanner.classList.remove("hidden");
      if (adminBtn) {
        adminBtn.classList.add("admin-active");
        adminBtn.title = "Mode Administrateur connecté (@laxou.fr)";
        adminBtn.innerHTML =
          '<i class="fa-solid fa-user-shield"></i> <span class="btn-text">Admin ON</span>';
      }
    } else {
      if (adminBanner) adminBanner.classList.add("hidden");
      if (adminBtn) {
        adminBtn.classList.remove("admin-active");
        adminBtn.title = "Connexion Administrateur Ville de Laxou";
        adminBtn.innerHTML =
          '<i class="fa-solid fa-lock"></i> <span class="btn-text">Admin</span>';
      }
    }

    // Réémettre le changement de filtres pour mettre à jour les cartes avec boutons Modifier/Supprimer
    if (this.eventBus) {
      this.eventBus.emit("filter:changed", {
        places: this.dataProvider.getPlaces(),
      });
    }
  }
}
