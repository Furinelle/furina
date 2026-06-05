import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(repoRoot, "scripts", "furina-relationship.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "furina-relationship-"));
const mnemosyneHome = path.join(tempRoot, "mnemosyne");
const legacyPath = path.join(tempRoot, "furina-memory.json");
let mnemosyneAvailable = false;

function runRelationship(...args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      MNEMOSYNE_HOME: mnemosyneHome
    }
  });
}

function jsonOutput(result) {
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

before(() => {
  const probe = spawnSync(
    process.env.MNEMOSYNE_PYTHON || "python3",
    ["-c", "import mnemosyne"],
    { encoding: "utf8" }
  );
  mnemosyneAvailable = probe.status === 0;
});

after(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe("canonical Furina relationship memory", () => {
  it("creates and overwrites one fixed Mnemosyne record", (t) => {
    if (!mnemosyneAvailable) return t.skip("Mnemosyne is not installed");

    const first = jsonOutput(runRelationship(
      "set",
      "7",
      "--reason",
      "test milestone",
      "--format",
      "json"
    ));
    assert.equal(first.id, "preference-furina-intimacy");
    assert.equal(first.intimacy, 7);
    assert.equal(first.relationship_stage, "accept_reserved");

    const second = jsonOutput(runRelationship(
      "set",
      "9",
      "--reason",
      "test milestone two",
      "--format",
      "json"
    ));
    assert.equal(second.intimacy, 9);
    assert.equal(second.relationship_stage, "accept_openly");

    const files = fs.readdirSync(path.join(mnemosyneHome, "working"))
      .filter((name) => name.includes("furina-intimacy"));
    assert.deepEqual(files, ["preference-furina-intimacy.md"]);
    const source = fs.readFileSync(
      path.join(mnemosyneHome, "working", files[0]),
      "utf8"
    );
    assert.match(source, /furina_intimacy: 9/);
    assert.doesNotMatch(source, /furina_intimacy: 7/);
  });

  it("migrates legacy intimacy once without overwriting canonical state", (t) => {
    if (!mnemosyneAvailable) return t.skip("Mnemosyne is not installed");

    fs.rmSync(mnemosyneHome, { recursive: true, force: true });
    fs.writeFileSync(legacyPath, `${JSON.stringify({ intimacy: 4 })}\n`);

    const migrated = jsonOutput(runRelationship(
      "migrate",
      "--legacy-path",
      legacyPath,
      "--format",
      "json"
    ));
    assert.equal(migrated.intimacy, 4);
    assert.equal(migrated.migrated, true);

    fs.writeFileSync(legacyPath, `${JSON.stringify({ intimacy: 1 })}\n`);
    const kept = jsonOutput(runRelationship(
      "migrate",
      "--legacy-path",
      legacyPath,
      "--format",
      "json"
    ));
    assert.equal(kept.intimacy, 4);
    assert.equal(kept.migrated, false);
  });

  it("returns an exact injection block and is discoverable by search", (t) => {
    if (!mnemosyneAvailable) return t.skip("Mnemosyne is not installed");

    const injected = runRelationship("status", "--format", "inject");
    assert.equal(injected.status, 0, injected.stderr || injected.stdout);
    assert.match(injected.stdout, /furina_intimacy: 4\/10/);
    assert.match(injected.stdout, /relationship_stage: stage_distance/);
    assert.match(injected.stdout, /唯一权威来源/);

    const search = spawnSync(
      process.env.MNEMOSYNE_PYTHON || "python3",
      ["-m", "mnemosyne", "search", "芙宁娜 告白 亲密度", "--scope", "global", "--format", "json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          MNEMOSYNE_HOME: mnemosyneHome
        }
      }
    );
    assert.equal(search.status, 0, search.stderr || search.stdout);
    assert.match(search.stdout, /preference-furina-intimacy/);
  });

  it("rejects values outside the 0-10 range", (t) => {
    if (!mnemosyneAvailable) return t.skip("Mnemosyne is not installed");

    const result = runRelationship("set", "11", "--reason", "invalid");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /0.*10/);
  });
});
