// Dash weekly board - Cloudflare Worker (dash.gershoncrm.com)
//
// Why the live board went stale: snapshots were only ever made when somebody
// opened a week URL; there was no schedule. Since v1.2:
//   1. the separate gershon-dash-cron Worker (apps/dash-cron, cron
//      "15 12 * * 1") calls refreshBoard() every Monday and creates/refreshes
//      the CURRENT ISO week's board (same week-creation code as below);
//   2. the home page always targets the current ISO week. If that board does
//      not exist yet it shows "This week's board is being prepared" instead of
//      an old week;
//   3. self-heal: if the current week is missing, the first visit kicks off ONE
//      background refresh (at most every 6 h).
// Visitors can no longer create arbitrary weeks by typing /w/<week>.

import { renderBoard, renderMissing, renderPreparing, weekRange } from './render.js';
import { collectWeek, boardWeek } from './collect.js';

const SECURITY_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'x-frame-options': 'DENY',
};

const html = (body, status = 200) => new Response(body, { status, headers: SECURITY_HEADERS });

async function readIndex(env) {
  return (await env.BOARD.get('index', 'json')) || [];   // [{week, range}] newest first
}

export async function generate(env, wk, deps) {
  const snap = await collectWeek(env, wk, deps);
  await env.BOARD.put(`snap:${wk.week}`, JSON.stringify(snap));
  const index = (await readIndex(env)).filter(w => w.week !== wk.week);
  index.unshift({ week: wk.week, range: weekRange(snap) });
  index.sort((a, b) => (a.week < b.week ? 1 : -1));
  await env.BOARD.put('index', JSON.stringify(index.slice(0, 104)));
  console.log(`[dash] stored ${wk.week} (${snap.platforms.filter(p => p.status === 'connected').length}/${snap.platforms.length} connected)`);
  return snap;
}

/**
 * Create or refresh the board for the week containing `now` (v1.2 default).
 * Used by the gershon-dash-cron Worker and by this Worker's own scheduled().
 */
export async function refreshBoard(env, now = new Date(), deps) {
  const wk = boardWeek(now);
  const snap = await generate(env, wk, deps);
  await env.BOARD.put('last-refresh', JSON.stringify({ week: wk.week, at: new Date().toISOString() }));
  return snap;
}

async function selfHeal(env, index, now = new Date()) {
  const want = boardWeek(now).week;
  if (index.some(w => w.week === want)) return;
  if (await env.BOARD.get('refresh-lock')) return;
  await env.BOARD.put('refresh-lock', now.toISOString(), { expirationTtl: 6 * 3600 });
  console.warn(`[dash] ${want} not stored yet (newest: ${index[0] ? index[0].week : 'none'}): self-healing`);
  await refreshBoard(env, now);
}

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    const url = new URL(request.url);
    const now = new Date();
    const index = await readIndex(env);
    ctx.waitUntil(selfHeal(env, index, now).catch(e => console.error('[dash] self-heal failed', e)));

    const isHome = url.pathname === '/' || url.pathname === '';
    if (isHome) {
      // Landing page = the current week's board, never an older week.
      const wk = boardWeek(now);
      const snap = await env.BOARD.get(`snap:${wk.week}`, 'json');
      if (!snap || !Array.isArray(snap.platforms)) return html(renderPreparing(wk, index));
      return html(renderBoard(snap, index, now, { expectedWeek: wk.week }));
    }
    const m = url.pathname.match(/^\/w\/(\d{4}-W\d{2})\/?$/);
    if (!m) return html(renderMissing(null, index), 404);
    const week = m[1];
    const snap = await env.BOARD.get(`snap:${week}`, 'json');
    if (!snap || !Array.isArray(snap.platforms)) return html(renderMissing(week, index), 404);
    return html(renderBoard(snap, index, now));
  },

  // Fallback only: apps/dash/wrangler.toml has no [triggers] since v1.2 (the
  // schedule lives in gershon-dash-cron), so this runs only if one is added.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshBoard(env, new Date(event.scheduledTime)));
  },
};
