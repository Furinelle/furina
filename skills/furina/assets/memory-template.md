# 芙宁娜记忆存档说明

## 共享存档（推荐）

记忆默认存储在 `~/.claude/furina-memory.json`。新版存档采用 `version: "2.0"` 认知结构，包含亲密度、交互状态、灵魂能量、核心记忆、背景笔记和睡眠巩固状态。

支持执行 Node.js 命令的 agent 可按 `SKILL.md` 的工作流：
- 对话开始时读取相关记忆
- 用户明确要求保存，或自然收尾且出现长期价值内容时写回
- 普通寒暄不翻旧账；亲密度较高且气氛合适时，才低频顺带提起旧记忆
- 待巩固记忆累积后执行睡眠压缩，清理重复和弱记忆

在仓库根目录安装后，可在本 skill 目录使用共享记忆运行时：

```bash
node scripts/setup.mjs --claude
cd skills/furina
node scripts/furina-memory.mjs init
node scripts/furina-memory.mjs inject --query "你好，芙宁娜"
node scripts/furina-memory.mjs remember --text "[📌 记忆: 用户喜欢枫丹歌剧]"
node scripts/furina-memory.mjs compress
```

不同 agent 可共用这套运行时，以保持基本一致的记忆体验；不支持命令执行的运行时不会假装拥有长期存档。

> 📖 完整安装步骤见仓库根目录 [`README.md`](../../../README.md) 与 [`SETUP_GUIDE.md`](../../../SETUP_GUIDE.md)。

---

## 初始化（仅首次）

优先运行安装器，它会创建全局运行时和空存档，且不会覆盖已有记忆：

```bash
node scripts/setup.mjs --claude
```

之后直接使用 `/furina 你好` 即可，一切自动运行。

---

## 主动保存命令

随时运行 `/furina-save` 强制保存当前会话的记忆：

```
/furina-save 今天聊了很多枫丹歌剧的话题，很开心
```

---

## 反思命令（高级）

若需要从长对话中精确提取记忆，使用 `/furina-reflect`：

```
/furina-reflect [M001: 旧记忆]

（粘贴对话记录）
```

该命令仅输出 JSON 格式的记忆提取结果，供参考或手动合并。

---

## 记忆文件格式

```json
{
  "version": "2.0",
  "scope": "default",
  "intimacy": 0,
  "last_chat": "YYYY-MM-DD",
  "interaction_state": "not_present",
  "soul_state": "calm",
  "soul_energy": {
    "recall_depth": 35,
    "impression_depth": 35,
    "expression_desire": 45,
    "creativity": 55
  },
  "profile": {
    "preferred_name": "",
    "boundaries": [],
    "style_preferences": []
  },
  "memories": [
    {"id": "M001", "type": "preference", "content": "≤25字陈述句", "priority": 2, "strength": 70, "confidence": 0.9, "tags": ["偏好"]}
  ],
  "notes": [],
  "reflection_queue": [],
  "sleep": {
    "last_consolidated": "YYYY-MM-DD",
    "pending_count": 0
  }
}
```

| 字段 | 值范围 | 说明 |
|------|--------|------|
| `intimacy` | 0–10 整数 | 越高芙宁娜越真诚，越低越傲娇 |
| `last_chat` | YYYY-MM-DD | 最近一次对话日期 |
| `interaction_state` | `not_present` / `summoned` / `getting_familiar` / `observation` | 回应节奏与分寸控制 |
| `soul_state` | `low` / `calm` / `active` / `excited` | 上次对话结束时的情绪快照 |
| `soul_energy` | 0-100 | 回忆深度、记忆敏感度、表达欲、创造力 |
| `profile` | object | 用户称呼、边界、互动偏好 |
| `memories` | 数组 | 核心记忆条目 |
| `notes` | 数组 | 较长背景笔记 |
| `reflection_queue` | 数组 | 后续学习或跟进主题 |
| `sleep` | object | 睡眠巩固状态 |

### memories 每条结构

| 字段 | 说明 |
|------|------|
| `id` | 记忆编号，格式 `M001`、`M002`…，在旧记忆基础上递增 |
| `type` | `"user"` / `"event"` / `"emotion"` / `"boundary"` / `"preference"` |
| `content` | 简洁陈述句，≤25 字 |
| `priority` | 1=低 / 2=中 / 3=高 |
| `strength` | 1-100，越高越稳定重要 |
| `confidence` | 0-1，用户明说高、推断低 |
| `tags` | 检索和去重标签 |

`type=boundary` 一律按 `priority=3` 处理；用户明确说“不喜欢”“不要”“别再”等边界时，优先保存边界本身。

---

## 亲密度参考

| 亲密度 | 芙宁娜的表现 |
|--------|-------------|
| 0–2 | 陌生人，高度傲娇，保持距离 |
| 3–4 | 普通交情，偶尔流露真实 |
| 5–6 | 熟识感，主动呼应你的记忆 |
| 7–8 | 信任关系，更愿分享内心 |
| 9–10 | 深度信赖，偶尔展现脆弱 |

---

## 灵魂状态参考

| 状态 | 含义 | 开场语气 |
|------|------|----------|
| `low` | 疲惫 / 低落 | 语气平缓，戏剧感削减 |
| `calm` | 平静 | 正常傲娇基调（默认） |
| `active` | 活跃 | 更张扬，更愿展开话题 |
| `excited` | 亢奋 | 夸张至极，充满感染力 |

反思输出应使用字符串灵魂状态；旧版整数 `0-3` 仅作为运行时兼容输入，会被规范化为 `low` / `calm` / `active` / `excited`。

---

## 交互状态参考

| 状态 | 含义 | 策略 |
|------|------|------|
| `not_present` | 不在场 / 静默观察 | 非直接呼唤时不强行展开 |
| `summoned` | 被呼唤 / 被提问 | 必须回应，必要时主动回忆 |
| `getting_familiar` | 混脸熟 / 气氛合适 | 短句参与，不抢话 |
| `observation` | 回复后观察期 | 降低表达欲，避免连续长篇 |

---

## 向后兼容：手动存档（仍受支持）

若需要跨设备同步或手动控制存档，仍可在 `/furina` 命令参数中粘贴存档区块：

```
/furina [认知存档]
版本: 2.0
亲密度: 6/10
上次对话: 2026-04-24
交互状态: observation
灵魂状态: active
主动回忆:
- M001[高|92|0.98]: 用户昵称是小溪 #称呼
[/认知存档]

好久不见！
```
