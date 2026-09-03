# The daily checkpoint sweep

Checkpoints only work if something looks at them without being asked. That is what the sweep
is: one command, run once a day by the existing Projects Status task, which re-verifies every
checkpoint against the real world and then says **only** what needs a person.

## The command

```
git clone --depth 1 https://github.com/gershonconsulting/gershonCRM.git
python3 gershonCRM/checkpoints/verify.py --sweep --format html
```

`--sweep` never writes files. The scheduled container that runs it cannot push, so writing an
updated `INDEX.md` there would only produce a result nobody sees. Verification still happens
in full — every checkpoint's check is executed live — the run just reports instead of
committing.

Drop `--format html` for plain Markdown, which is what you want when reading it by hand.

## What it surfaces

Three states, and nothing else:

| | |
|---|---|
| 🔴 **DISPUTED** | Somebody claimed it was done and the independent check says otherwise. This is the one that always deserves a human. |
| ⛔ **BLOCKED** | Real work that genuinely cannot proceed. Usually waiting on a decision or on another checkpoint. |
| ⏰ **Overdue** | Past its `due:` date and still not settled. Sorted worst-first. |

Everything else stays silent. `VERIFIED` and `CANCELLED` can never be overdue.

When there is nothing in those three buckets the sweep emits a single line —
*"Checkpoints: all clear. N of M verified"* — and the daily mail carries that line instead of a
section.

## Why only those three

A list of everything that is fine is how the previous generation of these reports became
unreadable: twenty runs in a row restating the same green rows until nobody opened them. The
[Checkpoint Board](https://claude.ai/code/artifact/e789270b-8c44-43e0-a923-666361c820b0)
already answers *"what is the state of everything"* on demand, at a glance, whenever anyone
wants it. The daily mail has a different job — interrupt only when interrupting is warranted.

## Where it goes in the daily report

Near the top of the Projects Status mail, above the per-project cards. Rationale: a disputed
checkpoint is a claim that something was done when it was not, which outranks any individual
project's status. If the sweep is all-clear it collapses to the one-line form and costs the
reader nothing.

## Adding a checkpoint the sweep can see

Nothing extra to do — the sweep reads the same `checkpoints/*.md` files as everything else.
But the protocol's rule still governs, and it is the rule that matters:

> **A `verify:` block must be FALSE on the day you write it, and you run the verifier once to
> prove it fails.**

Two of the first eighteen checks were written against conditions that were already true and
went green instantly without anybody doing the work. One of them watched for the string
`© 2026` — a *correct* copyright — when the actual defect was a mojibake `Â©` in front of it.
A check that cannot fail is worse than no check, because it reports success.
