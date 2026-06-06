import { createServer, request as httpRequest } from 'http';
import { readFile }       from 'fs/promises';
import { extname, join }  from 'path';
import { networkInterfaces } from 'os';
import { fileURLToPath }  from 'url';
import { dirname }        from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────
const PORT       = 3000;
const API_TARGET = process.env.API_URL || 'http://192.168.1.61:8000';   // DGX Spark
// ────────────────────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.mjs':  'text/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.webmanifest': 'application/manifest+json',
};

// ── API proxy ────────────────────────────────────────────────────────
function proxyAPI(req, res) {
  const target = new URL(API_TARGET);
  const options = {
    hostname: target.hostname,
    port:     target.port || 80,
    path:     req.url,          // preserves /api/... + query string
    method:   req.method,
    headers:  {
      ...req.headers,
      host: target.host,
    },
  };

  const proxy = httpRequest(options, (proxyRes) => {
    // Pass CORS headers so any origin can call the API through this proxy
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    proxyRes.pipe(res);
  });

  proxy.on('error', (err) => {
    console.error(`\x1b[31m✗ DGX Spark unreachable: ${err.message}\x1b[0m`);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Cannot reach DGX Spark backend',
      target: API_TARGET,
      hint:  `Make sure your DGX Spark is on and the backend is running on ${API_TARGET}`,
    }));
  });

  req.pipe(proxy);
}

// ── Static file server ───────────────────────────────────────────────
async function serveFile(req, res) {
  let pathname = decodeURIComponent(req.url.split('?')[0]);
  if (pathname === '/') pathname = '/index.html';

  const filePath    = join(__dirname, pathname);
  const ext         = extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  try {
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type':  contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 – File not found');
  }
}

// ── Main server ──────────────────────────────────────────────────────
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(req.url.split('?')[0]);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // Route /api/* → DGX Spark proxy
  if (pathname.startsWith('/api/')) {
    proxyAPI(req, res);
    return;
  }

  // Everything else → static files
  serveFile(req, res);
});

function getLocalIP() {
  const nets = networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('\n\x1b[34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('\x1b[1m\x1b[36m  ChaseTrackr\x1b[0m \x1b[37m— website + app proxy 🚀\x1b[0m');
  console.log('\x1b[34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
  console.log(`  \x1b[90mWebsite:  \x1b[0m  \x1b[1mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`  \x1b[90mApp:      \x1b[0m  \x1b[1mhttp://localhost:${PORT}/app.html\x1b[0m`);
  console.log(`  \x1b[90mNetwork:  \x1b[0m  \x1b[1m\x1b[33mhttp://${ip}:${PORT}\x1b[0m`);
  console.log(`  \x1b[90mDGX API:  \x1b[0m  \x1b[32m${API_TARGET}\x1b[0m  (proxied at /api/*)\x1b[0m`);

  console.log('\n\x1b[90m  ── Share outside your Wi-Fi ──\x1b[0m');
  console.log('  \x1b[90mRun this in a new terminal tab:\x1b[0m');
  console.log('  \x1b[1m  npx cloudflared tunnel --url http://localhost:3000\x1b[0m');
  console.log('  \x1b[90m  → paste the https://xxx.trycloudflare.com URL to anyone\x1b[0m');
  console.log('\n  \x1b[90m  Or use your existing Kenji public URL if it points here.\x1b[0m');
  console.log('\n  \x1b[90mPress Ctrl+C to stop\x1b[0m\n');
});
