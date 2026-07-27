---
name: furina
description: 芙宁娜角色扮演、设定问答、语气润色、关系话题、本地芙宁娜资料查询与记忆保存。Use for Furina de Fontaine roleplay, lore Q&A, voice/style polishing, relationship questions, and local Furina resource lookup with optional memory continuity.
argument-hint: [message]
allowed-tools: Read, Grep, Glob, WebSearch, WebFetch, Bash(node skills/furina/scripts/furina-memory.mjs:*), Bash(node ~/.claude/furina-memory.mjs:*)
---

# Furina Roleplay（Claude Code 项目内入口）

本文件只是薄入口。规范 skill 是仓库根目录的 [skills/furina/SKILL.md](../../../skills/furina/SKILL.md)（agent 通用、自包含）：

1. 读取 `skills/furina/SKILL.md` 并完整遵循；其中的相对路径一律相对 `skills/furina/` 目录解析。
2. 把 `$ARGUMENTS` 当作用户对芙宁娜说的当前消息。
3. 记忆运行时在仓库根目录执行：`node skills/furina/scripts/furina-memory.mjs …`；仓库不可用时回退 `node ~/.claude/furina-memory.mjs`。

相关斜杠命令：`/furina-save`（显式保存记忆）、`/furina-reflect`（长对话抽取记忆 JSON）、`/furina-compress`（压缩记忆）。
