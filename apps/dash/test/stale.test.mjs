// Run: node --test apps/dash/test/stale.test.mjs
// Home page when this week's board is missing: say plainly how old the latest
// board is and when the next one is built (2026-11-06 nightly).
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPreparing, staleLine, nextBuild, weeksBetween } from '../src/render.js';
import { currentIsoWeek } from '../src/collect.js';
import worker from '../src/worker.js';
import { sampleSnapshot } from './sample-snapshot.mjs';

const memKV = (init = {}) => {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, JSON.stringify(v)]));
  return { async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, async put(k, v) { m.set(k, v); } };
};

test('week maths and next Monday build', () => {
  assert.equal(weeksBetween('2026-W42', '2026-W45'), 3);
  assert.equal(weeksBetween('2026-W52', '2027-W01'), 2);              // 2026 has 53 ISO weeks
  assert.equal(nextBuild(new Date('2026-11-06T01:00:00Z')).toISOString(), '2026-11-09T12:15:00.000Z');
  assert.equal(nextBuild(new Date('2026-11-09T10:00:00Z')).toISOString(), '2026-11-09T12:15:00.000Z');
  assert.equal(nextBuild(new Date('2026-11-09T13:00:00Z')).toISOString(), '2026-11-16T12:15:00.000Z');
});

test('stale line: "Latest board: 2026-W42 (3 weeks old) — next board builds Monday 9 Nov"', () => {
  const now = new Date('2026-11-06T01:00:00Z');                       // Friday, W45
  const wk = currentIsoWeek(now);
  const s = staleLine({ week: '2026-W42' }, wk, now);
  assert.equal(s.text, 'Latest board: 2026-W42 (3 weeks old) — next board builds Monday 9 Nov');
  assert.equal(s.tone, 'red');
  assert.equal(staleLine({ week: '2026-W44' }, wk, now).tone, 'amber');
  assert.match(staleLine(null, wk, now).text, /^No board has been built yet/);
  const page = renderPreparing(wk, [{ week: '2026-W42' }, { week: '2026-W40' }], { now });
  assert.ok(page.includes('Latest board: 2026-W42 (3 weeks old) — next board builds Monday 9 Nov'));
  assert.ok(page.includes('href="/w/2026-W42">Open 2026-W42'));
});

test('home page carries the stale line when this week is missing', async () => {
  const BOARD = memKV({ index: [{ week: '2026-W42', range: '12 – 18 Oct 2026' }], 'snap:2026-W42': { ...sampleSnapshot }, 'refresh-lock': 'x' });
  const page = await (await worker.fetch(new Request('https://dash.gershoncrm.com/'), { BOARD }, { waitUntil: () => {} })).text();
  assert.match(page, /Latest board: 2026-W42 \(\d+ weeks old\) — next board builds Monday \d+ \w+/);
});
