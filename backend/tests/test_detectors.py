"""Unit tests for detector algorithms."""
from datetime import date, timedelta
from decimal import Decimal

from app.detectors.anomalies import detect_anomalies, modified_zscore
from app.detectors.drift import detect_drift
from app.detectors.leakage import detect_leakage
from app.detectors.payday import detect_payday_cliff
from app.detectors.subscriptions import (
    cluster_merchants,
    detect_subscriptions,
    normalize,
)


# ─── Modified Z-score ────────────────────────────────────────────────
def test_modified_zscore_zero_when_no_variation():
    assert modified_zscore([100.0, 100.0, 100.0]) == [0.0, 0.0, 0.0]


def test_modified_zscore_flags_clear_outlier():
    # 6 small + 1 huge -> modified z on the huge one should be very large
    vals = [50, 60, 70, 80, 90, 100, 35000]
    zs = modified_zscore([float(v) for v in vals])
    assert abs(zs[-1]) > 10


def test_anomaly_detection_segments_by_dow():
    """A ₹8,900 Sunday Shopping vs ₹300-700 baseline Sundays should fire."""
    base = date(2026, 4, 1)  # Wed
    # Sundays: 4/5, 4/12, 4/19, 4/26
    rows = [
        {"id": 1, "date": date(2026, 4, 5), "merchant": "Myntra", "amount": Decimal("300"), "category": "Shopping"},
        {"id": 2, "date": date(2026, 4, 12), "merchant": "Myntra", "amount": Decimal("450"), "category": "Shopping"},
        {"id": 3, "date": date(2026, 4, 19), "merchant": "Myntra", "amount": Decimal("400"), "category": "Shopping"},
        {"id": 4, "date": date(2026, 4, 26), "merchant": "Myntra", "amount": Decimal("8900"), "category": "Shopping"},
    ]
    anoms = detect_anomalies(rows)
    assert len(anoms) == 1
    assert anoms[0].transaction_id == 4
    assert anoms[0].modified_zscore > 3.5


# ─── Subscriptions ───────────────────────────────────────────────────
def test_normalize_strips_prefixes_and_digits():
    assert normalize("UPI-ZOMATO-ORDER") == "ZOMATO ORDER"
    # ATD* + UPI/AUTOPAY/ are both noise prefixes -> both get stripped
    assert normalize("ATD*UPI/AUTOPAY/SPOTIFY") == "SPOTIFY"
    assert "44211" not in normalize("UBER INDIA TRIP-ID-44211")


def test_jaro_winkler_clusters_merchant_variants():
    clusters = cluster_merchants(["SPOTIFY*PREMIUM", "spotify", "Spotify Family"])
    assert len(clusters) == 1
    assert len(clusters[0]) == 3


def test_subscription_detection_monthly_fx_drift():
    """4 monthly Spotify charges with FX drift within 2% tolerance -> 1 monthly sub."""
    rows = [
        {"date": date(2026, 1, 2), "merchant": "SPOTIFY*PREMIUM", "amount": Decimal("119"), "category": "Subscriptions"},
        {"date": date(2026, 2, 2), "merchant": "SPOTIFY", "amount": Decimal("119"), "category": "Subscriptions"},
        {"date": date(2026, 3, 2), "merchant": "SPOTIFY*PREMIUM", "amount": Decimal("118.82"), "category": "Subscriptions"},
        {"date": date(2026, 4, 2), "merchant": "SPOTIFY", "amount": Decimal("119"), "category": "Subscriptions"},
    ]
    subs = detect_subscriptions(rows)
    assert len(subs) >= 1
    spotify = next((s for s in subs if "spotify" in s.canonical_merchant.lower()), None)
    assert spotify is not None
    assert spotify.cadence == "monthly"
    assert spotify.transaction_count == 4


def test_dormant_subscription_fires_when_no_related_category_activity():
    """Single Cult.fit charge + no Fitness activity = dormant."""
    rows = [
        {"date": date(2026, 4, 5), "merchant": "CULT.FIT*MEMBERSHIP", "amount": Decimal("2499"), "category": "Fitness"},
    ]
    # category_counts: only the cult.fit charge itself is in Fitness
    subs = detect_subscriptions(rows, category_counts={"Fitness": 1})
    assert len(subs) == 1
    assert subs[0].dormant is True


# ─── Drift ───────────────────────────────────────────────────────────
def test_drift_detection_8pp_threshold():
    """Shopping share 0%->20% over the window should fire."""
    rows = []
    # Prior half: ₹10,000 Food
    for i in range(5):
        rows.append({
            "date": date(2026, 4, 1 + i),
            "merchant": "Zomato",
            "amount": Decimal("2000"),
            "category": "Food",
        })
    # Recent half: ₹5,000 Food + ₹5,000 Shopping
    for i in range(3):
        rows.append({
            "date": date(2026, 4, 25 + i),
            "merchant": "Zomato",
            "amount": Decimal("1666"),
            "category": "Food",
        })
        rows.append({
            "date": date(2026, 4, 25 + i),
            "merchant": "Myntra",
            "amount": Decimal("1666"),
            "category": "Shopping",
        })
    drifts = detect_drift(rows)
    shopping = next((d for d in drifts if d.category == "Shopping"), None)
    assert shopping is not None
    assert shopping.direction == "up"
    assert abs(shopping.delta_pp) >= 8


# ─── Leakage ─────────────────────────────────────────────────────────
def test_leakage_does_not_fire_below_threshold():
    """Two tiny charges in a huge spend window -> ratio too low."""
    rows = [
        {"date": date(2026, 4, 1), "merchant": "Big", "amount": Decimal("50000"), "category": "Bills"},
        {"date": date(2026, 4, 2), "merchant": "Chai", "amount": Decimal("30"), "category": "Misc"},
    ]
    assert detect_leakage(rows) is None


def test_leakage_fires_above_3pct():
    rows = [{"date": date(2026, 4, 1), "merchant": "Big", "amount": Decimal("1000"), "category": "Bills"}]
    rows += [
        {"date": date(2026, 4, 1 + i), "merchant": "Chai", "amount": Decimal("50"), "category": "Misc"}
        for i in range(10)
    ]
    leak = detect_leakage(rows)
    assert leak is not None
    assert leak.tx_count == 10
    assert leak.leak_ratio_pct >= 3


# ─── Payday cliff ────────────────────────────────────────────────────
def test_payday_cliff_fires_when_post_payday_spike():
    rows = [
        {"date": date(2026, 4, 1), "merchant": "PAY", "amount": Decimal("85000"), "category": "Salary"},
    ]
    # Post-payday days 1-3: heavy spend
    for d in (1, 2, 3):
        rows.append({"date": date(2026, 4, d), "merchant": "Zomato", "amount": Decimal("3000"), "category": "Food"})
    # Baseline days 8-25: lighter
    for d in range(8, 26):
        rows.append({"date": date(2026, 4, d), "merchant": "Zomato", "amount": Decimal("300"), "category": "Food"})

    cliff = detect_payday_cliff(rows)
    assert cliff is not None
    assert cliff.spike_ratio >= 1.8


def test_payday_cliff_skips_when_no_salary():
    rows = [{"date": date(2026, 4, 5), "merchant": "X", "amount": Decimal("500"), "category": "Food"}]
    assert detect_payday_cliff(rows) is None
