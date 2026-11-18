import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def start_webview(runtime_url, host, port):
    class Handler(BaseHTTPRequestHandler):
        def reply(self, status, body, content_type="application/json"):
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def forward(self):
            body = None
            if self.command == "POST":
                if self.path not in ("/sensor", "/complete"):
                    return self.reply(404, b'{"error":"Route not found."}')
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                except ValueError:
                    return self.reply(400, b'{"error":"Invalid request size."}')
                if not 0 < length <= 8192:
                    return self.reply(413, b'{"error":"Request is empty or too large."}')
                body = self.rfile.read(length)
            request = Request(runtime_url + self.path, data=body, method=self.command,
                              headers={"Content-Type": "application/json"})
            try:
                with urlopen(request, timeout=180) as response:
                    self.reply(response.status, response.read(), response.headers.get_content_type())
            except HTTPError as error:
                self.reply(error.code, error.read(), error.headers.get_content_type())
            except (URLError, TimeoutError):
                self.reply(503, json.dumps({"error": "Local QVAC is not ready. Try again shortly."}).encode())

        do_GET = forward
        do_POST = forward

    server = ThreadingHTTPServer((host, port), Handler)
    Thread(target=server.serve_forever, daemon=True).start()
    return server
