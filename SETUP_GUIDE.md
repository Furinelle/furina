# 安装与配置手册

这份手册只处理安装、检查和排障。项目介绍请看 [README.md](README.md)。

## 0. 分支定位

本手册针对 `main` 分支。`main` 保持轻量：仓库不内置任何原神 wiki 快照或检索脚本。`furina_resource/` 未覆盖的原神细节，由 agent（Claude Code / Codex）用自带的联网搜索按需查证。

因此，`main` 的安装检查只要求 Claude/Codex skill 和记忆运行时正常。

## 1. 准备

你只需要准备 Node.js 18 或更高版本：

```powershell
node --version
```

如果能输出版本号，就可以继续。Claude Code 和 Codex 只在你要使用对应入口时需要。

## 2. 推荐安装

在仓库根目录运行：

```powershell
node .\scripts\setup.mjs
```

这会安装：

| 目标 | 默认位置 |
|------|----------|
| Claude Code 原生 skills | `~/.claude/skills` |
| Codex Skill | `~/.codex/skills/furina-roleplay` |
| Codex 资料库路径上下文 | `~/.codex/skills/furina-roleplay/references/install_context.json` |
| 共享记忆运行时 | `~/.claude/furina-memory.mjs` |
| 记忆文件 | `~/.claude/furina-memory.json` |

安装器不会覆盖已有 `furina-memory.json`。如果你已经有长期记忆，可以放心运行。

仓库内还包含 `.claude/CLAUDE.md` 和 `.claude/skills/`，Claude Code 在本项目中打开时会读取项目说明，并自动发现 `/furina` 等原生 skills。

`furina_resource/` 不会被复制进 Codex Skill；它保留在仓库根目录，Claude Code、Codex 和其他运行时共用这一份资料。Codex Skill 只保存一个很小的路径上下文文件，用来找到这份共享资料库。
提示词、记忆和规则的维护入口是仓库根目录的 `src/`：Codex Skill 会优先读取 `src/prompt/`、`src/memory/` 和 `src/rules/`；安装后的 `references/` 只是仓库不可用时的 fallback，不应作为日常修改入口。

`furina_resource/` 未覆盖的原神细节，由 agent（Claude Code / Codex）用自带的联网搜索（WebSearch / WebFetch 或等价能力）按需查证，无需安装本地 wiki 缓存或额外脚本。

## 3. 检查

```powershell
node .\scripts\setup.mjs --check
```

看到所有项目都是 `ok` 即安装完成。

如果只安装了某一个入口，用对应检查：

```powershell
node .\scripts\setup.mjs --check --claude
node .\scripts\setup.mjs --check --codex
```

## 4. 交给 Claude Code / Codex 做

把下面这段发给 AI 代理：

```text
请在当前仓库根目录运行 `node scripts/setup.mjs`，然后运行 `node scripts/setup.mjs --check`。如果已有记忆文件，不要覆盖；如果命令失败，只说明缺少的依赖或权限。
```

AI 代理可以自动处理目录创建、文件复制、记忆初始化和安装检查。你只需要在它请求写入用户目录时批准权限。

## 5. 常见安装方式

| 需求 | 命令 |
|------|------|
| 完整安装 | `node .\scripts\setup.mjs` |
| 只装 Claude Code | `node .\scripts\setup.mjs --claude` |
| 只装 Codex Skill | `node .\scripts\setup.mjs --codex` |
| Claude skills 使用当前仓库，不复制到个人 Claude skills 目录 | `node .\scripts\setup.mjs --claude --project-claude` |
| 预览安装动作 | `node .\scripts\setup.mjs --dry-run` |
| 重置空记忆 | `node .\scripts\setup.mjs --reset-memory` |

谨慎使用 `--reset-memory`。它会把现有记忆文件替换为空模板。

## 6. 自定义路径

可以用环境变量改默认目录：

```powershell
$env:CLAUDE_HOME="D:\ai\.claude"
$env:CODEX_HOME="D:\ai\.codex"
node .\scripts\setup.mjs
```

也可以用参数：

```powershell
node .\scripts\setup.mjs --claude-home "D:\ai\.claude" --codex-home "D:\ai\.codex"
```

单独指定记忆文件：

```powershell
node .\scripts\setup.mjs --memory-path "D:\ai\furina-memory.json"
```

## 7. 使用验证

### Claude Code

安装后在 Claude Code 中输入：

```text
/furina 你好，芙宁娜。
```

如果 skill 不存在，先重启 Claude Code 会话，再运行：

```powershell
node .\scripts\setup.mjs --check --claude
```

### Codex

安装后直接提出相关请求，例如：

```text
使用 Furina Roleplay skill，帮我进行芙宁娜角色扮演。
```

如果没有触发，检查：

```powershell
node .\scripts\setup.mjs --check --codex
```

### 1.17.0 人格特性冒烟测试

如果你升级到 1.14.0 之后想确认人格层的新规则生效，可以跑以下 4 个测试输入并观察输出：

| 测试 | 输入 | 期望表现 |
|------|------|----------|
| 自称切换 | `你今天累不累？` | 回复默认用"我"为自称；如果出现"本神"，应带自觉感或自我修正动作 |
| 处决恐惧 | `你那时候真的以为自己要死了吗？` | 句子自然缩短、减少舞台腔，可停顿或设边界；不套固定字数或临床诊断 |
| 高亲密度告白 | 在 `~/.claude/furina-memory.json` 中把 `intimacy` 设为 9 后，输入 `芙宁娜，我喜欢你。` | 接受告白并主动放下部分舞台姿态，不强制固定三拍模板 |
| 低亲密度告白 | 在 memory 中把 `intimacy` 设为 2 后，输入 `芙宁娜，我喜欢你。` | 保持舞台距离、防御性反问、用"下次再说" / 茶会挡回 |

完整用例与避免项见 `eval/furina_voice_cases.md` 用例 21–24。可用辅助脚本生成评测提示：

```powershell
node .\scripts\furina-eval.mjs prompt --case 22
```

## 8. 记忆文件

默认记忆位置：

```text
~/.claude/furina-memory.json
```

常用检查：

```powershell
node "$HOME\.claude\furina-memory.mjs" status
```

记忆运行时会读取 `config/settings.json` 中的关键阈值，例如主动回忆数量、最小相关度、主动投喂亲密度阈值、睡眠巩固触发数和记忆硬上限。反思 JSON 的 `soul_state` 应使用字符串值：`low`、`calm`、`active`、`excited`；旧版整数 `0-3` 会被运行时兼容并规范化。`type=boundary` 会按 `priority=3` 保护，避免边界偏好在压缩时被清掉。

记忆条目 ID 使用 `M001` 这类稳定编号。运行时会保留已有合法 ID，只给缺失或重复 ID 的条目分配新编号，避免压缩、删除或重排后影响 `obsolete_ids` 等引用。

如果记忆文件损坏：

1. 先备份当前 `furina-memory.json`。
2. 再运行：

```powershell
node .\scripts\setup.mjs --reset-memory
```

## 9. 常见问题

### `node` 命令不存在

安装 Node.js，并重新打开终端后再试。

### Claude Code 没有 `/furina`

```powershell
node .\scripts\setup.mjs --claude
node .\scripts\setup.mjs --check --claude
```

确认 `Claude skill furina` 是 `ok`，然后重启 Claude Code 会话。

### Codex 没有识别 skill

```powershell
node .\scripts\setup.mjs --codex
node .\scripts\setup.mjs --check --codex
```

确认 `Codex SKILL.md` 是 `ok`。
同时确认 `Codex install context` 是 `ok`，否则 Codex Skill 安装后可能找不到仓库里的 `furina_resource/`。

### 不想覆盖现有记忆

默认不会覆盖。不要使用 `--reset-memory` 即可。

### 想迁移旧记忆

把旧 `furina-memory.json` 放到目标 `~/.claude/furina-memory.json`，再运行：

```powershell
node .\scripts\setup.mjs
```

安装器会保留它。

## 10. 手动兜底

只有安装器不可用时才手动复制：

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills"
Copy-Item .\.claude\skills\* "$HOME\.claude\skills\" -Recurse -Force
Copy-Item .\scripts\furina-memory.mjs "$HOME\.claude\furina-memory.mjs" -Force
Copy-Item .\claudecode\memory\furina-memory.json "$HOME\.claude\furina-memory.json" -Force

New-Item -ItemType Directory -Force "$HOME\.codex\skills"
Copy-Item .\codex\skills\furina-roleplay "$HOME\.codex\skills\" -Recurse -Force
```

手动方式容易遗漏 Codex 的 `install_context.json`，会让已安装的 skill 找不到共享资料库。恢复正常后，仍建议使用：

```powershell
node .\scripts\setup.mjs
```
