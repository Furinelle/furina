#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs, resolveUserPath } from "./lib/utils.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BRIDGE_PATH = path.join(SCRIPT_DIR, "lib", "furina_mnemosyne.py");
function help() {
  return `Furina relationship memory

Usage:
  node scripts/furina-relationship.mjs status [--format text|json|inject]
  node scripts/furina-relationship.mjs init [--format text|json|inject]
  node scripts/furina-relationship.mjs migrate --legacy-path FILE [--force]
  node scripts/furina-relationship.mjs set SCORE --reason TEXT
  node scripts/furina-relationship.mjs adjust DELTA --reason TEXT

Mnemosyne is the sole authority for Hermes relationship state.
The legacy furina-memory.json is read only by migrate and remains for
one-time migration from older all-platform releases.
`;
}

function runBridge(request) {
  const python = process.env.MNEMOSYNE_PYTHON || "python3";
  const result = spawnSync(python, [BRIDGE_PATH], {
    cwd: SCRIPT_DIR,
    encoding: "utf8",
    input: JSON.stringify(request),
    env: process.env
  });
  if (result.error) {
    throw new Error(`Cannot run ${python}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "Mnemosyne bridge failed").trim());
  }
  return JSON.parse(result.stdout);
}

function parseScore(raw, label) {
  if (!/^-?\d+$/.test(String(raw ?? ""))) {
    throw new Error(`${label} must be an integer`);
  }
  return Number(raw);
}

function legacyIntimacy(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const value = JSON.parse(fs.readFileSync(filePath, "utf8")).intimacy;
  const score = Number(value);
  if (!Number.isFinite(score)) {
    throw new Error(`Legacy memory has invalid intimacy: ${filePath}`);
  }
  return Math.max(0, Math.min(10, Math.round(score)));
}

function formatResult(result, format) {
  if (format === "json") {
    return `${JSON.stringify(result, null, 2)}\n`;
  }
  if (format === "inject") {
    if (!result.exists) {
      return [
        "[Furina relationship state]",
        "furina_intimacy: unknown",
        "relationship_stage: unknown",
        "instruction: initialize or migrate the canonical Mnemosyne record first.",
        ""
      ].join("\n");
    }
    return [
      "[Furina relationship state - Mnemosyne canonical]",
      `furina_intimacy: ${result.intimacy}/10`,
      `relationship_stage: ${result.relationship_stage}`,
      `confession_policy: ${result.confession_policy}`,
      "authority: 这是 Hermes 关系亲密度的唯一权威来源。",
      ""
    ].join("\n");
  }
  if (!result.exists) {
    return `Mnemosyne relationship state is not initialized: ${result.path}\n`;
  }
  return [
    `Mnemosyne relationship state: ${result.path}`,
    `intimacy: ${result.intimacy}/10`,
    `stage: ${result.relationship_stage}`,
    `policy: ${result.confession_policy}`,
    ""
  ].join("\n");
}

function requireReason(args) {
  const reason = String(args.reason || "").trim();
  if (!reason) throw new Error("--reason is required for relationship updates");
  return reason;
}

const args = parseArgs(process.argv.slice(2));
const command = args._[0] || "status";
const format = String(args.format || "text");

try {
  if (args.help || args.h || command === "help") {
    process.stdout.write(help());
    process.exit(0);
  }
  if (!["text", "json", "inject"].includes(format)) {
    throw new Error("--format must be text, json, or inject");
  }

  let result;
  if (command === "status") {
    result = runBridge({ action: "status" });
  } else if (command === "init") {
    const existing = runBridge({ action: "status" });
    result = existing.exists
      ? existing
      : runBridge({
        action: "set",
        score: 0,
        reason: "initialized canonical Hermes relationship state",
        source: "furina-hermes-init"
      });
    result.initialized = !existing.exists;
  } else if (command === "migrate") {
    const existing = runBridge({ action: "status" });
    if (!args["legacy-path"]) {
      throw new Error("migrate requires --legacy-path FILE");
    }
    if (existing.exists && !args.force) {
      result = { ...existing, migrated: false };
    } else {
      const legacyPath = resolveUserPath(args["legacy-path"]);
      result = runBridge({
        action: "set",
        score: legacyIntimacy(legacyPath),
        reason: fs.existsSync(legacyPath)
          ? `one-time migration from ${legacyPath}`
          : "initialized because no legacy Furina memory existed",
        source: "furina-legacy-migration"
      });
      result.migrated = true;
      result.legacy_path = legacyPath;
    }
  } else if (command === "set") {
    const score = parseScore(args._[1], "SCORE");
    if (score < 0 || score > 10) {
      throw new Error("SCORE must be between 0 and 10");
    }
    result = runBridge({
      action: "set",
      score,
      reason: requireReason(args),
      source: "furina-hermes-bridge"
    });
  } else if (command === "adjust") {
    const delta = parseScore(args._[1], "DELTA");
    result = runBridge({
      action: "adjust",
      delta,
      reason: requireReason(args),
      source: "furina-hermes-bridge"
    });
  } else {
    throw new Error(`Unknown command: ${command}`);
  }

  process.stdout.write(formatResult(result, format));
} catch (error) {
  console.error(`furina relationship failed: ${error.message}`);
  process.exit(1);
}
