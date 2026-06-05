# Furina for Hermes Agent

芙宁娜·德·枫丹角色扮演 Skill 的 **Hermes Agent 专用分支**。

本分支只维护 Hermes 的默认身份、Agent Skill、本地资料路由、联网补查和
Mnemosyne 长期关系记忆。Claude Code / Codex 版本在 `main`，AstrBot 版本在
`feat/astrbot-adapter`。

![芙宁娜头像](assets/IMG_1877.jpg)

## 分支职责

| 分支 | 平台 | 重点 |
|------|------|------|
| `main` | Claude Code + Codex | 原生 skills、共享 JSON 认知记忆 |
| `feat/astrbot-adapter` | AstrBot | Persona、Skill、Angel Memory / LivingMemory |
| `codex/hermes-furina-adapter` | Hermes Agent | SOUL、Hermes Skill、Mnemosyne、Exa |

三个分支共用同一套 `src/` 人格规则和 `furina_resource/` 资料结构，但各分支
只保留本平台适配代码。

## 特性

- `hermes/SOUL.md`：让 Hermes 默认以芙宁娜身份对话。
- `hermes/skills/furina-roleplay/SKILL.md`：按任务读取 1-2 个必要资料文件。
- `furina_resource/`：本地优先的结构化芙宁娜资料库。
- 联网补查：本地不足时使用 Hermes `web_search` / `web_extract`，有
  `EXA_API_KEY` 时优先 Exa。
- Mnemosyne 统一记忆：偏好、长期目标、重要见闻和关系互动直接通过
  `mnemosyne` 工具保存；不再使用技能标记或 Hermes 内置
  `MEMORY.md` / `USER.md`。
- 固定记录 `preference-furina-intimacy` 是 Hermes 亲密度的唯一权威来源。
- 同人关系成长：`0-4` 保持距离，`5-6` 留下真诚可能，`7-8` 接受但保留
  少量矜持，`9-10` 坦率接受告白。
- OOC 约束：默认自称“我”；不把芙卡洛斯的完整记忆和履历直接移植给芙宁娜；
  创伤场景自然收短，不套临床诊断和固定模板。

## 安装

要求：

- Node.js 18+
- Hermes Agent
- 能执行 `python3 -c "import mnemosyne"` 的 Python

```bash
node scripts/setup.mjs
node scripts/setup.mjs --check
```

安装器会：

1. 安装或启用 Hermes Mnemosyne memory provider。
2. 备份不同的旧 `~/.hermes/SOUL.md`，再安装芙宁娜默认身份。
3. 将仓库 `hermes/skills` 合并进 `skills.external_dirs`。
4. 关闭 Hermes 内置 `MEMORY.md` / `USER.md` 注入与后台记忆提醒。
5. 初始化固定关系记录，不重复创建亲密度记忆。
6. 在 Exa 密钥存在且搜索后端为空时设置 Exa 优先。

如需从旧版 Furina JSON 一次性迁移亲密度：

```bash
node scripts/setup.mjs \
  --legacy-memory-path "$HOME/.claude/furina-memory.json"
```

完整配置和排障见 [SETUP_GUIDE.md](SETUP_GUIDE.md)。

## 使用

安装后开启新的 Hermes 会话：

```bash
hermes -z "请用一句话介绍你自己。"
hermes skills list
hermes memory status
```

查询当前关系状态：

```bash
node scripts/furina-relationship.mjs status --format inject
```

只在用户明确要求或发生持久关系里程碑时调整：

```bash
node scripts/furina-relationship.mjs adjust 1 --reason "共同经历了持久的关系里程碑"
node scripts/furina-relationship.mjs set 9 --reason "明确校准长期关系状态"
```

普通聊天不自动加分。Hermes 不应从旧 JSON、模糊回忆或另一条 Mnemosyne
记录推断亲密度。

角色互动与普通长期信息也只有 Mnemosyne 一层：Skill 不输出
`[📌 记忆: ...]`，Hermes 不使用内置 `memory` 工具另存副本。

## 资料检索顺序

```text
src/prompt/ 与 src/rules/
  -> furina_resource/00_index.md
  -> 1-2 个相关本地资料文件
  -> Hermes web_search / web_extract
```

外部资料优先官方 HoYoverse 页面、视频和游戏文本。社区 wiki 只作定位辅助，
回答中应区分本地资料、外部资料和推断。

## 目录

| 路径 | 内容 |
|------|------|
| `hermes/SOUL.md` | Hermes 全局默认身份 |
| `hermes/skills/furina-roleplay/` | Hermes Agent Skill |
| `scripts/setup.mjs` | Hermes-only 安装和检查 |
| `scripts/furina-relationship.mjs` | Mnemosyne 固定关系状态命令 |
| `src/` | 人格、语气、OOC 与敏感话题规则 |
| `furina_resource/` | 结构化角色资料 |
| `eval/` | 语气与关系分支验收用例 |
| `config/` | Hermes 分支配置与元数据 |
| `tests/` | Hermes 安装、资源、关系记忆和人格测试 |

## 资料来源与声明

- 官方校对参考 HoYoverse 角色 PV、角色演示、角色故事与游戏内文本。
- 社区补充参考萌娘百科芙宁娜条目，使用与再分发时请遵守原站声明。
- 本项目是同人创作与提示词工程实践。芙宁娜、《原神》及相关角色版权归
  miHoYo / HoYoverse 所有。

## License

[MIT License](LICENSE)
