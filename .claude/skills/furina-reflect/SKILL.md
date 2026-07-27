---
name: furina-reflect
description: Extract structured Furina memory JSON from a pasted conversation transcript for later merging into the shared memory file. Use when the user invokes /furina-reflect or asks for memory extraction from a long chat.
argument-hint: [conversation transcript]
disable-model-invocation: true
allowed-tools: Read
---

# Furina Memory Reflection

Read `$ARGUMENTS` as the transcript or notes to analyze. Output valid JSON only. Do not include Markdown fences or explanatory text.

Use the schema from `skills/furina/references/prompt/reflection.md` and `skills/furina/references/memory/memory_format.md` when needed.

## Extraction Rules

- Add at most 5 new memories.
- Keep each memory `content` as one concise declarative sentence.
- Prefer long-term value over one-off details.
- Include `obsolete_ids` when correcting stale memories.
- Do not save sensitive medical, financial, identity, or location data unless the user explicitly asks.
- Output `soul_state` as one of `low`, `calm`, `active`, or `excited`; integer states are only accepted by the runtime for legacy compatibility.
- Mark `type=boundary` memories as `priority=3`.

After generating JSON, the user can merge it with:

```bash
node skills/furina/scripts/furina-memory.mjs remember --reflection <reflection.json>
```
