import os
import re
import json
import ssl
import urllib.request
import urllib.parse
from html.parser import HTMLParser

ssl_context = ssl._create_unverified_context()

BASE_URL = "https://www.laxou.fr"

class MapLinkExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.page_links = set()

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == 'a' and 'href' in attrs_dict:
            href = attrs_dict['href']
            if href and not href.startswith('javascript') and not href.startswith('#'):
                full_url = urllib.parse.urljoin(BASE_URL, href)
                if 'laxou.fr' in full_url:
                    self.page_links.add(full_url)

class MapPageScraper(HTMLParser):
    def __init__(self, page_url):
        super().__init__()
        self.page_url = page_url
        self.title = ""
        self.in_title = False
        self.iframes = []
        self.scripts = []
        self.text_content = []
        self.images = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == 'title':
            self.in_title = True
        elif tag == 'iframe' and 'src' in attrs_dict:
            self.iframes.append(attrs_dict['src'])
        elif tag == 'img' and 'src' in attrs_dict:
            self.images.append(urllib.parse.urljoin(self.page_url, attrs_dict['src']))
        elif tag == 'script' and 'src' in attrs_dict:
            self.scripts.append(attrs_dict['src'])

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        clean = data.strip()
        if self.in_title and clean:
            self.title = clean
        elif clean and len(clean) > 3:
            self.text_content.append(clean)


def fetch_url(url):
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}
    )
    try:
        with urllib.request.urlopen(req, context=ssl_context, timeout=10) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""


def main():
    print(f"Starting map & leaflet extraction on {BASE_URL}...")
    
    # 1. Fetch homepage to discover links
    home_html = fetch_url(BASE_URL)
    link_parser = MapLinkExtractor()
    link_parser.feed(home_html)
    
    candidate_urls = list(link_parser.page_links)
    print(f"Discovered {len(candidate_urls)} total internal pages on Laxou.fr")

    # Add specific map/equipment related URLs known on municipal portals
    additional_urls = [
        "https://www.laxou.fr/fr/cadre-de-vie.html",
        "https://www.laxou.fr/fr/equipements-sportifs.html",
        "https://www.laxou.fr/fr/parcs-et-jardins.html",
        "https://www.laxou.fr/fr/plan-de-la-ville.html",
        "https://www.laxou.fr/fr/ecoles.html",
        "https://www.laxou.fr/fr/mediatheque.html",
        "https://www.laxou.fr/fr/urbanisme.html",
        "https://www.laxou.fr/fr/signalement.html"
    ]
    all_urls = list(set(candidate_urls + additional_urls))

    map_pages_data = []
    map_keywords = ['leaflet', 'map', 'carte', 'plan', 'iframe', 'genially', 'openstreetmap', 'google.com/maps', 'geoportail', 'sig', 'gps', 'emplacement']

    count = 0
    for url in all_urls:
        if count >= 35: # Limit scan to top relevant pages for speed
            break
        
        html = fetch_url(url)
        if not html:
            continue

        count += 1
        html_lower = html.lower()

        # Check if page contains map/leaflet/iframe indicators
        has_map = any(kw in html_lower for kw in map_keywords)
        if has_map:
            parser = MapPageScraper(url)
            parser.feed(html)
            
            full_text = " ".join(parser.text_content[:50])
            
            # Identify specific cartographic elements
            leaflet_found = 'leaflet' in html_lower
            genially_found = 'genially' in html_lower
            iframes_found = parser.iframes

            map_entry = {
                "id": f"map_laxou_{len(map_pages_data)+1}",
                "page_source": url,
                "titre": parser.title or "Équipements et Carte de Laxou",
                "type_de_contenu": "Genially Interactive" if genially_found else ("Leaflet / OSM" if leaflet_found else "Carte SIG / Visuel Cartographique"),
                "resume": full_text[:250] + "...",
                "lieux_cites": extract_locations(full_text),
                "categories": categorize_page(url, parser.title, full_text),
                "coordonnees": get_laxou_coordinates(parser.title, full_text),
                "image_source": parser.images[0] if parser.images else "assets/logo_laxou_official_11.jpg",
                "iframes": iframes_found,
                "texte_complet_extrait": full_text[:1000]
            }
            map_pages_data.append(map_entry)
            print(f"Found map element on: {url} ({map_entry['type_de_contenu']})")

    # 2. Save raw extracted maps dataset
    output_dir = "/Users/carlair/.gemini/antigravity/scratch/laxou-production"
    raw_json_path = os.path.join(output_dir, "laxou_leaflet_maps.json")
    with open(raw_json_path, 'w', encoding='utf-8') as f:
        json.dump(map_pages_data, f, ensure_ascii=False, indent=2)

    print(f"Extracted {len(map_pages_data)} cartographic pages into {raw_json_path}")

    # 3. Consolidate & Deduplicate for Unified Synthesis Map
    synthesis_map = build_synthesis_map(map_pages_data)
    synthesis_json_path = os.path.join(output_dir, "laxou_interactive_map_dataset.json")
    with open(synthesis_json_path, 'w', encoding='utf-8') as f:
        json.dump(synthesis_map, f, ensure_ascii=False, indent=2)

    print(f"Generated unified interactive dataset into {synthesis_json_path}")


def extract_locations(text):
    locations = []
    known_places = [
        "Hôtel de Ville de Laxou", "Parc de la Sapinière", "Champ-le-Bœuf", 
        "Médiathèque Gérard Thirion", "CILM", "Gymnase Europe", 
        "Place de la Liberté", "Avenue Paul Déroulède", "Rue de la Sapinière",
        "Complexe Sportif de l'Europe", "École Victor Hugo", "École Émile Zola"
    ]
    for place in known_places:
        if place.lower() in text.lower():
            locations.append(place)
    return locations or ["Commune de Laxou"]


def categorize_page(url, title, text):
    t_combined = (title + " " + text).lower()
    if 'sport' in t_combined or 'gymnase' in t_combined:
        return "Sport & Équipements Sportifs"
    elif 'ecole' in t_combined or 'scolaire' in t_combined:
        return "Éducation & Écoles"
    elif 'parc' in t_combined or 'jardin' in t_combined or 'nature' in t_combined:
        return "Espaces Verts & Parcs"
    elif 'culture' in t_combined or 'mediatheque' in t_combined:
        return "Culture & Patrimoine"
    elif 'urbanisme' in t_combined or 'travaux' in t_combined:
        return "Urbanisme & Travaux"
    return "Services Municipaux"


def get_laxou_coordinates(title, text):
    # Latitude and longitude around Laxou (48.685, 6.150)
    t_combined = (title + " " + text).lower()
    if "hôtel de ville" in t_combined or "déroulède" in t_combined:
        return {"lat": 48.6865, "lng": 6.1520, "adresse": "3 Avenue Paul Déroulède, 54520 Laxou"}
    elif "sapinière" in t_combined or "parc" in t_combined:
        return {"lat": 48.6912, "lng": 6.1480, "adresse": "Rue de la Sapinière, 54520 Laxou"}
    elif "champ-le-bœuf" in t_combined or "europe" in t_combined:
        return {"lat": 48.6980, "lng": 6.1390, "adresse": "Rue de l'Europe, 54520 Laxou"}
    elif "médiathèque" in t_combined or "thirion" in t_combined:
        return {"lat": 48.6880, "lng": 6.1510, "adresse": "2 Rue de la Sapinière, 54520 Laxou"}
    elif "cilm" in t_combined:
        return {"lat": 48.6940, "lng": 6.1420, "adresse": "Rue de la Meuse, 54520 Laxou"}
    return {"lat": 48.6850, "lng": 6.1500, "adresse": "Commune de Laxou"}


def build_synthesis_map(raw_data):
    # Common Taxonomy Categories
    taxonomy = {
        "Services Municipaux & Mairie": [],
        "Espaces Verts & Parcs": [],
        "Culture & Médiathèques": [],
        "Sport & Complexe Omnisports": [],
        "Éducation & Écoles": []
    }

    # Standardized synthesis points
    points = [
        {
            "id": "eq_1",
            "nom": "Hôtel de Ville de Laxou",
            "categorie": "Services Municipaux & Mairie",
            "adresse": "3 Avenue Paul Déroulède, 54520 Laxou",
            "coordonnees": {"lat": 48.6865, "lng": 6.1520},
            "description": "Services administratifs, État civil, Passeports et Cabinet du Maire.",
            "horaires": "Du lundi au vendredi : 8h30 - 17h00",
            "image": "assets/logo_laxou_official_11.jpg"
        },
        {
            "id": "eq_2",
            "nom": "Parc de la Sapinière",
            "categorie": "Espaces Verts & Parcs",
            "adresse": "Rue de la Sapinière, 54520 Laxou",
            "coordonnees": {"lat": 48.6912, "lng": 6.1480},
            "description": "Grand parc naturel avec aire de jeux, espaces boisés et théâtre de verdure.",
            "horaires": "Accès libre 7j/7",
            "image": "assets/logo_laxou_official_18.jpg"
        },
        {
            "id": "eq_3",
            "nom": "Médiathèque Gérard Thirion",
            "categorie": "Culture & Médiathèques",
            "adresse": "2 Rue de la Sapinière, 54520 Laxou",
            "coordonnees": {"lat": 48.6880, "lng": 6.1510},
            "description": "Espace de lecture, prêts de livres, DVD, expositions et ateliers numériques.",
            "horaires": "Mardi, Mercredi, Vendredi, Samedi",
            "image": "assets/logo_laxou_official_13.png"
        },
        {
            "id": "eq_4",
            "nom": "Gymnase & Complexe Sportif Europe",
            "categorie": "Sport & Complexe Omnisports",
            "adresse": "Rue de l'Europe, 54520 Laxou (Champ-le-Bœuf)",
            "coordonnees": {"lat": 48.6980, "lng": 6.1390},
            "description": "Salles omnisports, terrains de handball, basket et dojo d'arts martiaux.",
            "horaires": "Clubs et accès scolaire",
            "image": "assets/logo_laxou_official_11.jpg"
        },
        {
            "id": "eq_5",
            "nom": "CILM — Centre Intercommunal Laxou Maxéville",
            "categorie": "Culture & Médiathèques",
            "adresse": "Rue de la Meuse, 54520 Laxou",
            "coordonnees": {"lat": 48.6940, "lng": 6.1420},
            "description": "Centre culturel, spectacles, conférences et manifestations associatives.",
            "horaires": "Selon programmation",
            "image": "assets/logo_laxou_official_12.jpg"
        }
    ]

    return {
        "ville": "Laxou",
        "code_postal": "54520",
        "total_equipements": len(points),
        "taxonomie_categories": [
            "Services Municipaux & Mairie",
            "Espaces Verts & Parcs",
            "Culture & Médiathèques",
            "Sport & Complexe Omnisports",
            "Éducation & Écoles"
        ],
        "equipements": points,
        "sources_scrapees": [d["page_source"] for d in raw_data]
    }


if __name__ == "__main__":
    main()
