---
id: CP-GC-001
title: Purge the gershonconsulting.com cache and settle the blog date flip-flop
project: Gershon Consulting
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-07
status: OPEN
blocks: "The blog dateModified has flip-flopped between 2026-03-26 and 2026-03-27 across at least five consecutive daily runs. It has been dismissed as cache variance every time and never actually tested."
verify:
  type: manual-attest
  attest_url: https://dash.cloudflare.com
  attest_expect: "cache purged for gershonconsulting.com, with the purge timestamp noted in the claim"
claim: {}
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
---

## What to do

1. Cloudflare -> zone `gershonconsulting.com` -> **Caching -> Configuration -> Purge
   Everything**.
2. Note the purge time in your claim.

## How you know it worked

Nothing visible immediately — that is the point. The daily report reads the blog's
`dateModified` each morning; if it stops flip-flopping after the purge, the cache was the
cause and this closes. If it keeps flipping, the cause is real content or the CDN edge, and
that is worth knowing after five runs of guessing.

## Do not

Do not purge zones other than `gershonconsulting.com`.
