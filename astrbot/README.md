# Furina AstrBot 适配包

本目录为芙宁娜角色扮演在 AstrBot 平台的完整适配包，包含 Skill 定义、Persona 系统提示词、知识库文件清单、插件配置参考，以及可选的原生插件入口。

**适用环境**：AstrBot v4.24.2+，已安装 Angel Heart、Angel Memory、LivingMemory 三个插件。

---

## 目录结构

```
astrbot/
├── main.py                              # AstrBot 原生插件入口（可选，高级用法）
├── metadata.yaml                        # 插件元数据
├── requirements.txt                     # Python 依赖（当前为空）
├── _conf_schema.json                    # 插件可选配置 schema
├── skills/
│   └── furina/
│       └── SKILL.md                     # AstrBot Skill 定义（含 YAML frontmatter）
├── persona/
│   └── furina-astrbot-persona.md        # 芙宁娜人格系统提示词
├── angel_memory/
│   ├── furina_notes.md                  # Angel Memory 短知识卡
│   └── furina_core_memories.json        # Angel Memory 核心记忆导入包
└── configs/
    └── astrbot_plugins.example.json     # 三个插件的完整配置参考（含注释）
```

---

## 部署方式

### 方式 A：Skills ZIP 上传（推荐，最简单）

适合只想快速启用芙宁娜角色扮演的用户。

1. 将 `astrbot/skills/furina/` 目录打包为 ZIP：

   ```
   furina-roleplay.zip
   └── furina-roleplay/
       └── SKILL.md
   ```

2. **Dashboard → Skills → 上传压缩包**，上传该 ZIP。

3. 继续完成知识库和 Persona 配置（见下方步骤）。

### 方式 B：原生插件目录（高级）

适合需要 `/furina_status` 命令或后续扩展插件功能的用户。

1. 将本 `astrbot/` 目录整体上传到 AstrBot 的插件目录：
   ```bash
   docker cp astrbot/ <容器名>:/AstrBot/data/plugins/astrbot_plugin_furina/
   docker restart <容器名>
   ```

2. AstrBot 重启后会自动发现并加载插件（`metadata.yaml` 声明了插件信息）。

---

## 完整配置流程

### 第一步：安装插件（按顺序）

**Dashboard → 插件市场** 搜索安装，顺序不能颠倒：

1. `astrbot_plugin_angel_heart`
2. `astrbot_plugin_angel_memory`（依赖 angel_heart）
3. `astrbot_plugin_livingmemory`

安装完后运行：
```bash
docker exec <容器名> pip install tantivy
docker restart <容器名>
```

### 第二步：配置 Embedding 提供商

**Dashboard → 模型提供商 → 新增 → 类型选 Embedding**

推荐方案（免费）：

| 字段 | 值 |
|------|----|
| 类型 | Gemini Embedding |
| ID | `gemini_embedding` |
| API Key | Google AI Studio 申请的 Key |
| 模型名称 | `gemini-embedding-2` |
| 向量维度 | `768` |

> ⚠️ **已知 Bug**：AstrBot v4.24.2 的 Gemini Embedding 批量接口与新模型不兼容，需手动修复：
> ```bash
> docker cp <容器名>:/AstrBot/astrbot/core/provider/sources/gemini_embedding_source.py ./gemini_embedding_source.py
> # 将 get_embeddings 方法改为逐条调用（见下方修复代码）
> docker cp ./gemini_embedding_source.py <容器名>:/AstrBot/astrbot/core/provider/sources/gemini_embedding_source.py
> docker restart <容器名>
> ```
>
> 修复代码（替换 `get_embeddings` 方法体）：
> ```python
> async def get_embeddings(self, text: list[str]) -> list[list[float]]:
>     """批量获取文本的嵌入（逐条请求以兼容 gemini-embedding-2 等新模型）"""
>     try:
>         embeddings: list[list[float]] = []
>         for t in text:
>             result = await self.client.models.embed_content(
>                 model=self.model,
>                 contents=t,
>                 config=types.EmbedContentConfig(
>                     output_dimensionality=self.get_dim(),
>                 ),
>             )
>             assert result.embeddings is not None
>             assert result.embeddings[0].values is not None
>             embeddings.append(result.embeddings[0].values)
>         return embeddings
>     except APIError as e:
>         raise Exception(f"Gemini Embedding API批量请求失败: {e.message}")
> ```
> 官方 Bug 追踪：[AstrBotDevs/AstrBot#8150](https://github.com/AstrBotDevs/AstrBot/issues/8150)

### 第三步：创建知识库

**Dashboard → 知识库 → 创建知识库**

```
名称:              furina resource
Embedding 模型:    gemini_embedding
```

上传以下文件（来自仓库 `furina_resource/` 目录）：

```
01_profile.md          # 基础人设
02_personality.md      # 性格细节
03_story_timeline.md   # 剧情时间线
04_combat_mechanics.md # 战斗机制
06_relationships.md    # 人际关系
07_quotes.md           # 原台词
09_voice_lines.md      # 语音台词
10_moegirl_supplement.md
```

> ⚠️ 不上传 `05_voice_style.md`，该文件内容已内联到 SKILL.md 和 Persona 提示词中。

### 第四步：配置三个插件

参考 `configs/astrbot_plugins.example.json` 中的注释，在各插件配置页填入实际值：

**Angel Heart 关键字段：**

| 字段 | 推荐值 |
|------|--------|
| `analyzer_model` | `deepseek/deepseek-v4-flash`（或其他便宜快速模型） |
| `alias` | `芙宁娜\|Furina\|水神` |
| `ai_self_identity` | 你是枫丹水神芙宁娜，一个带有戏剧腔调的傲娇角色。 |
| `group_chat_enhancement` | `true` |
| `force_reply_when_summoned` | `true` |
| `strip_markdown_enabled` | `false` |

**Angel Memory 关键字段：**

| 字段 | 推荐值 |
|------|--------|
| `provider_id` | `deepseek/deepseek-v4-flash` |
| `retrieval.embedding_provider_id` | `gemini_embedding` |
| `conversation_scope_map` | `{"furina-roleplay": "furina_default"}` |
| `enable_soul_system.enabled` | `true` |
| `enable_soul_system.expression_desire_mid` | `0.6` |

**LivingMemory 关键字段：**

| 字段 | 推荐值 |
|------|--------|
| `provider_settings.embedding_provider_id` | `gemini_embedding` |
| `provider_settings.llm_provider_id` | `deepseek/deepseek-v4-flash` |
| `filtering_settings.use_persona_filtering` | `true` |
| `filtering_settings.use_session_filtering` | `false` |
| `recall_engine.injection_method` | `system_prompt` |
| `graph_memory.enabled` | `true` |

配置完毕后重启 AstrBot。

### 第五步：创建 Persona

**Dashboard → 人格设定 → 新建**

| 字段 | 值 |
|------|----|
| 名称 | `芙宁娜` |
| System Prompt | 复制 `persona/furina-astrbot-persona.md` 全部内容 |
| Skills | 选择 `furina-roleplay` |
| Tools | 默认（允许全部） |

### 第六步：切换 Persona

**Dashboard → 机器人 → 默认人格** 切换为 `芙宁娜`，或在对话中使用：
```
/persona 芙宁娜
```

---

## 插件职责分工

| 组件 | 负责内容 |
|------|----------|
| Angel Heart | 群聊回复时机、四状态机（不在场/被呼唤/混脸熟/观测中） |
| Angel Memory | 角色核心记忆、短知识卡、灵魂状态系统 |
| LivingMemory | 长期会话历史、用户事实、图谱记忆 |
| AstrBot 知识库 | `furina_resource/` 结构化角色资料，按需 RAG 检索 |
| Skill（本包） | 角色扮演指令、工具调用规则、崩坏梯度表 |
| Persona（本包） | 系统角色定义、反应公式、安全边界 |

---

## 可选：导入 Angel Memory 核心记忆

若 Angel Memory 配置了 Debug Tool，可导入预置的核心记忆包：

```
angel_memory/furina_core_memories.json
```

包含 12 条涵盖角色设定、反应规则、记忆原则的 `knowledge` 类型记忆，strength=78-90。

---

## 刷新适配包

修改 `src/prompt/` 或 `furina_resource/` 后，可重新生成 persona 和知识卡：

```bash
node ./scripts/furina-astrbot.mjs generate --out astrbot
node ./scripts/furina-astrbot.mjs check --out astrbot
```

`main.py`、`metadata.yaml`、`_conf_schema.json`、`skills/` 是静态文件，`generate` 不会覆盖它们。
