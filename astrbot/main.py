import os

from astrbot.api import logger
from astrbot.api.star import Context, Star, filter as star_filter


class FurinaPlugin(Star):
    """芙宁娜·德·枫丹角色扮演插件。

    本插件不替代 Angel Heart / Angel Memory / LivingMemory，
    只提供人格文件、知识卡和协作配置，并注册状态检查命令。
    """

    def __init__(self, context: Context):
        super().__init__(context)
        self._plugin_dir = os.path.dirname(__file__)
        logger.info("[furina] 芙宁娜插件已加载")

    @star_filter.command("furina_status", desc="检查芙宁娜插件加载状态")
    async def check_status(self, event, context):
        """返回插件文件状态摘要。"""
        checks = {
            "人格文件": os.path.join(self._plugin_dir, "persona", "furina-astrbot-persona.md"),
            "Angel Memory 知识卡": os.path.join(self._plugin_dir, "angel_memory", "furina_notes.md"),
            "核心记忆导入包": os.path.join(self._plugin_dir, "angel_memory", "furina_core_memories.json"),
            "插件配置参考": os.path.join(self._plugin_dir, "configs", "astrbot_plugins.example.json"),
        }
        lines = ["芙宁娜插件状态："]
        for label, path in checks.items():
            lines.append(f"  {'✓' if os.path.exists(path) else '✗'} {label}")
        yield event.plain_result("\n".join(lines))

    async def terminate(self):
        logger.info("[furina] 芙宁娜插件已卸载")
