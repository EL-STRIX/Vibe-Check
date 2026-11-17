// server.js - Zero-dependency Local Dev Server
// Runs both the static frontend and the /api/vibe serverless function locally.
import http from 'http';
import fs from 'fs';
import path from 'path';
import handler from './api/vibe.js';

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);

  // Route serverless API requests
  if (urlObj.pathname === '/api/vibe') {
    return handler(req, res);
  }

  // Serve static files
  let reqPath = urlObj.pathname;
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(process.cwd(), reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(` ✨ GitHub Vibe Check is running locally!`);
  console.log(` 🌐 Open in browser: http://localhost:${PORT}`);
  console.log(`==============================================\n`);
});
