---
id: CP-OPS-002
title: Add the weekly checkpoint sweep to the daily report
project: Ops
assigned_to: ariel
requested_by: ariel
opened: 2026-09-03
due: 2026-09-08
status: VERIFIED
blocks: "Nothing yet — but without a sweep, checkpoints only get looked at when someone remembers to look."
verify:
  type: repo-file
  repo: gershonconsulting/gershonCRM
  path: checkpoints/SWEEP.md
  ref: main
claim: {}
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
  - 2026-09-03 verify VERIFIED "already true at check time - https://raw.githubusercontent.com/gershonconsulting/gershonCRM/main/checkpoints/SWEEP.md -> HTTP 200"
---

## What to do

Fold `verify.py --rollup` into the existing daily status run so every checkpoint is checked
once a day, and surface only three things in the mail: anything **DISPUTED**, anything
**BLOCKED**, and anything past its `due` date. Everything else stays silent.

## Note on the check

This checkpoint's first check was written against `log.jsonl`, a file that already existed —
so on its very first run it went green without the work being done. That is the failure mode
the protocol now warns about explicitly: **a verify block must be FALSE on the day you write
it.** It now checks for `checkpoints/SWEEP.md`, which will exist only once the sweep is built.

## Why only those three

A list of everything that is fine is how the last set of reports became unreadable. The
checkpoint board already answers "what is the state of everything" on demand; the daily mail
should only interrupt for the three states that need a person.
