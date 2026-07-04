# ARIEL — MISSION BRIEF: GershonCRM Deployment

**From:** Olivier (via Claude CTO)
**Agent:** Ariel (Claude Cowork)
**Project:** GershonCRM — a Streak.com replica as a **standalone web platform**. Explicitly NOT integrated with Gmail. No Google OAuth, no inbox sync, no email tracking in this phase. It is a pipeline-CRM web app with its own login.
**Target:** Live at `https://crm.gershoncrm.com` with auto-deploy on push to `main`.

---

## Your two missions, in order

### Mission 1 — Commit the deploy runbook to GitHub (do this immediately)

The zip Olivier gave you (`gershoncrm-deploy-runbook.zip`) is a **delta**: 18 new/updated files to overlay onto the existing repo. GitHub already holds the app code (5 commits on `main`).

Contents: `README.md`, `.env.example`, `.nvmrc`, `.gitignore` (replaces the existing one), `docs/ARIEL_MISSION.md` (this file), `docs/DEPLOY.md`, `docs/HANDOFF.md`, `docs/ROADMAP.md`, `docs/deploy/01…09`, `docs/deploy/deploy.yml.template` (moved to `.github/workflows/` in Phase 8), `temp-uploads/.gitkeep`.

Steps:
1. `git clone https://github.com/gershonconsulting/gershonCRM.git && cd gershonCRM` (public repo, no auth to read).
2. Unzip the delta **on top of** the clone root so paths merge (`unzip -o ../gershoncrm-deploy-runbook.zip -d .`). The only overwrite is `.gitignore` — expected.
3. `git add -A && git status` — confirm ~18 additions, one modification (`.gitignore`), and NOTHING else changed.
4. Authenticate with the GitHub PAT from 1Password vault **"GershonCRM Deploy"**: `git remote set-url origin https://<PAT>@github.com/gershonconsulting/gershonCRM.git`, then after pushing **immediately reset**: `git remote set-url origin https://github.com/gershonconsulting/gershonCRM.git`. Never write the PAT to any file, log, or output.
5. `git commit -m "docs: add production deploy runbook + CI/CD workflow" && git push origin main`
6. Verify on github.com that `docs/DEPLOY.md` renders.

Note: the CI workflow is parked at `docs/deploy/deploy.yml.template`; you activate it in Phase 8 (move + push with your PAT, which has workflow scope). The first run fails until the three secrets exist — expected.

**Stop and report to Olivier after Mission 1. Do not start Mission 2 until he confirms the VPS is provisioned.**

### Mission 2 — Execute the deployment (after Olivier says GO)

Follow `docs/DEPLOY.md` phases 0→9 exactly. You are the operator the runbook calls "Charles/operator" — read `docs/HANDOFF.md` for context but ignore human-specific instructions (billing, screenshots via phone, etc.).

Prerequisites you'll find in 1Password vault "GershonCRM Deploy":
- VPS public IP + root password
- GitHub PAT
- OPENAI_API_KEY
- Postgres password (you generate this in Phase 3 and SAVE IT to the vault)

**Division of labor — important:**
- **You (Ariel) handle:** all terminal/SSH work — VPS hardening, runtime install, Postgres, clone/build/PM2, nginx, certbot, backup cron. You can run `ssh`, `scp`, and interactive commands.
- **Charles (Chrome agent) handles:** Cloudflare dashboard (Phase 5 DNS record, Phase 7 proxy toggle + SSL mode) and GitHub Secrets UI (Phase 8). His own brief is at `docs/CHARLES_MISSION.md`. When you reach those phases, tell Olivier which Charles task is up (they're numbered 1-3 in his brief) and pause until Olivier confirms Charles reported done.
- **Olivier handles:** nothing during execution. He already did his part (VPS purchase, 1Password).

**Interactive-command notes (learned the hard way, don't rediscover):**
- `npm run db:push` prompts for confirmation. Run it in a TTY or append `--force`.
- `certbot --nginx` asks 4 questions. Answers: email `olivier@gershonconsulting.com`, agree ToS, no EFF mail, option 2 (redirect).
- Phase 1 SSH lockdown: verify key auth works in a SECOND session before closing the first. If you lock yourself out, Hostinger VNC console is the recovery path — flag Olivier immediately.

**Checkpoints — report to Olivier at the end of each phase** with: phase number, exit-criteria checklist status, any deviation from the runbook. Format: short. He is not technical; write the summary for a CEO, keep the detail in a log file you maintain at `docs/deploy/EXECUTION_LOG.md` (commit it as you go).

**Hard rules:**
1. Secrets live in 1Password only. Never in commits, logs, or chat output. `.env` stays on the VPS with `chmod 600`.
2. Do not modify app code. If you find a bug, file a GitHub Issue and continue. The 5 known issues in `DEPLOY.md` are already catalogued — file them as Issues in Phase 9 as instructed.
3. If a phase fails twice on the same error, stop, write up the failure in EXECUTION_LOG.md, and escalate to Olivier. Do not improvise architecture changes (no switching to Docker, no swapping nginx for Caddy, etc.).
4. Scope guard: this is a **standalone** platform. If anything in the codebase or your reasoning suggests adding Gmail/Google Workspace integration, park it — out of scope by explicit product decision.

## Success = Phase 9 exit criteria

- `https://crm.gershoncrm.com` live, SSL valid, behind Cloudflare (Full strict)
- Olivier's admin account created, credentials in 1Password
- MAbSilico Streak data visible in the pipeline UI
- Push-to-deploy pipeline proven with a live test
- Nightly Postgres backup cron installed
- 5 GitHub Issues filed
- EXECUTION_LOG.md committed

Good luck. — Claude (CTO)
