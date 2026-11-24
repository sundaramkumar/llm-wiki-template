#!/usr/bin/env node
// Builds site/guide.html: how to use this wiki, and how to use Claude Code with it.
//   node scripts/build-guide.mjs        (also run by build-site.mjs)
// Project details come from wiki.config.json, repos.json and .claude/commands/*.md, so the guide stays accurate.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "site", "guide.html");
const read = (p, d = "") => { try { return fs.readFileSync(path.join(ROOT, p), "utf8"); } catch { return d; } };
let CONFIG = {}; try { CONFIG = JSON.parse(read("wiki.config.json", "{}")); } catch {}
let REPOS = {}; try { REPOS = JSON.parse(read("repos.json", "{}")); } catch {}
const NAME = CONFIG.name && !CONFIG.name.includes("{{") ? CONFIG.name : path.basename(ROOT).replace(/-wiki$/, "");
const WIKI_DIR = path.basename(ROOT);
const REPO_URL = CONFIG.wikiRepoUrl ? CONFIG.wikiRepoUrl.replace(/\/+$/, "") : "";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const prefixes = Object.keys(REPOS);
const p1 = prefixes[0] || "api";
const repoRows = Object.entries(REPOS).map(([k, v]) => `<tr><td><code>${esc(k)}</code></td><td><code>${esc(v)}</code></td></tr>`).join("");

// Slash commands, with examples for the ones we know
const EXAMPLES = {
  "wiki-ask": [`/wiki-ask how does a request find the logged-in user?`, `/wiki-ask what happens when a payment fails halfway?`],
  "wiki-build": [`/wiki-build password reset flow`, `/wiki-build ${p1}:src/modules/orders`],
  "wiki-sync": [`/wiki-sync`],
  "wiki-lint": [`/wiki-lint`],
  "wiki-init": [`/wiki-init`],
};
const WHEN = {
  "wiki-ask": "You have a question about how something works",
  "wiki-build": "A flow or module has no page yet",
  "wiki-sync": "The code repos have new commits (weekly, or after a big merge)",
  "wiki-lint": "Before a release, or when pages feel out of date",
  "wiki-init": "Only once, when setting up a new project's wiki",
};
const cmdDir = path.join(ROOT, ".claude", "commands");
const commands = (fs.existsSync(cmdDir) ? fs.readdirSync(cmdDir) : []).filter((f) => f.endsWith(".md")).sort()
  .map((f) => {
    const t = fs.readFileSync(path.join(cmdDir, f), "utf8"), n = f.replace(/\.md$/, "");
    return { n, desc: t.match(/^description:\s*(.+)$/m)?.[1] || "", arg: t.match(/^argument-hint:\s*(.+)$/m)?.[1] || "" };
  });
const order = ["wiki-ask", "wiki-build", "wiki-sync", "wiki-lint", "wiki-init"];
commands.sort((a, b) => (order.indexOf(a.n) + 1 || 99) - (order.indexOf(b.n) + 1 || 99));
const cmdRows = commands.map((c) => `<tr><td><code>/${esc(c.n)}${c.arg ? " " + esc(c.arg) : ""}</code></td><td>${esc(c.desc)}</td>
  <td>${esc(WHEN[c.n] || "")}</td><td>${(EXAMPLES[c.n] || []).map((e) => `<code class="ex">${esc(e)}</code>`).join("")}</td></tr>`).join("\n");

const scripts = [
  ["build-site.mjs", "Rebuild everything in <code>site/</code> (this guide, the home page, map, register, graph)"],
  ["wiki-status.mjs", "What changed in each code repo since the last sync, and which pages that affects"],
  ["wiki-lint.mjs", "Check every citation still points at real code, links work, every page is in the index"],
  ["build-risk-register.mjs", "Rebuild the risk register (<code>--check</code> reports without writing)"],
  ["build-map.mjs", "Rebuild the system map page"],
  ["build-graph.mjs", "Rebuild the page graph"],
].filter(([s]) => fs.existsSync(path.join(ROOT, "scripts", s)))
  .map(([s, d]) => `<tr><td><code>node scripts/${s}</code></td><td>${d}</td></tr>`).join("");

// A real citation from the wiki for the example, if there is one
const walkMd = (d) => (fs.existsSync(d) ? fs.readdirSync(d) : []).flatMap((n) => { const p = path.join(d, n);
  return fs.statSync(p).isDirectory() ? (n === "raw" || n.startsWith(".") ? [] : walkMd(p)) : p.endsWith(".md") ? [p] : []; });
let SAMPLE_CITE = `${p1}:src/orders/service.ts → createOrder`;
for (const f of walkMd(path.join(ROOT, "wiki"))) {
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, (c) => "\\" + c);
  const m = fs.readFileSync(f, "utf8").match(new RegExp("`((?:" + prefixes.map(escRe).join("|") + "):[^`\\s]+ → [^`]+)`"));
  if (prefixes.length && m) { SAMPLE_CITE = m[1]; break; }
}
const gh = (p) => (REPO_URL ? `${REPO_URL}/blob/main/${p}` : `../${p}`);
const SECTIONS = [["what", "What this is"], ["read", "Reading a page"], ["find", "Finding things"],
  ["claude", "Using Claude Code"], ["prompts", "Good prompts"], ["update", "Keeping it up to date"],
  ["setup", "Setup"], ["rules", "Rules"], ["faq", "FAQ"]];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(NAME)} Wiki Guide</title>
<meta name="description" content="How to read and use the wiki, and how to work with Claude Code on it.">
<style>
:root{--bg:#f7f6f3;--surface:#fff;--text:#1d1d1b;--muted:#5f5e5a;--line:#e3e1db;--accent:#1f5f99;--accent-bg:#e7eff7;
  --code-bg:#f1efe9;--warn-bg:#fdf3e1;--warn:#8a5a00;--risk:#b42318;--risk-bg:#fbeceb}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#161615;--surface:#1f1f1d;--text:#ecebe7;--muted:#a4a29c;
  --line:#34332f;--accent:#7fb2e5;--accent-bg:#1c2a38;--code-bg:#2a2a27;--warn-bg:#2f2614;--warn:#e3a948;--risk:#f97066;--risk-bg:#311a18}}
:root[data-theme="dark"]{--bg:#161615;--surface:#1f1f1d;--text:#ecebe7;--muted:#a4a29c;--line:#34332f;--accent:#7fb2e5;
  --accent-bg:#1c2a38;--code-bg:#2a2a27;--warn-bg:#2f2614;--warn:#e3a948;--risk:#f97066;--risk-bg:#311a18}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.65 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:1120px;margin:0 auto;padding:28px 16px 80px;display:grid;grid-template-columns:200px minmax(0,1fr);gap:40px}
@media (max-width:820px){.wrap{grid-template-columns:1fr}.toc{position:static!important}}
.toc{position:sticky;top:20px;align-self:start;font-size:14px}
.toc a{display:block;padding:4px 10px;border-radius:6px;color:var(--muted);text-decoration:none}
.toc a:hover{background:var(--accent-bg);color:var(--accent)}
.home{font-size:13px;font-weight:600;color:var(--accent);text-decoration:none}
h1{font-size:28px;margin:6px 0 4px}
.lead{color:var(--muted);margin:0 0 10px;max-width:700px}
h2{font-size:21px;margin:44px 0 10px;padding-top:6px;border-top:1px solid var(--line)}
h3{font-size:16px;margin:22px 0 6px}
p,li{max-width:760px}
a{color:var(--accent)}
code{font:13px ui-monospace,Menlo,monospace;background:var(--code-bg);padding:1px 5px;border-radius:4px}
pre{background:var(--code-bg);padding:12px 14px;border-radius:8px;overflow-x:auto;font:13px/1.5 ui-monospace,Menlo,monospace;margin:8px 0 14px}
pre code{background:none;padding:0}
table{border-collapse:collapse;width:100%;background:var(--surface);border:1px solid var(--line);font-size:14px;margin:8px 0 16px;display:block;overflow-x:auto;width:max-content;max-width:100%}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:12px;text-transform:uppercase;letter-spacing:.03em;color:var(--muted)}
code.ex{display:block;margin:2px 0;white-space:nowrap}
.note{background:var(--accent-bg);border-left:3px solid var(--accent);padding:10px 14px;border-radius:6px;margin:12px 0;max-width:760px}
.warn{background:var(--warn-bg);border-left:3px solid var(--warn);padding:10px 14px;border-radius:6px;margin:12px 0;max-width:760px}
.risk{background:var(--risk-bg);border-left:3px solid var(--risk);padding:8px 12px;border-radius:6px;margin:8px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:10px 0}
.box{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px}
.box b{display:block;margin-bottom:4px}
.steps{counter-reset:s;list-style:none;padding:0}
.steps li{counter-increment:s;position:relative;padding:0 0 10px 38px}
.steps li::before{content:counter(s);position:absolute;left:0;top:0;width:26px;height:26px;border-radius:50%;background:var(--accent);color:var(--bg);
  font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}
details{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:10px 14px;margin:8px 0;max-width:760px}
summary{cursor:pointer;font-weight:600}
</style>
</head>
<body>
<div class="wrap">
<nav class="toc" aria-label="Contents">
  <a class="home" href="index.html">← Wiki home</a>
  <div style="height:10px"></div>
  ${SECTIONS.map(([id, t]) => `<a href="#${id}">${t}</a>`).join("\n  ")}
</nav>
<main>
<h1>How to use the ${esc(NAME)} wiki</h1>
<p class="lead">What this wiki is, how to read its pages, and how to use Claude Code to ask questions, build pages and keep
them up to date.</p>

<h2 id="what">What this is</h2>
<p>This is an <b>LLM wiki</b>: developer documentation that coding agents (Claude Code) write by reading the code, and
that they keep checking against the code. People review it and decide what to keep. It explains what the code can't say on its own:
flows that cross several files and repos, why things are built the way they are, business rules and gotchas.</p>
<div class="grid">
  <div class="box"><b>The code is the source of truth</b>Every claim cites the code it came from. If the wiki and the code disagree, trust the code and fix the page.</div>
  <div class="box"><b>Pages know how fresh they are</b>Each page records the commit of each repo it was checked against, so a script can tell which pages are out of date.</div>
  <div class="box"><b>It's for developers</b>Not end-user help. Not a copy of the code: it explains, it doesn't paste.</div>
</div>
<p>It covers these repos. Each one is a folder next to <code>${esc(WIKI_DIR)}</code>:</p>
<table><tr><th>Prefix used in citations</th><th>Folder</th></tr>${repoRows}</table>

<h2 id="read">Reading a page</h2>
<h3>The header (front matter)</h3>
<pre><code>---
title: Outbound message send
type: flow                      # flow, module, architecture, decision, incident
repos: [${esc(prefixes.slice(0, 2).join(", ") || "api, web")}]
verified_at: ${esc(prefixes.slice(0, 2).map((p) => p + "@1a2b3c4").join(", ") || "api@1a2b3c4")}   # commit each repo was checked at
updated: 2026-11-19
---</code></pre>
<p><code>verified_at</code> is the important line. If the code has changed since that commit, the page may be out of date: check
the code, or run <code>/wiki-sync</code>.</p>

<h3>Citations</h3>
<p>Code is cited as <code>repo:path → symbol</code>, for example <code>${esc(SAMPLE_CITE)}</code>.
Open that file in that repo and search for the symbol. The lint script checks that every cited file still exists and still
contains the symbol.</p>

<h3>Notes in the text</h3>
<div class="risk"><b>&gt; Risk:</b> a possible bug or gap noticed while reading the code. <b>Not confirmed</b>: nobody has tested it.
Every Risk note is listed and rated in the <a href="risk-register.html">risk register</a>.</div>
<div class="note"><b>&gt; Unverified:</b> something the writer could not confirm in the code (for example, it depends on a
config value or an outside service). Treat it as a lead, not a fact.</div>

<h3>"At a glance" diagrams</h3>
<p>Main flow pages start with a numbered sequence diagram: who calls whom, in order. Read it first, then the steps below it.
All of them are collected on the <a href="system-map.html">system map</a> page. They also render on GitHub and in Obsidian.</p>

<h2 id="find">Finding things</h2>
<table>
<tr><th>You want to…</th><th>Go to</th></tr>
<tr><td>Understand the whole system</td><td><a href="system-map.html">System map</a>, then the "Start here by task" table on it</td></tr>
<tr><td>Find the page for one module or screen</td><td><a href="${esc(gh("wiki/modules/catalog.md"))}">Module catalog</a>: every module in every repo, one line each</td></tr>
<tr><td>See every page</td><td><a href="${esc(gh("wiki/index.md"))}">Wiki index</a></td></tr>
<tr><td>Know what might be broken before changing an area</td><td><a href="risk-register.html">Risk register</a>, filtered by area</td></tr>
<tr><td>Search for a word</td><td>GitHub search in the wiki repo, <code>grep -ri "word" wiki/</code>, or Obsidian (open <code>wiki/</code> as a vault)</td></tr>
<tr><td>Just get an answer</td><td>Ask Claude Code: <code>/wiki-ask your question</code> (below)</td></tr>
</table>

<h2 id="claude">Using Claude Code</h2>
<p>There are two ways to work: from a <b>code repo</b> (the usual way, while you code) or from the <b>wiki folder</b>
(to ask questions or update the wiki).</p>

<h3>1. While coding, in a code repo</h3>
<p>Each code repo has a <code>CLAUDE.md</code> that tells Claude the wiki is at <code>../${esc(WIKI_DIR)}</code>. When you ask
Claude about the code, it reads the matching wiki page first, then checks it against the code. You don't need to do
anything special; just keep the wiki cloned next to the code repos and pull it now and then.</p>
<pre><code>cd ../${esc(Object.values(REPOS)[0]?.replace(/^\.\.\//, "") || "my-api")}
claude
&gt; Using the wiki, explain how checkout works, then show me where in this repo.
&gt; I'm changing the login code. Which wiki pages and risks does this affect?</code></pre>
<div class="note">Claude doesn't edit the wiki from a code repo. It tells you which wiki page a change affects, and you (or the
weekly <code>/wiki-sync</code>) update it.</div>

<h3>2. In the wiki folder: slash commands</h3>
<pre><code>cd ${esc(WIKI_DIR)}
claude</code></pre>
<p>Then type one of these:</p>
<table>
<tr><th>Command</th><th>What it does</th><th>Use it when</th><th>Example</th></tr>
${cmdRows}
</table>
<p><code>/wiki-ask</code> answers from the wiki, then confirms in the code, and cites both. If the answer is useful again it
offers to save it into the right page. You can also just ask in plain words without the command; the rules in
<code>CLAUDE.md</code> still apply.</p>

<h3>What Claude follows here</h3>
<p>The wiki's <a href="${esc(gh("CLAUDE.md"))}">CLAUDE.md</a> holds the rules Claude follows in this folder: cite every claim,
don't paste code, mark possible bugs as Risk, never read secret files, and never put secrets in a page. Read it once; it's short.</p>

<h2 id="prompts">Good prompts</h2>
<div class="grid">
  <div class="box"><b>Ask about behaviour, not files</b><code>/wiki-ask what happens if the same webhook arrives twice?</code> works better than "explain worker.ts".</div>
  <div class="box"><b>Ask for the source</b>"…and cite the code" makes Claude show the <code>repo:path → symbol</code> so you can check it.</div>
  <div class="box"><b>Name the area for risks</b>"Which open risks are in payments, and which would my change touch?"</div>
  <div class="box"><b>Before a change</b>"Read the wiki page for X and list what else depends on it before I change it."</div>
  <div class="box"><b>After a change</b>"Which wiki pages are affected by my diff?" (in the code repo)</div>
  <div class="box"><b>When the wiki is wrong</b>"The page says X but the code does Y. Fix the page with a citation." (in the wiki folder)</div>
</div>
<div class="warn">Don't paste passwords, keys, <code>.env</code> values, customer data or production logs into a prompt or a page.
Name an env variable, never its value.</div>

<h2 id="update">Keeping it up to date</h2>
<h3>Weekly routine (about 10 minutes plus review)</h3>
<ol class="steps">
  <li>Pull the code repos and the wiki.</li>
  <li>Run <code>node scripts/wiki-status.mjs</code>. It lists new commits per repo and the pages they affect. If it says
  up to date, you're done.</li>
  <li>In Claude Code in the wiki folder, run <code>/wiki-sync</code>. It updates only the affected pages, bumps their
  <code>verified_at</code>, records the sync in <code>wiki/log.md</code>, and rebuilds the site.</li>
  <li>Review the diff, especially new <b>Risk</b> notes and their severity in <code>risks.json</code>.</li>
  <li>Commit and push the wiki.</li>
</ol>
<h3>Scripts (no Claude needed, Node 18+)</h3>
<table><tr><th>Command</th><th>What it does</th></tr>${scripts}</table>
<h3>Fixing a risk</h3>
<p>When a Risk is fixed in the code, the next <code>/wiki-sync</code> removes the note from the page. The register keeps the
risk's number and marks it removed, so numbers are never reused.</p>

<h2 id="setup">Setup</h2>
<ol class="steps">
  <li>Clone the wiki <b>next to</b> the code repos, so the folders in the table above resolve:
<pre><code>Projects/${esc(NAME)}/
${Object.values(REPOS).map((v) => "├── " + v.replace(/^\.\.\//, "") + "/").join("\n")}
└── ${esc(WIKI_DIR)}/</code></pre></li>
  <li>Install Node.js 18+ (for the scripts) and Claude Code.</li>
  <li>Open <code>site/index.html</code> in a browser. That's the wiki home, with links to this guide and every view.</li>
  <li>Optional: open the <code>wiki/</code> folder as an Obsidian vault for linked browsing.</li>
</ol>

<h2 id="rules">Rules</h2>
<table>
<tr><th>Do</th><th>Don't</th></tr>
<tr><td>Fix a wrong page with a citation to the code</td><td>Edit files in <code>site/</code>: they're generated</td></tr>
<tr><td>Treat Risk notes as leads to check</td><td>"Fix" code because a wiki page says so, without checking</td></tr>
<tr><td>Keep the wiki repo private</td><td>Share the risk register outside the team</td></tr>
<tr><td>Name env variables</td><td>Copy secret values, customer data or production logs anywhere in the wiki</td></tr>
<tr><td>Put outside documents (plans, QA reports) in <code>wiki/raw/</code> as markdown</td><td>Let Claude edit <code>wiki/raw/</code>: it's for humans only</td></tr>
</table>

<h2 id="faq">FAQ</h2>
<details><summary>The wiki says one thing and the code does another. Which is right?</summary>
<p>The code. Check the page's <code>verified_at</code>: the code probably changed after it. Run <code>/wiki-sync</code>, or fix the
page yourself with a citation.</p></details>
<details><summary>Is every Risk a real bug?</summary>
<p>No. They come from reading the code, not from tests or production. Some will be false alarms. The severity is a first
guess to set the order of work.</p></details>
<details><summary>A module has no page. Should I write one?</summary>
<p>Run <code>/wiki-build &lt;module or flow&gt;</code> in the wiki folder. Claude reads the code in every repo it touches, writes the
page, adds it to the index, and runs the checks. Review it before you commit.</p></details>
<details><summary>How much does it cost to run?</summary>
<p>Reading the wiki and the scripts cost nothing. <code>/wiki-sync</code> costs depend on how much code changed; a normal week
is small. Building a new page is roughly 50–150k tokens.</p></details>
<details><summary>Can I use the wiki without Claude?</summary>
<p>Yes. It's plain markdown with links. Read it on GitHub, in an editor, or in Obsidian. The scripts also run without Claude.</p></details>
<details><summary>Why does the system map need internet?</summary>
<p>It loads its diagram library from a CDN. The same diagrams are in the wiki pages as Mermaid blocks, which render on GitHub
and in Obsidian.</p></details>

</main>
</div>
</body>
</html>
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`Wrote site/guide.html: ${commands.length} commands, ${prefixes.length} repos`);
