#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8092
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class LaxouRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_POST(self):
        if self.path == '/api/save':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode('utf-8'))

                if not payload or not isinstance(payload, dict) or 'places' not in payload:
                    self._send_json({'error': 'Format de données invalide'}, status=400)
                    return

                # Write data.json
                data_json_path = os.path.join(BASE_DIR, 'data.json')
                with open(data_json_path, 'w', encoding='utf-8') as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)

                # Write js/data.js
                data_js_path = os.path.join(BASE_DIR, 'js', 'data.js')
                with open(data_js_path, 'w', encoding='utf-8') as f:
                    f.write(f"window.LAXOU_NPRNU_DATA = {json.dumps(payload, ensure_ascii=False, indent=2)};\n")

                print(f"[SERVER] Successfully saved {len(payload.get('places', []))} places to data.json and js/data.js")
                self._send_json({
                    'success': True, 
                    'message': f"Modifications enregistrées sur le disque ({len(payload.get('places', []))} projets)."
                })
            except Exception as e:
                print(f"[SERVER ERROR] {e}")
                self._send_json({'error': str(e)}, status=500)
        else:
            self.send_error(404, "Endpoint non trouvé")

    def _send_json(self, data, status=200):
        response_bytes = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), LaxouRequestHandler) as httpd:
        print(f"[SERVER] Serveur Laxou actif sur http://localhost:{PORT}")
        httpd.serve_forever()
