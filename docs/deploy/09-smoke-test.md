# Phase 9 — Smoke Test & Handoff

**Time:** 10 min. **Operator:** Ariel.

## 9.1 First admin user

**Option A (preferred):** register via the UI as `olivier@gershonconsulting.com` (generate a strong password → 1Password as "GershonCRM Olivier admin"), then promote:

```bash
psql -U gershoncrm_app -d gershoncrm -h localhost -W
```
```sql
UPDATE users SET role = 'admin' WHERE email = 'olivier@gershonconsulting.com';
```

**Option B (if registration is broken):** check `server/auth-utils.ts` for the hash scheme (it uses scrypt `salt:hash`), generate a hash with Node matching that exact format, INSERT the user row directly. Match the code, don't guess.

## 9.2 Smoke checklist

- [ ] Login → redirects to pipeline
- [ ] Kanban loads
- [ ] Create a contact; create a deal; drag deal between stages
- [ ] Create a task linked to a contact
- [ ] Dashboard stats render
- [ ] Settings + `/adminpanel` load
- [ ] Logout works
- Delete the test records after.

## 9.3 Verify CSV data import

`loadInitialData()` runs at startup and imports the Streak CSVs from `attached_assets/`, so data should already be in:

```sql
SELECT COUNT(*) FROM contacts;
SELECT COUNT(*) FROM deals;
SELECT COUNT(*) FROM deal_stages;
```

Zeros → check `pm2 logs gershoncrm --lines 200 | grep -i "initial data"`.

## 9.4 Nightly backup

```bash
mkdir -p ~/backups
cat > ~/backup-db.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M%S)
export PGPASSWORD='<DB_PW>'
pg_dump -U gershoncrm_app -h localhost -d gershoncrm | gzip > ~/backups/gershoncrm-$STAMP.sql.gz
find ~/backups -name "gershoncrm-*.sql.gz" -mtime +14 -delete
EOF
chmod 700 ~/backup-db.sh
~/backup-db.sh && ls -la ~/backups/          # test run
(crontab -l 2>/dev/null; echo "0 3 * * * /home/deploy/backup-db.sh") | crontab -
```

Local-only for now; offsite sync (rclone → B2/Drive) is a post-launch item — mention it in the handoff.

## 9.5 File the 5 known issues

On GitHub, one Issue each (details in `docs/DEPLOY.md` § Known issues):
1. Gate `loadInitialData()` behind env var
2. Read PORT from env
3. Add `/api/health` endpoint
4. Multi-tenancy: `workspace_id` on all tables
5. Session store → `connect-pg-simple`

## 9.6 Handoff report to Olivier

Site URL + confirmation live · admin credentials location in 1Password · row counts · Actions run link · issues links · backup confirmation · `EXECUTION_LOG.md` committed.

Final commit: `git commit -am "deploy: phase 9 complete - handoff" && git push`
