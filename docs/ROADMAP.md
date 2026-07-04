# GershonCRM — Product Roadmap: From Single-Pipeline MVP to Streak Replica

> **Audience:** Olivier (decisions) + AI operators (Ariel/Samuel for execution, Claude CTO for architecture).
> **Product thesis:** Replicate Streak.com's pipeline-CRM model as a **standalone SaaS platform** — no Gmail integration, own login, own UI. Target customers: Gershon Consulting clients (global B2B companies entering the US market).
> **Status legend:** each epic gets a GitHub Milestone; each numbered item becomes one or more Issues.

---

## Where we are (post-deploy baseline)

Shipped in the MVP at `crm.gershoncrm.com`:

- Single pipeline with kanban drag & drop, stages seeded from Streak export
- Contacts, Deals, Tasks, Activities — full CRUD, 35 API endpoints
- 4 hardcoded views (fit / interest / month / week), Dashboard, Reports
- Streak CSV import (contacts, deals, combined)
- Auth: username/password (scrypt), sessions, roles client/manager/admin
- Deals schema already carries `customFields` JSONB + `tags` array (unused landing pads)

Known debt (already filed as Issues in deploy Phase 9): loadInitialData gating, PORT env, /api/health, in-memory sessions, no multi-tenancy.

Not real despite appearances: the **Emails page is mock UI** (no backend, no mail library); **OpenAI is an unused dependency** (no AI features exist).

---

## Sequencing principle

Nothing in Epics 2–4 ships to an external client before Epic 1 is complete. Multi-tenancy retrofitted late is 10x the cost of multi-tenancy done now — every table, every query, every API route gets touched.

```
E1 Multi-tenancy ──► E2 Multiple pipelines ──► E3 Custom fields ──► E4 Grid view ──► E5+ (order by dogfood feedback)
```

Dogfooding checkpoint: after deploy, Olivier uses the MVP for 1–2 weeks. His friction list re-prioritizes Epics 5–9 before any of them start.

---

## Epic 1 — Multi-tenancy (workspaces)

**Why first:** without it, this is Olivier's personal tool, not a SaaS. Every later feature builds on the tenancy boundary.

**Schema:**
- New `workspaces` table: id, name, slug, plan, createdAt
- New `workspace_members`: workspaceId, userId, role (owner/admin/member), invitedBy, joinedAt
- Add `workspaceId` (FK, not null) to: contacts, deals, deal_stages, tasks, activities
- Migration: create a "Gershon Consulting" workspace, backfill all existing rows to it, make Olivier owner

**Backend:**
- Session carries activeWorkspaceId; middleware injects it into every query — no API route may query without a workspace scope
- Invite flow: owner/admin invites by email → pending invite → accepted on first login
- Workspace switcher endpoint for users in multiple workspaces

**Frontend:**
- Workspace switcher in the sidebar
- Members & invites page under Settings
- Registration creates a personal workspace by default

**Acceptance criteria:**
- Two test workspaces with distinct data; user A in workspace 1 can never read/write workspace 2's rows — verified by API tests, not just UI
- All 35 existing endpoints scoped; a request with a manipulated ID belonging to another workspace returns 404 (not 403 — don't leak existence)

**Estimate:** the biggest single refactor in the roadmap. Touches every file in `server/` and most queries.

---

## Epic 2 — Multiple pipelines

**Why:** this is Streak's core object model. One workspace runs Sales + Hiring + Partnerships pipelines, each with its own stages.

**Schema:**
- New `pipelines`: id, workspaceId, name, color, position, createdAt
- `deal_stages` gains `pipelineId` (FK); unique (pipelineId, position)
- `deals` gains `pipelineId` (FK) — a deal lives in exactly one pipeline
- Migration: create pipeline "Sales" per workspace, attach existing stages/deals

**Backend:** CRUD for pipelines; stage CRUD becomes pipeline-scoped; deal moves validate stage belongs to the deal's pipeline.

**Frontend:**
- Pipeline switcher (tabs or dropdown above the kanban)
- "New pipeline" flow with stage templates (Sales, Recruiting, Fundraising, Support presets — mirror Streak's templates)
- Stage editor: add/rename/recolor/reorder/delete (with deal-reassignment prompt on delete)

**Acceptance criteria:** create a second pipeline with different stages; drag deals within each; deals never cross pipelines accidentally; deleting a pipeline requires typing its name (destructive-action guard).

---

## Epic 3 — Custom fields per pipeline

**Why:** Streak's flexibility comes from user-defined columns. The `customFields` JSONB column is already waiting.

**Schema:**
- New `field_definitions`: id, pipelineId, key, label, type, options (jsonb), position, required
- Supported types v1: text, number, dropdown (single), date, checkbox, contact-link. (Formula and multi-select are v2.)

**Backend:** CRUD for field definitions; deal create/update validates customFields against the pipeline's definitions.

**Frontend:**
- "Edit columns" UI on the pipeline (add field → pick type → options)
- Deal card + deal detail render custom fields dynamically
- Custom fields filterable and usable in views (depends on Epic 5's filter engine — minimum v1: visible + editable)

**Acceptance criteria:** define a "Contract value" number field and a "Region" dropdown on one pipeline only; second pipeline unaffected; values persist and render on cards, detail, and CSV export.

---

## Epic 4 — Spreadsheet grid view

**Why:** Streak's daily driver isn't the kanban — it's the editable grid. Power users live here.

**Scope:**
- Grid rendering of deals in a pipeline: one row per deal, columns = standard fields + custom fields
- Inline cell editing (click → edit → autosave), column resize/reorder/hide, sort by any column
- Group-by (stage, assignee, any dropdown field) with collapsible groups and per-group aggregates (count, sum of value)
- Keyboard navigation (arrows, Enter to edit, Esc)
- Library decision for Claude CTO at implementation time: TanStack Table (headless, fits existing stack) vs. Glide Data Grid (canvas, faster for large sets). Default lean: TanStack Table.

**Acceptance criteria:** 1,000-deal pipeline scrolls smoothly; edits persist without full-page reloads; view state (columns, sort, grouping) persists per user.

---

## Epic 5 — Filter engine + saved views

Replace the 4 hardcoded view pages with a real engine.

- Filter builder: any field (standard or custom), operators by type (is/is not/contains/before/after/empty), AND/OR groups
- Saved views: name + filter + sort + column set + visibility (private/workspace)
- Views render in both kanban and grid modes
- Migrate the 4 legacy views into seeded saved views, then delete the hardcoded pages

**Acceptance criteria:** rebuild "by fit" as a saved view without code; share it workspace-wide; deep-linkable URL per view.

---

## Epic 6 — Email (standalone flavor) — DECISION REQUIRED

Streak = email + pipeline. We explicitly dropped the Gmail half. Three options for what replaces it:

**Option A — Transactional sending via Resend/SMTP.** Compose from a deal, thread stored on the box, replies via inbound webhook to a per-workspace address (deals+{boxKey}@mail.gershoncrm.com). Real email, no Google.
**Option B — LinkedIn-first (Gershon-native).** No email at all. Lean into the existing `thread` LinkedIn URL field: structured LinkedIn touchpoint logging, sequence reminders, connection-status tracking. Differentiates rather than imitates; aligns with the Gershon methodology and Linalysis/Gershon.AI assets.
**Option C — Defer.** Ship Epics 1–5, let dogfooding + first client feedback decide.

**Roadmap default: C, with a bias toward B when forced.** The mock Emails page gets removed from nav until this decision lands (one-line Issue).

---

## Epic 7 — Collaboration

- Comments on deals with @mentions
- Assignments become real userId FKs (today: free-text email) with "My deals" filters
- Notification center (in-app first; email digest only after Epic 6 decision)
- Activity feed per deal already exists — extend to workspace-level feed

---

## Epic 8 — Automations

Streak's workflow rules, v1 minimal:
- Trigger: deal enters stage / field changes / N days of inactivity
- Action: create task / assign / notify / move stage
- New `automations` table (workspaceId, pipelineId, trigger jsonb, action jsonb, enabled) + a simple evaluator on the deal-update path (no queue infrastructure until volume demands it)

---

## Epic 9 — Reporting v2

- Funnel conversion by stage, win/loss rates, pipeline velocity (avg days per stage — `daysInStage` is already tracked), revenue forecast by expected close
- Time-series snapshots: nightly cron writes per-stage counts/values to a `pipeline_snapshots` table (start capturing EARLY — even before the charts exist, the history is irreplaceable). Add this cron in Epic 1's deploy window.

---

## Epic 10 — SaaS commercialization layer

Only after a second workspace (first real client) is active:
- Stripe subscriptions (plans on `workspaces.plan`), free trial, seat counting
- Onboarding flow (create workspace → invite team → import CSV → first pipeline from template)
- Public API keys + webhooks (per workspace)
- Audit log; data export (full workspace dump)
- Pricing placeholder to validate against Streak: Free (1 pipeline, 2 users) / Pro $49/user/mo / Enterprise custom — Olivier to set final numbers

---

## Cross-cutting engineering debt (schedule inside Epics 1–2)

1. Session store → `connect-pg-simple` (Epic 1 — sessions must survive deploys before clients exist)
2. `loadInitialData()` env-gated (Epic 1 window)
3. `/api/health` endpoint (Epic 1 window)
4. Remove unused `openai` dependency OR wire a first real AI feature (deal-summary generation is the cheapest win) — decision at Epic 3
5. Test harness: API integration tests start in Epic 1 (tenancy isolation is untestable by hand); no epic closes without tests for its acceptance criteria
6. Repo visibility: flip to private before Epic 1 merges (schema + auth logic of a commercial SaaS should not be public)

---

## Operating rhythm

- Each epic = one GitHub Milestone; items = Issues; Ariel/Samuel execute per-Issue with the same checkpoint discipline as the deploy runbook
- Claude CTO reviews schema migrations before they run — schema mistakes are the expensive ones
- Olivier's role per epic: kick-off decision (5 min), acceptance walkthrough (15 min), nothing in between
- After Epic 4, revisit this document against dogfood + client feedback before committing to 5–10 order
