# Comprehensive Analysis & Data Specification — Milestone 1 (Explorer M1-1)

## 1. Executive Summary
This analysis report defines the complete data specifications, POI dataset, JSON schema for `data.json`, and implementation architecture for `js/dataProvider.js` for Milestone 1 of the Laxou & Nancy Custom Interactive Map project.

Key deliverables specified:
1. **18 Verified POIs**: Spread across 5 distinct categories (`services`, `parcs`, `culture`, `sports`, `ecoles`) covering Laxou and Nancy.
2. **NPRNU Coverage**: 5 specialized POIs in the Laxou renewal zones (Champ-le-Bœuf and Les Provinces), including CILM, Centre Social / Maison du Projet, Gymnase Champ-le-Bœuf, Groupe Scolaire Champ-le-Bœuf / Tour Cèdre, and Parc Urbain des Provinces.
3. **JSON Schema**: Standardized schema for `data.json` including metadata, bounding coordinates, category definitions with color/icon metadata, and strict POI field contracts.
4. **DataProvider Specification**: Implementation specification for `js/dataProvider.js` with schema validation, accent-insensitive search, multi-field indexing, category filtering, and event bus integration.

---

## 2. Dataset Specification (`data.json`)

### 2.1 Geographic Bounds & Projection Center
- **Center**: Latitude `48.6865`, Longitude `6.1504` (Laxou, France)
- **Bounding Box**:
  - `minLat`: `48.6750` (Nancy South - Nancy Thermal)
  - `maxLat`: `48.7020` (Laxou North - Champ-le-Bœuf)
  - `minLng`: `6.1350` (Laxou West - Haut-de-Chèvre)
  - `maxLng`: `6.1950` (Nancy East - Place Stanislas / Pépinière)

### 2.2 Category Schema & Metadata
Categories array schema defines the 5 primary filter categories with visual markers:

| Category ID | Name (FR) | Icon Class | Marker Color | Description |
|-------------|-----------|------------|--------------|-------------|
| `services` | Services Publics | `building-columns` | `#2563eb` (Blue) | Mairies, centres sociaux, équipements publics |
| `parcs` | Parcs & Nature | `tree` | `#16a34a` (Green) | Parcs, jardins publics, espaces verts |
| `culture` | Culture & Patrimoine | `landmark` | `#9333ea` (Purple) | Médiathèques, théâtres, opéra, musées |
| `sports` | Sports & Santé | `futbol` | `#ea580c` (Orange) | Complexes sportifs, gymnases, nancy thermal |
| `ecoles` | Écoles & Éducation | `graduation-cap` | `#d97706` (Amber) | Écoles, collèges, lycées |

---

### 2.3 Detailed 18 POI Enumeration

#### Category: `services` (4 POIs)
1. **`mairie-laxou`**: Hôtel de Ville de Laxou
   - **Lat/Lng**: `48.6882`, `6.1511`
   - **Address**: `3 Avenue Paul Déroulède, 54520 Laxou`
   - **Description**: Siège principal de l'administration municipale de Laxou, des services administratifs et de l'état civil.
   - **Image**: `https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop`
   - **Tags**: `["Mairie", "Services publics", "État civil", "Laxou"]`
   - **Link**: `https://www.laxou.fr`
   - **isNprnu**: `false`

2. **`cilm-champ-le-boeuf`**: CILM - Centre Intercommunal Laxou Maxéville (NPRNU)
   - **Lat/Lng**: `48.6975`, `6.1425`
   - **Address**: `23 Rue de la Meuse, 54520 Laxou`
   - **Description**: Équipement social et culturel majeur du quartier Champ-le-Bœuf, au cœur du programme de renouvellement urbain (NPRNU).
   - **Image**: `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop`
   - **Tags**: `["NPRNU", "CILM", "Champ-le-Bœuf", "Services publics", "Social"]`
   - **Link**: `https://www.laxou.fr/fr/le-cilm.html`
   - **isNprnu**: `true`

3. **`centre-social-champ-le-boeuf`**: Centre Social & Maison du Projet Champ-le-Bœuf (NPRNU)
   - **Lat/Lng**: `48.6968`, `6.1440`
   - **Address**: `Rue de Saint-Exupéry, 54520 Laxou`
   - **Description**: Lieu d'accueil, d'information urbaine et d'animation socioculturelle pour la rénovation du quartier Champ-le-Bœuf.
   - **Image**: `https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop`
   - **Tags**: `["NPRNU", "Centre Social", "Maison du Projet", "Champ-le-Bœuf", "Services"]`
   - **Link**: `https://www.laxou.fr/fr/renouvellement-urbain.html`
   - **isNprnu**: `true`

4. **`hotel-de-ville-nancy`**: Hôtel de Ville de Nancy
   - **Lat/Lng**: `48.6936`, `6.1832`
   - **Address**: `Place Stanislas, 54000 Nancy`
   - **Description**: Siège de la Métropole du Grand Nancy et de la Mairie de Nancy, joyau d'architecture du XVIIIe siècle classé à l'UNESCO.
   - **Image**: `https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop`
   - **Tags**: `["Mairie", "Nancy", "Patrimoine", "Services publics", "Grand Nancy"]`
   - **Link**: `https://www.nancy.fr`
   - **isNprnu**: `false`

#### Category: `parcs` (4 POIs)
5. **`parc-boufflers`**: Parc du Champ-de-Boufflers
   - **Lat/Lng**: `48.6845`, `6.1480`
   - **Address**: `Avenue de Boufflers, 54520 Laxou`
   - **Description**: Grand parc paysager à Laxou offrant des zones de détente, des aires de jeux et un panorama sur l'agglomération nancéienne.
   - **Image**: `https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&auto=format&fit=crop`
   - **Tags**: `["Parc", "Espace vert", "Laxou", "Nature", "Promenade"]`
   - **Link**: `https://www.laxou.fr/fr/parcs-et-jardins.html`
   - **isNprnu**: `false`

6. **`parc-urbain-provinces`**: Parc Urbain des Provinces (NPRNU Laxou)
   - **Lat/Lng**: `48.6830`, `6.1565`
   - **Address**: `Avenue de l'Europe, 54520 Laxou`
   - **Description**: Espace vert bioclimatique structurant le renouvellement urbain du secteur des Provinces à Laxou.
   - **Image**: `https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop`
   - **Tags**: `["NPRNU", "Parc", "Provinces", "Laxou", "Écologie"]`
   - **Link**: `https://www.laxou.fr/fr/renouvellement-urbain.html`
   - **isNprnu**: `true`

7. **`parc-pepiniere-nancy`**: Parc de la Pépinière Nancy
   - **Lat/Lng**: `48.6972`, `6.1845`
   - **Address**: `Boulevard 21ème Régiment d'Aviation, 54000 Nancy`
   - **Description**: Parc historique de 21 hectares au cœur de Nancy avec roseraie, espace animalier et allées ombragées.
   - **Image**: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop`
   - **Tags**: `["Parc", "Nancy", "Pépinière", "Nature", "Loisirs"]`
   - **Link**: `https://www.nancy.fr/les-parcs-et-jardins-732.html`
   - **isNprnu**: `false`

8. **`parc-sainte-marie`**: Parc Sainte-Marie Nancy
   - **Lat/Lng**: `48.6810`, `6.1720`
   - **Address**: `Avenue Anatole France, 54000 Nancy`
   - **Description**: Deuxième plus grand parc de Nancy, réputé pour son étang, ses arbres remarquables et sa proximité avec Nancy Thermal.
   - **Image**: `https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop`
   - **Tags**: `["Parc", "Nancy", "Nature", "Arbres", "Détente"]`
   - **Link**: `https://www.nancy.fr/les-parcs-et-jardins-732.html`
   - **isNprnu**: `false`

#### Category: `culture` (4 POIs)
9. **`mediatheque-thirion`**: Médiathèque Gérard Thirion
   - **Lat/Lng**: `48.6870`, `6.1530`
   - **Address**: `Rue de la Libération, 54520 Laxou`
   - **Description**: Équipement culturel municipal de Laxou proposant livres, médias numériques, expositions et ateliers créatifs.
   - **Image**: `https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&auto=format&fit=crop`
   - **Tags**: `["Culture", "Médiathèque", "Livres", "Laxou", "Lecture"]`
   - **Link**: `https://mediatheque.laxou.fr`
   - **isNprnu**: `false`

10. **`espace-culturel-cascade`**: Espace Culturel La Cascade
    - **Lat/Lng**: `48.6850`, `6.1560`
    - **Address**: `Avenue de l'Europe, 54520 Laxou`
    - **Description**: Salle de spectacles et centre d'animation artistique accueillant la saison culturelle municipale.
    - **Image**: `https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=600&auto=format&fit=crop`
    - **Tags**: `["Culture", "Théâtre", "Concerts", "Spectacles", "Laxou"]`
    - **Link**: `https://www.laxou.fr/fr/saison-culturelle.html`
    - **isNprnu**: `false`

11. **`opera-national-lorraine`**: Opéra National de Lorraine
    - **Lat/Lng**: `48.6938`, `6.1848`
    - **Address**: `1 Rue Sainte-Catherine, 54000 Nancy`
    - **Description**: Opéra national situé sur la Place Stanislas, haut lieu de la création lyrique et symphonique.
    - **Image**: `https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop`
    - **Tags**: `["Culture", "Opéra", "Musique", "Nancy", "Patrimoine"]`
    - **Link**: `https://www.opera-national-lorraine.fr`
    - **isNprnu**: `false`

12. **`museum-aquarium-nancy`**: Muséum-Aquarium de Nancy
    - **Lat/Lng**: `48.6930`, `6.1885`
    - **Address**: `34 Rue Sainte-Catherine, 54000 Nancy`
    - **Description**: Établissement Art Déco présentant d'importantes collections zoologiques et des bassins aquatiques de référence.
    - **Image**: `https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop`
    - **Tags**: `["Culture", "Musée", "Aquarium", "Sciences", "Nancy"]`
    - **Link**: `https://www.museumaquariumdenancy.eu`
    - **isNprnu**: `false`

#### Category: `sports` (3 POIs)
13. **`complexe-saussaie`**: Complexe Sportif de la Saussaie
    - **Lat/Lng**: `48.6912`, `6.1455`
    - **Address**: `Rue de la Saussaie, 54520 Laxou`
    - **Description**: Principale infrastructure sportive de Laxou avec terrains de football, piste d'athlétisme et salles polyvalentes.
    - **Image**: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop`
    - **Tags**: `["Sports", "Gymnase", "Football", "Athlétisme", "Laxou"]`
    - **Link**: `https://www.laxou.fr/fr/equipements-sportifs.html`
    - **isNprnu**: `false`

14. **`gymnase-champ-le-boeuf`**: Gymnase Champ-le-Bœuf (NPRNU)
    - **Lat/Lng**: `48.6960`, `6.1410`
    - **Address**: `Rue de la Meuse, 54520 Laxou`
    - **Description**: Halle des sports rénovée desservant les clubs et écoles du quartier Champ-le-Bœuf.
    - **Image**: `https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop`
    - **Tags**: `["NPRNU", "Sports", "Gymnase", "Champ-le-Bœuf", "Laxou"]`
    - **Link**: `https://www.laxou.fr/fr/equipements-sportifs.html`
    - **isNprnu**: `true`

15. **`nancy-thermal`**: Nancy Thermal (Complexe Aquatique & Spa)
    - **Lat/Lng**: `48.6790`, `6.1688`
    - **Address**: `45 Rue du Sergent Blandan, 54000 Nancy`
    - **Description**: Complexe métropolitain dédié aux sports aquatiques, à la santé thermale et au bien-être.
    - **Image**: `https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&auto=format&fit=crop`
    - **Tags**: `["Sports", "Piscine", "Thermal", "Bien-être", "Nancy"]`
    - **Link**: `https://www.nancythermalresort.fr`
    - **isNprnu**: `false`

#### Category: `ecoles` (3 POIs)
16. **`college-victor-hugo`**: Collège Victor Hugo
    - **Lat/Lng**: `48.6895`, `6.1490`
    - **Address**: `Rue Victor Hugo, 54520 Laxou`
    - **Description**: Établissement public d'enseignement secondaire de la ville de Laxou.
    - **Image**: `https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop`
    - **Tags**: `["Écoles", "Collège", "Enseignement", "Laxou"]`
    - **Link**: `http://www.clg-victor-hugo-laxou.fr`
    - **isNprnu**: `false`

17. **`ecole-champ-le-boeuf`**: Groupe Scolaire Champ-le-Bœuf & Résidence Cèdre (NPRNU)
    - **Lat/Lng**: `48.6970`, `6.1450`
    - **Address**: `Rue de Lorraine, 54520 Laxou`
    - **Description**: Groupe scolaire réhabilité au Champ-le-Bœuf dans le périmètre NPRNU près de la Tour Cèdre.
    - **Image**: `https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop`
    - **Tags**: `["NPRNU", "Écoles", "Champ-le-Bœuf", "Maternelle", "Primaire", "Tour Cèdre"]`
    - **Link**: `https://www.laxou.fr/fr/ecoles.html`
    - **isNprnu**: `true`

18. **`lycee-chopin-nancy`**: Lycée Frédéric Chopin
    - **Lat/Lng**: `48.6825`, `6.1640`
    - **Address**: `39 Rue du Sergent Blandan, 54000 Nancy`
    - **Description**: Lycée public proposant des filières générales, technologiques et des classes préparatoires.
    - **Image**: `https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop`
    - **Tags**: `["Écoles", "Lycée", "Nancy", "Enseignement Supérieur"]`
    - **Link**: `http://www.lycee-chopin.fr`
    - **isNprnu**: `false`

---

## 3. Data Schema Contract (`data.json`)

The exact JSON structure for `data.json`:

```json
{
  "metadata": {
    "title": "Carte Interactive de Laxou & Nancy",
    "city": "Laxou",
    "department": "Meurthe-et-Moselle",
    "postalCode": "54520",
    "center": {
      "lat": 48.6865,
      "lng": 6.1504
    },
    "defaultZoom": 14,
    "geoBounds": {
      "minLat": 48.6750,
      "maxLat": 48.7020,
      "minLng": 6.1350,
      "maxLng": 6.1950
    }
  },
  "categories": [
    { "id": "services", "name": "Services Publics", "icon": "building-columns", "color": "#2563eb" },
    { "id": "parcs", "name": "Parcs & Nature", "icon": "tree", "color": "#16a34a" },
    { "id": "culture", "name": "Culture & Patrimoine", "icon": "landmark", "color": "#9333ea" },
    { "id": "sports", "name": "Sports & Santé", "icon": "futbol", "color": "#ea580c" },
    { "id": "ecoles", "name": "Écoles & Éducation", "icon": "graduation-cap", "color": "#d97706" }
  ],
  "places": [
    /* Array of 18 POIs defined above */
  ]
}
```

---

## 4. `DataProvider` Class Architecture (`js/dataProvider.js`)

### 4.1 Interface Specification

```javascript
/**
 * DataProvider handles fetching data.json, validating schema,
 * indexing POIs, and providing reactive filtering & search capabilities.
 */
export class DataProvider {
  constructor(eventBus = null) {
    this.eventBus = eventBus;
    this.data = null;
    this.places = [];
    this.categories = [];
    this.metadata = null;
    this.placeMap = new Map();
  }

  /**
   * Fetch and parse data.json
   * @param {string} url 
   * @returns {Promise<Object>}
   */
  async loadData(url = 'data.json') { ... }

  /**
   * Validate required JSON schema fields
   * @param {Object} rawData 
   * @throws {Error} if validation fails
   */
  validateSchema(rawData) { ... }

  /**
   * Return all places
   * @returns {Array<Object>}
   */
  getPlaces() { ... }

  /**
   * Return category by ID or all categories
   * @returns {Array<Object>}
   */
  getCategories() { ... }

  /**
   * Return metadata
   * @returns {Object}
   */
  getMetadata() { ... }

  /**
   * Get POI by ID
   * @param {string} id 
   * @returns {Object|null}
   */
  getPlaceById(id) { ... }

  /**
   * Filter places by category ID and search query
   * @param {string} [categoryId='all'] 
   * @param {string} [searchQuery=''] 
   * @returns {Array<Object>}
   */
  filterPlaces(categoryId = 'all', searchQuery = '') { ... }

  /**
   * Internal helper: normalize strings (lowercase + accent stripping)
   * @param {string} str 
   * @returns {string}
   */
  normalizeText(str) { ... }
}
```

### 4.2 Key Logic Details for Implementation

1. **Schema Validation**:
   - Must throw an explicit `Error` if `places` is missing or not an array.
   - Must verify each POI has `id`, `name`, `category`, `lat`, `lng`.
   - Must ensure `categories` contains the 5 expected category IDs.

2. **Accent Folding / French Diacritics**:
   ```javascript
   normalizeText(str) {
     if (!str) return '';
     return str
       .toLowerCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '');
   }
   ```

3. **Multi-Field Filtering & Search**:
   - Category filtering: `categoryId === 'all' || place.category === categoryId`
   - Text search query match:
     - Search term is normalized.
     - Search string matches if contained in normalized `place.name`, `place.description`, `place.address`, or any element of `place.tags`.

4. **Event Bus Integration**:
   - On completion of `loadData()`, if `this.eventBus` is present, emit `data:loaded` event with `{ placesCount: this.places.length, categoriesCount: this.categories.length }`.

---

## 5. Implementation Roadmap for Implementer

1. Create `data.json` with exact metadata, 5 category definitions, and 18 POI records (including 5 NPRNU locations in Champ-le-Bœuf and Les Provinces).
2. Create `js/dataProvider.js` implementing ES6 class module `DataProvider` with `loadData`, `validateSchema`, `filterPlaces`, `getPlaceById`, `getCategories`, `getMetadata`, accent normalization, and `EventBus` hooks.
3. Write automated unit tests for `dataProvider.js` verifying schema validation errors, 18 POI loading, category filtering, search matching with French accents (e.g. "boef", "ecole", "mediatheque"), and invalid ID handling.
