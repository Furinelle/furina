# Furina for AstrBot

芙宁娜·德·枫丹角色扮演 Skill 的 **AstrBot 专用分支**。

本分支只维护 AstrBot Skill、Persona、知识库资料、Angel Heart /
Angel Memory / LivingMemory 协作配置与可选原生插件入口。Claude Code /
Codex 在 `main`，Hermes Agent 在 `codex/hermes-furina-adapter`。

![芙宁娜头像](assets/IMG_1877.jpg)

## 分支职责

| 分支 | 平台 |
|------|------|
| `main` | Claude Code + Codex |
| `feat/astrbot-adapter` | AstrBot |
| `codex/hermes-furina-adapter` | Hermes Agent |

三个分支共用最新的 `src/` 人格规则和 `furina_resource/` 资料结构，各自只
保留本平台适配。

## 组成

- `astrbot/skills/furina/SKILL.md`：AstrBot Skill。
- `astrbot/persona/furina-astrbot-persona.md`：默认 Persona。
- `astrbot/angel_memory/`：短知识卡与核心记忆导入包。
- `astrbot/configs/astrbot_plugins.example.json`：插件配置参考。
- `astrbot/main.py` 与 `metadata.yaml`：可选原生插件入口。
- `furina_resource/`：上传到 AstrBot 知识库的结构化资料。

## 人格更新

- 默认自称“我”，“本神”只作偶尔滑口、自嘲或舞台残留。
- 不把芙卡洛斯的完整记忆、神性履历与计划视角赋给芙宁娜。
- 创伤话题自然缩短、停顿或设边界，不下临床诊断，不强制固定字数。
- 同人关系成长保留：`7-8` 接受告白但保留少量体面，`9-10` 坦率接受。
- 本地知识库优先；不足时使用 AstrBot 已配置的联网工具，不依赖仓库 wiki
  脚本。

## 生成与检查

需要 Node.js 18+：

```bash
node scripts/furina-astrbot.mjs generate --out astrbot
node scripts/furina-astrbot.mjs check --out astrbot
node --test tests/astrbot.test.mjs
```

完整部署见 [SETUP_GUIDE.md](SETUP_GUIDE.md)。

## 记忆职责

| 组件 | 权责 |
|------|------|
| Angel Heart | 群聊回复时机与四状态 |
| Angel Memory | 角色核心事实、短知识卡、明确的关系状态 |
| LivingMemory | 用户长期事实、历史事件与会话连续性 |
| AstrBot 知识库 | 原作设定、台词、关系与语气资料 |

亲密度的精确值应由 Angel Memory 中当前 `scope=furina` 的明确记录提供；
LivingMemory 只提供历史证据，不应另造一个竞争分数。普通聊天不自动加分。

## 资料检索

1. 用 `astr_kb_search` 查询知识库 `furina resource`。
2. 每轮只取少量直接相关片段。
3. 本地不足时再调用 AstrBot 可用的联网/web 搜索工具。
4. 区分本地资料、外部资料和推断，不把搜索结果说成亲身记忆。

## License

[MIT License](LICENSE)
