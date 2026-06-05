# AstrBot Scripts

本分支只保留 AstrBot 适配所需脚本。

```bash
node scripts/furina-astrbot.mjs generate --out astrbot
node scripts/furina-astrbot.mjs check --out astrbot
node scripts/furina-eval.mjs list
node scripts/furina-eval.mjs prompt --case 22
```

`furina-astrbot.mjs` 生成 Persona、Angel Memory 短卡、核心记忆导入包和插件
配置参考。原作资料由 `furina_resource/` 提供；不足时使用 AstrBot 自带联网
能力，不依赖仓库 wiki 脚本。
