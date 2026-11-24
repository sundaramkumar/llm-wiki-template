# Example: the "Acme Shop" sample wiki

**Acme Shop is made up.** This folder shows what the template produces for a project, so you can see the result before
running `/wiki-init` on a real codebase. The citations point at repos that don't exist.

- **Open `site/index.html`** in a browser: the home page, guide, system map, risk register and page graph.
- `wiki/` holds the markdown pages the site was built from: a system map, three flows with "At a glance" diagrams, an
  architecture page, the module catalog, a decision and an incident.
- The sample covers four repos in four stacks (Next.js, NestJS, Python FastAPI, Terraform) to show that one wiki can
  span mixed stacks.

This folder is only for reference. `/wiki-init` deletes it from a new project's wiki, and no script reads it.

To rebuild the sample after changing the scripts, copy `examples/` into a scratch folder, add `scripts/` and
`.claude/commands/` from the template, and run `node scripts/build-site.mjs` there. Then copy `site/` back.
