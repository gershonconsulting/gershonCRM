---
id: CP-ATT-001
title: Commit the Attia.net Phase-1 scaffold to the empty family repo
project: Attia.net
assigned_to: ariel
requested_by: ariel
opened: 2026-09-03
due: 2026-09-10
status: OPEN
blocks: "github.com/gershonconsulting/family shows GitHub's own "This repository is empty" state, despite a locked Phase-1 spec. Nothing downstream can start."
verify:
  type: repo-file
  repo: gershonconsulting/family
  path: README.md
  ref: main
claim: {}
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
---

## What to do

Land the Phase-1 scaffold from the locked spec — at minimum a README describing the app and
the initial project structure — so the repo stops being empty and the spec has somewhere to
live.

## How you know it worked

`gershonconsulting/family` has a `README.md` on `main` and GitHub stops showing the empty-repo
splash.

## Note

Separate from CP-DEC-004: this is the code, that is the domain question. Neither blocks the
other.
