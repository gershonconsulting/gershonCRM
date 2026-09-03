---
id: CP-GAI-001
title: Publish the DNS record for ai.gershon.ai so the subdomain resolves
project: Gershon.AI
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-08
status: OPEN
blocks: "ai.gershon.ai has failed DNS on every daily status run since ~19 August. www.gershon.ai is in the same state."
verify:
  type: dns
  host: ai.gershon.ai
claim: {}
history:
  - 2026-09-03 ariel OPEN "longest-running dead subdomain in the portfolio"
---

## What to do

1. https://dash.cloudflare.com → zone `gershon.ai` → **DNS → Records**.
   The apex `gershon.ai` already resolves through Cloudflare; `ai` and `www` do not exist.
2. Add the `ai` record pointing at wherever the ai.gershon.ai app is meant to be served
   from. If there is no host to point it at yet, set this checkpoint to **BLOCKED** with
   that sentence as the evidence — do not invent a target.
3. While in the zone, add `www` as a CNAME to the apex if it is absent.

## How Charles knows it worked

`ai.gershon.ai` resolves. The daily status report stops listing it under dead subdomains.

## Do not

Do not modify or delete any existing record in the `gershon.ai` zone — email DNS lives there.

## Note on the check

BLOCKED is the right answer here if the app has nowhere to live yet. A blocked checkpoint
is useful information; a silently open one is not.
