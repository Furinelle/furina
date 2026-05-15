import { strict as assert } from "node:assert";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { queryTerms } from "../scripts/furina-wiki-index.mjs";

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const WIKI_CLI = path.join(REPO_ROOT, "scripts", "furina-wiki.mjs");

// --- unit: queryTerms ---
// queryTerms generates CJK bigrams + original terms + combined forms.
// Tests verify the original input terms are always included.

describe("queryTerms", () => {
  it("includes full input words", () => {
    const terms = queryTerms("芙宁娜 传说任务");
    assert.ok(terms.includes("芙宁娜"), "should include 芙宁娜");
    assert.ok(terms.includes("传说任务"), "should include 传说任务");
  });
  it("deduplicates terms", () => {
    const terms = queryTerms("芙宁娜 芙宁娜 枫丹");
    assert.equal(terms.filter((t) => t === "芙宁娜").length, 1);
  });
  it("filters empty strings", () => {
    assert.ok(!queryTerms("  ").includes(""));
  });
  it("returns array for single term", () => {
    assert.ok(Array.isArray(queryTerms("芙宁娜")));
  });
});

// --- integration: CLI sources ---

describe("furina-wiki CLI (integration)", () => {
  it("reports genshin-story source as ready", () => {
    const out = execSync(`node "${WIKI_CLI}" sources`, { encoding: "utf8" });
    const data = JSON.parse(out);
    const gs = data.sources.find((s) => s.id === "genshin-story");
    assert.ok(gs, "genshin-story source should exist");
    assert.equal(gs.ready, true, "genshin-story should be ready");
  });

  it("returns results for 芙宁娜 search", () => {
    const out = execSync(`node "${WIKI_CLI}" search "芙宁娜" --top 3 --json`, {
      encoding: "utf8",
    });
    const data = JSON.parse(out);
    assert.ok(Array.isArray(data.results), "results should be array");
    assert.ok(data.results.length > 0, "should find at least one result");
    assert.equal(
      data.results[0].source,
      "genshin-story",
      "first result should come from local cache"
    );
  });

  it("results contain path and snippets", () => {
    const out = execSync(`node "${WIKI_CLI}" search "芙宁娜 传说任务" --top 2 --json`, {
      encoding: "utf8",
    });
    const data = JSON.parse(out);
    for (const r of data.results) {
      assert.ok(typeof r.path === "string", "result should have path");
      assert.ok(Array.isArray(r.snippets), "result should have snippets");
    }
  });

  it("searches non-character categories (圣遗物)", () => {
    const out = execSync(`node "${WIKI_CLI}" search "水仙之梦 圣遗物" --top 2 --json`, {
      encoding: "utf8",
    });
    const data = JSON.parse(out);
    assert.ok(data.results.length > 0, "should find artifact results");
    assert.ok(
      data.results[0].path.includes("圣遗物"),
      "result path should contain 圣遗物"
    );
  });
});
