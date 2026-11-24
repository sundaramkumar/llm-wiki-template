---
title: <What happens, e.g. "Checkout and payment">
type: flow
repos: [<prefixes>]
verified_at: <prefix>@<sha>, <prefix>@<sha>
updated: YYYY-MM-DD
---

# <Title>

<Two or three sentences: what this flow does, who starts it, where it ends.>

## At a glance

```mermaid
sequenceDiagram
  autonumber
  participant UI as web app
  participant API as API
  participant Q as queue
  participant DB as database
  UI->>API: POST /orders
  API->>DB: save order
  API->>Q: enqueue confirmation
  API-->>UI: 201
  Note over Q: worker sends the email later
```

<!-- 6–15 steps, one per real call between components, in order. Keep the details for the Steps section. -->

## Steps

1. **<Actor or trigger>** <what happens> (`<prefix>:<path> → <symbol>`).
2. ...

## Failure points

| Where it fails | What the user sees | What is left behind | Recovery |
|---|---|---|---|
| | | | |

## Gotchas

- ...

<!-- Use "> Risk: ..." for possible bugs (say "Untested") and "> Unverified: ..." for claims the code can't confirm. -->
