// Run: node --test apps/dash/test/dash.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBoard, freshness, connectionLine } from '../src/render.js';
import { collectWeek, previousIsoWeek, isoWeekLabel, PLATFORMS } from '../src/collect.js';
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

test('empty figures say "Not connected yet", not 0', () => {
  const page = renderBoard(sampleSnapshot, sampleWeeks, new Date('2026-10-23'));
  assert.ok(page.includes('Not connected yet'));
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
