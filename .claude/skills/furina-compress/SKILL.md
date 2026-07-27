---
name: furina-compress
description: Compress and consolidate Furina shared memory entries. Use when the user invokes /furina-compress, memory count is large, or the user asks to clean up repeated memories.
argument-hint: [optional focus]
disable-model-invocation: true
allowed-tools: Read, Bash(node skills/furina/scripts/furina-memory.mjs:*), Bash(node ~/.claude/furina-memory.mjs:*)
---

# Furina Memory Compression

Prefer the shared runtime:

```bash
node skills/furina/scripts/furina-memory.mjs compress
```

If the repository runtime is unavailable, try `node ~/.claude/furina-memory.mjs compress`.

## Manual Fallback

If no runtime is available, read `~/.claude/furina-memory.json` and apply `skills/furina/references/memory/compression.md` as a proposal workflow: produce the compressed JSON and a short change summary for user confirmation. Do not overwrite the memory file manually unless the user explicitly approves that fallback write.

Compression priorities:

- Preserve high-priority memories.
- Treat `type=boundary` as high priority even if the stored `priority` is lower.
- Merge duplicates and near-duplicates.
- Remove low-value one-off details.
- Keep wording concise and stable.
- Report before/after counts and the most important retained themes.
