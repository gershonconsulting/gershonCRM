---
id: CP-DNS-002
title: Make roi.gershoncrm.com resolve
project: ROI Calculator
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-08
status: BLOCKED
blocked_by: "Waiting on CP-DEC-001 (the VPS). The calculator needs proxy.js (Node/PM2, holds the Anthropic key) alongside the static page."
blocks: "The ROI calculator is a live sales tool that has been unreachable since ~19 August."
verify:
  type: dns
  host: roi.gershoncrm.com
claim:
  by: ariel
  on: 2026-09-03
  evidence: |
    Blocked on CP-DEC-001. Checked what the ROI calculator actually needs: the repo is a 25KB static index.html PLUS proxy.js, a Node service run under PM2 (ecosystem.config.js, PORT 3001) that holds the Anthropic API key and whitelists https://roi.gershoncrm.com as its only CORS origin. The static half could be served anywhere; the calculator's AI feature cannot work without the proxy, so it needs the same VPS. Also checked for an existing deployment: roi-calculator.pages.dev resolves but is somebody else's site (no Gershon content) - do not point at it.
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
  - 2026-09-03 ariel BLOCKED "no host to point at - see the claim"
---

## What to do

Cloudflare -> zone `gershoncrm.com` -> DNS -> add the `roi` record pointing at wherever the
ROI calculator is served from. If the app has no host, set `status: BLOCKED` with that
sentence as the evidence.

## How you know it worked

`roi.gershoncrm.com` resolves and the calculator loads.

## Do not

Do not modify unrelated records in the zone.
