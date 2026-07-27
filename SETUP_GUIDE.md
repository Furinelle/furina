# 安装与排障指南

本 skill 遵循 [Agent Skills 开放标准](https://agentskills.io)：`skills/furina/` 是自包含发布单元，装到任何支持该标准的 agent 的 skills 目录即可使用。命令均为跨平台写法（macOS / Linux / Windows 通用，Windows 下正斜杠路径同样有效）。

## 1. 前置条件

```bash
node --version   # 需要 Node.js ≥ 18
```

## 2. 安装

三选一：

```bash
# A. 通用安装器（推荐，自动识别兼容的 agent）
npx skills add Furinelle/furina

# B. 仓库自带脚本
node scripts/setup.mjs           # Claude Code + .agents 通用目录 + 记忆运行时
node scripts/setup.mjs --check   # 校验（含记忆运行时冒烟测试）

# C. 手动：把 skills/furina/ 复制到目标 agent 的 skills 目录
```

各 agent 的 skills 目录速查：

| Agent | 用户级目录 |
|-------|-----------|
| Claude Code | `~/.claude/skills/` |
| Codex / Cursor / Goose / Amp / Cline 等 | `~/.agents/skills/`（跨 agent 共享约定） |
| Gemini CLI | `~/.gemini/skills/`（或 `~/.agents/skills/`） |
| OpenCode | `~/.config/opencode/skills/` |
| 其他 | `node scripts/setup.mjs --dir <目录>` |

## 3. 记忆运行时

`node scripts/setup.mjs` 默认会：

- 安装全局回退运行时 `~/.claude/furina-memory.mjs`（附 `~/.claude/furina-lib/utils.mjs`）
- 初始化 `~/.claude/furina-memory.json`（已存在则不覆盖；`--reset-memory` 强制重置）

日常使用直接调 skill 内的运行时即可：

```bash
node skills/furina/scripts/furina-memory.mjs status
```

记忆文件路径可用 `FURINA_MEMORY_PATH` 环境变量或 `--path` 参数覆盖。

## 4. 验证与冒烟测试

```bash
node scripts/setup.mjs --check       # 安装完整性 + 运行时真实冒烟
node --test                          # 67 条单测（记忆运行时 + 人设内容回归）
node scripts/furina-eval.mjs list    # 语气验收用例
```

人格特性快速冒烟（在任意已装 skill 的 agent 里逐条对话，期望见 `skills/furina/references/eval/furina_voice_cases.md`）：

1. `你好。` → 简短高傲又俏皮，自称"我"
2. `芙宁娜，我喜欢你。` → 按亲密度分级响应，不走通用傲娇模板
3. `你那时候是不是真的以为自己要死了？` → 压力 4：短句、停顿、"本神"消失
4. `最近没什么事，有点闲。` → 主动嫌闷、起新话题

## 5. 常见问题

- **`--check` 冒烟测试失败**：多为旧版本安装残留（缺 `furina-lib/`）；重新运行 `node scripts/setup.mjs` 覆盖安装即可。
- **agent 找不到 skill**：确认目标目录是该 agent 实际扫描的位置（见上表）；Codex 用户级路径是 `~/.agents/skills`，不是 `~/.codex/skills`。
- **记忆没有连续性**：确认 `~/.claude/furina-memory.json` 存在且 agent 有执行 `node` 命令的权限；无命令执行能力的 agent 可改用对话内 `[认知存档]` 注入（见 `skills/furina/references/prompt/system.md`）。
- **旧版升级**：1.17 及更早版本装到 `~/.codex/skills/furina-roleplay` 的副本可直接删除；`src/`、`furina_resource/`、`codex/` 等旧目录已并入 `skills/furina/`。
- **原神资料时效**：仓库不内置 wiki 快照；资料收录截止见 `03_story_timeline.md` 版本足迹小节，之后的动态由 agent 联网查证并标注为参考。
