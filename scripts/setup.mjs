#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs, resolveUserPath, ROOT } from "./lib/utils.mjs";
import {
  configHasExternalDir,
  configHasMemoryProvider,
  configUsesMnemosyneOnly,
  hasEnvKey,
  mergeHermesConfig
} from "./lib/hermes-config.mjs";

function help() {
  return `Furina Hermes setup

Usage:
  node scripts/setup.mjs
  node scripts/setup.mjs --check
  node scripts/setup.mjs --dry-run

Options:
  --hermes-home <dir>          Override HERMES_HOME (default: ~/.hermes)
  --mnemosyne-python <python>  Python interpreter that can import Mnemosyne
  --legacy-memory-path <file>  One-time migration from an older Furina JSON
  --dry-run                    Preview without writing
  --check                      Verify Hermes identity, skill, provider, and state
`;
}

function ensureSource(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing source: ${path.relative(ROOT, filePath)}`);
  }
}

function mkdir(dir, dryRun) {
  if (!dryRun) fs.mkdirSync(dir, { recursive: true });
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

function writeText(dst, value, label, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] write ${label}: ${dst}`);
    return;
  }
  mkdir(path.dirname(dst), false);
  fs.writeFileSync(dst, value);
  console.log(`installed ${label}: ${dst}`);
}

function timestamp() {
  return new Date().toISOString().replace(/\D/g, "").slice(0, 14);
}

function availableBackupPath(filePath) {
  const base = `${filePath}.bak-${timestamp()}`;
  if (!fs.existsSync(base)) return base;
  let suffix = 1;
  while (fs.existsSync(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function runCommand(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    encoding: "utf8",
    env: options.env || process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${command} failed`).trim());
  }
  return result;
}

function canImportMnemosyne(python) {
  const result = spawnSync(python, ["-c", "import mnemosyne"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  return result.status === 0;
}

function relationshipCommand(paths, commandArgs) {
  return runCommand(
    process.execPath,
    [path.join(ROOT, "scripts", "furina-relationship.mjs"), ...commandArgs],
    {
      env: {
        ...process.env,
        MNEMOSYNE_PYTHON: paths.mnemosynePython
      }
    }
  );
}

function installMnemosyneProvider(paths, dryRun) {
  if (!canImportMnemosyne(paths.mnemosynePython)) {
    throw new Error(
      `${paths.mnemosynePython} cannot import mnemosyne; install Mnemosyne `
      + "or pass --mnemosyne-python"
    );
  }

  const config = fs.existsSync(paths.hermesConfig)
    ? fs.readFileSync(paths.hermesConfig, "utf8")
    : "";
  const ready = fs.existsSync(paths.mnemosynePlugin)
    && configHasMemoryProvider(config, "mnemosyne");
  if (ready) {
    console.log(`kept Hermes Mnemosyne provider: ${paths.mnemosynePlugin}`);
    return;
  }

  const args = [
    "-m",
    "mnemosyne",
    "install-hermes",
    "--python",
    paths.mnemosynePython,
    "--hermes-home",
    paths.hermesHome
  ];
  if (fs.existsSync(paths.mnemosynePlugin)) args.push("--force");
  if (dryRun) args.push("--dry-run");
  const result = runCommand(paths.mnemosynePython, args);
  process.stdout.write(result.stdout);
}

function installIdentityAndSkill(paths, dryRun) {
  const soulSource = path.join(ROOT, "hermes", "SOUL.md");
  const skillSource = path.join(paths.hermesSkillsDir, "furina-roleplay", "SKILL.md");
  ensureSource(soulSource);
  ensureSource(skillSource);

  const soulContent = fs.readFileSync(soulSource, "utf8");
  const existingSoul = fs.existsSync(paths.hermesSoul)
    ? fs.readFileSync(paths.hermesSoul, "utf8")
    : null;
  if (existingSoul !== soulContent) {
    if (existingSoul !== null) {
      copyFile(
        paths.hermesSoul,
        availableBackupPath(paths.hermesSoul),
        "Hermes SOUL.md backup",
        dryRun
      );
    }
    copyFile(soulSource, paths.hermesSoul, "Hermes Furina SOUL.md", dryRun);
  } else {
    console.log(`kept current Hermes SOUL.md: ${paths.hermesSoul}`);
  }

  const config = fs.existsSync(paths.hermesConfig)
    ? fs.readFileSync(paths.hermesConfig, "utf8")
    : "";
  const env = fs.existsSync(paths.hermesEnv)
    ? fs.readFileSync(paths.hermesEnv, "utf8")
    : "";
  const exaReady = hasEnvKey(env, "EXA_API_KEY");
  const merged = mergeHermesConfig(config, paths.hermesSkillsDir, {
    preferExa: exaReady,
    mnemosyneOnly: true
  });
  if (merged !== config) {
    writeText(paths.hermesConfig, merged, "Hermes config", dryRun);
  } else {
    console.log(`kept Hermes external skill directory: ${paths.hermesSkillsDir}`);
  }
  console.log(
    `${(exaReady ? "ready" : "optional").padEnd(8)} Hermes Exa credential: ${paths.hermesEnv}`
  );
}

function installRelationshipState(paths, legacyMemoryPath, dryRun) {
  if (dryRun) {
    const action = legacyMemoryPath
      ? `migrate relationship state from ${legacyMemoryPath}`
      : "initialize canonical relationship state";
    console.log(`[dry-run] ${action}`);
    return;
  }

  const args = legacyMemoryPath
    ? ["migrate", "--legacy-path", legacyMemoryPath, "--format", "json"]
    : ["init", "--format", "json"];
  const state = JSON.parse(relationshipCommand(paths, args).stdout);
  console.log(
    `${state.migrated || state.initialized ? "initialized" : "kept"} `
    + `Hermes relationship state: ${state.intimacy}/10 (${state.relationship_stage})`
  );
}

function check(paths) {
  let ok = true;
  const soulSource = path.join(ROOT, "hermes", "SOUL.md");
  const soulMatches = fs.existsSync(paths.hermesSoul)
    && fs.readFileSync(paths.hermesSoul, "utf8") === fs.readFileSync(soulSource, "utf8");
  if (!soulMatches) ok = false;
  console.log(`${(soulMatches ? "ok" : "missing").padEnd(7)} Hermes SOUL.md: ${paths.hermesSoul}`);

  const config = fs.existsSync(paths.hermesConfig)
    ? fs.readFileSync(paths.hermesConfig, "utf8")
    : "";
  const skillReady = configHasExternalDir(config, paths.hermesSkillsDir);
  if (!skillReady) ok = false;
  console.log(
    `${(skillReady ? "ok" : "missing").padEnd(7)} Hermes external skill directory: `
    + paths.hermesSkillsDir
  );

  const providerReady = fs.existsSync(paths.mnemosynePlugin)
    && configHasMemoryProvider(config, "mnemosyne")
    && configUsesMnemosyneOnly(config)
    && canImportMnemosyne(paths.mnemosynePython);
  if (!providerReady) ok = false;
  console.log(
    `${(providerReady ? "ok" : "missing").padEnd(7)} Hermes Mnemosyne provider: `
    + paths.mnemosynePlugin
  );

  let relationshipReady = false;
  if (providerReady) {
    const result = relationshipCommand(paths, ["status", "--format", "json"]);
    relationshipReady = Boolean(JSON.parse(result.stdout).exists);
  }
  if (!relationshipReady) ok = false;
  console.log(
    `${(relationshipReady ? "ok" : "missing").padEnd(7)} Hermes Furina relationship state`
  );

  const exaReady = fs.existsSync(paths.hermesEnv)
    && hasEnvKey(fs.readFileSync(paths.hermesEnv, "utf8"), "EXA_API_KEY");
  console.log(
    `${(exaReady ? "ready" : "optional").padEnd(7)} Hermes Exa credential: ${paths.hermesEnv}`
  );
  return ok;
}

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) {
  console.log(help());
  process.exit(0);
}

const hermesHome = resolveUserPath(
  args["hermes-home"] || process.env.HERMES_HOME || path.join(os.homedir(), ".hermes")
);
const paths = {
  hermesHome,
  hermesSoul: path.join(hermesHome, "SOUL.md"),
  hermesConfig: path.join(hermesHome, "config.yaml"),
  hermesEnv: path.join(hermesHome, ".env"),
  hermesSkillsDir: path.join(ROOT, "hermes", "skills"),
  mnemosynePlugin: path.join(hermesHome, "plugins", "mnemosyne", "__init__.py"),
  mnemosynePython: String(
    args["mnemosyne-python"]
    || process.env.MNEMOSYNE_PYTHON
    || process.env.PYTHON
    || "python3"
  )
};
const legacyMemoryPath = args["legacy-memory-path"]
  ? resolveUserPath(args["legacy-memory-path"])
  : "";
const dryRun = Boolean(args["dry-run"]);

try {
  if (args.check) {
    process.exit(check(paths) ? 0 : 1);
  }

  installMnemosyneProvider(paths, dryRun);
  installIdentityAndSkill(paths, dryRun);
  installRelationshipState(paths, legacyMemoryPath, dryRun);

  console.log("");
  if (dryRun) {
    console.log("Dry run complete: no files were written.");
    process.exit(0);
  }
  if (!check(paths)) process.exit(1);
  console.log("");
  console.log("Hermes is ready. Start a new session to load the Furina identity.");
} catch (error) {
  console.error(`setup failed: ${error.message}`);
  process.exit(1);
}
