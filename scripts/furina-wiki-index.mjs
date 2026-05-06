#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs, expandHome, ROOT } from "./lib/utils.mjs";

const CONFIG_PATH = path.join(ROOT, "config", "wiki_sources.json");
const CACHE_DIR = path.join(ROOT, ".cache", "furina-wiki");
const INDEX_VERSION = 1;
const DEFAULT_MAX_POSTINGS = 2000;

function help() {
  return `Furina local wiki index helper

Usage:
  node scripts/furina-wiki-index.mjs status [--source genshin-story]
  node scripts/furina-wiki-index.mjs build [--source genshin-story] [--root ../genshinstory-cache]
  node scripts/furina-wiki-index.mjs search "芙宁娜 传说任务" [--top 5]

The generated index lives in .cache/furina-wiki/ and is not committed.
`;
}

function resolveRoot(value) {
  const expanded = expandHome(value);
  if (!expanded) return "";
  return path.isAbsolute(expanded) ? expanded : path.resolve(ROOT, expanded);
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function resolveLocalSource(args = {}) {
  const config = loadConfig();
  const sourceId = String(args.source || "genshin-story");
  const source = (config.sources || []).find((item) => item.id === sourceId);
  if (!source) throw new Error(`Unknown wiki source: ${sourceId}`);
  if (source.type !== "local_markdown") throw new Error(`Source is not local_markdown: ${sourceId}`);

  const configuredRoot = args.root || process.env[source.env] || source.root || "";
  const root = resolveRoot(configuredRoot);
  const docsDir = root ? path.resolve(root, source.docs) : "";
  return { ...source, root, docsDir };
}

function slug(value) {
  return String(value || "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "wiki";
}

export function indexPathForSource(source) {
  return path.join(CACHE_DIR, `${slug(source.id)}-index`);
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, " ")
    .trim();
}

function stripMarkdown(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function termsFromText(text) {
  const normalized = normalizeText(stripMarkdown(text));
  const parts = normalized.match(/[\u4e00-\u9fff]+|[a-z0-9_]+/g) || [];
  const terms = [];
  for (const part of parts) {
    if (/^[a-z0-9_]+$/.test(part)) {
      if (part.length >= 2) terms.push(part);
      continue;
    }
    if (part.length === 1) {
      terms.push(part);
      continue;
    }
    for (let i = 0; i < part.length - 1; i += 1) {
      terms.push(part.slice(i, i + 2));
    }
  }
  return terms;
}

export function queryTerms(query) {
  const normalized = normalizeText(query);
  const compact = normalized.replace(/\s+/g, "");
  const terms = new Set(termsFromText(normalized));
  for (const part of normalized.split(/\s+/)) {
    const clean = part.trim();
    if (clean.length >= 2) terms.add(clean);
  }
  if (compact.length >= 2) terms.add(compact);
  return [...terms].filter(Boolean);
}

function walkMarkdown(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdown(fullPath, results);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

function safeRelative(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return relative.replace(/\\/g, "/");
}

function addWeightedTerms(scoreMap, text, weight, capPerTerm) {
  const counts = new Map();
  for (const term of termsFromText(text)) {
    counts.set(term, (counts.get(term) || 0) + 1);
  }
  for (const [term, count] of counts.entries()) {
    const score = Math.min(capPerTerm, count) * weight;
    scoreMap.set(term, (scoreMap.get(term) || 0) + score);
  }
}

function docsFingerprint(docsDir) {
  let docCount = 0;
  let latestMtimeMs = 0;
  for (const filePath of walkMarkdown(docsDir)) {
    const stat = fs.statSync(filePath);
    docCount += 1;
    latestMtimeMs = Math.max(latestMtimeMs, stat.mtimeMs);
  }
  return { docCount, latestMtimeMs };
}

function indexIsFresh(index, source) {
  if (!index || index.version !== INDEX_VERSION) return false;
  if (path.resolve(index.docsDir || "") !== path.resolve(source.docsDir)) return false;
  const current = docsFingerprint(source.docsDir);
  return index.docCount === current.docCount && Number(index.latestMtimeMs || 0) >= current.latestMtimeMs;
}

export function loadSearchIndex(source, options = {}) {
  const indexDir = options.indexPath || indexPathForSource(source);
  const manifestPath = path.join(indexDir, "manifest.json");
  const documentsPath = path.join(indexDir, "documents.json");
  if (!fs.existsSync(manifestPath) || !fs.existsSync(documentsPath)) return null;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const documents = JSON.parse(fs.readFileSync(documentsPath, "utf8"));
  const index = { ...manifest, documents, indexDir, _shardCache: new Map() };
  if (!options.allowStale && !indexIsFresh(index, source)) return null;
  return index;
}

export function buildSearchIndex(source, options = {}) {
  if (!source.docsDir || !fs.existsSync(source.docsDir)) {
    throw new Error(`Docs directory not found: ${source.docsDir}`);
  }
  const started = Date.now();
  const maxPostings = Math.max(100, Number(options.maxPostings || DEFAULT_MAX_POSTINGS));
  const documents = [];
  const postings = new Map();
  const files = walkMarkdown(source.docsDir);

  for (const filePath of files) {
    const relative = safeRelative(source.docsDir, filePath);
    if (!relative) continue;
    const raw = fs.readFileSync(filePath, "utf8");
    const stat = fs.statSync(filePath);
    const id = documents.length;
    const title = path.basename(relative, ".md");
    const lineCount = raw.split(/\r?\n/).length;
    documents.push({
      id,
      path: relative,
      title,
      lineCount,
      size: Buffer.byteLength(raw, "utf8"),
      mtimeMs: stat.mtimeMs
    });

    const scoreMap = new Map();
    addWeightedTerms(scoreMap, title.replace(/-/g, " "), 24, 6);
    addWeightedTerms(scoreMap, relative.replace(/[\\/_.-]+/g, " "), 10, 6);
    addWeightedTerms(scoreMap, raw, 1, 16);

    for (const [term, score] of scoreMap.entries()) {
      if (!postings.has(term)) postings.set(term, []);
      postings.get(term).push([id, Math.round(score)]);
    }
  }

  const shards = new Map();
  for (const [term, rows] of postings.entries()) {
    rows.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    const shardName = shardNameForTerm(term);
    if (!shards.has(shardName)) shards.set(shardName, {});
    shards.get(shardName)[term] = rows.slice(0, maxPostings);
  }

  const fingerprint = docsFingerprint(source.docsDir);
  const indexDir = options.indexPath || indexPathForSource(source);
  if (fs.existsSync(indexDir)) fs.rmSync(indexDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(indexDir, "shards"), { recursive: true });

  let termCount = 0;
  for (const [shardName, shard] of shards.entries()) {
    termCount += Object.keys(shard).length;
    fs.writeFileSync(path.join(indexDir, "shards", shardName), JSON.stringify(shard), "utf8");
  }

  const manifest = {
    version: INDEX_VERSION,
    sourceId: source.id,
    docsDir: source.docsDir,
    generatedAt: new Date().toISOString(),
    buildMs: Date.now() - started,
    docCount: documents.length,
    latestMtimeMs: fingerprint.latestMtimeMs,
    maxPostings,
    termCount,
    shardCount: shards.size
  };

  fs.writeFileSync(path.join(indexDir, "manifest.json"), JSON.stringify(manifest), "utf8");
  fs.writeFileSync(path.join(indexDir, "documents.json"), JSON.stringify(documents), "utf8");
  return { index: { ...manifest, documents, indexDir, _shardCache: new Map() }, indexPath: indexDir };
}

export function searchIndex(index, query, options = {}) {
  const top = Math.max(1, Math.min(50, Number(options.top || 5)));
  const terms = queryTerms(query);
  const scores = new Map();
  const matchedTerms = new Map();

  for (const term of terms) {
    const rows = postingsForTerm(index, term);
    for (const [docId, score] of rows) {
      scores.set(docId, (scores.get(docId) || 0) + Number(score || 0));
      if (!matchedTerms.has(docId)) matchedTerms.set(docId, []);
      matchedTerms.get(docId).push(term);
    }
  }

  return [...scores.entries()]
    .map(([docId, score]) => {
      const doc = index.documents[docId];
      return {
        source: index.sourceId,
        path: doc.path,
        title: doc.title,
        score,
        indexed: true,
        matchedTerms: [...new Set(matchedTerms.get(docId) || [])].slice(0, 8),
        snippets: []
      };
    })
    .filter((item) => item.path)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path, "zh-Hans-CN"))
    .slice(0, top);
}

function shardNameForTerm(term) {
  const first = String(term || "").codePointAt(0) || 0;
  return `${first.toString(16)}.json`;
}

function loadShard(index, shardName) {
  if (!index._shardCache) index._shardCache = new Map();
  if (index._shardCache.has(shardName)) return index._shardCache.get(shardName);
  const shardPath = path.join(index.indexDir, "shards", shardName);
  const shard = fs.existsSync(shardPath) ? JSON.parse(fs.readFileSync(shardPath, "utf8")) : {};
  index._shardCache.set(shardName, shard);
  return shard;
}

function postingsForTerm(index, term) {
  const shard = loadShard(index, shardNameForTerm(term));
  return shard[term] || [];
}

function status(args) {
  const source = resolveLocalSource(args);
  const indexPath = indexPathForSource(source);
  const manifestPath = path.join(indexPath, "manifest.json");
  const exists = fs.existsSync(manifestPath);
  const ready = Boolean(source.docsDir && fs.existsSync(source.docsDir));
  let fresh = false;
  let index = null;
  if (exists) {
    index = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    fresh = ready && indexIsFresh(index, source);
  }
  return {
    source: source.id,
    docsDir: source.docsDir,
    ready,
    indexPath,
    exists,
    fresh,
    docCount: index?.docCount || 0,
    termCount: index?.termCount || 0,
    shardCount: index?.shardCount || 0,
    generatedAt: index?.generatedAt || null,
    buildMs: index?.buildMs || null
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._.shift();
  if (!command || command === "help" || args.help || args.h) {
    console.log(help());
    return;
  }

  if (command === "status") {
    console.log(JSON.stringify(status(args), null, 2));
    return;
  }

  const source = resolveLocalSource(args);
  if (command === "build") {
    const result = buildSearchIndex(source, args);
    console.log(JSON.stringify({
      source: source.id,
      indexPath: result.indexPath,
      docCount: result.index.docCount,
      termCount: result.index.termCount,
      shardCount: result.index.shardCount,
      buildMs: result.index.buildMs
    }, null, 2));
    return;
  }

  if (command === "search") {
    const query = args._.join(" ").trim();
    if (!query) throw new Error("Missing search query.");
    let index = loadSearchIndex(source, { allowStale: Boolean(args["allow-stale-index"]) });
    if (!index && args["build-index"]) {
      index = buildSearchIndex(source, args).index;
    }
    if (!index) throw new Error("Index not found or stale. Run: node scripts/furina-wiki-index.mjs build");
    console.log(JSON.stringify({ results: searchIndex(index, query, args) }, null, 2));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(`furina-wiki-index failed: ${error.message}`);
    process.exit(1);
  });
}
