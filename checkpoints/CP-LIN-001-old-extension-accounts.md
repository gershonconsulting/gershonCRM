---
id: CP-LIN-001
title: Move the three Linalysis accounts off the old Chrome extension build
project: Linalysis
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-08
status: OPEN
blocks: "Linalysis has sat at 5-6 of 6 accounts incomplete for weeks, and the Radar report reads OUTDATED BROWSER. One stale extension is degrading two products."
verify:
  type: manual-attest
  attest_url: https://linalysis.com
  attest_expect: "all six accounts on the current extension build; no account still reporting OUTDATED BROWSER"
claim: {}
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
---

## What to do

Identify the three accounts still running the old extension build and get each onto the
current one. The Radar collection report reading "OUTDATED BROWSER" is the same root cause.

## How you know it worked

No account reports an outdated build, and the next Radar report drops the warning.

## Note on the check

`manual-attest` — the per-account extension version is behind a login. Name the three
accounts in the claim (no credentials) so the next run can spot-check them.
