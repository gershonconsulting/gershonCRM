---
id: CP-SEC-001
title: Revoke the GitHub personal access token that sits in plaintext in repo remote URLs
project: Security
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-04
status: OPEN
blocks: "Everything. A live token is embedded in the finance and client repo remotes — open since 28 August."
verify:
  type: manual-attest
  attest_url: https://github.com/settings/tokens
  attest_expect: "the old token no longer appears in the personal access token list"
claim: {}
history:
  - 2026-09-03 ariel OPEN "carried over from the requests report blocker list, open since 2026-08-28"
---

## What to do

1. https://github.com/settings/tokens → find the token used in the finance and client repo
   remote URLs → **Delete / Revoke**.
2. Generate a replacement if one is needed, and store it in 1Password only.
3. Set this checkpoint to CLAIMED and tell Ariel the new token is in 1Password — **do not
   write the token anywhere in this repo.**

Ariel then re-points the affected remotes to a credential-helper URL with no embedded
secret, and opens a follow-up checkpoint if any remain.

## How Charles knows it worked

The revoked token is gone from the token list, and any automation using it starts failing
authentication — which is the expected and correct signal.

## Do not

Do not paste the old or new token value into this file. Naming the token is enough.

## Note on the check

`manual-attest`: the token list is behind a personal login no script here can reach.
Needs a countersign. This is the oldest open blocker in the portfolio — it leads the list
for a reason.
