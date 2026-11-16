// Run: node --test apps/dash/test/nav-links.test.mjs
// v1.2.3: the week list must never contain a link to "/w/" (live board 404).
import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { listWeeks } from '../src/worker.js';
import { sampleSnapshot } from './sample-snapshot.mjs';

function memKV(init = {}) {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { m.set(k, v); },
    async list({ prefix = '' } = {}) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }; },
  };
}
const NOW = new Date('2026-11-10T09:00:00Z');   // Tuesday, 2026-W46
const ctx = { waitUntil: () => {} };

test('an index row without a valid week never becomes a "/w/" link', async () => {
  const BOARD = memKV({
    index: [{ week: '2026-W45' }, { range: '2 – 8 Nov 2026' }, { week: '' }, null, { week: 'junk' }],
    'snap:2026-W45': { ...sampleSnapshot, week: '2026-W45', generatedAt: '2026-11-10T03:10:23Z' },
    'refresh-lock': 'x',
  });
  const weeks = await listWeeks({ BOARD }, NOW);
  assert.ok(weeks.every(w => /^\d{4}-W\d{2}$/.test(w.week)), 'only valid ISO weeks are listed');
  const page = await (await worker.fetch(new Request('https://dash.gershoncrm.com/'), { BOARD }, ctx)).text();
  assert.ok(!/href="\/w\/?"/.test(page), 'no link to /w/ on the page');
  assert.ok(page.includes('href="/w/2026-W45"'));
});

test('/w/ answers with a redirect to the home page, not a 404', async () => {
  const r = await worker.fetch(new Request('https://dash.gershoncrm.com/w/'), { BOARD: memKV({}) }, ctx);
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), '/');
});
