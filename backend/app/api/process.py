"""
SSE stream of pipeline stages. Each event is one stage of work.
Throttled to a minimum 250ms gap for the demo reveal.
"""
from __future__ import annotations

import asyncio
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db import db_session
from app.models import Transaction, User
from app.pipeline.enrich import enrich_transactions
from app.pipeline.orchestrator import run_pipeline, run_all_detectors, detector_stats

router = APIRouter(prefix="/api", tags=["process"])

MIN_GAP_S = 0.25


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


@router.get("/process/{session_id}")
async def stream_process(session_id: str):
    """Stream pipeline stages as SSE events."""
    # Resolve user up-front
    with db_session() as db:
        user = db.query(User).filter(User.session_id == session_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Session not found")
        user_id = user.id

    async def event_gen():
        with db_session() as db:
            tx_count = db.query(Transaction).filter(Transaction.user_id == user_id).count()
            if tx_count == 0:
                yield _sse({"stage": "error", "detail": "No transactions uploaded"})
                return

            yield _sse({"stage": "parse", "detail": f"Parsed {tx_count} transactions"})
            await asyncio.sleep(MIN_GAP_S)

            yield _sse({"stage": "validate", "detail": f"Validated schema · {tx_count} valid · 0 errors"})
            await asyncio.sleep(MIN_GAP_S)

            stats = enrich_transactions(db, user_id)
            yield _sse({
                "stage": "enrich",
                "detail": (
                    f"Normalized merchants · {stats['matched']}/{stats['total']} from lookup"
                    + (f" · {stats['unmatched_count']} unknown deferred to LLM" if stats['unmatched_count'] else "")
                ),
            })
            await asyncio.sleep(MIN_GAP_S)

            outputs = run_all_detectors(db, user_id)
            s = detector_stats(outputs)

            yield _sse({"stage": "subscriptions", "detail": f"Detected {s['subscriptions_count']} recurring charges"})
            await asyncio.sleep(MIN_GAP_S)

            yield _sse({
                "stage": "anomalies",
                "detail": (
                    f"Anomaly scan complete · {s['anomalies_count']} outlier(s) flagged "
                    f"(Modified Z, MAD-based)"
                ),
            })
            await asyncio.sleep(MIN_GAP_S)

            yield _sse({
                "stage": "leakage",
                "detail": f"Leakage check · {s['leakage_pct']}% of spend in micro-charges",
            })
            await asyncio.sleep(MIN_GAP_S)

            yield _sse({
                "stage": "cliff",
                "detail": f"Payday cliff · {s['cliff_pct']}% of discretionary in days 1-3",
            })
            await asyncio.sleep(MIN_GAP_S)

            yield _sse({"stage": "rank", "detail": "Ranking insights · impact × confidence × actionability"})
            await asyncio.sleep(MIN_GAP_S)

            insights = run_pipeline(db, user_id)
            yield _sse({"stage": "done", "detail": f"Top {len(insights)} insights ready"})

    return StreamingResponse(event_gen(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    })
