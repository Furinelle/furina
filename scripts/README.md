# Hermes Scripts

本分支只保留 Hermes Agent 所需脚本。

## 安装器

```bash
node scripts/setup.mjs
node scripts/setup.mjs --check
node scripts/setup.mjs --dry-run
```

`setup.mjs` 安装 SOUL、注册外部 skill、启用 Mnemosyne provider，并初始化
固定关系状态。可用 `--hermes-home` 与 `--mnemosyne-python` 覆盖路径。

旧版 JSON 只支持显式一次性迁移：

```bash
node scripts/setup.mjs --legacy-memory-path /path/to/furina-memory.json
```

## 关系状态

```bash
node scripts/furina-relationship.mjs status --format inject
node scripts/furina-relationship.mjs adjust 1 --reason "durable milestone"
node scripts/furina-relationship.mjs set 9 --reason "explicit calibration"
```

Node 命令负责参数与输出，`lib/furina_mnemosyne.py` 通过 Mnemosyne 正式 API
原子更新固定记录 `preference-furina-intimacy`。

## 语气评测

```bash
node scripts/furina-eval.mjs list
node scripts/furina-eval.mjs prompt --case 22
node scripts/furina-eval.mjs batch
```
