# Profile: library / SDK / framework

For packages other code depends on: SDKs, shared component libraries, internal frameworks.

## Folders

| Folder | What goes there |
|---|---|
| `api/` | The public surface, grouped by area: what each part is for, its guarantees, and its edge cases (not a copy of the reference docs) |
| `concepts/` | The ideas a user must understand: lifecycle, configuration model, error model, threading or async model |
| `extension-points/` | Plugins, hooks, middleware, overrides: how to extend safely |
| `modules/` | `catalog.md` of internal packages, plus pages for complex internals |

Page types: `api | concept | extension-point | module | decision | incident`

## Build first

1. Concepts overview: the 3–5 ideas everything else builds on
2. The main entry points and a typical call path through the internals
3. Error handling and what callers must do about each error
4. Versioning, deprecation and compatibility rules
5. Extension points

## What to look for

- Behaviour that callers rely on but that isn't documented
- Breaking changes hidden in minor versions
- Global state, thread safety, resource cleanup
