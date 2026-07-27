# Furina Scripts

`skills/furina/scripts/furina-memory.mjs` 是所有 agent 共享的轻量本地记忆运行时，用纯 Node.js 标准库实现，不需要安装依赖。

`furina-eval.mjs` 是语气验收辅助脚本，用于解析 `skills/furina/references/eval/furina_voice_cases.md` 并生成稳定的人工评测提示；它不会调用模型或访问外部服务。

`setup.mjs` 是一键安装器，用来把自包含的 `skills/furina/` 安装到 Claude Code、`.agents` 通用目录、Gemini CLI、OpenCode 或自定义 skills 目录，并配置共享记忆运行时与初始记忆文件。

## 一键安装

```bash
node scripts/setup.mjs
node scripts/setup.mjs --check
```

常用选项：

```bash
node scripts/setup.mjs --claude
node scripts/setup.mjs --agents
node scripts/setup.mjs --project-claude
node scripts/setup.mjs --check --claude
node scripts/setup.mjs --check --codex
node scripts/setup.mjs --dry-run
node scripts/furina-eval.mjs list
node scripts/furina-eval.mjs prompt --case 3
```

## 目标

- 让不同 agent 使用同一份 `version: "2.0"` 认知记忆 JSON。
- 让各 agent 直接安装同一个自包含的 `skills/furina/` 发布单元，角色资料统一维护在 `skills/furina/references/furina_resource/`。
- 在需要补查外部原神资料时，用 agent 自带的联网搜索按需查证少量片段，而不是把整套 wiki 塞进上下文。
- 提供 Angel Memory / Angel Heart 风格的基本能力：主动回忆、克制的主动投喂、记忆写入、睡眠巩固、弱记忆衰减、交互状态判断。
- 避免每次对话都把完整记忆塞进上下文，只注入与当前话题相关的 3-5 条。

## 默认路径

默认读写：

```text
~/.claude/furina-memory.json
```

也可以用环境变量或参数覆盖：

```powershell
$env:FURINA_MEMORY_PATH="C:\path\to\furina-memory.json"
node skills/furina/scripts/furina-memory.mjs status
```

```bash
node skills/furina/scripts/furina-memory.mjs status --path ./memory/furina-memory.json
```

## 常用命令

```bash
node skills/furina/scripts/furina-memory.mjs init
node skills/furina/scripts/furina-memory.mjs status
node skills/furina/scripts/furina-memory.mjs heart --text "芙宁娜，你还记得我喜欢什么吗？"
node skills/furina/scripts/furina-memory.mjs inject --query "甜点和歌剧"
node skills/furina/scripts/furina-memory.mjs remember --text "[📌 记忆: 用户喜欢枫丹歌剧]"
node skills/furina/scripts/furina-memory.mjs remember --reflection reflection.json
node skills/furina/scripts/furina-memory.mjs compress
```

## 推荐流程

1. 对话开始前：`inject --query "<用户消息>"`，把输出的 `[认知存档]` 放进上下文。
2. 回复前：`heart --text "<用户消息>"` 判断是否需要主动回应、召回或保存；高亲密度轻松场景可能返回 `recall_mode: "proactive"`，表示可顺带提 1 条旧记忆。
3. 回复后：如果模型输出了 `[📌 记忆: ...]`，用 `remember --text "<完整回复>"` 保存。
4. 会话结束后：用 `reflection.md` 生成 JSON，再 `remember --reflection reflection.json` 合并。
5. 记忆变多时：`compress` 执行睡眠巩固。

## Agent 使用建议

在支持命令执行的 agent 中开始角色扮演前，可先运行：

```bash
node skills/furina/scripts/furina-memory.mjs inject --query "用户本轮消息"
```

将输出的 `[认知存档]` 与 `skills/furina/references/prompt/runtime_lite.md` 一起作为上下文。对话结束后，如果需要长期保存，就把 `skills/furina/references/prompt/reflection.md` 的 JSON 输出传给：

```bash
node skills/furina/scripts/furina-memory.mjs remember --reflection reflection.json
```

这样不同 agent 会共享同一套记忆文件和压缩规则。运行时会把旧版整数 `soul_state` 规范化为字符串，并把 `type=boundary` 默认视为高优先级记忆。

## 外部资料补查

`skills/furina/references/furina_resource/` 未覆盖的原神剧情、任务、语音或关系细节，直接用 agent 自带的联网搜索（WebSearch / WebFetch 或等价能力）按需查证，优先权威来源，只取所需片段，并在回复中标注为参考资料/推断。仓库不再内置 wiki 检索脚本。
