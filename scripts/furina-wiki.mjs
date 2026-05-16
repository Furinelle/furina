#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs, expandHome, normalizeText, stripMarkdown, walkMarkdown, safeRelative, ROOT } from "./lib/utils.mjs";
import { buildSearchIndex, loadSearchIndex, searchIndex, queryTerms } from "./furina-wiki-index.mjs";

const CONFIG_PATH = path.join(ROOT, "config", "wiki_sources.json");

function help() {
  return `Furina external wiki helper

Usage:
  node scripts/furina-wiki.mjs sources
  node scripts/furina-wiki.mjs search "芙宁娜 那维莱特" [--top 5]
  node scripts/furina-wiki.mjs read "芙宁娜" [--line-range 1-80]
  node scripts/furina-wiki.mjs brief "芙宁娜 传说任务" [--top 3]

Options:
  --root <dir>          Override the local wiki root for this run
  --source <id>         Source id, defaults to config/wiki_sources.json default_source
  --no-fallback         Disable default-source fallback lookup
  --build-index         Build a missing or stale local index before searching
  --no-index            Disable local index lookup and scan Markdown files directly
  --allow-stale-index   Permit a stale local index for this run
  --top <n>             Search result count, defaults to 5
  --max-chars <n>       Max characters returned by read, defaults to 4000
  --json                Emit machine-readable JSON

Default:
  Uses local genshinstory-cache first when available, then falls back to online 原神WIKI_BWIKI.
  Pass --source bwiki-online to skip local cache, or set GENSHIN_STORY_ROOT / --root
  / sibling ../genshinstory-cache to use local Markdown.
`;
}

function resolveRoot(value) {
  const expanded = expandHome(value);
  if (!expanded) return "";
  return path.isAbsolute(expanded) ? expanded : path.resolve(ROOT, expanded);
}

let _configCache = null;

function loadConfig() {
  if (_configCache) return _configCache;
  _configCache = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  return _configCache;
}

function wikiUrl(source, title) {
  return `${source.page || "https://wiki.biligame.com/ys/"}${encodeURIComponent(title)}`;
}

function htmlToText(html) {
  const stripped = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  let decoded = stripped;
  let prev = "";
  while (decoded !== prev) {
    prev = decoded;
    decoded = decodeHtmlEntities(decoded);
  }
  return decoded;
}

function decodeHtmlEntities(text) {
  const named = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'"
  };
  return String(text || "").replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (match, entity) => {
    const key = entity.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(named, key)) return named[key];
    if (key.startsWith("#x")) {
      const code = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (key.startsWith("#")) {
      const code = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return match;
  });
}

const FETCH_TIMEOUT_MS = 10_000;

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "furina-wiki/1.0",
        "accept": "application/json,text/plain,*/*"
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "furina-wiki/1.0",
        "accept": "text/html,text/plain,*/*"
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

function countOccurrences(text, term) {
  if (!term) return 0;
  let count = 0;
  let index = text.indexOf(term);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(term, index + term.length);
  }
  return count;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function explicitSource(args) {
  return hasOwn(args, "source");
}

function fallbackEnabled(args) {
  return !explicitSource(args) && !args["no-fallback"];
}

function getConfiguredSource(config, args, sourceId) {
  const source = (config.sources || []).find((item) => item.id === sourceId);
  if (!source) throw new Error(`Unknown wiki source: ${sourceId}`);
  if (source.enabled === false) throw new Error(`Wiki source is disabled: ${sourceId}`);
  if (source.type === "mediawiki_api") return { ...source };
  if (source.type !== "local_markdown") {
    throw new Error(`Unsupported wiki source type: ${source.type}`);
  }

  const configuredRoot = args.root || process.env[source.env] || source.root || "";
  const root = resolveRoot(configuredRoot);
  const docsDir = root ? path.resolve(root, source.docs) : "";
  return { ...source, root, docsDir };
}

function getSource(args) {
  const config = loadConfig();
  return getConfiguredSource(config, args, String(args.source || config.default_source || ""));
}

function getFallbackSource(args, primarySource) {
  if (!fallbackEnabled(args)) return null;
  const config = loadConfig();
  const fallbackId = String(config.fallback_source || "");
  if (!fallbackId || fallbackId === primarySource.id) return null;
  return getConfiguredSource(config, args, fallbackId);
}

function localCacheRecovery(source) {
  const cloneTarget = source.root || "../genshinstory-cache";
  const setup = `git clone https://github.com/Furinelle/genshinstory-cache ${cloneTarget}`;
  return `本地缓存不可用。可运行 \`${setup}\`，或设置 ${source.env} / --root 指向已有缓存；也可改用 --source bwiki-online 直接查询在线 BWIKI。`;
}

function assertSourceReady(source) {
  if (source.type === "mediawiki_api") return;
  if (!source.root) {
    throw new Error(`Source ${source.id} has no root. ${localCacheRecovery(source)}`);
  }
  if (!fs.existsSync(source.docsDir)) {
    throw new Error(`Docs directory not found: ${source.docsDir}. ${localCacheRecovery(source)}`);
  }
}

function makeSnippets(content, terms, maxSnippets = 3) {
  const lines = content.split(/\r?\n/);
  const snippets = [];
  for (let i = 0; i < lines.length && snippets.length < maxSnippets; i += 1) {
    const normalized = normalizeText(lines[i]);
    if (terms.some((term) => normalized.includes(term))) {
      const text = stripMarkdown(lines[i]).slice(0, 160);
      if (text) snippets.push({ line: i + 1, text });
    }
  }
  return snippets;
}

function search(args, source = getSource(args)) {
  const query = args._.join(" ").trim();
  if (!query) throw new Error("Missing search query.");
  const top = Math.max(1, Math.min(50, Number(args.top || 5)));
  assertSourceReady(source);

  const terms = queryTerms(query);
  const indexedResults = searchLocalIndex(args, source, query, terms, top);
  if (indexedResults) return indexedResults;

  const results = [];
  for (const filePath of walkMarkdown(source.docsDir)) {
    const relative = safeRelative(source.docsDir, filePath);
    if (!relative) continue;
    const raw = fs.readFileSync(filePath, "utf8");
    const content = normalizeText(stripMarkdown(raw));
    const name = normalizeText(path.basename(relative, ".md").replace(/-/g, " "));
    const relText = normalizeText(relative.replace(/[\\/_.-]+/g, " "));

    let score = 0;
    for (const term of terms) {
      if (name.includes(term)) score += 20;
      if (relText.includes(term)) score += 8;
      score += Math.min(12, countOccurrences(content, term));
    }
    if (score <= 0) continue;

    results.push({
      source: source.id,
      path: relative,
      title: path.basename(relative, ".md"),
      score,
      snippets: makeSnippets(raw, terms)
    });
  }

  results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path, "zh-Hans-CN"));
  return results.slice(0, top);
}

function searchLocalIndex(args, source, query, terms, top) {
  if (args["no-index"]) return null;
  let index = loadSearchIndex(source, { allowStale: Boolean(args["allow-stale-index"]) });
  if (!index && args["build-index"]) {
    index = buildSearchIndex(source, args).index;
  }
  if (!index) return null;

  return searchIndex(index, query, { top }).map((item) => {
    const filePath = path.join(source.docsDir, item.path);
    let snippets = [];
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      snippets = makeSnippets(raw, terms);
    }
    return { ...item, source: source.id, snippets };
  });
}

async function searchMediaWiki(source, args) {
  const query = args._.join(" ").trim();
  if (!query) throw new Error("Missing search query.");
  const top = Math.max(1, Math.min(20, Number(args.top || 5)));
  const url = `${source.api}?action=opensearch&search=${encodeURIComponent(query)}&limit=${top}&namespace=0&format=json`;
  const data = await fetchJson(url);
  const titles = Array.isArray(data?.[1]) ? data[1] : [];
  const descriptions = Array.isArray(data?.[2]) ? data[2] : [];
  const urls = Array.isArray(data?.[3]) ? data[3] : [];
  const fallbackTitle = query.split(/\s+/)[0];
  const rows = titles.length ? titles : [fallbackTitle];
  return rows.slice(0, top).map((title, index) => ({
    source: source.id,
    path: title,
    title,
    score: titles.length ? top - index : 1,
    url: urls[index] || wikiUrl(source, title),
    snippets: descriptions[index] ? [{ line: 1, text: descriptions[index] }] : []
  }));
}

async function searchSource(source, args) {
  return source.type === "mediawiki_api" ? await searchMediaWiki(source, args) : search(args, source);
}

async function searchWithFallback(args) {
  const top = Math.max(1, Math.min(50, Number(args.top || 5)));
  const source = getSource(args);
  let results = [];
  let localFailed = false;

  try {
    results = await searchSource(source, args);
  } catch (error) {
    if (!fallbackEnabled(args)) throw error;
    localFailed = source.type !== "mediawiki_api";
    if (!localFailed) throw error;
  }

  if (results.length >= top || !fallbackEnabled(args)) return results.slice(0, top);

  const fallbackSource = getFallbackSource(args, source);
  if (!fallbackSource) return results.slice(0, top);

  const fallbackTop = Math.max(1, top - results.length);
  const fallbackResults = await searchSource(fallbackSource, { ...args, top: fallbackTop });
  const seen = new Set(results.map((item) => `${item.source}:${item.path}`));
  for (const item of fallbackResults) {
    const key = `${item.source}:${item.path}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(item);
    }
    if (results.length >= top) break;
  }

  return results.slice(0, top);
}

function parseLineRanges(spec, totalLines) {
  if (!spec) return null;
  const selected = new Set();
  for (const part of String(spec).split(",")) {
    const match = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!match) continue;
    const start = Math.max(1, Number(match[1]));
    const end = Math.min(totalLines, Number(match[2] || match[1]));
    for (let line = start; line <= end; line += 1) selected.add(line);
  }
  return selected.size ? [...selected].sort((a, b) => a - b) : null;
}

function readDoc(args) {
  const requested = args._.join(" ").trim();
  if (!requested) throw new Error("Missing document path.");
  const source = getSource(args);
  assertSourceReady(source);

  const prefix = `${source.id}:`;
  const cleanPath = requested.startsWith(prefix) ? requested.slice(prefix.length) : requested;
  const target = path.resolve(source.docsDir, cleanPath);
  const relative = safeRelative(source.docsDir, target);
  if (!relative) throw new Error("Refusing to read outside wiki docs directory.");
  if (!fs.existsSync(target)) throw new Error(`Document not found: ${relative}`);

  const raw = fs.readFileSync(target, "utf8");
  const lines = raw.split(/\r?\n/);
  const selected = parseLineRanges(args["line-range"], lines.length);
  let content = selected ? selected.map((line) => `${line} | ${lines[line - 1]}`).join("\n") : raw;
  const maxChars = Math.max(500, Number(args["max-chars"] || 4000));
  let truncated = false;
  if (content.length > maxChars) {
    content = content.slice(0, maxChars);
    truncated = true;
  }
  return {
    source: source.id,
    path: relative,
    totalLines: lines.length,
    returnedChars: content.length,
    truncated,
    content
  };
}

function looksLikeMarkdownPath(value) {
  return /\.md$/i.test(value) || /[\\/]/.test(value);
}

async function readWithFallback(args) {
  const requested = args._.join(" ").trim();
  if (!requested) throw new Error("Missing document path.");
  const source = getSource(args);

  if (source.type === "mediawiki_api") return readMediaWiki(source, args);

  try {
    if (looksLikeMarkdownPath(requested) || requested.startsWith(`${source.id}:`)) {
      return readDoc(args);
    }

    const localMatches = search({ ...args, _: [requested], top: 1 }, source);
    if (localMatches.length > 0) {
      return readDoc({ ...args, _: [localMatches[0].path] });
    }
    return readDoc(args);
  } catch (error) {
    if (!fallbackEnabled(args)) throw error;
    const fallbackSource = getFallbackSource(args, source);
    if (!fallbackSource) throw error;
    return readMediaWiki(fallbackSource, args);
  }
}

async function readMediaWiki(source, args) {
  const requested = args._.join(" ").trim();
  if (!requested) throw new Error("Missing page title.");
  const prefix = `${source.id}:`;
  const title = requested.startsWith(prefix) ? requested.slice(prefix.length) : requested;
  const maxChars = Math.max(500, Number(args["max-chars"] || 4000));
  let text = "";

  try {
    const url = `${source.api}?action=query&titles=${encodeURIComponent(title)}&prop=extracts&explaintext=1&format=json&redirects=1`;
    const data = await fetchJson(url);
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0];
    text = String(page?.extract || "");
  } catch {
    text = "";
  }

  if (!text.trim()) {
    try {
      const url = `${source.api}?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&redirects=1`;
      const data = await fetchJson(url);
      text = htmlToText(data?.parse?.text?.["*"] || "");
    } catch {
      const html = await fetchText(wikiUrl(source, title));
      text = htmlToText(html);
    }
  }

  const lines = text.split(/\r?\n/);
  const selected = parseLineRanges(args["line-range"], lines.length);
  let content = selected ? selected.map((line) => `${line} | ${lines[line - 1]}`).join("\n") : text;
  let truncated = false;
  if (content.length > maxChars) {
    content = content.slice(0, maxChars);
    truncated = true;
  }
  return {
    source: source.id,
    path: title,
    url: wikiUrl(source, title),
    totalLines: lines.length,
    returnedChars: content.length,
    truncated,
    content
  };
}

function listSources(args) {
  const config = loadConfig();
  return (config.sources || []).map((source) => {
    if (source.type === "mediawiki_api") {
      return {
        id: source.id,
        type: source.type,
        description: source.description,
        api: source.api,
        page: source.page,
        ready: true
      };
    }
    if (source.type !== "local_markdown") return { ...source, ready: false };
    const configuredRoot = args.root || process.env[source.env] || source.root || "";
    const root = configuredRoot ? path.resolve(expandHome(configuredRoot)) : "";
    const docsDir = root ? path.resolve(root, source.docs) : "";
    return {
      id: source.id,
      type: source.type,
      description: source.description,
      env: source.env,
      root,
      docsDir,
      ready: Boolean(root && fs.existsSync(docsDir))
    };
  });
}

function sourceSummary(args) {
  const config = loadConfig();
  return {
    default_source: config.default_source || null,
    fallback_source: config.fallback_source || null,
    strategy: config.strategy || "online-first-with-optional-local-cache",
    sources: listSources(args)
  };
}

function printSearch(results, json) {
  if (json) {
    console.log(JSON.stringify({ results }, null, 2));
    return;
  }
  if (results.length === 0) {
    console.log("No matches.");
    return;
  }
  for (const [index, item] of results.entries()) {
    console.log(`${index + 1}. [${item.source}] ${item.title}`);
    console.log(`   path: ${item.source}:${item.path}`);
    console.log(`   score: ${item.score}`);
    for (const snippet of item.snippets) {
      console.log(`   L${snippet.line}: ${snippet.text}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._.shift();
  if (!command || command === "help" || args.help || args.h) {
    console.log(help());
  } else if (command === "sources") {
    console.log(JSON.stringify(sourceSummary(args), null, 2));
  } else if (command === "search") {
    const results = await searchWithFallback(args);
    printSearch(results, Boolean(args.json));
  } else if (command === "read") {
    const result = await readWithFallback(args);
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`[${result.source}] ${result.path}`);
      console.log(`lines: ${result.totalLines}, chars: ${result.returnedChars}${result.truncated ? " (truncated)" : ""}`);
      console.log("");
      console.log(result.content);
    }
  } else if (command === "brief") {
    const results = await searchWithFallback({ ...args, top: args.top || 3 });
    const enriched = [];
    for (const item of results.slice(0, Number(args.top || 3))) {
      if (item.source === "bwiki-online") {
        try {
          const doc = await readMediaWiki(getSource({ source: item.source }), { ...args, _: [item.title], "max-chars": 600 });
          enriched.push({
            ...item,
            snippets: doc.content
              .split(/\r?\n/)
              .map((line, index) => ({ line: index + 1, text: stripMarkdown(line).slice(0, 160) }))
              .filter((line) => line.text)
              .slice(0, 2)
          });
        } catch {
          enriched.push(item);
        }
      } else {
        enriched.push({ ...item, snippets: item.snippets.slice(0, 2) });
      }
    }
    printSearch(enriched, Boolean(args.json));
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error) => {
  console.error(`furina-wiki failed: ${error.message}`);
  process.exit(1);
});
