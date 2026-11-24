---
description: Check the wiki's health. Runs the mechanical checks first, then the judgement checks
---
1. Run `node scripts/wiki-lint.mjs` and fix every ERROR.
2. For each STALE page, check its claims against the current code and fix the ones that are wrong.
3. Judgement checks:
   - Claims that contradict each other across pages
   - `> Unverified:` notes that the code can now answer
   - `> Risk:` notes that a commit may have fixed. Check, then update the note
   - Cross-repo or cross-service calls (UI → API, internal APIs, queues, workers, webhooks) that no page covers
   - Any secret or customer data that slipped into a page. Remove it immediately
4. Report what you fixed, and list the open Risks and Unverified notes that need a human owner.
