# Streak recon (Replica method) — 2026-10-13

Status: ✅ recon + parity scored · ❌ rebuild not started

## Scope
- Original: Streak CRM (web). Slice: the CRM core — pipelines, stages, boxes, custom/magic columns, saved views, contacts/organizations, timeline, tasks, import/export, reports, automations/API.
- Out of scope (scope guard: standalone, no Gmail): Gmail sidebar, automatic email sharing, email tracking, snippets, thread splitter, mail merge.
- Who it is for: Gershon Consulting internal use (single tenant first), replacing Olivier's Streak account.

## Sources
- Pricing: https://www.streak.com/pricing
- Help center index: https://support.streak.com/llms.txt
- Custom columns: https://support.streak.com/en/articles/2563457-custom-columns
- Magic columns: https://support.streak.com/en/articles/2563465-magic-columns
- Saved views: https://support.streak.com/en/articles/14541349-filter-sort-and-group-boxes-using-saved-views
- Boxes: https://support.streak.com/en/articles/2563490-boxes
- Terms: https://www.streak.com/terms — no clause against building a competing product.
- Olivier's own Streak account (via the Streak connector): 166 pipelines; typical "<Client> - LG" pipeline = 6–10 stages, 7–10 fields.

## Inferred data model (Streak)
- Pipeline: name, icon, stages[], fields[], savedViews[], users[] (sharing)
- Stage: key, name, order, colour (fg/bg), boxCount
- Field definition: key, name, type (TEXT_INPUT, DROPDOWN, TAG, DATE, CHECKBOX, ASSIGNED_TO, CONTACT/ORG, FORMULA), dropdownOptions[], supported filter operators
- Box: pipeline, stage, name, fieldValues{fieldKey: value}, assignedTo[], followers[], contacts[], organizations[], linkedBoxes[], createdAt/creator, lastUpdated, stage-change timestamps
- Contact / Organization: shared across pipelines, linked many-to-many to boxes
- Timeline items: comment (@mentions), task (due, assignee, done), call log, meeting note, file, stage change, field change
- Saved view: name, filters (all/any/none, column + operator + value), sort[], groupBy, column visibility/order/width/freeze

Reference LG template (Urban Factory - LG): stages Lead, Contacted, Call Scheduled, Connected, Engaged, ReConnect, For Later Stage, Recycled. Fields: Source (dropdown), Interest (dropdown High/Medium/Low/tbc), Fit (dropdown), Done (checkbox), Thread (text, LinkedIn URL), Category (dropdown), Next Steps (dropdown), Industry (text), Leader (dropdown). Saved views: By Month, By Leader, By Week, By Interest, By Fit.

## Result
- Feature matrix: `features.csv` (60 scored rows + 5 out-of-scope + 1 Gershon-only)
- Parity: 24.1 / 100, must-haves 3 of 28 → not shippable. Full list: `parity.md`. Visual report: `streak-parity.html`.

## Size
L (a quarter) for full parity; the core loop (multi-pipeline + custom fields + grid with saved views + Streak import + login) is M.

## Next steps
1. ❌ Rebuild data model: pipelines, per-pipeline stages + field definitions, organizations, many contacts per box, users + login.
2. ❌ Spreadsheet grid: inline edit, sort, filter, group, saved views.
3. ❌ Streak importer via API/connector (replaces the boot-time MAbSilico CSV wipe).
4. ❌ Box essentials: comments, tasks, call logs, meeting notes, files, CSV export, global search.
5. ❌ Webhooks/API, automations, Form.gershonCRM feed, AI summary via Intelligence menu (Workers AI).
6. ❌ UI in unified Gershon design (Linalysis layout, Gershon.ai red).
