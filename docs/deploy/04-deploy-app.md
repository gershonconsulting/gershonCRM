# Phase 4 — Deploy the App

**Time:** 15 min. **Operator:** Ariel.

## 4.1 Directory

```bash
sudo mkdir -p /var/www && sudo chown deploy:deploy /var/www && cd /var/www
```

## 4.2 Clone

```bash
git clone https://github.com/gershonconsulting/gershonCRM.git
cd gershonCRM
```

(Repo is public — no auth for read. If it's been made private, clone with the PAT from 1Password: `git clone https://<PAT>@github.com/gershonconsulting/gershonCRM.git` — the PAT lands in `.git/config` on the VPS, acceptable since only `deploy` can read it.)

## 4.3 Create `.env`

```bash
SESSION_SECRET=$(openssl rand -hex 32)
# Save SESSION_SECRET to 1Password as "GershonCRM SESSION_SECRET"

cat > .env <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://gershoncrm_app:<DB_PW>@localhost:5432/gershoncrm
SESSION_SECRET=$SESSION_SECRET
OPENAI_API_KEY=<from 1Password>
EOF
chmod 600 .env
cat .env   # verify real values, no placeholders left
```

**Never commit `.env`** — `.gitignore` covers it; verify with `git status`.

## 4.4 Install

```bash
npm ci    # 60-120s; peer-dep warnings are fine
```

## 4.5 Create tables

```bash
npm run db:push
# Interactive: confirm when Drizzle prompts. Creates: users, contacts, deal_stages, deals, tasks, activities.
psql -U gershoncrm_app -d gershoncrm -h localhost -W -c '\dt'   # expect 6 tables
```

## 4.6 Build

```bash
npm run build
ls dist/    # expect: index.js + public/
```

## 4.7 Start with PM2

```bash
pm2 start dist/index.js --name gershoncrm
pm2 save
pm2 status                       # gershoncrm online
pm2 logs gershoncrm --lines 50   # expect "Loading initial data..." then "serving on port 5000"
```

## 4.8 Survive reboots

```bash
pm2 startup   # run the sudo command it prints
pm2 save
# Optional: sudo reboot, wait 60s, ssh back, pm2 status -> still online
```

## 4.9 Local smoke test

```bash
curl -s http://127.0.0.1:5000/api/dashboard/stats | head -c 500   # JSON expected
```

## Exit criteria

- [ ] PM2 shows online, logs clean, JSON from the stats endpoint, reboot-safe

Commit: `git commit --allow-empty -m "deploy: phase 4 complete - app on PM2" && git push`

## Troubleshooting

**"DATABASE_URL is not defined":** `.env` not in the app cwd. `pm2 show gershoncrm` → `exec cwd` must be `/var/www/gershonCRM`. Fix: `pm2 delete gershoncrm && cd /var/www/gershonCRM && pm2 start dist/index.js --name gershoncrm`.
**"ECONNREFUSED :5432":** `sudo systemctl start postgresql`.
**"password authentication failed":** `.env` DB password ≠ Phase 3 password.
**"EADDRINUSE :5000":** `sudo lsof -i :5000` → kill the squatter → `pm2 restart gershoncrm`.
**`db:push` hangs:** it's waiting on its interactive prompt — run in a real TTY or append `--force`.
