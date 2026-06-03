from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class SessionOut(BaseModel):
    session_id: str
    name: str


class UploadOut(BaseModel):
    transaction_count: int
    session_id: str


class InsightOut(BaseModel):
    id: int
    rule_id: str
    title: str
    detail: str
    impact_monthly_inr: float
    confidence: str
    actionability: float
    action_type: Optional[str]
    action_target: Optional[str]
    audit: dict
    score: float


class SimulateIn(BaseModel):
    deltas: dict[str, float]


class SimulateOut(BaseModel):
    monthly_savings_inr: float
    annual_savings_inr: float
    five_year_compounded_inr: float
    per_category: dict[str, float]


class ChatIn(BaseModel):
    message: str


class ChatOut(BaseModel):
    reply: str
    tool_calls: list[dict]
    proposal_ids: list[str] = []


class ProposalOut(BaseModel):
    proposal_id: str
    action_type: str
    target: str
    rationale: str
    status: str
