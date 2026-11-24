# Acme Shop developer wiki: index

> **Example only.** Acme Shop is a made-up project. This sample shows what the template produces after `/wiki-init`
> and a few `/wiki-build` runs. The citations point at repos that don't exist.

The rules for agents are in CLAUDE.md. The sync state is in [log.md](log.md).

**New here?** Read these in order:
0. [System map (start here)](architecture/system-map.md): the whole system in one diagram
1. [shop-api architecture](architecture/shop-api.md)
2. [Sign-in](flows/sign-in.md), then [Checkout](flows/checkout.md) and [Order fulfilment](flows/order-fulfilment.md)

**Looking for one module?** Start at the [Module catalog](modules/catalog.md).

## Architecture
- [System map (start here)](architecture/system-map.md): apps, services, queues, databases and outside services
- [shop-api architecture (NestJS)](architecture/shop-api.md): modules, guards, the job queue, how to add a module

## Flows
- [Sign-in](flows/sign-in.md): password and session cookie, shared by the storefront and the admin
- [Checkout](flows/checkout.md): cart to paid order, across shop-api and the billing service
- [Order fulfilment](flows/order-fulfilment.md): paid order to shipped parcel, through the job queue

## Modules
- [Module catalog](modules/catalog.md): every module in all four repos

## Decisions
- [0001: Billing is a separate Python service](decisions/0001-separate-billing-service.md)

## Incidents
- [2026-03: duplicate charges on webhook retry](incidents/2026-03-duplicate-charges.md)
