import { strict as assert } from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { ROOT } from "../scripts/lib/utils.mjs";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

const canonicalPersonaFiles = [
  "skills/furina/references/prompt/system.md",
  "skills/furina/references/prompt/_shared_runtime.md",
  "skills/furina/references/prompt/runtime_lite.md",
  "skills/furina/references/rules/ooc_rules.md",
  "skills/furina/references/furina_resource/01_profile.md",
  "skills/furina/references/furina_resource/02_personality.md",
  "skills/furina/references/furina_resource/03_story_timeline.md",
  "skills/furina/references/furina_resource/05_voice_style.md",
  "skills/furina/references/furina_resource/11_sensitive_topics.md",
  "skills/furina/references/eval/furina_voice_cases.md"
];

describe("canonical Furina characterization", () => {
  it("identifies Furina as human without assigning Focalors' species progression to her", () => {
    const profile = read("skills/furina/references/furina_resource/01_profile.md");
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
    const personality = read("skills/furina/references/furina_resource/02_personality.md");
    assert.match(personality, /秘密调查/);
    assert.doesNotMatch(personality, /调动各方力量|布置情报网|与那维莱特分工/);
    assert.match(personality, /并不知晓芙卡洛斯计划的全貌/);
  });

  it("treats voice devices as optional instead of mandatory templates", () => {
    const lite = read("skills/furina/references/prompt/runtime_lite.md");
    const voice = read("skills/furina/references/furina_resource/05_voice_style.md");
    assert.doesNotMatch(lite, /如果全段没有一个芙宁娜式意象/);
    assert.match(voice, /可选|不必每次|不要求每轮/);
  });

  it("preserves the intentional fan-work confession progression by intimacy", () => {
    const sensitive = read("skills/furina/references/furina_resource/11_sensitive_topics.md");
    assert.match(sensitive, /同人|长期陪伴|关系成长/);
    assert.match(sensitive, /\|\s*0[–-]4\s*\|\s*不接受\s*\|/);
    assert.match(sensitive, /\|\s*7[–-]8\s*\|\s*\*\*接受\*\*/);
    assert.match(sensitive, /\|\s*9[–-]10\s*\|\s*\*\*接受\*\*/);
  });

  it("keeps local resources first and external facts explicitly sourced", () => {
    const canonicalSkill = read("skills/furina/SKILL.md");
    assert.match(canonicalSkill, /references\/furina_resource\/00_index\.md/);
    assert.match(canonicalSkill, /优先权威原神来源/);
    assert.match(canonicalSkill, /参考资料\/推断/);
  });

  it("keeps the final voice and birthday fact checks resolved", () => {
    const timeline = read("skills/furina/references/furina_resource/03_story_timeline.md");
    const quotes = read("skills/furina/references/furina_resource/07_quotes.md");
    const voices = read("skills/furina/references/furina_resource/09_voice_lines.md");
    assert.match(timeline, /通心粉打折的大日子/);
    assert.match(timeline, /4\.3.*「蔷薇与铳枪」/);
    assert.match(timeline, /生日邮件「特邀函」/);
    assert.match(timeline, /生日邮件「大明星生日！」/);
    assert.doesNotMatch(timeline, /履刑者|正义的大宝剑/);
    assert.match(voices, /下雪的时候：“哇哦，这地方很适合映影取景。”/);
    assert.match(voices, /游戏 TextMap/);
    assert.doesNotMatch(voices, /待核|暂未逐字核对/);
    assert.doesNotMatch(quotes, /真的冤枉了好人吧/);
  });
});
