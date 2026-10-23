// Builds a self-contained preview page with SAMPLE data.
// Usage: node apps/dash/scripts/preview.mjs <out.html> [--full]
import { writeFileSync } from 'node:fs';
import { renderBoard } from '../src/render.js';
import { sampleSnapshot, sampleWeeks } from '../test/sample-snapshot.mjs';

const out = process.argv[2] || 'dash-preview.html';
const full = process.argv.includes('--full');

const bar = `<div class="pvbar" role="note"><strong>Preview — not live</strong><span>Sample data. Try the freshness banner:</span>
<button type="button" id="pv-fresh" data-days="4">4 days old</button><button type="button" id="pv-amber" data-days="11">11 days old</button><button type="button" id="pv-red" data-days="17">17 days old</button></div>
<style>.pvbar{background:#CC3333;color:#fff;font:600 12.5px/1.4 var(--font);display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-block:6px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.pvbar span{font-weight:400}.pvbar button{font:inherit;font-size:12px;border:1px solid #fff;background:transparent;color:#fff;border-radius:999px;padding:2px 10px;cursor:pointer}
.pvbar button[aria-pressed="true"]{background:#fff;color:#a8281f}</style>`;

const now = new Date('2026-10-23T08:00:00Z');
let html = renderBoard(sampleSnapshot, sampleWeeks, now, { fragment: !full, topBar: bar, title: 'Dash Board Preview' });

html += `<script>(function(){
var A=8,R=15;function set(days){var b=document.querySelector('[data-generated]');var g=new Date(Date.now()-days*864e5-36e5);
b.setAttribute('data-generated',g.toISOString());var t=days>R?'red':days>A?'amber':'green';b.className='fresh '+t;
var M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
b.firstElementChild.firstChild.textContent='Generated '+g.getUTCDate()+' '+M[g.getUTCMonth()]+' '+g.getUTCFullYear()+' · ';
b.querySelector('.age').textContent=days+' days old';
b.querySelector('.why').textContent=t==='green'?'Up to date':t==='amber'?'Older than '+A+' days: this week may not have been generated yet':'Older than '+R+' days: the weekly refresh is not running';
document.querySelectorAll('.pvbar button').forEach(function(x){x.setAttribute('aria-pressed',String(+x.dataset.days===days))});}
document.querySelectorAll('.pvbar button').forEach(function(x){x.addEventListener('click',function(){set(+x.dataset.days)})});
document.querySelectorAll('.weeks a').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault()})});
set(4);})();</script>`;

writeFileSync(out, html);
console.log('wrote', out, html.length, 'bytes');
