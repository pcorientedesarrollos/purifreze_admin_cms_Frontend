import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./browser/', import.meta.url));
const port = Number(process.env.PORT ?? 3000);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

async function resolveFile(pathname) {
  const relativePath = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  const candidate = join(root, relativePath);
  if (!candidate.startsWith(root)) return join(root, 'index.html');

  try {
    return (await stat(candidate)).isFile() ? candidate : join(root, 'index.html');
  } catch {
    return join(root, 'index.html');
  }
}

createServer(async (request, response) => {
  try {
    const file = await resolveFile(new URL(request.url ?? '/', 'http://localhost').pathname);
    response.writeHead(200, {
      'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      'Content-Type': mimeTypes[extname(file)] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(500);
    response.end('Internal server error');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Admin frontend listening on port ${port}`);
});
