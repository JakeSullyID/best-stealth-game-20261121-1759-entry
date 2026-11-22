import { createServer } from 'node:http';
import { readFile } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const PORT = 8080;
const PUBLIC_DIR = resolve(process.cwd(), 'game');

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = createServer((req, res) => {
    const parsedUrl = new URL(req.url || '/', 'http://localhost');
    let urlPath = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname;
    // sanitize path
    const safePath = resolve(PUBLIC_DIR, '.' + urlPath);
    if (!safePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    readFile(safePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }

        const ext = extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`SHADOW VAULT dev server running at http://localhost:${PORT}`);
});
