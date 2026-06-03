"""
Category drift: split the 30-day window into prior (days 1-15) vs recent
(days 16-30) halves, compute each category's share, flag |delta| >= 8pp.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal
from typing import Literal

DRIFT_THRESHOLD_PP = 8.0


@dataclass
class CategoryDrift:
    category: str
    prior_share_pct: float
    recent_share_pct: float
    delta_pp: float
    delta_inr: Decimal
    direction: Literal["up", "down"]
    audit: dict = field(default_factory=dict)


def detect_drift(transactions: list[dict]) -> list[CategoryDrift]:
    if not transactions:
        return []

    expenses = [
        t for t in transactions
        if t["category"] != "Salary" and float(t["amount"]) > 0
    ]
    if not expenses:
        return []

    min_date = min(t["date"] for t in expenses)
    max_date = max(t["date"] for t in expenses)
    midpoint = min_date + (max_date - min_date) / 2

    prior: dict[str, float] = defaultdict(float)
    recent: dict[str, float] = defaultdict(float)
    for t in expenses:
        amt = float(t["amount"])
        if t["date"] <= midpoint:
            prior[t["category"]] += amt
        else:
            recent[t["category"]] += amt

    prior_total = sum(prior.values()) or 1.0
    recent_total = sum(recent.values()) or 1.0

    drifts: list[CategoryDrift] = []
    cats = set(prior) | set(recent)
    for cat in cats:
        p_share = (prior.get(cat, 0.0) / prior_total) * 100
        r_share = (recent.get(cat, 0.0) / recent_total) * 100
        delta = r_share - p_share
        if abs(delta) >= DRIFT_THRESHOLD_PP:
            drifts.append(
                CategoryDrift(
                    category=cat,
                    prior_share_pct=round(p_share, 2),
                    recent_share_pct=round(r_share, 2),
                    delta_pp=round(delta, 2),
                    delta_inr=Decimal(
                        f"{recent.get(cat, 0.0) - prior.get(cat, 0.0):.2f}"
                    ),
                    direction="up" if delta > 0 else "down",
                    audit={
                        "prior_inr": round(prior.get(cat, 0.0), 2),
                        "recent_inr": round(recent.get(cat, 0.0), 2),
                        "window_midpoint": str(midpoint),
                    },
                )
            )

    drifts.sort(key=lambda d: -abs(d.delta_pp))
    return drifts
