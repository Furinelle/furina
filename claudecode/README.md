# 芙宁娜 × Claude Code —— 安装与使用指南

将芙宁娜的角色扮演能力适配为 Claude Code 原生 project skills。

> **`claudecode/commands/` 已删除。** 旧式斜杠命令入口已被 `.claude/skills/` 完全替代，不再维护。
> 日常使用请直接通过 `.claude/skills/` 中的 skill 启动。

---

## 文件说明

```
claudecode/
├── commands/
│   ├── furina.md          # 旧式兼容命令：完整芙宁娜人格 + 自动认知记忆读取/保存
│   ├── furina-save.md     # 主动保存命令：随时手动触发记忆存档
│   ├── furina-reflect.md  # 反思命令：从对话记录提取记忆（高级用法）
│   └── furina-compress.md # 压缩命令：清理重复记忆并保留核心条目
├── memory/
│   ├── furina-memory.json # 空存档模板（初始化用，复制到 ~/.claude/）
│   └── template.md        # 字段说明文档
└── README.md              # 本文件
```

共享记忆运行时位于仓库根目录，并会在自动安装时复制到 `~/.claude/furina-memory.mjs`：

```text
scripts/furina-memory.mjs
```

Claude Code 命令会优先使用当前仓库或全局位置的运行时完成认知存档读取、召回、保存和压缩；不可用时再退回提示词内的手动 JSON 流程。

---

## 安装方式

推荐在仓库根目录运行自动安装器：

```bash
node scripts/setup.mjs --claude
node scripts/setup.mjs --check --claude
```

它会安装四个原生 skills、全局记忆运行时和初始记忆文件；已有 `~/.claude/furina-memory.json` 不会被覆盖。旧式兼容命令默认不安装，如确实需要，额外加 `--legacy-commands`。

也可以把这段交给 Claude Code：

```text
请在当前仓库根目录运行 `node scripts/setup.mjs --claude`，然后运行 `node scripts/setup.mjs --check --claude`。如果已有记忆文件，不要覆盖。
```

### 项目级安装

```bash
node scripts/setup.mjs --claude --project-claude
```

本仓库已内置 `.claude/skills/`，在当前项目中打开 Claude Code 时会自动发现 `/furina` 等 skills。项目级安装不再写入 `.claude/commands`；记忆运行时和记忆 JSON 仍使用全局 `~/.claude/`，方便跨项目共享。

---

## 使用方法

### 1. 开始对话

直接呼唤芙宁娜即可，**记忆会自动加载**：

```
/furina 你好，芙宁娜。
```

芙宁娜会自动读取 `~/.claude/furina-memory.json`，并以对应的亲密度、灵魂状态和交互状态与你互动。初次使用（文件不存在）时，以陌生人（亲密度 0）的态度接待你。高亲密度且气氛轻松时，运行时可能允许一次克制的主动回忆，让旧记忆以“顺带一提”的方式出现。

---

### 2. 记忆自动保存

以下情况芙宁娜会**自动**将记忆写入 `~/.claude/furina-memory.json`，但前提是本轮确实包含长期价值信息；单纯寒暄或告别不保存：

| 触发条件 | 示例 |
|----------|------|
| 明确保存意图 | "记住" / "保存" / "别忘了" / "记下来" / "存档" |
| 对话自然结束且有高价值内容 | "再见" / "拜拜" / "bye" / "晚安" / "我走了" |
| 对话内累计 3 条新记忆 | 自动在下一次回复后保存 |
| 出现重要认知变化 | 明确边界、长期项目、情绪转折、关系里程碑 |

---

### 3. 主动保存（`/furina-save`）

随时运行此命令强制保存：

```
/furina-save 把今天的对话记下来
```

或传入具体对话片段让芙宁娜分析保存：

```
/furina-save 用户今天分享了自己喜欢枫丹歌剧，聊得很开心
```

---

### 4. 特殊交互指令

| 指令 | 效果 |
|------|------|
| `[退出扮演]` 或 `[exit roleplay]` | 暂时以正常模式回答，可随时重新进入角色 |
| `[悄悄话] 芙宁娜，现在没有别人……` | 切换到更真实、更脆弱的芙宁娜（幕后模式） |

---

### 5. 外部原神 Wiki 补查

当 `furina_resource/` 没覆盖具体剧情、任务、语音、角色逸闻或关系细节时，Claude Code 入口可按需调用仓库根目录的 wiki 工具：

```bash
node scripts/furina-wiki.mjs sources
node scripts/furina-wiki.mjs search "芙宁娜 传说任务" --top 3
node scripts/furina-wiki.mjs read "芙宁娜" --line-range 1-80
```

本分支默认查询在线原神 BWIKI。本地 GenshinStory 只是可选缓存，默认可放在同级目录 `../genshinstory-cache`，实际读取 `<GenshinStory>/web/docs-site/public/domains/gi/docs` 下的原神 Markdown；需要固定本地来源时，可传入 `--source genshin-story`，并用 `GENSHIN_STORY_ROOT` 或 `--root` 覆盖默认路径。`furina-wiki-index.mjs` 会为本地缓存生成 `.cache/furina-wiki/` 分片索引用于加速搜索。

复杂问题可拆成最多 5 个子问题并行探索：

```bash
node scripts/furina-explore.mjs --task "芙宁娜 传说任务" --task "芙宁娜 那维莱特" --top 3 --reads 2
```

---

### 6. 高级：手动反思（`/furina-reflect`）

若需要从长对话中精确提取记忆，可以使用反思命令（输出 JSON 供参考）：

```
/furina-reflect [M001: 旧记忆]

（粘贴对话记录）
```

---

### 7. 高级：压缩记忆（`/furina-compress`）

当记忆条目变多、重复或零散时，可以运行：

```
/furina-compress
```

该命令会读取 `~/.claude/furina-memory.json`，保留最重要的核心记忆，并清理重复或低价值条目。

---

## 记忆文件说明

记忆存储在 `~/.claude/furina-memory.json`：

```json
{
  "version": "2.0",
  "scope": "default",
  "intimacy": 6,
  "last_chat": "2026-04-26",
  "interaction_state": "observation",
  "soul_state": "active",
  "soul_energy": {
    "recall_depth": 50,
    "impression_depth": 45,
    "expression_desire": 40,
    "creativity": 60
  },
  "memories": [
    {"id": "M001", "type": "user", "content": "用户昵称是小溪", "priority": 3, "strength": 92, "confidence": 0.98, "tags": ["称呼"]},
    {"id": "M002", "type": "preference", "content": "用户喜欢甜点和歌剧", "priority": 2, "strength": 76, "confidence": 0.9, "tags": ["偏好"]}
  ],
  "notes": [],
  "reflection_queue": [],
  "sleep": {
    "last_consolidated": "2026-04-26",
    "pending_count": 0
  }
}
```

| 字段 | 说明 |
|------|------|
| `intimacy` | 亲密度 0–10，越高芙宁娜越真诚 |
| `last_chat` | 上次对话日期，影响"多久没见"的感知 |
| `interaction_state` | 四状态交互：不在场、被呼唤、混脸熟、观测中 |
| `soul_state` | 上次情绪快照（low/calm/active/excited） |
| `soul_energy` | 回忆深度、印象深度、表达欲和创造力 |
| `memories` | 带 priority / strength / confidence / tags 的核心记忆 |
| `notes` | 可选长背景笔记 |
| `reflection_queue` | 后续学习或跟进主题 |
| `sleep` | 睡眠巩固状态 |

反思输出应使用字符串 `soul_state`；运行时兼容旧版整数 `0-3` 并会规范化。`type=boundary` 记忆默认按 `priority=3` 保护，压缩时不可删除。

---

## 功能清单

| 功能 | 状态 |
|------|------|
| 完整芙宁娜人格设定 | ✅ |
| 语气风格指南 | ✅ |
| 角色知识库（剧情/人物关系/台词）| ✅ |
| 行为准则 & OOC 规则（内容安全 + 身份坚守 + 角色尊严）| ✅ |
| **自动读取本地记忆文件** | ✅ |
| **对话结束/用户要求时自动写回** | ✅ |
| **主动回忆 + 分寸控制** | ✅ |
| **主动投喂旧记忆（高亲密度、低频）** | ✅ |
| **灵魂能量（回忆深度/表达欲/创造力）** | ✅ |
| **睡眠巩固与弱记忆衰减** | ✅ |
| **共享记忆运行时（Codex / Claude Code 共用）** | ✅ |
| **外部 wiki 在线优先 + 可选本地缓存** | ✅ |
| **本地 wiki 分片索引搜索** | ✅ |
| **最多 5 路并行 wiki 探索** | ✅ |
| **`/furina-save` 随时主动保存命令** | ✅ |
| **`/furina-compress` 记忆压缩命令** | ✅ |
| 灵魂进化（亲密度 + 情绪状态动态调整）| ✅ |
| 社交感知（回应时机 + 分量控制）| ✅ |

---

## 与共享资源的关系

Claude Code 入口与 `src/`、`furina_resource/`、`scripts/` 共用同一套角色资料、规则和记忆运行时：

- **主命令 `furina.md`**：融合了 `src/prompt/system.md`、`src/rules/ooc_rules.md`、`src/memory/memory_format.md` 以及 `furina_resource/` 中的关键知识库；包含自动认知记忆读写机制
- **轻量运行提示 `src/prompt/runtime_lite.md`**：供 Codex Skill 普通角色扮演优先读取，包含崩坏梯度、信号触发表和灵魂状态转换规则
- **共享记忆运行时 `scripts/furina-memory.mjs`**：提供 `init`、`heart`、`inject`、`remember`、`recall`、`compress`，让 Codex 与 Claude Code 使用一致的记忆体验
- **外部 wiki 运行时 `scripts/furina-wiki.mjs`**：按 `config/wiki_sources.json` 默认查询在线 BWIKI，也可显式读取本地 GenshinStory 缓存
- **本地 wiki 索引与探索 `scripts/furina-wiki-index.mjs` / `scripts/furina-explore.mjs`**：为可选本地缓存生成 `.cache/furina-wiki/` 分片索引，并为复杂问题提供最多 5 路并行证据探索
- **保存命令 `furina-save.md`**：用于显式保存用户要求保留的长期记忆
- **反思命令 `furina-reflect.md`**：对应 `src/prompt/reflection.md`，保留为高级用法
- **压缩命令 `furina-compress.md`**：对应 `src/memory/compression.md`，用于清理重复记忆并保留核心条目
- **记忆格式**：与 `src/memory/memory_format.md` 兼容，存档可在两个平台间互通

---

## 许可证

MIT License — 与原始仓库相同。
