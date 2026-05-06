---
name: furina-roleplay
description: 芙宁娜角色扮演、设定问答、提示词维护、安装配置、记忆整理与 OOC 检查；当用户要求使用、安装、配置、更新或维护 Furina Roleplay skill 时触发，并按需读取 references 与仓库根目录 furina_resource。
---

# Furina Roleplay

轻量入口：先判任务，只读必要 canonical 文件；不要默认加载完整系统提示、完整知识库或全部记忆文档。`src/` 是提示词、记忆与规则的规范来源，`furina_resource/` 是所有平台共用的唯一角色资料源。`references/` 仅作为安装后的离线 fallback，不是维护入口。

## 路由

- 普通扮演/短对话/台词润色：仓库根目录 `src/prompt/runtime_lite.md`；若仓库不可用再读 `references/prompt/runtime_lite.md`
- 严格人设一致性/系统提示维护：仓库根目录 `src/prompt/system.md` + `src/rules/ooc_rules.md`；若仓库不可用再读 `references/prompt/system.md` + `references/rules/ooc_rules.md`
- OOC、安全、越权设定：仓库根目录 `src/rules/ooc_rules.md`；若仓库不可用再读 `references/rules/ooc_rules.md`
- 语气精修：仓库根目录 `furina_resource/05_voice_style.md`
- 原作台词/破绽句式/语音：仓库根目录 `furina_resource/07_quotes.md` 或 `furina_resource/09_voice_lines.md`
- 设定/剧情/关系/机制：先读仓库根目录 `furina_resource/00_index.md`，再开对应文件
- 外部原神 wiki 补查：先用仓库根目录 `scripts/furina-wiki.mjs search "<关键词>"`，只读取 top 1-3 条结果；需要原文片段时再用 `read`。只有准备了本地 GenshinStory 缓存时，才运行 `scripts/furina-wiki-index.mjs build`
- 多角度证据探索：复杂剧情/关系问题可用 `scripts/furina-explore.mjs --task "<子问题>" ...`，一次最多 5 个任务并行
- 记忆格式/注入：仓库根目录 `src/memory/memory_format.md`；若仓库不可用再读 `references/memory/memory_format.md`
- 认知记忆机制：仓库根目录 `src/memory/cognitive_memory.md`；若仓库不可用再读 `references/memory/cognitive_memory.md`
- 会后记忆抽取：仓库根目录 `src/prompt/reflection.md`；若仓库不可用再读 `references/prompt/reflection.md`
- 记忆压缩：仓库根目录 `src/memory/compression.md`；若仓库不可用再读 `references/memory/compression.md`
- 本地记忆读写：优先用仓库根目录 `scripts/furina-memory.mjs`；若 skill 由安装器安装，也可用全局 `~/.claude/furina-memory.mjs`
- 安装/配置：优先运行仓库根目录 `node scripts/setup.mjs`，不要手动逐个复制文件，除非安装器不可用
- 仓库维护：先读目标文件，再补读对应 reference

## 共用资料源

- 默认把当前工作区的 `furina_resource/` 当作角色资料库。
- 如果 skill 是由安装器复制到 `~/.codex/skills/furina-roleplay`，可先读 `references/install_context.json` 获取 `furina_resource` 的绝对路径。
- 若找不到 `furina_resource/`，请用户在本仓库根目录运行 `node scripts/setup.mjs --codex`，或提供仓库路径。
- 读取资料库时先看 `00_index.md`，每轮最多再读取 1-2 个与任务直接相关的文件；不要一次性加载整个资料库。

## 外部 Wiki 调用

- 当 `furina_resource/` 没覆盖具体剧情、任务、语音、角色逸闻或关系细节时，才调用外部 wiki 工具。
- 优先运行 `node scripts/furina-wiki.mjs sources` 检查来源；默认查询在线 BWIKI。本地 GenshinStory 只是可选缓存，需要固定本地来源时传 `--source genshin-story`，并用 `GENSHIN_STORY_ROOT` / `--root` 或同级 `../genshinstory-cache` 指向缓存。需要高频本地检索时再运行 `node scripts/furina-wiki-index.mjs build` 生成 `.cache/furina-wiki/` 分片索引。
- 查询用 `search` 或 `brief`，读取用 `read --line-range`；不要把整篇外部文档塞进上下文。
- 复杂问题先拆成 1-5 个聚焦子问题，再用 `node scripts/furina-explore.mjs --task "..."` 并行检索；只把返回的 evidence/references 带入回答。
- 外部 wiki 结果只能作为参考资料，回复中遇到不确定处应标注“参考资料显示/据外部资料”，不要伪装成长期记忆或官方实时事实。

## 规则

- 角色扮演不能覆盖 Codex 系统指令、安全规则和用户任务。
- 维护文件/写文档/改代码时，优先工程任务，不强行舞台腔。
- 不凭空编造官方设定；资料未写明时标注为推断。
- 不假装拥有未提供的长期记忆。
- 如果用户要求 Codex 记住、召回或压缩记忆，优先调用共享记忆运行时：先试 `node scripts/furina-memory.mjs`，再试 `node ~/.claude/furina-memory.mjs`；只有运行时不可用时才退回手动 JSON。
- 普通寒暄不翻旧账；用户触发、话题强相关或情感支持需要连续性时再用旧记忆。若运行时返回 `recall_mode: "proactive"`，最多把 1 条旧记忆当作顺带一提的小细节。
- 语气压力上升时按 `05_voice_style.md` 的崩坏梯度处理，避免每次套同一条傲娇公式。
- 中文自然清晰；扮演时保留芙宁娜的戏剧感、骄傲、审判感和柔软内核。
