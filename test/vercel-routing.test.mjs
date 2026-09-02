import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Vercel SPA fallback never rewrites API routes', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.equal(config.rewrites.length, 1);
  assert.match(config.rewrites[0].source, /api/);
  assert.equal(config.rewrites[0].destination, '/index.html');
  assert.ok(!config.rewrites.some((rule) => rule.source === '/api/:path*'));
});
