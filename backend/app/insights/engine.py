"""
Insight engine: registry of rules. Each rule inspects detector outputs and
emits a structured Insight. Engine ranks by impact * confidence_weight * actionability.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Callable, Literal, Optional

CONFIDENCE_WEIGHT = {"high": 1.0, "med": 0.6, "low": 0.3}


@dataclass
class Insight:
    rule_id: str
    title: str
    detail: str
    impact_monthly_inr: Decimal
    confidence: Literal["high", "med", "low"]
    actionability: float
    action_type: Optional[str] = None
    action_target: Optional[str] = None
    audit: dict = field(default_factory=dict)

    @property
    def score(self) -> float:
        return (
            float(self.impact_monthly_inr)
            * CONFIDENCE_WEIGHT[self.confidence]
            * self.actionability
        )


@dataclass
class InsightRule:
    rule_id: str
    applies: Callable[[dict], bool]
    build: Callable[[dict], Insight]


class InsightEngine:
    def __init__(self) -> None:
        self.rules: list[InsightRule] = []

    def register(self, rule: InsightRule) -> None:
        self.rules.append(rule)

    def evaluate(self, detector_outputs: dict, top_k: int = 5) -> list[Insight]:
        insights: list[Insight] = []
        for rule in self.rules:
            try:
                if rule.applies(detector_outputs):
                    insights.extend(_as_list(rule.build(detector_outputs)))
            except Exception as e:
                print(f"[insight rule {rule.rule_id} failed] {e}")
        insights.sort(key=lambda i: -i.score)
        return insights[:top_k]


def _as_list(x) -> list[Insight]:
    if isinstance(x, list):
        return x
    return [x]
