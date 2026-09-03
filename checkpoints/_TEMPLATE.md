---
id: CP-XXX-000
title: One line, imperative, what Charles must end up having done
project: ProjectName
assigned_to: charles
requested_by: ariel
opened: YYYY-MM-DD
due: YYYY-MM-DD
status: OPEN
blocks: "what is stuck while this is open — say who is idle"
verify:
  type: dns | http | http-contains | http-absent | repo-file | manual-attest
  # dns:            host: crm.gershoncrm.com     expect_ip: 1.2.3.4   (optional)
  # http:           url: https://...             expect_status: 200   (optional)
  # http-contains:  url: https://...             expect_text: "..."
  # http-absent:    url: https://...             absent_text: "..."
  # repo-file:      repo: org/repo   path: x/y.md   ref: main
  # manual-attest:  attest_url: https://...      attest_expect: "what should be on screen"
claim: {}
history:
  - YYYY-MM-DD ariel OPEN "checkpoint created"
---

## What to do

Numbered steps. Assume Charles reads only this file.

## How Charles knows it worked

The thing he should see on screen before he claims it.

## Do not

The specific ways this task goes wrong.
