"""
Agent orchestrator: tool-use loop with sliding window memory.
"""
from __future__ import annotations

import json
from sqlalchemy.orm import Session

from app.agent.client import call_llm
from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import TOOL_SCHEMAS, execute_tool
from app.models import ChatTurn, User

MAX_HISTORY_TURNS = 5
MAX_TOOL_ITERATIONS = 5


def _load_history(db: Session, user_id: int) -> list[dict]:
    turns = (
        db.query(ChatTurn)
        .filter(ChatTurn.user_id == user_id)
        .order_by(ChatTurn.created_at.desc())
        .limit(MAX_HISTORY_TURNS * 2)
        .all()
    )
    turns.reverse()
    return [{"role": t.role, "content": t.content or ""} for t in turns]


def _save_turn(db: Session, user_id: int, role: str, content: str, tool_calls: list | None = None):
    db.add(ChatTurn(user_id=user_id, role=role, content=content, tool_calls=tool_calls))
    db.commit()


async def chat(user_message: str, user: User, db: Session) -> dict:
    history = _load_history(db, user.id)
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}, *history, {"role": "user", "content": user_message}]

    tool_calls_made: list[dict] = []
    proposal_ids: list[str] = []

    for _ in range(MAX_TOOL_ITERATIONS):
        resp = await call_llm(messages, tools=TOOL_SCHEMAS)

        if resp.get("_fallback"):
            err = resp.get("error", "unknown")
            return {
                "reply": "I'm having trouble reaching my reasoning service. Try again in a moment.",
                "tool_calls": tool_calls_made,
                "proposal_ids": proposal_ids,
                "_error": err,
            }

        try:
            msg = resp["choices"][0]["message"]
        except (KeyError, IndexError):
            return {
                "reply": "I got an unexpected response from my reasoning service. Try again.",
                "tool_calls": tool_calls_made,
                "proposal_ids": proposal_ids,
            }

        messages.append(msg)

        tcs = msg.get("tool_calls") or []
        if not tcs:
            reply = (msg.get("content") or "").strip() or "I couldn't generate a response."
            _save_turn(db, user.id, "user", user_message)
            _save_turn(db, user.id, "assistant", reply, tool_calls=tool_calls_made)
            return {
                "reply": reply,
                "tool_calls": tool_calls_made,
                "proposal_ids": proposal_ids,
            }

        for call in tcs:
            fn_name = call["function"]["name"]
            try:
                fn_args = json.loads(call["function"].get("arguments") or "{}")
            except json.JSONDecodeError:
                fn_args = {}
            result = await execute_tool(fn_name, fn_args, user.id, db)
            tool_calls_made.append({
                "name": fn_name,
                "args": fn_args,
                "result_preview": json.dumps(result, default=str)[:240],
            })
            if fn_name == "propose_action" and isinstance(result, dict) and result.get("proposal_id"):
                proposal_ids.append(result["proposal_id"])
            messages.append({
                "role": "tool",
                "tool_call_id": call["id"],
                "content": json.dumps(result, default=str),
            })

    return {
        "reply": "I made multiple lookups but couldn't finalize an answer. Try a more specific question.",
        "tool_calls": tool_calls_made,
        "proposal_ids": proposal_ids,
    }
