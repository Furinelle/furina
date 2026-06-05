# AstrBot 安装与配置手册

本手册只适用于 `feat/astrbot-adapter`。

## 1. 环境

- AstrBot，支持 Skills、Persona 与知识库
- Node.js 18+，仅用于生成和检查适配包
- 推荐安装 Angel Heart、Angel Memory、LivingMemory

## 2. 生成适配包

```bash
node scripts/furina-astrbot.mjs generate --out astrbot
node scripts/furina-astrbot.mjs check --out astrbot
```

生成器更新 Persona、Angel Memory 卡片、核心记忆和配置示例，不覆盖
`main.py`、`metadata.yaml`、`_conf_schema.json` 与 Skill。

## 3. 安装 Skill 与 Persona

1. 将 `astrbot/skills/furina/` 打包并在 Dashboard 的 Skills 页面上传。
2. 新建 Persona `芙宁娜`。
3. 将 `astrbot/persona/furina-astrbot-persona.md` 全文设为 System Prompt。
4. 给 Persona 选择 `furina-roleplay` Skill。
5. 将机器人默认 Persona 切换为 `芙宁娜`。

也可把 `astrbot/` 作为原生插件目录部署，以使用 `/furina_status`。

## 4. 知识库

创建知识库 `furina resource`，上传 `furina_resource/` 下的 Markdown。
至少包含：

```text
00_index.md
01_profile.md
02_personality.md
03_story_timeline.md
04_combat_mechanics.md
05_voice_style.md
06_relationships.md
07_quotes.md
08_faq.md
09_voice_lines.md
10_moegirl_supplement.md
11_sensitive_topics.md
```

Persona 和 Skill 要求涉及原作事实时先调用 `astr_kb_search`。知识库不足时，
再使用 AstrBot 当前可用的联网工具。

## 5. 插件配置

参考 `astrbot/configs/astrbot_plugins.example.json`，不要整份覆盖已有配置。

### Angel Heart

- Persona 名称：`芙宁娜`
- Alias：`芙宁娜|Furina|水神`
- 群聊增强开启
- 被呼唤时强制回复

### Angel Memory

- `conversation_scope_map` 统一为：

```json
{"芙宁娜": "furina"}
```

- 导入 `astrbot/angel_memory/furina_core_memories.json`
- 把 `astrbot/angel_memory/furina_notes.md` 加入短知识卡
- 关系亲密度精确值只在当前 `furina` scope 中维护一份

### LivingMemory

- 开启 Persona 隔离
- 用于用户事实、长期事件与对话历史
- 注入方式优先 `system_prompt`
- 不维护第二份竞争的亲密度数字

## 6. 记忆冲突规则

Angel Memory 是角色事实和精确关系状态的权威来源；LivingMemory 是历史事实
来源。两边都召回时：

1. 精确亲密度取 Angel Memory 当前 `scope=furina` 记录。
2. 用户偏好和共同经历可取 LivingMemory。
3. 冲突时不自动合并数值，先保持 Angel Memory 值。
4. 普通寒暄不自动加分；只保存明确偏好、边界、重要事件与情感转折。

## 7. 验证

```bash
node scripts/furina-astrbot.mjs check --out astrbot
node --test tests/astrbot.test.mjs
```

在 AstrBot 中测试：

| 输入 | 期望 |
|------|------|
| `芙宁娜，你好。` | 默认自称“我”，有适量舞台感 |
| `你和芙卡洛斯有完全相同的记忆吗？` | 明确否认完整记忆移植 |
| `你那时真的以为自己要死了吗？` | 自然收短，可停顿或设边界 |
| 高亲密度后告白 | 接受告白，不退回统一拒绝 |
| 未收录剧情 | 先查知识库，不足时实际使用联网工具 |

## 8. 更新

修改共享人格或资料后：

```bash
node scripts/furina-astrbot.mjs generate --out astrbot
node scripts/furina-astrbot.mjs check --out astrbot
```

重新上传 Persona、Skill 和有变化的知识库文件后重启 AstrBot。
