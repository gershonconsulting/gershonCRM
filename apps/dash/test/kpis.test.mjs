// Run: node --test apps/dash/test/kpis.test.mjs
// 2026-11-12 nightly: honest KPIs (no data is never "on track"), "x of 5
// platforms reporting", readable "token missing" note, empty-week state + 404.
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBoard, renderMissing, summarise, reportingLine, notConnectedNote, friendlyErrors } from '../src/render.js';
import { collectWeek, currentIsoWeek } from '../src/collect.js';
import worker from '../src/worker.js';
import { sampleSnapshot } from './sample-snapshot.mjs';

const quiet = async fn => { const w = console.warn, l = console.log; console.warn = () => {}; console.log = () => {}; try { return await fn(); } finally { console.warn = w; console.log = l; } };
const memKV = (init = {}) => {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, JSON.stringify(v)]));
  return { m, async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, async put(k, v) { m.set(k, v); },
    async list({ prefix = '' } = {}) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }; } };
};
const NOW = new Date('2026-11-12T03:00:00Z');   // Thursday, 2026-W46
const ctx = { waitUntil: () => {} };

// Live W45 situation: 0 of 5 connected but the old page said "5 on track".
const w45 = {
  week: '2026-W45', start: '2026-11-02', end: '2026-11-08', generatedAt: '2026-11-10T03:10:23Z',
  platforms: ['client', 'social', 'linalysis', 'finance', 'nexashare'].map(id => ({ id, name: id, host: id + '.example', status: 'not_connected',
    metrics: [{ label: 'Service', value: 'ok', tone: 'green' }] })),
};

test('no-data platforms are never on track; scoreboard says "0 of 5 platforms reporting"', () => {
  const s = summarise(w45);
  assert.deepEqual([s.green, s.amber, s.red, s.nodata, s.reporting], [0, 0, 0, 5, 0]);
  assert.equal(reportingLine(w45).text, '0 of 5 platforms reporting');
  const page = renderBoard(w45, [], NOW);
  assert.match(page, /<b>0 of 5<\/b><span>platforms reporting<\/span>/);
  assert.match(page, /<span class="kn">0<small> \/ 5<\/small><\/span><span class="kl">On track/);
  assert.match(page, /<span class="kn">5<small> \/ 5<\/small><\/span><span class="kl">No data/);
  assert.equal((page.match(/<span class="status off">No data<\/span>/g) || []).length, 5, 'every tile shows a grey "No data" badge');
  assert.ok(!page.includes('<span class="status on">'));
  assert.ok(!/class="dot green"><\/span>(client|social)/.test(page), 'no green dot on a platform without data');
});

test('connected platform with only empty figures is "No data", not reporting', () => {
  const snap = { ...w45, platforms: [{ id: 'finance', name: 'Finance', host: 'f', status: 'connected', metrics: [{ label: 'Paid', value: null, tone: 'green' }, { label: 'Open', value: '', tone: 'green' }] }] };
  const s = summarise(snap);
  assert.equal(s.green, 0); assert.equal(s.nodata, 1);
  assert.equal(reportingLine(snap).text, '0 of 1 platforms reporting');
});

test('sample week: 2 of 5 reporting (Social + Finance), 3 grey "No data"', () => {
  assert.equal(reportingLine(sampleSnapshot).text, '2 of 5 platforms reporting');
  const page = renderBoard(sampleSnapshot, [], NOW);
  assert.equal((page.match(/<span class="status on">Reporting<\/span>/g) || []).length, 2);
  assert.equal((page.match(/<span class="status off">No data<\/span>/g) || []).length, 3);
});

test('missing finance token reads "Finance not connected (token missing)", never the raw error', async () => {
  const snap = await quiet(() => collectWeek({}, currentIsoWeek(NOW), { fetchImpl: async () => { throw new Error('x'); } }));
  const fin = snap.platforms.find(p => p.id === 'finance');
  assert.equal(fin.reason, 'token_missing');
  assert.ok(!JSON.stringify(snap).includes('FINANCE_TOKEN'));
  assert.equal(notConnectedNote(fin), 'Finance not connected (token missing)');
  const page = renderBoard(snap, [], NOW);
  assert.ok(page.includes('Finance not connected (token missing)'));
  // old live snapshots stored the raw error text
  assert.equal(friendlyErrors('Missing secret FINANCE_TOKEN'), 'Finance not connected (token missing)');
  assert.equal(friendlyErrors('Missing secret(s): LINALYSIS_TOKEN'), 'Linalysis not connected (token missing)');
  const old = { ...w45, platforms: [{ id: 'finance', name: 'Finance', host: 'f', status: 'connected', sourceNote: 'Missing secret FINANCE_TOKEN', metrics: [] }] };
  const p2 = renderBoard(old, [], NOW);
  assert.ok(p2.includes('Finance not connected (token missing)'));
  assert.ok(!/missing secret/i.test(p2) && !p2.includes('FINANCE_TOKEN'));
});

test('a week with no stored data: 404 + "No data stored for W43 yet" (W43, W44, W46)', async () => {
  const BOARD = memKV({ index: [{ week: '2026-W45' }], 'snap:2026-W45': w45, 'refresh-lock': 'x' });
  for (const wk of ['2026-W43', '2026-W44', '2026-W46']) {
    const r = await worker.fetch(new Request(`https://dash.gershoncrm.com/w/${wk}`), { BOARD }, ctx);
    assert.equal(r.status, 404, wk);
    const page = await r.text();
    assert.ok(page.includes(`No data stored for ${wk.slice(5)} yet`), wk);
    assert.ok(!page.includes('class="kpis"'), 'no scoreboard on an empty week');
    assert.ok(page.includes('href="/w/2026-W45"'), 'stored weeks stay reachable');
  }
  assert.ok(!BOARD.m.has('snap:2026-W43'), 'visiting does not create the week');
  const html = renderMissing('2026-W43', []);
  assert.ok(html.includes('19 – 25 Oct 2026'));
});

test('stored placeholder without platforms is treated as no data (404)', async () => {
  const BOARD = memKV({ 'snap:2026-W44': { week: '2026-W44', placeholder: 'never generated' }, 'refresh-lock': 'x' });
  const r = await worker.fetch(new Request('https://dash.gershoncrm.com/w/2026-W44'), { BOARD }, ctx);
  assert.equal(r.status, 404);
  assert.ok((await r.text()).includes('No data stored for W44 yet'));
});
