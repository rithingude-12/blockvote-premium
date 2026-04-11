// Minimal Node.js server to serve Vite's dist/ for Render Web Service
// This handles SPA routing (React Router) by serving index.html for all routes

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT    = process.env.PORT || 3000;
const DIST    = path.join(__dirname, 'dist');
const MIMETYPES = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

http.createServer((req, res) => {
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);

  // Safety: strip query string
  filePath = filePath.split('?')[0];

  const ext = path.extname(filePath);
  const contentType = MIMETYPES[ext] || 'text/plain';

  // For any non-asset route (SPA), serve index.html
  if (!ext || !fs.existsSync(filePath)) {
    filePath = path.join(DIST, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
    });
    res.end(data);
  });
}).listen(PORT, () => console.log(`BlockVote frontend running on port ${PORT}`));
