// Dash weekly board - HTML renderer (pure functions, no network).
// Used by the Worker (src/worker.js) and by scripts/preview.mjs.
//
// PUBLIC PAGE RULE: nothing in here may print a secret / env-var name,
// an HTTP status code or an internal error message. Those details go to
// the Worker logs only (see collect.js). The page says "Not connected yet".

export const VERSION = '1.2';
export const TOTAL_PLATFORMS = 5;
export const STALE_AMBER_DAYS = 8;  // orange when older than this
export const STALE_RED_DAYS = 15;   // red when older than this

const DAY = 86400000;

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
export function fmtDate(d) {
  const x = new Date(d);
  return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
}

/** Age of a snapshot in whole days and the banner tone. */
export function freshness(generatedAt, now = new Date()) {
  const days = Math.max(0, Math.floor((new Date(now) - new Date(generatedAt)) / DAY));
  const tone = days > STALE_RED_DAYS ? 'red' : days > STALE_AMBER_DAYS ? 'amber' : 'green';
  const ago = days === 0 ? 'today' : days === 1 ? '1 day old' : `${days} days old`;
  return { days, tone, text: `Generated ${fmtDate(generatedAt)} · ${ago}` };
}

const hasValue = m => m && m.value !== null && m.value !== undefined && m.value !== '';

/**
 * One state per platform: 'green' | 'amber' | 'red' | 'nodata'.
 * A platform that is not connected, did not answer, or sent no filled figure
 * is "No data". It is never counted as "On track" (the live W42 board said
 * "5 on track" with 0 of 5 platforms connected, because service-health rows
 * such as "Service: ok" were counted as on-track figures).
 */
export function platformState(p) {
  if (!p || p.status !== 'connected') return 'nodata';
  const tones = (p.metrics || []).filter(hasValue).map(m => m.tone);
  if (!tones.length) return 'nodata';
  if (tones.includes('red')) return 'red';
  if (tones.includes('amber')) return 'amber';
  if (tones.includes('green')) return 'green';
  return 'nodata';
}

/** Headline counts, per PLATFORM. Empty figures are counted separately, never as 0. */
export function summarise(snap) {
  const s = { green: 0, amber: 0, red: 0, nodata: 0, empty: 0, connected: 0, notReady: 0, total: 0 };
  for (const p of snap.platforms || []) {
    s.total++;
    if (p.status === 'connected') s.connected++; else s.notReady++;
    s[platformState(p)]++;
    if (p.status === 'connected') for (const m of p.metrics || []) if (!hasValue(m)) s.empty++;
  }
  return s;
}

export function connectionLine(snap) {
  const s = summarise(snap);
  const total = (snap.platforms || []).length || TOTAL_PLATFORMS;
  if (s.notReady === 0) return { ok: true, text: `All ${total} platforms are connected` };
  return { ok: false, text: `Some platform connections are not set up yet (${s.notReady} of ${total})` };
}

function platformDot(p) {
  const st = platformState(p);
  return st === 'nodata' ? 'grey' : st;
}

const STATUS_WORDS = {
  connected: 'Connected',
  not_connected: 'Not connected yet',
  unreachable: 'Not responding this week',
};

function sourceLine(p) {
  const where = esc(p.host || 'unknown source');
  if (p.status === 'connected') return `Data source: ${where} · ${esc(p.sourceNote || 'weekly figures')}`;
  if (p.status === 'unreachable') return `Data source: ${where} · could not be read this week`;
  return `Data source: ${where} · not connected yet`;
}

function metricHtml(m) {
  const filled = hasValue(m);
  const val = filled
    ? `<span class="pill ${esc(m.tone || 'grey')}">${esc(m.value)}</span>`
    : `<span class="pill empty">No data</span>`;
  const hint = m.hint ? `<span class="hint">${esc(m.hint)}</span>` : '';
  return `<div class="m"><div class="lbl">${esc(m.label)}${hint}</div>${val}</div>`;
}

function tableHtml(t) {
  if (!t || !t.rows || !t.rows.length) return '';
  const head = t.columns.map(c => `<th>${esc(c)}</th>`).join('');
  const rows = t.rows.map(r => `<tr>${r.map((c, i) => {
    const cell = typeof c === 'object' && c ? c : { v: c };
    return i === 0 ? `<td class="name">${esc(cell.v)}</td>` : `<td><span class="cell ${esc(cell.tone || 'grey')}">${esc(cell.v ?? '—')}</span></td>`;
  }).join('')}</tr>`).join('');
  return `<div class="scroll"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function tileHtml(p) {
  const dot = platformDot(p);
  const metrics = (p.metrics || []);
  const filled = metrics.filter(hasValue).length;
  const body = p.status === 'connected' && metrics.length
    ? `<div class="metrics">${metrics.map(metricHtml).join('')}</div>${tableHtml(p.table)}`
    : `<div class="emptytile"><strong>Not connected yet</strong><span>${p.status === 'unreachable'
        ? 'The platform did not answer when this week was generated. Figures will appear on the next run.'
        : 'Figures will appear here once this platform is linked to the board.'}</span></div>`;
  return `<section class="tile" id="p-${esc(p.id)}">
  <header class="tilehead">
    <h3><span class="dot ${dot}"></span>${esc(p.name)}</h3>
    <span class="status ${p.status === 'connected' ? 'on' : 'off'}">${STATUS_WORDS[p.status] || 'Not connected yet'}</span>
  </header>
  <p class="src">${sourceLine(p)}${p.status === 'connected' ? ` · ${filled} of ${metrics.length} figures filled` : ''}</p>
  ${body}
</section>`;
}

function kpi(label, n, total, tone, help) {
  return `<div class="kpi ${tone}"><span class="kn">${n}<small> / ${total}</small></span><span class="kl">${label}</span><span class="kh">${help}</span></div>`;
}

/** Plain-words panel shown when no platform sent any figure this week. */
function emptyStateHtml(s) {
  if (s.green + s.amber + s.red > 0) return '';
  const none = s.connected === 0;
  return `<div class="emptystate" role="note">
  <strong>${none ? 'No platform is connected to the board yet' : 'No platform sent any figures this week'}</strong>
  <p>${none
    ? `The board itself is working, but none of the ${s.total} platforms is linked to it yet, so there are no figures to show. That is why every platform below says "No data". Once a platform is linked, its figures appear here on the next Monday refresh.`
    : 'The connected platforms answered, but without any figures for this week. Every platform below therefore shows "No data" rather than a number.'}</p>
</div>`;
}

export const CSS = `
/* Layout: Linalysis shell - white 240px sidebar (weeks) + main column of 12px-radius white cards. */
:root{
  --text:#1d1d1f; --muted:#6b6b70; --line:#e5e7eb; --bg:#f7f7f8; --card:#ffffff;
  --brand:#CC3333; --brand-dark:#a8281f; --tint:#fdf2f2;
  --g-bg:#e3f3e6; --g-fg:#11713a; --a-bg:#fdf0d5; --a-fg:#8a5300;
  --r-bg:#fbe2e0; --r-fg:#a3161b; --n-bg:#f0f0f2; --n-fg:#6b6b70;
  --font:"IBM Plex Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --text:#ececee; --muted:#a2a2a8; --line:#34343a; --bg:#151517; --card:#1e1e21;
  --tint:#3a1d1c; --g-bg:#173a24; --g-fg:#8fdca8; --a-bg:#3d2e12; --a-fg:#f3c46b;
  --r-bg:#45201e; --r-fg:#ff9a92; --n-bg:#2a2a2e; --n-fg:#a2a2a8; color-scheme:dark}}
:root[data-theme="dark"]{
  --text:#ececee; --muted:#a2a2a8; --line:#34343a; --bg:#151517; --card:#1e1e21;
  --tint:#3a1d1c; --g-bg:#173a24; --g-fg:#8fdca8; --a-bg:#3d2e12; --a-fg:#f3c46b;
  --r-bg:#45201e; --r-fg:#ff9a92; --n-bg:#2a2a2e; --n-fg:#a2a2a8; color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0}
body{background:var(--bg);color:var(--text);font:15px/1.5 var(--font);-webkit-text-size-adjust:100%}
a{color:var(--brand)}
:focus-visible{outline:2px solid var(--brand);outline-offset:2px;border-radius:6px}
.shell{display:grid;grid-template-columns:240px minmax(0,1fr);min-height:100vh}
.side{background:var(--card);border-right:1px solid var(--line);padding:22px 14px;display:flex;flex-direction:column;gap:18px}
.brand{display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px;padding:0 8px}
.brand .mark{width:28px;height:28px;border-radius:8px;background:var(--brand);color:#fff;display:grid;place-items:center;font-size:14px}
.side .lab{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);padding:0 10px}
.weeks{display:flex;flex-direction:column;gap:3px;margin:0;padding:0;list-style:none}
.weeks a{display:block;text-decoration:none;color:var(--text);padding:7px 12px;border-radius:999px;font-size:14px;font-variant-numeric:tabular-nums}
.weeks a:hover{background:var(--tint)}
.weeks a.on{background:var(--brand);color:#fff;font-weight:600}
.weeks small{display:block;font-size:11.5px;opacity:.75}
.side .ver{margin-top:auto;font-size:12px;color:var(--muted);padding:0 10px}
.main{min-width:0;padding-block:24px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.inner{max-width:1080px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
h1{font-size:24px;margin:0;letter-spacing:-.01em;text-wrap:balance}
.sub{color:var(--muted);font-size:14px;margin:2px 0 0}
.fresh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-radius:12px;padding:11px 14px;font-weight:600;font-size:14px;border:1px solid transparent}
.fresh.green{background:var(--g-bg);color:var(--g-fg)}
.fresh.amber{background:var(--a-bg);color:var(--a-fg);border-color:currentColor}
.fresh.red{background:var(--r-bg);color:var(--r-fg);border-color:currentColor}
.fresh .why{font-weight:400;font-size:13px}
.conn{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--muted)}
.conn.off::before,.conn.ok::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--a-fg)}
.conn.ok::before{background:var(--g-fg)}
.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:2px;border-top:4px solid var(--line)}
.kpi.green{border-top-color:var(--g-fg)}.kpi.amber{border-top-color:var(--a-fg)}.kpi.red{border-top-color:var(--r-fg)}.kpi.grey{border-top-color:var(--n-fg)}
.kn{font:600 28px/1.1 var(--mono);font-variant-numeric:tabular-nums}
.kn small{font-size:14px;font-weight:500;color:var(--muted)}
.emptystate{background:var(--card);border:1px dashed var(--n-fg);border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:4px}
.emptystate strong{font-size:16px}
.emptystate p{margin:0;color:var(--muted);font-size:14px;max-width:70ch}
.fresh .lead b{font-family:var(--mono);font-weight:600}
.kl{font-weight:600;font-size:14px}
.kh{font-size:12.5px;color:var(--muted);line-height:1.35}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin:10px 0 0;font-weight:600}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,460px),1fr));gap:14px;align-items:start}
.tile{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;min-width:0;display:flex;flex-direction:column;gap:10px}
.tilehead{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.tilehead h3{margin:0;font-size:16px;display:flex;align-items:center;gap:8px}
.status{font-size:12px;font-weight:600;border-radius:999px;padding:3px 10px}
.status.on{background:var(--g-bg);color:var(--g-fg)}.status.off{background:var(--n-bg);color:var(--n-fg)}
.src{margin:0;font-size:12.5px;color:var(--muted)}
.dot{width:9px;height:9px;border-radius:50%;flex:0 0 auto;background:var(--n-fg)}
.dot.green{background:var(--g-fg)}.dot.amber{background:var(--a-fg)}.dot.red{background:var(--r-fg)}
.metrics{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),1fr));gap:8px}
.m{border:1px solid var(--line);border-radius:10px;padding:9px 11px;display:flex;justify-content:space-between;align-items:center;gap:10px}
.m .lbl{font-size:13px;line-height:1.35;min-width:0}
.m .hint{display:block;font-size:11.5px;color:var(--muted)}
.pill{border-radius:999px;padding:3px 11px;font:600 14px var(--mono);white-space:nowrap;font-variant-numeric:tabular-nums}
.pill.green{background:var(--g-bg);color:var(--g-fg)}.pill.amber{background:var(--a-bg);color:var(--a-fg)}
.pill.red{background:var(--r-bg);color:var(--r-fg)}.pill.grey{background:var(--n-bg);color:var(--n-fg)}
.pill.empty{font:500 12px var(--font);background:var(--n-bg);color:var(--n-fg);white-space:normal;text-align:right}
.emptytile{border:1px dashed var(--line);border-radius:10px;padding:18px;display:flex;flex-direction:column;gap:4px;color:var(--muted);font-size:13.5px}
.emptytile strong{color:var(--text);font-size:15px}
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--line);border-radius:10px}
table{border-collapse:collapse;width:100%;font-size:13px;min-width:480px}
th,td{padding:7px 10px;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap}
th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);background:var(--bg)}
td.name{font-weight:600;white-space:normal}
tr:last-child td{border-bottom:none}
.cell{display:inline-block;border-radius:6px;padding:1px 8px;font:500 12px var(--mono);min-width:46px;text-align:center}
.cell.green{background:var(--g-bg);color:var(--g-fg)}.cell.amber{background:var(--a-bg);color:var(--a-fg)}
.cell.red{background:var(--r-bg);color:var(--r-fg)}.cell.grey{background:var(--n-bg);color:var(--n-fg)}
.legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;color:var(--muted);border-top:1px solid var(--line);padding-top:14px}
.legend span{display:inline-flex;align-items:center;gap:6px}
.missing{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:28px;text-align:center;color:var(--muted)}
@media (max-width:820px){
  .shell{grid-template-columns:minmax(0,1fr)}
  .side{border-right:0;border-bottom:1px solid var(--line);padding:12px 0;gap:8px}
  .brand,.side .lab{padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
  .side .lab,.side .ver{display:none}
  .weeks{flex-direction:row;overflow-x:auto;gap:6px;padding:2px max(16px,env(safe-area-inset-right,0px)) 4px max(16px,env(safe-area-inset-left,0px));scrollbar-width:none}
  .weeks a{white-space:nowrap;border:1px solid var(--line);padding:5px 12px}
  .weeks a.on{border-color:var(--brand)}
  .weeks small{display:none}
  .kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
  h1{font-size:20px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;

// Keeps the "N days old" banner honest if the tab stays open for days.
const FRESH_JS = `<script>(function(){var b=document.querySelector('[data-generated]');if(!b)return;
var g=new Date(b.getAttribute('data-generated'));var d=Math.max(0,Math.floor((Date.now()-g)/864e5));
var t=d>${STALE_RED_DAYS}?'red':d>${STALE_AMBER_DAYS}?'amber':'green';var miss=b.getAttribute('data-missing');if(miss&&t==='green')t='amber';
b.className='fresh '+t;var s=b.querySelector('.age');if(s)s.textContent=d===0?'today':d===1?'1 day old':d+' days old';
var w=b.querySelector('.why');if(w)w.textContent=whyText(t,d,miss);
function whyText(t,d,miss){var m=miss?miss+' has not been generated yet. ':'';
return t==='green'?'Up to date':t==='amber'?m+(d>${STALE_AMBER_DAYS}?'Older than ${STALE_AMBER_DAYS} days.':''):m+'Older than ${STALE_RED_DAYS} days: the weekly refresh is not running.';}})();</script>`;

/** Banner tone + explanation. `expectedWeek` = the ISO week that should exist by now (home page only). */
export function bannerState(snap, now = new Date(), expectedWeek = null) {
  const f = freshness(snap.generatedAt, now);
  const missing = expectedWeek && snap.week < expectedWeek ? expectedWeek : null;
  let tone = f.tone;
  if (missing && tone === 'green') tone = 'amber';
  const m = missing ? `${missing} has not been generated yet. ` : '';
  const why = tone === 'green' ? 'Up to date'
    : tone === 'amber' ? m + (f.days > STALE_AMBER_DAYS ? `Older than ${STALE_AMBER_DAYS} days.` : '')
    : m + `Older than ${STALE_RED_DAYS} days: the weekly refresh is not running.`;
  return { ...f, tone, missing, why: why.trim() };
}

function sidebar(weeks, current) {
  const items = (weeks || []).map(w => `<li><a class="${w.week === current ? 'on' : ''}" href="/w/${esc(w.week)}"${w.week === current ? ' aria-current="page"' : ''}>${esc(w.week)}${w.range ? `<small>${esc(w.range)}</small>` : ''}</a></li>`).join('');
  return `<nav class="side" aria-label="Weeks">
  <div class="brand"><span class="mark">D</span>Dash weekly board</div>
  <div class="lab">Weeks</div>
  <ul class="weeks">${items}</ul>
  <div class="ver">Dash v${VERSION}</div>
</nav>`;
}

export function weekRange(snap) {
  if (!snap.start || !snap.end) return '';
  const a = new Date(snap.start), b = new Date(snap.end);
  const sameMonth = a.getUTCMonth() === b.getUTCMonth();
  return `${a.getUTCDate()}${sameMonth ? '' : ' ' + MONTHS[a.getUTCMonth()]} – ${fmtDate(b)}`;
}

// Safety net for snapshots written by the old live Worker (W35, W40, W42),
// which stored text such as "Missing secret(s): LINALYSIS_TOKEN".
const SECRET_NAME_RE = /\b[A-Z][A-Z0-9]*_(?:TOKEN|PASSWORD|EMAIL|SECRET|KEY|API_KEY)\b/g;
export const scrubSecrets = t => String(t).replace(SECRET_NAME_RE, '[hidden]');

function page(title, inner0, weeks, current, { fragment = false, topBar = '' } = {}) {
  const inner = scrubSecrets(inner0);
  const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;600&display=swap">`;
  const body = `${topBar}<div class="shell">${sidebar(weeks, current)}<main class="main"><div class="inner">${inner}</div></main></div>${FRESH_JS}`;
  if (fragment) return `<title>${esc(title)}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${fonts}\n<style>${CSS}</style>\n${body}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)}</title>
${fonts}
<style>${CSS}</style></head><body>${body}</body></html>`;
}

/** Full board for one stored weekly snapshot. */
export function renderBoard(snap, weeks, now = new Date(), opts = {}) {
  const f = bannerState(snap, now, opts.expectedWeek);
  const s = summarise(snap);
  const conn = connectionLine(snap);
  const why = f.why;
  const inner = `
<header>
  <h1>Weekly Board · ${esc(snap.week)}</h1>
  <p class="sub">${esc(weekRange(snap))} · the week's activity across every platform (Monday to Sunday, Paris time)</p>
</header>
<div class="fresh ${f.tone}" role="status" data-generated="${esc(new Date(snap.generatedAt).toISOString())}"${f.missing ? ` data-missing="${esc(f.missing)}"` : ''}>
  <span class="lead">Latest report: <b>${esc(snap.week)}</b> (${esc(weekRange(snap))}) · generated ${esc(fmtDate(snap.generatedAt))} · <span class="age">${esc(f.text.split(' · ')[1])}</span></span>
  <span class="why">${esc(why)}</span>
</div>
<div class="conn ${conn.ok ? 'ok' : 'off'}">${esc(conn.text)}</div>
<div class="kpis">
  ${kpi('On track', s.green, s.total, 'green', 'Platforms with every figure at or above target')}
  ${kpi('Watch', s.amber, s.total, 'amber', 'Platforms with a figure slipping')}
  ${kpi('Action needed', s.red, s.total, 'red', 'Platforms with a figure below target')}
  ${kpi('No data', s.nodata, s.total, 'grey', 'Not connected, not responding, or no figures this week')}
</div>
${emptyStateHtml(s)}
<h2>Platform by platform</h2>
<div class="tiles">${(snap.platforms || []).map(tileHtml).join('')}</div>
<div class="legend">
  <span><span class="dot green"></span>On track</span>
  <span><span class="dot amber"></span>Watch</span>
  <span><span class="dot red"></span>Action needed</span>
  <span><span class="dot"></span>No data</span>
  <span>Counts are per platform. The banner turns orange after ${STALE_AMBER_DAYS} days or when the expected week is missing, and red after ${STALE_RED_DAYS} days.</span>
</div>`;
  return page(opts.title || `Weekly Board — ${snap.week} · dash.gershoncrm.com`, inner, weeks, snap.week, opts);
}

/** Page for a week that has not been generated (visitors never trigger a run). */
export function renderMissing(week, weeks, opts = {}) {
  const inner = `<header><h1>Weekly Board${week ? ' · ' + esc(week) : ''}</h1></header>
<div class="missing"><strong>This week has not been generated yet.</strong><br>The board refreshes automatically every Monday. Pick another week on the left.</div>`;
  return page('Weekly Board · dash.gershoncrm.com', inner, weeks, week, opts);
}

/**
 * Home-page empty state (v1.2): the current week's board does not exist yet.
 * Shown instead of an old week. `wk` = {week, start, end} of the current ISO week.
 */
export function renderPreparing(wk, weeks, opts = {}) {
  const range = weekRange(wk);
  const list = [{ week: wk.week, range }, ...(weeks || []).filter(w => w.week !== wk.week)];
  const inner = `<header><h1>Weekly Board · ${esc(wk.week)}</h1>
  <p class="sub">${esc(range)} · the week's activity across every platform (Monday to Sunday, Paris time)</p></header>
<div class="emptystate preparing" role="status">
  <strong>This week's board is being prepared</strong>
  <p>The board for ${esc(wk.week)} is created automatically every Monday (12:15 UTC). Reload this page in a few minutes. Earlier weeks are in the week list.</p>
</div>`;
  return page(`Weekly Board — ${wk.week} · dash.gershoncrm.com`, inner, list, wk.week, opts);
}
