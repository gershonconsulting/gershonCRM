// Dash weekly board - data collection (runs on the Monday schedule only).
//
// Secret / env-var NAMES are logged here with console.warn so they show in
// the Cloudflare Worker logs ("wrangler tail" / dashboard Logs). They are
// NEVER put into the snapshot, so they can never reach the public page.
//
// IMPORTANT: the upstream "weekly" endpoints below are the contract this
// rebuild expects. The original live Worker's source is not in GitHub; before
// deploying, compare these paths with the live Worker (Cloudflare dashboard ->
// Workers -> dash -> Edit code) and copy any per-platform mapping across.

export const PLATFORMS = [
  { id: 'client', name: 'Client CRM', host: 'client.gershoncrm.com', secrets: ['CLIENT_EMAIL', 'CLIENT_PASSWORD'], path: '/api/weekly', auth: 'login' },
  { id: 'social', name: 'Social', host: 'social.gershoncrm.com', secrets: ['SOCIAL_TOKEN'], path: '/api/weekly', auth: 'bearer' },
  { id: 'linalysis', name: 'Linalysis', host: 'api.linalysis.net', secrets: ['LINALYSIS_TOKEN'], path: '/weekly', auth: 'bearer' },
  { id: 'finance', name: 'Finance', host: 'finance.gershoncrm.com', secrets: ['FINANCE_TOKEN'], path: '/api/weekly', auth: 'bearer' },
  { id: 'nexashare', name: 'NexaShare', host: 'nexashare.com', secrets: ['NEXASHARE_TOKEN'], path: '/api/weekly', auth: 'bearer' },
];

/** ISO week (Monday start) that ended before `now`. Dates are UTC midnights. */
export function previousIsoWeek(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7;            // Mon=0
  const thisMonday = new Date(d - dow * 86400000);
  const start = new Date(thisMonday - 7 * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  return { week: isoWeekLabel(start), start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function isoWeekLabel(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3);          // Thursday of this week
  const year = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const wk = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${year}-W${String(wk).padStart(2, '0')}`;
}

async function collectOne(p, env, wk, fetchImpl) {
  const base = { id: p.id, name: p.name, host: p.host, metrics: [] };
  const missing = p.secrets.filter(s => !env[s]);
  if (missing.length) {
    console.warn(`[dash] ${p.name}: not connected - missing secret(s): ${missing.join(', ')}`);
    return { ...base, status: 'not_connected' };
  }
  const headers = { accept: 'application/json' };
  if (p.auth === 'bearer') headers.authorization = `Bearer ${env[p.secrets[0]]}`;
  if (p.auth === 'login') headers.authorization = 'Basic ' + btoa(`${env[p.secrets[0]]}:${env[p.secrets[1]]}`);
  const url = `https://${p.host}${p.path}?week=${encodeURIComponent(wk.week)}&start=${wk.start}&end=${wk.end}`;
  try {
    const r = await fetchImpl(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!r.ok) {
      console.warn(`[dash] ${p.name}: HTTP ${r.status} from ${p.host}${p.path}`);
      return { ...base, status: 'unreachable' };
    }
    const data = await r.json();
    // Expected shape: { metrics:[{label,value,tone,hint}], table?:{columns,rows}, sourceNote? }
    const metrics = Array.isArray(data.metrics) ? data.metrics.map(m => ({
      label: String(m.label ?? ''), value: m.value ?? null,
      tone: ['green', 'amber', 'red', 'grey'].includes(m.tone) ? m.tone : 'grey',
      hint: m.hint ? String(m.hint) : undefined,
    })) : [];
    return { ...base, status: 'connected', metrics, table: data.table, sourceNote: data.sourceNote };
  } catch (e) {
    console.warn(`[dash] ${p.name}: request failed - ${e && e.message}`);
    return { ...base, status: 'unreachable' };
  }
}

/** Build one weekly snapshot. Never throws; a failing platform becomes "unreachable". */
export async function collectWeek(env, wk, { fetchImpl = fetch, now = new Date() } = {}) {
  const platforms = await Promise.all(PLATFORMS.map(p => collectOne(p, env, wk, fetchImpl)));
  return { schema: 2, week: wk.week, start: wk.start, end: wk.end, generatedAt: now.toISOString(), platforms };
}
