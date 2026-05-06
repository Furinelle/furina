#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs, expandHome, resolveUserPath, ROOT } from "./lib/utils.mjs";

const LEGACY_COMMANDS = ["furina.md", "furina-save.md", "furina-reflect.md", "furina-compress.md"];
const CLAUDE_SKILLS = ["furina", "furina-save", "furina-reflect", "furina-compress"];

function help() {
  return `Furina setup

Usage:
  node scripts/setup.mjs                 Install Claude Code + Codex Skill + memory runtime
  node scripts/setup.mjs --claude        Install Claude Code skills only
  node scripts/setup.mjs --codex         Install Codex Skill only
  node scripts/setup.mjs --check         Check installed files
  node scripts/setup.mjs --check --claude
  node scripts/setup.mjs --check --codex

Options:
  --project-claude       Use project .claude/skills instead of installing personal Claude skills
  --legacy-commands      Also install legacy Claude command templates to ~/.claude/commands
  --reset-memory         Replace the existing memory JSON with the empty template
  --dry-run              Print actions without writing files
  --claude-home <dir>    Override Claude home, defaults to CLAUDE_HOME or ~/.claude
  --codex-home <dir>     Override Codex home, defaults to CODEX_HOME or ~/.codex
  --memory-path <file>   Override memory JSON path
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

function writeJson(dst, value, label, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] write ${label}: ${dst}`);
    return;
  }
  mkdir(path.dirname(dst), false);
  fs.writeFileSync(dst, `${JSON.stringify(value, null, 2)}\n`);
  console.log(`installed ${label}: ${dst}`);
}

function existsLabel(filePath) {
  return fs.existsSync(filePath) ? "ok" : "missing";
}

function installClaude(paths, dryRun) {
  if (!paths.useProjectClaude) {
    mkdir(paths.claudeSkillsDir, dryRun);
    for (const name of CLAUDE_SKILLS) {
      copyDir(
        path.join(ROOT, ".claude", "skills", name),
        path.join(paths.claudeSkillsDir, name),
        `Claude skill ${name}`,
        dryRun
      );
    }
    installLegacyCommands(paths, dryRun);
    return;
  }

  for (const name of CLAUDE_SKILLS) {
    ensureSource(path.join(ROOT, ".claude", "skills", name, "SKILL.md"));
  }
  console.log("kept project Claude skills: .claude/skills");
  installLegacyCommands(paths, dryRun);
}

function installLegacyCommands(paths, dryRun) {
  if (!paths.installLegacyCommands) {
    console.log("skipped legacy Claude commands: pass --legacy-commands to install them");
    return;
  }
  mkdir(paths.claudeCommandsDir, dryRun);
  for (const name of LEGACY_COMMANDS) {
    copyFile(
      path.join(ROOT, "claudecode", "commands", name),
      path.join(paths.claudeCommandsDir, name),
      `Claude command ${name}`,
      dryRun
    );
  }
}

function installRuntime(paths, dryRun) {
  copyFile(
    path.join(ROOT, "scripts", "furina-memory.mjs"),
    paths.runtimePath,
    "shared memory runtime",
    dryRun
  );
}

function installMemory(paths, resetMemory, dryRun) {
  const source = path.join(ROOT, "claudecode", "memory", "furina-memory.json");
  ensureSource(source);
  if (fs.existsSync(paths.memoryPath) && !resetMemory) {
    console.log(`kept existing memory: ${paths.memoryPath}`);
    return;
  }
  copyFile(source, paths.memoryPath, resetMemory ? "reset memory JSON" : "memory JSON", dryRun);
}

function installCodex(paths, dryRun) {
  copyDir(
    path.join(ROOT, "codex", "skills", "furina-roleplay"),
    paths.codexSkillDir,
    "Codex skill furina-roleplay",
    dryRun
  );
  writeJson(
    paths.codexInstallContext,
    {
      repo_root: ROOT,
      furina_resource: path.join(ROOT, "furina_resource"),
      memory_runtime: path.join(ROOT, "scripts", "furina-memory.mjs"),
      wiki_runtime: path.join(ROOT, "scripts", "furina-wiki.mjs"),
      generated_by: "scripts/setup.mjs"
    },
    "Codex install context",
    dryRun
  );
}

function check(paths, targets) {
  const checks = [];
  if (targets.claude) {
    for (const name of CLAUDE_SKILLS) {
      const skillPath = paths.useProjectClaude
        ? path.join(ROOT, ".claude", "skills", name, "SKILL.md")
        : path.join(paths.claudeSkillsDir, name, "SKILL.md");
      checks.push([`Claude skill ${name}`, skillPath]);
    }
    if (paths.installLegacyCommands) {
      for (const name of LEGACY_COMMANDS) {
        checks.push([`Claude command ${name}`, path.join(paths.claudeCommandsDir, name)]);
      }
    }
  }
  if (targets.runtime) {
    checks.push(["memory runtime", paths.runtimePath]);
  }
  if (targets.memory) {
    checks.push(["memory JSON", paths.memoryPath]);
  }
  if (targets.codex) {
    checks.push(["Codex skill", paths.codexSkillDir]);
    checks.push(["Codex SKILL.md", path.join(paths.codexSkillDir, "SKILL.md")]);
    checks.push(["Codex install context", paths.codexInstallContext]);
  }

  let ok = true;
  for (const [label, filePath] of checks) {
    const state = existsLabel(filePath);
    if (state !== "ok") ok = false;
    console.log(`${state.padEnd(7)} ${label}: ${filePath}`);
  }
  return ok;
}

const args = parseArgs(process.argv.slice(2));

if (args.help || args.h) {
  console.log(help());
  process.exit(0);
}

const claudeHome = resolveUserPath(args["claude-home"] || process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude"));
const codexHome = resolveUserPath(args["codex-home"] || process.env.CODEX_HOME || path.join(os.homedir(), ".codex"));
const useProjectClaude = Boolean(args["project-claude"]);
const paths = {
  useProjectClaude,
  installLegacyCommands: Boolean(args["legacy-commands"]),
  claudeSkillsDir: useProjectClaude ? path.join(ROOT, ".claude", "skills") : path.join(claudeHome, "skills"),
  claudeCommandsDir: path.join(claudeHome, "commands"),
  runtimePath: path.join(claudeHome, "furina-memory.mjs"),
  memoryPath: resolveUserPath(args["memory-path"] || path.join(claudeHome, "furina-memory.json")),
  codexSkillDir: path.join(codexHome, "skills", "furina-roleplay"),
  codexInstallContext: path.join(codexHome, "skills", "furina-roleplay", "references", "install_context.json")
};

const dryRun = Boolean(args["dry-run"]);
const explicitTargets = Boolean(args.claude || args.codex || args.memory || args.runtime);
const installAll = !explicitTargets;
const wantsClaude = installAll || Boolean(args.claude);
const wantsCodex = installAll || Boolean(args.codex);
const wantsRuntime = installAll || wantsClaude || Boolean(args.runtime);
const wantsMemory = installAll || wantsClaude || Boolean(args.memory);
const targets = {
  claude: wantsClaude,
  codex: wantsCodex,
  runtime: wantsRuntime,
  memory: wantsMemory
};

try {
  if (args.check) {
    process.exit(check(paths, targets) ? 0 : 1);
  }

  if (wantsClaude) installClaude(paths, dryRun);
  if (wantsRuntime) installRuntime(paths, dryRun);
  if (wantsMemory) installMemory(paths, Boolean(args["reset-memory"]), dryRun);
  if (wantsCodex) installCodex(paths, dryRun);

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
  console.log("  Codex: ask for Furina roleplay or resource maintenance; the skill is installed.");
} catch (error) {
  console.error(`setup failed: ${error.message}`);
  process.exit(1);
}
