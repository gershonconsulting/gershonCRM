# CHARLES — MISSION BRIEF: GershonCRM Deployment (Browser Operations)

**From:** Olivier (via Claude CTO)
**Agent:** Charles (Claude in Chrome)
**Project:** GershonCRM — a Streak.com replica as a **standalone platform** (no Gmail integration). Deployment target: `https://crm.gershoncrm.com` on a Hostinger VPS.
**Your role:** You own the **web-dashboard steps** of the deployment. Ariel (Cowork) owns all terminal/SSH work and will be executing `docs/DEPLOY.md` phases 0→9. Three of those phases require dashboard clicks that only you perform. Ariel will ping Olivier when she reaches each one; Olivier relays to you; you execute, verify, and report back so Ariel can continue.

Background reading (skim, don't study): [`HANDOFF.md`](./HANDOFF.md) · [`DEPLOY.md`](./DEPLOY.md)

---

## Your three tasks, in the order they'll arrive

### TASK 1 — Cloudflare: create the DNS record, proxy OFF (deploy Phase 5)

**Trigger:** Ariel reports Phase 4 complete (app running on the VPS).
**Where:** https://dash.cloudflare.com → zone `gershoncrm.com` → **DNS** → **Records** → **Add record**

| Field | Value |
|---|---|
| Type | `A` |
| Name | `crm` |
| IPv4 address | the VPS IP — from 1Password vault "GershonCRM Deploy" |
| Proxy status | **DNS only** (GREY cloud — if the cloud icon is orange, click it to turn it grey) |
| TTL | Auto |

Save.

**⚠️ The single most important detail of your whole mission:** the proxy must be **OFF (grey)** at this stage. Ariel is about to run certbot, whose validation must reach the VPS directly. If you leave the cloud orange, her Phase 6 fails and you'll both lose 30 minutes diagnosing it.

**Verify before reporting done:** the record list shows `crm` / A / `<VPS_IP>` / "DNS only".
**Report to Olivier:** "Phase 5 done — crm A record created, proxy OFF." Ariel takes over.

---

### TASK 2 — Cloudflare: SSL settings + proxy ON (deploy Phase 7)

**Trigger:** Ariel reports Phase 6 complete (HTTPS live on the origin via Let's Encrypt).
**Where:** https://dash.cloudflare.com → zone `gershoncrm.com`

Do these **in this exact order**:

1. **SSL/TLS → Overview** → Encryption mode → select **Full (strict)**.
   - Not "Flexible". Not "Full". **Full (strict)**. Flexible causes an infinite redirect loop; this is the #1 failure mode of the entire deployment.
2. **SSL/TLS → Edge Certificates**:
   - **Always Use HTTPS** → ON
   - **Minimum TLS Version** → 1.2
   - **Automatic HTTPS Rewrites** → ON
3. **DNS → Records** → find the `crm` A record → click the grey cloud → it turns **ORANGE (Proxied)**. Save.
4. Optional hardening (do if the UI makes it quick, skip if any friction):
   - **Security → Bots** → Bot Fight Mode → ON
   - A cache rule bypassing cache for `crm.gershoncrm.com/api/*`

**Verify before reporting done:** open https://crm.gershoncrm.com in a fresh tab — the login page loads, padlock valid, **no redirect-loop error**. If you see ERR_TOO_MANY_REDIRECTS: encryption mode is not Full (strict) — go back to step 1.
**Report to Olivier:** "Phase 7 done — proxy ON, Full (strict), site loads through Cloudflare."

---

### TASK 3 — GitHub: create the three Actions secrets (deploy Phase 8)

**Trigger:** Ariel reports she has generated the deploy SSH key and saved it to 1Password.
**Where:** https://github.com/gershonconsulting/gershonCRM → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** (three times)

| Secret name (exact, case-sensitive) | Value |
|---|---|
| `VPS_HOST` | the VPS public IP (1Password vault "GershonCRM Deploy") |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | the full private key from 1Password item "GershonCRM GitHub Actions SSH key" — paste EVERYTHING including the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines |

**Paste hygiene for `VPS_SSH_KEY`:** no leading/trailing blank lines, no added spaces at line starts. Copy exactly as stored in 1Password.

**Verify before reporting done:** the Actions secrets page lists all three names.
**Report to Olivier:** "Phase 8 secrets done — VPS_HOST, VPS_USER, VPS_SSH_KEY created." Ariel then triggers and verifies the first auto-deploy.

---

## Ground rules

1. **Secrets never leave 1Password and the target UI.** Never write the VPS IP, passwords, or keys into chat logs, screenshots you share, or any file. When reporting, name the secret, never its value.
2. **Exact-order discipline in Task 2.** SSL mode BEFORE proxy toggle. Reversing them creates a window where the site breaks publicly.
3. **You only touch what's listed here.** No other DNS records in the zone (there are existing records for other Gershon properties — do not modify, "clean up", or delete anything), no other GitHub settings, no Cloudflare zone-level changes beyond those listed.
4. **Blocked or something looks different from these instructions?** Stop, screenshot (without secrets visible), report to Olivier. Do not improvise.
5. **Repo visibility:** the repo is public for now. Do NOT change it during deployment. Flipping it private is a post-launch step Olivier will schedule (it requires re-checking the VPS clone auth first — Ariel's concern, not yours).

## Timeline expectation

Your three tasks total ~15 minutes of clicking, spread across Ariel's ~90-minute run. Availability matters more than speed — Ariel is blocked while each of your tasks is pending.

---

## HOW YOU REPORT, AS OF 3 SEPTEMBER 2026 — read this before anything else

The three tasks above still say *"Report to Olivier."* **That is no longer how you close a
task.** A sentence in a chat is not a record: two days later nobody can tell a task you
finished from a task you never saw.

From now on every request you receive is a **checkpoint** — a file in this repo under
[`checkpoints/`](../checkpoints/). You will be sent its URL. **The file is your whole
brief; nothing will be re-explained in chat.**

When you have done the work:

1. Open the checkpoint file on GitHub → **pencil icon** (Edit).
2. Set `status: CLAIMED`.
3. Fill in the `claim:` block — who, when, and **what you actually saw on screen**:
   ```yaml
   claim:
     by: charles
     at: 2026-09-04T14:12Z
     evidence: "Record list shows crm / A / <ip> / DNS only"
     screenshot: <link, secrets cropped>
   ```
4. Add a line to `history:`.
5. **Commit changes** straight to `main`. Your commit is your signature and your timestamp.

If you are stuck, set `status: BLOCKED` and say in `claim.evidence` exactly what stopped
you. A blocked checkpoint is useful. A checkpoint you quietly leave open is not.

**Claiming is not closing.** After you claim, `checkpoints/verify.py` independently checks
the outside world — does the hostname resolve, does the URL return 200, is the file really
on the branch. Only that check can turn a checkpoint ✅ green. If you claim done and the
check disagrees, it goes 🔴 **DISPUTED** and comes straight back to you. This is not
distrust of you; it is the only way a dashboard click can be proven to have had its
intended effect.

Your three tasks above are already open as
[`CP-CRM-001`](../checkpoints/CP-CRM-001-cloudflare-crm-dns-record.md),
[`CP-CRM-002`](../checkpoints/CP-CRM-002-cloudflare-ssl-full-strict.md) and
[`CP-CRM-003`](../checkpoints/CP-CRM-003-github-actions-deploy-secrets.md).
Full protocol: [`docs/CHECKPOINTS.md`](./CHECKPOINTS.md).

**Never write a secret value into a checkpoint file.** Name the secret, never its content.
These files are public.

---

Good luck. — Claude (CTO)
