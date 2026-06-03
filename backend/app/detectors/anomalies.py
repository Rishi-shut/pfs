"""
Anomaly detection via Modified Z-score (Iglewicz-Hoaglin, 1993).
Segments transactions by (category, day_of_week) before computing baseline,
so weekend dining vs weekday dining are different distributions.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

import numpy as np

Z_THRESHOLD = 3.5
MIN_BUCKET_SIZE = 3


@dataclass
class Anomaly:
    transaction_id: int
    amount: Decimal
    merchant: str
    category: str
    date: date
    modified_zscore: float
    context: str
    audit: dict = field(default_factory=dict)


def modified_zscore(values: list[float]) -> list[float]:
    """Median Absolute Deviation based z-score. Robust to skew."""
    arr = np.array(values, dtype=float)
    median = float(np.median(arr))
    mad = float(np.median(np.abs(arr - median)))
    if mad == 0:
        return [0.0] * len(values)
    return [0.6745 * (x - median) / mad for x in values]


def detect_anomalies(transactions: list[dict]) -> list[Anomaly]:
    """
    transactions: [{"id": int, "date": date, "merchant": str, "amount": Decimal,
                    "category": str}, ...]
    Skip salary/income (positive flows treated separately).
    """
    if not transactions:
        return []

    # Bucket by (category, day-of-week). dow = 0=Mon ... 6=Sun.
    buckets: dict[tuple[str, int], list[int]] = defaultdict(list)
    for idx, t in enumerate(transactions):
        if t["category"] == "Salary":
            continue
        amt = float(t["amount"])
        if amt <= 0:
            continue
        dow = t["date"].weekday()
        buckets[(t["category"], dow)].append(idx)

    out: list[Anomaly] = []
    for (cat, dow), idxs in buckets.items():
        if len(idxs) < MIN_BUCKET_SIZE:
            continue
        amts = [float(transactions[i]["amount"]) for i in idxs]
        zs = modified_zscore(amts)
        median_amt = float(np.median(amts))
        for local_i, z in enumerate(zs):
            if abs(z) > Z_THRESHOLD:
                t = transactions[idxs[local_i]]
                dow_name = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dow]
                out.append(
                    Anomaly(
                        transaction_id=t.get("id", idxs[local_i]),
                        amount=Decimal(str(t["amount"])),
                        merchant=t["merchant"],
                        category=cat,
                        date=t["date"],
                        modified_zscore=round(float(z), 2),
                        context=(
                            f"₹{int(float(t['amount'])):,} vs ₹{int(median_amt):,} "
                            f"median for {cat} on {dow_name}s"
                        ),
                        audit={
                            "bucket": f"{cat}/{dow_name}",
                            "bucket_size": len(idxs),
                            "median": round(median_amt, 2),
                            "method": "modified_zscore_iglewicz_hoaglin_1993",
                        },
                    )
                )

    return out
