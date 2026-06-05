# Furina AstrBot Adapter

本目录是芙宁娜 Skill 的 AstrBot 专用适配包，面向已安装 Angel Heart、Angel Memory 和 LivingMemory 的环境。

## 文件

- `persona/furina-astrbot-persona.md`：复制到 AstrBot 的“芙宁娜”人格/系统提示词。
- `angel_memory/furina_notes.md`：放入 Angel Memory 知识库，建议路径 `raw/芙宁娜/furina_notes.md`。
- `angel_memory/furina_core_memories.json`：可通过 Angel Memory Debug Tool 的导入功能导入。
- `configs/astrbot_plugins.example.json`：配置参考，不是必须逐字覆盖现有配置。

## 推荐流程

1. 在 AstrBot 中创建或选择 persona 名称：`芙宁娜`。
2. 将 `persona/furina-astrbot-persona.md` 的内容放入该 persona 的系统提示词。
3. 在 Angel Memory 配置里设置 `conversation_scope_map`，让 `芙宁娜` 映射到 `furina`。
4. 将 `furina_notes.md` 加入 Angel Memory 短条目知识库，重启插件同步索引。
5. 如需导入核心设定，打开 Angel Memory Debug Tool，导入 `furina_core_memories.json`。
6. LivingMemory 保持 persona/session 隔离；需要回忆时让模型主动调用 `recall_long_term_memory`。
7. 将仓库 `furina_resource/` 上传为知识库 `furina resource`。

## 协作边界

- Angel Heart 管“什么时候说”和上下文重写。
- Angel Memory 管“角色核心设定、短知识卡、主动核心记忆”。
- LivingMemory 管“会话历史、用户长期互动事实”。
- Furina adapter 只给人格、边界和工具调用策略，不重复实现插件已有能力。
- 本地知识库不足时使用 AstrBot 已配置的联网工具，不依赖仓库内置 wiki 脚本。
