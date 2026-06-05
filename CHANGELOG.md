# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> **分支说明**：本文件针对 `feat/astrbot-adapter` 分支。与 `main` 分支共享的脚本和提示词改动会同步过来；AstrBot 专属改动（`astrbot/` 目录、`furina-astrbot.mjs`、部署文档）只在此分支记录。

## [Unreleased]

## [1.17.0] - 2026-06-05

### Changed
- AstrBot 分支改为平台专版，移除 Claude Code、Codex、旧 JSON 运行时与仓库
  wiki 检索层
- 同步最新芙宁娜/芙卡洛斯身份辨析、自然创伤表达和高亲密度告白接受规则
- Persona、Skill 与 Angel Memory 卡片统一默认自称“我”
- Angel Memory scope 统一为 `芙宁娜 -> furina`
- README、部署手册、manifest 与 settings 改为 AstrBot-only

### Removed
- 移除依赖本地 genshinstory-cache 的 wiki 测试和脚本

## [1.13.0] - 2026-05-16

### Fixed
- `furina-memory.mjs`：`similarContent` 子串包含长度阈值从 6 提高到 10，重叠分阈值从 0.65 提高到 0.68，减少短句误合并
- `furina-wiki.mjs`：在线 BWIKI 请求（`fetchJson`/`fetchText`）加入 10 秒超时；超时自动回退本地缓存，不再永久挂起
- `sync-references.mjs`：文件复制操作加入 try/catch，单个文件失败不再中断整批同步

### Refactored
- `furina-wiki.mjs`：移除本地 `queryTerms` 副本，改为从 `furina-wiki-index.mjs` 导入统一实现
- `furina-explore.mjs`：失败任务（`failed` / `timeout`）改为输出到 stderr，状态文本全大写

### Changed
- `furina_resource/05_voice_style.md`：崩坏梯度表替换为指向 `src/prompt/_shared_runtime.md` 的链接，消除双重维护点
- `src/memory/memory_format.md`：主动投喂补充"连续触发时至少跳过 2 轮"频率约束；soul_state 统一为"输出侧字符串 / 输入侧兼容整数"表述
- `src/prompt/reflection.md`：soul_state 规则加入 `src/memory/memory_format.md` 的交叉引用
- `.claude/CLAUDE.md`：维护原则更新，崩坏梯度唯一入口指向 `src/prompt/_shared_runtime.md`

### Docs
- `README.md`（AstrBot 版）：wiki 查询部分说明 10 秒超时行为
- `SETUP_GUIDE.md`（AstrBot 版）：第 5 节新增"在线 wiki 查询长时间没有响应"排障条目

## [1.12.0] - 2026-05-15

### Added
- AstrBot 分支：`tests/wiki.test.mjs` 新增 `queryTerms` 单元测试 + CLI 集成测试

### Improved
- 崩坏梯度表新增「正向例句」列与「禁止出现」列（`_shared_runtime.md`）
- 追加「口吻轴」节（5 轴分类）至回复分寸表
- `runtime_lite.md` 语气自检改为错误→正确对照格式
- `eval/furina_voice_cases.md` 补充 5 组典型对照

### Fixed
- 台词示例修正：消除同一句话「本神」两连

## [1.11.0] - 2026-05-11

### Added（AstrBot 专属）
- `astrbot/skills/furina/SKILL.md`：AstrBot Skill Manager 技能定义，含崩坏梯度表、工具调用规则、OOC 边界
- `astrbot/persona/furina-astrbot-persona.md`：精简版系统提示词（约 60 行，详细规则交 Angel Memory 知识卡）
- `astrbot/angel_memory/furina_notes.md`：Angel Memory 短知识卡
- `astrbot/angel_memory/furina_core_memories.json`：可导入的核心记忆预置
- `astrbot/configs/astrbot_plugins.example.json`：三个插件完整配置参考
- `astrbot/main.py` / `metadata.yaml`：可选原生插件入口
- `scripts/furina-astrbot.mjs`：适配包生成与检查工具
- `tests/astrbot.test.mjs`：原生插件文件测试套件（10 项）

### Fixed（AstrBot 专属）
- `main.py`：修正 filter / logger 导入路径；命令处理函数签名改为 `(self, event: AstrMessageEvent)`
- `metadata.yaml`：字段改为 AstrBot 实际格式（`name` / `description` / `version` / `author` / `repo`）
- `astrbot/README.md`：完整部署手册，含 Gemini Embedding Bug 修复代码

## [1.10.0] - 2026-05-06

### Refactored
- 提取 `_shared_runtime.md` 作为崩坏梯度、灵魂状态、反应公式、回复节奏的单一真值来源
- 提取 `scripts/lib/utils.mjs`，六个脚本共用 `parseArgs`、`expandHome`、`ensureDir`、`ROOT`

### Changed
- Wiki 策略从在线优先切换为本地优先 + 在线回退

[Unreleased]: https://github.com/Furinelle/furina/compare/v1.13.0...feat/astrbot-adapter
[1.13.0]: https://github.com/Furinelle/furina/compare/v1.12.0...v1.13.0
[1.12.0]: https://github.com/Furinelle/furina/compare/v1.11.0...v1.12.0
[1.11.0]: https://github.com/Furinelle/furina/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/Furinelle/furina/releases/tag/v1.10.0
