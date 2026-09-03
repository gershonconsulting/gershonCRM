---
id: CP-DNS-002
title: Make roi.gershoncrm.com resolve
project: ROI Calculator
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-08
status: OPEN
blocks: "The ROI calculator is a live sales tool that has been unreachable since ~19 August."
verify:
  type: dns
  host: roi.gershoncrm.com
claim: {}
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
---

## What to do

Cloudflare -> zone `gershoncrm.com` -> DNS -> add the `roi` record pointing at wherever the
ROI calculator is served from. If the app has no host, set `status: BLOCKED` with that
sentence as the evidence.

## How you know it worked

`roi.gershoncrm.com` resolves and the calculator loads.

## Do not

Do not modify unrelated records in the zone.
