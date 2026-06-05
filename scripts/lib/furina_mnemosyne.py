#!/usr/bin/env python3
"""Read and update Furina's canonical relationship state in Mnemosyne."""

from __future__ import annotations

import json
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from mnemosyne.index import update_memory_index
from mnemosyne.schema import Memory, parse_memory
from mnemosyne.store import ensure_store, global_store, lock_store, working_path, write_memory


MEMORY_ID = "preference-furina-intimacy"


def stage_for(score: int) -> tuple[str, str]:
    if score <= 4:
        return "stage_distance", "暂不接受告白，保持舞台距离，但不要羞辱或冷酷拒绝。"
    if score <= 6:
        return "sincere_opening", "暂不立刻接受告白，但应留下真诚、明确的未来可能。"
    if score <= 8:
        return "accept_reserved", "可以接受告白，同时保留少量矜持、玩笑或体面。"
    return "accept_openly", "应坦率接受告白，用芙宁娜自己的语言回应亲密关系。"


def read_existing(path: Path) -> Memory | None:
    if not path.exists():
        return None
    return parse_memory(path.read_text(encoding="utf-8"))


def memory_score(memory: Memory) -> int:
    value = memory.extra.get("furina_intimacy")
    if not isinstance(value, int):
        raise ValueError(f"{MEMORY_ID} is missing integer furina_intimacy metadata")
    if not 0 <= value <= 10:
        raise ValueError(f"{MEMORY_ID} furina_intimacy must be between 0 and 10")
    return value


def result_for(memory: Memory | None, path: Path) -> dict[str, Any]:
    if memory is None:
        return {
            "exists": False,
            "id": MEMORY_ID,
            "path": str(path),
            "intimacy": None,
            "relationship_stage": "unknown",
            "confession_policy": "先初始化或迁移关系状态，再处理依赖亲密度的回应。",
        }
    score = memory_score(memory)
    stage, policy = stage_for(score)
    return {
        "exists": True,
        "id": memory.id,
        "path": str(path),
        "intimacy": score,
        "relationship_stage": stage,
        "confession_policy": policy,
        "updated_at": str(memory.extra.get("updated_at", "")),
        "update_reason": str(memory.extra.get("update_reason", "")),
        "source": memory.source,
    }


def build_memory(
    score: int,
    reason: str,
    source: str,
    existing: Memory | None,
) -> Memory:
    stage, policy = stage_for(score)
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    today = date.today().isoformat()
    summary = (
        f"芙宁娜关系状态：furina_intimacy={score}/10；"
        f"relationship_stage={stage}；{policy}"
        "这是 Hermes 的唯一权威亲密度记录。"
    )
    body = "\n".join(
        [
            "## 芙宁娜关系状态",
            "",
            "此记录是 Hermes 的唯一权威长期关系状态。"
            "旧版 `furina-memory.json` 仅作一次性迁移输入，不得覆盖本记录。",
            "",
            f"- furina_intimacy: {score}",
            f"- relationship_stage: {stage}",
            f"- confession_policy: {policy}",
            f"- updated_at: {now}",
            f"- update_reason: {reason}",
            "",
            "检索关键词：芙宁娜、关系、亲密度、告白、恋爱、长期记忆、Furina intimacy confession.",
        ]
    )
    return Memory(
        id=MEMORY_ID,
        type="preference",
        source=source,
        strength=100,
        created=existing.created if existing and existing.created else today,
        last_accessed=existing.last_accessed if existing else today,
        access_count=existing.access_count if existing else 0,
        tags=[
            "furina",
            "芙宁娜",
            "relationship-state",
            "furina-intimacy",
            "亲密度",
            "告白",
            "恋爱",
            "hermes",
        ],
        links=existing.links if existing else [],
        canonical_summary=summary,
        injection_summary=summary,
        status="active",
        body=body,
        expires="",
        extra={
            "furina_intimacy": score,
            "relationship_stage": stage,
            "updated_at": now,
            "update_reason": reason,
        },
    )


def write_score(
    path: Path,
    score: int,
    reason: str,
    source: str,
) -> tuple[Memory, int | None]:
    if not 0 <= score <= 10:
        raise ValueError("furina_intimacy must be between 0 and 10")
    store = global_store()
    ensure_store(store)
    with lock_store(store):
        existing = read_existing(path)
        previous = memory_score(existing) if existing else None
        memory = build_memory(score, reason, source, existing)
        write_memory(path, memory)
    update_memory_index(store, path, memory)
    return memory, previous


def main() -> int:
    request = json.load(sys.stdin)
    action = str(request.get("action", "status"))
    store = global_store()
    ensure_store(store)
    placeholder = Memory(id=MEMORY_ID, type="preference")
    path = working_path(store, placeholder)

    if action == "status":
        response = result_for(read_existing(path), path)
    elif action == "set":
        score = int(request["score"])
        reason = str(request.get("reason", "")).strip() or "manual update"
        source = str(request.get("source", "furina-hermes-bridge"))
        memory, previous = write_score(path, score, reason, source)
        response = result_for(memory, path)
        response["previous_intimacy"] = previous
    elif action == "adjust":
        delta = int(request["delta"])
        reason = str(request.get("reason", "")).strip() or "relationship milestone"
        source = str(request.get("source", "furina-hermes-bridge"))
        with lock_store(store):
            existing = read_existing(path)
            previous = memory_score(existing) if existing else 0
            score = max(0, min(10, previous + delta))
            memory = build_memory(score, reason, source, existing)
            write_memory(path, memory)
        update_memory_index(store, path, memory)
        response = result_for(memory, path)
        response["previous_intimacy"] = previous
        response["applied_delta"] = score - previous
    else:
        raise ValueError(f"unknown action: {action}")

    print(json.dumps(response, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"furina relationship bridge failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
