---
description: Update wiki pages affected by commits in any repo since the last sync
---
1. Run `node scripts/wiki-status.mjs`. It reads the "Last synced" table in wiki/log.md and lists, for each repo,
   the new commits, the pages to update, and the changed areas that have no page. If everything is up to date, stop.
2. For each repo with changes, run `git -C <repo> log --oneline <sha>..HEAD` and read the diffs of the files that the affected pages cite.
3. Find the pages that cite a changed file (`grep -rl "<repo>:<path>" wiki`). Run `node scripts/wiki-lint.mjs` as
   well; its STALE warnings list the same pages.
4. For each of those pages, read the diff and the current code, then fix every claim that is no longer true. Don't
   rewrite text that is still correct. If a `> Risk:` was fixed in the code, replace it with a line saying what changed.
5. If a commit adds a new flow, an important module or a notable decision, add it to "Planned next" in index.md,
   or build the page if it is small.
6. Update `verified_at` on each page you checked, then update the "Last synced" table and append a history entry.
7. Run lint until there are no errors.
8. Run `node scripts/build-risk-register.mjs`. For every risk it lists as "Needs severity, category and title",
   set those fields in `risks.json` (severity C/H/M/L; reuse an existing category; title under 80 characters). If a new
   note repeats an existing risk, set `"duplicateOf": <id>` instead. Run the script again until nothing is unrated.
9. If a change affects a box or arrow on the system map, or the steps in a flow's "At a glance" diagram, update that
   Mermaid block. Then run `node scripts/build-site.mjs` to rebuild everything in `site/`.
10. Finish by summarising which pages changed and why, and which risks were added, reworded or removed.
