---
title: Module catalog
type: module
repos: [shop-web, shop-api, billing, infra]
verified_at: shop-web@4f1c2a9, shop-api@8b03d7e, billing@2e9a614, infra@c71d0b5
updated: 2026-11-19
---


# Module catalog

Every module in the four repos, one line each.

## shop-web (Next.js)

| Module | What it does | Page |
|---|---|---|
| `shop-web:app/(store)/products` | Product list and detail pages | — |
| `shop-web:app/(store)/cart` | Cart and checkout pages | [Checkout](../flows/checkout.md) |
| `shop-web:app/(auth)/sign-in` | Sign-in form | [Sign-in](../flows/sign-in.md) |
| `shop-web:app/admin/orders` | Staff order list and detail | — |

## shop-api (NestJS)

| Module | What it does | Page |
|---|---|---|
| `shop-api:src/modules/auth` | Sign-in, sessions, guards | [Sign-in](../flows/sign-in.md) |
| `shop-api:src/modules/orders` | Orders and stock reservation | [Checkout](../flows/checkout.md) |
| `shop-api:src/modules/admin` | Staff-only endpoints and exports | [shop-api architecture](../architecture/shop-api.md) |
| `shop-api:src/jobs` | Queue workers | [Order fulfilment](../flows/order-fulfilment.md) |

## billing (Python, FastAPI)

| Module | What it does | Page |
|---|---|---|
| `billing:app/routers/charges.py` | Create charges and refunds | [Checkout](../flows/checkout.md) |
| `billing:app/routers/webhooks.py` | Payment provider webhooks | [Checkout](../flows/checkout.md) |

## infra (Terraform)

| Module | What it does | Page |
|---|---|---|
| `infra:modules/redis` | Redis for the job queues | [Order fulfilment](../flows/order-fulfilment.md) |
| `infra:envs/prod` | Production environment root | — |
