import { strict as assert } from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  buildAngelMemoryNotes,
  buildAstrbotConfigExample,
  buildAstrbotPersona,
  generateAstrbotPack
} from "../scripts/furina-astrbot.mjs";

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");

describe("buildAstrbotPersona", () => {
  it("includes AstrBot plugin collaboration rules", () => {
    const persona = buildAstrbotPersona();

    assert.match(persona, /Angel Heart/);
    assert.match(persona, /core_memory_recall/);
    assert.match(persona, /recall_long_term_memory/);
    assert.match(persona, /四状态|4状态/);
    assert.match(persona, /芙宁娜/);
  });

  it("keeps Furina memory boundaries explicit", () => {
    const persona = buildAstrbotPersona();

    assert.match(persona, /普通寒暄不主动翻旧账/);
    assert.match(persona, /每轮最多.*1 条/);
    assert.match(persona, /不把完整记忆库|完整记忆库.*塞进/);
  });

  it("is concise enough for AstrBot persona (under 100 lines)", () => {
    const persona = buildAstrbotPersona();
    const lines = persona.split(/\r?\n/);
    assert.ok(lines.length < 100, `persona is too long: ${lines.length} lines`);
  });
});

describe("buildAngelMemoryNotes", () => {
  it("exports short cards suitable for Angel Memory knowledge base", () => {
    const notes = buildAngelMemoryNotes();
    const cardLines = notes.split(/\r?\n/).filter((line) => line && !line.startsWith("#"));

    assert.ok(cardLines.length >= 8);
    for (const line of cardLines) {
      assert.ok(line.length <= 120, `card is too long: ${line}`);
    }
  });
});

describe("buildAstrbotConfigExample", () => {
  it("maps the Furina persona to an isolated memory scope", () => {
    const config = JSON.parse(buildAstrbotConfigExample());

    assert.equal(config.angel_memory.conversation_scope_map["芙宁娜"], "furina");
    assert.equal(config.livingmemory.persona_isolation, true);
    assert.equal(config.angel_heart.persona_name, "芙宁娜");
  });
});

describe("generateAstrbotPack", () => {
  it("writes a complete AstrBot adapter pack (generated files)", () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "furina-astrbot-"));

    generateAstrbotPack(outDir);

    assert.ok(fs.existsSync(path.join(outDir, "persona", "furina-astrbot-persona.md")));
    assert.ok(fs.existsSync(path.join(outDir, "angel_memory", "furina_notes.md")));
    assert.ok(fs.existsSync(path.join(outDir, "angel_memory", "furina_core_memories.json")));
    assert.ok(fs.existsSync(path.join(outDir, "configs", "astrbot_plugins.example.json")));
    assert.ok(fs.existsSync(path.join(outDir, "README.md")));
  });
});

describe("native AstrBot plugin files", () => {
  it("metadata.yaml exists and contains required fields", () => {
    const content = fs.readFileSync(path.join(REPO_ROOT, "astrbot", "metadata.yaml"), "utf8");
    assert.match(content, /display_name/);
    assert.match(content, /short_desc/);
    assert.match(content, /astrbot_version/);
  });

  it("main.py exists and defines a Star subclass", () => {
    const content = fs.readFileSync(path.join(REPO_ROOT, "astrbot", "main.py"), "utf8");
    assert.match(content, /class \w+\(Star\)/);
    assert.match(content, /async def terminate/);
  });

  it("skills/furina/SKILL.md exists", () => {
    assert.ok(fs.existsSync(path.join(REPO_ROOT, "astrbot", "skills", "furina", "SKILL.md")));
  });

  it("_conf_schema.json is valid JSON with expected keys", () => {
    const raw = fs.readFileSync(path.join(REPO_ROOT, "astrbot", "_conf_schema.json"), "utf8");
    const schema = JSON.parse(raw);
    assert.ok("persona_name" in schema);
    assert.ok("angel_memory_scope" in schema);
  });
});
