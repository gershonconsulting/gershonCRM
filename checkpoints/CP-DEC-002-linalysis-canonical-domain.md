---
id: CP-DEC-002
title: Decide the canonical Linalysis domain: .com or .net
project: Linalysis
assigned_to: olivier
requested_by: ariel
opened: 2026-09-03
due: 2026-09-08
status: OPEN
blocks: "linalysis.com and linalysis.net are both live with different marketing copy. Unresolved for 15 consecutive daily runs. Splits SEO and confuses anyone who finds both."
verify:
  type: manual-attest
  attest_url: https://linalysis.com
  attest_expect: "one canonical domain chosen; the other 301-redirects to it"
claim: {}
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
---

## What to do

Pick one. Then say which, and Ariel makes the other 301 to it and reconciles the copy.

There is no technical reason to prefer either — this is a brand call, which is why it has
sat for 15 runs. Two words in reply closes it.

## How you know it worked

The non-canonical domain 301s to the canonical one and only one version of the copy exists.
