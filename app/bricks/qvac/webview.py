import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

def start_webview(runtime_url, host, port, sensor_provider=None):
    class Handler(BaseHTTPRequestHandler):
        def reply(self, status, body, content_type='application/json'):
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)

        def json_reply(self, status, data):
            return self.reply(status, json.dumps(data).encode())

        def forward(self):
            if self.command == 'GET' and self.path == '/live':
                reading = sensor_provider.snapshot() if sensor_provider else {'available': False, 'error': 'Live sensor is not configured.'}
                return self.json_reply(200 if reading.get('available') else 503, reading)
            body = None
            if self.command == 'POST':
                if self.path not in ('/sensor', '/complete'):
                    return self.reply(404, b'{"error":"Route not found."}')
                try:
                    length = int(self.headers.get('Content-Length', '0'))
                except ValueError:
                    return self.reply(400, b'{"error":"Invalid request size."}')
                if not 0 < length <= 8192:
                    return self.reply(413, b'{"error":"Request is empty or too large."}')
                body = self.rfile.read(length)
                if self.path == '/sensor':
                    try:
                        payload = json.loads(body)
                    except (ValueError, UnicodeDecodeError):
                        return self.json_reply(400, {'error': 'Send a JSON object.'})
                    if not isinstance(payload, dict):
                        return self.json_reply(400, {'error': 'Send a JSON object.'})
                    if payload.get('source') == 'live':
                        reading = sensor_provider.snapshot() if sensor_provider else {'available': False, 'error': 'Live sensor is not configured.'}
                        if not reading.get('available'):
                            return self.json_reply(503, reading)
                        body = json.dumps(reading).encode()
            request = Request(runtime_url + self.path, data=body, method=self.command,
                              headers={'Content-Type': 'application/json'})
            try:
                with urlopen(request, timeout=180) as response:
                    self.reply(response.status, response.read(), response.headers.get_content_type())
            except HTTPError as error:
                self.reply(error.code, error.read(), error.headers.get_content_type())
            except (URLError, TimeoutError):
                self.reply(503, json.dumps({'error': 'Local QVAC is not ready. Try again shortly.'}).encode())
        do_GET = forward
        do_POST = forward
    server = ThreadingHTTPServer((host, port), Handler)
    Thread(target=server.serve_forever, daemon=True).start()
    return server
