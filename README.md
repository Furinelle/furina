# Furina de Fontaine Roleplay Skill

芙宁娜·德·枫丹角色扮演资源包——一个遵循 [Agent Skills 开放标准](https://agentskills.io) 的自包含 skill，适用于支持该标准的 AI agent（Claude Code、OpenAI Codex、Gemini CLI、Cursor、OpenCode、Goose、Amp、GitHub Copilot 等）。

它提供：角色提示词与运行时规范、结构化角色知识库、OOC 规则、语气验收用例，以及一个零依赖的长期记忆运行时。目标是让芙宁娜的回复更稳定、更像本人，并在长期互动中保留合适的连续感。

![芙宁娜头像](skills/furina/assets/IMG_1877.jpg)

## 安装

**方式一（推荐）：通用安装器** —— 自动识别你在用的 agent 并装到正确目录：

```bash
npx skills add Furinelle/furina
```

**方式二：仓库自带安装脚本**（Node ≥ 18）：

```bash
node scripts/setup.mjs            # Claude Code + .agents 通用目录 + 记忆运行时
node scripts/setup.mjs --claude   # 仅 ~/.claude/skills（Claude Code）
node scripts/setup.mjs --agents   # 仅 ~/.agents/skills（Codex / Cursor / Goose / Amp 等通用约定）
node scripts/setup.mjs --gemini   # ~/.gemini/skills（Gemini CLI）
node scripts/setup.mjs --opencode # ~/.config/opencode/skills（OpenCode）
node scripts/setup.mjs --dir ~/my-agent/skills   # 其他任意 agent
node scripts/setup.mjs --check    # 校验安装（含记忆运行时冒烟测试）
```

**方式三：手动** —— 把 `skills/furina/` 整个目录复制到你的 agent 读取 skill 的位置即可；它是自包含的。

在本仓库内打开 Claude Code 可以不安装直接用：`/furina 你好，芙宁娜。`

## 结构：一份规范 skill，零平台分叉

```
skills/furina/            ← 唯一发布单元（Agent Skills 标准布局，自包含）
  SKILL.md                ← 通用入口：工作流 + 路由表 + 记忆例程
  references/
    prompt/               ← 系统提示词、共享运行时（崩坏梯度/自称切换/灵魂状态）、轻量运行时、反思
    rules/                ← OOC 与安全规则
    memory/               ← 记忆格式、认知机制、压缩规则
    furina_resource/      ← 12 份结构化角色资料（00 索引 → 11 敏感话题安全表）
    eval/                 ← 语气验收 28 用例 + 多轮漂移脚本
  scripts/                ← furina-memory.mjs 记忆运行时（零依赖，随 skill 一起安装）
  assets/                 ← 头像、记忆模板
.claude/skills/           ← Claude Code 薄入口（/furina 等斜杠命令糖）；规范内容不在这里
scripts/                  ← 开发工具：setup.mjs、furina-eval.mjs
tests/                    ← 记忆运行时单测 + 人设内容回归（node --test）
```

平台差异的处理原则：**规范 skill 里没有任何平台专属内容**；平台糖（斜杠命令、frontmatter 扩展字段）只放对应平台目录。AstrBot 适配在 `feat/astrbot-adapter` 分支，Hermes 适配在 `codex/hermes-furina-adapter` 分支。

## 从旧布局升级

旧版的 `src/`、`furina_resource/`、`eval/`、`codex/` 与 `claudecode/` 已合并到 `skills/furina/`。更新仓库后重新运行 `node scripts/setup.mjs` 即可刷新各 agent 的安装副本；已有的 `~/.claude/furina-memory.json` 默认不会被覆盖。Codex 旧目录 `~/.codex/skills/furina-roleplay` 可在确认新 skill 生效后删除。

## 角色精修要点

本 skill 针对芙宁娜真实人格做了几层关键约束，是它与"普通傲娇大小姐"模板的核心区别（经官方语料逐字核验）：

- **自称默认是"我"**：官方实装语音从不用"本神"；"本神"是舞台残留 / 滑口 / 自嘲套用，含"本神——咳，我"句内修正指纹。见 `skills/furina/references/prompt/_shared_runtime.md`《自称切换》
- **体面裂缝梯度 0-4**：压力越高句子越短、停顿越多；含压力 4"处决恐惧"子类与「身上的水元素过于充盈」落泪借口（逐字出处见 07_quotes）
- **表白亲密度分级 0-10**：低亲密度礼仪化挡回，高亲密度用"她式回应"接住（官方锚句：「就让你我共同出演我们的未来吧」）。见 `skills/furina/references/furina_resource/11_sensitive_topics.md`
- **语气词与节奏指纹**：句尾哦/嘛/啦、"咳咳"清嗓找补、先高调宣言后小声找补
- **剧目化句法**：把日常拆成选角 / 布景 / 谢幕（官方"甜点就像歌剧"语感）
- **芙宁娜 / 芙卡洛斯身份辨析**与**敏感话题安全表**：10 类易写歪话题的写法对照
- **版本足迹与时效声明**：资料收录至 6.7（2026-07），之后的动态由 agent 联网查证并标注为参考

## 记忆系统

```bash
node skills/furina/scripts/furina-memory.mjs init
node skills/furina/scripts/furina-memory.mjs status
node skills/furina/scripts/furina-memory.mjs inject --query "你好，芙宁娜"
node skills/furina/scripts/furina-memory.mjs remember --text "[📌 记忆: 用户喜欢枫丹歌剧]"
node skills/furina/scripts/furina-memory.mjs compress
```

记忆文件默认在 `~/.claude/furina-memory.json`（可用 `FURINA_MEMORY_PATH` / `--path` 覆盖，与具体 agent 无关）。格式 `version: "2.0"`：亲密度、交互状态、灵魂状态、核心记忆、边界保护与睡眠巩固。完整字段说明见 `skills/furina/references/memory/memory_format.md`。

## 语气验收

```bash
node scripts/furina-eval.mjs list
node scripts/furina-eval.mjs prompt --case 3
node scripts/furina-eval.mjs batch
node --test          # 67 条单测：记忆运行时 + 人设内容回归
```

## 资料来源与声明

- 角色资料整理自萌娘百科条目「芙宁娜·德·枫丹」，并经原神WIKI（bwiki）语音页等来源逐字核验。使用与再分发请遵守原站著作权声明。
- 认知记忆系统参考了 [astrbot_plugin_angel_memory](https://github.com/kawayiYokami/astrbot_plugin_angel_memory) 与 [astrbot_plugin_angel_heart](https://github.com/kawayiYokami/astrbot_plugin_angel_heart) 的部分设计思路。
- 本项目为同人创作与提示词工程实践。芙宁娜、《原神》及相关角色版权归 miHoYo / HoYoverse 所有。

## License

[MIT License](LICENSE)
