// Run: node --test apps/dash/test/kv-binding.test.mjs
// v1.2.3: the live Pages project gershon-dash binds the KV namespace as DASH_KV,
// while the code used to read env.BOARD only -> the board never loaded. These
// tests run with ONLY DASH_KV bound (no BOARD) and check every KV path.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { boardKV, listWeeks } from '../src/worker.js';
import { run } from '../../dash-cron/src/index.js';
import { renderBoard, VERSION } from '../src/render.js';
import { currentIsoWeek } from '../src/collect.js';
import { sampleSnapshot } from './sample-snapshot.mjs';

const memKV = (init = {}) => {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, JSON.stringify(v)]));
  return { m, async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, async put(k, v) { m.set(k, v); },
    async list({ prefix = '' } = {}) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }; } };
};
const quiet = async fn => { const w = console.warn, l = console.log, e = console.error; console.warn = console.log = console.error = () => {}; try { return await fn(); } finally { console.warn = w; console.log = l; console.error = e; } };
const offline = { fetchImpl: async () => { throw new Error('offline'); } };

test('boardKV picks DASH_KV, falls back to BOARD, and names both when neither is bound', () => {
  const a = memKV(), b = memKV();
  assert.equal(boardKV({ DASH_KV: a }), a);
  assert.equal(boardKV({ BOARD: b }), b);
  assert.equal(boardKV({ DASH_KV: a, BOARD: b }), a, 'DASH_KV (the live binding) wins');
  assert.throws(() => boardKV({}), /DASH_KV \(or BOARD\)/);
});

test('with only DASH_KV bound: home, week page, week list and /api/health all read the stored board', async () => {
  const cur = currentIsoWeek(new Date());
  const DASH_KV = memKV({
    index: [{ week: cur.week }, { week: '2026-W42' }],
    [`snap:${cur.week}`]: { ...sampleSnapshot, week: cur.week, start: cur.start, end: cur.end, generatedAt: new Date().toISOString() },
    'snap:2026-W42': { ...sampleSnapshot },
  });
  const env = { DASH_KV };
  const ctx = { waitUntil: () => {} };
  const get = path => worker.fetch(new Request('https://dash.gershoncrm.com' + path), env, ctx);

  const home = await get('/');
  assert.equal(home.status, 200);
  const page = await home.text();
  assert.ok(page.includes(`Weekly Board · ${cur.week}`));
  assert.ok(!page.includes('being prepared'), 'the stored current week is found');

  const old = await get('/w/2026-W42');
  assert.equal(old.status, 200);
  assert.ok((await old.text()).includes('Weekly Board · 2026-W42'));

  const weeks = await listWeeks(env);
  assert.deepEqual(weeks.map(w => w.week), [cur.week, '2026-W42']);

  const h = await get('/api/health');
  assert.equal(h.status, 200);
  assert.deepEqual(await h.json(), { ok: true, app: 'dash', version: VERSION, latest_week: cur.week });
});

test('with only DASH_KV bound: self-heal and the Monday cron write into DASH_KV', async () => {
  const DASH_KV = memKV({ 'snap:2026-W42': { ...sampleSnapshot }, index: [{ week: '2026-W42' }] });
  const waits = [];
  await quiet(async () => {
    await worker.fetch(new Request('https://dash.gershoncrm.com/'), { DASH_KV }, { waitUntil: p => waits.push(p) });
    await Promise.all(waits);
  });
  assert.ok(DASH_KV.m.has('refresh-lock'), 'self-heal took its lock in DASH_KV');
  assert.ok(DASH_KV.m.has(`snap:${currentIsoWeek(new Date()).week}`), 'self-heal stored the current week in DASH_KV');

  const K2 = memKV();
  const snap = await quiet(() => run({ DASH_KV: K2 }, Date.parse('2026-11-16T12:15:00Z'), offline));
  assert.equal(snap.week, '2026-W47');
  assert.ok(K2.m.has('snap:2026-W47'));
  assert.equal(JSON.parse(K2.m.get('last-refresh')).week, '2026-W47');
  assert.equal(JSON.parse(K2.m.get('index'))[0].week, '2026-W47');
});

test('no KV bound at all: health says 503, cron fails loudly with the binding names', async () => {
  const r = await quiet(() => worker.fetch(new Request('https://dash.gershoncrm.com/api/health'), {}, { waitUntil: () => {} }));
  assert.equal(r.status, 503);
  assert.equal((await r.json()).ok, false);
  await assert.rejects(() => run({}, Date.parse('2026-11-16T12:15:00Z'), offline), /DASH_KV \(or BOARD\)/);
});

test('an archived week page says "Report:", only the home page says "Latest report:"', () => {
  const archive = renderBoard(sampleSnapshot, [], new Date('2026-11-16T12:00:00Z'));
  assert.ok(archive.includes('Report: <b>2026-W42</b>'));
  assert.ok(!archive.includes('Latest report:'));
  const home = renderBoard(sampleSnapshot, [], new Date('2026-10-23T12:00:00Z'), { expectedWeek: '2026-W42' });
  assert.ok(home.includes('Latest report: <b>2026-W42</b>'));
});
