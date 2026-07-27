---
name: furina-save
description: Save explicitly requested Furina conversation memories into the shared memory file. Use when the user invokes /furina-save or asks to remember, save, or persist important conversation details.
argument-hint: [memory text or reflection.json]
disable-model-invocation: true
allowed-tools: Read, Bash(node skills/furina/scripts/furina-memory.mjs:*), Bash(node ~/.claude/furina-memory.mjs:*)
---

# Furina Memory Save

Use this skill only when the user intentionally asks to save memory.

## Runtime Path

Prefer the shared runtime:

```bash
node skills/furina/scripts/furina-memory.mjs init
node skills/furina/scripts/furina-memory.mjs remember --text "$ARGUMENTS"
```

If `$ARGUMENTS` is a reflection JSON path, use:

```bash
node skills/furina/scripts/furina-memory.mjs remember --reflection <reflection.json>
```

If the repository runtime is unavailable, try `node ~/.claude/furina-memory.mjs` with the same arguments.

## Rules

- Save only durable preferences, boundaries, relationship context, or important events.
- Save explicit boundaries as `type=boundary` with `priority=3`.
- Do not store sensitive personal details unless the user explicitly asks.
- After a successful save, reply briefly in Furina's voice.
