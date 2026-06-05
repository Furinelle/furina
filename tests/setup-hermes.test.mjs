import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const setupPath = path.join(repoRoot, "scripts", "setup.mjs");
const sourceSoul = fs.readFileSync(path.join(repoRoot, "hermes", "SOUL.md"), "utf8");
const hermesHome = fs.mkdtempSync(path.join(os.tmpdir(), "furina-hermes-"));

function runSetup(...args) {
  return spawnSync(process.execPath, [setupPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

after(() => {
  fs.rmSync(hermesHome, { recursive: true, force: true });
});

describe("Hermes setup target", () => {
  it("backs up SOUL.md and merges the repository skill directory", () => {
    fs.writeFileSync(path.join(hermesHome, "SOUL.md"), "# Previous identity\n");
    fs.writeFileSync(
      path.join(hermesHome, "config.yaml"),
      [
        "model:",
        "  default: deepseek-v4-pro",
        "web:",
        '  search_backend: ""',
        "custom:",
        "  keep_me: true",
        ""
      ].join("\n")
    );
    fs.writeFileSync(path.join(hermesHome, ".env"), "EXA_API_KEY=test-only\n");

    const result = runSetup("--hermes", "--hermes-home", hermesHome);
    assert.equal(result.status, 0, result.stderr || result.stdout);

    assert.equal(fs.readFileSync(path.join(hermesHome, "SOUL.md"), "utf8"), sourceSoul);
    const backups = fs.readdirSync(hermesHome).filter((name) => name.startsWith("SOUL.md.bak-"));
    assert.equal(backups.length, 1);

    const config = fs.readFileSync(path.join(hermesHome, "config.yaml"), "utf8");
    assert.match(config, /custom:\n  keep_me: true/);
    assert.match(config, new RegExp(JSON.stringify(path.join(repoRoot, "hermes", "skills"))));
    assert.match(config, /search_backend:\s*exa/);
  });

  it("is idempotent and passes the Hermes-only check", () => {
    const beforeConfig = fs.readFileSync(path.join(hermesHome, "config.yaml"), "utf8");
    const beforeBackups = fs.readdirSync(hermesHome).filter((name) => name.startsWith("SOUL.md.bak-"));

    const install = runSetup("--hermes", "--hermes-home", hermesHome);
    assert.equal(install.status, 0, install.stderr || install.stdout);
    assert.equal(fs.readFileSync(path.join(hermesHome, "config.yaml"), "utf8"), beforeConfig);

    const afterBackups = fs.readdirSync(hermesHome).filter((name) => name.startsWith("SOUL.md.bak-"));
    assert.deepEqual(afterBackups, beforeBackups);

    const check = runSetup("--check", "--hermes", "--hermes-home", hermesHome);
    assert.equal(check.status, 0, check.stderr || check.stdout);
    assert.match(check.stdout, /ok\s+Hermes SOUL\.md/);
    assert.match(check.stdout, /ok\s+Hermes external skill directory/);
  });
});
