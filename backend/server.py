import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
import json
import pandas as pd 

from approachGrouping import get_code_position, get_seg_labels

embeddings_df = pd.read_pickle("../data/embeddings_with_segments_large.pkl")

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

        parsed_path = urlparse(self.path)
        query_params = parse_qs(parsed_path.query)

        print(parsed_path.path)
        if parsed_path.path == '/hello':
            # Handle GET request to /hello
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Hello, world!')
        elif parsed_path.path == '/getData':
            with open('../data/steps_with_id.json', 'r') as fin:
                data = json.load(fin)
            message = json.dumps({'data': data}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Content-length', len(message))
            self.end_headers()
            self.wfile.write(message)

        elif parsed_path.path == '/getCodePosition':
            n_clusters = int(query_params['nClusters'][0])
            new_df = get_code_position(n_clusters, embeddings_df)
            new_df = get_seg_labels(15, new_df)
            # print(new_df)
            columns_to_convert = ['code', 'x', 'y', 'cluster', 'segLabels']
            list_of_dicts = new_df[columns_to_convert].to_dict(orient='records')

            message = json.dumps({'data': list_of_dicts}).encode('utf-8')
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