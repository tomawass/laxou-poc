# Original User Request

## Initial Request — 2026-08-06T10:03:09Z

# Teamwork Project Prompt

Application web de carte interactive personnalisée avec un moteur cartographique maison (Canvas / SVG interactif, sans Leaflet ni Mapbox) pour la ville de Laxou et ses environs (Nancy).

Working directory: /Users/carlair/.gemini/antigravity/scratch/laxou-map-app
Integrity mode: development

## Requirements

### R1. Moteur cartographique Canvas / SVG sur-mesure
- Implémenter en Vanilla JS (HTML5 / CSS3 / ES6+) un moteur de carte interactif basé sur Canvas et/or SVG.
- Gérer de manière fluide le déplacement (drag/pan), le zoom (+/-, molette, tactile/double-clic) et le redimensionnement du canevas.
- Ne pas utiliser de bibliothèques tierces (Leaflet, Mapbox, OpenLayers interdits).

### R2. Projection des données et gestion du fichier `data.json`
- Charger et parser le fichier `data.json` contenant les lieux d'intérêt de Laxou/Nancy (NPRNU, équipements, parcs, etc.).
- Convertir les coordonnées géographiques (latitude, longitude) en positions exactes sur la carte vectorielle / canevas.
- Générer des marqueurs interactifs stylisés pour chaque lieu.

### R3. Navigation et Panneau latéral interactif
- Au clic sur un marqueur, ouvrir un panneau latéral réactif à droite affichant le détail du lieu (titre, catégorie, adresse, description, image, liens).
- Synchroniser la sélection entre la liste latérale et la carte (mise en valeur du marqueur sélectionné et recentrage fluide).

### R4. Filtrage par catégories & Recherche textuelle
- Proposer une barre de filtres par catégories (Services publics, Parcs, Culture, Sports, Écoles).
- Proposer une barre de recherche textuelle réactive sur les noms, descriptions et tags.

### R5. Responsive Design & Accessibilité (a11y)
- Assurer un affichage responsive et optimisé pour écrans Desktop et Mobile.
- Assurer la navigation intégrale au clavier (tabulation, focus visible, sélection par touche Entrée/Espace, fermeture par touche Échap).

## Acceptance Criteria

### Moteur de Carte Canvas / SVG
- [ ] La carte s'affiche et réagit instantanément sans aucune dépendance cartographique externe.
- [ ] Le déplacement (pan) et le zoom (+/- et molette) fonctionnent sans ralentissement.
- [ ] Les marqueurs restent parfaitement alignés lors du zoom et du pan.

### Gestion des Données & Filtrage
- [ ] Le fichier `data.json` est chargé dynamiquement via `fetch`.
- [ ] Le clic sur un marqueur ou un élément de liste ouvre le panneau latéral de détail.
- [ ] Les filtres par catégorie et la recherche textuelle mettent à jour la carte et la liste simultanément.

### Accessibilité & Code Quality
- [ ] Navigation clavier fonctionnelle sur tous les contrôles et éléments interactifs avec contour de focus distinct.
- [ ] Code propre, modulaire et richement commenté en français.
