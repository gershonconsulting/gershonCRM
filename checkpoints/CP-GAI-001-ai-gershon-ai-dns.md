---
id: CP-GAI-001
title: Publish the DNS record for ai.gershon.ai so the subdomain resolves
project: Gershon.AI
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-08
status: BLOCKED
blocked_by: "There is no separate ai.gershon.ai app - the gershonAI repo is what gershon.ai already serves. Needs Olivier's call: point it at the hub, or drop the subdomain."
blocks: "ai.gershon.ai has failed DNS on every daily status run since ~19 August. www.gershon.ai is in the same state."
verify:
  type: dns
  host: ai.gershon.ai
claim:
  by: ariel
  on: 2026-09-03
  evidence: |
    There is no ai.gershon.ai app to point at. The gershonAI repo's index.html is byte-for-byte what gershon.ai already serves live - 'Gershon.AI Hub' and 'ai.gershon.ai' are one project, not two. So this is not a broken deploy, it is a subdomain for an app that does not separately exist. Needs Olivier's decision: point ai.gershon.ai at the hub, or drop it from the list.
history:
  - 2026-09-03 ariel OPEN "longest-running dead subdomain in the portfolio"
  - 2026-09-03 ariel BLOCKED "no host to point at - see the claim"
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
