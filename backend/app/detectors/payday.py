"""
Payday cliff: detect post-salary spending spikes.
"""
from __future__ import annotations

import statistics
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal

DISCRETIONARY_EXCLUDE = {"Bills", "EMI", "Rent", "Salary", "Groceries", "Misc"}
SPIKE_RATIO_THRESHOLD = 1.6  # calibrated for Bangalore-young-pro distribution


@dataclass
class PaydayCliff:
    salary_day: date
    post_payday_total_inr: Decimal
    baseline_daily_avg_inr: Decimal
    spike_ratio: float
    cliff_pct: float
    audit: dict = field(default_factory=dict)


def detect_payday_cliff(transactions: list[dict]) -> PaydayCliff | None:
    if not transactions:
        return None

    sorted_txs = sorted(transactions, key=lambda t: t["date"])
    min_date = sorted_txs[0]["date"]

    # Salary = largest positive in first 7 days, category=Salary
    candidates = [
        t for t in sorted_txs
        if t["category"] == "Salary" and (t["date"] - min_date).days <= 7
    ]
    if not candidates:
        return None
    salary_tx = max(candidates, key=lambda t: float(t["amount"]))
    salary_day = salary_tx["date"]

    # Discretionary daily totals
    daily: dict[date, float] = {}
    for t in sorted_txs:
        if t["category"] in DISCRETIONARY_EXCLUDE:
            continue
        amt = float(t["amount"])
        if amt <= 0:
            continue
        daily[t["date"]] = daily.get(t["date"], 0.0) + amt

    if not daily:
        return None

    post_days = [salary_day + timedelta(days=i) for i in range(0, 4)]
    baseline_days = [
        d for d in daily.keys()
        if d >= salary_day + timedelta(days=7)
    ]

    post_total = sum(daily.get(d, 0.0) for d in post_days)
    baseline_total = sum(daily.get(d, 0.0) for d in baseline_days)

    post_avg = post_total / max(len(post_days), 1)
    baseline_avg = baseline_total / max(len(baseline_days), 1)

    if baseline_avg <= 0:
        return None

    spike_ratio = post_avg / baseline_avg
    if spike_ratio < SPIKE_RATIO_THRESHOLD:
        return None

    total_disc = sum(daily.values()) or 1.0
    cliff_pct = (post_total / total_disc) * 100

    return PaydayCliff(
        salary_day=salary_day,
        post_payday_total_inr=Decimal(f"{post_total:.2f}"),
        baseline_daily_avg_inr=Decimal(f"{baseline_avg:.2f}"),
        spike_ratio=round(spike_ratio, 2),
        cliff_pct=round(cliff_pct, 2),
        audit={
            "salary_inr": float(salary_tx["amount"]),
            "post_days_window": "salary_day..+3",
            "baseline_days_count": len(baseline_days),
            "post_daily_avg_inr": round(post_avg, 2),
        },
    )
