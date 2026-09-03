---
id: CP-ATT-001
title: Commit the Attia.net Phase-1 scaffold to the empty family repo
project: Attia.net
assigned_to: ariel
requested_by: ariel
opened: 2026-09-03
due: 2026-09-10
status: VERIFIED
blocks: "github.com/gershonconsulting/family shows GitHub's own "This repository is empty" state, despite a locked Phase-1 spec. Nothing downstream can start."
verify:
  type: repo-file
  repo: gershonconsulting/family
  path: README.md
  ref: main
claim:
  by: ariel
  on: 2026-09-03
  evidence: |
    gershonconsulting/family is no longer empty. main is initialised with README.md
    (what the app is, the Phase 1 / Phase 2 scope boundary, the stack, the layout and the
    open domain question) and a .gitignore that keeps family data - CSV, GEDCOM, uploads,
    backups - out of git.
    NOTE FOR OLIVIER: the repository is PUBLIC. It is meant to hold private genealogy data
    for ~350 living relatives. Nothing personal has been committed, but the visibility should
    be settled before the MyHeritage import.
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
  - 2026-09-03 ariel CLAIMED "README and .gitignore landed on main"
  - 2026-09-03 verify VERIFIED "already true at check time - https://raw.githubusercontent.com/gershonconsulting/family/main/README.md -> HTTP 200"
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
