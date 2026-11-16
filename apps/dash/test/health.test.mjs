// Run: node --test apps/dash/test/health.test.mjs
// v1.2.2: /api/health JSON status and /w, /w/ redirect to the home page.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import { VERSION } from '../src/render.js';
import { sampleSnapshot } from './sample-snapshot.mjs';

const memKV = (init = {}) => {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, JSON.stringify(v)]));
  return { m, async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, async put(k, v) { m.set(k, v); },
    async list({ prefix = '' } = {}) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }; } };
};
const waits = [];
const ctx = { waitUntil: p => waits.push(p) };
const get = (BOARD, path, method = 'GET') => worker.fetch(new Request('https://dash.gershoncrm.com' + path, { method }), { BOARD }, ctx);

test('/api/health returns {ok, app, version, latest_week} as JSON and does not self-heal', async () => {
  const BOARD = memKV({ index: [{ week: '2026-W45' }, { week: '2026-W42' }], 'snap:2026-W45': { ...sampleSnapshot, week: '2026-W45' }, 'snap:2026-W42': { ...sampleSnapshot } });
  const r = await get(BOARD, '/api/health');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /^application\/json/);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await r.json(), { ok: true, app: 'dash', version: VERSION, latest_week: '2026-W45' });
  assert.equal(VERSION, '1.2.3');
  assert.equal(waits.length, 0, 'health must not start a background build');
  assert.ok(!BOARD.m.has('refresh-lock'));
  assert.equal((await get(BOARD, '/api/health/')).status, 200);
  assert.equal((await get(BOARD, '/api/health', 'HEAD')).status, 200);
});

test('/api/health with nothing stored: ok, latest_week null (current unbuilt week is not "latest")', async () => {
  const r = await get(memKV(), '/api/health');
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, app: 'dash', version: '1.2.3', latest_week: null });
});

test('/api/health reports 503 {ok:false} when KV fails', async () => {
  const BOARD = { async get() { throw new Error('kv down'); } };
  const e = console.error; console.error = () => {};
  const r = await get(BOARD, '/api/health');
  console.error = e;
  assert.equal(r.status, 503);
  const b = await r.json();
  assert.equal(b.ok, false); assert.equal(b.app, 'dash');
});

test('/w and /w/ redirect to the home page (no 404); other paths still 404', async () => {
  const BOARD = memKV({ index: [{ week: '2026-W42' }], 'snap:2026-W42': { ...sampleSnapshot }, 'refresh-lock': 'x' });
  for (const p of ['/w', '/w/']) {
    const r = await get(BOARD, p);
    assert.equal(r.status, 302, p);
    assert.equal(r.headers.get('location'), '/', p);
  }
  assert.equal((await get(BOARD, '/nope')).status, 404);
  assert.equal((await get(BOARD, '/w/2026-W42')).status, 200);
  assert.equal((await get(BOARD, '/w/2026-W30')).status, 404);
});
