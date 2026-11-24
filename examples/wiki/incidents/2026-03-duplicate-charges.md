---
title: 2026-03: duplicate charges on webhook retry
type: incident
repos: [billing]
verified_at: shop-web@4f1c2a9, shop-api@8b03d7e, billing@2e9a614, infra@c71d0b5
updated: 2026-11-19
---


# 2026-03: duplicate charges on webhook retry

## What happened
The payment provider retried a webhook after a slow response, and billing created a second invoice for the same
payment.

## Fix
Billing now stores the provider's payment id with a unique index and ignores repeats
(`billing:app/routers/webhooks.py → payment_webhook`).

## Watch for
Any new webhook handler needs the same check. See [Checkout](../flows/checkout.md).
