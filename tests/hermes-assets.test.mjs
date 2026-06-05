import { strict as assert } from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { ROOT } from "../scripts/lib/utils.mjs";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Hermes Furina identity", () => {
  it("defines a concise post-Archon, task-first global identity", () => {
    const soul = read("hermes/SOUL.md");
    assert.ok(soul.length > 300 && soul.length < 8000);
    assert.match(soul, /你是芙宁娜/);
    assert.match(soul, /卸任|凡人|人类/);
    assert.match(soul, /简体中文/);
    assert.match(soul, /工程|代码|配置|工具/);
    assert.match(soul, /任务.*优先|准确.*优先/);
    assert.doesNotMatch(soul, /furina_resource|\/Users\/|~\/\.hermes/);
  });
});

describe("Hermes Furina skill", () => {
  it("uses valid Hermes frontmatter and progressive resource lookup", () => {
    const skill = read("hermes/skills/furina-roleplay/SKILL.md");
    assert.ok(skill.startsWith("---\n"));
    assert.match(skill, /\nname:\s*furina-roleplay\n/);
    assert.match(skill, /\ndescription:\s*.+\n/);
    assert.match(skill, /\nversion:\s*[0-9]+\.[0-9]+\.[0-9]+\n/);
    assert.match(skill, /metadata:\n\s+hermes:/);
    assert.match(skill, /\$\{HERMES_SKILL_DIR\}/);
    assert.match(skill, /furina_resource\/00_index\.md/);
    assert.match(skill, /1-2|一至两个|1 至 2/);
  });

  it("documents local-first lore, Exa preference, and search fallback", () => {
    const skill = read("hermes/skills/furina-roleplay/SKILL.md");
    assert.match(skill, /本地.*优先|先查.*本地/);
    assert.match(skill, /\bExa\b/);
    assert.match(skill, /web_search/);
    assert.match(skill, /web_extract/);
    assert.match(skill, /其他.*搜索|回退|fallback/i);
    assert.match(skill, /参考资料|外部资料/);
  });

  it("keeps technical tasks useful while retaining Furina identity", () => {
    const skill = read("hermes/skills/furina-roleplay/SKILL.md");
    assert.match(skill, /工程|代码|配置|命令/);
    assert.match(skill, /任务优先|准确.*优先/);
    assert.match(skill, /不要.*舞台腔|收敛.*戏剧|不强行.*角色腔/);
  });

  it("uses Mnemosyne as the sole Hermes relationship authority", () => {
    const skill = read("hermes/skills/furina-roleplay/SKILL.md");
    assert.match(skill, /furina-relationship\.mjs status --format inject/);
    assert.match(skill, /Mnemosyne/);
    assert.match(skill, /唯一.*权威|sole.*authority/i);
    assert.match(skill, /furina-memory\.json/);
    assert.match(skill, /不要.*读取|do not read/i);
  });
});
