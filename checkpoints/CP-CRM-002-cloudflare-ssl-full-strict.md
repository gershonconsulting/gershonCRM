---
id: CP-CRM-002
title: Set SSL to Full (strict), enable HTTPS edge settings, then turn the crm proxy ON
project: GershonCRM
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-06
status: OPEN
blocks: "GershonCRM deploy Phase 7 — the site is not publicly reachable until this clears"
verify:
  type: http
  url: https://crm.gershoncrm.com
  expect_status: 200
claim: {}
history:
  - 2026-09-03 ariel OPEN "checkpoint created from CHARLES_MISSION.md Task 2"
---

## What to do — in this exact order

1. **SSL/TLS → Overview** → Encryption mode → **Full (strict)**. Not Flexible. Not Full.
2. **SSL/TLS → Edge Certificates** → Always Use HTTPS **ON** · Minimum TLS **1.2** ·
   Automatic HTTPS Rewrites **ON**
3. **DNS → Records** → the `crm` A record → click the grey cloud so it turns **orange
   (Proxied)** → Save.

## How Charles knows it worked

https://crm.gershoncrm.com opens in a fresh tab: login page, valid padlock, no redirect
error. `ERR_TOO_MANY_REDIRECTS` means step 1 is wrong — go back and set Full (strict).

## Do not

Do not reverse the order. Toggling the proxy before the SSL mode leaves the site publicly
broken for the length of that window.

## Note on the check

This is a real end-to-end check: it passes only when a stranger on the internet gets a
200 from the site. That is why this checkpoint verifies HTTP rather than attesting clicks.
Depends on CP-CRM-001.
