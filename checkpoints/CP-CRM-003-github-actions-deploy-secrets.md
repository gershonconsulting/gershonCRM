---
id: CP-CRM-003
title: Create the three GitHub Actions deploy secrets
project: GershonCRM
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-06
status: OPEN
blocks: "GershonCRM deploy Phase 8 — auto-deploy cannot run without these"
verify:
  type: manual-attest
  attest_url: https://github.com/gershonconsulting/gershonCRM/settings/secrets/actions
  attest_expect: "VPS_HOST, VPS_USER and VPS_SSH_KEY all listed on the Actions secrets page"
claim: {}
history:
  - 2026-09-03 ariel OPEN "checkpoint created from CHARLES_MISSION.md Task 3"
---

## What to do

https://github.com/gershonconsulting/gershonCRM → **Settings → Secrets and variables →
Actions → New repository secret**, three times:

| Name (exact, case-sensitive) | Value |
|---|---|
| `VPS_HOST` | VPS public IP — 1Password vault "GershonCRM Deploy" |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | full private key from 1Password "GershonCRM GitHub Actions SSH key", including both `-----BEGIN/END OPENSSH PRIVATE KEY-----` lines |

## How Charles knows it worked

The Actions secrets page lists all three names.

## Do not

Do not paste any secret value into this file, into chat, or into a screenshot. Name the
secret only. No leading or trailing blank lines in `VPS_SSH_KEY`.

## Note on the check

GitHub secrets are write-only — no script can read them back, so this is the one
`manual-attest` checkpoint in the set. It stops at 🟡 CLAIMED until Ariel or Olivier looks
at the attest URL and adds `countersigned_by:` to this file. That is deliberate: a
checkpoint nobody can check is never allowed to go green on Charles's word alone.
