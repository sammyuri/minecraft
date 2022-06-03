#Use to create local host
import http.server
import socketserver

print("starting server...")

PORT = 1337

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
      ".js": "application/javascript",
});

httpd = socketserver.TCPServer(("", PORT), Handler)
print("server started")
httpd.serve_forever()