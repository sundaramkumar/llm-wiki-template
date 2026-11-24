#!/usr/bin/env node
// Builds site/page-graph.html: an interactive "spider" graph of how wiki pages link to each other.
//   node scripts/build-graph.mjs
// Nodes are pages (coloured by group, sized by links); edges are markdown links between pages.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIKI = path.join(ROOT, "wiki");
const OUT = path.join(ROOT, "site", "page-graph.html");
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "wiki.config.json"), "utf8"));
const NAME = CONFIG.name && !CONFIG.name.includes("{{") ? CONFIG.name : "Project";
// Set wikiRepoUrl (e.g. https://github.com/org/project-wiki) to get "Open on GitHub" links.
const REPO_URL = CONFIG.wikiRepoUrl ? CONFIG.wikiRepoUrl.replace(/\/+$/, "") + "/blob/main/wiki/" : "";
const HUBS = new Set(CONFIG.graph?.hubs ?? ["index.md", "log.md", "modules/catalog.md"]);
// Colour pairs (light, dark) handed out to page groups in order.
const PALETTE = [["#1f6fb2", "#6aa9e0"], ["#2e7d4f", "#6cc08f"], ["#7b3fa0", "#c08ee0"], ["#b4530f", "#f0a868"],
  ["#b42318", "#f08a80"], ["#0f8a8a", "#4fc4c4"], ["#9a7b00", "#e0c54f"], ["#c0367a", "#f08cbd"],
  ["#4a5bd4", "#9aa6f5"], ["#5f7a1f", "#b2cf6a"]];

const walk = (d) => fs.readdirSync(d).sort().flatMap((n) => {
  const p = path.join(d, n);
  if (fs.statSync(p).isDirectory()) return n === "raw" || n.startsWith(".") ? [] : walk(p);
  return p.endsWith(".md") ? [p] : [];
});
const rel = (p) => path.relative(WIKI, p).split(path.sep).join("/");
const files = walk(WIKI);
const ids = new Set(files.map(rel));

// Groups are folders: flows/, modules/, modules/admin/ … Hubs (index, log, catalog) form their own group.
const dirOf = (id) => (HUBS.has(id) ? "hub" : id.includes("/") ? id.slice(0, id.lastIndexOf("/")) : "pages");
const dirs = [...new Set(files.map((f) => dirOf(rel(f))))].filter((d) => d !== "hub").sort();
const GROUP_KEY = new Map(dirs.map((d, i) => [d, "g" + i]));
GROUP_KEY.set("hub", "hub");
const label = (d) => d.split("/").map((p, i) => (i ? p : p[0].toUpperCase() + p.slice(1)).replace(/-/g, " ")).join(" › ");
const groups = Object.fromEntries([...dirs.map((d) => [GROUP_KEY.get(d), label(d)]), ["hub", "Hubs (index, catalog, log)"]]);
const css = (dark) => [...dirs.map((d, i) => `--${GROUP_KEY.get(d)}:${PALETTE[i % PALETTE.length][dark ? 1 : 0]};`),
  `--hub:${dark ? "#9ca3af" : "#6b7280"};`].join(" ");
const groupOf = (id) => GROUP_KEY.get(dirOf(id));

const nodes = [];
const edgeSet = new Set();
for (const f of files) {
  const id = rel(f);
  const src = fs.readFileSync(f, "utf8");
  const fm = src.match(/^---\n([\s\S]*?)\n---/);
  const title = (fm && fm[1].match(/^title:\s*(.+)$/m)?.[1]) || src.match(/^#\s+(.+)$/m)?.[1] || id;
  nodes.push({
    id, title: title.replace(/^["']|["']$/g, "").trim(), group: groupOf(id),
    risks: (src.match(/^\s*>\s*Risk/gm) || []).length,
    unverified: (src.match(/^\s*>\s*Unverified/gm) || []).length,
    lines: src.split("\n").length,
  });
  for (const m of src.matchAll(/\]\(([^)\s#]+\.md)(?:#[^)]*)?\)/g)) {
    if (/^[a-z]+:/i.test(m[1])) continue;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(id), m[1]));
    if (target !== id && ids.has(target)) edgeSet.add(id + "\u0000" + target);
  }
}
const links = [...edgeSet].map((e) => { const [source, target] = e.split("\u0000"); return { source, target }; });


// ---------------------------------------------------------------------------------------------------------------
const TEMPLATE = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__NAME__ Wiki Graph</title>
<style>
.home{font-size:13px;font-weight:600;color:var(--accent);text-decoration:none}.home:hover{text-decoration:underline}
:root{
  --bg:#f7f6f3; --surface:#ffffff; --text:#1d1d1b; --muted:#5f5e5a; --line:#e3e1db; --edge:rgba(60,60,55,.16);
  --edge-hi:rgba(31,95,153,.75); --accent:#1f5f99; --accent-bg:#e7eff7; --risk:#b4530f;
  __CSS_LIGHT__
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#161615; --surface:#1f1f1d; --text:#ecebe7; --muted:#a4a29c; --line:#34332f; --edge:rgba(220,220,210,.13);
    --edge-hi:rgba(127,178,229,.85); --accent:#7fb2e5; --accent-bg:#1c2a38; --risk:#f0b27a;
    __CSS_DARK__
  }
}
:root[data-theme="dark"]{
  --bg:#161615; --surface:#1f1f1d; --text:#ecebe7; --muted:#a4a29c; --line:#34332f; --edge:rgba(220,220,210,.13);
  --edge-hi:rgba(127,178,229,.85); --accent:#7fb2e5; --accent-bg:#1c2a38; --risk:#f0b27a;
  __CSS_DARK__
}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column}
header{padding:14px 16px 10px;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}
h1{font-size:19px;margin:0}
.sub{color:var(--muted);font-size:13px}
.controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-left:auto}
input[type=search],select{font:inherit;font-size:13px;padding:6px 9px;border:1px solid var(--line);border-radius:6px;background:var(--surface);color:var(--text)}
label.chk{font-size:13px;color:var(--muted);display:flex;gap:5px;align-items:center;cursor:pointer}
button.btn{font:inherit;font-size:13px;font-weight:600;padding:6px 11px;border:1px solid var(--accent);color:var(--accent);background:transparent;border-radius:6px;cursor:pointer}
button.btn:hover{background:var(--accent-bg)}
.legend{display:flex;flex-wrap:wrap;gap:6px 12px;padding:8px 16px;border-bottom:1px solid var(--line);font-size:12px}
.legend button{font:inherit;font-size:12px;background:none;border:0;color:var(--text);cursor:pointer;display:flex;align-items:center;gap:5px;padding:2px 0}
.legend button.off{opacity:.35}
.legend i{width:10px;height:10px;border-radius:50%;display:inline-block}
.wrap{flex:1;display:flex;min-height:0;position:relative}
svg{flex:1;min-width:0;display:block;cursor:grab;touch-action:none}
svg.dragging{cursor:grabbing}
.edge{stroke:var(--edge);stroke-width:1}
.edge.hi{stroke:var(--edge-hi);stroke-width:1.6}
.edge.dim{stroke-opacity:.25}
.node circle{stroke:var(--surface);stroke-width:1.5;cursor:pointer}
.node.dim{opacity:.15}
.node.sel circle{stroke:var(--text);stroke-width:2.5}
.node text{font-size:var(--fs,11px);fill:var(--text);paint-order:stroke;stroke:var(--bg);stroke-width:3px;pointer-events:none}
.node .ring{fill:none;stroke:var(--risk);stroke-width:1.5;stroke-dasharray:3 2;pointer-events:none}
aside{width:320px;max-width:42vw;border-left:1px solid var(--line);background:var(--surface);padding:14px 16px;overflow:auto}
aside h2{font-size:16px;margin:0 0 4px}
aside .path{font:12px ui-monospace,Menlo,monospace;color:var(--muted);word-break:break-all}
aside .stats{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:12px 0}
aside .stat{background:var(--bg);border-radius:6px;padding:6px 9px}
aside .stat b{display:block;font-size:18px}
aside .stat span{font-size:11px;color:var(--muted)}
aside h3{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:14px 0 4px}
aside ul{margin:0;padding-left:16px}
aside li{margin:2px 0}
aside a{color:var(--accent);cursor:pointer}
.empty{color:var(--muted)}
@media (max-width:700px){
  .wrap{flex-direction:column}
  aside{width:auto;max-width:none;border-left:0;border-top:1px solid var(--line);max-height:42vh}
  .controls{margin-left:0}
}
</style>
</head>
<body>
<header>
  <div>
    <a class="home" href="index.html">← Wiki home</a>
    <h1>__NAME__ Wiki Graph</h1>
    <div class="sub" id="sub"></div>
  </div>
  <div class="controls">
    <input type="search" id="q" placeholder="Find a page…" aria-label="Find a page">
    <select id="size" aria-label="Node size">
      <option value="links">Size by links</option>
      <option value="risks">Size by Risk notes</option>
      <option value="lines">Size by page length</option>
    </select>
    <label class="chk"><input type="checkbox" id="hubs"> Show hub pages</label>
    <label class="chk"><input type="checkbox" id="labels" checked> Labels</label>
    <button class="btn" id="fit" type="button">Fit</button>
  </div>
</header>
<div class="legend" id="legend"></div>
<div class="wrap">
  <svg id="svg" aria-label="Graph of wiki pages and the links between them"><g id="view"><g id="edges"></g><g id="nodes"></g></g></svg>
  <aside id="panel"></aside>
</div>
<script>
const DATA = __DATA__;
const GROUPS = DATA.groups;
const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const hidden = new Set();
const byId = new Map(DATA.nodes.map((n) => [n.id, n]));
for (const n of DATA.nodes) { n.out = []; n.in = []; }
for (const l of DATA.links) { byId.get(l.source).out.push(l.target); byId.get(l.target).in.push(l.source); }

// --- state ---
let selected = null, query = "", labelMin = 0;
let nodes = [], links = [];
const svg = $("svg"), view = $("view");
let W = 800, H = 600, zoom = { k: 1, x: 0, y: 0 };

function visibleSet() {
  const showHubs = $("hubs").checked;
  return DATA.nodes.filter((n) => !hidden.has(n.group) && (showHubs || n.group !== "hub"));
}
function radius(n) {
  const m = $("size").value;
  const v = m === "risks" ? n.risks : m === "lines" ? n.lines / 25 : n.deg;
  return 4 + Math.sqrt(Math.max(0, v)) * (m === "risks" ? 3 : 2.2);
}

// --- layout (simple force simulation, no libraries) ---
function initPositions() {
  const groups = Object.keys(GROUPS);
  nodes.forEach((n) => {
    if (n.x === undefined) {
      const a = (groups.indexOf(n.group) / groups.length) * Math.PI * 2 + Math.random() * 0.6;
      const r = 250 + Math.random() * 250;
      n.x = Math.cos(a) * r; n.y = Math.sin(a) * r; n.vx = 0; n.vy = 0;
    }
  });
}
let alpha = 1, raf = null;
function tick() {
  const k = 0.06 * alpha;
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 0.01;
      const min = a.r + b.r + 6;
      const f = (4200 / d2) * alpha + (d2 < min * min ? (min - Math.sqrt(d2)) * 0.4 : 0);
      const d = Math.sqrt(d2); dx /= d; dy /= d;
      a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
    }
  }
  for (const l of links) {
    const a = l.s, b = l.t;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
    const f = (d - 120) * k * 0.35;
    a.vx += (dx / d) * f; a.vy += (dy / d) * f; b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
  }
  for (const n of nodes) {
    n.vx -= n.x * 0.0025 * alpha; n.vy -= n.y * 0.0025 * alpha; // gentle pull to centre
    if (n.fixed) { n.vx = n.vy = 0; continue; }
    n.vx *= 0.6; n.vy *= 0.6;
    n.x += Math.max(-30, Math.min(30, n.vx)); n.y += Math.max(-30, Math.min(30, n.vy));
  }
  alpha *= 0.985;
  draw();
  raf = alpha > 0.02 ? requestAnimationFrame(tick) : null;
}
function reheat(a = 0.6) { alpha = Math.max(alpha, a); if (!raf) raf = requestAnimationFrame(tick); }

// --- rendering ---
function build() {
  const vis = visibleSet();
  const set = new Set(vis.map((n) => n.id));
  nodes = vis;
  links = DATA.links.filter((l) => set.has(l.source) && set.has(l.target)).map((l) => ({ s: byId.get(l.source), t: byId.get(l.target) }));
  for (const n of nodes) n.deg = 0;
  for (const l of links) { l.s.deg++; l.t.deg++; }
  for (const n of nodes) n.r = radius(n);
  const degs = nodes.map((n) => n.deg).sort((a, b) => b - a);
  labelMin = degs[Math.min(degs.length - 1, 14)] || 0;
  initPositions();
  const eg = $("edges"), ng = $("nodes");
  eg.textContent = ""; ng.textContent = "";
  for (const l of links) { const e = document.createElementNS(NS, "line"); e.setAttribute("class", "edge"); eg.appendChild(e); l.el = e; }
  for (const n of nodes) {
    const g = document.createElementNS(NS, "g"); g.setAttribute("class", "node");
    const c = document.createElementNS(NS, "circle"); c.setAttribute("fill", "var(--" + n.group + ")");
    const ring = document.createElementNS(NS, "circle"); ring.setAttribute("class", "ring");
    const t = document.createElementNS(NS, "text");
    t.textContent = n.title.length > 34 ? n.title.slice(0, 32) + "…" : n.title;
    const tt = document.createElementNS(NS, "title"); tt.textContent = n.title + " (" + n.id + ")";
    c.appendChild(tt); g.append(c, ring, t); ng.appendChild(g);
    n.el = g; n.c = c; n.ring = ring; n.t = t;
    c.addEventListener("pointerdown", (e) => startNodeDrag(e, n));
  }
  $("sub").textContent = nodes.length + " pages · " + links.length + " links · built " + DATA.built +
    " · click a page to see its links";
  restyle(); reheat(1);
}
function draw() {
  for (const l of links) {
    l.el.setAttribute("x1", l.s.x); l.el.setAttribute("y1", l.s.y);
    l.el.setAttribute("x2", l.t.x); l.el.setAttribute("y2", l.t.y);
  }
  const showLabels = $("labels").checked;
  for (const n of nodes) {
    n.c.setAttribute("cx", n.x); n.c.setAttribute("cy", n.y); n.c.setAttribute("r", n.r);
    n.ring.setAttribute("cx", n.x); n.ring.setAttribute("cy", n.y);
    n.ring.setAttribute("r", n.risks && $("size").value !== "risks" ? n.r + 3 : 0);
    n.t.setAttribute("x", n.x + n.r + 3 / zoom.k); n.t.setAttribute("y", n.y + 4 / zoom.k);
    n.t.style.display = showLabels && (n.deg >= labelMin || n === selected || n.hi || zoom.k > 1.8) ? "" : "none";
  }
}
function restyle() {
  const nb = new Set();
  if (selected) { nb.add(selected); for (const l of links) { if (l.s === selected) nb.add(l.t); if (l.t === selected) nb.add(l.s); } }
  const q = query.toLowerCase();
  for (const n of nodes) {
    const match = q && (n.title.toLowerCase().includes(q) || n.id.toLowerCase().includes(q));
    n.hi = !!match || nb.has(n);
    const dim = (selected && !nb.has(n)) || (q && !match && !nb.has(n));
    n.el.setAttribute("class", "node" + (dim ? " dim" : "") + (n === selected ? " sel" : ""));
  }
  for (const l of links) {
    const on = selected && (l.s === selected || l.t === selected);
    l.el.setAttribute("class", "edge" + (on ? " hi" : selected || q ? " dim" : ""));
  }
  draw(); panel();
}
function panel() {
  const p = $("panel");
  if (!selected) {
    const top = [...nodes].sort((a, b) => b.deg - a.deg).slice(0, 8);
    const risky = [...nodes].filter((n) => n.risks).sort((a, b) => b.risks - a.risks).slice(0, 8);
    p.innerHTML = '<h2>How to read this</h2><p class="empty">Each dot is a wiki page, and each line is a link between two pages. ' +
      'Colours are page groups. A dashed orange ring means the page has Risk notes. Drag to move, scroll or pinch to zoom, and click a page to see its links.</p>' +
      '<h3>Most connected</h3><ul>' + top.map((n) => li(n, n.deg + (n.deg === 1 ? " link" : " links"))).join("") + "</ul>" +
      '<h3>Most Risk notes</h3><ul>' + risky.map((n) => li(n, n.risks + (n.risks === 1 ? " risk" : " risks"))).join("") + "</ul>";
  } else {
    const n = selected;
    const out = n.out.map((id) => byId.get(id)), inn = n.in.map((id) => byId.get(id));
    p.innerHTML = "<h2>" + esc(n.title) + '</h2><div class="path">' + esc(n.id) + "</div>" +
      '<div class="stats"><div class="stat"><b>' + inn.length + "</b><span>pages link here</span></div>" +
      '<div class="stat"><b>' + out.length + "</b><span>links out</span></div>" +
      '<div class="stat"><b>' + n.risks + "</b><span>Risk notes</span></div>" +
      '<div class="stat"><b>' + n.unverified + "</b><span>Unverified notes</span></div></div>" +
      (DATA.repoUrl ? '<a href="' + DATA.repoUrl + encodeURI(n.id) + '" target="_blank" rel="noopener">Open on GitHub ↗</a> · ' : "") +
      '<a href="../wiki/' + encodeURI(n.id) + '" target="_blank" rel="noopener">Open local file</a>' +
      "<h3>Linked from</h3>" + list(inn) + "<h3>Links to</h3>" + list(out) +
      '<p style="margin-top:14px"><a data-clear>← Clear selection</a></p>';
  }
  p.querySelectorAll("a[data-id]").forEach((a) => a.onclick = () => select(byId.get(a.dataset.id), true));
  const c = p.querySelector("a[data-clear]"); if (c) c.onclick = () => select(null);
}
const li = (n, extra) => '<li><a data-id="' + esc(n.id) + '">' + esc(n.title) + '</a> <span class="empty">' + (extra || "") + "</span></li>";
const list = (arr) => arr.length ? "<ul>" + arr.sort((a, b) => a.title.localeCompare(b.title)).map((n) => li(n, hidden.has(n.group) || !nodes.includes(n) ? "(hidden)" : "")).join("") + "</ul>" : '<p class="empty">None</p>';
function select(n, center) {
  if (n && !nodes.includes(n)) { if (n.group === "hub") $("hubs").checked = true; hidden.delete(n.group); legend(); build(); }
  selected = n; restyle();
  if (n && center) { zoom.x = W / 2 - n.x * zoom.k; zoom.y = H / 2 - n.y * zoom.k; applyZoom(); }
}

// --- zoom, pan, drag ---
function applyZoom() { view.setAttribute("transform", "translate(" + zoom.x + "," + zoom.y + ") scale(" + zoom.k + ")"); view.style.setProperty("--fs", (11 / zoom.k) + "px"); draw(); }
function resize() { const r = svg.getBoundingClientRect(); W = r.width; H = r.height; }
function fit() {
  resize();
  if (!nodes.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const n of nodes) { x0 = Math.min(x0, n.x - n.r); y0 = Math.min(y0, n.y - n.r); x1 = Math.max(x1, n.x + n.r + 60); y1 = Math.max(y1, n.y + n.r); }
  const k = Math.min(W / (x1 - x0 + 40), H / (y1 - y0 + 40), 1.4);
  zoom = { k, x: W / 2 - ((x0 + x1) / 2) * k, y: H / 2 - ((y0 + y1) / 2) * k }; applyZoom();
}
const toWorld = (e) => { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left - zoom.x) / zoom.k, y: (e.clientY - r.top - zoom.y) / zoom.k }; };
let drag = null;
function startNodeDrag(e, n) { e.stopPropagation(); drag = { node: n, moved: false, sx: e.clientX, sy: e.clientY }; n.fixed = true; svg.setPointerCapture(e.pointerId); }
svg.addEventListener("pointerdown", (e) => { drag = { pan: true, sx: e.clientX, sy: e.clientY, zx: zoom.x, zy: zoom.y, moved: false }; svg.classList.add("dragging"); svg.setPointerCapture(e.pointerId); });
svg.addEventListener("pointermove", (e) => {
  if (!drag) return;
  if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 3) drag.moved = true;
  if (drag.node) { const p = toWorld(e); drag.node.x = p.x; drag.node.y = p.y; reheat(0.3); draw(); }
  else if (drag.pan) { zoom.x = drag.zx + e.clientX - drag.sx; zoom.y = drag.zy + e.clientY - drag.sy; applyZoom(); }
});
svg.addEventListener("pointerup", () => {
  if (drag && drag.node) { drag.node.fixed = false; if (!drag.moved) select(drag.node === selected ? null : drag.node); }
  else if (drag && drag.pan && !drag.moved) select(null);
  drag = null; svg.classList.remove("dragging");
});
svg.addEventListener("wheel", (e) => {
  e.preventDefault();
  const r = svg.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  const k = Math.max(0.2, Math.min(5, zoom.k * Math.exp(-e.deltaY * 0.0015)));
  zoom.x = mx - (mx - zoom.x) * (k / zoom.k); zoom.y = my - (my - zoom.y) * (k / zoom.k); zoom.k = k; applyZoom();
}, { passive: false });

// --- controls ---
function legend() {
  const counts = {}; for (const n of DATA.nodes) counts[n.group] = (counts[n.group] || 0) + 1;
  $("legend").innerHTML = Object.entries(GROUPS).filter(([g]) => counts[g]).map(([g, label]) =>
    '<button type="button" data-g="' + g + '" class="' + (hidden.has(g) || (g === "hub" && !$("hubs").checked) ? "off" : "") +
    '"><i style="background:var(--' + g + ')"></i>' + label + " (" + counts[g] + ")</button>").join("") +
    '<span class="empty">Click a group to show or hide it</span>';
  $("legend").querySelectorAll("button").forEach((b) => b.onclick = () => {
    const g = b.dataset.g;
    if (g === "hub") $("hubs").checked = !$("hubs").checked; else hidden.has(g) ? hidden.delete(g) : hidden.add(g);
    if (selected && (hidden.has(selected.group) || (selected.group === "hub" && !$("hubs").checked))) selected = null;
    legend(); build(); setTimeout(fit, 900);
  });
}
$("q").addEventListener("input", () => {
  query = $("q").value.trim(); restyle();
  const m = query && nodes.filter((n) => n.title.toLowerCase().includes(query.toLowerCase()) || n.id.toLowerCase().includes(query.toLowerCase()));
  if (m && m.length === 1) select(m[0], true);
});
$("size").onchange = () => { for (const n of nodes) n.r = radius(n); reheat(0.4); };
$("hubs").onchange = () => { if (selected && selected.group === "hub") selected = null; legend(); build(); setTimeout(fit, 900); };
$("labels").onchange = draw;
$("fit").onclick = fit;
window.addEventListener("resize", () => { resize(); });

legend(); resize(); build();
// settle the layout before the first paint so the page opens on a stable graph
for (let i = 0; i < 400 && alpha > 0.02; i++) { const a = alpha; tick(); if (raf) { cancelAnimationFrame(raf); raf = null; } if (alpha === a) break; }
fit(); reheat(0.05);
</script>
</body>
</html>
`;

const data = { nodes, links, groups, repoUrl: REPO_URL, built: new Date().toISOString().slice(0, 10) };
const html = TEMPLATE.replace("__DATA__", () => JSON.stringify(data).replace(/</g, "\\u003c"))
  .replaceAll("__NAME__", NAME.replace(/[<&]/g, ""))
  .replace("__CSS_LIGHT__", css(false))
  .replaceAll("__CSS_DARK__", css(true));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`Wrote site/page-graph.html: ${nodes.length} pages, ${links.length} links`);
