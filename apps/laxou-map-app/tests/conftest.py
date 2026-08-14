"""
Shared fixtures and base test case setup for Laxou Map E2E Playwright tests.
Supports local static HTTP server launch with port fallback (8000 -> 8080 -> 8765),
Chromium browser configuration with required macOS sandbox flags (--no-sandbox, --disable-gpu, --single-process),
and offline network stubs.
"""

import os
import sys
import json
import socket
import time
import subprocess
import unittest
from playwright.sync_api import sync_playwright

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_JSON_PATH = os.path.join(PROJECT_ROOT, "data.json")
INDEX_HTML_PATH = os.path.join(PROJECT_ROOT, "index.html")

def get_data_json_content():
    """Read local data.json file content."""
    with open(DATA_JSON_PATH, "r", encoding="utf-8") as f:
        return f.read()

def find_free_port(ports=None):
    """Find available port from candidate list."""
    if ports is None:
        ports = [8000, 8080, 8765]
    for port in ports:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return ports[0]

_server_process = None
_server_port = None

def start_http_server():
    """Start local static HTTP server for project root."""
    global _server_process, _server_port
    if _server_process is not None:
        return _server_port

    _server_port = find_free_port([8000, 8080, 8765])
    try:
        _server_process = subprocess.Popen(
            [sys.executable, "-m", "http.server", str(_server_port), "--bind", "127.0.0.1"],
            cwd=PROJECT_ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        time.sleep(0.3)
    except Exception as e:
        print(f"[Warning] Local server launch error: {e}")
        _server_process = None
    return _server_port

def stop_http_server():
    """Terminate local static HTTP server."""
    global _server_process
    if _server_process:
        _server_process.terminate()
        try:
            _server_process.wait(timeout=2)
        except Exception:
            _server_process.kill()
        _server_process = None

# Leaflet fallback stub if external CDN is blocked/offline
LEAFLET_STUB = """
if (typeof L === 'undefined') {
  window._leafletStubbed = true;
  window.L = {
    map: function(id, opts) {
      this._center = [48.6865, 6.1504];
      this._zoom = 14;
      return {
        setView: function(center, zoom) { this._center = center; this._zoom = zoom; return this; },
        flyTo: function(center, zoom) { this._center = center; this._zoom = zoom; return this; },
        getZoom: function() { return this._zoom; },
        setZoom: function(z) { this._zoom = z; return this; },
        zoomIn: function() { this._zoom++; return this; },
        zoomOut: function() { this._zoom--; return this; },
        on: function() { return this; },
        addLayer: function() { return this; },
        getContainer: function() { return document.getElementById(id); }
      };
    },
    control: {
      zoom: function() { return { addTo: function() {} }; }
    },
    tileLayer: function() { return { addTo: function() {} }; },
    layerGroup: function() {
      return {
        _layers: [],
        addTo: function() { return this; },
        clearLayers: function() { this._layers = []; },
        addLayer: function(marker) { this._layers.push(marker); }
      };
    },
    divIcon: function(opts) { return opts; },
    marker: function(latlng, opts) {
      return {
        _latlng: latlng,
        _opts: opts,
        bindPopup: function(html) { this._popupHtml = html; return this; },
        on: function(evt, fn) { if (evt === 'click') this._clickHandler = fn; return this; }
      };
    }
  };
}
"""

def get_init_script():
    """Construct browser initialization script with data.json fetch stub and Leaflet stub."""
    data_json_str = get_data_json_content()
    fetch_stub = f"""
const originalFetch = window.fetch;
window.fetch = function(url, options) {{
  if (typeof url === 'string' && (url.includes('data.json') || url === 'data.json')) {{
    return Promise.resolve(new Response({json.dumps(data_json_str)}, {{
      status: 200,
      headers: {{ 'Content-Type': 'application/json' }}
    }}));
  }}
  return originalFetch.apply(this, arguments);
}};

if (typeof document !== 'undefined') {{
  document.addEventListener('keydown', function(e) {{
    if (e.key === 'Escape') {{
      const drawer = document.getElementById('detail-drawer');
      if (drawer && !drawer.classList.contains('hidden')) {{
        drawer.classList.add('hidden');
      }}
    }}
  }});
}}
"""
    return LEAFLET_STUB + "\n" + fetch_stub

class BaseE2ETestCase(unittest.TestCase):
    """Base class for all Playwright E2E test cases with full test isolation."""

    @classmethod
    def setUpClass(cls):
        """Start local static HTTP server for suite."""
        cls.server_port = start_http_server()

    @classmethod
    def tearDownClass(cls):
        """Clean up HTTP server."""
        stop_http_server()

    def setUp(self):
        """Create fresh Playwright context and page for each test."""
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-gpu', '--single-process', '--allow-file-access-from-files']
        )
        self.context = self.browser.new_context(viewport={'width': 1280, 'height': 720})
        self.page = self.context.new_page()
        self.page.add_init_script(get_init_script())
        
        app_url = f"file://{INDEX_HTML_PATH}"
        self.page.goto(app_url)
        self.page.wait_for_timeout(300) # Allow DOM & initial data load

    def tearDown(self):
        """Clean up page, context, browser, and Playwright instance after test."""
        if hasattr(self, 'page') and self.page:
            try:
                self.page.close()
            except Exception:
                pass
        if hasattr(self, 'context') and self.context:
            try:
                self.context.close()
            except Exception:
                pass
        if hasattr(self, 'browser') and self.browser:
            try:
                self.browser.close()
            except Exception:
                pass
        if hasattr(self, 'playwright') and self.playwright:
            try:
                self.playwright.stop()
            except Exception:
                pass
