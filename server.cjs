const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, 'dist');
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function resolveFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  if (decoded.includes('\0')) return null;
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const filePath = path.resolve(root, relative);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) return null;
  return filePath;
}

function isNavigationRequest(request, pathname) {
  const acceptsHtml = String(request.headers.accept || '').includes('text/html');
  return request.method === 'GET' && acceptsHtml && !path.extname(pathname);
}

function cacheControl(pathname, isFallback) {
  if (isFallback || pathname === '/' || pathname === '/index.html' || pathname === '/sw.js' || pathname === '/manifest.json' || pathname === '/manifest.webmanifest') {
    return 'no-cache, no-store, must-revalidate';
  }
  if (pathname.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable';
  }
  return 'public, max-age=86400, must-revalidate';
}

async function handle(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }

  const requestUrl = new URL(request.url || '/', 'http://localhost');
  let filePath = resolveFile(requestUrl.pathname);
  let isFallback = false;

  try {
    const stat = filePath ? await fs.stat(filePath) : null;
    if (!stat || !stat.isFile()) {
      if (!isNavigationRequest(request, requestUrl.pathname)) {
        response.writeHead(404, {
          'Cache-Control': 'no-store',
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        });
        response.end('Not found');
        return;
      }
      filePath = path.join(root, 'index.html');
      isFallback = true;
    }

    const body = await fs.readFile(filePath);
    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    response.writeHead(200, {
      'Cache-Control': cacheControl(requestUrl.pathname, isFallback),
      'Content-Length': body.byteLength,
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method !== 'HEAD') response.end(body);
    else response.end();
  } catch {
    response.writeHead(500, {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end('Internal server error');
  }
}

http.createServer((request, response) => {
  handle(request, response);
}).listen(port, '0.0.0.0', () => {
  console.log(`Financia server listening on ${port}`);
});
