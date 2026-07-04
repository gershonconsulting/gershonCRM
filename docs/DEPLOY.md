# GershonCRM — Production Deploy Runbook

> **Audience:** the deploy operator — Ariel (Claude Cowork) with Charles (Claude Chrome) for browser-GUI steps. Written so a human freelancer could also follow it.
> **Goal:** Take the code from `main` → live at `https://crm.gershonCRM.com` with automated deploys on every push.
> **Time:** ~90 min end-to-end if nothing goes sideways.

Operators: read [`ARIEL_MISSION.md`](./ARIEL_MISSION.md) first — it defines who does what. [`HANDOFF.md`](./HANDOFF.md) has the project background.

---

## Stack

| Layer           | Tech                                             |
| --------------- | ------------------------------------------------ |
| Frontend        | React 18 + Vite + TypeScript + Tailwind          |
| Backend         | Node.js 20 + Express + Drizzle ORM               |
| Database        | PostgreSQL 16 (local on the VPS)                 |
| Process manager | PM2                                              |
| Reverse proxy   | nginx                                            |
| SSL             | Let's Encrypt via certbot                        |
| CDN / DNS       | Cloudflare                                       |
| Host            | Hostinger KVM VPS (Ubuntu 22.04 or 24.04)        |
| CI/CD           | GitHub Actions → SSH into VPS → `git pull` + PM2 |

## Product scope guard

GershonCRM is a **standalone** Streak.com-style CRM. It is explicitly **not** integrated with Gmail or Google Workspace. No Google OAuth, no inbox sync, no email tracking in this phase. Do not add any of these during deployment.

---

## Prerequisites (1Password shared vault "GershonCRM Deploy")

1. **VPS public IP** (provisioned by Olivier in his Hostinger account — KVM 2, Ubuntu 22.04/24.04, NY datacenter)
2. **VPS root password** (single-use — replaced by SSH key auth in Phase 1)
3. **Cloudflare access** to the `gershonCRM.com` zone (for Charles/browser steps)
4. **GitHub PAT** with `repo` + `workflow` scope for `gershonconsulting/gershonCRM` (90-day expiry)
5. **OPENAI_API_KEY** — used by the AI features in the CRM

Do not proceed past Phase 0 until all five are in the vault.

---

## Phases at a glance

| # | Phase | Time | Operator | Artifact |
|---|-------|------|----------|----------|
| 0 | Pre-flight checks | 5 min | Ariel | Confirmed prereqs |
| 1 | VPS bootstrap & hardening | 15 min | Ariel | Non-root sudo user, firewall, SSH keys |
| 2 | Install runtime | 10 min | Ariel | Node 20, Postgres 16, nginx, PM2, certbot |
| 3 | Database setup | 5 min | Ariel | `gershoncrm` DB + app user |
| 4 | Deploy app | 15 min | Ariel | App running on `127.0.0.1:5000` via PM2 |
| 5 | Cloudflare DNS (proxy OFF) | 5 min | **Charles** | `crm.gershonCRM.com` → VPS IP |
| 6 | nginx + SSL | 10 min | Ariel | HTTPS live via Let's Encrypt |
| 7 | Cloudflare proxy ON | 5 min | **Charles** | Orange cloud, Full (strict) SSL |
| 8 | GitHub Actions auto-deploy | 10 min | Ariel + **Charles** (Secrets UI) | Push to `main` → auto-redeploy |
| 9 | Smoke test + handoff | 10 min | Ariel | First admin account created |

Sub-documents live in `docs/deploy/` — one per phase, each with exit criteria and a Troubleshooting section.

---

## Phase 0 — Pre-flight

- [ ] All 5 prereqs are in the 1Password vault.
- [ ] SSH works: `ssh root@<VPS_IP>` with the root password gives a shell.
- [ ] `gershonCRM.com` is on Cloudflare: `dig NS gershoncrm.com +short` returns two `*.ns.cloudflare.com` hosts. Anything else → **stop and tell Olivier**.

---

## Phases 1–9

Follow the numbered files in [`deploy/`](./deploy/) in order. Every phase ends with exit criteria — do not continue to the next phase until all boxes check.

---

## Known issues to fix post-launch (file as GitHub Issues in Phase 9, not blocking)

1. **`server/index.ts` runs `loadInitialData()` on every restart** — re-seeds DB from CSVs in `attached_assets/`. Fine for first deploy (gives us data to dogfood). Fix: gate behind `LOAD_INITIAL_DATA=true` env var.
2. **Port hardcoded to 5000** in `server/index.ts`. Should read `process.env.PORT`. Low priority — nginx proxies to 5000 anyway.
3. **No `/api/health` endpoint** — add one returning 200 + DB ping for uptime monitoring.
4. **No multi-tenancy** — every user shares one workspace. The big product refactor before onboarding external clients. Track separately.
5. **Session store is in-memory (`memorystore`)** — sessions wipe on every deploy. Move to `connect-pg-simple` (already in package.json).

---

## When things go wrong

Each phase doc has a Troubleshooting section. If stuck beyond those, collect: (1) exact command, (2) full error output, (3) `pm2 logs gershoncrm --lines 100` if app-related, (4) `sudo tail -50 /var/log/nginx/error.log` if HTTP-related — write them to `docs/deploy/EXECUTION_LOG.md` and escalate to Olivier.

---

## Credentials created along the way (all go in 1Password)

| Item                                    | Created in |
| --------------------------------------- | ---------- |
| VPS SSH key for `deploy` user           | Phase 1    |
| Postgres password for `gershoncrm_app`  | Phase 3    |
| `.env` `SESSION_SECRET`                 | Phase 4    |
| GitHub Actions SSH deploy key (private) | Phase 8    |

Never commit any of these. `.gitignore` excludes `.env` — verify before every commit.
