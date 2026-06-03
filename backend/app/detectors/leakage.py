"""
Ghost-spend leakage: micro charges under ₹100 that accumulate.
Flag if total micro-spend > 8% of total spend.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from decimal import Decimal

MICRO_THRESHOLD_INR = 100.0
LEAK_RATIO_THRESHOLD = 0.03  # 3% — calibrated for Indian UPI patterns where micro-charges dominate


@dataclass
class Leakage:
    tx_count: int
    total_inr: Decimal
    avg_inr: Decimal
    leak_ratio_pct: float
    sample_merchants: list[str]
    audit: dict = field(default_factory=dict)


def detect_leakage(transactions: list[dict]) -> Leakage | None:
    expenses = [
        t for t in transactions
        if t["category"] != "Salary" and float(t["amount"]) > 0
    ]
    if not expenses:
        return None

    total_spend = sum(float(t["amount"]) for t in expenses)
    micros = [t for t in expenses if float(t["amount"]) < MICRO_THRESHOLD_INR]

    if not micros:
        return None

    micro_total = sum(float(t["amount"]) for t in micros)
    leak_ratio = micro_total / total_spend if total_spend else 0

    if leak_ratio < LEAK_RATIO_THRESHOLD:
        return None

    counter = Counter(t["merchant"] for t in micros)
    top = [m for m, _ in counter.most_common(5)]

    return Leakage(
        tx_count=len(micros),
        total_inr=Decimal(f"{micro_total:.2f}"),
        avg_inr=Decimal(f"{micro_total / len(micros):.2f}"),
        leak_ratio_pct=round(leak_ratio * 100, 2),
        sample_merchants=top,
        audit={
            "threshold_inr": MICRO_THRESHOLD_INR,
            "ratio_threshold_pct": LEAK_RATIO_THRESHOLD * 100,
            "total_spend_inr": round(total_spend, 2),
        },
    )
