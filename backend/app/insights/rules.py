"""
Built-in insight rules. Each rule inspects detector outputs and emits an Insight.
Detector outputs key shape:
{
  "subscriptions": list[Subscription],
  "anomalies": list[Anomaly],
  "drifts": list[CategoryDrift],
  "leakage": Optional[Leakage],
  "cliff": Optional[PaydayCliff],
}
"""
from __future__ import annotations

from decimal import Decimal

from app.insights.engine import Insight, InsightEngine, InsightRule

DISCRETIONARY_CATS = {"Shopping", "Entertainment", "Food"}


# ─── Rule 1: Dormant subscription ────────────────────────────────────
def _dormant_sub(outputs: dict) -> Insight | list[Insight]:
    subs = outputs.get("subscriptions") or []
    dormant = [s for s in subs if s.dormant]
    return [
        Insight(
            rule_id="dormant_subscription",
            title=f"Cancel {s.canonical_merchant} — appears dormant",
            detail=(
                f"You're paying ₹{int(float(s.cost)):,}/{s.cadence} for "
                f"{s.canonical_merchant} but show no related activity this month. "
                f"Cancelling recovers ₹{int(float(s.cost) * 12):,}/year."
            ),
            impact_monthly_inr=Decimal(s.cost),
            confidence="high",
            actionability=1.0,
            action_type="cancel_sub",
            action_target=s.canonical_merchant,
            audit={
                **s.audit,
                "merchant": s.canonical_merchant,
                "cadence": s.cadence,
                "dormancy": s.dormancy,
                "rule_version": "1.0.0",
            },
        )
        for s in dormant
    ]


def _has_dormant(o: dict) -> bool:
    return any(getattr(s, "dormant", False) for s in (o.get("subscriptions") or []))


# ─── Rule 2: Ghost spend leakage ─────────────────────────────────────
def _ghost_spend(outputs: dict) -> Insight:
    leak = outputs["leakage"]
    impact = float(leak.total_inr) * 0.6
    return Insight(
        rule_id="ghost_spend_leak",
        title="Plug your micro-spend leak",
        detail=(
            f"{leak.tx_count} micro-charges under ₹100 — "
            f"₹{int(float(leak.total_inr)):,} ({leak.leak_ratio_pct}% of spend). "
            f"A weekly ₹{int(impact / 4):,} cap recovers most of it."
        ),
        impact_monthly_inr=Decimal(f"{impact:.2f}"),
        confidence="med",
        actionability=0.4,
        action_type="set_cap",
        action_target="Misc",
        audit={
            **leak.audit,
            "tx_count": leak.tx_count,
            "leak_ratio_pct": leak.leak_ratio_pct,
            "sample_merchants": leak.sample_merchants,
            "rule_version": "1.0.0",
        },
    )


# ─── Rule 3: Payday cliff ────────────────────────────────────────────
def _payday_cliff(outputs: dict) -> Insight:
    c = outputs["cliff"]
    impact = float(c.post_payday_total_inr) * 0.3
    return Insight(
        rule_id="payday_cliff",
        title="Auto-sweep ₹{:,} on payday".format(int(impact)),
        detail=(
            f"You spent ₹{int(float(c.post_payday_total_inr)):,} in the 3 days "
            f"after payday — {c.cliff_pct}% of monthly discretionary, "
            f"{c.spike_ratio}x baseline. An auto-sweep on day 1 prevents the cliff."
        ),
        impact_monthly_inr=Decimal(f"{impact:.2f}"),
        confidence="high",
        actionability=0.6,
        action_type="auto_sweep",
        action_target=str(int(impact)),
        audit={
            **c.audit,
            "salary_day": str(c.salary_day),
            "spike_ratio": c.spike_ratio,
            "cliff_pct": c.cliff_pct,
            "rule_version": "1.0.0",
        },
    )


# ─── Rule 4: Category drift up ───────────────────────────────────────
def _drift_up(outputs: dict) -> list[Insight]:
    drifts = [
        d for d in (outputs.get("drifts") or [])
        if d.direction == "up" and abs(d.delta_pp) >= 8
    ]
    out: list[Insight] = []
    for d in drifts[:2]:  # cap at top 2 by magnitude
        impact = float(d.delta_inr) * 0.5
        if impact <= 0:
            continue
        out.append(
            Insight(
                rule_id="category_drift_up",
                title=f"{d.category} spend is creeping up ({d.delta_pp:+.1f}pp)",
                detail=(
                    f"{d.category} share moved {d.prior_share_pct}% → "
                    f"{d.recent_share_pct}% over the month. Setting a cap "
                    f"recovers ~₹{int(impact):,}/mo."
                ),
                impact_monthly_inr=Decimal(f"{impact:.2f}"),
                confidence="med",
                actionability=0.5,
                action_type="set_cap",
                action_target=d.category,
                audit={
                    **d.audit,
                    "category": d.category,
                    "delta_pp": d.delta_pp,
                    "rule_version": "1.0.0",
                },
            )
        )
    return out


def _has_drift_up(o: dict) -> bool:
    return any(
        d.direction == "up" and abs(d.delta_pp) >= 8
        for d in (o.get("drifts") or [])
    )


# ─── Rule 5: Impulse anomaly ─────────────────────────────────────────
def _impulse(outputs: dict) -> list[Insight]:
    discr = [
        a for a in (outputs.get("anomalies") or [])
        if a.category in DISCRETIONARY_CATS and a.modified_zscore > 4
    ]
    out: list[Insight] = []
    for a in discr[:2]:
        impact = float(a.amount) * 0.7
        out.append(
            Insight(
                rule_id="impulse_anomaly",
                title=f"Impulse charge at {a.merchant}",
                detail=(
                    f"{a.context}. Z-score {a.modified_zscore}. "
                    f"Setting a 24-hr cooling-off rule on {a.category} "
                    f"prevents ~₹{int(impact):,} of similar spikes."
                ),
                impact_monthly_inr=Decimal(f"{impact:.2f}"),
                confidence="med",
                actionability=0.3,
                action_type="awareness",
                action_target=a.category,
                audit={
                    **a.audit,
                    "tx_id": a.transaction_id,
                    "amount": float(a.amount),
                    "modified_zscore": a.modified_zscore,
                    "rule_version": "1.0.0",
                },
            )
        )
    return out


def _has_impulse(o: dict) -> bool:
    return any(
        a.category in DISCRETIONARY_CATS and a.modified_zscore > 4
        for a in (o.get("anomalies") or [])
    )


# ─── Engine factory ──────────────────────────────────────────────────
def build_default_engine() -> InsightEngine:
    e = InsightEngine()
    e.register(InsightRule("dormant_subscription", _has_dormant, _dormant_sub))
    e.register(InsightRule("ghost_spend_leak", lambda o: o.get("leakage") is not None, _ghost_spend))
    e.register(InsightRule("payday_cliff", lambda o: o.get("cliff") is not None, _payday_cliff))
    e.register(InsightRule("category_drift_up", _has_drift_up, _drift_up))
    e.register(InsightRule("impulse_anomaly", _has_impulse, _impulse))
    return e
