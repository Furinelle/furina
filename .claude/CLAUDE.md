# Furina Roleplay Project

通用项目说明与维护原则见仓库根目录 [AGENTS.md](../AGENTS.md)——本文件只补充 Claude Code 专属部分。

## 斜杠命令

| 命令 | 用途 |
|------|------|
| `/furina` | 芙宁娜角色扮演（薄入口，规范内容在 `skills/furina/SKILL.md`） |
| `/furina-save` | 手动保存关键记忆 |
| `/furina-reflect` | 从对话记录提取结构化记忆 JSON |
| `/furina-compress` | 压缩和整理记忆条目 |

## 安装到个人目录（可选）

```bash
node scripts/setup.mjs --claude
node scripts/setup.mjs --check --claude
```

skills / commands 保留 `$ARGUMENTS`，让斜杠命令后的文本进入提示词。
