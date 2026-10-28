// Run: node --test apps/dash/test/dash.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBoard, renderPreparing, VERSION, freshness, connectionLine, summarise, bannerState, scrubSecrets } from '../src/render.js';
import { collectWeek, previousIsoWeek, currentIsoWeek, boardWeek, isoWeekLabel, PLATFORMS } from '../src/collect.js';
import worker from '../src/worker.js';
import { sampleSnapshot, sampleWeeks } from './sample-snapshot.mjs';

const SECRET_NAMES = PLATFORMS.flatMap(p => p.secrets);

test('freshness thresholds: green <= 8 days, orange > 8, red > 15', () => {
  const gen = '2026-10-06T10:24:28Z';
  assert.equal(freshness(gen, new Date('2026-10-14T11:00:00Z')).tone, 'green');   // 8 days
  assert.equal(freshness(gen, new Date('2026-10-15T11:00:00Z')).tone, 'amber');   // 9 days
  assert.equal(freshness(gen, new Date('2026-10-21T11:00:00Z')).tone, 'amber');   // 15 days
  assert.equal(freshness(gen, new Date('2026-10-22T11:00:00Z')).tone, 'red');     // 16 days
  assert.equal(freshness(gen, new Date('2026-10-23T02:00:00Z')).text, 'Generated 6 Oct 2026 · 16 days old');
});

test('ISO weeks', () => {
  assert.equal(isoWeekLabel(new Date('2026-09-28T00:00:00Z')), '2026-W40');
  assert.deepEqual(previousIsoWeek(new Date('2026-10-23T02:00:00Z')), { week: '2026-W42', start: '2026-10-12', end: '2026-10-18' });
  assert.equal(previousIsoWeek(new Date('2027-01-04T06:07:00Z')).week, '2026-W53');
});

test('collector never leaks secret names into the snapshot; page never shows them', async () => {
  const logs = []; const warn = console.warn; console.warn = m => logs.push(m);
  const snap = await collectWeek({}, previousIsoWeek(new Date('2026-10-23')), { fetchImpl: async () => { throw new Error('no'); } });
  console.warn = warn;
  const json = JSON.stringify(snap);
  const page = renderBoard(snap, [], new Date('2026-10-23'));
  for (const s of SECRET_NAMES) {
    assert.ok(!json.includes(s), `snapshot contains ${s}`);
    assert.ok(!page.includes(s), `page contains ${s}`);
  }
  assert.ok(logs.join('\n').includes('LINALYSIS_TOKEN'), 'detail should still go to the Worker logs');
  assert.ok(page.includes('Some platform connections are not set up yet (5 of 5)'));
  assert.ok(!/HTTP \d{3}/.test(page));
});

test('empty figures say "No data" / "Not connected yet", not 0', () => {
  const page = renderBoard(sampleSnapshot, sampleWeeks, new Date('2026-10-23'));
  assert.ok(page.includes('Not connected yet'));
  assert.ok(page.includes('<span class="pill empty">No data</span>'));
  assert.ok(page.includes('Data source: finance.gershoncrm.com'));
  assert.equal(connectionLine(sampleSnapshot).text, 'Some platform connections are not set up yet (3 of 5)');
});

function memKV(init = {}) {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, JSON.stringify(v)]));
  return { m, async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, async put(k, v) { m.set(k, v); } };
}

test('visitors cannot create weeks; stale board self-heals once', async () => {
  const BOARD = memKV({ index: [{ week: '2026-W40' }], 'snap:2026-W40': { ...sampleSnapshot, week: '2026-W40', generatedAt: '2026-10-06T10:24:28Z' } });
  const waits = []; const ctx = { waitUntil: p => waits.push(p) };
  const warn = console.warn, log = console.log; console.warn = () => {}; console.log = () => {};
  const r1 = await worker.fetch(new Request('https://dash.gershoncrm.com/w/2026-W30'), { BOARD }, ctx);
  assert.equal(r1.status, 404);
  assert.equal(r1.headers.get('x-robots-tag'), 'noindex, nofollow');
  await Promise.all(waits);
  console.warn = warn; console.log = log;
  assert.ok(!BOARD.m.has('snap:2026-W30'), 'typing a week URL must not create it');
  assert.ok(BOARD.m.has('refresh-lock'));
  assert.ok([...BOARD.m.keys()].some(k => /^snap:20\d\d-W\d\d$/.test(k) && k !== 'snap:2026-W40'), 'self-heal stored the latest week');
});

test('platforms with no data are counted as "No data", never "On track"', async () => {
  // Same situation as the live W42 board: 0 of 5 connected, health rows marked green.
  const snap = { week: '2026-W42', start: '2026-10-12', end: '2026-10-18', generatedAt: '2026-10-23T02:02:59Z',
    platforms: ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, name: id, host: id + '.example', status: 'not_connected',
      metrics: [{ label: 'Service', value: 'ok', tone: 'green' }] })) };
  const s = summarise(snap);
  assert.equal(s.green, 0);
  assert.equal(s.nodata, 5);
  const page = renderBoard(snap, [], new Date('2026-10-27T02:00:00Z'));
  assert.ok(page.includes('No platform is connected to the board yet'));
  assert.match(page, /<span class="kn">0<small> \/ 5<\/small><\/span><span class="kl">On track/);
  assert.match(page, /<span class="kn">5<small> \/ 5<\/small><\/span><span class="kl">No data/);
  // sample: Social has a red figure, Finance an amber+red one -> 0 green, 0 amber, 2 red, 3 no data
  const t = summarise(sampleSnapshot);
  assert.deepEqual([t.green, t.amber, t.red, t.nodata], [0, 0, 2, 3]);
});

test('banner names the last report week and flags a missing week', () => {
  const snap = { ...sampleSnapshot, generatedAt: '2026-10-23T02:02:59Z' };
  const b = bannerState(snap, new Date('2026-10-27T02:00:00Z'), '2026-W43');
  assert.equal(b.tone, 'amber');
  assert.equal(b.missing, '2026-W43');
  const page = renderBoard(snap, sampleWeeks, new Date('2026-10-27T02:00:00Z'), { expectedWeek: '2026-W43' });
  assert.ok(page.includes('Latest report: <b>2026-W42</b>'));
  assert.ok(page.includes('2026-W43 has not been generated yet.'));
  assert.equal(bannerState(snap, new Date('2026-11-01T03:00:00Z')).tone, 'amber');   // 9 days
  assert.equal(bannerState(snap, new Date('2026-10-25T03:00:00Z'), '2026-W42').tone, 'green');
});

test('old snapshots with secret names in free text are scrubbed', () => {
  const snap = { ...sampleSnapshot, platforms: [{ id: 'x', name: 'Missing secret(s): FINANCE_TOKEN', host: 'h', status: 'connected', sourceNote: 'needs NEXASHARE_TOKEN', metrics: [{ label: 'CLIENT_PASSWORD set', value: 1, tone: 'green' }] }] };
  const page = renderBoard(snap, [], new Date('2026-10-23'));
  for (const s of ['FINANCE_TOKEN', 'NEXASHARE_TOKEN', 'CLIENT_PASSWORD']) assert.ok(!page.includes(s), s);
  assert.equal(scrubSecrets('LINALYSIS_TOKEN and CLIENT_EMAIL'), '[hidden] and [hidden]');
});

// ---- v1.2: current-week board + landing page --------------------------------

test('current ISO week (v1.2 board week)', () => {
  assert.deepEqual(currentIsoWeek(new Date('2026-10-28T09:00:00Z')), { week: '2026-W44', start: '2026-10-26', end: '2026-11-01' });
  assert.deepEqual(currentIsoWeek(new Date('2026-11-02T12:15:00Z')), { week: '2026-W45', start: '2026-11-02', end: '2026-11-08' });
  assert.equal(currentIsoWeek(new Date('2026-11-01T23:59:00Z')).week, '2026-W44');   // Sunday still W44
  assert.equal(currentIsoWeek(new Date('2027-01-01T10:00:00Z')).week, '2026-W53');
  assert.equal(boardWeek(new Date('2026-10-28T09:00:00Z')).week, '2026-W44');
  assert.equal(VERSION, '1.2');
});

test('landing page shows "being prepared" instead of an old week', async () => {
  const BOARD = memKV({ index: [{ week: '2026-W42', range: '12 – 18 Oct 2026' }], 'snap:2026-W42': { ...sampleSnapshot }, 'refresh-lock': 'x' });
  const ctx = { waitUntil: () => {} };
  const r = await worker.fetch(new Request('https://dash.gershoncrm.com/'), { BOARD }, ctx);
  const page = await r.text();
  const cur = currentIsoWeek(new Date()).week;
  assert.equal(r.status, 200);
  assert.ok(page.includes("This week's board is being prepared"));
  assert.ok(page.includes(`Weekly Board · ${cur}`));
  assert.ok(!page.includes('Weekly Board · 2026-W42'), 'must not present the old week as the board');
  assert.ok(page.includes('href="/w/2026-W42"'), 'older weeks stay reachable in the week list');
  assert.match(page, new RegExp(`class="on" href="/w/${cur}"`));
});

test('landing page shows the current week once it exists; old week links still work', async () => {
  const cur = currentIsoWeek(new Date());
  const BOARD = memKV({ index: [{ week: cur.week }, { week: '2026-W42' }], [`snap:${cur.week}`]: { ...sampleSnapshot, week: cur.week, start: cur.start, end: cur.end, generatedAt: new Date().toISOString() }, 'snap:2026-W42': { ...sampleSnapshot } });
  const ctx = { waitUntil: () => {} };
  const home = await (await worker.fetch(new Request('https://dash.gershoncrm.com/'), { BOARD }, ctx)).text();
  assert.ok(home.includes(`Weekly Board · ${cur.week}`));
  assert.ok(home.includes('Up to date'));
  assert.ok(!home.includes('being prepared'));
  const old = await worker.fetch(new Request('https://dash.gershoncrm.com/w/2026-W42'), { BOARD }, ctx);
  assert.equal(old.status, 200);
  assert.ok((await old.text()).includes('Weekly Board · 2026-W42'));
});

test('preparing page carries no secret names and is phone-safe markup', () => {
  const page = renderPreparing(currentIsoWeek(new Date('2026-10-28')), sampleWeeks);
  for (const s of SECRET_NAMES) assert.ok(!page.includes(s));
  assert.ok(page.includes('26 Oct – 1 Nov 2026'));
  assert.ok(page.includes('Dash v1.2'));
});
