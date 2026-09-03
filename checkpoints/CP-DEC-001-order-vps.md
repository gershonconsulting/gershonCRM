---
id: CP-DEC-001
title: Order the Hostinger KVM2 VPS
project: GershonCRM
assigned_to: olivier
requested_by: ariel
opened: 2026-09-03
due: 2026-09-05
status: OPEN
blocks: "The entire GershonCRM deploy. CP-CRM-001, 002 and 003 all wait behind this — Charles cannot create a DNS record without an IP."
verify:
  type: manual-attest
  attest_url: https://hpanel.hostinger.com
  attest_expect: "a KVM2 VPS provisioned, with its IP stored in 1Password vault 'GershonCRM Deploy'"
claim: {}
history:
  - 2026-09-03 ariel OPEN "seeded from the recurring open items in the daily status reports"
---

## What to do

This one is yours — it is a purchase, and buying things is not something Claude does on your
behalf. Order the KVM2 VPS in Hostinger.

The moment the IP exists and is in 1Password, three checkpoints unblock at once and the
deploy runs without you touching anything else.

## How you know it worked

The VPS shows as provisioned and its IP is in the 1Password vault.

## Why this is a checkpoint and not a nag

It has been the top blocker on GershonCRM for weeks and lived only in report prose. As a
checkpoint it has an owner, an age, and three dependents — which is the honest picture.
