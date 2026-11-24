---
title: Order fulfilment
type: flow
repos: [shop-api, infra]
verified_at: shop-web@4f1c2a9, shop-api@8b03d7e, billing@2e9a614, infra@c71d0b5
updated: 2026-11-19
---


# Order fulfilment

From a paid order to a shipped parcel, through the `fulfilment` job queue.

## At a glance

```mermaid
sequenceDiagram
  autonumber
  participant A as shop-api
  participant Q as Redis queue fulfilment
  participant W as fulfilment worker
  participant C as Courier API
  participant DB as Postgres
  A->>Q: enqueue job (order id)
  Q->>W: job
  W->>C: create shipment
  C-->>W: tracking number
  W->>DB: order status SHIPPED, save tracking
  W->>Q: enqueue email shipping confirmation
  Note over W,C: on failure, retry 5 times with backoff, then the job is parked
```

## Steps

1. `shop-api:src/jobs/fulfilment.processor.ts → FulfilmentProcessor` takes the job.
2. It calls the courier (`shop-api:src/integrations/courier.client.ts → createShipment`).
3. Retries come from the queue settings (`shop-api:src/jobs/queues.ts → QUEUES`).
4. Redis is `infra:modules/redis/main.tf → aws_elasticache_cluster.jobs`.

> Risk: a parked job is only visible in the Redis dashboard; nothing alerts staff, so a paid order can sit unshipped. Untested.
