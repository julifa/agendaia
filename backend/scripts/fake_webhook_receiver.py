"""Receptor HTTP mínimo para probar app/services/notifications.py de verdad.

No es parte del proyecto: es una herramienta de una sola vez para confirmar
que el backend efectivamente hace el POST con el payload esperado. Loguea
cada request a stdout como JSON de una línea.
"""

import json
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            payload = {"_raw": body.decode(errors="replace")}
        print("WEBHOOK_RECEIVED " + json.dumps(payload), flush=True)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"ok": true}')

    def log_message(self, format, *args):
        pass  # silencia el log de acceso default, ya logueamos arriba


if __name__ == "__main__":
    HTTPServer(("127.0.0.1", 9099), Handler).serve_forever()
