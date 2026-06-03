"""Integration test: detectors -> insight engine on the sample CSV."""
import csv
from datetime import datetime
from decimal import Decimal
from pathlib import Path

from app.insights.rules import build_default_engine
from app.detectors.anomalies import detect_anomalies
from app.detectors.drift import detect_drift
from app.detectors.leakage import detect_leakage
from app.detectors.payday import detect_payday_cliff
from app.detectors.subscriptions import detect_subscriptions
from collections import Counter

SAMPLE = Path(__file__).resolve().parent.parent.parent / "data" / "sample_transactions.csv"


def _load_sample() -> list[dict]:
    rows = []
    with SAMPLE.open() as f:
        for i, row in enumerate(csv.DictReader(f)):
            rows.append({
                "id": i,
                "date": datetime.strptime(row["Date"], "%Y-%m-%d").date(),
                "merchant": row["Merchant"],
                "amount": Decimal(row["Amount"]),
                "category": row["Category"],
            })
    return rows


def test_sample_csv_exists():
    assert SAMPLE.exists(), f"Run `python -m app.sample_data` first. Looking for {SAMPLE}"


def test_full_pipeline_on_sample():
    rows = _load_sample()
    assert len(rows) > 100

    cat_counts = Counter(r["category"] for r in rows)
    outputs = {
        "subscriptions": detect_subscriptions(rows, dict(cat_counts)),
        "anomalies": detect_anomalies(rows),
        "drifts": detect_drift(rows),
        "leakage": detect_leakage(rows),
        "cliff": detect_payday_cliff(rows),
    }

    # Sanity on each detector
    assert len(outputs["subscriptions"]) >= 3, "expected several subscriptions"
    assert outputs["leakage"] is not None, "leakage should fire on sample"
    assert outputs["cliff"] is not None, "payday cliff should fire on sample"

    # Insight engine
    engine = build_default_engine()
    insights = engine.evaluate(outputs, top_k=5)
    assert len(insights) >= 4

    rule_ids = [i.rule_id for i in insights]
    assert "dormant_subscription" in rule_ids, f"expected Cult.fit dormant insight, got {rule_ids}"
    # Score ordering
    scores = [i.score for i in insights]
    assert scores == sorted(scores, reverse=True), "insights should be ranked by score desc"
