# {{PROJECT_NAME}} developer wiki: rules for coding agents

<!-- TEMPLATE: /wiki-init replaces every {{...}} placeholder and deletes this comment.
     Until then this wiki is not set up: run /wiki-init first. -->

This repo is the **developer wiki** for {{PROJECT_NAME}}. It covers the code repos listed below. Each one is a
sibling folder of this repo, and the paths are in `repos.json`. Project type: **{{PROFILE}}**
(see `profiles/{{PROFILE}}.md`).

| Prefix | Repo | Stack |
|---|---|---|
{{REPO_TABLE}}

The **code is the primary source of truth**. The wiki records what the code can't say on its own: flows that
cross files and repos, why things are built the way they are, business rules, and gotchas. End-user documentation
does not belong here.

## Layout

| Path | What | Who edits |
|---|---|---|
| `wiki/index.md` | Catalogue of every page | You |
| `wiki/log.md` | The last synced commit for each repo, plus history | You |
| `wiki/architecture/system-map.md` | The system in one diagram, plus "start here by task". Read first | You |
| `wiki/modules/catalog.md` | Every module in every repo, one line each, with its page | You |
{{LAYOUT_ROWS}}
| `wiki/decisions/` | Why something is built this way: context, decision, consequences | You |
| `wiki/incidents/` | Incident summaries and recurring failure patterns | You |
| `wiki/raw/` | Evidence that lives outside git (plans, QA reports converted to markdown) | **Humans only. Never edit** |

Page skeletons for each type are in `page-templates/`.

## Citations

Cite code as `` `<repo>:<path from that repo's root> → <symbol>` ``, inside backticks with the arrow. The symbol is
optional and can be a function, class, method, constant, route name, table, config key or resource name. For example:

{{CITATION_EXAMPLES}}

Docs that live inside a repo are cited the same way (`<repo>:docs/SOMETHING.md`), so you don't need to copy them
into `raw/`. `node scripts/wiki-lint.mjs` checks that every cited file exists and contains the symbol.

## Page front matter

```yaml
---
title: <Title>
type: {{PAGE_TYPES}}
repos: [<repo prefixes this page cites>]
verified_at: <repo>@<sha>, <repo>@<sha>   # each repo's commit the page was last checked against
updated: YYYY-MM-DD
---
```

## Rules

1. **Ground every claim** with a citation. Never guess. If you can't confirm something, write `> Unverified: ...`.
2. **Don't copy code.** Don't paste function bodies, SQL, route lists or schemas. Explain what happens and why.
3. **Mark possible bugs as `> Risk:`**, describe them from the code, and say that they are untested. Never "fix" code
   from the wiki.
4. Use **normal markdown links** between pages, e.g. `[Checkout](../flows/checkout.md)`.
5. Keep each page focused and under about 200 lines. Split it if it grows past that.
6. **Never put secrets in the wiki.** Don't copy env values, passwords, keys or tokens, and don't copy customer data
   or production log lines. Name env variables (`PAYMENT_API_KEY`), never their values.
7. **Never read** these files or folders, and never copy anything from them into the wiki:
   {{NEVER_READ}}

## Operations

- **Build** a page: one flow or module at a time (`/wiki-build`). Read the code in every repo it touches first.
- **Sync** (`/wiki-sync`): update only the pages that cite files changed since the last sync, bump their
  `verified_at`, and update `log.md`. `node scripts/wiki-status.mjs` shows what changed.
- **Query** (`/wiki-ask`): answer from the wiki first, then confirm in the code. Save answers that will be useful again.
- **Lint:** run `node scripts/wiki-lint.mjs` and fix every ERROR. Re-check pages flagged STALE.
- **Risk register:** after adding, changing or removing `> Risk:` notes, run `node scripts/build-risk-register.mjs`
  and rate any new risks in `risks.json`.
- **Diagrams:** the system map and each main flow's "At a glance" section are Mermaid diagrams. Keep them in step with
  the page text.
- **Site:** after building or syncing pages, run `node scripts/build-site.mjs`. It rebuilds everything in `site/`
  (home page, guide, system map, risk register, page graph). Everything in `site/` is generated: don't edit it by hand.
