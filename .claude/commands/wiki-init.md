---
description: Set up this wiki template for a new codebase (any stack). Run once, right after creating the wiki repo
argument-hint: [optional: repo folders, e.g. "../shop-api ../shop-web"]
---
Set up this LLM wiki for a new project. Arguments: $ARGUMENTS

Work in stages and **stop for the user's confirmation where marked**. Never read the files on the never-read list
(step 3), even while scanning.

## 1. Repos
- If the arguments name repo folders, use them. Otherwise list the sibling folders of this wiki (`ls ..`) that are git
  repos and ask which ones belong to the project. A monorepo is one repo.
- Give each a short prefix (lowercase, dashes allowed, e.g. `api`, `web`, `mobile`, `infra`). These prefixes are used in
  every citation, so keep them short and stable.
- Write `repos.json` as `{ "<prefix>": "../<folder>" }`. Check each path with `git -C <path> rev-parse --short HEAD`.

## 2. Detect the stack and the project type
- For each repo, read only the manifest and top-level layout: `package.json`, `pom.xml`, `build.gradle(.kts)`, `*.csproj`
  / `*.sln`, `go.mod`, `pyproject.toml` / `requirements.txt`, `composer.json`, `Gemfile`, `pubspec.yaml`, `Cargo.toml`,
  `*.tf`, `Chart.yaml`, `docker-compose*.yml`, and the folder tree two levels down (skip `node_modules`, build output
  and vendored code). Use `profiles/stacks.md` to work out the framework and what a "module" means for it.
- Pick the profile from `profiles/` that fits best (web-app, mobile-app, data-pipeline, infrastructure, library,
  monolith). A project can mix types: pick the main one and borrow folders from another.
- **Stop and confirm** with the user: the repo table (prefix, folder, stack), the profile, and the project name.

## 3. Fill in the rules
- In `CLAUDE.md`, replace every `{{...}}` placeholder:
  - `{{PROJECT_NAME}}`, `{{PROFILE}}`
  - `{{REPO_TABLE}}`: one row per repo, `| prefix | ../folder | stack in a few words |`
  - `{{LAYOUT_ROWS}}`: the profile's main folders, as table rows like the ones around them
  - `{{PAGE_TYPES}}`: the profile's page types joined with ` | `
  - `{{CITATION_EXAMPLES}}`: two real citations from these repos, checked to exist
  - `{{NEVER_READ}}`: the common list from `profiles/stacks.md`, the entries for these stacks, and anything you saw in
    the repos that looks like secrets, credentials, production data, logs or customer data. Ask the user if unsure.
  Then delete the TEMPLATE comment.
- Set `name` and `profile` in `wiki.config.json`. Add folders to `status.ignore` if this stack has generated or vendored
  code in unusual places. Ask whether the wiki will live on GitHub; if so set `wikiRepoUrl`.
- Replace `{{PROJECT_NAME}}` in `wiki/index.md` and remove the "not set up yet" note.
- Create the profile's folders under `wiki/` (an empty folder needs no placeholder file).
- Delete the template's own `index.html` and `examples/` folder. They describe the template, not this project; the
  project gets its own home page in `site/`.

## 4. Module catalog
- Write `wiki/modules/catalog.md` (front matter `type: module`): for each repo, a table with one row per module, as
  `profiles/stacks.md` defines a module for that stack. Columns: `Module` (cited as `` `prefix:path` ``), `What it does`
  (one line, from reading its entry files), `Page` (`—` for now), `Notes`. Mark modules that look unused.
- For a large repo (hundreds of modules), group them by area and say so at the top.
- Set `verified_at` to each repo's current HEAD.

## 5. System map
- Write `wiki/architecture/system-map.md` from `page-templates/system-map.md`: the layered diagram (people → apps →
  backends → background work → data, outside services on the side, about 15 arrows, a `click` line per box), the
  boxes table, and a first "start here by task" table. Base it on what step 2 found (entry points, queues, databases,
  external APIs); mark anything you inferred rather than read in the code with `> Unverified:`.
- Link it first in `wiki/index.md` ("New here?").

## 6. Page plan
- Propose the first pages from the profile's "Build first" list, filled in with this project's real flows and modules:
  usually 5–10 flow pages, 1–2 architecture pages, and the decisions you can see evidence for.
- For each, give one line on what it covers and which repos it touches. Estimate the cost: about 50–150k tokens per page,
  depending on how many files it touches.
- Write the plan into the "Planned next" list in `wiki/index.md` and link the catalog from the index.
- **Stop and confirm** the plan with the user.

## 7. Pilot and first sync point
- Build the first **two** pages with `/wiki-build` (each flow page starts with an "At a glance" sequence diagram) so the user can check the depth and style before the rest is built.
- Fill the "Last synced" table in `wiki/log.md` with each repo's HEAD and add a history entry for the setup.
- Run `node scripts/wiki-lint.mjs` (fix every error), `node scripts/build-risk-register.mjs` (rate any risks in
  `risks.json`), `node scripts/build-site.mjs` (builds `site/`: home page, guide, system map, register, graph) and
  `node scripts/wiki-status.mjs` (should say up to date).

## 8. Finish
Report: open `site/index.html` first. Then report the repos and prefixes, the profile, the never-read list, how many modules the catalog has, the pilot pages and
anything they found (Risk / Unverified notes), and the remaining plan. Suggest next steps:
- `git init` this wiki and push it to a **private** repo (Risk notes describe weaknesses).
- Add a short `CLAUDE.md` to each code repo pointing agents to `../<this wiki>` (see README → "Pointer for code repos").
- Build the rest of the plan, in parallel where pages don't overlap, then run `/wiki-sync` weekly.
