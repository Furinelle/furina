# Furina de Fontaine Roleplay Skill

面向 Claude Code 原生 Skill、Codex Skill 和自定义 AI 运行时的芙宁娜·德·枫丹角色扮演资源包。

它提供角色提示词、结构化知识库、OOC 规则、长期记忆格式、共享记忆运行时，以及 Claude Code 原生 project skills。目标是让芙宁娜的回复更稳定、更像本人，并且在长期互动中能保留合适的连续感。

![芙宁娜头像](assets/IMG_1877.jpg)

## 当前分支说明

本说明针对 `main` 分支。`main` 保持轻量，不再提交仓库内置 `vendor/GenshinStory` 快照；外部原神资料优先查询本地 genshinstory-cache（可选安装），不可用时自动回退在线 BWIKI。

| 项目 | `main` 分支 |
|------|-------------|
| 外部原神资料 | 优先本地 genshinstory-cache 快速搜索；本地不可用时自动回退在线 BWIKI |
| 本地资料体积 | 轻量，不包含完整 GenshinStory 快照 |
| 查询性能 | 本地缓存优先，在线自动回退；本机有 GenshinStory 缓存时可生成 `.cache/furina-wiki/` 分片索引 |
| 深度探索 | 支持 `scripts/furina-explore.mjs` 最多 5 路并行探索，默认 10 分钟任务窗口 |
| 适用场景 | 安装简单、可选本地缓存加速、在线自动回退 |

如果需要离线或半离线检索，`Furinelle/furina` 可以连接到本地 [`Furinelle/genshinstory-cache`](https://github.com/Furinelle/genshinstory-cache) 仓库。推荐把两个仓库放在同一个父目录下，并将缓存克隆为 `../genshinstory-cache`：

```bash
git clone https://github.com/Furinelle/genshinstory-cache ../genshinstory-cache
```

目录结构示例：

```text
GitHub/
├── furina/
└── genshinstory-cache/
```

也可用 `GENSHIN_STORY_ROOT` / `--root` 指向其他本地路径。本地缓存安装后，wiki 查询自动优先读取该仓库的 `web/docs-site/public/domains/gi/docs`，不需要启动 genshinstory-cache 的前端或后端；本地不可用时回退在线 BWIKI。

## 你可以用它做什么

| 场景 | 用法 |
|------|------|
| Claude Code 角色扮演 | 项目内直接使用 `/furina 你好，芙宁娜。` |
| Codex Skill | 让 Codex 按需读取芙宁娜设定、共享知识库、记忆规则和 OOC 规则 |
| 资料库 / RAG | 直接使用 `furina_resource/` 中的结构化 Markdown |
| 外部原神 wiki 查询 | 通过 `scripts/furina-wiki.mjs` 优先查询本地 GenshinStory 缓存，不可用时自动回退在线 BWIKI |
| 自定义角色运行时 | 组合 `src/prompt/`、`src/rules/`、`src/memory/` 和 `scripts/furina-memory.mjs` |

## 快速开始

需要 Node.js 18 或更高版本。确认命令可用：

```powershell
node --version
```

在仓库根目录运行：

```powershell
node .\scripts\setup.mjs
node .\scripts\setup.mjs --check
```

安装器会自动完成：

- 安装 Claude Code 原生 skills 到 `~/.claude/skills`
- 安装 Codex Skill 到 `~/.codex/skills/furina-roleplay`
- 写入 Codex Skill 的轻量路径上下文，指向本仓库 `furina_resource/`
- 安装共享记忆运行时到 `~/.claude/furina-memory.mjs`
- 初始化 `~/.claude/furina-memory.json`

已有记忆文件不会被覆盖。
旧式 Claude Code commands 默认不再安装；需要兼容旧版本或旧教程时，额外加 `--legacy-commands`。

安装完成后，在 Claude Code 中测试：

```text
/furina 你好，芙宁娜。
```

在 Codex 中，直接提出与芙宁娜角色扮演、知识库问答、提示词维护或记忆整理相关的请求即可。

## 交给 AI 代理安装

你可以把下面这段直接交给 Claude Code 或 Codex：

```text
请在当前仓库根目录运行 `node scripts/setup.mjs`，然后运行 `node scripts/setup.mjs --check`。如果已有记忆文件，不要覆盖；如果命令失败，只说明缺少的依赖或权限。
```

更多安装选项和排障见 [SETUP_GUIDE.md](SETUP_GUIDE.md)。

## 常用命令

| 命令 | 用途 |
|------|------|
| `node .\scripts\setup.mjs` | 安装 Claude Code + Codex Skill + 记忆运行时 |
| `node .\scripts\setup.mjs --check` | 检查完整安装 |
| `node .\scripts\setup.mjs --claude` | 只安装 Claude Code 原生 skills |
| `node .\scripts\setup.mjs --legacy-commands` | 完整安装时额外安装旧式 Claude Code commands |
| `node .\scripts\setup.mjs --codex` | 只安装 Codex Skill |
| `node .\scripts\setup.mjs --project-claude` | 使用当前项目 `.claude/skills`，不复制到个人 Claude skills 目录 |
| `node .\scripts\setup.mjs --dry-run` | 预览安装动作，不写文件 |
| `node .\scripts\furina-eval.mjs list` | 列出语气验收用例 |
| `node .\scripts\furina-eval.mjs prompt --case 3` | 生成单条语气验收提示 |
| `node .\scripts\furina-eval.mjs batch` | 按当前用例表生成全量语气验收评分模板 |
| `node .\scripts\furina-wiki.mjs sources` | 检查外部原神 wiki 来源 |
| `node .\scripts\furina-wiki-index.mjs build` | 为可选本地 GenshinStory 缓存构建分片搜索索引 |
| `node .\scripts\furina-wiki.mjs search "芙宁娜"` | 检索外部原神 wiki |
| `node .\scripts\furina-explore.mjs --task "芙宁娜 传说任务"` | 并行探索外部 wiki 证据 |

Claude Code 可用：

| 命令 | 用途 |
|------|------|
| `/furina` | 主对话命令 |
| `/furina-save` | 手动保存关键记忆 |
| `/furina-reflect` | 从长对话中提取记忆 JSON |
| `/furina-compress` | 压缩重复或零散的记忆 |

## 记忆系统

默认记忆文件：

```text
~/.claude/furina-memory.json
```

共享记忆运行时：

```text
scripts/furina-memory.mjs
```

常用操作：

```powershell
node .\scripts\furina-memory.mjs init
node .\scripts\furina-memory.mjs status
node .\scripts\furina-memory.mjs inject --query "你好，芙宁娜"
node .\scripts\furina-memory.mjs remember --text "[📌 记忆: 用户喜欢枫丹歌剧]"
node .\scripts\furina-memory.mjs compress
```

记忆格式采用 `version: "2.0"`，包含亲密度、交互状态、灵魂状态、核心记忆、背景笔记和睡眠巩固状态。反思 JSON 中的 `soul_state` 应使用字符串值（`low` / `calm` / `active` / `excited`）；运行时也兼容旧版整数 `0-3` 并会规范化为字符串。记忆条目 ID 会按已有最大 `Mxxx` 稳定递增，避免压缩或删除后因数组位置变化而改号。`type=boundary` 默认按 `priority=3` 保护；高亲密度且气氛合适时，运行时可通过 `recall_mode: "proactive"` 允许少量“顺带想起”的主动回忆。完整字段说明见 [src/memory/memory_format.md](src/memory/memory_format.md) 与 [src/memory/cognitive_memory.md](src/memory/cognitive_memory.md)。

## 外部原神 Wiki

`scripts/furina-wiki.mjs` 用于按需查询芙宁娜资料库未覆盖的外部原神内容。AI 回复时应严格遵循查询优先级：

```
1. src/prompt/ (角色 Prompt — 人格与语气规范)
   ↓ 需要芙宁娜相关资料时
2. furina_resource/ (结构化知识库 — 角色设定、台词、FAQ)
   ↓ 需要芙宁娜资料库未覆盖的原神内容时
3. 本地 genshinstory-cache (可选安装，快速离线搜索)
   ↓ 本地缓存不可用时自动回退
4. wiki.biligame.com/ys (在线原神 BWIKI)
```

每次只读取少量命中片段，不要整篇塞进上下文。

### 可选：安装本地 genshinstory-cache

本地缓存可大幅加速 wiki 查询并支持离线使用。安装为可选——不装也能正常使用（自动回退在线）。`furina` 可直接连接到本地 [`Furinelle/genshinstory-cache`](https://github.com/Furinelle/genshinstory-cache) 仓库，推荐与 `furina` 放在同一父目录：

```bash
git clone https://github.com/Furinelle/genshinstory-cache ../genshinstory-cache
```

```text
GitHub/
├── furina/
└── genshinstory-cache/
```

缓存路径参考：

| 类型 | 路径 |
|------|------|
| GenshinStory 缓存仓库 | `../genshinstory-cache`，或 `GENSHIN_STORY_ROOT` / `--root` 指定的路径 |
| 原神 Markdown 文档 | `<GenshinStory>/web/docs-site/public/domains/gi/docs` |
| Furina 分片搜索索引 | `.cache/furina-wiki/` |

安装本地缓存后，首次高频检索前可构建分片索引。索引保存在 `.cache/furina-wiki/`，不会提交到 Git：

```powershell
node .\scripts\furina-wiki-index.mjs status
node .\scripts\furina-wiki-index.mjs build
```

### 查询命令

```powershell
node .\scripts\furina-wiki.mjs sources
node .\scripts\furina-wiki.mjs search "芙宁娜 那维莱特" --top 5
node .\scripts\furina-wiki.mjs brief "芙宁娜 传说任务"
node .\scripts\furina-wiki.mjs read "芙宁娜" --line-range 1-80
```

固定使用在线 BWIKI（跳过本地缓存）：

```powershell
node .\scripts\furina-wiki.mjs search "芙宁娜 那维莱特" --source bwiki-online
```

如果要改用其他 GenshinStory 路径，请设置 `GENSHIN_STORY_ROOT` 或传入 `--root` 覆盖。
如果显式指定本地来源但缓存缺失，工具会在错误信息中给出可执行的恢复建议：克隆 `Furinelle/genshinstory-cache`、设置 `GENSHIN_STORY_ROOT` / `--root`，或改用 `--source bwiki-online`。

复杂问题可拆成 1-5 个子问题并行探索；每个子任务会先搜索、再读取命中片段，并返回 evidence/references：

```powershell
node .\scripts\furina-explore.mjs --task "芙宁娜 传说任务" --task "芙宁娜 那维莱特" --top 3 --reads 2
```

AI 使用时应遵循查询优先级：prompt → `furina_resource/` → 本地 genshinstory-cache → 在线 BWIKI；每次只读取少量命中片段。

在线 BWIKI 请求设有 **10 秒超时**；超时后会自动回退到本地缓存，本地也不可用时抛出错误。若在线响应不稳定，建议安装本地 genshinstory-cache 或传入 `--source bwiki-online --no-fallback` 明确限定来源。

## 目录说明

| 路径 | 内容 |
|------|------|
| `.claude/CLAUDE.md` | Claude Code 项目级说明，列出可用 skills 与维护原则 |
| `.claude/skills/` | Claude Code 原生 project skills |
| `claudecode/` | 旧式 Claude Code 斜杠命令兼容模板目录（commands/ 已删除，功能由 `.claude/skills/` 替代） |
| `codex/skills/furina-roleplay/` | 可安装的轻量 Codex Skill；优先路由到仓库 `src/` 与 `furina_resource/`，`references/` 仅作安装后 fallback |
| `furina_resource/` | 芙宁娜结构化知识库，所有平台共用的唯一资料源 |
| `src/prompt/` | 角色系统提示词、共享运行时规范、轻量运行提示词、反思提示词；`_shared_runtime.md` 是崩坏梯度、灵魂状态、反应公式和回复分寸的唯一运行时维护点 |
| `src/rules/` | OOC、安全、角色一致性规则 |
| `src/memory/` | 记忆格式、认知记忆机制、压缩规则 |
| `scripts/setup.mjs` | 一键安装器 |
| `scripts/furina-memory.mjs` | 共享记忆运行时 |
| `scripts/furina-eval.mjs` | 语气验收辅助脚本 |
| `scripts/furina-wiki.mjs` | 外部原神 wiki 查询工具 |
| `scripts/furina-wiki-index.mjs` | 可选本地 GenshinStory 分片索引构建与查询工具 |
| `scripts/furina-explore.mjs` | 最多 5 路并行外部 wiki 探索工具 |
| `scripts/sync-references.mjs` | 将 `src/` 同步到 Codex Skill `references/` fallback |
| `config/settings.json` | 运行参数、记忆阈值和安全开关的配置说明来源 |
| `config/wiki_sources.json` | 外部 wiki 来源配置 |
| `config/manifest.json` | 项目元数据 |
| `eval/furina_voice_cases.md` | 语气验收用例 |
| `tests/` | 记忆运行时单元测试 |

## 配置文件

- `config/manifest.json` 是项目元数据清单，供发布、索引或外部工具读取；`scripts/setup.mjs` 不依赖它执行安装。
- `config/settings.json` 记录建议运行参数、外部 wiki 补查/索引/探索策略、记忆上限、主动回忆阈值、主动投喂阈值、睡眠巩固软目标/硬上限和 OOC 安全开关；`scripts/furina-memory.mjs` 会读取其中的关键记忆阈值，外部运行时也可以把它作为配置来源。
- `config/wiki_sources.json` 由 `scripts/furina-wiki.mjs` 读取，用于配置本地 genshinstory-cache 优先、在线 BWIKI 回退，以及可选本地缓存路径。

## 知识库索引

| 文件 | 内容 |
|------|------|
| `00_index.md` | 资料库索引 |
| `01_profile.md` | 基础资料 |
| `02_personality.md` | 性格、人设、表达习惯 |
| `03_story_timeline.md` | 剧情时间线 |
| `04_combat_mechanics.md` | 技能与战斗机制 |
| `05_voice_style.md` | 语气风格、崩坏梯度与生成规则 |
| `06_relationships.md` | 人物关系 |
| `07_quotes.md` | 高频台词与破绽句式 |
| `08_faq.md` | 常见问题答案 |
| `09_voice_lines.md` | 语音台词整理 |
| `10_moegirl_supplement.md` | 萌娘百科补充、创作要点与二创边界 |

## 资料来源与声明

- `furina_resource/` 的角色资料整理自萌娘百科条目：[芙宁娜·德·枫丹](https://zh.moegirl.org.cn/芙宁娜·德·枫丹)。使用与再分发时请遵守原站著作权声明与页面历史署名要求。
- 认知记忆系统参考了 [astrbot_plugin_angel_memory](https://github.com/kawayiYokami/astrbot_plugin_angel_memory) 与 [astrbot_plugin_angel_heart](https://github.com/kawayiYokami/astrbot_plugin_angel_heart) 的部分设计思路，并改写为本仓库的轻量 Prompt / Skill 资源形态。
- 本项目为同人创作与提示词工程实践。芙宁娜、《原神》及相关角色版权归 miHoYo / HoYoverse 所有。

## License

[MIT License](LICENSE)
