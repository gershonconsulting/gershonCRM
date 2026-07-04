# Phase 3 — Database Setup

**Time:** 5 min. **Operator:** Ariel.

## 3.1 Generate app DB password

```bash
openssl rand -base64 32 | tr -d '+/=' | head -c 32
```

Save output to 1Password as **"GershonCRM Postgres app user password"** — called `<DB_PW>` below. (The `tr` strips URL-hostile characters so no encoding needed later.)

## 3.2 Create database + user

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE gershoncrm;
CREATE USER gershoncrm_app WITH ENCRYPTED PASSWORD '<DB_PW>';
GRANT ALL PRIVILEGES ON DATABASE gershoncrm TO gershoncrm_app;
\c gershoncrm
GRANT ALL ON SCHEMA public TO gershoncrm_app;
ALTER DATABASE gershoncrm OWNER TO gershoncrm_app;
\q
```

> The `\c` + schema GRANT + OWNER trio is required on Postgres 15+ (public schema privileges were tightened). Skipping it makes `npm run db:push` fail with "permission denied for schema public".

## 3.3 Verify

```bash
psql -U gershoncrm_app -d gershoncrm -h localhost -W
# enters gershoncrm=> prompt; \dt shows no tables yet (expected); \q
```

## 3.4 Connection string for Phase 4

```
postgresql://gershoncrm_app:<DB_PW>@localhost:5432/gershoncrm
```

## Exit criteria

- [ ] App user connects via TCP (`-h localhost`)
- [ ] Password in 1Password

## Troubleshooting

**"Peer authentication failed":** add `-h localhost` (forces TCP auth instead of Unix-socket peer auth).
**"permission denied for schema public":** re-run the GRANT/OWNER statements as postgres superuser: `sudo -u postgres psql -d gershoncrm`.
