#!/usr/bin/env node
// Quick view: what changed in each repo since the last wiki sync, and which pages it affects.
// Usage: node scripts/wiki-status.mjs
// Reads the "Last synced" table in wiki/log.md and needs no LLM. Run it before /wiki-sync.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WIKI = join(ROOT, "wiki");
const REPOS = Object.fromEntries(
  Object.entries(JSON.parse(readFileSync(join(ROOT, "repos.json"), "utf8"))).map(([k, v]) => [k, resolve(ROOT, v)]),
);
const CONFIG = JSON.parse(readFileSync(join(ROOT, "wiki.config.json"), "utf8"));
const AREA_DEPTH = CONFIG.status?.areaDepth ?? 3;
const IGNORE = (CONFIG.status?.ignore ?? []).map((p) => new RegExp(p));
if (!Object.keys(REPOS).length) { console.log("No repos in repos.json yet. Run /wiki-init."); process.exit(0); }
const git = (repo, args) =>
  execFileSync("git", ["-C", REPOS[repo], ...args], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();

// Read the "| repo | sha |" rows from the Last synced table
const log = readFileSync(join(WIKI, "log.md"), "utf8");
const synced = {};
for (const [, repo, sha] of log.matchAll(/^\|\s*([\w-]+)\s*\|\s*([0-9a-f]{7,40})\s*\|/gm)) synced[repo] = sha;

// Collect the citations on every page
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? (n === "raw" || n.startsWith(".") ? [] : walk(p)) : p.endsWith(".md") ? [p] : [];
});
const cites = []; // [page, repo, path]
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, (c) => "\\" + c);
const re = new RegExp("`(" + Object.keys(REPOS).map(escapeRe).join("|") + "):([^\\s`]+)", "g");
for (const page of walk(WIKI).filter((p) => !/\/(index|log)\.md$/.test(p))) {
  for (const [, repo, path] of readFileSync(page, "utf8").matchAll(re)) cites.push([relative(ROOT, page), repo, path]);
}

let anything = false;
for (const repo of Object.keys(REPOS)) {
  const sha = synced[repo];
  if (!sha) { console.log(`${repo}: no last-synced sha in wiki/log.md`); continue; }
  let head, commits, files;
  try {
    head = git(repo, ["rev-parse", "--short", "HEAD"]);
    commits = git(repo, ["log", "--oneline", `${sha}..HEAD`]).split("\n").filter(Boolean);
    files = new Set(git(repo, ["diff", "--name-only", `${sha}..HEAD`]).split("\n").filter(Boolean));
  } catch {
    console.log(`${repo}: cannot read git history (is ${sha} a valid commit?)`);
    continue;
  }
  const affected = [...new Set(cites.filter(([, r, p]) => r === repo && files.has(p)).map(([pg]) => pg))];
  console.log(`\n${repo}: ${sha} → ${head}  (${commits.length} new commits, ${files.size} files changed)`);
  if (!commits.length) continue;
  anything = true;
  console.log(affected.length ? `  pages to update: ${affected.join(", ")}` : "  no wiki page cites the changed files");
  // Source files that changed, grouped by folder (wiki.config.json → status.areaDepth), with no page citing that folder
  const source = [...files].filter((f) => f.includes("/") && !IGNORE.some((re) => re.test(f)));
  const uncovered = [...new Set(source.map((f) => f.split("/").slice(0, Math.min(AREA_DEPTH, f.split("/").length - 1)).join("/")))]
    .filter((dir) => !cites.some(([, r, p]) => r === repo && p.startsWith(dir)));
  if (uncovered.length) console.log(`  changed areas with no wiki page (consider adding): ${uncovered.slice(0, 8).join(", ")}${uncovered.length > 8 ? " …" : ""}`);
}
console.log(anything ? "\nNext: run /wiki-sync in Claude Code." : "\nWiki is up to date with all repos.");
