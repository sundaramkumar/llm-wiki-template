#!/usr/bin/env node
// Builds site/system-map.html: the system map page plus every flow's "At a glance" diagram, on one page.
//   node scripts/build-map.mjs
// Sources (no LLM needed):
//   - the system map page (wiki.config.json → map.page, default architecture/system-map.md)
//   - every wiki page with a "## At a glance" section containing a ```mermaid block
// The page loads marked and mermaid from a CDN, so it needs internet access to render.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIKI = path.join(ROOT, "wiki");
const OUT = path.join(ROOT, "site", "system-map.html");
let CONFIG = {};
try { CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "wiki.config.json"), "utf8")); } catch {}
const NAME = CONFIG.name && !CONFIG.name.includes("{{") ? CONFIG.name : path.basename(ROOT).replace(/-wiki$/, "");
const REPO_URL = CONFIG.wikiRepoUrl ? CONFIG.wikiRepoUrl.replace(/\/+$/, "") + "/blob/main/wiki/" : "";
const MAP_PAGE = CONFIG.map?.page ?? "architecture/system-map.md";

const walk = (d) => fs.readdirSync(d).sort().flatMap((n) => {
  const p = path.join(d, n);
  if (fs.statSync(p).isDirectory()) return n === "raw" || n.startsWith(".") ? [] : walk(p);
  return p.endsWith(".md") ? [p] : [];
});
const rel = (p) => path.relative(WIKI, p).split(path.sep).join("/");
const stripFm = (s) => s.replace(/^---\n[\s\S]*?\n---\n/, "").trimStart();
const titleOf = (s, id) => s.match(/^title:\s*(.+)$/m)?.[1]?.replace(/^["']|["']$/g, "").trim() || s.match(/^#\s+(.+)$/m)?.[1] || id;
// Wiki-relative path → the URL the HTML should open (GitHub when configured, else the local file)
const urlFor = (wikiPath, hash = "") => (REPO_URL ? REPO_URL + encodeURI(wikiPath) : "../wiki/" + encodeURI(wikiPath)) + hash;
const resolveFrom = (pageId, href) => path.posix.normalize(path.posix.join(path.posix.dirname(pageId), href));

// Rewrites relative .md links and mermaid click targets in a page's markdown
function rewriteLinks(pageId, md) {
  return md
    .replace(/\]\((?![a-z]+:|#)([^)\s#]+\.md)(#[^)]*)?\)/gi, (_, href, hash) => `](${urlFor(resolveFrom(pageId, href), hash || "")})`)
    .replace(/^(\s*click\s+\S+\s+)"(?![a-z]+:)([^"]+\.md)(#[^"]*)?"/gim, (_, pre, href, hash) => `${pre}"${urlFor(resolveFrom(pageId, href), hash || "")}"`);
}

const pages = walk(WIKI).map((f) => ({ id: rel(f), src: fs.readFileSync(f, "utf8") }));
const mapPage = pages.find((p) => p.id === MAP_PAGE);

// "At a glance" diagrams, in the order the system map links to them, then the rest alphabetically
const glance = [];
for (const p of pages) {
  const sec = p.src.match(/^## At a glance(?::\s*(.+))?\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  const mer = sec?.[2].match(/```mermaid\n([\s\S]*?)```/);
  if (!mer) continue;
  const body = stripFm(p.src);
  const intro = body.replace(/^#\s+.+\n+/, "").split(/\n\s*\n/)[0].replace(/\n/g, " ").trim();
  glance.push({ id: p.id, title: titleOf(p.src, p.id), sub: sec[1] || "", url: urlFor(p.id),
    intro: rewriteLinks(p.id, intro), mermaid: mer[1] });
}
const order = mapPage ? [...stripFm(mapPage.src).matchAll(/\]\(([^)\s#]+\.md)/g)].map((m) => resolveFrom(MAP_PAGE, m[1])) : [];
const rank = (id) => { const i = order.indexOf(id); return i < 0 ? 1e6 : i; };
glance.sort((a, b) => rank(a.id) - rank(b.id) || a.title.localeCompare(b.title));

const data = {
  name: NAME,
  built: new Date().toISOString().slice(0, 10),
  map: mapPage ? { title: titleOf(mapPage.src, MAP_PAGE), url: urlFor(MAP_PAGE), md: rewriteLinks(MAP_PAGE, stripFm(mapPage.src).replace(/^#\s+.+\n/, "")) } : null,
  flows: glance,
};

// ---------------------------------------------------------------------------------------------------------------
const TEMPLATE = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__NAME__ System Map</title>
<style>
:root{
  --bg:#f7f6f3; --surface:#ffffff; --text:#1d1d1b; --muted:#5f5e5a; --line:#e3e1db; --accent:#1f5f99;
  --accent-bg:#e7eff7; --code-bg:#f1efe9;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#161615; --surface:#1f1f1d; --text:#ecebe7; --muted:#a4a29c; --line:#34332f; --accent:#7fb2e5;
    --accent-bg:#1c2a38; --code-bg:#2a2a27;
  }
}
:root[data-theme="dark"]{
  --bg:#161615; --surface:#1f1f1d; --text:#ecebe7; --muted:#a4a29c; --line:#34332f; --accent:#7fb2e5;
  --accent-bg:#1c2a38; --code-bg:#2a2a27;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
header{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line)}
.bar{max-width:1180px;margin:0 auto;padding:12px 16px;display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center}
h1{font-size:19px;margin:0}
nav{display:flex;gap:6px;flex-wrap:wrap}
nav a{font-size:14px;font-weight:600;color:var(--accent);text-decoration:none;padding:5px 10px;border-radius:6px}
nav a:hover,nav a.on{background:var(--accent-bg)}
.sub{color:var(--muted);font-size:13px}
main{max-width:1180px;margin:0 auto;padding:18px 16px 80px}
section{margin-bottom:44px}
h2{font-size:22px;margin:8px 0 12px}
.md h2{font-size:18px;margin:28px 0 10px}
.md table{border-collapse:collapse;width:100%;background:var(--surface);border:1px solid var(--line);font-size:14px;margin:8px 0 14px;display:block;overflow-x:auto;width:max-content;max-width:100%}
.md th,.md td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top}
.md th{font-size:12px;text-transform:uppercase;letter-spacing:.03em;color:var(--muted)}
a{color:var(--accent)}
.home{font-size:13px;font-weight:600;color:var(--accent);text-decoration:none}.home:hover{text-decoration:underline}
code{font:13px ui-monospace,Menlo,monospace;background:var(--code-bg);padding:1px 4px;border-radius:4px}
.diagram{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px;overflow-x:auto;margin:10px 0}
.diagram svg{max-width:100%;height:auto}
.hint{font-size:13px;color:var(--muted);margin:-4px 0 10px}
.tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
input[type=search]{font:inherit;font-size:14px;padding:7px 10px;border:1px solid var(--line);border-radius:6px;background:var(--surface);color:var(--text);flex:1;min-width:200px;max-width:420px}
.flow{background:var(--surface);border:1px solid var(--line);border-radius:10px;margin:12px 0}
.flow > summary{cursor:pointer;padding:12px 16px;list-style:none;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.flow > summary::-webkit-details-marker{display:none}
.flow > summary::before{content:"▸";color:var(--muted)}
.flow[open] > summary::before{content:"▾"}
.flow .t{font-weight:700;font-size:16px}
.flow .s{color:var(--muted);font-size:13px}
.flow .body{padding:0 16px 14px}
.flow .intro{margin:0 0 6px}
.flow .diagram{border:0;padding:0}
.err{color:#b42318;font-size:13px;white-space:pre-wrap}
button.btn{font:inherit;font-size:13px;font-weight:600;padding:6px 11px;border:1px solid var(--accent);color:var(--accent);background:transparent;border-radius:6px;cursor:pointer}
button.btn:hover{background:var(--accent-bg)}
</style>
</head>
<body>
<header><div class="bar">
  <a class="home" href="index.html">← Wiki home</a>
  <h1>__NAME__ System Map</h1>
  <nav><a href="#system">System</a><a href="#flows">Flows at a glance</a></nav>
  <span class="sub" id="sub"></span>
</div></header>
<main>
  <section id="system"><h2 id="systitle"></h2><p class="hint">Click a box to open its wiki page.</p><div class="md" id="map"></div></section>
  <section id="flows">
    <h2>Flows at a glance</h2>
    <p class="hint">Who calls whom, in order. Open a flow to see its diagram; the title links to the full page.</p>
    <div class="tools">
      <input type="search" id="q" placeholder="Filter flows…" aria-label="Filter flows">
      <button class="btn" type="button" id="all">Open all</button>
      <button class="btn" type="button" id="none">Close all</button>
    </div>
    <div id="list"></div>
  </section>
</main>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
<script>
const DATA = __DATA__;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const dark = matchMedia("(prefers-color-scheme: dark)").matches;
$("sub").textContent = DATA.flows.length + " flows · built " + DATA.built;

if (!window.marked || !window.mermaid) {
  document.querySelector("main").insertAdjacentHTML("afterbegin", '<p class="err">Could not load the diagram libraries (no internet?). The same diagrams are in the wiki pages and render on GitHub and in Obsidian.</p>');
}
mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: dark ? "dark" : "default",
  sequence: { showSequenceNumbers: true, useMaxWidth: true }, flowchart: { useMaxWidth: true, htmlLabels: true } });

let n = 0;
async function draw(el, code) {
  try {
    const { svg, bindFunctions } = await mermaid.render("m" + (n++), code);
    el.innerHTML = svg; if (bindFunctions) bindFunctions(el);
    el.querySelectorAll("a").forEach((a) => a.setAttribute("target", "_blank"));
  } catch (e) {
    el.innerHTML = '<p class="err">Diagram error: ' + esc(e.message || e) + "</p><pre>" + esc(code) + "</pre>";
  }
}

// System map: markdown, with mermaid blocks turned into diagrams
if (DATA.map) {
  $("systitle").innerHTML = '<a href="' + DATA.map.url + '" target="_blank" rel="noopener">' + esc(DATA.map.title) + "</a>";
  $("map").innerHTML = marked.parse(DATA.map.md);
  $("map").querySelectorAll("a").forEach((a) => { a.target = "_blank"; a.rel = "noopener"; });
  $("map").querySelectorAll("pre > code.language-mermaid").forEach((c) => {
    const d = document.createElement("div"); d.className = "diagram"; c.parentElement.replaceWith(d); draw(d, c.textContent);
  });
} else {
  $("systitle").textContent = "System map";
  $("map").innerHTML = '<p class="err">No system map page yet (architecture/system-map.md).</p>';
}

// Flows: one collapsible card each; the diagram is drawn the first time it opens
$("list").innerHTML = DATA.flows.map((f, i) =>
  '<details class="flow" data-i="' + i + '"' + (i < 2 ? " open" : "") + '><summary><a class="t" href="' + f.url + '" target="_blank" rel="noopener">' +
  esc(f.title) + "</a>" + (f.sub ? '<span class="s">' + esc(f.sub) + "</span>" : "") +
  '</summary><div class="body"><div class="intro">' + marked.parseInline(f.intro) + '</div><div class="diagram"></div></div></details>').join("");
document.querySelectorAll(".flow").forEach((d) => {
  const show = () => { if (d.open && !d.dataset.drawn) { d.dataset.drawn = 1; draw(d.querySelector(".diagram"), DATA.flows[+d.dataset.i].mermaid); } };
  d.addEventListener("toggle", show); show();
  d.querySelectorAll(".intro a").forEach((a) => { a.target = "_blank"; a.rel = "noopener"; });
});
$("q").addEventListener("input", () => {
  const q = $("q").value.toLowerCase();
  document.querySelectorAll(".flow").forEach((d) => { const f = DATA.flows[+d.dataset.i];
    d.style.display = !q || (f.title + " " + f.intro + " " + f.mermaid).toLowerCase().includes(q) ? "" : "none"; });
});
$("all").onclick = () => document.querySelectorAll(".flow").forEach((d) => { if (d.style.display !== "none") d.open = true; });
$("none").onclick = () => document.querySelectorAll(".flow").forEach((d) => d.open = false);
const navs = document.querySelectorAll("nav a");
addEventListener("scroll", () => { const y = $("flows").getBoundingClientRect().top < 120;
  navs[0].classList.toggle("on", !y); navs[1].classList.toggle("on", y); }, { passive: true });
</script>
</body>
</html>
`;

const html = TEMPLATE
  .replace("__DATA__", () => JSON.stringify(data).replace(/</g, "\\u003c"))
  .replaceAll("__NAME__", NAME.replace(/[<&]/g, ""));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`Wrote site/system-map.html: ${mapPage ? "system map + " : "no system map (" + MAP_PAGE + " missing), "}${glance.length} flow diagrams`);
