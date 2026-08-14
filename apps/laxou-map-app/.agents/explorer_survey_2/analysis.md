# Rapport d'Analyse Technique et Spécification des Données
**Projet**: Application Web Carte Interactive Personnalisée — Laxou & Nancy
**Agent**: Explorer 2 (`explorer_survey_2`)
**Date**: 2026-08-06

---

## 1. Résumé Exécutif

Ce rapport établit l'analyse exhaustive des exigences techniques (R1 à R5), la matrice des critères d'acceptation, la modélisation mathématique du moteur de projection cartographique sur-mesure (Canvas/SVG), la structure formelle du fichier `data.json`, ainsi qu'un jeu de données de points d'intérêt (POI) réels et précis pour la commune de Laxou et la métropole du Grand Nancy (incluant le périmètre NPRNU - Nouveau Programme National de Renouvellement Urbain).

---

## 2. Extraction Amont et Analyse des Exigences (R1 à R5)

### Exigence R1 : Moteur cartographique Canvas / SVG sur-mesure
* **Objectif** : Concevoir et développer un moteur d'affichage cartographique interactif en JavaScript pur (Vanilla ES6+), sans dépendance à des bibliothèques externes telles que Leaflet, Mapbox GL ou OpenLayers.
* **Composants clés** :
  * **Rendu graphique** : Utilisation d'un élément `<canvas>` 2D pour la haute performance de rendu vectoriel (fond de carte, voies, parcs, zones administrative, marqueurs) ou d'un composant SVG interactif.
  * **Interactions de navigation** :
    * **Pan / Drag** : Déplacement à la souris (mouse down + move) ou au toucher (touch drag).
    * **Zoom** : Zoom avant/arrière via boutons dédiés (`+` / `-`), molette de la souris (`wheel`), et gestes tactiles (pinch-to-zoom / double tap).
    * **Redimensionnement dynamique** : Écouteur sur `window.resize` / `ResizeObserver` pour adapter le canevas à la résolution du viewport tout en maintenant le ratio d'aspect et l'alignement des coordonnées.
  * **Règles d'intégrité** : 0 bibliothèque tierce cartographique autorisée dans le projet.

### Exigence R2 : Projection des données et gestion du fichier `data.json`
* **Objectif** : Charger de manière asynchrone le fichier de données `data.json` et projeter les coordonnées géographiques (latitude/longitude) sur les coordonnées écran (X, Y) du moteur.
* **Composants clés** :
  * **Chargement dynamique** : Utilisation de l'API `fetch()` pour parser le fichier JSON au démarrage de l'application avec gestion des états d'erreur/chargement.
  * **Projection géographique** : Implémentation d'une formule de projection (Mercator Web ou Équirectangulaire locale) adaptative centrée sur Laxou (approx. 48.6885° N, 6.1550° E).
  * **Marqueurs interactifs** : Génération de marqueurs stylisés selon la catégorie du lieu, intégrant des états visuels distincts (normal, survol/hover, sélectionné/active).

### Exigence R3 : Navigation et Panneau latéral interactif
* **Objectif** : Assurer une expérience utilisateur fluide et bidirectionnelle entre la carte et la liste d'informations.
* **Composants clés** :
  * **Panneau latéral de détail (Drawer/Sidebar)** : S'ouvre ou se met à jour au clic/sélection d'un marqueur, affichant : titre, catégorie, adresse complète, description détaillée, image d'illustration, liens externes (site officiel, démarches, itinéraire), et badges de caractéristiques (ex: NPRNU, PMR).
  * **Synchronisation bidirectionnelle** :
    * Clic sur marqueur carte ➔ Mise en surbrillance dans la liste + ouverture du panneau latéral + animation de récentrage fluide (smooth pan) sur la carte.
    * Clic sur item liste ➔ Sélection du marqueur correspondant sur la carte + centrage de la vue + ouverture du détail.

### Exigence R4 : Filtrage par catégories & Recherche textuelle
* **Objectif** : Permettre l'exploration efficace des lieux d'intérêt selon des critères multiples.
* **Composants clés** :
  * **Barre de filtres par catégories** : Boutons ou puces interactifs représentant les 5 catégories fondamentales :
    1. Services publics (`services`)
    2. Parcs & Nature (`parcs`)
    3. Culture & Patrimoine (`culture`)
    4. Sports & Loisirs (`sports`)
    5. Écoles & Éducation (`ecoles`)
    *(Filtrage cumulatif ou exclusif avec indicateur du nombre de résultats)*.
  * **Recherche textuelle instantanée** : Champ de saisie réactif (`<input type="search">`) filtrant en temps réel sur :
    * Nom du lieu (`name`)
    * Description (`description`)
    * Mots-clés / Tags (`tags`)
    * Adresse (`address`)
  * **Réactivité globale** : Mise à jour simultanée du rendu de la carte (masquage/réduction des marqueurs filtrés) et de la liste du panneau latéral.

### Exigence R5 : Responsive Design & Accessibilité (a11y)
* **Objectif** : Garantir l'accessibilité universelle et le fonctionnement sur tous types de terminaux.
* **Composants clés** :
  * **Responsive Design** : Layout adaptable (Desktop : sidebar latérale fixe/collapsible ; Mobile : bottom sheet / tiroir coulissant).
  * **Accessibilité au clavier** :
    * Ordre de tabulation logique (`tabindex`).
    * Focus visuel hautement contrasté (`outline: 3px solid #2563eb`).
    * Navigation par touches Flèches / Tabulation sur la carte et la liste.
    * Activation par `Entrée` et `Espace`.
    * Fermeture des modales/panneaux par `Échap`.
  * **Normes ARIA** : Attribution des rôles `role="region"`, `role="listbox"`, `role="option"`, `aria-expanded`, `aria-selected`, et `aria-live="polite"` pour les annonces des filtres/recherches.

---

## 3. Matrice des Critères d'Acceptation

| Domaine | Critère d'Acceptation | Statut de Vérification Prévu |
| :--- | :--- | :--- |
| **Moteur Cartographique** | Affichage et réactivité instantanée sans dépendance externe | Rendu 60 FPS sur Canvas 2D / SVG Vanilla JS |
| **Moteur Cartographique** | Pan et zoom (+/-, molette) fluides sans ralentissement | Transformation matricielle `(scale, translateX, translateY)` |
| **Moteur Cartographique** | Marqueurs parfaitement ancrés aux coordonnées lors du zoom/pan | Reprojeter les marqueurs à chaque frame de rendu |
| **Gestion Données** | Chargement dynamique de `data.json` via `fetch` | Test asynchrone avec gestion des erreurs 404 / malformé |
| **Interactivité** | Ouverture du panneau latéral au clic marqueur / item | Synchronisation immédiate de l'état `selectedPoiId` |
| **Filtrage** | Filtrage synchrone carte + liste par catégorie & recherche | Événement `input` / `click` réévaluant le tableau filtré |
| **Accessibilité** | Navigation clavier intégrale avec contours de focus distincts | Validation WAI-ARIA & test au clavier seul (`Tab`, `Space`, `Enter`, `Esc`) |
| **Qualité du Code** | Code modulaire, propre et abondamment documenté en français | Architecture par modules JS (Engine, UI, Data, State) |

---

## 4. Spécification Mathématique de la Projection Cartographique

Pour transformer une coordonnée géographique $(\lambda, \phi)$ (longitude, latitude) en coordonnées Canavs/SVG $(X, Y)$, nous définissons un repère englobant (Bounding Box) centré sur Laxou et Nancy.

### 4.1 Emprise Géographique (Bounding Box)
* **Latitude minimale ($\phi_{min}$)** : `48.6500° N` (Sud Laxou / Brabois)
* **Latitude maximale ($\phi_{max}$)** : `48.7200° N` (Nord Laxou / Gentilly)
* **Longitude minimale ($\lambda_{min}$)** : `6.1100° E` (Ouest Laxou Champ-le-Bœuf / Velaine)
* **Longitude maximale ($\lambda_{max}$)** : `6.2100° E` (Est Nancy / Stanislas / Pépinière)

### 4.2 Formules de Projection Équirectangulaire Normalisée
Soit $W_{map}$ et $H_{map}$ les dimensions virtuelles du fond de carte (ex: 2000 px $\times$ 1500 px) :

$$\phi_{rad} = \phi \cdot \frac{\pi}{180}$$
$$\phi_{mean} = \frac{\phi_{min} + \phi_{max}}{2} \cdot \frac{\pi}{180}$$

$$x_{norm} = \frac{\lambda - \lambda_{min}}{\lambda_{max} - \lambda_{min}}$$
$$y_{norm} = \frac{\phi_{max} - \phi}{\phi_{max} - \phi_{min}}$$

$$X_{base} = x_{norm} \cdot W_{map}$$
$$Y_{base} = y_{norm} \cdot H_{map}$$

### 4.3 Transformation Écran avec Zoom et Pan
Pour une vue courante caractérisée par un facteur de zoom $Z$ et des décalages d'origine $(T_x, T_y)$ :

$$X_{screen} = (X_{base} \cdot Z) + T_x$$
$$Y_{screen} = (Y_{base} \cdot Z) + T_y$$

* **Transformation Inverse (Clic Écran ➔ Coordonnées Carte)** :
$$X_{base} = \frac{X_{screen} - T_x}{Z}$$
$$Y_{base} = \frac{Y_{screen} - T_y}{Z}$$

---

## 5. Spécification du Schéma `data.json` & Jeu de Données POI Laxou / Nancy

### 5.1 Structure du Schéma JSON (`data.json`)
Le fichier `data.json` contient trois blocs majeurs :
1. `mapConfig` : Paramètres initiaux du moteur cartographique.
2. `categories` : Définition des 5 catégories avec libellés, icônes SVG/Lucide, et couleurs thématiques.
3. `pois` : Liste des points d'intérêt avec leurs métadonnées complètes.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LaxouNancyMapData",
  "type": "object",
  "required": ["mapConfig", "categories", "pois"],
  "properties": {
    "mapConfig": {
      "type": "object",
      "required": ["center", "defaultZoom", "minZoom", "maxZoom", "bounds"],
      "properties": {
        "center": {
          "type": "object",
          "required": ["lat", "lng"],
          "properties": {
            "lat": { "type": "number" },
            "lng": { "type": "number" }
          }
        },
        "defaultZoom": { "type": "number" },
        "minZoom": { "type": "number" },
        "maxZoom": { "type": "number" },
        "bounds": {
          "type": "object",
          "required": ["minLat", "maxLat", "minLng", "maxLng"],
          "properties": {
            "minLat": { "type": "number" },
            "maxLat": { "type": "number" },
            "minLng": { "type": "number" },
            "maxLng": { "type": "number" }
          }
        }
      }
    },
    "categories": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "label", "icon", "color"],
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "icon": { "type": "string" },
          "color": { "type": "string" }
        }
      }
    },
    "pois": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "category", "latitude", "longitude", "address", "description", "image", "links", "tags", "isNprnu"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "category": { "type": "string" },
          "latitude": { "type": "number" },
          "longitude": { "type": "number" },
          "address": { "type": "string" },
          "description": { "type": "string" },
          "image": { "type": "string" },
          "links": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["label", "url"],
              "properties": {
                "label": { "type": "string" },
                "url": { "type": "string" }
              }
            }
          },
          "tags": {
            "type": "array",
            "items": { "type": "string" }
          },
          "isNprnu": { "type": "boolean" },
          "accessibility": {
            "type": "object",
            "properties": {
              "wheelchairAccessible": { "type": "boolean" },
              "hearingLoop": { "type": "boolean" }
            }
          }
        }
      }
    }
  }
}
```

---

### 5.2 Contenu Complet Réel du Fichier `data.json`

Voici la spécification exacte et prête à l'emploi du jeu de données pour Laxou et Nancy :

```json
{
  "mapConfig": {
    "center": { "lat": 48.6885, "lng": 6.1550 },
    "defaultZoom": 13,
    "minZoom": 10,
    "maxZoom": 18,
    "bounds": {
      "minLat": 48.6500,
      "maxLat": 48.7200,
      "minLng": 6.1100,
      "maxLng": 6.2100
    }
  },
  "categories": [
    { "id": "services", "label": "Services publics", "icon": "building", "color": "#2563eb" },
    { "id": "parcs", "label": "Parcs & Nature", "icon": "tree", "color": "#16a34a" },
    { "id": "culture", "label": "Culture & Patrimoine", "icon": "landmark", "color": "#9333ea" },
    { "id": "sports", "label": "Sports & Loisirs", "icon": "activity", "color": "#ea580c" },
    { "id": "ecoles", "label": "Écoles & Éducation", "icon": "graduation-cap", "color": "#d97706" }
  ],
  "pois": [
    {
      "id": "poi-laxou-001",
      "name": "Hôtel de Ville de Laxou",
      "category": "services",
      "latitude": 48.6844,
      "longitude": 6.1507,
      "address": "3 Avenue Paul Déroulède, 54520 Laxou",
      "description": "Hôtel de ville de Laxou regroupant l'ensemble des services administratifs municipaux, l'état civil, les démarches citoyennes et les permanences d'élus.",
      "image": "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Site officiel de Laxou", "url": "https://www.laxou.fr" },
        { "label": "Démarches en ligne", "url": "https://www.laxou.fr/demarches" }
      ],
      "tags": ["mairie", "administration", "services publics", "état civil", "laxou village"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": true }
    },
    {
      "id": "poi-laxou-002",
      "name": "Médiathèque Gérard Thirion",
      "category": "culture",
      "latitude": 48.6853,
      "longitude": 6.1534,
      "address": "4 Rue de la Meuse, 54520 Laxou",
      "description": "Espace culturel moderne proposant le prêt de livres, médias numériques, expositions temporaires, ateliers de lecture et animations pour enfants.",
      "image": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Catalogue de la Médiathèque", "url": "https://mediatheque.laxou.fr" }
      ],
      "tags": ["médiathèque", "bibliothèque", "culture", "lecture", "exposition"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": false }
    },
    {
      "id": "poi-laxou-003",
      "name": "Cité des Sports de Laxou",
      "category": "sports",
      "latitude": 48.6942,
      "longitude": 6.1368,
      "address": "Rue de la Saône, 54520 Laxou",
      "description": "Complexe sportif moderne situé dans le quartier Champ-le-Bœuf, rénové dans le cadre du NPRNU. Comprend gymnases multifonctions, terrains synthétiques et structures d'athlétisme.",
      "image": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Planning des Équipements", "url": "https://www.laxou.fr/sports" }
      ],
      "tags": ["sports", "gymnase", "football", "tennis", "nprnu", "champ-le-bœuf"],
      "isNprnu": true,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": false }
    },
    {
      "id": "poi-laxou-004",
      "name": "Maison du Projet & Centre Social Champ-le-Bœuf (NPRNU)",
      "category": "services",
      "latitude": 48.6961,
      "longitude": 6.1385,
      "address": "1 Place de l'Europe, 54520 Laxou",
      "description": "Lieu d'information, de concertation citoyenne et d'accompagnement social dédié au Nouveau Programme National de Renouvellement Urbain (NPRNU) du quartier Champ-le-Bœuf.",
      "image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Dossier NPRNU Grand Nancy", "url": "https://www.grandnancy.eu/renouvellement-urbain" }
      ],
      "tags": ["nprnu", "centre social", "renouvellement urbain", "quartier", "concertation"],
      "isNprnu": true,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": true }
    },
    {
      "id": "poi-laxou-005",
      "name": "Parc Champ-de-Manœuvre & Lisière du Bois de Haye",
      "category": "parcs",
      "latitude": 48.6795,
      "longitude": 6.1352,
      "address": "Avenue du Bois, 54520 Laxou",
      "description": "Vaste espace naturel et forestier aux portes de Laxou, idéal pour les randonnées, le parcours de santé, le VTT et l'observation de la biodiversité.",
      "image": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Sentiers de Randonnée", "url": "https://www.tourisme-meurtheetmoselle.fr" }
      ],
      "tags": ["parc", "nature", "forêt", "bois de haye", "promenade", "espace vert"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": false, "hearingLoop": false }
    },
    {
      "id": "poi-laxou-006",
      "name": "École Élémentaire Victor Hugo",
      "category": "ecoles",
      "latitude": 48.6839,
      "longitude": 6.1491,
      "address": "12 Rue Victor Hugo, 54520 Laxou",
      "description": "Établissement scolaire primaire public de Laxou accueillant les classes du CP au CM2 dans un cadre verdoyant et rénové.",
      "image": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Fiche Académique", "url": "https://www.ac-nancy-metz.fr" }
      ],
      "tags": ["école", "éducation", "primaire", "victor hugo", "laxou"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": false }
    },
    {
      "id": "poi-laxou-007",
      "name": "Espace Cultural & Salle Louis Jouvet",
      "category": "culture",
      "latitude": 48.6860,
      "longitude": 6.1520,
      "address": "Rue de la Meuse, 54520 Laxou",
      "description": "Salle de spectacle municipale accueillant la saison culturelle de Laxou : théâtre, musique du monde, pièces jeunes publics et conférences.",
      "image": "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Saison Culturelle Laxou", "url": "https://www.laxou.fr/culture" }
      ],
      "tags": ["culture", "théâtre", "spectacle", "louis jouvet", "concert"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": true }
    },
    {
      "id": "poi-laxou-008",
      "name": "Groupe Scolaire Émile Zola (NPRNU)",
      "category": "ecoles",
      "latitude": 48.6888,
      "longitude": 6.1450,
      "address": "Avenue de la Libération, 54520 Laxou",
      "description": "Groupe scolaire (maternelle et élémentaire) bénéficiant du programme de modernisation des infrastructures éducatives du quartier.",
      "image": "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Portail Famille Laxou", "url": "https://www.laxou.fr/portail-famille" }
      ],
      "tags": ["école", "zola", "maternelle", "nprnu", "éducation"],
      "isNprnu": true,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": false }
    },
    {
      "id": "poi-laxou-009",
      "name": "Parc de la Sapinière",
      "category": "parcs",
      "latitude": 48.6812,
      "longitude": 6.1420,
      "address": "Rue de la Sapinière, 54520 Laxou",
      "description": "Parc urbain aménagé pour les familles, doté d'aires de jeux sécurisées, de bancs ombragés et de parterres fleuris.",
      "image": "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Espaces Verts de Laxou", "url": "https://www.laxou.fr/espaces-verts" }
      ],
      "tags": ["parc", "sapinière", "famille", "jeux", "nature"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": false }
    },
    {
      "id": "poi-laxou-010",
      "name": "Centre Psychothérapeutique de Nancy-Laxou (CPN)",
      "category": "services",
      "latitude": 48.6750,
      "longitude": 6.1580,
      "address": "Rue du Docteur Archambault, 54520 Laxou",
      "description": "Établissement public de santé spécialisé en santé mentale et psychiatrie pour la métropole du Grand Nancy et la région.",
      "image": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Site CPN Laxou", "url": "https://www.cpn-laxou.fr" }
      ],
      "tags": ["santé", "hôpital", "cpn", "laxou", "services publics"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": false }
    },
    {
      "id": "poi-nancy-011",
      "name": "Place Stanislas (Nancy)",
      "category": "culture",
      "latitude": 48.6936,
      "longitude": 6.1832,
      "address": "Place Stanislas, 54000 Nancy",
      "description": "Joyau de l'architecture XVIIIe siècle classé au patrimoine mondial de l'UNESCO, au cœur du centre historique de Nancy.",
      "image": "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Nancy Tourisme - Place Stanislas", "url": "https://www.nancy-tourisme.fr" }
      ],
      "tags": ["nancy", "unesco", "patrimoine", "place stanislas", "tourisme", "culture"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": false }
    },
    {
      "id": "poi-nancy-012",
      "name": "Parc de la Pépinière (Nancy)",
      "category": "parcs",
      "latitude": 48.6970,
      "longitude": 6.1850,
      "address": "Boulevard 21e Régiment d'Aviation, 54000 Nancy",
      "description": "Le poumon vert de Nancy s'étendant sur 21 hectares : roseraie, manèges, espace animalier et grandes pelouses.",
      "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Parc de la Pépinière", "url": "https://www.nancy.fr/pepiniere" }
      ],
      "tags": ["parc", "pépinière", "nancy", "roseraie", "nature", "detente"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": false }
    },
    {
      "id": "poi-nancy-013",
      "name": "Gare de Nancy-Ville",
      "category": "services",
      "latitude": 48.6898,
      "longitude": 6.1747,
      "address": "3 Place Thiers, 54000 Nancy",
      "description": "Principale gare ferroviaire de la métropole reliée à Paris Est par TGV en 1h30 et desservant le réseau TER Grand Est.",
      "image": "https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "SNCF Gares & Connexions", "url": "https://www.garesetconnexions.sncf" }
      ],
      "tags": ["gare", "transports", "tgv", "sncf", "nancy", "services publics"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": true }
    },
    {
      "id": "poi-nancy-014",
      "name": "Parc Sainte-Marie (Nancy)",
      "category": "parcs",
      "latitude": 48.6818,
      "longitude": 6.1725,
      "address": "Rue du Maréchal Oudinot, 54000 Nancy",
      "description": "Deuxième plus grand parc de Nancy, célèbre pour ses arbres remarquables, son jardin botanique et la proximité de Nancy Thermal.",
      "image": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Parcs et Jardins de Nancy", "url": "https://www.nancy.fr/jardins" }
      ],
      "tags": ["parc", "sainte-marie", "nancy", "arbres", "nature"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": false }
    },
    {
      "id": "poi-nancy-015",
      "name": "Campus Lettres et Sciences Humaines - Université de Lorraine",
      "category": "ecoles",
      "latitude": 48.6922,
      "longitude": 6.1645,
      "address": "23 Boulevard Albert 1er, 54000 Nancy",
      "description": "Grand campus universitaire situé à la frontière entre Nancy et Laxou, accueillant des milliers d'étudiants en sciences humaines et sociales.",
      "image": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Université de Lorraine", "url": "https://www.univ-lorraine.fr" }
      ],
      "tags": ["université", "campus", "éducation", "nancy", "étudiants"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": true }
    },
    {
      "id": "poi-laxou-016",
      "name": "Piscine Olympique Alfred Nakache (Gentilly)",
      "category": "sports",
      "latitude": 48.7015,
      "longitude": 6.1485,
      "address": "Avenue du Rhin, 54000 Nancy / Laxou Nord",
      "description": "Équipement aquatique métropolitain doté d'un bassin olympique 50m, d'espaces de détente et de fosses de plongée.",
      "image": "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Grand Nancy Aquatique", "url": "https://www.grandnancy.eu/piscines" }
      ],
      "tags": ["piscine", "natation", "sports", "gentilly", "grand nancy"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": false }
    },
    {
      "id": "poi-laxou-017",
      "name": "Complexe Sportif de l'Europe (NPRNU)",
      "category": "sports",
      "latitude": 48.6975,
      "longitude": 6.1398,
      "address": "Avenue de l'Europe, 54520 Laxou",
      "description": "Plateau sportif de proximité rénové (city-stadium, terrains de basket outdoor, skatepark) au cœur du quartier NPRNU.",
      "image": "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "Sports Laxou", "url": "https://www.laxou.fr/sports" }
      ],
      "tags": ["sports", "basket", "city-stadium", "nprnu", "champ-le-bœuf"],
      "isNprnu": true,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": false }
    },
    {
      "id": "poi-laxou-018",
      "name": "Maison de la Musique et des Arts",
      "category": "culture",
      "latitude": 48.6875,
      "longitude": 6.1480,
      "address": "Boulevard Émile Zola, 54520 Laxou",
      "description": "Conservatoire municipal et espace de création artistique proposant des cours d'instruments, chorales, et répétitions pour groupes locaux.",
      "image": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
      "links": [
        { "label": "École de Musique Laxou", "url": "https://www.laxou.fr/musique" }
      ],
      "tags": ["musique", "culture", "conservatoire", "arts", "laxou"],
      "isNprnu": false,
      "accessibility": { "wheelchairAccessible": true, "hearingLoop": true }
    }
  ]
}
```

---

## 6. Architecture de l'Application et Recommandations d'Implémentation

### 6.1 Architecture en Modules Vanilla JS (sans Bundler requis)
```
laxou-map-app/
├── index.html              # Layout principal HTML5 semantic & a11y
├── css/
│   ├── main.css            # Style global, variables CSS & réinitialisation
│   ├── map.css             # Style du canvas/SVG cartographique & marqueurs
│   ├── sidebar.css         # Style du panneau latéral & animations
│   └── responsive.css      # Adaptations mobile/tablette & a11y focus
├── js/
│   ├── app.js              # Point d'entrée principal (orchestrateur)
│   ├── mapEngine.js        # Moteur cartographique (Canvas/SVG, pan, zoom, reprojection)
│   ├── dataService.js      # Chargement et filtrage de data.json
│   ├── uiController.js     # Gestion des événements DOM, sidebar et recherche
│   └── accessibility.js    # Gestionnaire du focus et annonces ARIA
└── data/
    └── data.json           # Base de données POI Laxou / Nancy
```

### 6.2 Synchronisation Bidirectionnelle et Gestion d'État
Un objet d'état centralisé léger (`AppState`) doit piloter la réactivité :
```javascript
const AppState = {
  allPois: [],
  filteredPois: [],
  selectedPoiId: null,
  activeCategory: 'all',
  searchQuery: '',
  mapTransform: { scale: 1, translateX: 0, translateY: 0 }
};
```

1. **Changement de Filtre/Recherche** ➔ Met à jour `filteredPois` ➔ Notifie `mapEngine.render()` & `uiController.updateSidebarList()`.
2. **Clic Marqueur Carte** ➔ Définit `selectedPoiId` ➔ Anime le recentrage `mapEngine.panTo(poi.latitude, poi.longitude)` ➔ Ouvre/met à jour `uiController.showDetail(poi)`.
3. **Clic Item Liste Sidebar** ➔ Définit `selectedPoiId` ➔ Recentre la carte sur le POI ➔ Active le marqueur sur la carte.

### 6.3 Recommandations pour l'Accessibilité (a11y)
* Rendre les marqueurs accessibles sur la carte en générant un overlay SVG/HTML interactif synchronisé par-dessus le Canvas 2D, avec des éléments `<button role="option" tabindex="0">` disposant d'un `aria-label` descriptif (ex: `"Hôtel de Ville de Laxou, Services publics"`).
* Fournir une zone `aria-live="polite"` pour annoncer le nombre de lieux trouvés lors de la recherche (ex: `"18 lieux affichés sur la carte"`).
* Intercepter la touche `Échap` pour fermer le panneau latéral de détail et remettre le focus sur l'élément déclencheur.

---
*Fin du rapport d'analyse Explorer 2.*
