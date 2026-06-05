from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Insight as InsightModel, Transaction, User
from app.schemas import InsightOut
from app.detectors.benchmarks import detect_benchmarks
from app.pipeline.orchestrator import run_all_detectors

router = APIRouter(prefix="/api", tags=["insights"])


@router.get("/insights/{session_id}", response_model=list[InsightOut])
def get_insights(session_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.session_id == session_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Session not found")
    rows = (
        db.query(InsightModel)
        .filter(InsightModel.user_id == user.id)
        .order_by(InsightModel.score.desc())
        .all()
    )
    return [
        InsightOut(
            id=r.id,
            rule_id=r.rule_id,
            title=r.title,
            detail=r.detail,
            impact_monthly_inr=float(r.impact_monthly_inr or 0),
            confidence=r.confidence,
            actionability=float(r.actionability or 0),
            action_type=r.action_type,
            action_target=r.action_target,
            audit=r.audit or {},
            score=float(r.score or 0),
        )
        for r in rows
    ]


@router.get("/dashboard/{session_id}")
def get_dashboard_data(session_id: str, db: Session = Depends(get_db)):
    """Aggregated data for charts: sankey nodes/links, daily heatmap, category totals."""
    user = db.query(User).filter(User.session_id == session_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Session not found")

    txs = db.query(Transaction).filter(Transaction.user_id == user.id).order_by(Transaction.date).all()
    if not txs:
        return {"sankey": {"nodes": [], "links": []}, "heatmap": [], "categories": [], "total_spend": 0, "total_income": 0}

    income = sum(float(t.amount) for t in txs if t.category == "Salary")
    expenses = [t for t in txs if t.category != "Salary"]
    total_expense = sum(float(t.amount) for t in expenses)

    # Sankey: Income -> each category total
    cat_totals: dict[str, float] = {}
    for t in expenses:
        cat = t.category_canonical or t.category
        cat_totals[cat] = cat_totals.get(cat, 0) + float(t.amount)

    sorted_cats = sorted(cat_totals.items(), key=lambda kv: -kv[1])
    nodes = [{"name": "Income"}] + [{"name": c} for c, _ in sorted_cats]
    links = [
        {"source": 0, "target": i + 1, "value": round(v, 2)}
        for i, (_, v) in enumerate(sorted_cats)
    ]

    # Heatmap: per-day totals & events
    daily: dict[str, float] = {}
    for t in expenses:
        key = str(t.date)
        daily[key] = daily.get(key, 0) + float(t.amount)
        
    outputs = run_all_detectors(db, user.id)
    events_by_date = {}
    
    # Payday events
    cliff = outputs.get("cliff")
    if cliff and getattr(cliff, "salary_day", None):
        # Find the first date matching the salary_day in the current month bounds
        for d_str in daily.keys():
            if d_str.endswith(f"-{cliff.salary_day:02d}"):
                events_by_date.setdefault(d_str, []).append({"type": "payday", "label": "Payday"})
                break
                
    # Subscription events
    for sub in outputs.get("subscriptions") or []:
        for d in getattr(sub, "detected_dates", []):
            events_by_date.setdefault(str(d), []).append({
                "type": "subscription", 
                "label": f"Subscription: {sub.canonical_merchant}"
            })
            
    # Anomaly events
    for anom in outputs.get("anomalies") or []:
        events_by_date.setdefault(str(anom.date), []).append({
            "type": "anomaly",
            "label": f"Anomaly: {anom.merchant} (₹{int(anom.amount)})"
        })

    heatmap = [
        {
            "date": d, 
            "amount": round(v, 2),
            "events": events_by_date.get(d, [])
        } 
        for d, v in sorted(daily.items())
    ]

    # Categories: ranked bars
    categories = [
        {
            "name": c,
            "amount": round(v, 2),
            "pct": round(v / total_expense * 100, 1) if total_expense else 0,
        }
        for c, v in sorted_cats
    ]

    # Benchmarks
    tx_rows = [
        {
            "id": t.id,
            "date": t.date,
            "merchant": t.merchant_canonical or t.merchant_raw,
            "amount": t.amount,
            "category": t.category_canonical or t.category,
        }
        for t in txs
    ]
    benchmarks = detect_benchmarks(tx_rows)
    benchmark_data = [
        {
            "category": b.category,
            "user_spend": b.user_spend,
            "benchmark_spend": b.benchmark_spend,
            "percentage_above": b.percentage_above,
            "demographic": b.demographic,
        }
        for b in benchmarks
    ]

    return {
        "sankey": {"nodes": nodes, "links": links},
        "heatmap": heatmap,
        "categories": categories,
        "total_spend": round(total_expense, 2),
        "total_income": round(income, 2),
        "benchmarks": benchmark_data,
    }
