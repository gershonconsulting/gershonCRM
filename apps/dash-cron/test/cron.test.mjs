// Run: node --test apps/dash-cron/test/cron.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import cron, { run } from '../src/index.js';

function memKV(init = {}) {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, JSON.stringify(v)]));
  return { m, async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, async put(k, v) { m.set(k, v); } };
}
const quiet = async fn => { const w = console.warn, l = console.log; console.warn = () => {}; console.log = () => {}; try { return await fn(); } finally { console.warn = w; console.log = l; } };
const offline = { fetchImpl: async () => { throw new Error('offline'); } };

test('wrangler.toml schedules Monday 12:15 UTC and binds the board KV', () => {
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  assert.match(toml, /^name = "gershon-dash-cron"$/m);
  assert.match(toml, /^crons = \["15 12 \* \* 1"\]$/m);
  assert.match(toml, /binding = "BOARD"/);
  assert.doesNotMatch(toml, /TOKEN\s*=|PASSWORD\s*=/, 'no secret values in the file');
});

test('Monday run creates the current ISO week board (no secrets -> "not connected", no invented figures)', async () => {
  const BOARD = memKV({ index: [{ week: '2026-W42', range: '12 – 18 Oct 2026' }] });
  const snap = await quiet(() => run({ BOARD }, Date.parse('2026-11-02T12:15:00Z'), offline));
  assert.equal(snap.week, '2026-W45');
  assert.equal(snap.start, '2026-11-02');
  assert.equal(snap.end, '2026-11-08');
  assert.ok(snap.platforms.every(p => p.status === 'not_connected' && p.metrics.length === 0));
  const index = JSON.parse(BOARD.m.get('index'));
  assert.deepEqual(index.map(w => w.week), ['2026-W45', '2026-W42']);
  assert.ok(BOARD.m.has('snap:2026-W45'));
  assert.equal(JSON.parse(BOARD.m.get('last-refresh')).week, '2026-W45');
});

test('a second run in the same week refreshes, not duplicates', async () => {
  const BOARD = memKV();
  await quiet(() => run({ BOARD }, Date.parse('2026-10-26T12:15:00Z'), offline));
  const first = JSON.parse(BOARD.m.get('snap:2026-W44')).generatedAt;
  await new Promise(r => setTimeout(r, 5));
  await quiet(() => run({ BOARD }, Date.parse('2026-10-28T09:00:00Z'), offline));
  const index = JSON.parse(BOARD.m.get('index'));
  assert.deepEqual(index.map(w => w.week), ['2026-W44']);
  assert.notEqual(JSON.parse(BOARD.m.get('snap:2026-W44')).generatedAt, first);
});

test('scheduled() hands the job to waitUntil; fetch() never builds a board', async () => {
  const BOARD = memKV();
  const waits = [];
  await quiet(async () => {
    await cron.scheduled({ scheduledTime: Date.parse('2026-11-02T12:15:00Z') }, { BOARD }, { waitUntil: p => waits.push(p) });
    await Promise.all(waits);
  });
  assert.equal(waits.length, 1);
  assert.ok(BOARD.m.has('snap:2026-W45'));
  const B2 = memKV();
  const r = await cron.fetch(new Request('https://x/'), { BOARD: B2 });
  assert.equal(r.status, 200);
  assert.equal(B2.m.size, 0);
});
