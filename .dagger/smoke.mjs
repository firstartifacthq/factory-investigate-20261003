import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { inventory } from '../inventory.mjs';

const server = spawn(process.execPath, ['server.mjs'], { stdio: 'inherit' });
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(server.exitCode, null, 'Server exited before readiness');
    assert.equal(server.signalCode, null, 'Server was terminated before readiness');
    try {
      const response = await fetch('http://127.0.0.1:3000/health', { signal: AbortSignal.timeout(1000) });
      if (response.ok) {
        assert.deepEqual(await response.json(), { status: 'ready' });
        ready = true;
        break;
      }
    } catch {
      // Startup may not have bound the port yet; retry within the fixed deadline.
    }
    await setTimeout(100);
  }
  assert.ok(ready, 'Server did not become ready');
  const page = await fetch('http://127.0.0.1:3000/');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /^text\/html/);
  assert.equal(await page.text(), await readFile('index.html', 'utf8'));
  const api = await fetch('http://127.0.0.1:3000/api/inventory');
  assert.equal(api.status, 200);
  assert.match(api.headers.get('content-type'), /^application\/json/);
  assert.deepEqual(await api.json(), inventory);
  const missing = await fetch('http://127.0.0.1:3000/missing');
  assert.equal(missing.status, 404);
} finally {
  if (server.exitCode === null && server.signalCode === null) {
    const stopped = new Promise(resolve => server.once('exit', resolve));
    server.kill('SIGTERM');
    await stopped;
  }
}
