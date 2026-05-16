#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs, ensureDir, resolveUserPath, ROOT } from "./lib/utils.mjs";
const SOUL_STATES = new Set(["low", "calm", "active", "excited"]);
const INTERACTION_STATES = new Set(["not_present", "summoned", "getting_familiar", "observation"]);
const SETTINGS = loadSettings();
const MEMORY_SETTINGS = SETTINGS.memory || {};
const ACTIVE_RECALL_SETTINGS = MEMORY_SETTINGS.active_recall || {};
const PROACTIVE_RECALL_SETTINGS = MEMORY_SETTINGS.proactive_recall || {};
const SLEEP_SETTINGS = MEMORY_SETTINGS.sleep_consolidation || {};
const MAX_MEMORIES = numberSetting(SLEEP_SETTINGS.hard_max_memories, numberSetting(MEMORY_SETTINGS.max_memories, 24));
const MAX_NOTES = numberSetting(MEMORY_SETTINGS.max_notes, 12);
const DEFAULT_RECALL_TOP_K = numberSetting(ACTIVE_RECALL_SETTINGS.top_k, 5);
const DEFAULT_MIN_RELEVANCE = numberSetting(ACTIVE_RECALL_SETTINGS.min_relevance, 0.35);
const PROACTIVE_RECALL_ENABLED = PROACTIVE_RECALL_SETTINGS.enabled !== false;
const PROACTIVE_RECALL_MIN_INTIMACY = numberSetting(PROACTIVE_RECALL_SETTINGS.min_intimacy, 6);
const CONSOLIDATION_TRIGGER = numberSetting(SLEEP_SETTINGS.trigger_pending_count, 8);

export const DEFAULT_STORE = {
  version: "2.0",
  scope: "default",
  intimacy: 0,
  last_chat: "",
  interaction_state: "not_present",
  soul_state: "calm",
  soul_energy: {
    recall_depth: 35,
    impression_depth: 35,
    expression_desire: 45,
    creativity: 55
  },
  profile: {
    preferred_name: "",
    boundaries: [],
    style_preferences: []
  },
  memories: [],
  notes: [],
  reflection_queue: [],
  sleep: {
    last_consolidated: "",
    pending_count: 0
  }
};

const TYPE_BY_HINT = [
  ["boundary", ["不要", "不想", "避免", "边界", "讨厌"]],
  ["preference", ["喜欢", "偏好", "爱好", "想要", "希望"]],
  ["emotion", ["难过", "开心", "焦虑", "害怕", "低落", "信任"]],
  ["event", ["今天", "昨天", "上次", "曾", "分享", "发生"]]
];

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function stableClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function clamp(n, min, max) {
  const value = Number.isFinite(Number(n)) ? Number(n) : min;
  return Math.max(min, Math.min(max, value));
}

export function normalizeSoulState(value) {
  if (SOUL_STATES.has(value)) return value;
  if (Number.isInteger(value)) return ["low", "calm", "active", "excited"][clamp(value, 0, 3)];
  return "calm";
}

function defaultPath() {
  if (process.env.FURINA_MEMORY_PATH) return process.env.FURINA_MEMORY_PATH;
  return path.join(os.homedir(), ".claude", "furina-memory.json");
}

function numberSetting(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadSettings() {
  const settingsPath = path.join(ROOT, "config", "settings.json");
  try {
    return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch {
    return {};
  }
}

export function normalizeStore(input = {}) {
  const store = { ...stableClone(DEFAULT_STORE), ...input };
  store.version = "2.0";
  store.scope = String(store.scope || "default");
  store.intimacy = clamp(store.intimacy, 0, 10);
  store.last_chat = typeof store.last_chat === "string" ? store.last_chat : "";
  store.interaction_state = INTERACTION_STATES.has(store.interaction_state) ? store.interaction_state : "not_present";
  store.soul_state = normalizeSoulState(store.soul_state);
  store.soul_energy = { ...DEFAULT_STORE.soul_energy, ...(store.soul_energy || {}) };
  for (const key of Object.keys(DEFAULT_STORE.soul_energy)) {
    store.soul_energy[key] = clamp(store.soul_energy[key], 0, 100);
  }
  store.profile = { ...DEFAULT_STORE.profile, ...(store.profile || {}) };
  store.profile.boundaries = uniqueStrings(store.profile.boundaries || []);
  store.profile.style_preferences = uniqueStrings(store.profile.style_preferences || []);
  store.memories = Array.isArray(store.memories) ? normalizeMemories(store.memories) : [];
  store.notes = Array.isArray(store.notes) ? store.notes.map(normalizeNote).filter(Boolean) : [];
  store.reflection_queue = uniqueStrings(store.reflection_queue || []);
  store.sleep = { ...DEFAULT_STORE.sleep, ...(store.sleep || {}) };
  store.sleep.pending_count = clamp(store.sleep.pending_count, 0, 9999);
  store.sleep.last_consolidated = typeof store.sleep.last_consolidated === "string" ? store.sleep.last_consolidated : "";
  return store;
}

export function normalizeMemories(memories) {
  const used = new Set();
  let maxId = memories.reduce((max, memory) => Math.max(max, memoryIdNumber(memory?.id)), 0);
  const normalized = [];

  for (const raw of memories) {
    const memory = normalizeMemory(raw);
    if (!memory) continue;
    if (!memory.id || used.has(memory.id)) {
      do {
        maxId += 1;
        memory.id = formatMemoryId(maxId);
      } while (used.has(memory.id));
    }
    used.add(memory.id);
    normalized.push(memory);
  }
  return normalized;
}

export function normalizeMemory(memory) {
  if (!memory || typeof memory !== "object") return null;
  const content = cleanContent(memory.content || "");
  if (!content) return null;
  const type = ["user", "event", "emotion", "boundary", "preference"].includes(memory.type) ? memory.type : inferType(content);
  const id = /^M\d{3,}$/.test(memory.id || "") ? memory.id : "";
  return {
    id,
    type,
    content,
    priority: clamp(memory.priority ?? inferPriority(type, content), 1, 3),
    strength: clamp(memory.strength ?? defaultStrength(type), 1, 100),
    confidence: clamp(memory.confidence ?? 0.85, 0, 1),
    tags: uniqueStrings(memory.tags || inferTags(type, content)).slice(0, 5),
    created_at: typeof memory.created_at === "string" ? memory.created_at : today(),
    last_accessed: typeof memory.last_accessed === "string" ? memory.last_accessed : ""
  };
}

export function memoryIdNumber(id) {
  const match = /^M(\d+)$/.exec(String(id || ""));
  return match ? Number(match[1]) : 0;
}

export function formatMemoryId(value) {
  return `M${String(value).padStart(3, "0")}`;
}

export function normalizeNote(note, index = 0) {
  if (typeof note === "string") {
    const content = cleanContent(note);
    return content ? { id: `N${String(index + 1).padStart(3, "0")}`, content, tags: [] } : null;
  }
  if (!note || typeof note !== "object") return null;
  const content = cleanContent(note.content || note.text || "");
  if (!content) return null;
  return {
    id: /^N\d{3,}$/.test(note.id || "") ? note.id : `N${String(index + 1).padStart(3, "0")}`,
    content,
    tags: uniqueStrings(note.tags || []).slice(0, 8),
    updated_at: typeof note.updated_at === "string" ? note.updated_at : today()
  };
}

export function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of values || []) {
    const text = cleanContent(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

export function cleanContent(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function inferType(content) {
  for (const [type, hints] of TYPE_BY_HINT) {
    if (hints.some((hint) => content.includes(hint))) return type;
  }
  return "user";
}

export function inferPriority(type, content) {
  if (type === "boundary") return 3;
  if (/昵称|名字|称呼|不要忘|记住|信任|重要/.test(content)) return 3;
  if (type === "preference" || type === "emotion") return 2;
  return 1;
}

export function defaultStrength(type) {
  return type === "boundary" ? 85 : type === "preference" || type === "emotion" ? 65 : 45;
}

export function inferTags(type, content) {
  const tags = [type];
  const topicHits = content.match(/甜点|蛋糕|歌剧|枫丹|游戏|代码|编程/g);
  if (topicHits) tags.push(...new Set(topicHits));
  if (/称呼|昵称|名字/.test(content)) tags.push("称呼");
  if (/不要|避免|边界/.test(content)) tags.push("边界");
  if (/难过|低落|焦虑|开心|害怕/.test(content)) tags.push("情绪");
  return tags;
}

function loadStore(filePath) {
  if (!fs.existsSync(filePath)) return normalizeStore();
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    throw new Error(`记忆文件不是合法 JSON: ${filePath}\n${error.message}`);
  }
}

function saveStore(filePath, store) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(normalizeStore(store), null, 2)}\n`, "utf8");
}

function nextMemoryId(store) {
  const max = store.memories.reduce((n, item) => Math.max(n, memoryIdNumber(item.id)), 0);
  return formatMemoryId(max + 1);
}

export function tokenSet(text) {
  const normalized = cleanContent(text).toLowerCase();
  const words = normalized.match(/[a-z0-9_]+|[\u4e00-\u9fff]/g) || [];
  const tokens = new Set(words);
  for (let i = 0; i < normalized.length - 1; i += 1) {
    const pair = normalized.slice(i, i + 2);
    if (/[\u4e00-\u9fff]{2}/.test(pair)) tokens.add(pair);
  }
  return tokens;
}

export function overlapScore(query, memory) {
  const q = tokenSet(query);
  const m = tokenSet(`${memory.content} ${(memory.tags || []).join(" ")}`);
  if (!q.size || !m.size) return 0;
  let hit = 0;
  for (const token of q) {
    if (m.has(token)) hit += 1;
  }
  return hit / Math.max(4, Math.min(q.size, m.size));
}

export function isCasualGreeting(query) {
  const text = cleanContent(query).toLowerCase();
  return /^(你好|嗨|hi|hello|早|晚上好|在吗|芙宁娜[！!。.]?)$/.test(text);
}

export function recall(store, query, options = {}) {
  const topK = Number(options.topK || options["top-k"] || DEFAULT_RECALL_TOP_K);
  const minRelevance = Number(options.minRelevance || options["min-relevance"] || DEFAULT_MIN_RELEVANCE);
  if (options.avoidCasualGreeting !== false && isCasualGreeting(query)) return [];
  const scored = store.memories.map((memory) => {
    const relevance = overlapScore(query, memory);
    const importance = memory.priority * 0.12 + memory.strength / 500 + memory.confidence * 0.08;
    const score = relevance + importance;
    return { ...memory, relevance: Number(relevance.toFixed(3)), score: Number(score.toFixed(3)) };
  });
  return scored
    .filter((item) => item.relevance >= minRelevance || /记得|上次|以前|喜欢|偏好|称呼/.test(query))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function priorityLabel(priority) {
  return priority >= 3 ? "高" : priority === 2 ? "中" : "低";
}

export function buildInjection(store, recalls = []) {
  const lines = [
    "[认知存档]",
    "版本: 2.0",
    `亲密度: ${store.intimacy}/10`,
    `上次对话: ${store.last_chat || "未知"}`,
    `交互状态: ${store.interaction_state}`,
    `灵魂状态: ${store.soul_state}`,
    "灵魂能量:",
    `- recall_depth: ${store.soul_energy.recall_depth}`,
    `- impression_depth: ${store.soul_energy.impression_depth}`,
    `- expression_desire: ${store.soul_energy.expression_desire}`,
    `- creativity: ${store.soul_energy.creativity}`
  ];
  if (recalls.length) {
    lines.push("主动回忆:");
    for (const memory of recalls) {
      const tags = (memory.tags || []).map((tag) => `#${tag}`).join(" ");
      lines.push(`- ${memory.id}[${priorityLabel(memory.priority)}|${memory.strength}|${memory.confidence.toFixed(2)}]: ${memory.content}${tags ? ` ${tags}` : ""}`);
    }
  }
  const boundaries = uniqueStrings([...(store.profile.boundaries || []), ...(store.profile.style_preferences || [])]);
  if (boundaries.length) {
    lines.push("边界与偏好:");
    for (const item of boundaries.slice(0, 6)) lines.push(`- ${item}`);
  }
  lines.push("[/认知存档]");
  return lines.join("\n");
}

function applyEnergyDelta(store, delta = {}) {
  for (const key of Object.keys(DEFAULT_STORE.soul_energy)) {
    store.soul_energy[key] = clamp((store.soul_energy[key] || 0) + (Number(delta[key]) || 0), 0, 100);
  }
}

function applyReflection(store, reflection) {
  const now = today();
  store.intimacy = clamp(store.intimacy + (Number(reflection.intimacy_delta) || 0), 0, 10);
  store.soul_state = normalizeSoulState(reflection.soul_state ?? store.soul_state);
  if (INTERACTION_STATES.has(reflection.interaction_state)) store.interaction_state = reflection.interaction_state;
  applyEnergyDelta(store, reflection.soul_energy_delta || {});
  store.last_chat = now;

  const obsolete = new Set(reflection.obsolete_ids || []);
  store.memories = store.memories.filter((item) => !obsolete.has(item.id));

  for (const raw of reflection.new_memories || []) {
    const memory = normalizeMemory({ ...raw, id: raw.id || nextMemoryId(store), created_at: now });
    if (!memory) continue;
    upsertMemory(store, memory);
  }
  for (const note of reflection.new_notes || []) {
    const normalized = normalizeNote(note, store.notes.length);
    if (normalized) store.notes.push(normalized);
  }
  store.reflection_queue = uniqueStrings([...(store.reflection_queue || []), ...(reflection.research_queue || [])]);
  store.sleep.pending_count = clamp((store.sleep.pending_count || 0) + (reflection.new_memories || []).length + obsolete.size, 0, 9999);
  updateProfileFromMemories(store);
  if (reflection.compression_needed || store.sleep.pending_count >= CONSOLIDATION_TRIGGER || store.memories.length > MAX_MEMORIES) {
    compressStore(store);
  }
  return store;
}

export function upsertMemory(store, memory) {
  const existing = store.memories.find((item) => item.id === memory.id || similarContent(item.content, memory.content));
  if (!existing) {
    store.memories.push(memory);
    return;
  }
  existing.content = memory.content.length >= existing.content.length ? memory.content : existing.content;
  existing.type = existing.type === "user" ? memory.type : existing.type;
  existing.priority = Math.max(existing.priority, memory.priority);
  existing.strength = clamp(Math.max(existing.strength, memory.strength) + 5, 1, 100);
  existing.confidence = Math.max(existing.confidence, memory.confidence);
  existing.tags = uniqueStrings([...(existing.tags || []), ...(memory.tags || [])]).slice(0, 5);
  existing.last_accessed = today();
}

export function similarContent(a, b) {
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return Math.min(a.length, b.length) >= 10;
  return overlapScore(a, { content: b, tags: [] }) > 0.68;
}

export function updateProfileFromMemories(store) {
  for (const memory of store.memories) {
    if (memory.type === "boundary") store.profile.boundaries = uniqueStrings([...(store.profile.boundaries || []), memory.content]);
    if (memory.type === "preference") store.profile.style_preferences = uniqueStrings([...(store.profile.style_preferences || []), memory.content]);
    const nameMatch = /(?:叫|昵称是|称呼为|称呼)([^，。,. ]{1,12})/.exec(memory.content);
    if (nameMatch) store.profile.preferred_name = nameMatch[1];
  }
}

export function compressStore(store) {
  const merged = [];
  for (const memory of store.memories.sort((a, b) => a.id.localeCompare(b.id))) {
    const target = merged.find((item) => similarContent(item.content, memory.content) || sharedTag(item, memory));
    if (!target || target.priority === 3 || memory.priority === 3) {
      merged.push({ ...memory });
      continue;
    }
    target.priority = Math.min(3, Math.max(target.priority, memory.priority) + 1);
    target.strength = clamp(Math.max(target.strength, memory.strength) + 8, 1, 100);
    target.confidence = Math.max(target.confidence, memory.confidence);
    target.tags = uniqueStrings([...(target.tags || []), ...(memory.tags || [])]).slice(0, 5);
    if (memory.content.length > target.content.length && memory.content.length <= 25) target.content = memory.content;
  }
  const survivors = merged
    .filter((item) => !(item.priority === 1 && item.strength < 35 && item.last_accessed))
    .sort((a, b) => (b.priority - a.priority) || (b.strength - a.strength) || b.confidence - a.confidence);
  store.memories = survivors.slice(0, MAX_MEMORIES).sort((a, b) => a.id.localeCompare(b.id));
  store.notes = store.notes.slice(-MAX_NOTES);
  store.sleep.pending_count = 0;
  store.sleep.last_consolidated = today();
  updateProfileFromMemories(store);
  return store;
}

function sharedTag(a, b) {
  const aTags = new Set(a.tags || []);
  return (b.tags || []).some((tag) => aTags.has(tag) && !["user", "event", "emotion", "preference", "boundary"].includes(tag));
}

export function parseMemoryTags(text) {
  const matches = [...String(text || "").matchAll(/\[📌\s*记忆:\s*([^\]]+)\]/g)];
  return matches.map((match) => ({
    type: inferType(match[1]),
    content: cleanContent(match[1]),
    priority: inferPriority(inferType(match[1]), match[1]),
    strength: 60,
    confidence: 0.8,
    tags: inferTags(inferType(match[1]), match[1])
  }));
}

export function heart(text, store) {
  const message = cleanContent(text);
  const direct = /芙宁娜|furina|芙芙|大明星|你/.test(message);
  const question = /[?？]|吗|怎么|为什么|能不能|可不可以/.test(message);
  const farewell = /再见|拜拜|晚安|下次见|我走了|回头见|bye/i.test(message);
  const save = /记住|保存|别忘|不要忘|记下来|存档|remember|save/i.test(message);
  const recallHint = /上次|以前|记得|还记得|我喜欢|我的/.test(message);
  const heavyOrBoundary = /难过|低落|崩溃|危险|不要|别|白淞镇|预言|五百年|仆人/.test(message);
  const proactiveRecall = PROACTIVE_RECALL_ENABLED
    && store.intimacy >= PROACTIVE_RECALL_MIN_INTIMACY
    && !recallHint
    && !save
    && !farewell
    && !heavyOrBoundary
    && !isCasualGreeting(message)
    && (direct || question);
  return {
    should_reply: direct || question,
    should_save: save || farewell,
    should_recall: (recallHint && !isCasualGreeting(message)) || proactiveRecall,
    recall_mode: recallHint && !isCasualGreeting(message) ? "explicit" : proactiveRecall ? "proactive" : "none",
    next_interaction_state: direct || question ? "summoned" : "observation",
    reason: save ? "user_requested_save" : farewell ? "farewell" : recallHint ? "recall_hint" : "normal",
    current_intimacy: store.intimacy,
    soul_state: store.soul_state
  };
}

function readStdin() {
  return fs.readFileSync(0, "utf8");
}

function output(value, format = "json") {
  if (format === "text") {
    process.stdout.write(String(value));
    if (!String(value).endsWith("\n")) process.stdout.write("\n");
    return;
  }
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function usage() {
  console.log(`Furina memory runtime

Usage:
  node scripts/furina-memory.mjs init [--path FILE]
  node scripts/furina-memory.mjs status [--path FILE]
  node scripts/furina-memory.mjs heart --text TEXT [--path FILE]
  node scripts/furina-memory.mjs recall --query TEXT [--top-k 5] [--format json|inject] [--path FILE]
  node scripts/furina-memory.mjs inject --query TEXT [--path FILE]
  node scripts/furina-memory.mjs remember --text TEXT [--path FILE]
  node scripts/furina-memory.mjs remember --reflection FILE_OR_- [--path FILE]
  node scripts/furina-memory.mjs compress [--path FILE]

Default path: %FURINA_MEMORY_PATH% or ~/.claude/furina-memory.json
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "help";
  const filePath = args.path ? resolveUserPath(args.path) : defaultPath();

  if (command === "help" || args.help) {
    usage();
    return;
  }

  if (command === "init") {
    const store = loadStore(filePath);
    saveStore(filePath, store);
    output({ ok: true, path: filePath, memory_count: store.memories.length });
    return;
  }

  const store = loadStore(filePath);

  if (command === "status") {
    output({
      path: filePath,
      version: store.version,
      intimacy: store.intimacy,
      soul_state: store.soul_state,
      interaction_state: store.interaction_state,
      memory_count: store.memories.length,
      note_count: store.notes.length,
      pending_count: store.sleep.pending_count
    });
    return;
  }

  if (command === "heart") {
    output(heart(args.text || args.query || "", store));
    return;
  }

  if (command === "recall" || command === "inject") {
    const query = args.query || args.text || "";
    const recalls = recall(store, query, args);
    for (const item of recalls) {
      const target = store.memories.find((memory) => memory.id === item.id);
      if (target) target.last_accessed = today();
    }
    saveStore(filePath, store);
    if (command === "inject" || args.format === "inject") {
      output(buildInjection(store, recalls), "text");
    } else {
      output({ recalls });
    }
    return;
  }

  if (command === "remember") {
    let reflection = null;
    if (args.reflection) {
      const raw = args.reflection === "-" ? readStdin() : fs.readFileSync(args.reflection, "utf8");
      reflection = JSON.parse(raw);
    } else {
      const text = args.text || readStdin();
      reflection = {
        intimacy_delta: 0,
        interaction_state: "observation",
        new_memories: parseMemoryTags(text)
      };
      if (!reflection.new_memories.length && cleanContent(text)) {
        reflection.new_memories = [{
          type: inferType(text),
          content: cleanContent(text).slice(0, 25),
          priority: inferPriority(inferType(text), text),
          strength: 60,
          confidence: 0.75,
          tags: inferTags(inferType(text), text)
        }];
      }
    }
    applyReflection(store, reflection);
    saveStore(filePath, store);
    output({ ok: true, path: filePath, memory_count: store.memories.length, pending_count: store.sleep.pending_count });
    return;
  }

  if (command === "compress") {
    const before = store.memories.length;
    compressStore(store);
    saveStore(filePath, store);
    output({ ok: true, path: filePath, before, after: store.memories.length, last_consolidated: store.sleep.last_consolidated });
    return;
  }

  usage();
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
