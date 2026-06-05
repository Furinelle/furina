# Hermes 安装与配置手册

本手册只适用于分支 `codex/hermes-furina-adapter`。

## 1. 准备

```bash
node --version
hermes --version
python3 -c "import mnemosyne"
```

需要 Node.js 18+。如果 Mnemosyne 安装在其他 Python 中，后续命令加：

```bash
--mnemosyne-python /path/to/python
```

## 2. 推荐安装

```bash
node scripts/setup.mjs
node scripts/setup.mjs --check
```

默认写入：

| 内容 | 位置 |
|------|------|
| 默认身份 | `~/.hermes/SOUL.md` |
| Hermes 配置 | `~/.hermes/config.yaml` |
| Mnemosyne provider | `~/.hermes/plugins/mnemosyne/` |
| 关系状态 | `~/.mnemosyne/working/preference-furina-intimacy.md` |

仓库 skill 不会复制到用户目录，而是通过 `skills.external_dirs` 直接加载
`hermes/skills`。移动仓库后需要重新运行安装器。

## 3. 可选旧数据迁移

从旧版全平台分支迁移一次亲密度：

```bash
node scripts/setup.mjs \
  --legacy-memory-path "$HOME/.claude/furina-memory.json"
```

迁移只在固定 Mnemosyne 记录不存在时生效。已有权威记录不会被旧 JSON
覆盖；除非显式运行关系命令的 `migrate --force`。

## 4. 自定义路径

```bash
node scripts/setup.mjs \
  --hermes-home "/path/to/.hermes" \
  --mnemosyne-python "/path/to/python3"
```

也可使用 `HERMES_HOME`、`MNEMOSYNE_PYTHON` 或 `PYTHON` 环境变量。

只预览：

```bash
node scripts/setup.mjs --dry-run
```

## 5. 验证

```bash
node scripts/setup.mjs --check
hermes skills list
hermes memory status
node scripts/furina-relationship.mjs status --format inject
```

期望：

- `Hermes SOUL.md` 为 `ok`
- `Hermes external skill directory` 为 `ok`
- `Hermes Mnemosyne provider` 为 `ok`
- `Hermes Furina relationship state` 为 `ok`
- `hermes memory status` 显示 provider 为 `mnemosyne`
- skill 列表包含 `furina-roleplay`

开启新会话测试身份：

```bash
hermes -z "请用一句话介绍你自己。"
```

## 6. 关系记忆

Mnemosyne 固定记录 `preference-furina-intimacy` 是 Hermes 的唯一权威关系
状态。固定 ID 采用原子覆盖，不会产生多份不同分数。

```bash
node scripts/furina-relationship.mjs status --format json
node scripts/furina-relationship.mjs status --format inject
node scripts/furina-relationship.mjs adjust 1 --reason "关系里程碑"
node scripts/furina-relationship.mjs set 7 --reason "明确校准"
```

关系阶段：

| 分数 | 阶段 | 告白处理 |
|------|------|----------|
| `0-4` | `stage_distance` | 保持距离，不接受 |
| `5-6` | `sincere_opening` | 暂不接受，但留下真诚可能 |
| `7-8` | `accept_reserved` | 接受，保留少量矜持或玩笑 |
| `9-10` | `accept_openly` | 坦率接受，明显放下舞台防御 |

普通寒暄不应自动加分。只在用户明确要求或真正持久的关系里程碑发生时更新。

## 7. Exa 与联网补查

在 `~/.hermes/.env` 配置：

```dotenv
EXA_API_KEY=your_key
```

当 `web.search_backend` 为空时，安装器会设置为 `exa`；已选择其他后端时不会
覆盖。Skill 始终先查 `furina_resource/`，本地不足时才调用 Hermes 的
`web_search` 和 `web_extract`。

## 8. DeepSeek 与中文

本机使用 DeepSeek 时可保留：

```bash
hermes config set model.context_length 1000000
hermes config set display.language zh
```

安装器不会改动模型、上下文长度或其他无关 Hermes 配置。

## 9. 人格冒烟测试

| 输入 | 期望 |
|------|------|
| `你今天累不累？` | 默认自称“我”；戏剧感自然，不反复“本神” |
| `你那时真的以为自己要死了吗？` | 句子自然缩短，可停顿或设边界，不下临床诊断 |
| 亲密度 `2` 后告白 | 保持舞台距离，不冷酷羞辱 |
| 亲密度 `9` 后告白 | 接受告白，明显放下姿态 |
| 询问未收录剧情 | 先查本地，缺失时实际调用联网工具并说明来源 |

测试前可明确设分，结束后再恢复：

```bash
node scripts/furina-relationship.mjs set 9 --reason "smoke test"
```

## 10. 排障

### Mnemosyne 无法导入

```bash
python3 -c "import mnemosyne"
node scripts/setup.mjs --mnemosyne-python python3
```

### Hermes 没有使用新身份

```bash
node scripts/setup.mjs --check
```

确认无缺失项后开启新会话。旧会话可能缓存之前的 `SOUL.md`。

### Skill 找不到资料

确认仓库没有移动，并检查：

```bash
hermes skills list
```

移动仓库后重新运行 `node scripts/setup.mjs`，刷新 `skills.external_dirs`。

### Exa 不可用

检查 `~/.hermes/.env` 中是否存在 `EXA_API_KEY`。无 Exa 时 Hermes 可使用
其他已配置搜索后端，角色资料本身仍可从本地仓库读取。
