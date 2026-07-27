#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parseArgs, resolveUserPath, ROOT } from "./lib/utils.mjs";

const SKILL_SRC = path.join(ROOT, "skills", "furina");
const SKILL_NAME = "furina";

function help() {
  return `Furina setup — install the universal skill into any agent's skills directory

Recommended: npx skills add Furinelle/furina   (auto-detects compatible agents)

Usage:
  node scripts/setup.mjs                 Install to Claude Code + .agents (cross-agent convention) + memory runtime
  node scripts/setup.mjs --claude        ~/.claude/skills/furina (Claude Code)
  node scripts/setup.mjs --agents        ~/.agents/skills/furina (Codex / Cursor / Goose / Amp / Cline ...)
  node scripts/setup.mjs --gemini        ~/.gemini/skills/furina (Gemini CLI)
  node scripts/setup.mjs --opencode      ~/.config/opencode/skills/furina (OpenCode)
  node scripts/setup.mjs --dir <path>    <path>/furina (any other agent)
  node scripts/setup.mjs --check [target flags]

Options:
  --reset-memory         Replace the existing memory JSON with the empty template
  --dry-run              Print actions without writing files
  --claude-home <dir>    Override Claude home (default CLAUDE_HOME or ~/.claude)
  --memory-path <file>   Override memory JSON path
  --codex                Deprecated alias of --agents (Codex reads ~/.agents/skills)
`;
}

function ensureSource(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing source: ${path.relative(ROOT, filePath)}`);
  }
}

function mkdir(dir, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dst, label, dryRun) {
  ensureSource(src);
  if (dryRun) {
    console.log(`[dry-run] copy ${label}: ${src} -> ${dst}`);
    return;
  }
  mkdir(path.dirname(dst), false);
  fs.copyFileSync(src, dst);
  console.log(`installed ${label}: ${dst}`);
}

function copyDir(src, dst, label, dryRun) {
  ensureSource(src);
  if (dryRun) {
    console.log(`[dry-run] copy ${label}: ${src} -> ${dst}`);
    return;
  }
  mkdir(path.dirname(dst), false);
  fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(src, dst, { recursive: true, force: true });
  console.log(`installed ${label}: ${dst}`);
}

function existsLabel(filePath) {
  return fs.existsSync(filePath) ? "ok" : "missing";
}

function installSkill(targetDir, label, dryRun) {
  copyDir(SKILL_SRC, path.join(targetDir, SKILL_NAME), `skill (${label})`, dryRun);
}

function installRuntime(paths, dryRun) {
  const src = path.join(SKILL_SRC, "scripts", "furina-memory.mjs");
  ensureSource(src);
  copyFile(
    path.join(SKILL_SRC, "scripts", "lib", "utils.mjs"),
    paths.runtimeLibPath,
    "memory runtime lib",
    dryRun
  );
  if (dryRun) {
    console.log(`[dry-run] copy shared memory runtime: ${src} -> ${paths.runtimePath}`);
    return;
  }
  // 安装副本不再与 skill 同目录，重写相对导入指向随装的 furina-lib，避免 ERR_MODULE_NOT_FOUND
  const content = fs.readFileSync(src, "utf8").replace('"./lib/utils.mjs"', '"./furina-lib/utils.mjs"');
  mkdir(path.dirname(paths.runtimePath), false);
  fs.writeFileSync(paths.runtimePath, content);
  console.log(`installed shared memory runtime: ${paths.runtimePath}`);
}

function installMemory(paths, resetMemory, dryRun) {
  const source = path.join(SKILL_SRC, "assets", "memory-template.json");
  ensureSource(source);
  if (fs.existsSync(paths.memoryPath) && !resetMemory) {
    console.log(`kept existing memory: ${paths.memoryPath}`);
    return;
  }
  copyFile(source, paths.memoryPath, resetMemory ? "reset memory JSON" : "memory JSON", dryRun);
}

function check(paths, targets) {
  const checks = [];
  for (const [flag, dir, label] of paths.skillTargets) {
    if (!targets[flag]) continue;
    checks.push([`skill (${label})`, path.join(dir, SKILL_NAME, "SKILL.md")]);
  }
  if (targets.runtime) checks.push(["memory runtime", paths.runtimePath]);
  if (targets.memory) checks.push(["memory JSON", paths.memoryPath]);

  let ok = true;
  for (const [label, filePath] of checks) {
    const state = existsLabel(filePath);
    if (state !== "ok") ok = false;
    console.log(`${state.padEnd(7)} ${label}: ${filePath}`);
  }

  // 仅验存在性会漏掉依赖缺失（如 lib 未随装），对运行时做一次真实冒烟
  if (targets.runtime && fs.existsSync(paths.runtimePath)) {
    try {
      execFileSync(process.execPath, [paths.runtimePath, "status"], { stdio: "pipe" });
      console.log(`ok      memory runtime smoke test: node ${paths.runtimePath} status`);
    } catch (error) {
      ok = false;
      const firstLine = String(error.stderr || error.message).split("\n")[0];
      console.log(`failed  memory runtime smoke test: node ${paths.runtimePath} status (${firstLine})`);
    }
  }
  return ok;
}

const args = parseArgs(process.argv.slice(2));

if (args.help || args.h) {
  console.log(help());
  process.exit(0);
}

const claudeHome = resolveUserPath(args["claude-home"] || process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude"));
const agentsHome = resolveUserPath(process.env.AGENTS_HOME || path.join(os.homedir(), ".agents"));
const customDir = args.dir ? resolveUserPath(args.dir) : null;

const paths = {
  // [flag, skillsDir, label]
  skillTargets: [
    ["claude", path.join(claudeHome, "skills"), "Claude Code"],
    ["agents", path.join(agentsHome, "skills"), ".agents cross-agent"],
    ["gemini", path.join(os.homedir(), ".gemini", "skills"), "Gemini CLI"],
    ["opencode", path.join(os.homedir(), ".config", "opencode", "skills"), "OpenCode"],
    ...(customDir ? [["dir", customDir, "custom dir"]] : [])
  ],
  runtimePath: path.join(claudeHome, "furina-memory.mjs"),
  runtimeLibPath: path.join(claudeHome, "furina-lib", "utils.mjs"),
  memoryPath: resolveUserPath(args["memory-path"] || path.join(claudeHome, "furina-memory.json"))
};

const dryRun = Boolean(args["dry-run"]);
if (args.codex) {
  console.log("note: --codex is deprecated; Codex reads ~/.agents/skills — installing there (--agents).");
}
const wantsAgentsFlag = Boolean(args.agents || args.codex);
const explicitTargets = Boolean(args.claude || wantsAgentsFlag || args.gemini || args.opencode || customDir || args.memory || args.runtime);
const installAll = !explicitTargets;
const targets = {
  claude: installAll || Boolean(args.claude),
  agents: installAll || wantsAgentsFlag,
  gemini: Boolean(args.gemini),
  opencode: Boolean(args.opencode),
  dir: Boolean(customDir),
  runtime: installAll || Boolean(args.claude) || Boolean(args.runtime),
  memory: installAll || Boolean(args.claude) || Boolean(args.memory)
};

try {
  if (args.check) {
    process.exit(check(paths, targets) ? 0 : 1);
  }

  for (const [flag, dir, label] of paths.skillTargets) {
    if (targets[flag]) installSkill(dir, label, dryRun);
  }
  if (targets.runtime) installRuntime(paths, dryRun);
  if (targets.memory) installMemory(paths, Boolean(args["reset-memory"]), dryRun);

  console.log("");
  if (dryRun) {
    console.log("Dry run complete: no files were written.");
    console.log("Run without --dry-run to install, then use --check to verify.");
    process.exit(0);
  }

  check(paths, targets);
  console.log("");
  console.log("Next:");
  console.log("  Claude Code: /furina 你好，芙宁娜。");
  console.log("  Other agents: mention Furina roleplay, or invoke the skill by name (e.g. $furina in Codex).");
} catch (error) {
  console.error(`setup failed: ${error.message}`);
  process.exit(1);
}
