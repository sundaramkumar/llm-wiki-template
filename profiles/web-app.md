# Profile: web app / SaaS / APIs

For products with a backend API and one or more web frontends, often with workers, queues and third-party
integrations. EzPulze (multi-tenant WhatsApp SaaS: Deno API, Angular app, React + Express admin) was built this way.

## Folders

| Folder | What goes there |
|---|---|
| `flows/` | End-to-end paths, usually across repos: sign-in and permissions, the main user journeys, payments and billing, inbound and outbound integrations, data deletion |
| `modules/` | Important modules that a flow page doesn't fully cover, plus `catalog.md`; for big UIs, one page per screen under `modules/<app>/` |
| `architecture/` | How each app is put together: routing, auth guards and interceptors, state, API client, conventions, "how to add a module" |

Page types: `flow | module | architecture | decision | incident`

## Build first

1. Request lifecycle: how a request finds its user (and tenant, if multi-tenant), auth and permission checks
2. Auth, roles and permissions
3. The 2–3 journeys the business depends on (e.g. sign-up/onboarding, the core action, checkout or billing)
4. Inbound and outbound integrations (webhooks in, third-party APIs out, queues and workers)
5. One architecture page per app
6. Data deletion and retention, if the product holds personal data

## What to look for

- Where tenant or user scoping is enforced, and routes that skip it
- Background work: queues, retries, idempotency, what happens when a job fails halfway
- Money paths: double charges or credits, races, missing locks
- Config that differs between environments
