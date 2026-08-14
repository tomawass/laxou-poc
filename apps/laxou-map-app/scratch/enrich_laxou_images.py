import json
import urllib.request
import urllib.parse
import re

def search_wikimedia_image(query):
    """Recherche une image pertinente sur l'API Wikimedia Commons."""
    try:
        url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json"
        req = urllib.request.Request(url, headers={'User-Agent': 'LaxouMapApp/1.0 (contact@laxou.fr)'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for page_id, page_info in pages.items():
                if 'thumbnail' in page_info and 'source' in page_info['thumbnail']:
                    return page_info['thumbnail']['source']
    except Exception as e:
        pass
    return None

def main():
    with open('data.json', 'r', encoding='utf-8') as f:
        dataset = json.load(f)

    places = dataset.get('places', [])
    updated_count = 0

    print(f"Début de l'enrichissement des photos pour {len(places)} lieux...")

    # Curated high-res imagery mappings for key Laxou landmarks
    curated_images = {
        "mairie-laxou": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Laxou_H%C3%B4tel_de_Ville.jpg/800px-Laxou_H%C3%B4tel_de_Ville.jpg",
        "mediatheque-gerard-thirion": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop",
        "cilm-champ-le-boeuf": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop",
        "parc-boufflers": "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop",
        "centre-social-champ-le-boeuf": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop",
        "gymnase-champ-le-boeuf": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop",
        "parc-urbain-provinces": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
        "ecole-champ-le-boeuf": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop",
        "piscine-laxou": "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&auto=format&fit=crop"
    }

    for place in places:
        pid = place.get('id')
        name = place.get('name', '')

        # Si une image sur-mesure organisée existe
        if pid in curated_images:
            place['image'] = curated_images[pid]
            updated_count += 1
            continue

        # Sinon tenter la recherche Wikimedia si l'image est vide
        if not place.get('image'):
            search_query = f"{name} Laxou"
            img_url = search_wikimedia_image(search_query)
            if not img_url:
                search_query = f"{name} Nancy"
                img_url = search_wikimedia_image(search_query)

            if img_url:
                place['image'] = img_url
                updated_count += 1

    print(f"Enrichissement terminé : {updated_count} photos mises à jour/attribuées.")

    # Sauvegarder data.json
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    # Synchroniser js/data.js
    with open('js/data.js', 'w', encoding='utf-8') as f:
        f.write(f"window.LAXOU_DATA = {json.dumps(dataset, ensure_ascii=False, indent=2)};\n")

    print("data.json et js/data.js synchronisés avec succès.")

if __name__ == '__main__':
    main()
