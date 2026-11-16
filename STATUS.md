# STATUS - gershonCRM (Dash weekly board lives in apps/dash + apps/dash-cron)
Updated: 2026-11-16 (nightly)

## State
- main = Dash v1.2.3 (PR #6 merged 2026-11-16; earlier: #2 cron Worker, #3 every stored week listed, #4 honest KPIs, #5 /api/health).
- v1.2.3 (PR #6, merged 2026-11-16, NOT live: live is still v1.2.1 until the Pages zip upload) = (KV read from DASH_KV or BOARD; week list never links to dead "/w/": index rows without a valid ISO week are ignored; bare /w/ redirects to /).
- Version: single constant VERSION in apps/dash/src/render.js (1.2.3 on main).
- Tests: node --test apps/dash/test/*.test.mjs apps/dash-cron/test/*.test.mjs -> 39/39 pass on the v1.2.3 branch (32/32 on main).

## Deploy route
- dash.gershoncrm.com = Cloudflare Pages project `gershon-dash`, deployed by ZIP upload (not Git-connected).
- Bundle: single `_worker.js` at zip root, built with esbuild from apps/dash/src/worker.js
  (--bundle --format=esm --platform=neutral). The Pages project binds the KV namespace as DASH_KV;
  since v1.2.3 the code reads env.DASH_KV || env.BOARD, so no alias is needed.
- Monday cron: separate Worker gershon-dash-cron (apps/dash-cron, "15 12 * * 1"), deployed with wrangler.

## Done
- [x] v1.2 cron + current-week home, v1.2.1 KPIs/404 empty weeks/brand red #FE1B04 merged to main.
- [x] Deploy zip built + smoke-tested locally (night/out/gershon-dash-deploy.zip).

## Open
- [ ] Build the bundle from main (after the v1.2.3 PR) and upload it to Pages project gershon-dash. Live is still v1.2.1 (its week list still shows the dead "/w/" link and /w/ 404s until then).
- [ ] Deploy apps/dash-cron over gershon-dash-cron; same KV id; platform secrets (see HANDOFF.txt).
- [ ] Platform tokens (SOCIAL/LINALYSIS/FINANCE/NEXASHARE_TOKEN, CLIENT_EMAIL/PASSWORD) so tiles show data.
- [ ] No login on the board (Olivier's decision); optional Cloudflare Access.
