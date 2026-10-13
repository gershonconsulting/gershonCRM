## Parity: 24.1 / 100

features 24.1  (60 counted, must-haves 3 of 28 done)

Not shippable yet: 25 must-have features are not done.

## By area, weakest first
- search                         0.0  (1 features)
- ai                             0.0  (3 features)
- pipelines                     10.7  (6 features)
- automation                    11.1  (5 features)
- views                         12.5  (7 features)
- timeline                      23.1  (6 features)
- contacts                      25.0  (5 features)
- team                          25.0  (2 features)
- import-export                 25.0  (2 features)
- tasks                         30.0  (2 features)
- ux                            33.3  (2 features)
- fields                        37.5  (11 features)
- boxes                         40.0  (6 features)
- reports                       50.0  (2 features)

## Missing, in build order
- [must] boxes: Delete box, no  (Delete button has no onClick)
- [must] contacts: Multiple contacts per box, no  (One contactId per deal; Add contact button has no handler)
- [must] contacts: Organizations entity linked to contacts, no  (Company is only a text field on contact)
- [must] import-export: Export pipeline to CSV, no
- [must] pipelines: Create pipeline from template (copy pipeline), no  (LG template reused per client (Lead > Contacted > Call Scheduled > ... > Recycled))
- [must] pipelines: Multiple pipelines (one per client), no  (Olivier has 166 Streak pipelines; schema has no pipelines table - stages are global)
- [must] search: Global search, no  (Header search removed; contacts page search only)
- [must] team: Login and sessions, no  (passport / express-session installed but not wired; ROADMAP wrongly says shipped)
- [must] timeline: Comments on a box with @mentions, no  (Comment input has no handler)
- [must] views: Filter by column with operators (is / contains / before / is set), no  (Filter button has no handler)
- [must] views: Group by any column, no  (Only by-fit / by-interest / by-month pages with hard-coded values)
- [must] views: Inline cell editing in grid, no
- [must] views: Saved views (named filter+sort+group), no  (ViewManager is mock with simulated API calls)
- [must] views: Sort by any column, no
- [must] boxes: Create box (deal), partial  (DealForm works but New Deal button hidden by role gate; $0 value rejected)
- [must] boxes: Edit box fields, partial  (Fixed fields editable in deal dialog; Edit button role-gated)
- [must] fields: Custom fields per pipeline: text, partial  (Fixed columns only (thread / industry style); customFields jsonb unused)
- [must] fields: Custom fields: assigned to, partial  (assignedTo is free text; Leader dropdown is hard-coded)
- [must] fields: Custom fields: checkbox, partial  (Done is a fixed column only)
- [must] fields: Custom fields: dropdown, partial  (Interest / Fit / Category / Next Steps exist as fixed columns with hard-coded options)
- [must] import-export: CSV import into a pipeline, partial  (Streak CSV import API works but tab hidden and __dirname likely crashes in prod)
- [must] pipelines: Custom stages per pipeline with colours, partial  (Stage CRUD API works; Settings UI broken (wrong apiRequest args) and hidden by role gate; colours hard-coded by name)
- [must] tasks: Tasks on a box with due date and assignee, partial  (API works; Tasks page exists but not routed; no assignee field in form)
- [must] team: Team members and roles, partial  (Role map hard-coded client-side; selector never mounted so all gated UI hidden; server enforces nothing)
- [must] views: Spreadsheet grid view grouped by stage, partial  (Grouped list with 8 fixed columns; not inline-editable; group collapse dead)
- [should] ai: AI box summary, no  (openai installed but unused - Intelligence menu plan says Cloudflare Workers AI)
- [should] automation: Automations (trigger > action), no
- [should] automation: Public API with keys, no
- [should] automation: Webhooks, no
- [should] boxes: Move box to another pipeline, no  (Only one pipeline exists)
- [should] contacts: Contact detail with all their boxes, no
- [should] fields: Custom fields: date, no
- [should] fields: Custom fields: tag (multi-select), no  (tags column exists but never written)
- [should] pipelines: Pipeline sharing and permissions per user, no  (No auth so no per-user access)
- [should] pipelines: Reorder stages, no  (UI calls /api/deal-stages/:id/reorder which does not exist)
- [should] tasks: Task reminders / notifications, no  (reminderDate in schema only)
- [should] timeline: Call logs, no
- [should] timeline: File attachments on a box, no
- [should] timeline: Meeting notes, no
- [should] automation: LinkedIn lead capture into a box, partial  (Thread field holds the LinkedIn URL only)
- [should] fields: Magic columns: days in stage / last stage change, partial  (daysInStage is a static imported number never recomputed)
- [should] fields: Magic columns: last updated / created / creator, partial  (createdAt only)
- [should] fields: Magic columns: task counts / next task due, partial  (nextTaskDueDate static import value)
- [should] reports: Pipeline reports / dashboards, partial  (Real aggregates from one pipeline; some stat chips hard-coded (5.3% 12.5% 24.7%))
- [should] ux: Mobile usable, partial  (Sidebar collapses; grid and dialog fixed widths)
- [should] views: Hide / freeze / reorder / resize columns, partial  (Header drag/resize only; state in useState inside IIFE (rules-of-hooks bug))
- [could] ai: AI ask a question about a box, no
- [could] ai: AI autofill fields, no
- [could] automation: Integrations: forms / Calendly / Typeform, no  (Form.gershonCRM.com could feed this directly)
- [could] boxes: Linked boxes across pipelines, no
- [could] contacts: Contact enrichment, no
- [could] fields: Custom fields: formula, no
- [could] fields: Magic columns: last interaction / freshness, no
- [could] pipelines: Hide / archive / delete a pipeline, no
- [could] timeline: Follow a box / notifications, no  (Bell button has no handler)
- [could] ux: Keyboard shortcuts, no
- [could] reports: Funnel reports, partial  (Stage counts only)

## Left out on purpose (not scored)
- Email inside Gmail (sidebar / thread to box): Scope guard: gershonCRM is standalone - no Gmail integration
- Automatic email sharing from Gmail: Scope guard: no Gmail
- Email tracking (opens / clicks): Gmail extension feature - out of scope
- Mail merge with follow-ups: Outreach handled by Snov.io / Straight-in - decision pending (ROADMAP Epic 6)
- Snippets / thread splitter: Gmail extension features

## Yours, not in the original (not scored)
- Migrate from Streak (pipelines + boxes + contacts)
