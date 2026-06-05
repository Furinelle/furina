import { strict as assert } from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { ROOT } from "../scripts/lib/utils.mjs";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

const canonicalPersonaFiles = [
  "src/prompt/system.md",
  "src/prompt/_shared_runtime.md",
  "src/prompt/runtime_lite.md",
  "src/rules/ooc_rules.md",
  "furina_resource/01_profile.md",
  "furina_resource/02_personality.md",
  "furina_resource/03_story_timeline.md",
  "furina_resource/05_voice_style.md",
  "furina_resource/11_sensitive_topics.md",
  "eval/furina_voice_cases.md"
];

describe("canonical Furina characterization", () => {
  it("identifies Furina as human without assigning Focalors' species progression to her", () => {
    const profile = read("furina_resource/01_profile.md");
    assert.match(profile, /种族：人类/);
    assert.doesNotMatch(profile, /种族：纯水精灵\s*→\s*魔神\s*→\s*人类/);
    assert.match(profile, /人类身体与精神/);
  });

  it("avoids clinical diagnosis labels and mechanical trauma word counts", () => {
    const content = canonicalPersonaFiles.map(read).join("\n");
    assert.doesNotMatch(content, /\bPTSD\b/i);
    assert.doesNotMatch(content, /6\s*字以内/);
  });

  it("limits strategy claims to Furina's demonstrated secret investigations", () => {
    const personality = read("furina_resource/02_personality.md");
    assert.match(personality, /秘密调查/);
    assert.doesNotMatch(personality, /调动各方力量|布置情报网|与那维莱特分工/);
    assert.match(personality, /并不知晓芙卡洛斯计划的全貌/);
  });

  it("treats voice devices as optional instead of mandatory templates", () => {
    const lite = read("src/prompt/runtime_lite.md");
    const voice = read("furina_resource/05_voice_style.md");
    assert.doesNotMatch(lite, /如果全段没有一个芙宁娜式意象/);
    assert.match(voice, /可选|不必每次|不要求每轮/);
  });

  it("preserves the intentional fan-work confession progression by intimacy", () => {
    const sensitive = read("furina_resource/11_sensitive_topics.md");
    assert.match(sensitive, /同人|长期陪伴|关系成长/);
    assert.match(sensitive, /\|\s*0[–-]4\s*\|\s*不接受\s*\|/);
    assert.match(sensitive, /\|\s*7[–-]8\s*\|\s*\*\*接受\*\*/);
    assert.match(sensitive, /\|\s*9[–-]10\s*\|\s*\*\*接受\*\*/);
  });

  it("keeps local resources first and external facts explicitly sourced", () => {
    const codexSkill = read("codex/skills/furina-roleplay/SKILL.md");
    assert.match(codexSkill, /先读仓库根目录 `furina_resource\/00_index\.md`/);
    assert.match(codexSkill, /优先权威原神来源/);
    assert.match(codexSkill, /参考资料显示|据外部资料/);
  });
});
