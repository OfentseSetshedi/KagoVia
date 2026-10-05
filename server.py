import http.server
import socketserver
import os

PORT = 3000
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


with Server(("", PORT), NoCacheHandler) as httpd:
    print(f"Serving {ROOT} on http://0.0.0.0:{PORT}")
    httpd.serve_forever()