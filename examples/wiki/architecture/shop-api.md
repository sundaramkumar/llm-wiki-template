---
title: shop-api architecture (NestJS)
type: architecture
repos: [shop-api]
verified_at: shop-api@8b03d7e
updated: 2026-11-19
---


# shop-api architecture (NestJS)

How the main API is put together. Each feature is a NestJS module under `src/modules/`
(`shop-api:src/app.module.ts → AppModule`).

## Request path

1. A global `SessionGuard` reads the session cookie and loads the user (`shop-api:src/auth/session.guard.ts → SessionGuard`).
2. Routes marked `@Roles('staff')` also pass `RolesGuard` (`shop-api:src/auth/roles.guard.ts → RolesGuard`).
3. Validation pipes check request bodies against DTO classes.

> Risk: `GET /admin/export` is in the admin controller but has no `@Roles('staff')` decorator, so any signed-in
> shopper may be able to download the order export (`shop-api:src/modules/admin/admin.controller.ts → exportOrders`). Untested.

## Background jobs

Workers run in the same process and read BullMQ queues: `fulfilment`, `emails` and `stock-sync`
(`shop-api:src/jobs/queues.ts → QUEUES`). See [Order fulfilment](../flows/order-fulfilment.md).

## How to add a module

Create `src/modules/<name>/` with a module, controller and service, register it in `AppModule`, and add a
migration under `src/db/migrations/`. Decorate staff-only routes with `@Roles('staff')`.
