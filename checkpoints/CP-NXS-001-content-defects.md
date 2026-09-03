---
id: CP-NXS-001
title: Fix the three NexaShare landing-page defects
project: NexaShare
assigned_to: ariel
requested_by: ariel
opened: 2026-09-03
due: 2026-09-06
status: OPEN
blocks: "Three cosmetic defects on a public marketing page, flagged repeatedly since ~19 August and never picked up. The repo has 134 commits, so this is not a capability problem."
verify:
  type: http-absent
  url: https://nexashare.com
  absent_text: "© 2026"
claim: {}
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
---

## What to do

1. Remove the duplicated "Why teams choose NexaShare" section.
2. Fix the mojibake in the page title (a UTF-8 string decoded as Latin-1 somewhere).
3. Fix the future-dated `(c) 2026` copyright.

## How you know it worked

The page renders each section once, the title is clean, and the footer year is correct.

## Note on the check

The automated check watches for the future-dated copyright string, which is the one defect a
script can see reliably. The other two need eyes — describe them in the claim.

All three were re-confirmed present on the live page at 2026-09-03: the copyright reads
© 2026, "Why teams choose" appears twice, and the title renders as "NexaShare â€” LinkedIn
Content Amplification" (an em dash decoded as Latin-1).
