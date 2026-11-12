// Builds a self-contained preview page with SAMPLE data.
// Usage: node apps/dash/scripts/preview.mjs <out.html> [--full]
// Three scenarios, switchable from the red preview bar:
//   * "Sample figures"  - made-up data, 2 of 5 platforms reporting;
//   * "Nothing connected" - the live W45 situation (0 of 5 reporting);
//   * "Week with no data" - what /w/2026-W44 shows (HTTP 404).
import { writeFileSync } from 'node:fs';
import { renderBoard, renderMissing, VERSION } from '../src/render.js';
import { sampleSnapshot } from '../test/sample-snapshot.mjs';

const out = process.argv[2] || 'dash-preview.html';
const full = process.argv.includes('--full');

const now = new Date('2026-11-12T08:00:00Z');          // Thursday, W46
const opts = { expectedWeek: '2026-W46' };
const weeks = [
  { week: '2026-W46', range: '9 – 15 Nov 2026', builtAt: '2026-11-09T12:15:00Z' },
  { week: '2026-W45', range: '2 – 8 Nov 2026', builtAt: '2026-11-10T03:10:23Z' },
  { week: '2026-W44', range: '26 Oct – 1 Nov 2026', notBuilt: true },
  { week: '2026-W43', range: '19 – 25 Oct 2026', notBuilt: true },
  { week: '2026-W42', range: '12 – 18 Oct 2026', builtAt: '2026-10-23T02:02:59Z' },
];

const sample = { ...sampleSnapshot, week: '2026-W46', start: '2026-11-09', end: '2026-11-15', generatedAt: '2026-11-09T12:15:00Z' };
const empty = {
  ...sample, week: '2026-W45', start: '2026-11-02', end: '2026-11-08', generatedAt: '2026-11-10T03:10:23Z',
  platforms: sample.platforms.map(p => ({ id: p.id, name: p.name, host: p.host, status: 'not_connected', reason: p.id === 'client' ? 'signin_missing' : 'token_missing', metrics: [] })),
};

const bar = `<div class="pvbar" role="note"><strong>Preview — not live</strong><span>Dash v${VERSION}, sample data. Scenario:</span>
<button type="button" data-show="b-sample" aria-pressed="true">Sample figures</button><button type="button" data-show="b-empty" aria-pressed="false">Nothing connected</button><button type="button" data-show="b-missing" aria-pressed="false">Week with no data</button></div>
<style>.pvbar{background:#FE1B04;color:#fff;font:600 12.5px/1.4 var(--font);display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-block:6px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.pvbar span{font-weight:400}.pvbar button{font:inherit;font-size:12px;border:1px solid #fff;background:transparent;color:#fff;border-radius:999px;padding:2px 10px;cursor:pointer}
.pvbar button[aria-pressed="true"]{background:#fff;color:#d11200}</style>`;

const shellOf = h => h.slice(h.indexOf('<div class="shell">'), h.lastIndexOf('<script>'));
const a = renderBoard(sample, weeks, now, { ...opts, fragment: true, title: 'Dash Board Preview' });
const b = renderBoard(empty, weeks, now, { fragment: true });
const c = renderMissing('2026-W44', weeks, { fragment: true });
const head = a.slice(0, a.indexOf('<div class="shell">'));

let html = `${head}${bar}<div id="b-sample">${shellOf(a)}</div><div id="b-empty" hidden>${shellOf(b)}</div><div id="b-missing" hidden>${shellOf(c)}</div>`;
html += `<script>(function(){
function show(id){document.querySelectorAll('.pvbar button').forEach(function(y){var on=y.dataset.show===id;y.setAttribute('aria-pressed',String(on));document.getElementById(y.dataset.show).hidden=!on;});}
document.querySelectorAll('.pvbar button').forEach(function(x){x.addEventListener('click',function(){show(x.dataset.show)})});
var h=(location.hash||'').slice(1);if(document.getElementById(h))show(h);
document.querySelectorAll('.weeks a').forEach(function(l){l.addEventListener('click',function(e){e.preventDefault()})});
})();</script>`;
if (full) html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${html}</body></html>`;

writeFileSync(out, html);
console.log('wrote', out, html.length, 'bytes');
