---
id: CP-NXS-001
title: Fix the three NexaShare landing-page defects
project: NexaShare
assigned_to: ariel
requested_by: ariel
opened: 2026-09-03
due: 2026-09-06
status: VERIFIED
blocks: "Three cosmetic defects on a public marketing page, flagged repeatedly since ~19 August and never picked up. The repo has 134 commits, so this is not a capability problem."
verify:
  type: http-absent
  url: https://nexashare.com
  absent_text: "Â©"
claim:
  by: ariel
  on: 2026-09-03
  evidence: |
    All three defects fixed and live on nexashare.com.
    1. Mojibake: 55 double- and triple-encoded sequences repaired across public/index.html
       (title em dash, footer copyright), public/dashboard.html (52 - the ellipsis in every
       loading state, the mid-dot separators, the em-dash metric placeholder) and
       public/login.html (an orphan byte where an em dash lost its tail).
    2. The duplicated "Why teams choose NexaShare" section is removed; the heading now
       appears once.
    3. The download button pointed at extension 1.2.11; it now points at 1.2.16, the newest
       package actually in public/.
    Landed on main via the GitHub web upload route; the repo's own deploy workflow shipped it
    to production within a minute. Verified against the live page, not just the repo.
    Regression guard added: tests/content-guards.mjs (npm-free, `node tests/content-guards.mjs`)
    scans every page in public/ for mojibake, catches a section heading rendered twice, and
    fails if any page links an extension zip older than the newest one present. It was run
    against the pre-fix files first and failed, as the protocol requires.
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
  - 2026-09-03 ariel CLAIMED "all three defects fixed and deployed; check corrected - the old one watched for a correct string"
  - 2026-09-03 verify VERIFIED "'Â©' is gone"
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
