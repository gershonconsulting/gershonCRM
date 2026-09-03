---
id: CP-DNS-003
title: Make growth.gershoncrm.com resolve
project: Growth
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-10
status: BLOCKED
blocked_by: "Growth is pre-launch and has no deployment. Reopen when there is a host."
blocks: "Growth is pre-launch and its subdomain has never resolved."
verify:
  type: dns
  host: growth.gershoncrm.com
claim:
  by: ariel
  on: 2026-09-03
  evidence: |
    Growth is pre-launch and has no deployment to point at - the checkpoint itself says this is legitimately BLOCKED rather than open. Reopen it when Growth has a host.
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
  - 2026-09-03 ariel BLOCKED "no host to point at - see the claim"
---

## What to do

Cloudflare -> zone `gershoncrm.com` -> DNS -> add the `growth` record once there is a
deployment to point it at. Until then this is legitimately **BLOCKED**, not open — set that
status so it stops reading as neglected work.

## How you know it worked

`growth.gershoncrm.com` resolves.

## Do not

Do not point it at a placeholder just to make the check go green. A green checkpoint has to
mean the real thing works.
