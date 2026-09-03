---
id: CP-DNS-001
title: Make the gershoncrm.com apex resolve
project: GershonCRM
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-08
status: OPEN
blocks: "The apex has failed DNS on every daily status run since ~19 August. Every gershoncrm.com property inherits this."
verify:
  type: dns
  host: gershoncrm.com
claim: {}
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
---

## What to do

https://dash.cloudflare.com -> zone `gershoncrm.com` -> **DNS -> Records**. The apex `@`
record is missing or pointing nowhere. Add or repair it so the bare domain resolves.

If there is no host to point the apex at, set `status: BLOCKED` and say so in the claim —
do not invent a target.

## How you know it worked

`gershoncrm.com` resolves from outside. The daily report stops listing it as dead.

## Do not

Do not touch the working subdomain records (`expenses`, `task`, `tools`, `finance`,
`social`) or any MX/TXT record — email DNS lives in this zone.
