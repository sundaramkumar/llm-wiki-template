# Profile: monolith / legacy system

For large single codebases (ERP, CRM, long-lived business systems) where most logic sits in one repo and knowledge
lives in people's heads.

## Folders

| Folder | What goes there |
|---|---|
| `domains/` | One page per business area (orders, inventory, accounting, HR…): its data, rules, screens and jobs |
| `flows/` | Processes that cross domains (order to cash, procure to pay, month-end close) |
| `batch-jobs/` | Scheduled and batch jobs: what they do, when, what depends on them, how to re-run them |
| `integrations/` | Every external system: direction, format, schedule, failure handling |
| `modules/` | `catalog.md`, plus important shared modules |

Page types: `domain | flow | batch-job | integration | module | decision | incident`

## Build first

1. Domain map: the business areas and which code belongs to which
2. The 2–3 processes the business can't run without
3. Batch jobs and their order
4. Integrations
5. Customisations on top of a base product (ERPNext, Odoo, Salesforce…): what was changed and why

## What to look for

- Business rules hard-coded in unexpected places (triggers, reports, UI scripts)
- Dead code still called by a forgotten job
- Data fixes applied by hand that the code depends on
- Coupling: one change that breaks several domains
