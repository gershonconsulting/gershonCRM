---
id: CP-DEC-004
title: Resolve the attia.net domain mixup
project: Attia.net
assigned_to: olivier
requested_by: ariel
opened: 2026-09-03
due: 2026-09-10
status: OPEN
blocks: "attia.net redirects to the unrelated www.attia.com ("ATTIA - Unite the Family Worldwide"). This looks like a domain ownership issue rather than a misconfiguration, so nobody can fix it without you."
verify:
  type: http-absent
  url: https://attia.net
  absent_text: "Unite the Family Worldwide"
claim: {}
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
---

## What to do

Confirm which registrar account actually holds `attia.net` and whether the redirect to
`www.attia.com` is something you set up, inherited, or never controlled. That answer decides
whether this is a five-minute DNS fix or a domain you do not own.

## How you know it worked

`attia.net` stops serving the unrelated ATTIA site.

## Note on the check

Unlike the other decision checkpoints this one verifies itself — the check watches the live
page for the other site's tagline, so the moment the redirect is gone it closes on its own.
