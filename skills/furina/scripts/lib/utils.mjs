import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function parseArgs(argv, multiKeys = []) {
  const args = { _: [] };
  const multiSet = new Set(multiKeys);

  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith("--")) {
      args._.push(part);
      continue;
    }
    const eq = part.indexOf("=");
    if (eq !== -1) {
      assignArg(args, part.slice(2, eq), part.slice(eq + 1), multiSet);
      continue;
    }
    const key = part.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      assignArg(args, key, next, multiSet);
      i += 1;
    } else {
      assignArg(args, key, true, multiSet);
    }
  }
  return args;
}

function assignArg(args, key, value, multiSet) {
  if (multiSet.has(key)) {
    if (!Array.isArray(args[key])) args[key] = [];
    args[key].push(value);
    return;
  }
  args[key] = value;
}

export function expandHome(value) {
  const text = String(value || "");
  if (text === "~") return os.homedir();
  if (text.startsWith("~/") || text.startsWith("~\\")) return path.join(os.homedir(), text.slice(2));
  return text;
}

export function resolveUserPath(input) {
  return path.resolve(expandHome(input));
}

export function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ")
    .trim();
}

export function stripMarkdown(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function walkMarkdown(dir, results = []) {
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

export function safeRelative(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return relative.replace(/\\/g, "/");
}
