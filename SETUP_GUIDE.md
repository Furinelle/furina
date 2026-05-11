# 安装与配置手册

这份手册只处理安装、检查和排障。项目介绍请看 [README.md](README.md)。

## 0. 分支定位

本手册针对 `main` 分支。`main` 保持轻量，不再提交仓库内置 `vendor/GenshinStory` 快照；Furina 补查背景资料时优先查询本地 genshinstory-cache，不可用时自动回退在线 BWIKI。

| 项目 | `main` 分支 |
|------|-------------|
| 默认 wiki 策略 | `local-first-with-online-fallback` |
| 默认来源 | 优先本地 genshinstory-cache，不可用时自动回退在线原神 BWIKI |
| 可选本地来源 | 同级目录 `../genshinstory-cache`（`git clone https://github.com/Furinelle/genshinstory-cache`），或 `GENSHIN_STORY_ROOT` / `--root` 指定路径 |
| 原神 Markdown 文档 | `<GenshinStory>/web/docs-site/public/domains/gi/docs` |
| 搜索索引 | `.cache/furina-wiki/`，本地生成且不提交 |
| 适合场景 | 轻量安装、可选本地缓存加速、在线自动回退 |

因此，`main` 的安装检查只要求 Claude/Codex skill 和记忆运行时正常；本地 GenshinStory 缓存和索引属于可选增强。需要本地资料时，`Furinelle/furina` 可以连接到本地 [`Furinelle/genshinstory-cache`](https://github.com/Furinelle/genshinstory-cache) 仓库。

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
旧式 Claude Code commands 默认不再安装；只有显式加 `--legacy-commands` 时才会写入 `~/.claude/commands`。

仓库内还包含 `.claude/CLAUDE.md` 和 `.claude/skills/`，Claude Code 在本项目中打开时会读取项目说明，并自动发现 `/furina` 等原生 skills。

`furina_resource/` 不会被复制进 Codex Skill；它保留在仓库根目录，Claude Code、Codex 和其他运行时共用这一份资料。Codex Skill 只保存一个很小的路径上下文文件，用来找到这份共享资料库。
提示词、记忆和规则的维护入口是仓库根目录的 `src/`：Codex Skill 会优先读取 `src/prompt/`、`src/memory/` 和 `src/rules/`；安装后的 `references/` 只是仓库不可用时的 fallback，不应作为日常修改入口。

外部原神 wiki 优先查询本地 genshinstory-cache（如果已安装），不可用时自动回退在线 BWIKI：

```powershell
node .\scripts\furina-wiki.mjs sources
node .\scripts\furina-wiki.mjs search "芙宁娜"
```

如果想固定只用在线 BWIKI，可显式指定来源：

```powershell
node .\scripts\furina-wiki.mjs search "芙宁娜" --source bwiki-online
```

### 可选：安装本地 genshinstory-cache

本地缓存可大幅加速 wiki 查询并支持离线使用。`furina` 可直接连接到本地 [`Furinelle/genshinstory-cache`](https://github.com/Furinelle/genshinstory-cache) 仓库；推荐两个仓库放在同一父目录：

```bash
git clone https://github.com/Furinelle/genshinstory-cache ../genshinstory-cache
```

```text
GitHub/
├── furina/
└── genshinstory-cache/
```

安装后，wiki 查询自动优先使用本地索引。如果要改用其他 GenshinStory 路径，请设置 `GENSHIN_STORY_ROOT` 或传入 `--root` 覆盖。没有外部 wiki 时，本 skill 仍会正常使用仓库根目录的 `furina_resource/`；外部 wiki 只作为补查来源。连接本地仓库只需要读取 Markdown 文件，不需要启动 genshinstory-cache 的前端或后端服务。
如果显式指定 `--source genshin-story` 但本地缓存缺失，`furina-wiki.mjs` 会提示克隆 `Furinelle/genshinstory-cache`、设置 `GENSHIN_STORY_ROOT` / `--root`，或改用 `--source bwiki-online`。

本地 GenshinStory 缓存的实际读取路径为 `<GenshinStory>/web/docs-site/public/domains/gi/docs`。分片索引会写入 `.cache/furina-wiki/`，用于加速本地搜索，不需要提交。复杂剧情或关系问题可用 `node .\scripts\furina-explore.mjs --task "子问题"` 拆成最多 5 路并行探索。

本分支的预期配置可以用下面两条确认：

```powershell
node .\scripts\furina-wiki.mjs sources
node .\scripts\furina-wiki-index.mjs status
```

`sources` 应显示默认来源为 `genshin-story`，回退来源为 `bwiki-online`；安装了本地缓存后，索引状态应显示本地文档数量和 `fresh: true`。

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

可选验证在线查询和本地资料能力：

```powershell
node .\scripts\furina-wiki.mjs search "芙宁娜 传说任务" --top 3 --json
node .\scripts\furina-wiki.mjs read "芙宁娜" --line-range 1-12 --json
Test-Path ..\genshinstory-cache\web\docs-site\public\domains\gi\docs
node .\scripts\furina-wiki-index.mjs status
```

期望结果：

- 安装了本地缓存时，默认搜索和读取结果的 `source` 为 `genshin-story`；未安装时自动回退为 `bwiki-online`。
- 如果 `Test-Path` 返回 `True`，说明本地缓存可用，搜索会自动优先使用。
- `furina-wiki-index` 构建后显示 `fresh: true` 时，说明本地索引可用。
- 本地搜索结果包含 `indexed: true` 时，说明正在使用 `.cache/furina-wiki/` 本地索引。

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
| 需要旧式 Claude commands 兼容入口 | `node .\scripts\setup.mjs --claude --legacy-commands` |
| 只装 Codex Skill | `node .\scripts\setup.mjs --codex` |
| 生成 AstrBot 适配包 | `node .\scripts\furina-astrbot.mjs generate --out astrbot` |
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

要验证 Codex/Furina 能走在线 BWIKI 和可选本地 GenshinStory 缓存，可以让 Codex 执行：

```text
使用 furina-roleplay skill。请查询“芙宁娜 传说任务”，返回前三条结果的 source 和 path；如果我已经提供了 GENSHIN_STORY_ROOT 或同级 genshinstory-cache，再额外说明本地缓存是否 indexed。
```

正常情况下会先尝试 `source: genshin-story`；如果没有本地缓存，会自动回退为 `source: bwiki-online`。固定只用在线来源时可显式传 `--source bwiki-online`。

### AstrBot

完整部署流程见 [astrbot/README.md](astrbot/README.md)。以下为快速概览。

**第一步：生成或检查适配包**

```powershell
node .\scripts\furina-astrbot.mjs generate --out astrbot
node .\scripts\furina-astrbot.mjs check --out astrbot
```

**第二步：安装插件（顺序不能颠倒）**

Dashboard → 插件市场，依次安装：
1. `astrbot_plugin_angel_heart`
2. `astrbot_plugin_angel_memory`
3. `astrbot_plugin_livingmemory`

然后在 Docker 容器中安装 tantivy 并重启：

```bash
docker exec astrbot pip install tantivy
docker restart astrbot
```

**第三步：配置 Embedding 提供商**

Dashboard → 模型提供商 → 新增，类型选 Embedding，推荐使用 Gemini Embedding（Google AI Studio 免费申请 Key）：
- 类型：`Gemini Embedding`，ID：`gemini_embedding`，模型名称：`gemini-embedding-2`，向量维度：`768`

> ⚠️ AstrBot v4.24.2 存在 Gemini Embedding 批量接口兼容性 Bug（[#8150](https://github.com/AstrBotDevs/AstrBot/issues/8150)），需手动修复 `gemini_embedding_source.py` 中的 `get_embeddings` 方法，改为逐条请求。详见 [astrbot/README.md](astrbot/README.md#第二步配置-embedding-提供商)。

**第四步：创建知识库**

Dashboard → 知识库 → 创建，名称 `furina resource`，Embedding 模型选 `gemini_embedding`，上传 `furina_resource/` 下以下文件：

```
01_profile.md  02_personality.md  03_story_timeline.md  04_combat_mechanics.md
06_relationships.md  07_quotes.md  09_voice_lines.md  10_moegirl_supplement.md
```

（不上传 `05_voice_style.md`，已内联到 SKILL.md 和 Persona。）

**第五步：配置三个插件**

参考 `astrbot/configs/astrbot_plugins.example.json`，关键字段：

- Angel Heart：`alias: 芙宁娜|Furina|水神`，`strip_markdown_enabled: false`
- Angel Memory：`conversation_scope_map: {“furina-roleplay”: “furina_default”}`，`enable_soul_system.enabled: true`
- LivingMemory：`injection_method: system_prompt`，`use_persona_filtering: true`

**第六步：上传 Skill 并创建 Persona**

1. 将 `astrbot/skills/furina/SKILL.md` 打包为 ZIP，Dashboard → Skills → 上传。
2. Dashboard → 人格设定 → 新建，名称 `芙宁娜`，System Prompt 填入 `astrbot/persona/furina-astrbot-persona.md` 全部内容，Skills 选择 `furina-roleplay`。
3. Dashboard → 机器人 → 默认人格，切换为 `芙宁娜`。

可选：通过 Angel Memory Debug Tool 导入 `astrbot/angel_memory/furina_core_memories.json` 预置核心记忆。

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

确认 `Claude skill furina` 是 `ok`，然后重启 Claude Code 会话。只有你运行了 `--legacy-commands` 时，检查结果才会包含 `Claude command furina.md`。

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
