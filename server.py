import http.server
import threading
import os
import time
import json
from pathlib import Path

WATCH_DIR = Path(__file__).parent
EXTENSIONS = {'.html', '.js', '.css'}
PORT = 8080

# Track file modification times
file_mtimes = {}
clients = []
clients_lock = threading.Lock()

def get_mtimes():
    mtimes = {}
    for f in WATCH_DIR.iterdir():
        if f.suffix in EXTENSIONS:
            try:
                mtimes[str(f)] = f.stat().st_mtime
            except:
                pass
    return mtimes

def watch_files():
    global file_mtimes
    file_mtimes = get_mtimes()
    while True:
        time.sleep(0.5)
        current = get_mtimes()
        if current != file_mtimes:
            file_mtimes = current
            notify_clients()

def notify_clients():
    with clients_lock:
        dead = []
        for wfile in clients:
            try:
                wfile.write(b'data: reload\n\n')
                wfile.flush()
            except:
                dead.append(wfile)
        for d in dead:
            clients.remove(d)

LIVERELOAD_SCRIPT = b'''
<script>
(function() {
  const es = new EventSource('/__livereload');
  es.onmessage = () => location.reload();
  es.onerror = () => setTimeout(() => location.reload(), 2000);
})();
</script>
'''

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WATCH_DIR), **kwargs)

    def do_GET(self):
        if self.path == '/__livereload':
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            with clients_lock:
                clients.append(self.wfile)
            try:
                while True:
                    time.sleep(1)
            except:
                with clients_lock:
                    if self.wfile in clients:
                        clients.remove(self.wfile)
            return

        # Inject livereload script into HTML responses
        if self.path.endswith('.html') or self.path == '/':
            path = WATCH_DIR / self.path.lstrip('/')
            if not path.exists():
                path = WATCH_DIR / 'snake.html'
            try:
                content = path.read_bytes()
                content = content.replace(b'</body>', LIVERELOAD_SCRIPT + b'</body>')
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
                return
            except:
                pass

        super().do_GET()

    def log_message(self, format, *args):
        pass  # Suppress logs

if __name__ == '__main__':
    watcher = threading.Thread(target=watch_files, daemon=True)
    watcher.start()

    server = http.server.HTTPServer(('localhost', PORT), Handler)
    print(f'Server avviato su http://localhost:{PORT}/snake.html')
    print('Live reload attivo — salva un file per aggiornare il browser.')
    print('Premi Ctrl+C per fermare.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer fermato.')
