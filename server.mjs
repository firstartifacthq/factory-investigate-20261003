import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { inventory } from './inventory.mjs';
const html = await readFile(new URL('./index.html', import.meta.url));
createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/health') { response.writeHead(200, { 'content-type': 'application/json' }); response.end('{"status":"ready"}'); }
  else if (path === '/api/inventory') { response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify(inventory)); }
  else if (path === '/') { response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); response.end(html); }
  else { response.writeHead(404); response.end('Not found'); }
}).listen(3000, '0.0.0.0', () => console.log('Inventory ready on port 3000'));
