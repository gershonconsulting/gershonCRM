// Run: node --test apps/dash/test/index-weeks.test.mjs
// Home/week list shows every stored week + the current week, with a "built" line.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { listWeeks } from '../src/worker.js';
import { currentIsoWeek } from '../src/collect.js';
import { sampleSnapshot } from './sample-snapshot.mjs';

function memKV(init = {}) {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    m,
    async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { m.set(k, v); },
    async list({ prefix = '' } = {}) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }; },
  };
}
const snap = (week, at) => ({ ...sampleSnapshot, week, generatedAt: at });
const NOW = new Date('2026-11-10T09:00:00Z');   // Tuesday, 2026-W46

test('lists every stored week (even if the index forgot it), newest first, plus the current week', async () => {
  const BOARD = memKV({
    index: [{ week: '2026-W45', range: '2 – 8 Nov 2026', builtAt: '2026-11-10T03:10:23Z' }, { week: '2026-W42' }],
    'snap:2026-W45': snap('2026-W45', '2026-11-10T03:10:23Z'),
    'snap:2026-W42': snap('2026-W42', '2026-10-19T06:00:00Z'),
    'snap:2026-W40': snap('2026-W40', '2026-10-05T06:00:00Z'),   // not in index
  });
  const weeks = await listWeeks({ BOARD }, NOW);
  assert.deepEqual(weeks.map(w => w.week), ['2026-W46', '2026-W45', '2026-W42', '2026-W40']);
  assert.equal(weeks[0].notBuilt, true);
  assert.equal(weeks[2].builtAt, '2026-10-19T06:00:00Z');   // filled from the snapshot
});

test('home page links the current week and shows a built line per week', async () => {
  const BOARD = memKV({
    index: [{ week: '2026-W45' }, { week: '2026-W42' }],
    'snap:2026-W45': snap('2026-W45', '2026-11-10T03:10:23Z'),
    'snap:2026-W42': snap('2026-W42', '2026-10-19T06:00:00Z'),
    'refresh-lock': 'x',
  });
  const r = await worker.fetch(new Request('https://dash.gershoncrm.com/'), { BOARD }, { waitUntil: () => {} });
  const page = await r.text();
  const cur = currentIsoWeek(new Date()).week;
  assert.ok(page.includes(`href="/w/${cur}"`), 'current week is linked');
  assert.ok(page.includes('href="/w/2026-W45"') && page.includes('href="/w/2026-W42"'));
  assert.ok(page.includes('<small class="built">built 10 Nov 2026</small>'));
  assert.ok(page.includes('<small class="built">built 19 Oct 2026</small>'));
  assert.ok(page.includes('not built yet'));
  assert.ok(page.includes('Latest board: 2026-W45'), 'latest = newest BUILT week, not the unbuilt current one');
});

test('a week page also lists all weeks', async () => {
  const BOARD = memKV({ 'snap:2026-W45': snap('2026-W45', '2026-11-10T03:10:23Z'), 'refresh-lock': 'x' });
  const page = await (await worker.fetch(new Request('https://dash.gershoncrm.com/w/2026-W45'), { BOARD }, { waitUntil: () => {} })).text();
  assert.ok(page.includes('built 10 Nov 2026'));
});
