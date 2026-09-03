---
id: CP-OPS-001
title: Land the checkpoint protocol v1.0 in the repo
project: Ops
assigned_to: ariel
requested_by: olivier
opened: 2026-09-03
due: 2026-09-03
status: CLAIMED
blocks: "Nothing — this is the checkpoint that proves the checkpoint system works"
verify:
  type: repo-file
  repo: gershonconsulting/gershonCRM
  path: checkpoints/INDEX.md
  ref: main
claim:
  by: ariel
  at: 2026-09-03
  evidence: "docs/CHECKPOINTS.md v1.0, checkpoints/ with verifier, template, index and five seeded requests"
history:
  - 2026-09-03 ariel OPEN "Olivier asked for a checkpoint concept between Ariel and Charles, carried in the GitHub repos"
  - 2026-09-03 ariel CLAIMED "committed to main"
---

## What to do

Commit `docs/CHECKPOINTS.md` and the `checkpoints/` directory to `main` so that every
future request to Charles has somewhere to live.

## How it is verified

`verify.py` fetches `checkpoints/INDEX.md` from `main` on raw.githubusercontent.com. If
the file is not really on the default branch, this checkpoint cannot go green — which is
the same standard Charles is held to. The system's first act is to prove itself by its
own rules.
