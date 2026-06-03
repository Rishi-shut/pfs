"""
Subscription detection:
1. Normalize merchant strings (strip noise prefixes + digit runs).
2. Cluster via Jaro-Winkler similarity > 0.85 -> canonical merchant.
3. For each cluster (size >= 2), compute time-delta CV.
4. Map to cadence (weekly / monthly / quarterly / annual).
5. Reject clusters with > 2% amount variance.
6. Score dormancy against EXPECTED_USAGE map.
"""
from __future__ import annotations

import re
import statistics
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Literal

import jellyfish

# ─── Constants ──────────────────────────────────────────────────────
NOISE_PREFIXES = ("UPI-", "POS-", "ATD*", "UPI/AUTOPAY/", "POSP-")
DIGIT_RUN = re.compile(r"\d{4,}")
PUNCT = re.compile(r"[*/\\\-_.]+")
WHITESPACE = re.compile(r"\s+")
SIM_THRESHOLD = 0.85
AMOUNT_TOLERANCE = 0.02

EXPECTED_USAGE = {
    "cult.fit": "Fitness",
    "cultfit": "Fitness",
    "netflix": "Entertainment",
    "spotify": "Entertainment",
    "audible": "Books",
    "gym": "Fitness",
}


# ─── Data classes ───────────────────────────────────────────────────
@dataclass
class Subscription:
    canonical_merchant: str
    cost: Decimal
    cadence: Literal["weekly", "monthly", "quarterly", "annual", "irregular"]
    confidence: Literal["high", "med", "low"]
    transaction_count: int
    dormant: bool
    dormancy: str  # "yes" | "possibly" | "no"
    audit: dict = field(default_factory=dict)


# ─── Helpers ────────────────────────────────────────────────────────
def normalize(raw: str) -> str:
    """Strip noise prefixes, digit runs, punctuation."""
    s = raw.upper()
    for prefix in NOISE_PREFIXES:
        if s.startswith(prefix.upper()):
            s = s[len(prefix):]
    s = DIGIT_RUN.sub(" ", s)
    s = PUNCT.sub(" ", s)
    s = WHITESPACE.sub(" ", s).strip()
    return s


def cluster_merchants(merchants: list[str]) -> list[list[int]]:
    """
    Return list of clusters, each a list of indices into the input list.
    Greedy: each merchant joins the first cluster whose representative
    has Jaro-Winkler similarity > 0.85.
    """
    norms = [normalize(m) for m in merchants]
    clusters: list[list[int]] = []
    reps: list[str] = []
    for i, n in enumerate(norms):
        if not n:
            continue
        placed = False
        for ci, rep in enumerate(reps):
            if jellyfish.jaro_winkler_similarity(n, rep) > SIM_THRESHOLD:
                clusters[ci].append(i)
                placed = True
                break
        if not placed:
            clusters.append([i])
            reps.append(n)
    return clusters


def _cadence_from_cv(cv: float, median_delta: float) -> str:
    if cv < 0.15 and 6 <= median_delta <= 8:
        return "weekly"
    if cv < 0.15 and 27 <= median_delta <= 32:
        return "monthly"
    if cv < 0.20 and 88 <= median_delta <= 95:
        return "quarterly"
    if cv < 0.10 and 360 <= median_delta <= 370:
        return "annual"
    return "irregular"


# ─── Public ──────────────────────────────────────────────────────────
def detect_subscriptions(
    transactions: list[dict],
    category_counts: dict[str, int] | None = None,
) -> list[Subscription]:
    """
    transactions: [{"date": date, "merchant": str, "amount": Decimal, "category": str}, ...]
    category_counts: optional map of category -> total tx count, used for dormancy.
    """
    if not transactions:
        return []

    merchants = [t["merchant"] for t in transactions]
    clusters = cluster_merchants(merchants)
    out: list[Subscription] = []

    for cluster in clusters:
        if len(cluster) < 1:
            continue

        txs = [transactions[i] for i in cluster]
        amounts = [float(t["amount"]) for t in txs]
        median_amt = statistics.median(amounts)

        if median_amt <= 0:
            continue

        # Amount tolerance check: max-min variance vs median
        amt_variance = (max(amounts) - min(amounts)) / median_amt if median_amt else 0
        if len(amounts) >= 2 and amt_variance > AMOUNT_TOLERANCE:
            continue

        # Single-transaction case: still consider as subscription if amount is
        # in typical sub range (₹50-₹3,000) — common in a 30-day window
        if len(txs) == 1:
            amt = amounts[0]
            if not (50 <= amt <= 3000):
                continue
            cadence = "monthly"
            cv = 0.0
            median_delta = 30.0
            confidence: Literal["high", "med", "low"] = "med"
        else:
            dates_sorted = sorted([t["date"] for t in txs])
            deltas = [
                (dates_sorted[i + 1] - dates_sorted[i]).days
                for i in range(len(dates_sorted) - 1)
            ]
            if not deltas:
                continue
            mean_d = statistics.mean(deltas)
            median_delta = statistics.median(deltas)
            stdev_d = statistics.stdev(deltas) if len(deltas) > 1 else 0
            cv = stdev_d / mean_d if mean_d else 0
            cadence = _cadence_from_cv(cv, median_delta)
            if cadence == "irregular":
                continue
            confidence = "high"

        # Prefer canonical merchant from the enriched lookup table — falls back
        # to the longest raw string title-cased to preserve characters that
        # normalization strips (e.g. the period in "Cult.fit").
        from app.pipeline.enrich import lookup_canonical
        looked_up = next(
            (lookup_canonical(t["merchant"]) for t in txs if lookup_canonical(t["merchant"])),
            None,
        )
        canonical = (
            looked_up[0] if looked_up
            else max((t["merchant"] for t in txs), key=len).title()
        )

        # Dormancy scoring
        canon_key = canonical.lower().replace(" ", "")
        dormancy = "no"
        dormant_bool = False
        for sub_key, expected_cat in EXPECTED_USAGE.items():
            if sub_key in canon_key:
                related_count = (category_counts or {}).get(expected_cat, 0)
                # Subtract this sub's own transactions from related count
                own_in_cat = sum(1 for t in txs if t["category"] == expected_cat)
                effective = related_count - own_in_cat
                if effective == 0:
                    dormancy = "yes"
                    dormant_bool = True
                    confidence = "high"
                elif effective < 2:
                    dormancy = "possibly"
                    if confidence != "high":
                        confidence = "med"
                break

        out.append(
            Subscription(
                canonical_merchant=canonical,
                cost=Decimal(f"{median_amt:.2f}"),
                cadence=cadence,
                confidence=confidence,
                transaction_count=len(txs),
                dormant=dormant_bool,
                dormancy=dormancy,
                audit={
                    "cluster_size": len(txs),
                    "cv": round(cv, 4),
                    "median_delta_days": round(median_delta, 2),
                    "amount_variance_pct": round(amt_variance * 100, 2),
                },
            )
        )

    return out
