---
id: CP-CRM-001
title: Create the crm.gershoncrm.com DNS A record with the proxy OFF
project: GershonCRM
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-06
status: OPEN
blocks: "GershonCRM deploy Phase 5. Also blocked upstream on Olivier ordering the Hostinger KVM2 VPS — no VPS IP means no record."
verify:
  type: dns
  host: crm.gershoncrm.com
claim: {}
history:
  - 2026-09-03 ariel OPEN "checkpoint created from CHARLES_MISSION.md Task 1"
---

## What to do

1. https://dash.cloudflare.com → zone `gershoncrm.com` → **DNS → Records → Add record**
2. Type `A` · Name `crm` · IPv4 = the VPS IP from 1Password vault "GershonCRM Deploy" · TTL Auto
3. **Proxy status: DNS only — the cloud icon must be GREY.** If it is orange, click it.
4. Save.

## How Charles knows it worked

The record list shows `crm` / A / `<VPS_IP>` / **DNS only**.

## Do not

Do not leave the proxy orange. Certbot's validation in Phase 6 must reach the origin
directly; an orange cloud here fails the next phase and costs half an hour to diagnose.
Do not touch any other record in the zone — other Gershon properties live there.

## Note on the check

`verify.py` resolves `crm.gershoncrm.com` from outside. It has returned NXDOMAIN on every
daily status run since ~19 August. When this checkpoint goes ✅ the subdomain is genuinely
live, which is the outcome that actually matters — not the click.
