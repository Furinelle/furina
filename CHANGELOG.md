# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- **重构为 agent 通用 skill（Agent Skills 开放标准）**：唯一规范 skill 迁至 `skills/furina/`（自包含：SKILL.md + references/ + scripts/ + assets/ + config/），可被 `npx skills add` 及支持 agentskills.io 标准的客户端（Claude Code、Codex、Gemini CLI、Cursor、OpenCode 等）直接安装
- `src/`、`furina_resource/`、`eval/`、记忆运行时并入 `skills/furina/`，彻底移除 src ↔ references 双份同步（删除 `scripts/sync-references.mjs`）
- 删除平台专用目录 `codex/`（Codex 现行用户级路径为 `~/.agents/skills`，由通用 skill 覆盖）与 `claudecode/`（记忆模板迁至 `skills/furina/assets/`）
- `.claude/skills/furina` 降为薄入口（斜杠命令糖），规范内容不再驻留平台目录
- `scripts/setup.mjs` 重写为多 agent 安装器：`--claude` / `--agents`（Codex/Cursor/Goose/Amp 等通用约定）/ `--gemini` / `--opencode` / `--dir <path>`；`--codex` 为 `--agents` 的弃用别名
- 新增根 `AGENTS.md`（agent 通用项目说明与维护原则）；README / SETUP_GUIDE 重写为跨平台定位；manifest.json 路径与 capabilities 对齐新布局，内嵌 changelog 移除（以 CHANGELOG.md 为唯一事实源）

### Fixed
- `scripts/setup.mjs`：全局记忆运行时随装 `furina-lib/utils.mjs` 并重写导入，修复安装副本 `ERR_MODULE_NOT_FOUND` 崩溃；`--check` 新增 `status` 冒烟测试，不再只验文件存在性
- 全局安装的 Claude skills 注入「安装副本说明」（仓库根路径锚点）并生成 `install_context.json`，修复异 cwd 下仓库相对路径全部失效的问题
- Claude skills `allowed-tools` 改为逗号分隔与 `:*` 前缀语法（原写法疑似不生效）；`/furina` description 补中文触发词
- 清理 README、SETUP_GUIDE、脚本说明与记忆模板中的旧目录、旧测试数和平台专属表述，补充从 1.17 旧布局迁移到通用 skill 的说明

### Added
- **furina_resource 全量核对更新（对照 bwiki 原神WIKI / 萌娘百科 / 观测枢，5 智能体分工逐字核验）**：01 移除无据称呼与头衔、补特殊料理「普茹斯蒂司」；02 新增角色故事 1-4 的完美主义/小动物/五百年自述小节与幽光星星意象；03 修正厄歌莉娅传承与歌剧院表述、海露港初见核实为正确并扩写、芙宁娜奖归位 4.3；04 元素爆发官方名「万众狂欢」勘误、4 命台词补全、命座出处逐条核对；06 八位角色新增「对方视角」语音摘要；07 台词逐字勘误去重、落泪借口替换为逐字原句（"我身上的水元素过于充盈"）、新增「易误用台词警示（芙卡洛斯≠芙宁娜）」；09 语音条目归位并大幅扩充（好感/突破/问候/宝箱等全逐字）、生日语音标注来源类型；08 新增神力/通心粉/称呼三条 FAQ；10 萌点/名字考据/宣发互文/梗清单按萌百最新版更新；00 路由补齐 06/07/11/08；05 表白节收敛为指向 11 的唯一入口指针
- 人设增补（经联网逐字核验官方语料）：「我身上的水元素过于充盈」落泪借口（`_shared_runtime.md` 梯度原则 + `07_quotes.md`）；「共演」关系官方锚句（`11_sensitive_topics.md` 高亲密度第三拍 + `06_relationships.md` 旅行者）；语气词与节奏小节（句尾哦/嘛/啦、"咳咳"找补、先宣言后找补，`_shared_runtime.md`）；版本足迹 2023-2026 速查与资料时效声明（`03_story_timeline.md`）
- 收尾核验四项存疑资料：补 2024/2025 两封角色生日邮件的年份、标题与内容锚点；确认三句尘歌壶同伴语音；确认“映影取景”属于天气语音「下雪的时候」；确认“通心粉打折的大日子”出自 4.3 活动「蔷薇与铳枪」而非传说任务；删除最后一条无可靠出处的剧情引语
- eval 新增用例 28「骗子指控」（11 号安全表方向性场景）与 8 轮多轮漂移验收脚本（量化指标：「本神」频次、篇幅膨胀、意象重复）

### Verified
- `node --test` 共 67 项通过；默认 Claude Code + `.agents`、Gemini CLI、OpenCode、自定义目录及 `--codex` 兼容别名均完成临时目录安装/检查
- `skills/furina/` 通过官方 `skills-ref validate`；语气验收表可解析出 28 个用例

## [1.17.0] - 2026-06-05

### Changed
- `main` 明确专注 Claude Code 与 Codex；AstrBot 和 Hermes 由各自分支维护
- 同步最新芙宁娜/芙卡洛斯身份辨析、秘密调查边界与自然创伤表达
- 保留同人长期关系成长：高亲密度明确接受告白，不强制固定三拍模板
- 更新 Claude/Codex skills、Codex references、README 与配置手册

### Removed
- 移除已无对应模板文件的 `--legacy-commands` 安装入口

## [1.15.0] - 2026-06-05

### Added
- `furina_resource/02_personality.md`：新增《善变与好奇（官方人格维度）》小节——补"善变 / 怕无聊 / 三分钟热度"这一官方人格维度（官方语音"热情越容易产生越容易失去"、闲聊"好无聊啊"、2 命《女人善变》）；关键词追加"善变（喜新厌旧）/ 怕无聊 / 好奇心旺盛"
- `furina_resource/05_voice_style.md`：新增《招牌句法：把日常「剧目化」》（选角 / 布景 / 排练 / 谢幕迁移用法，官方"甜点就像歌剧"）与《卸任后的喜剧生活桥段》（购物冲动送剧团、嘴硬控体态、冲浪天赋、怕无聊、威严漏出来）
- `furina_resource/07_quotes.md`：新增《官方创伤自述锚句（压力 3-4「短真话」方向）》——补"既没有过去也没有未来""我终于开始扮演我自己了"等官方平静自述，区分回望面与审判日恐慌面
- `src/prompt/_shared_runtime.md`：声音区块新增"性情：好奇心旺盛、怕无聊、容易三分钟热度"；反应公式新增"嫌无聊 / 话题重复"一条
- `eval/furina_voice_cases.md`：新增语气验收用例 25–27（善变 / 怕无聊、剧目化句法、创伤回望面）

### Removed
- 移除内置原神 wiki 检索层：删除 `scripts/furina-wiki.mjs`、`scripts/furina-wiki-index.mjs`、`scripts/furina-explore.mjs`、`config/wiki_sources.json` 与 `tests/wiki.test.mjs`。`furina_resource/` 未覆盖的原神细节改由 agent 自带的联网搜索（WebSearch / WebFetch）按需查证

### Changed
- `.claude/skills/furina/SKILL.md`：`allowed-tools` 去掉 wiki Bash 权限、加入 `WebSearch WebFetch`；工作流第 4-5 步合并为"用自带联网搜索补查并标注参考资料/推断"
- `codex/skills/furina-roleplay/SKILL.md` 与 `agents/openai.yaml`：外部资料路由改为联网搜索，移除 wiki 脚本引用
- `config/settings.json`：移除 `wiki_lookup` 段与 `external_wiki_note`，改为 `external_lore_note`
- `config/manifest.json`：版本 → 1.15.0；移除 wiki 相关的 `entry_point` / `config` / `capabilities` / `requirements` 项
- `scripts/setup.mjs`：`install_context.json` 移除 `wiki_runtime` / `explore_runtime` 两键
- `.gitignore`：移除已废弃的 `vendor/GenshinStory/`

### Fixed
- `package.json`：版本号从 1.13.0 对齐到 1.15.0（1.14.0 发布时漏改）

### Docs
- `README.md` / `SETUP_GUIDE.md` / `.claude/CLAUDE.md` / `claudecode/README.md` / `scripts/README.md`：移除 wiki 安装、查询、排障章节，统一改为"用 agent 自带联网搜索补查"；README 角色精修要点更新到 1.15.0

## [1.14.0] - 2026-05-23

### Added
- `furina_resource/11_sensitive_topics.md`：**新文件**——特殊话题安全表，含表白亲密度分级（0–10 共 4 档）、3 个完整范例（高/中/低亲密度）、"凡人失语"创伤触发分寸、关系敏感话题（"想念芙卡洛斯""你恨那维莱特吗""审判日"等 10 类）的写法对照表
- `src/prompt/_shared_runtime.md`：新增《自称切换（人格指纹）》整节——确立默认自称为"我"，"本神"是卸任后的舞台残留 / 滑口 / 自嘲套用三种功能性残留；按 soul_state 与亲密度给出分布表与句内修正动作示例
- `src/prompt/_shared_runtime.md`：新增《压力 4 的特殊子类：凡人失语》注脚——区分"孤独感慨"与"凡人面对处决时的失语"，规定句长 ≤6 字、"本神"必须消失、不解释、不立刻自救
- `furina_resource/02_personality.md`：新增《水神时期·阴面》小节——补充芙宁娜作为主动调查者、长线策略者的人格底色，避免被写成"被动承压的花瓶"
- `furina_resource/03_story_timeline.md`：新增《卸任初期·真空期》小节——记录她搬离沫芒宫后的失落感、对故人不知如何重新接近的迟疑、克洛琳德主动邀请的破冰意义
- `furina_resource/04_combat_mechanics.md`：新增《命之座文化背景：司颂座 (Animula Choragi)》——6 个命座对应的歌剧典故（卡门 / 弄臣 / 图兰朵 / 地狱中的奥菲欧 / 茶花女）
- `furina_resource/05_voice_style.md`：新增《被表白 / 被深度依赖 / 被强情感投射时》场景模板（三拍结构 + 亲密度分级指针）
- `furina_resource/07_quotes.md`：新增凡人恐惧台词 5 句（含 PV「戏中人」"一切都会在一场，如同戏剧般的审判中结束"等）
- `eval/furina_voice_cases.md`：新增用例 21–24（凡人失语 / 高亲密度告白接受 / 低亲密度告白挡回 / 自称滑口与修正）
- `codex/skills/furina-roleplay/agents/openai.yaml`：补全 `version`、`model_settings`、`voice_temperature_hints`（按 soul_state 给温度提示）、`tools` 与 `safety` 字段
- `src/prompt/system.md`：性格特质列表新增"策略者底色"

### Changed
- `scripts/sync-references.mjs`：`MAPPINGS` 扩展，新增 `furina_resource/` → `references/furina_resource` 与 `eval/` → `references/eval` 两条映射，让 Codex 离线安装时能完整读到资料库与验收用例
- `scripts/setup.mjs`：`install_context.json` 字段扩展，新增 `furina_resource_index` / `voice_style` / `sensitive_topics` / `shared_runtime` / `voice_eval_cases` / `explore_runtime` / `sync_references_runtime` 等显式路径，方便 Codex 在远端直接定位关键资源
- `src/prompt/runtime_lite.md`：自称自检规则改写——从"加一处自然改口"升级为"默认是'我'，'本神'是残留而非默认"
- `furina_resource/06_relationships.md`：克洛琳德条目重写——加入"角色故事 5 关键事件：主动邀请破冰"
- `codex/skills/furina-roleplay/SKILL.md`：路由新增敏感话题与自称切换两条；description 加英文版以兼容国际化触发
- `.claude/skills/furina/SKILL.md`：同步新增敏感话题与自称切换两条路由
- `furina_resource/00_index.md`：索引追加 11 号文件
- `config/manifest.json`：版本号 → 1.14.0；`entry_point` 补 `shared_runtime`、`sensitive_topics`

### Docs
- `README.md`：知识库索引追加 `11_sensitive_topics.md` 行；目录说明同步
- `SETUP_GUIDE.md`：在"使用验证"章节追加新人格特性的冒烟测试用例
- `.claude/CLAUDE.md`：维护原则追加"自称切换与敏感话题的唯一维护入口"说明

## [1.13.0] - 2026-05-16

### Fixed
- `furina-memory.mjs`：`similarContent` 子串包含长度阈值从 6 提高到 10，重叠分阈值从 0.65 提高到 0.68，减少短句误合并
- `furina-wiki.mjs`：在线 BWIKI 请求（`fetchJson`/`fetchText`）加入 10 秒超时；超时自动回退本地缓存，不再永久挂起
- `sync-references.mjs`：文件复制操作加入 try/catch，单个文件失败不再中断整批同步

### Refactored
- `furina-wiki.mjs`：移除本地 `queryTerms` 副本，改为从 `furina-wiki-index.mjs` 导入统一实现，消除代码重复
- `furina-explore.mjs`：失败任务（`failed` / `timeout`）改为输出到 stderr，状态文本全大写，更易在日志中识别

### Changed
- `furina_resource/05_voice_style.md`：崩坏梯度表替换为指向 `src/prompt/_shared_runtime.md` 的链接，消除双重维护点；仅保留口吻轴 / 意象清单 / 场景模板等分析性内容
- `src/memory/memory_format.md`：主动投喂部分补充"连续触发时至少跳过 2 轮"的频率约束，与认知记忆文档保持一致；soul_state 说明统一为"输出侧字符串 / 输入侧兼容整数"的完整表述
- `src/prompt/reflection.md`：soul_state 规则加入 `src/memory/memory_format.md` 的交叉引用
- `.claude/CLAUDE.md`：维护原则更新，指出崩坏梯度的唯一维护入口是 `src/prompt/_shared_runtime.md`

### Docs
- `README.md`：wiki 查询部分说明 10 秒超时行为；目录表修正 `claudecode/commands/` 已删除的状态
- `SETUP_GUIDE.md`：第 9 节新增"在线 wiki 查询长时间没有响应"排障条目

## [1.12.0] - 2026-05-15

### Added
- `tests/wiki.test.mjs`：新增 `queryTerms` 单元测试 + CLI 集成测试（sources / search / 圣遗物）
- `codex/skills/furina-roleplay/README.md`：说明 `references/` 为自动同步目录，禁止手工修改

### Improved
- 崩坏梯度表新增「正向例句」列，每级各一条样本句，更直观展示预期语气
- 追加「口吻轴」节（5 轴分类）至回复分寸表，精确定位台词风格
- `runtime_lite.md` 语气自检从抽象问句改为错误 → 正确对照格式
- `eval/furina_voice_cases.md` 补充 5 组典型错误/正确对照（被夸、追问孤独、日常、安慰、白淞镇）

### Fixed
- 台词示例修正：消除同一句话「本神」两连，加入改口为「我」的示范

### Removed
- `claudecode/commands/`：已删除，功能已由 `.claude/skills/` 完全替代

## [1.11.0] - 2026-05-07

### Fixed
- 替换已废弃的 `RegExp.lastMatch` 为 `String.match()`（`inferTags`）
- 修复 `furina-memory.mjs --path` 参数的路径穿越风险
- 对齐配置策略：`settings.json` 改用本地优先 + 在线回退
- 修复 `furina-wiki.mjs` 中稳定循环双重 HTML 实体解码问题

### Refactored
- 提取 `walkMarkdown`、`safeRelative`、`normalizeText`、`stripMarkdown` 至 `lib/utils.mjs`
- `loadConfig` 增加模块级缓存，避免重复读取文件

### Added
- `sync-references.mjs`：自动同步 `src/` 至 Codex skill `references/`
- `tests/memory.test.mjs`：59 条 `furina-memory.mjs` 核心函数单元测试
- `package.json`：声明 `type: module`
- 扩展 `.gitignore` 常用条目

## [1.10.0] - 2026-05-06

### Refactored
- 提取 `_shared_runtime.md` 作为崩坏梯度、灵魂状态、反应公式、回复节奏的单一真值来源
- `runtime_lite.md` 从 78 行精简至 35 行；`system.md` 与 `05_voice_style.md` 改为引用它
- 提取 `scripts/lib/utils.mjs`（`parseArgs`、`expandHome`、`ensureDir`、`ROOT`），六个脚本共用同一实现

### Added
- `furina-eval.mjs`：批量评估命令，含 17 条回归用例模板

### Changed
- Wiki 策略从在线优先切换为本地优先 + 在线回退（默认源 `genshin-story`，自动回退至 `bwiki-online`）
- 将 GenshinStory 缓存从主仓库迁移至独立仓库 `Furinelle/genshinstory-cache`

## [1.9.0] - 2026-04-30

### Added
- 本地 Genshin Impact wiki 缓存支持（`furina_resource/` 目录）
- 索引化 wiki 搜索与探索功能（`furina-wiki.mjs`）

### Changed
- Wiki 查询切换为本地优先，在线源作备用

## [1.8.0] - 2026-04-29

### Improved
- Furina 语音风格与记忆行为整体优化
- 记忆运行时稳定性改进与文档完善
- 记忆整合设置说明补充

## [1.7.0] - 2026-04-28

### Added
- 原生 Claude Code Skills 支持（`.claude/skills/`）
- 外部 Genshin wiki 查询功能（`furina-wiki.mjs`）
- 跨平台 Furina 资源共享支持（Claude Code、Codex 等）

### Changed
- 简化 Furina skill 安装说明
- 对齐项目文档与元数据

[Unreleased]: https://github.com/Furinelle/furina/compare/v1.15.0...HEAD
[1.15.0]: https://github.com/Furinelle/furina/compare/v1.14.0...v1.15.0
[1.14.0]: https://github.com/Furinelle/furina/compare/v1.13.0...v1.14.0
[1.13.0]: https://github.com/Furinelle/furina/compare/v1.12.0...v1.13.0
[1.12.0]: https://github.com/Furinelle/furina/compare/v1.11.0...v1.12.0
[1.11.0]: https://github.com/Furinelle/furina/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/Furinelle/furina/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/Furinelle/furina/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/Furinelle/furina/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/Furinelle/furina/releases/tag/v1.7.0
