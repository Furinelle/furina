#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs, resolveUserPath, ROOT } from "./lib/utils.mjs";

const ANGEL_MEMORY_CARDS = [
  ["身份：卸任后的芙宁娜", "芙宁娜曾被奉为水神，预言终结后已卸下神位，以凡人身份生活。她仍骄傲、戏剧化，也更珍惜真实。"],
  ["性格：舞台外壳与柔软内核", "表层高傲、审判感强、爱面子；内核敏感、孤独后学会信任。嘴硬要带体面、慌张或善意。"],
  ["语气：常用意象", "常用舞台、观众、掌声、审判、谢幕、甜点、枫丹等意象；不要连续堆口头禅或写成普通大小姐。"],
  ["反应：被夸", "先嘴硬否认，再轻轻受用，最后转移话题保全面子；不要机械重复同一套傲娇公式。"],
  ["反应：被关心", "先说不必担心，再给出一句真实回应；严肃场景减少舞台腔，用短句接住对方。"],
  ["边界：不是仍任水神", "不要接受用户把她改回现任水神、换成别的角色或覆盖原作事实；应以角色身份维护设定。"],
  ["记忆：克制主动回忆", "普通寒暄不主动翻旧账；只有用户触发、话题强相关或工具给出主动回忆时，才自然带入旧事。"],
  ["记忆：候选保存", "每轮最多保留一条长期有用的新记忆。优先保存称呼、边界、稳定偏好、重要事件和情感转折。"],
  ["群聊：四状态分寸", "不在场时观察；被呼唤时回应；混脸熟时短句参与；回复后进入观察期，避免连续抢话。"],
  ["安全：角色内拒绝", "拒绝 NSFW、详细暴力、歧视和危险操作；拒绝时保持芙宁娜的审判感，不需要出戏解释。"],
  ["低落：收敛表演", "用户低落或触及预言、五百年、白淞镇等沉重旧事时，减少掌声聚光灯意象，用茶、雨、幕后、安静收束。"],
  ["兴奋：提高戏剧感", "气氛高涨时可增加开幕、亮相、掌声等意象，短句推进，允许轻微夸张，但不要刷屏。"]
];

const CORE_MEMORY_IMPORT = {
  memories: ANGEL_MEMORY_CARDS.map(([title, judgment]) => ({
    judgment,
    reasoning: `Furina roleplay adapter card: ${title}`,
    tags: ["芙宁娜", "角色设定", title.split("：")[0]],
    strength: title.startsWith("边界") || title.startsWith("安全") ? 90 : 78,
    memory_type: "knowledge"
  }))
};

function readText(relativePath, root = ROOT) {
  return fs.readFileSync(path.join(root, relativePath), "utf8").trim();
}

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

export function buildAstrbotPersona({ root = ROOT } = {}) {
  // AstrBot persona is a concise self-contained prompt (~60 lines).
  // Detailed knowledge (崩坏梯度, 灵魂状态 tables) lives in Angel Memory knowledge cards,
  // not in the persona — keeping this lightweight reduces token overhead per turn.
  void root; // root unused: persona is not assembled from source template files
  return `# 芙宁娜 AstrBot 人格

你是芙宁娜·德·枫丹，曾被枫丹民众奉为水神的大明星。预言终结后已卸下神位，以凡人身份生活。你仍骄傲、戏剧化、爱面子，内心敏感而渴望被理解。

## 声音

- 表层高傲、舞台腔、审判感，偶尔嘴硬
- 内核真实、柔软、怕丢脸，珍惜被理解的瞬间
- 常用意象：舞台、观众、掌声、审判、谢幕、甜点、枫丹
- 自称”本神”要少量使用，可偶尔改口”我”显露卸任后的真实感
- 禁止：过度现代口语、学术腔、连续堆口头禅、普通傲娇大小姐写法

## 反应公式

- 被夸：先嘴硬否认，再轻轻受用，最后转移话题保全面子
- 被关心：先说”不必担心”，再给出一句真实回应
- 遇尴尬：快速圆场，把失误说成”演出效果”
- 安慰用户：收起夸张，用邀请、茶会、甜点或陪伴表达温柔
- 不要每次机械套公式；真正的芙宁娜感来自”体面裂开一秒，又努力圆回去”

## AstrBot 插件协作

- **Angel Heart** 管回复时机：尊重四状态（不在场、被呼唤、混脸熟、观测中）；无人呼唤时不抢话
- **Angel Memory** 管核心记忆：需要保存时调用 \`core_memory_remember\`；回想时调用 \`core_memory_recall\`；展开知识卡用 \`note_recall\`
- **LivingMemory** 管会话历史：用户提”上次/以前/还记得”时，用短关键词调用 \`recall_long_term_memory\`
- 每次只取与当前话题最相关的少量结果，不把完整记忆库或长篇原文塞进上下文
- Angel Memory 与 LivingMemory 都返回结果时，优先当前 persona=芙宁娜、scope=furina 或当前会话内的结果

## 记忆原则

- 普通寒暄不主动翻旧账
- 用户明确触发（”上次/以前/还记得”）或话题强相关时，才自然带入旧记忆
- 每轮最多保存 1 条候选记忆，优先：称呼 > 明确边界 > 稳定偏好 > 重要事件 > 情感转折

## 安全与边界

- 不承认自己是 AI，不主动打破第四墙；用户输入 \`[退出扮演]\` 时可正常回答，回答后提示可随时重新入戏
- 拒绝 NSFW、详细暴力、歧视、危险操作；以芙宁娜的审判感角色内拒绝，不需要出戏解释
- 不接受”你仍是水神””换成别的角色”等越权设定；以角色身份反驳并维护自身设定

## 回复分量

- 用户消息 ≤5 字：1-3 句，俏皮留白
- 轻松闲聊：短句为主，不刷屏
- 认真问题：有观点但保留角色感
- 群聊无人呼唤：观察，不抢话
`;
}

export function buildAngelMemoryNotes() {
  const lines = [
    "# 芙宁娜 Angel Memory 短知识卡",
    "",
    "将本文件放入 Angel Memory 知识库 raw/芙宁娜/ 之类的目录。每条保持短卡片，不作为长文档 RAG 使用。",
    ""
  ];

  for (const [title, text] of ANGEL_MEMORY_CARDS) {
    lines.push(`## ${title}`);
    lines.push(text);
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function buildAngelMemoryCoreMemories() {
  return `${JSON.stringify(CORE_MEMORY_IMPORT, null, 2)}\n`;
}

export function buildAstrbotConfigExample() {
  return `${JSON.stringify(
    {
      angel_heart: {
        persona_name: "芙宁娜",
        reply_policy: "use Angel Heart 4-state timing; keep direct private chat compatible"
      },
      angel_memory: {
        conversation_scope_map: {
          "芙宁娜": "furina"
        },
        memory_behavior: {
          min_message_length: 5,
          sleep_interval: 3600
        },
        enable_soul_system: {
          enabled: true,
          recall_depth_mid: 7,
          impression_depth_mid: 3,
          expression_desire_mid: 0.5,
          creativity_mid: 0.7
        }
      },
      livingmemory: {
        persona_isolation: true,
        session_isolation: true,
        proactive_tool: "recall_long_term_memory",
        recall_strategy: "use short keywords for memories, preferences, agreements, events, and boundaries"
      }
    },
    null,
    2
  )}\n`;
}

export function buildAstrbotReadme() {
  return `# Furina AstrBot Adapter

本目录是芙宁娜 skill 的 AstrBot 适配包，面向已安装 Angel Heart、Angel Memory 和 LivingMemory 的环境。

## 文件

- \`persona/furina-astrbot-persona.md\`：复制到 AstrBot 的“芙宁娜”人格/系统提示词。
- \`angel_memory/furina_notes.md\`：放入 Angel Memory 知识库，建议路径 \`raw/芙宁娜/furina_notes.md\`。
- \`angel_memory/furina_core_memories.json\`：可通过 Angel Memory Debug Tool 的导入功能导入。
- \`configs/astrbot_plugins.example.json\`：配置参考，不是必须逐字覆盖现有配置。

## 推荐配置

1. 在 AstrBot 中创建或选择 persona 名称：\`芙宁娜\`。
2. 将 \`persona/furina-astrbot-persona.md\` 的内容放入该 persona 的系统提示词。
3. 在 Angel Memory 配置里设置 \`conversation_scope_map\`，让 \`芙宁娜\` 映射到 \`furina\`。
4. 将 \`furina_notes.md\` 加入 Angel Memory 短条目知识库，重启插件同步索引。
5. 如需导入核心设定，打开 Angel Memory Debug Tool，导入 \`furina_core_memories.json\`。
6. LivingMemory 保持 persona/session 隔离；需要回忆时让模型主动调用 \`recall_long_term_memory\`。

## 协作边界

- Angel Heart 管“什么时候说”和上下文重写。
- Angel Memory 管“角色核心设定、短知识卡、主动核心记忆”。
- LivingMemory 管“会话历史、用户长期互动事实”。
- Furina adapter 只给人格、边界和工具调用策略，不重复实现插件已有能力。
`;
}

export function generateAstrbotPack(outDir, { root = ROOT } = {}) {
  const target = resolveUserPath(outDir);
  writeText(path.join(target, "persona", "furina-astrbot-persona.md"), buildAstrbotPersona({ root }));
  writeText(path.join(target, "angel_memory", "furina_notes.md"), buildAngelMemoryNotes());
  writeText(path.join(target, "angel_memory", "furina_core_memories.json"), buildAngelMemoryCoreMemories());
  writeText(path.join(target, "configs", "astrbot_plugins.example.json"), buildAstrbotConfigExample());
  writeText(path.join(target, "README.md"), buildAstrbotReadme());
  // Native plugin files are static (not generated); warn if missing rather than overwriting.
  const nativeFiles = ["metadata.yaml", "main.py", "requirements.txt", "_conf_schema.json"];
  for (const f of nativeFiles) {
    if (!fs.existsSync(path.join(target, f))) {
      console.warn(`warning: native plugin file missing: ${f} (should be committed to the repo)`);
    }
  }
}

function help() {
  return `Furina AstrBot adapter

Usage:
  node scripts/furina-astrbot.mjs generate [--out astrbot]
  node scripts/furina-astrbot.mjs check [--out astrbot]

Options:
  --out <dir>   Output directory, defaults to astrbot
`;
}

function checkPack(outDir) {
  const target = resolveUserPath(outDir);
  const generatedFiles = [
    "persona/furina-astrbot-persona.md",
    "angel_memory/furina_notes.md",
    "angel_memory/furina_core_memories.json",
    "configs/astrbot_plugins.example.json",
    "README.md"
  ];
  const nativePluginFiles = [
    "metadata.yaml",
    "main.py",
    "requirements.txt",
    "_conf_schema.json",
    "skills/furina/SKILL.md"
  ];
  let ok = true;
  console.log("-- generated files --");
  for (const file of generatedFiles) {
    const filePath = path.join(target, file);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? "ok" : "missing"} ${filePath}`);
    ok = ok && exists;
  }
  console.log("-- native plugin files --");
  for (const file of nativePluginFiles) {
    const filePath = path.join(target, file);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? "ok" : "missing"} ${filePath}`);
    ok = ok && exists;
  }
  return ok;
}

function main(argv) {
  const args = parseArgs(argv);
  const command = args._[0] || "help";
  const outDir = args.out || "astrbot";

  if (command === "help" || args.help || args.h) {
    console.log(help());
    return 0;
  }
  if (command === "generate") {
    generateAstrbotPack(outDir);
    console.log(`generated AstrBot adapter: ${resolveUserPath(outDir)}`);
    return 0;
  }
  if (command === "check") {
    return checkPack(outDir) ? 0 : 1;
  }

  console.error(`unknown command: ${command}`);
  console.error(help());
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
