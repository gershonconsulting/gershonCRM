// Dash weekly board - Cloudflare Worker (dash.gershoncrm.com)
//
// Why the live board went stale: snapshots were only ever made when somebody
// opened a week URL; there was no schedule. Since v1.2:
//   1. the separate gershon-dash-cron Worker (apps/dash-cron, cron
//      "15 12 * * 1") calls refreshBoard() every Monday and creates/refreshes
//      the CURRENT ISO week's board (same week-creation code as below);
//   2. the home page always targets the current ISO week. If that board does
//      not exist yet it says so plainly ("Latest board: 2026-W42 (3 weeks old) -
//      next board builds Monday 9 Nov") instead of showing an old week;
//   3. self-heal: if the current week is missing, the first visit kicks off ONE
//      background refresh (at most every 6 h).
// Visitors can no longer create arbitrary weeks by typing /w/<week>.
// v1.2.2: /w and /w/ (no week) redirect to the home page, which lists every
// stored week; /api/health answers a small JSON status for uptime checks.
// v1.2.3: the KV namespace is read from env.DASH_KV (the name the live Pages
// project gershon-dash binds) or env.BOARD (wrangler.toml / older setups).
// v1.2.3: index rows without a valid week are ignored, so the week list never
// links to "/w/" (404); a bare /w/ still redirects to the home page.

import { renderBoard, renderMissing, renderPreparing, weekRange, VERSION } from './render.js';
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
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...SECURITY_HEADERS, 'content-type': 'application/json; charset=utf-8' } });

/**
 * The board's KV namespace. The live Pages project binds it as DASH_KV; the
 * wrangler.toml files (and older setups) bind it as BOARD. Either works;
 * DASH_KV wins if both are set (they point at the same namespace).
 */
export function boardKV(env) {
  const kv = env && (env.DASH_KV || env.BOARD);
  if (!kv) throw new Error('KV binding missing: bind the "gershon-dash" namespace as DASH_KV (or BOARD)');
  return kv;
}

const WEEK_RE = /^\d{4}-W\d{2}$/;

async function readIndex(env) {
  // [{week, range}] newest first. v1.2.3: an entry without a valid ISO week (a legacy/partial
  // row) is dropped; it used to render a sidebar link to "/w/" (a dead link) on the live board.
  const index = (await boardKV(env).get('index', 'json')) || [];
  return Array.isArray(index) ? index.filter(w => w && typeof w.week === 'string' && WEEK_RE.test(w.week)) : [];
}

/**
 * Week list for the sidebar/home: every week stored in KV (the `index` key plus
 * any `snap:<week>` key the index forgot), plus the current ISO week even when
 * it is not built yet. Newest first; each entry has builtAt, or notBuilt: true.
 */
export async function listWeeks(env, now = new Date()) {
  const byWeek = new Map((await readIndex(env)).map(w => [w.week, { ...w }]));
  if (typeof boardKV(env).list === 'function') {
    let cursor;
    do {
      const r = await boardKV(env).list({ prefix: 'snap:', cursor });
      for (const k of r.keys || []) {
        const wk = k.name.slice(5);
        if (WEEK_RE.test(wk) && !byWeek.has(wk)) byWeek.set(wk, { week: wk });
      }
      cursor = r.list_complete === false ? r.cursor : undefined;
    } while (cursor);
  }
  const cur = boardWeek(now);
  if (!byWeek.has(cur.week)) byWeek.set(cur.week, { week: cur.week, range: weekRange(cur), notBuilt: true });
  for (const w of byWeek.values()) {
    if (w.builtAt || w.notBuilt) continue;
    const snap = await boardKV(env).get(`snap:${w.week}`, 'json');
    if (!snap || !Array.isArray(snap.platforms)) { w.notBuilt = true; continue; }   // placeholder = no data
    if (snap.generatedAt) w.builtAt = snap.generatedAt;
    if (!w.range) w.range = weekRange(snap);
  }
  return [...byWeek.values()].sort((a, b) => (a.week < b.week ? 1 : -1));
}

export async function generate(env, wk, deps) {
  const snap = await collectWeek(env, wk, deps);
  await boardKV(env).put(`snap:${wk.week}`, JSON.stringify(snap));
  const index = (await readIndex(env)).filter(w => w.week !== wk.week);
  index.unshift({ week: wk.week, range: weekRange(snap), builtAt: snap.generatedAt });
  index.sort((a, b) => (a.week < b.week ? 1 : -1));
  await boardKV(env).put('index', JSON.stringify(index.slice(0, 104)));
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
  await boardKV(env).put('last-refresh', JSON.stringify({ week: wk.week, at: new Date().toISOString() }));
  return snap;
}

async function selfHeal(env, index, now = new Date()) {
  const want = boardWeek(now).week;
  if (index.some(w => w.week === want)) return;
  if (await boardKV(env).get('refresh-lock')) return;
  await boardKV(env).put('refresh-lock', now.toISOString(), { expirationTtl: 6 * 3600 });
  console.warn(`[dash] ${want} not stored yet (newest: ${index[0] ? index[0].week : 'none'}): self-healing`);
  await refreshBoard(env, now);
}

/** /api/health body: {ok, app, version, latest_week}. latest_week = newest BUILT week, or null. Never triggers a build. */
export async function health(env, now = new Date()) {
  try {
    const weeks = await listWeeks(env, now);
    const latest = weeks.find(w => !w.notBuilt);
    return { status: 200, body: { ok: true, app: 'dash', version: VERSION, latest_week: latest ? latest.week : null } };
  } catch (e) {
    console.error('[dash] health check failed', e && e.message);
    return { status: 503, body: { ok: false, app: 'dash', version: VERSION, latest_week: null } };
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    const url = new URL(request.url);
    const now = new Date();

    // Lightweight routes first: no self-heal, no page rendering.
    if (url.pathname === '/api/health' || url.pathname === '/api/health/') {
      const h = await health(env, now);
      return json(h.body, h.status);
    }
    if (url.pathname === '/w' || url.pathname === '/w/') {
      // No week given: the home page already lists every stored week.
      return new Response(null, { status: 302, headers: { location: '/', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } });
    }

    const index = await readIndex(env);
    const weeks = await listWeeks(env, now);
    ctx.waitUntil(selfHeal(env, index, now).catch(e => console.error('[dash] self-heal failed', e)));

    const isHome = url.pathname === '/' || url.pathname === '';
    if (isHome) {
      // Landing page = the current week's board, never an older week.
      const wk = boardWeek(now);
      const snap = await boardKV(env).get(`snap:${wk.week}`, 'json');
      if (!snap || !Array.isArray(snap.platforms)) return html(renderPreparing(wk, weeks, { latest: weeks.find(w => !w.notBuilt) || null, now }));
      return html(renderBoard(snap, weeks, now, { expectedWeek: wk.week }));
    }
    const m = url.pathname.match(/^\/w\/(\d{4}-W\d{2})\/?$/);
    if (!m) return html(renderMissing(null, weeks), 404);
    const week = m[1];
    const snap = await boardKV(env).get(`snap:${week}`, 'json');
    if (!snap || !Array.isArray(snap.platforms)) return html(renderMissing(week, weeks), 404);
    return html(renderBoard(snap, weeks, now));
  },

  // Fallback only: apps/dash/wrangler.toml has no [triggers] since v1.2 (the
  // schedule lives in gershon-dash-cron), so this runs only if one is added.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshBoard(env, new Date(event.scheduledTime)));
  },
};
