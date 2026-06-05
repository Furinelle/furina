# Furina Roleplay Project

本仓库提供 Claude Code 原生 project skills、旧式斜杠命令兼容模板、Codex Skill、共享记忆运行时和 `furina_resource/` 结构化资料库。

## 常用 Skill / 命令

| 命令 | 用途 |
|------|------|
| `/furina` | 开始或继续芙宁娜角色扮演 |
| `/furina-save` | 手动保存关键记忆 |
| `/furina-reflect` | 从对话记录提取结构化记忆 JSON |
| `/furina-compress` | 压缩和整理记忆条目 |

## 安装检查

```bash
node scripts/setup.mjs --claude
node scripts/setup.mjs --check --claude
```

本仓库已包含 `.claude/skills/`，在项目中打开 Claude Code 时可直接发现 `/furina` 等原生 skills。如需把原生 skills 安装到个人 Claude Code 目录：

```bash
node scripts/setup.mjs --claude
```

旧式 commands 已由原生 skills 取代，不再由安装器提供。

## 维护原则

- `furina_resource/` 是所有平台共用的唯一角色资料源。
- 语气维护的崩坏梯度（含正向例句）统一维护于 `src/prompt/_shared_runtime.md`；`furina_resource/05_voice_style.md` 仅保留分析性说明，不重复表格。破绽句式见 `furina_resource/07_quotes.md`，验收用例见 `eval/furina_voice_cases.md`。
- 自称切换（"本神 vs 我"）、压力 4 凡人失语子类的唯一维护入口是 `src/prompt/_shared_runtime.md`。
- 敏感话题分寸（表白亲密度分级、关系敏感话题写法）的唯一维护入口是 `furina_resource/11_sensitive_topics.md`。
- 外部原神资料只用于补查资料库未覆盖的内容；用 agent 自带的联网搜索（WebSearch/WebFetch）查证，仓库不再内置 wiki 检索脚本。
- Claude Code skills / commands 保留 `$ARGUMENTS`，让用户在斜杠命令后的文本能进入提示词。
- 记忆读写优先使用 `scripts/furina-memory.mjs`，再回退到 `~/.claude/furina-memory.mjs`。
- 修改 `src/prompt/` 或 `src/memory/` 后，运行 `node scripts/sync-references.mjs` 同步 `codex/skills/furina-roleplay/references/`。
