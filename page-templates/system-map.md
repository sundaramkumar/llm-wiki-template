---
title: System map (start here)
type: architecture
repos: [<all prefixes>]
verified_at: <prefix>@<sha>, <prefix>@<sha>
updated: YYYY-MM-DD
---

# System map (start here)

<One or two sentences: what the system is, who uses it, and what it talks to.>

<!-- Draw layers top to bottom: who uses it → apps → backends → background work → data, with outside services on the
     side. Keep it to about 15 arrows; list the connections you leave out in the table below. Add a `click` line for
     every box so it opens its wiki page in site/system-map.html. -->

```mermaid
flowchart TB
  subgraph who[" Who uses it "]
    direction LR
    user([End user])
    staff([Internal staff])
  end
  subgraph apps[" Apps "]
    direction LR
    web[web app<br/>framework]
  end
  subgraph back[" Backends "]
    direction LR
    api[API<br/>framework]
  end
  subgraph bg[" Background work "]
    direction LR
    queue[(Queue)]
    workers[Workers]
  end
  subgraph data[" Data "]
    direction LR
    db[(Database)]
  end
  user --> web
  web -->|HTTP| api
  api --> db
  api -->|enqueue| queue
  queue -->|jobs| workers
  workers --> db
  click web "web-architecture.md"
  click api "../flows/request-lifecycle.md"
```

## The boxes

| Box | What it is | Read |
|---|---|---|
| | <one line; mention connections not drawn> | <links> |

## Start here by task

| I need to… | Read, in this order |
|---|---|
| Understand the system | This page → <architecture pages> |
| Fix "<the most common production problem>" | <flow page> → <incident page> |
| Add a <screen / endpoint / table> | <architecture page → "How to add a module"> |

## Main flows at a glance

Each of these pages starts with an "At a glance" sequence diagram.

- [<Flow>](../flows/<flow>.md): <one line>
