import http.server
import socketserver
import urllib.parse
import json


class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
        super().end_headers()

    def do_POST(self):
        if self.path == '/hello':
            # Handle POST request to /hello
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            # Process post_data here
            # ...
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Success')
        else:
            # Handle POST request to other paths
            super().do_POST()

    def do_GET(self):
        global SIGNAL
        print(self.path)
        if self.path == '/hello':
            # Handle GET request to /hello
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Hello, world!')
        elif self.path == '/getData':
            with open('../data/steps_with_id.json', 'r') as fin:
                data = json.load(fin)
            message = json.dumps({'data': data}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Content-length', len(message))
            self.end_headers()
            self.wfile.write(message)

        else:
            # Handle GET request to other paths
            super().do_GET()

# Create a server on port 8000 with our custom handler
with socketserver.TCPServer(("", 8000), CustomHandler) as httpd:
    print("Serving at port", 8000)
    httpd.serve_forever()