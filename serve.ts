// Black Friday Beacon — a tiny static server for local testing only.
// Serves app/ on http://localhost:8080 (or --port <n>). Node 22 stdlib only.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const portArg = process.argv.indexOf('--port');
const port = portArg === -1 ? 8080 : Number(process.argv[portArg + 1]) || 8080;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const file = resolve(join(appDir, path.endsWith('/') ? path + 'index.html' : path));
  if (!file.startsWith(appDir)) return res.writeHead(403).end('forbidden');
  let size;
  try {
    const st = statSync(file);
    if (!st.isFile()) throw new Error('not a file');
    size = st.size;
  } catch {
    return res.writeHead(404).end('not found');
  }
  res.writeHead(200, {
    'content-type': types[extname(file)] ?? 'application/octet-stream',
    'content-length': size,
  });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`app/ is on http://localhost:${port}`));
