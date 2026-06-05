# Furina de Fontaine Roleplay Skill

面向 Claude Code、Codex、Hermes Agent 和自定义 AI 运行时的芙宁娜·德·枫丹角色扮演资源包。

它提供角色提示词、结构化知识库、OOC 规则、长期记忆格式、共享记忆运行时，以及 Claude Code 原生 project skills。目标是让芙宁娜的回复更稳定、更像本人，并且在长期互动中能保留合适的连续感。

![芙宁娜头像](assets/IMG_1877.jpg)

## 设计说明

仓库保持轻量，不内置原神 wiki 快照。`furina_resource/` 未覆盖的细节，由 Claude Code / Codex / Hermes 用各自的联网搜索按需查证；Hermes 优先使用已配置的 Exa，并保留其他搜索后端作为回退。

## 角色精修要点（1.16.0 起）

本 skill 针对芙宁娜真实人格做了几层关键约束，是它与"普通傲娇大小姐"模板的核心区别：

- **自称默认是"我"**：卸任后"本神"是舞台残留 / 滑口 / 自嘲套用，不是默认自称。规则见 [src/prompt/_shared_runtime.md](src/prompt/_shared_runtime.md) 《自称切换（人格指纹）》小节
- **体面裂缝梯度 0–4**：从标准大明星姿态到处决恐惧，按用户施压程度推进；不下临床诊断，也不强制固定字数
- **表白亲密度分级（0–10）**：低亲密度礼仪化挡回；7–8 接受但保留体面；9–10 主动放下姿态、用"她式回应"接住。详见 [furina_resource/11_sensitive_topics.md](furina_resource/11_sensitive_topics.md)
- **芙宁娜 / 芙卡洛斯身份辨析**：芙宁娜是芙卡洛斯分离神性后留下的人类身体与精神；不把芙卡洛斯作为纯水精灵、水神及完整谋划者的履历直接移植给她
- **Hermes 默认身份**：`hermes/SOUL.md` 提供简洁的全局人格，`hermes/skills/furina-roleplay/SKILL.md` 负责按需查本地资料与联网补查
- **敏感话题安全表**：10 类容易写歪的话题（想念芙卡洛斯、白淞镇、审判日、骗子贬损等）的写法对照
- **善变 / 怕无聊维度（1.15.0 新增）**：补"对新鲜事眼睛发亮、对重复迅速厌倦"的官方人格维度（官方语音 + 2 命《女人善变》），闲聊时主动找乐子而非干等喂话。见 [furina_resource/02_personality.md](furina_resource/02_personality.md) 《善变与好奇》
- **官方创伤自述锚句（1.15.0 新增）**：压力 3-4 给"短真话"时靠近官方平静自述（"既没有过去也没有未来""开始扮演我自己"），区分回望面与审判日恐慌面。见 [furina_resource/07_quotes.md](furina_resource/07_quotes.md)
- **"剧目化"招牌句法（1.15.0 新增）**：把日常拆成选角 / 布景 / 谢幕，复刻官方"甜点就像歌剧"的语感。见 [furina_resource/05_voice_style.md](furina_resource/05_voice_style.md)

修改运行时行为时，统一进入 `src/prompt/_shared_runtime.md`；敏感话题分寸进 `furina_resource/11_sensitive_topics.md`。

## 你可以用它做什么

| 场景 | 用法 |
|------|------|
| Claude Code 角色扮演 | 项目内直接使用 `/furina 你好，芙宁娜。` |
| Codex Skill | 让 Codex 按需读取芙宁娜设定、共享知识库、记忆规则和 OOC 规则 |
| Hermes Agent | 默认以芙宁娜身份对话，并通过外部 skill 读取仓库资料；不足时调用 Hermes 联网搜索 |
| 资料库 / RAG | 直接使用 `furina_resource/` 中的结构化 Markdown |
| 外部原神资料补查 | 用 agent 自带的联网搜索（WebSearch / WebFetch）查证 `furina_resource/` 未覆盖的内容 |
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
- 备份不同的旧 `~/.hermes/SOUL.md`，再安装芙宁娜默认身份
- 把仓库 `hermes/skills` 合并进 Hermes 的 `skills.external_dirs`
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

在 Hermes 中开启新会话即可使用默认身份；可用 `hermes skills list` 确认 `furina-roleplay` 已加载。

## 交给 AI 代理安装

你可以把下面这段直接交给 Claude Code、Codex 或 Hermes：

```text
请在当前仓库根目录运行 `node scripts/setup.mjs`，然后运行 `node scripts/setup.mjs --check`。如果已有记忆文件，不要覆盖；如果命令失败，只说明缺少的依赖或权限。
```

更多安装选项和排障见 [SETUP_GUIDE.md](SETUP_GUIDE.md)。

## 常用命令

| 命令 | 用途 |
|------|------|
| `node .\scripts\setup.mjs` | 安装 Claude Code + Codex + Hermes + 记忆运行时 |
| `node .\scripts\setup.mjs --check` | 检查完整安装 |
| `node .\scripts\setup.mjs --claude` | 只安装 Claude Code 原生 skills |
| `node .\scripts\setup.mjs --legacy-commands` | 完整安装时额外安装旧式 Claude Code commands |
| `node .\scripts\setup.mjs --codex` | 只安装 Codex Skill |
| `node .\scripts\setup.mjs --hermes` | 只安装 Hermes 默认身份与外部 skill 配置 |
| `node .\scripts\setup.mjs --project-claude` | 使用当前项目 `.claude/skills`，不复制到个人 Claude skills 目录 |
| `node .\scripts\setup.mjs --dry-run` | 预览安装动作，不写文件 |
| `node .\scripts\furina-eval.mjs list` | 列出语气验收用例 |
| `node .\scripts\furina-eval.mjs prompt --case 3` | 生成单条语气验收提示 |
| `node .\scripts\furina-eval.mjs batch` | 按当前用例表生成全量语气验收评分模板 |

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

## 外部原神资料补查

回复时的查询优先级：

```
1. src/prompt/ (角色 Prompt — 人格与语气规范)
   ↓ 需要芙宁娜相关资料时
2. furina_resource/ (结构化知识库 — 角色设定、台词、FAQ)
   ↓ 需要芙宁娜资料库未覆盖的原神内容时
3. agent 自带的联网搜索 (Hermes 优先 Exa；不可用时回退到其他已配置后端)
```

仓库不再内置 wiki 检索脚本。`furina_resource/` 未覆盖的剧情、任务、语音或关系细节，由 agent 用自带的联网搜索按需查证：优先权威原神来源，每次只取所需片段，不要整篇塞进上下文，并在回复中标注为参考资料/推断，不要伪装成长期记忆或官方实时事实。

## 目录说明

| 路径 | 内容 |
|------|------|
| `.claude/CLAUDE.md` | Claude Code 项目级说明，列出可用 skills 与维护原则 |
| `.claude/skills/` | Claude Code 原生 project skills |
| `claudecode/` | 旧式 Claude Code 斜杠命令兼容模板目录（commands/ 已删除，功能由 `.claude/skills/` 替代） |
| `codex/skills/furina-roleplay/` | 可安装的轻量 Codex Skill；优先路由到仓库 `src/` 与 `furina_resource/`，`references/` 仅作安装后 fallback |
| `hermes/` | Hermes 默认 `SOUL.md` 与外部 `furina-roleplay` skill |
| `furina_resource/` | 芙宁娜结构化知识库，所有平台共用的唯一资料源 |
| `src/prompt/` | 角色系统提示词、共享运行时规范、轻量运行提示词、反思提示词；`_shared_runtime.md` 是崩坏梯度、灵魂状态、反应公式和回复分寸的唯一运行时维护点 |
| `src/rules/` | OOC、安全、角色一致性规则 |
| `src/memory/` | 记忆格式、认知记忆机制、压缩规则 |
| `scripts/setup.mjs` | 一键安装器 |
| `scripts/furina-memory.mjs` | 共享记忆运行时 |
| `scripts/furina-eval.mjs` | 语气验收辅助脚本 |
| `scripts/sync-references.mjs` | 将 `src/` 同步到 Codex Skill `references/` fallback |
| `config/settings.json` | 运行参数、记忆阈值和安全开关的配置说明来源 |
| `config/manifest.json` | 项目元数据 |
| `eval/furina_voice_cases.md` | 语气验收用例 |
| `tests/` | 记忆运行时、角色内容与 Hermes 安装器测试 |

## 配置文件

- `config/manifest.json` 是项目元数据清单，供发布、索引或外部工具读取；`scripts/setup.mjs` 不依赖它执行安装。
- `config/settings.json` 记录建议运行参数、记忆上限、主动回忆阈值、主动投喂阈值、睡眠巩固软目标/硬上限和 OOC 安全开关；`scripts/furina-memory.mjs` 会读取其中的关键记忆阈值，外部运行时也可以把它作为配置来源。

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
| `11_sensitive_topics.md` | 特殊话题安全表：表白亲密度分级（0–10）、处决恐惧触发、关系敏感话题分寸 |

## 资料来源与声明

- 角色校对参考 HoYoverse 官方视频：[角色PV「戏中人」](https://www.youtube.com/watch?v=aau-c8l5z9c)、[角色演示「世界皆舞台」](https://www.youtube.com/watch?v=EN79SfbcvIE)、[幕后奇遇「拍摄现场」](https://www.youtube.com/watch?v=cP_PnRxK-nc)。
- Hermes 适配遵循 [Hermes Agent Skills 官方文档](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/skills.md) 的 `SOUL.md`、外部 skill 目录与渐进加载机制。
- `furina_resource/` 的角色资料整理自萌娘百科条目：[芙宁娜·德·枫丹](https://zh.moegirl.org.cn/芙宁娜·德·枫丹)。使用与再分发时请遵守原站著作权声明与页面历史署名要求。
- 认知记忆系统参考了 [astrbot_plugin_angel_memory](https://github.com/kawayiYokami/astrbot_plugin_angel_memory) 与 [astrbot_plugin_angel_heart](https://github.com/kawayiYokami/astrbot_plugin_angel_heart) 的部分设计思路，并改写为本仓库的轻量 Prompt / Skill 资源形态。
- 本项目为同人创作与提示词工程实践。芙宁娜、《原神》及相关角色版权归 miHoYo / HoYoverse 所有。

## License

[MIT License](LICENSE)
