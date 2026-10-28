// Builds a self-contained preview page with SAMPLE data.
// Usage: node apps/dash/scripts/preview.mjs <out.html> [--full]
// Two scenarios, switchable from the red preview bar:
//   * "Sample figures"  - made-up data, 3 of 5 platforms answering;
//   * "Today: nothing connected" - the live situation on 27 Oct 2026 (0 of 5 connected).
import { writeFileSync } from 'node:fs';
import { renderBoard } from '../src/render.js';
import { sampleSnapshot, sampleWeeks } from '../test/sample-snapshot.mjs';

const out = process.argv[2] || 'dash-preview.html';
const full = process.argv.includes('--full');

const now = new Date('2026-10-27T08:00:00Z');          // Tuesday: W43 should exist by now
const opts = { expectedWeek: '2026-W43' };
const weeks = [{ week: '2026-W42', range: '12 – 18 Oct 2026' }, { week: '2026-W40', range: '28 Sept – 4 Oct 2026' }, { week: '2026-W35', range: '24 – 30 Aug 2026' }];

const sample = { ...sampleSnapshot, generatedAt: '2026-10-23T02:02:59Z' };
const empty = {
  ...sample,
  platforms: sample.platforms.map(p => ({ id: p.id, name: p.name, host: p.host, status: p.id === 'social' ? 'unreachable' : 'not_connected', metrics: [] })),
};

const bar = `<div class="pvbar" role="note"><strong>Preview — not live</strong><span>Dash v1.1, PR #1. Scenario:</span>
<button type="button" id="pv-empty" data-show="b-empty" aria-pressed="true">Today: nothing connected</button><button type="button" id="pv-sample" data-show="b-sample" aria-pressed="false">Sample figures</button></div>
<style>.pvbar{background:#CC3333;color:#fff;font:600 12.5px/1.4 var(--font);display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-block:6px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.pvbar span{font-weight:400}.pvbar button{font:inherit;font-size:12px;border:1px solid #fff;background:transparent;color:#fff;border-radius:999px;padding:2px 10px;cursor:pointer}
.pvbar button[aria-pressed="true"]{background:#fff;color:#a8281f}</style>`;

const shellOf = h => h.slice(h.indexOf('<div class="shell">'), h.lastIndexOf('<script>'));
const a = renderBoard(empty, weeks, now, { ...opts, fragment: true, title: 'Dash Weekly Board v1.1 Preview' });
const b = renderBoard(sample, weeks, now, { ...opts, fragment: true });
const head = a.slice(0, a.indexOf('<div class="shell">'));

let html = `${head}${bar}<div id="b-empty">${shellOf(a)}</div><div id="b-sample" hidden>${shellOf(b)}</div>`;
html += `<script>(function(){
document.querySelectorAll('.pvbar button').forEach(function(x){x.addEventListener('click',function(){
document.querySelectorAll('.pvbar button').forEach(function(y){var on=y===x;y.setAttribute('aria-pressed',String(on));document.getElementById(y.dataset.show).hidden=!on;});});});
document.querySelectorAll('.weeks a').forEach(function(l){l.addEventListener('click',function(e){e.preventDefault()})});
})();</script>`;
if (full) html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${html}</body></html>`;

writeFileSync(out, html);
console.log('wrote', out, html.length, 'bytes');
