"""
Run the full detection pipeline for a user and persist insights.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import asdict
from typing import Any

from sqlalchemy.orm import Session

from app.detectors.anomalies import detect_anomalies
from app.detectors.drift import detect_drift
from app.detectors.leakage import detect_leakage
from app.detectors.payday import detect_payday_cliff
from app.detectors.subscriptions import detect_subscriptions
from app.insights.engine import Insight
from app.insights.rules import build_default_engine
from app.models import Insight as InsightModel, Transaction


def _tx_rows(db: Session, user_id: int) -> list[dict]:
    txs = db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.date).all()
    return [
        {
            "id": t.id,
            "date": t.date,
            "merchant": t.merchant_canonical or t.merchant_raw,
            "amount": t.amount,
            "category": t.category_canonical or t.category,
        }
        for t in txs
    ]


def run_all_detectors(db: Session, user_id: int) -> dict[str, Any]:
    """Returns dict with detector outputs (objects, not dicts)."""
    rows = _tx_rows(db, user_id)
    category_counts = Counter(r["category"] for r in rows)
    return {
        "subscriptions": detect_subscriptions(rows, dict(category_counts)),
        "anomalies": detect_anomalies(rows),
        "drifts": detect_drift(rows),
        "leakage": detect_leakage(rows),
        "cliff": detect_payday_cliff(rows),
    }


def run_pipeline(db: Session, user_id: int) -> list[Insight]:
    """Run detectors + insight engine, persist results, return ranked insights."""
    outputs = run_all_detectors(db, user_id)
    engine = build_default_engine()
    insights = engine.evaluate(outputs, top_k=5)

    db.query(InsightModel).filter(InsightModel.user_id == user_id).delete()
    for ins in insights:
        db.add(
            InsightModel(
                user_id=user_id,
                rule_id=ins.rule_id,
                title=ins.title,
                detail=ins.detail,
                impact_monthly_inr=ins.impact_monthly_inr,
                confidence=ins.confidence,
                actionability=ins.actionability,
                action_type=ins.action_type,
                action_target=ins.action_target,
                audit=ins.audit,
                score=ins.score,
            )
        )
    db.commit()
    return insights


def detector_stats(outputs: dict) -> dict:
    """Lightweight summary for SSE streaming."""
    return {
        "subscriptions_count": len(outputs.get("subscriptions") or []),
        "anomalies_count": len(outputs.get("anomalies") or []),
        "drifts_count": len(outputs.get("drifts") or []),
        "leakage_pct": (
            outputs["leakage"].leak_ratio_pct if outputs.get("leakage") else 0
        ),
        "cliff_pct": (
            outputs["cliff"].cliff_pct if outputs.get("cliff") else 0
        ),
    }
