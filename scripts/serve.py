#!/usr/bin/env python3
"""Serve the workshop site locally for preview.

Usage: python3 scripts/serve.py [directory] [port]
Defaults: the repository root on port 4173, then open
http://127.0.0.1:4173 in a browser.

(A plain `python3 -m http.server` works too; this script only exists so
the site can be previewed with one double-click via preview.command.)
"""
import os
import sys

target = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), "..")
port = int(sys.argv[2]) if len(sys.argv) > 2 else 4173
os.chdir(target)

import http.server
import socketserver


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".woff2": "font/woff2",
        ".svg": "image/svg+xml",
        ".json": "application/json",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


with Server(("127.0.0.1", port), Handler) as httpd:
    print(f"Serving {os.getcwd()} at http://127.0.0.1:{port}")
    httpd.serve_forever()
