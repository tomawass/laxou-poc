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
    if (typeof window !== 'undefined' && window.sessionStorage) {
      this.isAdmin = sessionStorage.getItem('LAXOU_ADMIN_LOGGED') === 'true';
    }
  }

  /**
   * Tente de connecter l'administrateur avec l'email et le mot de passe.
   * @param {string} email 
   * @param {string} password 
   * @returns {boolean} true si connexion réussie
   */
  login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Validation : email terminant par @laxou.fr et mot de passe Laxou2026!
    if (cleanEmail.endsWith('@laxou.fr') && cleanPassword === 'Laxou2026!') {
      this.isAdmin = true;
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('LAXOU_ADMIN_LOGGED', 'true');
      }

      if (this.eventBus) {
        this.eventBus.emit('admin:status', { isAdmin: true });
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
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('LAXOU_ADMIN_LOGGED');
    }

    if (this.eventBus) {
      this.eventBus.emit('admin:status', { isAdmin: false });
    }

    this.updateAdminUI();
  }

  /**
   * Ouvre la modale de connexion administrateur.
   */
  showLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.remove('hidden');
  }

  /**
   * Ouvre la modale d'édition/création de lieu.
   * @param {Object} [place] - Lieu à modifier (null pour un nouveau lieu)
   */
  showEditorModal(place = null, defaultX = 50.0, defaultY = 50.0) {
    if (!this.isAdmin) {
      this.showLoginModal();
      return;
    }

    const modal = document.getElementById('admin-editor-modal');
    if (!modal) return;

    this.editingPlaceId = place ? place.id : null;

    // Remplir le formulaire avec les valeurs du lieu ou les valeurs par défaut
    document.getElementById('edit-place-name').value = place ? place.name : '';
    document.getElementById('edit-place-category').value = place ? place.category : 'services';
    document.getElementById('edit-place-color').value = place ? (place.highlightColor || '#d8f0c1') : '#d8f0c1';
    document.getElementById('edit-place-x').value = place ? place.x : defaultX;
    document.getElementById('edit-place-y').value = place ? place.y : defaultY;
    document.getElementById('edit-place-address').value = place ? place.address : 'Quartier des Provinces, 54520 Laxou';
    
    const descEditor = document.getElementById('edit-place-desc');
    if (descEditor) {
      descEditor.innerHTML = place ? (place.description || '') : '';
    }

    document.getElementById('edit-place-image').value = place ? (place.image || '') : '';
    document.getElementById('edit-place-nprnu').checked = place ? Boolean(place.isNprnu) : true;
    
    const statusEl = document.getElementById('edit-place-status');
    if (statusEl) {
      statusEl.value = place ? (place.status || 'En cours') : 'En cours';
    }

    // Gestion de l'import de fichier image depuis l'ordinateur
    const fileInput = document.getElementById('edit-place-file');
    if (fileInput) {
      fileInput.value = '';
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            document.getElementById('edit-place-image').value = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      };
    }

    // Toolbar d'édition visuelle WYSIWYG (Gras, Puces, Palette de Surlignage)
    const btnBold = document.getElementById('tb-bold');
    const btnBullet = document.getElementById('tb-bullet');

    if (btnBold) {
      btnBold.onclick = (e) => {
        e.preventDefault();
        document.execCommand('bold', false, null);
        if (descEditor) descEditor.focus();
      };
    }

    if (btnBullet) {
      btnBullet.onclick = (e) => {
        e.preventDefault();
        document.execCommand('insertUnorderedList', false, null);
        if (descEditor) descEditor.focus();
      };
    }

    // Palette de surlignage par couleur pastel du projet
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
      swatch.onclick = (e) => {
        e.preventDefault();
        const color = swatch.getAttribute('data-color');
        if (!color) return;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
          const range = selection.getRangeAt(0);
          const mark = document.createElement('mark');
          mark.style.backgroundColor = color;
          mark.style.color = '#000000';
          mark.style.padding = '0.1rem 0.35rem';
          mark.style.borderRadius = '4px';
          mark.appendChild(range.extractContents());
          range.insertNode(mark);
        } else if (descEditor) {
          document.execCommand('hiliteColor', false, color);
        }
        if (descEditor) descEditor.focus();
      };
    });

    document.getElementById('editor-modal-title').textContent = place 
      ? `Modifier : ${place.name}`
      : 'Ajouter un nouvel aménagement';

    modal.classList.remove('hidden');
  }

  /**
   * Soumet et enregistre les données du formulaire d'édition/création.
   */
  savePlaceFromForm() {
    if (!this.isAdmin) return;

    const name = document.getElementById('edit-place-name').value.trim();
    const category = document.getElementById('edit-place-category').value;
    const highlightColor = document.getElementById('edit-place-color').value;
    const x = parseFloat(document.getElementById('edit-place-x').value);
    const y = parseFloat(document.getElementById('edit-place-y').value);
    const address = document.getElementById('edit-place-address').value.trim();
    const descEl = document.getElementById('edit-place-desc');
    const description = descEl ? (descEl.innerHTML || '').trim() : '';
    const image = document.getElementById('edit-place-image').value.trim();
    const isNprnu = document.getElementById('edit-place-nprnu').checked;
    const statusEl = document.getElementById('edit-place-status');
    const status = statusEl ? statusEl.value : 'En cours';

    if (!name || !isFinite(x) || !isFinite(y)) {
      alert('Veuillez remplir au moins le nom et les coordonnées valides (X% et Y% entre 0 et 100).');
      return;
    }

    if (this.editingPlaceId) {
      // Modification
      const updatedPlace = {
        id: this.editingPlaceId,
        name,
        category,
        highlightColor,
        x,
        y,
        address,
        description,
        image,
        isNprnu,
        status,
        tags: ["NPRNU 2028", category, "Provinces"]
      };
      this.dataProvider.updatePlace(this.editingPlaceId, updatedPlace);

      // Mettre à jour immédiatement la fiche ouverte sur l'écran
      if (window.laxouApp && window.laxouApp.sidebarController) {
        window.laxouApp.sidebarController.showDetailDrawer(updatedPlace);
      }
    } else {
      // Création
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const newId = `${slug}-${Date.now().toString(36)}`;
      const newPlace = {
        id: newId,
        name,
        category,
        highlightColor,
        x,
        y,
        address,
        description: description || `${name} à Laxou.`,
        image: image || '',
        isNprnu,
        status,
        tags: ["NPRNU 2028", category, "Provinces"]
      };

      this.dataProvider.addPlace(newPlace);

      if (window.laxouApp && window.laxouApp.sidebarController) {
        window.laxouApp.sidebarController.showDetailDrawer(newPlace);
      }
    }

    const modal = document.getElementById('admin-editor-modal');
    if (modal) modal.classList.add('hidden');
  }

  /**
   * Supprime un lieu avec confirmation.
   * @param {string} placeId 
   */
  deletePlace(placeId) {
    if (!this.isAdmin) return;

    const place = this.dataProvider.getPlaceById(placeId);
    if (!place) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le lieu "${place.name}" ?`)) {
      this.dataProvider.deletePlace(placeId);

      // Fermer le tiroir de détails si le lieu supprimé était ouvert
      const drawer = document.getElementById('detail-drawer');
      if (drawer) drawer.classList.add('hidden');
    }
  }

  /**
   * Enregistre la version actuelle des données (persistance localStorage + téléchargement du data.json révisé).
   */
  saveToDisk() {
    if (!this.isAdmin) return;

    this.dataProvider._persistCustomData();

    const data = {
      metadata: this.dataProvider.getMetadata(),
      categories: this.dataProvider.getCategories(),
      places: this.dataProvider.getPlaces()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);

    this.showToast('💾 Version sauvegardée dans data.json !');
  }

  /**
   * Affiche une notification Toast élégante à l'écran.
   * @param {string} message 
   */
  showToast(message) {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-toast';
      toast.className = 'admin-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  /**
   * Exporte le jeu de données actuel au format JSON téléchargeable.
   */
  exportJSON() {
    this.saveToDisk();
  }

  /**
   * Met à jour l'interface graphique selon l'état administrateur.
   */
  updateAdminUI() {
    const adminBanner = document.getElementById('admin-banner');
    const adminBtn = document.getElementById('admin-login-btn');

    if (this.isAdmin) {
      if (adminBanner) adminBanner.classList.remove('hidden');
      if (adminBtn) {
        adminBtn.classList.add('admin-active');
        adminBtn.title = 'Mode Administrateur connecté (@laxou.fr)';
        adminBtn.innerHTML = '<i class="fa-solid fa-user-shield"></i> <span class="btn-text">Admin ON</span>';
      }
    } else {
      if (adminBanner) adminBanner.classList.add('hidden');
      if (adminBtn) {
        adminBtn.classList.remove('admin-active');
        adminBtn.title = 'Connexion Administrateur Ville de Laxou';
        adminBtn.innerHTML = '<i class="fa-solid fa-lock"></i> <span class="btn-text">Admin</span>';
      }
    }

    // Réémettre le changement de filtres pour mettre à jour les cartes avec boutons Modifier/Supprimer
    if (this.eventBus) {
      this.eventBus.emit('filter:changed', { places: this.dataProvider.getPlaces() });
    }
  }
}
