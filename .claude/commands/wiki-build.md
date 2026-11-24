---
description: Build one wiki page for a flow or an important module
argument-hint: <flow or module, e.g. "checkout" or api:src/modules/billing>
---
Build the wiki page for: $ARGUMENTS

1. Read CLAUDE.md, wiki/index.md and any related existing pages.
2. Trace the code across **every repo** it touches (paths are in repos.json). Follow calls between repos as well,
   such as UI → API, service → service, API → queues and workers, and outgoing webhooks or third-party APIs.
3. For a flow, start the page with an "At a glance" Mermaid sequence diagram (see `page-templates/flow.md`): one
   arrow per real call between components, in order. If the flow adds a box or connection, update the system map.
   Write the page in the right folder for this project's profile (see CLAUDE.md → Layout), starting from the matching
   skeleton in `page-templates/` and following the front matter, citation format and rules in
   CLAUDE.md. Cover the steps, a table of failure points and what each one leaves behind, and the gotchas. Mark
   possible bugs with `> Risk:`, and anything you couldn't confirm with `> Unverified:`.
4. Set `verified_at` to the current HEAD short sha of each repo the page cites (`git -C <repo> rev-parse --short HEAD`).
5. Add the page to wiki/index.md (and remove it from "Planned next" if it was listed there), and append an entry to wiki/log.md.
6. Run `node scripts/wiki-lint.mjs` and fix any errors.
7. If the page has `> Risk:` notes, run `node scripts/build-risk-register.mjs` and rate them in `risks.json`.
   Then run `node scripts/build-site.mjs` to rebuild everything in `site/`.
