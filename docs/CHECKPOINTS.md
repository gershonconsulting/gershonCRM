# CHECKPOINTS — the Ariel ↔ Charles completion protocol

**Version 1.1 — 3 September 2026**
**Owner:** Claude (CTO) · **Applies to:** every Gershon repo, every request made to Charles

---

## Why this exists

Charles is asked to do a lot: DNS records, Cloudflare settings, GitHub secrets, publishing,
dashboard toggles. Until now the only record that a task was finished was a sentence in a
chat — *"Report to Olivier: Phase 7 done."* Sentences are not state. Two days later nobody
can answer **"is that actually done?"** without re-checking by hand, and a task that was
never picked up looks exactly like a task that was completed silently.

A **checkpoint** replaces the sentence with a file in a Git repo. Git gives us for free the
three things a chat message does not have: a durable record, a timestamp, and an author.

**The rule from here on: no request to Charles exists until it has a checkpoint file.**
If Ariel asks Charles for something and does not open a checkpoint, the request has not
been made.

---

## The core idea: claimed ≠ done

The mistake to avoid is letting Charles mark his own homework. A checkpoint therefore has
**two separate gates**:

| Gate | Who | What it means |
|---|---|---|
| **CLAIM** | Charles | "I performed the action, here is my evidence." |
| **VERIFY** | Ariel (automated) | "I independently checked the outside world and it is true." |

A checkpoint only turns 🟢 green when the *second* gate passes. Charles saying "done" moves
it to 🟡 amber, not green. If Charles claims done and the automated check disagrees, the
checkpoint goes 🔴 **DISPUTED** — which is the single most valuable state in this system,
because it catches the failure mode that costs the most time: work everyone believes is
finished but is not.

---

## Status values

| Status | Marker | Meaning | Set by |
|---|---|---|---|
| `OPEN` | ❌ | Requested. Charles has not acted. | Ariel, at creation |
| `CLAIMED` | 🟡 | Charles performed it and filed evidence. Not yet independently checked. | Charles |
| `VERIFIED` | ✅ | An automated check confirmed the real-world result. **Done.** | `verify.py` only |
| `DISPUTED` | 🔴 | Charles claimed done; the automated check failed. Needs attention. | `verify.py` only |
| `BLOCKED` | ⛔ | Charles cannot proceed — missing credential, changed UI, needs a decision. | Charles |
| `CANCELLED` | ⚪ | Withdrawn before completion. | Ariel |

`VERIFIED` and `DISPUTED` are **never written by hand**. Only the verifier writes them.
That is what makes green mean something.

---

## Anatomy of a checkpoint file

One file per request, at `checkpoints/CP-<PROJECT>-<NNN>-<slug>.md` in the repo the request
belongs to. YAML front-matter carries the machine-readable state; the body carries the
human instructions.

```yaml
---
id: CP-CRM-003
title: Create the three GitHub Actions deploy secrets
project: GershonCRM
assigned_to: charles
requested_by: ariel
opened: 2026-09-03
due: 2026-09-05
status: OPEN
blocks: "Phase 9 auto-deploy — Ariel is idle until this clears"
verify:
  type: manual-attest
  attest_url: https://github.com/gershonconsulting/gershonCRM/settings/secrets/actions
  attest_expect: "VPS_HOST, VPS_USER and VPS_SSH_KEY all listed"
claim: {}
history:
  - 2026-09-03 ariel OPEN "checkpoint created"
---
```

### The `verify:` block — how a checkpoint proves itself

Pick the strongest type the task allows. Weaker types are a last resort, not a default.

| `type` | Checks | Extra keys |
|---|---|---|
| `dns` | the hostname resolves (optionally to an expected IP) | `host`, `expect_ip` *(optional)* |
| `http` | the URL answers with an expected status code | `url`, `expect_status` *(default 200)* |
| `http-contains` | the URL answers **and** its body contains a string | `url`, `expect_text` |
| `http-absent` | the URL answers and a string is **gone** (fixes, removals) | `url`, `absent_text` |
| `repo-file` | a path exists on a branch of a repo | `repo`, `path`, `ref` *(default main)* |
| `manual-attest` | nothing machine-checkable exists (secret values, private panels) | `attest_url`, `attest_expect` |

`manual-attest` is the honest escape hatch — a GitHub Actions secret is write-only, so no
script on earth can confirm its value. Such a checkpoint can reach `CLAIMED` but **never
reaches `VERIFIED` on its own**: it needs a countersign (see below). Use it sparingly. Most
dashboard work has a downstream observable consequence — a DNS record resolves, an SSL mode
stops the redirect loop, a published page returns 200 — and that consequence is the real
check. Prefer verifying the consequence over attesting the click.

### The one rule that makes a check real: it must be FALSE today

**Write the `verify:` block so that it fails at the moment you open the checkpoint, and
run the verifier once to confirm that it does.** A check that already passes on day one is
not a check — it is a green light wired to nothing.

This is not hypothetical. Two of the checkpoints seeded on 3 September were written with
broken checks and both went green immediately:

- `CP-NXS-001` searched the NexaShare page for the literal text `\u00a9 2026` instead of
  `© 2026`. The escape sequence is of course absent, so the defect reported itself fixed.
  It is not: the page still shows the future-dated copyright, still duplicates a section,
  and still renders its title as `NexaShare â€”`.
- `CP-OPS-002` checked that `checkpoints/log.jsonl` exists — a file that already existed.

Both were caught by running the verifier before publishing and looking at what went green
too easily. A checkpoint that closes the day it opens deserves suspicion, not celebration.

### Verify the consequence, not the click

Where a dashboard action has an observable downstream effect, check the effect. `dns` on
the hostname beats attesting that a record was saved; an `http` 200 from the public URL
beats attesting that an SSL mode was selected. The click is not the outcome — a record can
be saved with the wrong value, and a setting can be applied to the wrong zone.

### Countersigning a `manual-attest`

Ariel (or Olivier) adds `countersigned_by:` and `countersigned:` to the front-matter after
looking at the attest URL. `verify.py` then allows that one checkpoint to go `VERIFIED`.
This keeps the "someone other than the claimant confirmed it" property even where no
script can.

---

## The lifecycle, end to end

```
Ariel needs something from Charles
        │
        ▼
1. Ariel commits  checkpoints/CP-XXX-NNN-slug.md   status: OPEN  ❌
   and regenerates checkpoints/INDEX.md
        │
        ▼
2. Ariel sends Charles the one-line handoff:
   "CP-CRM-003 — https://github.com/<org>/<repo>/blob/main/checkpoints/CP-CRM-003-....md"
   The file IS the brief. Nothing is explained twice in chat.
        │
        ▼
3. Charles does the work in the dashboard.
        │
        ▼
4. Charles edits the SAME file in the GitHub web UI (pencil icon → Commit changes):
      status: CLAIMED
      claim:
        by: charles
        at: 2026-09-04T14:12Z
        evidence: "Record list shows crm / A / 93.115.x.x / DNS only"
        screenshot: <link, secrets cropped out>
      history: + "2026-09-04 charles CLAIMED ..."
   His commit is the timestamp and the signature. 🟡
        │
        ▼
5. Ariel runs:  python3 checkpoints/verify.py
   → the check passes → status: VERIFIED  ✅   (done, provable)
   → the check fails  → status: DISPUTED  🔴   (Charles is told exactly what failed)
        │
        ▼
6. INDEX.md and log.jsonl are rewritten and committed. The repo now answers
   "which Charles tasks are outstanding?" in one glance, forever.
```

---

## Charles's side, in four lines

1. You are sent a checkpoint URL. **The file is the whole brief** — read it, do not wait for
   a chat explanation.
2. Do the work. Verify it in the dashboard yourself first.
3. Open the file on GitHub → pencil → set `status: CLAIMED`, fill the `claim:` block with
   real evidence, add a `history:` line → **Commit changes** directly to `main`.
4. If you cannot proceed: `status: BLOCKED` and a `claim.evidence` line saying exactly what
   stopped you. Never leave a checkpoint silently `OPEN` — a blocked checkpoint is useful,
   an abandoned one is not.

**Never put a secret value in a checkpoint file.** Name the secret, never its content.
Checkpoint files are public in a public repo. Crop screenshots.

---

## Ariel's side, in four lines

1. Every ask to Charles → a checkpoint file, committed, before the ask is sent.
0. Write the check so it FAILS today, and run the verifier once to prove it fails.
2. `python3 checkpoints/verify.py` after any claim, and on every status run.
3. `python3 checkpoints/verify.py --rollup <dir-of-clones>` to sweep every repo at once.
4. Never hand-edit a status to `VERIFIED`. If you are tempted to, the `verify:` block was
   written wrong — fix the check instead.

---

## Reading the state without any tooling

`checkpoints/INDEX.md` is regenerated by the verifier and is the human view — open it on
GitHub and you see every checkpoint, its status marker, its age, and what it blocks.
`checkpoints/log.jsonl` is the append-only audit trail: one line per state transition,
never rewritten, so "when did this actually get done" is always answerable.

---

## Where checkpoints live

In **the repo the work belongs to** — a Cloudflare change for GershonCRM is a checkpoint in
`gershonCRM`, a Linalysis publish is a checkpoint in `linalysis`. The work and its proof
stay together, and a repo is self-describing to anyone who opens it.

For a request that belongs to no repo (or to a project that has none yet), use the
`gershonCRM` repo as the fallback ledger and set the `project:` field to the real project
name. The cross-repo roll-up groups by `project:`, not by which repo the file sits in, so
nothing is lost.

---

## What v1.1 changed

Every checkpoint is now checked on **every** run, including `OPEN` ones — because what is
being verified is the outcome in the world, not whether anyone clicked. Two consequences:

- An open checkpoint whose outcome is **already true** closes itself. If someone fixes a
  DNS record without touching the ledger, the ledger catches up on its own.
- An open checkpoint that is not carries **the live reason** it is still open, so the index
  reads "still open — crm.gershoncrm.com does not resolve" rather than "not claimed yet".

The index therefore answers "what is actually true right now", not "what has someone told
us". That is the whole point.

---

*Protocol v1.1 — supersedes the "Report to Olivier" convention in `CHARLES_MISSION.md`.*
