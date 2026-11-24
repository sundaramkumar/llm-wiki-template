---
title: 0001: Billing is a separate Python service
type: decision
repos: [billing, shop-api]
verified_at: shop-web@4f1c2a9, shop-api@8b03d7e, billing@2e9a614, infra@c71d0b5
updated: 2026-11-19
---


# 0001: Billing is a separate Python service

## Context
The finance team writes Python and needed to own invoicing rules and tax reports
(`billing:docs/ARCHITECTURE.md`).

## Decision
All payment-provider calls and invoices live in the `billing` service. shop-api never sees card data and only
learns "paid" or "refunded" through `/internal` calls.

## Consequences
- Two databases to keep in step: an order can be paid in billing but not yet marked paid in shop-api.
- See [Checkout](../flows/checkout.md) for the hand-off.
