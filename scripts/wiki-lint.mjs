#!/usr/bin/env node
// Multi-repo wiki checks. These are deterministic and need no LLM.
//  1. Every `repo:path → symbol` citation points to a file that exists and contains that symbol
//  2. Every relative markdown link resolves
//  3. Every page is listed in wiki/index.md
//  4. Front matter has a title, a type and verified_at
//  5. STALE: a cited file changed in its repo since that page's verified_at sha
// Usage: node scripts/wiki-lint.mjs   (exits with code 1 if it finds errors)

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WIKI = join(ROOT, "wiki");
const REPOS = Object.fromEntries(
  Object.entries(JSON.parse(readFileSync(join(ROOT, "repos.json"), "utf8"))).map(([k, v]) => [k, resolve(ROOT, v)]),
);
const SPECIAL = new Set(["index.md", "log.md"]);

const errors = new Set();
const warnings = new Set();
const rel = (p) => relative(ROOT, p);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "raw" || name.startsWith(".") ? [] : walk(p);
    return p.endsWith(".md") ? [p] : [];
  });
}

function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*?)\s*(#.*)?$/);
    if (kv) out[kv[1]] = kv[2];
  }
  return out;
}

const diffCache = new Map();
function changedSince(repo, sha) {
  const key = `${repo}@${sha}`;
  if (!diffCache.has(key)) {
    try {
      const out = execFileSync("git", ["-C", REPOS[repo], "diff", "--name-only", `${sha}..HEAD`], { stdio: ["ignore", "pipe", "ignore"] });
      diffCache.set(key, new Set(out.toString().split("\n").filter(Boolean)));
    } catch {
      diffCache.set(key, null);
    }
  }
  return diffCache.get(key);
}

if (!Object.keys(REPOS).length) console.log("No repos in repos.json yet: citations are not checked. Run /wiki-init.");
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, (c) => "\\" + c);
const repoNames = Object.keys(REPOS).map(escapeRe).join("|") || "(?!)";
// Symbols from any language: foo, Foo.bar, Foo::bar, Foo#bar, my-key, aws_s3_bucket.logs, @Decorator, foo()
const citeRe = new RegExp("`(" + repoNames + "):([^\\s`]+)(?:\\s*→\\s*([A-Za-z_$@][\\w$.:#@-]*)(?:\\(\\))?)?`", "g");
const linkRe = /\[[^\]]*\]\(([^)\s#]+)(?:#[^)]*)?\)/g;

const pages = walk(WIKI);
const index = readFileSync(join(WIKI, "index.md"), "utf8");
const fileCache = new Map();
const readCode = (abs) => {
  if (!fileCache.has(abs)) fileCache.set(abs, readFileSync(abs, "utf8"));
  return fileCache.get(abs);
};

for (const page of pages) {
  const text = readFileSync(page, "utf8");
  const name = rel(page);
  const fm = frontMatter(text);
  const cited = new Map(); // repo -> Set(paths)

  // 1. Citations
  for (const [, repo, path, symbol] of text.matchAll(citeRe)) {
    if (!cited.has(repo)) cited.set(repo, new Set());
    cited.get(repo).add(path);
    const abs = join(REPOS[repo], path);
    if (!existsSync(abs)) { errors.add(`${name}: cites missing file ${repo}:${path}`); continue; }
    if (symbol) {
      const last = symbol.split(/\.|::|#/).filter(Boolean).pop().replace(/^@/, "");
      const code = readCode(abs);
      const found = /^[\w$]+$/.test(last)
        ? new RegExp(`(^|[^\\w$])${last.replace(/\$/g, "\\$")}(?![\\w$])`).test(code)
        : code.includes(last);
      if (!found) {
        errors.add(`${name}: ${symbol} not found in ${repo}:${path}`);
      }
    }
  }

  // 2. Links
  for (const [, href] of text.matchAll(linkRe)) {
    if (/^[a-z]+:/i.test(href)) continue;
    if (!existsSync(resolve(dirname(page), href))) errors.add(`${name}: broken link → ${href}`);
  }

  if (SPECIAL.has(relative(WIKI, page))) continue;

  // 3. Index
  if (!index.includes(relative(WIKI, page))) errors.add(`${name}: not listed in wiki/index.md`);

  // 4. Front matter
  for (const k of ["title", "type", "verified_at"]) if (!fm[k]) errors.add(`${name}: front matter missing "${k}"`);

  // 5. Staleness, checked per repo
  const shas = Object.fromEntries((fm.verified_at || "").split(",").map((s) => s.trim().split("@")).filter((p) => p.length === 2));
  for (const [repo, paths] of cited) {
    const sha = shas[repo];
    if (!sha) { warnings.add(`${name}: cites ${repo} but verified_at has no ${repo}@sha`); continue; }
    const changed = changedSince(repo, sha);
    if (changed === null) { warnings.add(`${name}: cannot check ${repo}@${sha} (unknown commit)`); continue; }
    const hit = [...paths].filter((p) => changed.has(p));
    if (hit.length) warnings.add(`${name}: STALE, ${repo} changed since ${sha}: ${hit.join(", ")}`);
  }
}

console.log(`Checked ${pages.length} wiki pages across ${Object.keys(REPOS).length} repos.`);
for (const w of warnings) console.log(`  warn   ${w}`);
for (const e of errors) console.log(`  ERROR  ${e}`);
if (!errors.size) console.log("No errors.");
process.exit(errors.size ? 1 : 0);
