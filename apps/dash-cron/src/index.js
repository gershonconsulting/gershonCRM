// gershon-dash-cron - Cloudflare Worker that keeps dash.gershoncrm.com current.
//
// Schedule: "15 12 * * 1" (wrangler.toml) = every Monday 12:15 UTC.
// Job: create or refresh the current ISO week's board, using exactly the same
// week-creation code as the board Worker (no copy, no made-up data): figures
// come only from the five platforms; a platform that does not answer or has no
// secret is stored as "not connected" / "not responding".

import { refreshBoard } from '../../dash/src/worker.js';

export async function run(env, scheduledTime = Date.now(), deps) {
  const now = new Date(scheduledTime);
  if (!env.BOARD) throw new Error('KV binding BOARD is missing (see apps/dash-cron/wrangler.toml)');
  const snap = await refreshBoard(env, now, deps);
  console.log(`[dash-cron] ${snap.week} refreshed at ${snap.generatedAt}`);
  return snap;
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(run(env, event.scheduledTime).catch(e => {
      console.error('[dash-cron] refresh failed', e);
      throw e;   // marks the Cron run as failed in the Cloudflare dashboard
    }));
  },

  // No public trigger: visiting this Worker never builds a board.
  async fetch() {
    return new Response('gershon-dash-cron: refreshes the Dash board every Monday 12:15 UTC.\n', {
      status: 200, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
    });
  },
};
