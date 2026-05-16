#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/utils.mjs";

const MAPPINGS = [
  ["src/memory", "codex/skills/furina-roleplay/references/memory"],
  ["src/prompt", "codex/skills/furina-roleplay/references/prompt"],
  ["src/rules", "codex/skills/furina-roleplay/references/rules"]
];

function syncDir(srcDir, dstDir, dryRun) {
  if (!fs.existsSync(srcDir)) {
    console.error(`source not found: ${srcDir}`);
    return [];
  }
  const synced = [];
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const src = path.join(srcDir, entry.name);
    const dst = path.join(dstDir, entry.name);

    const srcContent = fs.readFileSync(src, "utf8");
    let needsSync = true;
    if (fs.existsSync(dst)) {
      const dstContent = fs.readFileSync(dst, "utf8");
      needsSync = srcContent !== dstContent;
    }

    if (!needsSync) continue;
    if (dryRun) {
      synced.push(`would sync: ${src} -> ${dst}`);
      continue;
    }
    try {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      synced.push(`synced ${src} -> ${dst}`);
    } catch (err) {
      console.error(`failed to sync ${src} -> ${dst}: ${err.message}`);
    }
  }
  return synced;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const check = args.includes("--check");

  let allSynced = [];
  let exitCode = 0;

  for (const [src, dst] of MAPPINGS) {
    const srcDir = path.join(ROOT, src);
    const dstDir = path.join(ROOT, dst);
    const results = syncDir(srcDir, dstDir, dryRun || check);

    if (check && results.length > 0) exitCode = 1;
    for (const line of results) console.log(line);
    allSynced = allSynced.concat(results);
  }

  if (dryRun || check) {
    console.log(`\n${allSynced.length} file(s) need to be synced.`);
    if (dryRun) console.log("Run without --dry-run to sync.");
  } else if (allSynced.length === 0) {
    console.log("references already up to date.");
  } else {
    console.log(`\n${allSynced.length} file(s) synced.`);
  }

  process.exit(check ? exitCode : 0);
}

main();
