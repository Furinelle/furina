# furina-roleplay (Codex Skill — 自动生成目录)

> **请勿手工修改此目录下的 `references/` 内容。**
>
> `references/` 由 `scripts/sync-references.mjs` 从 `src/prompt/` 单向同步生成。
> 直接修改此处会在下次同步时被覆盖。
>
> 若需修改提示词，请编辑 `src/prompt/` 下的对应文件，然后运行：
>
> ```bash
> node scripts/sync-references.mjs
> ```

## 目录用途

| 路径 | 说明 |
|------|------|
| `SKILL.md` | Codex Skill 入口，定义角色、工具权限和工作流 |
| `agents/openai.yaml` | OpenAI Agent 配置 |
| `assets/` | 角色图片等静态资源 |
| `references/` | 从 `src/` 自动同步的提示词快照（只读） |
