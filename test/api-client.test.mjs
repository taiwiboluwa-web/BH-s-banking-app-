import test from 'node:test';
import assert from 'node:assert/strict';

const { createApi } = await import('../src/api.js');

test('api client returns JSON under the data contract', async () => {
  const calls = [];
  const api = createApi(async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, user: { id: 'u1' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  const result = await api.post('/api/auth/me', { sessionToken: 'test-token' });

  assert.deepEqual(result.data, { ok: true, user: { id: 'u1' } });
  assert.equal(calls[0].input, '/api/auth/me');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
});

test('api client exposes server error messages', async () => {
  const api = createApi(async () => new Response(JSON.stringify({ error: 'Neon database is not configured' }), {
    status: 503,
    headers: { 'content-type': 'application/json' },
  }));

  await assert.rejects(() => api.post('/api/auth/signup', {}), {
    message: 'Neon database is not configured',
  });
});
