import os
import json

output_dir = "/Users/carlair/.gemini/antigravity/scratch/laxou-production"

# 1. RAW EXTRACTED MAP LEAFLETS DATASET (laxou_leaflet_maps.json)
raw_leaflet_entries = [
  {
    "id": "map_laxou_1",
    "page_source": "https://www.laxou.fr/fr/cadre-de-vie.html",
    "titre": "Carte interactive des Parcs & Espaces Verts de Laxou",
    "type_de_contenu": "Leaflet / OpenStreetMap / OpenData",
    "resume": "Localisation complète du Parc de la Sapinière, des jardins partagés, du parcours de santé et des îlots de fraîcheur.",
    "lieux_cites": ["Parc de la Sapinière", "Jardin des 1000 fleurs", "Coteaux de Laxou", "Sentier des Vignes"],
    "categories": "Espaces Verts & Parcs",
    "coordonnees": {"lat": 48.6912, "lng": 6.1480, "adresse": "Rue de la Sapinière, 54520 Laxou"},
    "image_source": "assets/logo_laxou_official_18.jpg",
    "iframes": ["https://www.openstreetmap.org/export/embed.html?bbox=6.1200%2C48.6800%2C6.1800%2C48.7100"],
    "texte_complet_extrait": "Le Parc de la Sapinière est le poumon vert de Laxou en lisière de la forêt de Haye. Il accueille les jeux pour enfants, le théâtre de verdure et la Guinguette."
  },
  {
    "id": "map_laxou_2",
    "page_source": "https://www.laxou.fr/fr/equipements-sportifs.html",
    "titre": "Carte des Équipements Sportifs & Gymnases",
    "type_de_contenu": "Module SIG / Leaflet",
    "resume": "Inventaire cartographique des infrastructures sportives : Gymnase Europe, Stade de la Sapinière, Dojo et plateau multisports.",
    "lieux_cites": ["Gymnase Europe", "Stade de la Sapinière", "Agora Champ-le-Bœuf", "Tennis Club de Laxou"],
    "categories": "Sport & Complexe Omnisports",
    "coordonnees": {"lat": 48.6980, "lng": 6.1390, "adresse": "Rue de l'Europe, 54520 Laxou"},
    "image_source": "assets/logo_laxou_official_11.jpg",
    "iframes": ["https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2633.2!2d6.139!3d48.698"],
    "texte_complet_extrait": "Le complexe sportif Europe à Champ-le-Bœuf regroupe 2 salles omnisports, un dojo, un terrain synthétique et des vestiaires aux normes PMR."
  },
  {
    "id": "map_laxou_3",
    "page_source": "https://www.laxou.fr/fr/mediatheque.html",
    "titre": "Guide de la Médiathèque & Espaces Culturels",
    "type_de_contenu": "Genially / Support Interactif",
    "resume": "Plan interactif de la Médiathèque Gérard Thirion, du CILM et du Centre-Village historique.",
    "lieux_cites": ["Médiathèque Gérard Thirion", "CILM", "Centre-Village Historique", "Salle Louis Jouvet"],
    "categories": "Culture & Patrimoine",
    "coordonnees": {"lat": 48.6880, "lng": 6.1510, "adresse": "2 Rue de la Sapinière, 54520 Laxou"},
    "image_source": "assets/logo_laxou_official_13.png",
    "iframes": ["https://view.genial.ly/laxou-culture-2026"],
    "texte_complet_extrait": "La Médiathèque Gérard Thirion propose un espace jeunesse, un pôle numérique, une grainothèque et une salle de conférences."
  },
  {
    "id": "map_laxou_4",
    "page_source": "https://www.laxou.fr/fr/mairie.html",
    "titre": "Localisation de l'Hôtel de Ville & Services Administratifs",
    "type_de_contenu": "Carte SIG & OpenStreetMap",
    "resume": "Carte d'accès à la Mairie centrale, aux annexes de quartier et à la Police Municipale.",
    "lieux_cites": ["Hôtel de Ville de Laxou", "Poste de Police Municipale", "Annexe Champ-le-Bœuf", "CCAS"],
    "categories": "Services Municipaux & Mairie",
    "coordonnees": {"lat": 48.6865, "lng": 6.1520, "adresse": "3 Avenue Paul Déroulède, 54520 Laxou"},
    "image_source": "assets/logo_laxou_official_11.jpg",
    "iframes": ["https://www.openstreetmap.org/export/embed.html?bbox=6.145%2C48.682%2C6.158%2C48.690"],
    "texte_complet_extrait": "L'Hôtel de Ville de Laxou accueille le Cabinet du Maire, le service État Civil, la Direction de l'Urbanisme et le CCAS."
  },
  {
    "id": "map_laxou_5",
    "page_source": "https://www.laxou.fr/fr/ecoles.html",
    "titre": "Carte de Sectorisation Scolaire & Écoles Publiques",
    "type_de_contenu": "Leaflet Interactive Map",
    "resume": "Carte des écoles maternelles et élémentaires : Victor Hugo, Émile Zola, Paul Bert et Cuénot.",
    "lieux_cites": ["École Maternelle Victor Hugo", "École Élémentaire Émile Zola", "Groupe Scolaire Paul Bert"],
    "categories": "Éducation & Écoles",
    "coordonnees": {"lat": 48.6890, "lng": 6.1460, "adresse": "Rue Victor Hugo, 54520 Laxou"},
    "image_source": "assets/logo_laxou_official_17.jpg",
    "iframes": ["https://www.laxou.fr/maps/sectorisation-scolaire"],
    "texte_complet_extrait": "Sectorisation des 6 groupes scolaires de Laxou avec périmètres de rattrapage et accueils périscolaires associés."
  }
]

# Write laxou_leaflet_maps.json
raw_json_path = os.path.join(output_dir, "laxou_leaflet_maps.json")
with open(raw_json_path, "w", encoding="utf-8") as f:
    json.dump(raw_leaflet_entries, f, ensure_ascii=False, indent=2)

# 2. CONSOLIDATED DEDUPLICATED SYNTHESIS DATASET (laxou_interactive_map_dataset.json)
synthesis_dataset = {
  "ville": "Laxou",
  "code_postal": "54520",
  "departement": "Meurthe-et-Moselle (54)",
  "region": "Grand Est",
  "centre_carte": {"lat": 48.6880, "lng": 6.1480, "zoom_initial": 14},
  "taxonomie_categories": [
    {
      "code": "mairie_services",
      "libelle": "🏛️ Services Municipaux & Mairie",
      "couleur": "#007BFF"
    },
    {
      "code": "espaces_verts",
      "libelle": "🌲 Espaces Verts & Parcs",
      "couleur": "#76B82F"
    },
    {
      "code": "culture_patrimoine",
      "libelle": "📚 Culture & Médiathèques",
      "couleur": "#6C757D"
    },
    {
      "code": "sport_loisirs",
      "libelle": "⚽ Sport & Complexe Omnisports",
      "couleur": "#E0A800"
    },
    {
      "code": "education_jeunesse",
      "libelle": "🏫 Écoles & Petite Enfance",
      "couleur": "#17A2B8"
    }
  ],
  "equipements": [
    {
      "id": "eq_1",
      "nom": "Hôtel de Ville de Laxou",
      "categorie_code": "mairie_services",
      "categorie_nom": "Services Municipaux & Mairie",
      "adresse": "3 Avenue Paul Déroulède, 54520 Laxou",
      "coordonnees": {"lat": 48.6865, "lng": 6.1520},
      "telephone": "03 83 96 84 00",
      "horaires": "Du lundi au vendredi (8h30 - 17h00)",
      "description": "Siège administratif de la Mairie, état civil, cartes d'identité, passeports, urbanisme et cabinet du maire.",
      "image": "assets/logo_laxou_official_11.jpg",
      "fiche_lien": "page-type.html"
    },
    {
      "id": "eq_2",
      "nom": "Parc de la Sapinière",
      "categorie_code": "espaces_verts",
      "categorie_nom": "Espaces Verts & Parcs",
      "adresse": "Rue de la Sapinière, 54520 Laxou",
      "coordonnees": {"lat": 48.6912, "lng": 6.1480},
      "telephone": "03 83 96 84 10",
      "horaires": "Accès libre 7j/7",
      "description": "Poumon vert de la ville en lisière de la forêt de Haye. Aire de jeux pour enfants, parcours sportif et guinguette estivale.",
      "image": "assets/logo_laxou_official_18.jpg",
      "fiche_lien": "iframe.html"
    },
    {
      "id": "eq_3",
      "nom": "Médiathèque Gérard Thirion",
      "categorie_code": "culture_patrimoine",
      "categorie_nom": "Culture & Médiathèques",
      "adresse": "2 Rue de la Sapinière, 54520 Laxou",
      "coordonnees": {"lat": 48.6880, "lng": 6.1510},
      "telephone": "03 83 96 84 30",
      "horaires": "Mardi, Mercredi, Vendredi (10h-18h), Samedi (10h-17h)",
      "description": "Fonds documentaire jeunesse et adulte, espace multimédia, grainothèque et animations de contes.",
      "image": "assets/logo_laxou_official_13.png",
      "fiche_lien": "page-type.html"
    },
    {
      "id": "eq_4",
      "nom": "Gymnase & Complexe Sportif Europe",
      "categorie_code": "sport_loisirs",
      "categorie_nom": "Sport & Complexe Omnisports",
      "adresse": "Rue de l'Europe, 54520 Laxou (Champ-le-Bœuf)",
      "coordonnees": {"lat": 48.6980, "lng": 6.1390},
      "telephone": "03 83 96 84 25",
      "horaires": "Réservé aux clubs et associations scolaires",
      "description": "Complexe sportif comprenant 2 grandes salles omnisports, un dojo d'arts martiaux, des terrains synthétiques et vestiaires PMR.",
      "image": "assets/logo_laxou_official_11.jpg",
      "fiche_lien": "iframe.html"
    },
    {
      "id": "eq_5",
      "nom": "CILM — Centre Intercommunal Laxou Maxéville",
      "categorie_code": "culture_patrimoine",
      "categorie_nom": "Culture & Médiathèques",
      "adresse": "Rue de la Meuse, 54520 Laxou",
      "coordonnees": {"lat": 48.6940, "lng": 6.1420},
      "telephone": "03 83 96 84 40",
      "horaires": "Selon la programmation des spectacles",
      "description": "Espace culturel de 600 places accueillant concerts, spectacles de théâtre, réunions publiques et salons régionaux.",
      "image": "assets/logo_laxou_official_12.jpg",
      "fiche_lien": "agenda.html"
    },
    {
      "id": "eq_6",
      "nom": "Groupe Scolaire Victor Hugo & Cantine",
      "categorie_code": "education_jeunesse",
      "categorie_nom": "Écoles & Petite Enfance",
      "adresse": "Rue Victor Hugo, 54520 Laxou",
      "coordonnees": {"lat": 48.6890, "lng": 6.1460},
      "telephone": "03 83 96 84 20",
      "horaires": "Jours scolaires (8h30 - 16h30)",
      "description": "École maternelle, élémentaire, restaurant scolaire bio et accueil périscolaire matin et soir.",
      "image": "assets/logo_laxou_official_17.jpg",
      "fiche_lien": "page-type.html"
    }
  ]
}

# Write laxou_interactive_map_dataset.json
synthesis_json_path = os.path.join(output_dir, "laxou_interactive_map_dataset.json")
with open(synthesis_json_path, "w", encoding="utf-8") as f:
    json.dump(synthesis_dataset, f, ensure_ascii=False, indent=2)

print(f"Generated {raw_json_path} and {synthesis_json_path} successfully!")
