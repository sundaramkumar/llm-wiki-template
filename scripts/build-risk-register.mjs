#!/usr/bin/env node
// Rebuilds site/risk-register.html from the `> Risk:` notes in wiki/ and the ratings in risks.json.
//
//   node scripts/build-risk-register.mjs          update risks.json and site/risk-register.html
//   node scripts/build-risk-register.mjs --check  report only; exit 1 if risks.json is out of date or has unrated risks
//
// Matching: a note keeps its ID when its page and text are unchanged. A reworded note on the same page keeps its ID
// when most of its words match. New notes get the next ID with severity "U" (not rated): set severity, category and
// title in risks.json by hand. Notes that disappeared from the wiki get `removed_on` and drop out of the register.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIKI = path.join(ROOT, "wiki");
const DB = path.join(ROOT, "risks.json");
const TEMPLATE = path.join(ROOT, "scripts", "risk-register.template.html");
const OUT = path.join(ROOT, "site", "risk-register.html");
const CHECK = process.argv.includes("--check");
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "wiki.config.json"), "utf8"));
const NAME = CONFIG.name && !CONFIG.name.includes("{{") ? CONFIG.name : "Project";
const SLUG = NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
const today = new Date().toISOString().slice(0, 10);

// ---- 1. extract Risk notes from the wiki ----
const walk = (d) => fs.readdirSync(d).sort().flatMap((n) => {
  const p = path.join(d, n);
  if (fs.statSync(p).isDirectory()) return n === "raw" ? [] : walk(p);
  return p.endsWith(".md") ? [p] : [];
});
const notes = [];
for (const f of walk(WIKI)) {
  const lines = fs.readFileSync(f, "utf8").split("\n");
  let section = "";
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^#{2,3}\s+(.*)/);
    if (h) section = h[1];
    const m = lines[i].match(/^\s*>\s*Risk(?:\s*\([^)]*\))?:\s*(.*)$/);
    if (!m) continue;
    let text = m[1];
    for (let j = i + 1; j < lines.length && /^\s*>/.test(lines[j]) && !/^\s*>\s*(Risk|Unverified)/.test(lines[j]); j++) {
      text += " " + lines[j].replace(/^\s*>\s?/, "");
    }
    notes.push({ page: path.relative(WIKI, f).split(path.sep).join("/"), section, text: text.trim() });
  }
}

// ---- 2. match against risks.json ----
const db = JSON.parse(fs.readFileSync(DB, "utf8"));
const live = db.risks.filter((r) => !r.removed_on);
const words = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9_]+/g, " ").split(" ").filter((w) => w.length > 2));
const similarity = (a, b) => {
  const A = words(a), B = words(b);
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return n / Math.max(A.size, B.size, 1);
};
const claimed = new Set();
const report = { new: [], reworded: [], removed: [] };
const matched = notes.map((n) => {
  let r = live.find((x) => !claimed.has(x.id) && x.page === n.page && x.text === n.text);
  if (!r) {
    let best = null, score = 0;
    for (const x of live) {
      if (claimed.has(x.id) || x.page !== n.page) continue;
      const s = similarity(x.text, n.text);
      if (s > score) { best = x; score = s; }
    }
    if (best && score >= 0.6) { r = best; report.reworded.push(r.id); }
  }
  if (r) { claimed.add(r.id); r.text = n.text; r.section = n.section; return r; }
  return null;
}).map((r, i) => r || { _new: notes[i] });

let nextId = Math.max(0, ...db.risks.map((r) => r.id)) + 1;
for (const m of matched) {
  if (!m._new) continue;
  const r = { id: nextId++, severity: "U", category: "Unsorted", title: m._new.text.replace(/[`*]/g, "").slice(0, 90),
    page: m._new.page, section: m._new.section, text: m._new.text, added_on: today };
  db.risks.push(r); report.new.push(r.id);
}
for (const r of live) {
  if (!claimed.has(r.id)) { r.removed_on = today; report.removed.push(r.id); }
}
const unrated = db.risks.filter((r) => !r.removed_on && !r.duplicateOf && r.severity === "U").map((r) => r.id);

// ---- 3. report ----
const changed = report.new.length + report.reworded.length + report.removed.length > 0;
console.log(`Risk notes in wiki: ${notes.length}`);
if (report.new.length) console.log(`New (not rated yet): #${report.new.join(", #")}`);
if (report.reworded.length) console.log(`Reworded, ID kept: #${report.reworded.join(", #")}`);
if (report.removed.length) console.log(`No longer in the wiki (marked removed_on): #${report.removed.join(", #")}`);
if (unrated.length) console.log(`Needs severity, category and title in risks.json: #${unrated.join(", #")}`);
if (CHECK) process.exit(changed || unrated.length ? 1 : 0);

// ---- 4. write risks.json and the HTML ----
fs.writeFileSync(DB, JSON.stringify(db, null, 1) + "\n");

// Area = the title of the wiki page the risk is on (front matter), so it works for any project.
const titleCache = new Map();
const areaOf = (page) => {
  if (!titleCache.has(page)) {
    let t = page.replace(/\.md$/, "");
    try {
      const src = fs.readFileSync(path.join(WIKI, page), "utf8");
      t = src.match(/^title:\s*(.+)$/m)?.[1]?.replace(/^["']|["']$/g, "").trim() || src.match(/^#\s+(.+)$/m)?.[1] || t;
    } catch {}
    titleCache.set(page, t);
  }
  return titleCache.get(page);
};
const active = db.risks.filter((r) => !r.removed_on);
const also = {};
for (const r of active) if (r.duplicateOf) (also[r.duplicateOf] ||= []).push(r.page);
const data = active.filter((r) => !r.duplicateOf || !active.some((x) => x.id === r.duplicateOf)).map((r) => ({
  id: r.id, sev: r.severity || "U", cat: r.category || "Unsorted", title: r.title || r.text.slice(0, 90),
  area: areaOf(r.page), also: (also[r.id] || []).join(", "), page: r.page, section: r.section || "", text: r.text,
}));
const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const html = fs.readFileSync(TEMPLATE, "utf8")
  .replace("__DATA__", () => JSON.stringify(data).replace(/</g, "\\u003c"))
  .replace("__COUNT__", String(data.length))
  .replace("__DATE__", date)
  .replaceAll("__NAME__", NAME)
  .replaceAll("__SLUG__", SLUG);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
const sev = {}; for (const d of data) sev[d.sev] = (sev[d.sev] || 0) + 1;
console.log(`Wrote site/risk-register.html: ${data.length} risks (C ${sev.C || 0}, H ${sev.H || 0}, M ${sev.M || 0}, L ${sev.L || 0}` +
  (sev.U ? `, not rated ${sev.U}` : "") + ")");
