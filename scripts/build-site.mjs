#!/usr/bin/env node
// Rebuilds every generated page in site/ and writes site/index.html, the home page that links them.
//   node scripts/build-site.mjs           run every builder, then write the home page
//   node scripts/build-site.mjs --home    only rewrite the home page
// To add a view: write a builder that outputs site/<name>.html and add it to VIEWS below. Any other .html file in
// site/ still shows up on the home page under "More views", using its <title> and <meta name="description">.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "site");
const WIKI = path.join(ROOT, "wiki");
let CONFIG = {};
try { CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "wiki.config.json"), "utf8")); } catch {}
const NAME = CONFIG.name && !CONFIG.name.includes("{{") ? CONFIG.name : path.basename(ROOT).replace(/-wiki$/, "");
const REPO_URL = CONFIG.wikiRepoUrl ? CONFIG.wikiRepoUrl.replace(/\/+$/, "") : "";

// The known views, in the order a new developer should open them
const VIEWS = [
  { file: "guide.html", script: "build-guide.mjs", title: "How to use this wiki", when: "New here? Read first",
    text: "What the wiki is, how to read a page, and how to use Claude Code to ask, build and sync pages." },
  { file: "system-map.html", script: "build-map.mjs", title: "System map", when: "Understand the system",
    text: "The whole system in one diagram, with clickable boxes, plus a numbered sequence diagram for every main flow." },
  { file: "risk-register.html", script: "build-risk-register.mjs", title: "Risk register", when: "Before you change code",
    text: "Every possible bug or gap the wiki noticed, rated by severity. Filter by area, export to CSV." },
  { file: "page-graph.html", script: "build-graph.mjs", title: "Page graph", when: "Maintaining the wiki",
    text: "How the wiki pages link to each other. Finds orphan pages and the pages everything depends on." },
];

if (!process.argv.includes("--home")) {
  for (const v of VIEWS) {
    const s = path.join(ROOT, "scripts", v.script);
    if (fs.existsSync(s)) process.stdout.write(execFileSync(process.execPath, [s], { cwd: ROOT, encoding: "utf8" }));
  }
}
fs.mkdirSync(SITE, { recursive: true });

// --- numbers for the home page ---------------------------------------------------------------------------------
const walk = (d) => fs.readdirSync(d).flatMap((n) => {
  const p = path.join(d, n);
  if (fs.statSync(p).isDirectory()) return n === "raw" || n.startsWith(".") ? [] : walk(p);
  return p.endsWith(".md") ? [p] : [];
});
const pages = fs.existsSync(WIKI) ? walk(WIKI) : [];
const typeCount = {};
for (const p of pages) {
  const t = fs.readFileSync(p, "utf8").match(/^type:\s*(\S+)/m)?.[1];
  if (t) typeCount[t] = (typeCount[t] || 0) + 1;
}
let sev = {}, risksTotal = 0;
try {
  const all = JSON.parse(fs.readFileSync(path.join(ROOT, "risks.json"), "utf8")).risks || [];
  const live = all.filter((r) => !r.removed_on);
  for (const r of live.filter((r) => !r.duplicateOf || !live.some((x) => x.id === r.duplicateOf))) {
    sev[r.severity || "U"] = (sev[r.severity || "U"] || 0) + 1; risksTotal++;
  }
} catch {}
let synced = [], lastHistory = "";
try {
  const log = fs.readFileSync(path.join(WIKI, "log.md"), "utf8");
  const tbl = log.split(/^## Last synced/m)[1]?.split(/^## /m)[0] || "";
  synced = [...tbl.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm)]
    .map((m) => [m[1], m[2]]).filter(([a]) => a !== "Repo" && !/^-+$/.test(a));
  lastHistory = log.match(/^### (\d{4}-\d{2}-\d{2})/m)?.[1] || "";
} catch {}

// Views on disk: the known ones first, then anything else in site/
const known = new Set(VIEWS.map((v) => v.file));
const meta = (file) => {
  const t = fs.readFileSync(path.join(SITE, file), "utf8");
  const title = t.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || file.replace(/\.html$/, "");
  return { title, text: t.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || "" };
};
const present = VIEWS.filter((v) => fs.existsSync(path.join(SITE, v.file)));
const extra = fs.readdirSync(SITE).filter((f) => f.endsWith(".html") && f !== "index.html" && !known.has(f)).sort()
  .map((f) => ({ file: f, ...meta(f) }));

// Wiki entry points (relative links work locally; GitHub links when the repo URL is set)
const wikiLink = (p) => (REPO_URL ? `${REPO_URL}/blob/main/wiki/${p}` : `../wiki/${p}`);
const exists = (p) => fs.existsSync(path.join(WIKI, p));
const START = [
  ["architecture/system-map.md", "System map (text)", "Same diagram, with the boxes table and \"start here by task\""],
  ["index.md", "Wiki index", "Every page, grouped by area"],
  ["modules/catalog.md", "Module catalog", "Every module in every repo, one line each"],
  ["log.md", "Sync log", "Which commit of each repo the wiki was last checked against"],
].filter(([p]) => exists(p));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const SEV = [["C", "Critical"], ["H", "High"], ["M", "Medium"], ["L", "Low"], ["U", "Not rated"]];
const statRisk = SEV.filter(([k]) => sev[k]).map(([k, n]) => `<span class="pill s${k}">${sev[k]} ${n}</span>`).join(" ");
const types = Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${n} ${esc(t)}`).join(" · ");

const card = (v, i) => `<a class="card${i === 0 ? " first" : ""}" href="${esc(v.file)}">
  ${v.when ? `<span class="when">${esc(v.when)}</span>` : ""}
  <span class="ct">${esc(v.title)} <span aria-hidden="true">→</span></span>
  ${v.text ? `<span class="cd">${esc(v.text)}</span>` : ""}
</a>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(NAME)} Wiki</title>
<style>
:root{--bg:#f7f6f3;--surface:#fff;--text:#1d1d1b;--muted:#5f5e5a;--line:#e3e1db;--accent:#1f5f99;--accent-bg:#e7eff7;
  --c:#b42318;--h:#c4320a;--m:#a15c07;--l:#3b6e3b;--u:#5f5e5a}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#161615;--surface:#1f1f1d;--text:#ecebe7;--muted:#a4a29c;
  --line:#34332f;--accent:#7fb2e5;--accent-bg:#1c2a38;--c:#f97066;--h:#fb8a4f;--m:#e3a948;--l:#8cc68c;--u:#a4a29c}}
:root[data-theme="dark"]{--bg:#161615;--surface:#1f1f1d;--text:#ecebe7;--muted:#a4a29c;--line:#34332f;--accent:#7fb2e5;
  --accent-bg:#1c2a38;--c:#f97066;--h:#fb8a4f;--m:#e3a948;--l:#8cc68c;--u:#a4a29c}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1000px;margin:0 auto;padding:40px 16px 80px}
h1{font-size:28px;margin:0 0 6px}
.lead{color:var(--muted);margin:0 0 28px;max-width:680px}
h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:34px 0 12px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:14px}
.card{display:flex;flex-direction:column;gap:6px;padding:18px;background:var(--surface);border:1px solid var(--line);
  border-radius:12px;text-decoration:none;color:var(--text);transition:border-color .15s,transform .15s}
.card:hover{border-color:var(--accent);transform:translateY(-1px)}
.card.first{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}
.when{font-size:12px;font-weight:600;color:var(--accent)}
.ct{font-size:18px;font-weight:700}
.cd{font-size:14px;color:var(--muted)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.stat{padding:16px 18px;background:var(--surface);border:1px solid var(--line);border-radius:12px}
.stat .n{font-size:26px;font-weight:700}
.stat .l{font-size:13px;color:var(--muted)}
.stat .x{font-size:13px;margin-top:6px}
.pill{display:inline-block;font-size:12px;font-weight:600;padding:1px 8px;border-radius:999px;border:1px solid currentColor;margin:2px 2px 0 0}
.sC{color:var(--c)}.sH{color:var(--h)}.sM{color:var(--m)}.sL{color:var(--l)}.sU{color:var(--u)}
table{border-collapse:collapse;font-size:13px;margin-top:6px}
td{padding:1px 12px 1px 0}
code{font:12px ui-monospace,Menlo,monospace}
ul.links{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px 14px}
ul.links a{font-weight:600;color:var(--accent);text-decoration:none}
ul.links a:hover{text-decoration:underline}
ul.links span{display:block;font-size:13px;color:var(--muted)}
footer{margin-top:40px;font-size:13px;color:var(--muted)}
</style>
</head>
<body>
<main>
  <h1>${esc(NAME)} developer wiki</h1>
  <p class="lead">How the ${esc(NAME)} code works, written from the code and checked against it. New here? Read the guide, then open
  the system map and follow its links into the wiki pages.</p>

  <h2>Views</h2>
  <div class="cards">
${present.map(card).join("\n")}
  </div>
${extra.length ? `
  <h2>More views</h2>
  <div class="cards">
${extra.map((v) => card(v, -1)).join("\n")}
  </div>` : ""}

  <h2>The wiki in numbers</h2>
  <div class="stats">
    <div class="stat"><div class="n">${pages.length}</div><div class="l">wiki pages</div><div class="x">${types}</div></div>
    <div class="stat"><div class="n">${risksTotal}</div><div class="l">open risks</div><div class="x">${statRisk || "none recorded"}</div></div>
    <div class="stat"><div class="n">${esc(lastHistory || "—")}</div><div class="l">last wiki update</div>
      ${synced.length ? `<table>${synced.map(([r, c]) => `<tr><td>${esc(r)}</td><td><code>${esc(c)}</code></td></tr>`).join("")}</table>` : ""}</div>
  </div>
${START.length ? `
  <h2>Read the wiki</h2>
  <ul class="links">
${START.map(([p, t, d]) => `    <li><a href="${esc(wikiLink(p))}" target="_blank" rel="noopener">${esc(t)}</a><span>${esc(d)}</span></li>`).join("\n")}
  </ul>` : ""}

  <footer>Generated by <code>node scripts/build-site.mjs</code>. Don't edit files in <code>site/</code> by hand.
  ${REPO_URL ? "Wiki links open on GitHub." : ""} The system map loads its diagram library from a CDN, so it needs internet access.</footer>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(SITE, "index.html"), html);
console.log(`Wrote site/index.html: ${present.length + extra.length} views`);
