# GershonCRM — Project Handoff (background for the deploy operator)

## What this is

GershonCRM is a Streak.com-style CRM, built as a SaaS product for Gershon Consulting clients — global B2B companies entering the US market. It replicates Streak's pipeline/box model as a **standalone web platform**: unlike Streak, it does NOT live inside Gmail and has no Google integration. Own login, own UI, own database.

Eventual home: `https://crm.gershonCRM.com`.

- **Current state:** MVP scaffold built in a Replit session — React + Express + Postgres + Drizzle. Pipeline kanban, contacts, deals, tasks, activities, CSV import from Streak exports, role-based auth (client/manager/admin).
- **Tech stack is frozen for this deploy.** Deploy as-is; iterate after.
- **This first deploy is single-tenant.** Olivier is the only user initially. Multi-tenancy is a separate refactor scheduled after the first weeks of dogfooding.

## Who's who

- **Olivier** — founder, non-technical CEO. Makes purchases (VPS), owns 1Password, approves phase transitions.
- **Claude (claude.ai)** — CTO. Wrote this runbook, makes architecture decisions. Escalation point via Olivier.
- **Ariel (Claude Cowork)** — deploy operator for all terminal/SSH/repo work.
- **Charles (Claude in Chrome)** — operator for browser-GUI steps: Cloudflare dashboard, GitHub Secrets UI.

## Inputs (1Password vault "GershonCRM Deploy")

1. VPS public IP — Hostinger KVM 2, Ubuntu 22.04/24.04, NY datacenter
2. VPS root password — single-use; root SSH gets disabled in Phase 1
3. Cloudflare access for the `gershonCRM.com` zone
4. GitHub PAT scoped to `gershonconsulting/gershonCRM` — `repo` + `workflow` — 90-day expiry
5. `OPENAI_API_KEY`

If anything is missing from the vault, stop and flag Olivier. Secrets travel through 1Password only — never email, chat, or commits.

## Outputs (what "done" means)

- Live, SSL-protected app at `https://crm.gershonCRM.com` behind Cloudflare (Full strict)
- Auto-deploy proven: push to `main` → live in ~2 min
- Olivier's admin account created, credentials in 1Password
- MAbSilico Streak data visible in the UI
- Nightly Postgres backup cron installed
- 5 GitHub Issues filed (list at the bottom of `DEPLOY.md`)
- `docs/deploy/EXECUTION_LOG.md` committed with a record of every phase

## Ground rules

1. **All secrets in 1Password.** The repo is public for now — assume every committed file is world-readable.
2. **One commit per phase minimum** (`deploy: phase N complete - <summary>`) so we can bisect if something breaks.
3. **Don't change app code during deploy.** Found a bug? File an Issue, keep moving. The 5 known issues are already catalogued.
4. **Stuck 30 minutes on one error → stop, log it, escalate to Olivier.** No architecture improvisation (no Docker, no Caddy, no stack swaps).
