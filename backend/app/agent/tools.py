"""
Tool schemas + executors. Each tool fetches data from the DB and returns
a JSON-serializable dict. Never throws; on error returns {"error": "..."}.
"""
from __future__ import annotations

import uuid
from dataclasses import asdict, is_dataclass
from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.models import ActionProposal, User
from app.pipeline.orchestrator import run_all_detectors
from app.api.simulate import compute_simulation

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "get_subscription_and_leakage_analysis",
            "description": "Returns recurring subscriptions detected for the user and micro-spend leakage analysis.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_anomaly_and_drift_analysis",
            "description": "Returns spending anomalies (large outlier transactions) and category drift month-over-month.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_payday_cliff_analysis",
            "description": "Returns whether the user has a payday-spending cliff pattern and the magnitude.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "simulate_savings",
            "description": "Simulate a what-if scenario by reducing spend in given categories by percentages. Returns projected monthly delta and 5-year compounded delta at 8%.",
            "parameters": {
                "type": "object",
                "properties": {
                    "deltas": {
                        "type": "object",
                        "description": "Map of category name to percent reduction. Example: {\"Food\": 30, \"Shopping\": 20}",
                        "additionalProperties": {"type": "number"},
                    }
                },
                "required": ["deltas"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "propose_action",
            "description": "Propose an action for the user to confirm (e.g., cancel a subscription, set a spending cap). Returns a proposal_id pending user confirmation. NEVER auto-executes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action_type": {
                        "type": "string",
                        "enum": ["cancel_sub", "auto_sweep", "set_cap"],
                    },
                    "target": {
                        "type": "string",
                        "description": "Merchant name (for cancel_sub) or category name (for set_cap) or amount (for auto_sweep)",
                    },
                    "rationale": {
                        "type": "string",
                        "description": "One-sentence reason the user should confirm this action.",
                    },
                },
                "required": ["action_type", "target", "rationale"],
            },
        },
    },
]


def _to_jsonable(o: Any) -> Any:
    if is_dataclass(o):
        return _to_jsonable(asdict(o))
    if isinstance(o, dict):
        return {k: _to_jsonable(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [_to_jsonable(x) for x in o]
    if isinstance(o, Decimal):
        return float(o)
    if isinstance(o, date):
        return str(o)
    return o


def _cat_totals_for_user(db: Session, user_id: int) -> dict[str, float]:
    from app.models import Transaction
    rows = db.query(Transaction).filter(
        Transaction.user_id == user_id, Transaction.category != "Salary"
    ).all()
    totals: dict[str, float] = {}
    for r in rows:
        cat = r.category_canonical or r.category
        totals[cat] = totals.get(cat, 0) + float(r.amount)
    return totals


async def execute_tool(name: str, args: dict, user_id: int, db: Session) -> dict:
    try:
        if name == "get_subscription_and_leakage_analysis":
            o = run_all_detectors(db, user_id)
            return _to_jsonable({
                "subscriptions": o["subscriptions"],
                "leakage": o["leakage"],
            })

        if name == "get_anomaly_and_drift_analysis":
            o = run_all_detectors(db, user_id)
            return _to_jsonable({
                "anomalies": o["anomalies"],
                "drifts": o["drifts"],
            })

        if name == "get_payday_cliff_analysis":
            o = run_all_detectors(db, user_id)
            return _to_jsonable({"cliff": o["cliff"]})

        if name == "simulate_savings":
            deltas = args.get("deltas") or {}
            cat_totals = _cat_totals_for_user(db, user_id)
            return compute_simulation(deltas, cat_totals)

        if name == "propose_action":
            pid = f"prop_{uuid.uuid4().hex[:12]}"
            p = ActionProposal(
                user_id=user_id,
                proposal_id=pid,
                action_type=args.get("action_type", "unknown"),
                target=args.get("target", ""),
                rationale=args.get("rationale", ""),
                status="PENDING",
            )
            db.add(p)
            db.commit()
            return {
                "proposal_id": pid,
                "status": "PENDING",
                "message": "Proposal created — user must confirm in UI to execute.",
            }

        return {"error": f"Unknown tool: {name}"}
    except Exception as e:
        return {"error": f"Tool {name} failed: {e}"}
