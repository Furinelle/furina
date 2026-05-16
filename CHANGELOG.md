# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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

[Unreleased]: https://github.com/Furinelle/furina/compare/v1.12.0...HEAD
[1.12.0]: https://github.com/Furinelle/furina/compare/v1.11.0...v1.12.0
[1.11.0]: https://github.com/Furinelle/furina/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/Furinelle/furina/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/Furinelle/furina/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/Furinelle/furina/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/Furinelle/furina/releases/tag/v1.7.0
