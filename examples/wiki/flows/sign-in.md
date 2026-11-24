---
title: Sign-in
type: flow
repos: [shop-web, shop-api]
verified_at: shop-web@4f1c2a9, shop-api@8b03d7e, billing@2e9a614, infra@c71d0b5
updated: 2026-11-19
---


# Sign-in

How shoppers and staff sign in. Both use the same form and the same session cookie; staff pages also check the role.

## At a glance

```mermaid
sequenceDiagram
  autonumber
  participant W as shop-web
  participant A as shop-api
  participant DB as Postgres
  W->>A: POST /auth/sign-in (email, password)
  A->>DB: find user by email
  A->>A: compare password hash (argon2)
  A->>DB: create session row, 14 days
  A-->>W: Set-Cookie sid (httpOnly)
  W->>A: later requests send the cookie
  A->>A: SessionGuard loads the user, RolesGuard checks staff routes
```

## Steps

1. The form posts to `shop-api:src/modules/auth/auth.controller.ts → signIn`.
2. The password is checked with argon2 (`shop-api:src/modules/auth/auth.service.ts → verifyPassword`).
3. A session row is written and its id is sent as an httpOnly cookie.

> Risk: there is no rate limit on `/auth/sign-in`, so passwords can be guessed quickly. Untested.

> Unverified: whether the load balancer adds its own rate limit. The infra repo doesn't show one.
