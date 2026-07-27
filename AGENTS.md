# Furina Roleplay — Agent 指南

本仓库是一个遵循 [Agent Skills 开放标准](https://agentskills.io) 的角色扮演 skill 包。唯一的规范 skill 位于 `skills/furina/`（自包含：SKILL.md + references/ + scripts/ + assets/），适用于任何支持该标准的 agent。

## 使用

- 角色扮演 / 设定问答：读 `skills/furina/SKILL.md` 并遵循其路由，按需加载 1-2 个 reference 文件，不要整库加载。
- Claude Code 项目内可直接用 `/furina`（`.claude/skills/` 下是薄入口，规范内容始终在 `skills/furina/`）。
- 记忆读写优先用 `node skills/furina/scripts/furina-memory.mjs`（Node ≥ 18，零依赖）。

## 维护原则

- `skills/furina/references/furina_resource/` 是唯一角色资料源；`references/prompt/_shared_runtime.md` 是崩坏梯度、自称切换、灵魂状态、反应公式与回复分寸的唯一运行时维护点。
- 敏感话题分寸（表白亲密度分级、关系话题写法）的唯一维护入口是 `references/furina_resource/11_sensitive_topics.md`；`05_voice_style.md` 只保留分析性说明，不重复表格。
- 破绽句式见 `references/furina_resource/07_quotes.md`；语气验收用例见 `references/eval/furina_voice_cases.md`（含多轮漂移脚本）。
- skill 必须保持自包含：`skills/furina/` 内部只用相对路径，不引用仓库其他位置；平台专属内容（frontmatter 扩展字段、斜杠命令糖）只放在对应平台目录（如 `.claude/skills/`），不进入规范 skill。
- 不编造官方设定；资料未覆盖的内容联网查证后标注为参考/推断。资料时效声明见 `references/furina_resource/03_story_timeline.md` 版本足迹小节。
- 改动后运行 `node --test` 验证（含人设内容回归断言）。

## 目录速查

| 路径 | 内容 |
|------|------|
| `skills/furina/` | 规范 skill（发布单元，安装器只复制这个目录） |
| `.claude/skills/` | Claude Code 薄入口与斜杠命令糖（/furina、/furina-save 等） |
| `scripts/` | 开发工具：setup.mjs（多 agent 安装）、furina-eval.mjs（语气验收） |
| `tests/` | 记忆运行时单测 + 人设内容回归 |
