#!/usr/bin/env node
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const DIR  = join(fileURLToPath(import.meta.url), '../../gh-pages');
const PORT = parseInt(process.env.PORT || '3001', 10);

const MIME = {
  '.html': 'text/html',  '.css': 'text/css',
  '.js': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png',  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '': 'text/plain',
};

createServer(async (req, res) => {
  let p = join(DIR, req.url.split('?')[0]);
  try {
    const s = await stat(p);
    if (s.isDirectory()) p = join(p, 'index.html');
  } catch {
    p = join(DIR, 'index.html'); // SPA fallback
  }
  try {
    const body = await readFile(p);
    const ext  = extname(p);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(PORT, () => console.log(`Docs at http://localhost:${PORT}`));
