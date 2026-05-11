# Furina AstrBot Plugin

本目录是可直接部署到 AstrBot 的原生插件，面向已安装 Angel Heart、Angel Memory 和 LivingMemory 的环境。

## 目录结构

```
astrbot/
├── main.py                              # AstrBot 插件入口（Star 子类）
├── metadata.yaml                        # 插件元数据（display_name、astrbot_version 等）
├── requirements.txt                     # Python 依赖（当前为空）
├── _conf_schema.json                    # 可选配置 schema（persona_name、angel_memory_scope）
├── skills/
│   └── furina/
│       └── SKILL.md                     # AstrBot Skill Manager 技能定义
├── persona/
│   └── furina-astrbot-persona.md        # 配置到"芙宁娜"人格的系统提示词
├── angel_memory/
│   ├── furina_notes.md                  # 放入 Angel Memory 知识库的短条目卡片
│   └── furina_core_memories.json        # 通过 Angel Memory Debug Tool 导入的核心记忆
└── configs/
    └── astrbot_plugins.example.json     # Angel Heart / Angel Memory / LivingMemory 配置参考
```

## 部署步骤

1. 将本目录（`astrbot/`）整体复制到 AstrBot 的插件目录 `data/plugins/furina/`
2. 重启 AstrBot，插件会被自动发现并加载（`metadata.yaml` 声明了 display_name 和版本要求）
3. 在 AstrBot 管理界面创建或选择 persona 名称：`芙宁娜`
4. 将 `persona/furina-astrbot-persona.md` 的内容粘贴为该 persona 的系统提示词
5. 在 Angel Memory 配置里设置 `conversation_scope_map`，让 `芙宁娜` 映射到 `furina`
6. 将 `angel_memory/furina_notes.md` 加入 Angel Memory 知识库（建议路径 `raw/芙宁娜/furina_notes.md`），重启插件同步索引
7. （可选）打开 Angel Memory Debug Tool，导入 `angel_memory/furina_core_memories.json`

## 插件命令

| 命令 | 说明 |
|------|------|
| `/furina_status` | 检查插件文件加载状态 |

## 协作边界

| 插件 | 负责内容 |
|------|----------|
| Angel Heart | 回复时机、四状态切换（不在场 / 被呼唤 / 混脸熟 / 观测中） |
| Angel Memory | 角色核心设定、短知识卡、主动核心记忆 |
| LivingMemory | 会话历史、用户长期互动事实、persona/session 隔离 |
| 本插件 | 人格提示词、知识卡、协作配置示例；不重复实现以上插件的已有能力 |

## 刷新适配包

如果修改了 `src/prompt/` 或角色知识库，可重新生成 persona 和知识卡：

```powershell
node .\scripts\furina-astrbot.mjs generate --out astrbot
node .\scripts\furina-astrbot.mjs check --out astrbot
```

`main.py`、`metadata.yaml`、`requirements.txt`、`_conf_schema.json`、`skills/` 是静态文件，`generate` 命令不会覆盖它们。
