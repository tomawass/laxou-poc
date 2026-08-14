import os
import json
import ssl
import urllib.request
import urllib.parse
from html.parser import HTMLParser

# Unverified SSL Context for macOS python environment
ssl_context = ssl._create_unverified_context()

class LaxouScraper(HTMLParser):
    def __init__(self, base_url):
        super().__init__()
        self.base_url = base_url
        self.images = []
        self.links = []
        self.headings = []
        self.in_heading = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == 'img' and 'src' in attrs_dict:
            src = attrs_dict['src']
            alt = attrs_dict.get('alt', '')
            full_url = urllib.parse.urljoin(self.base_url, src)
            self.images.append({'src': full_url, 'alt': alt, 'raw_src': src})

        elif tag == 'a' and 'href' in attrs_dict:
            href = attrs_dict['href']
            text = attrs_dict.get('title', '')
            full_url = urllib.parse.urljoin(self.base_url, href)
            self.links.append({'href': full_url, 'text': text})

        elif tag in ['h1', 'h2', 'h3', 'h4']:
            self.in_heading = True

    def handle_endtag(self, tag):
        if tag in ['h1', 'h2', 'h3', 'h4']:
            self.in_heading = False

    def handle_data(self, data):
        data_clean = data.strip()
        if self.in_heading and data_clean:
            self.headings.append(data_clean)


def scrape_site(url, output_dir):
    print(f"Scraping front information from {url}...")
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    
    try:
        with urllib.request.urlopen(req, context=ssl_context, timeout=15) as response:
            html_content = response.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching URL with urllib: {e}")
        return

    parser = LaxouScraper(url)
    parser.feed(html_content)

    os.makedirs(os.path.join(output_dir, "assets"), exist_ok=True)
    
    # Filter potential logos
    logo_urls = []
    for img in parser.images:
        src_lower = img['src'].lower()
        alt_lower = img['alt'].lower()
        if any(k in src_lower or k in alt_lower for k in ['logo', 'blason', 'header', 'laxou', 'brand', 'emblem']):
            if img['src'] not in [l['src'] for l in logo_urls]:
                logo_urls.append(img)

    print(f"Found {len(parser.images)} total images and {len(logo_urls)} logo candidates.")

    # Download logos and key images
    downloaded_logos = []
    for idx, logo in enumerate(logo_urls):
        img_url = logo['src']
        ext = os.path.splitext(urllib.parse.urlparse(img_url).path)[1]
        if not ext or len(ext) > 5 or '?' in ext:
            ext = '.png'
        filename = f"logo_laxou_official_{idx+1}{ext}"
        filepath = os.path.join(output_dir, "assets", filename)
        
        try:
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(img_req, context=ssl_context, timeout=10) as img_resp, open(filepath, 'wb') as f:
                f.write(img_resp.read())
            print(f"Downloaded logo: {filepath}")
            downloaded_logos.append({'filename': filename, 'path': filepath, 'url': img_url, 'alt': logo['alt']})
        except Exception as e:
            print(f"Failed to download {img_url}: {e}")

    # Save summary JSON
    result_data = {
        'url': url,
        'headings': parser.headings[:30],
        'total_images': len(parser.images),
        'downloaded_logos': downloaded_logos,
        'links_sample': [l['href'] for l in parser.links[:25]]
    }

    json_path = os.path.join(output_dir, "laxou_scraped_data.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)

    print(f"Scraped summary saved successfully to {json_path}")


if __name__ == "__main__":
    target_url = "https://www.laxou.fr"
    target_dir = "/Users/carlair/.gemini/antigravity/scratch/laxou-production"
    scrape_site(target_url, target_dir)
