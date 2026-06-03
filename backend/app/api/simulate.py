"""
What-if simulator: apply percentage reductions to categories and compute
monthly delta + 5-year compounded projection at 8% annual return.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Transaction, User
from app.schemas import SimulateIn, SimulateOut

router = APIRouter(prefix="/api", tags=["simulate"])

ANNUAL_RATE = 0.08
MONTHS = 60


def project_compound(monthly_savings: float, months: int = MONTHS, annual_rate: float = ANNUAL_RATE) -> float:
    """Future value of monthly contributions at given annual rate (compounded monthly)."""
    if monthly_savings <= 0:
        return 0.0
    r = annual_rate / 12
    if r == 0:
        return monthly_savings * months
    return monthly_savings * (((1 + r) ** months - 1) / r)


def compute_simulation(deltas: dict[str, float], cat_totals: dict[str, float]) -> dict:
    per_category = {}
    monthly_savings = 0.0
    for cat, pct in deltas.items():
        amt = cat_totals.get(cat, 0.0)
        saved = amt * (pct / 100.0)
        per_category[cat] = round(saved, 2)
        monthly_savings += saved
    return {
        "monthly_savings_inr": round(monthly_savings, 2),
        "annual_savings_inr": round(monthly_savings * 12, 2),
        "five_year_compounded_inr": round(project_compound(monthly_savings), 2),
        "per_category": per_category,
    }


@router.post("/simulate/{session_id}", response_model=SimulateOut)
def simulate(session_id: str, payload: SimulateIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.session_id == session_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Session not found")

    txs = db.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.category != "Salary",
    ).all()

    cat_totals: dict[str, float] = {}
    for t in txs:
        cat = t.category_canonical or t.category
        cat_totals[cat] = cat_totals.get(cat, 0) + float(t.amount)

    result = compute_simulation(payload.deltas, cat_totals)
    return SimulateOut(**result)
