from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    session_id = Column(String, unique=True, nullable=False, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="user", cascade="all, delete-orphan")
    chat_turns = relationship("ChatTurn", back_populates="user", cascade="all, delete-orphan")
    proposals = relationship("ActionProposal", back_populates="user", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    date = Column(Date, nullable=False, index=True)
    merchant_raw = Column(String, nullable=False)
    merchant_canonical = Column(String)
    amount = Column(Numeric(12, 2), nullable=False)
    category = Column(String, index=True)
    category_canonical = Column(String)

    user = relationship("User", back_populates="transactions")


class Insight(Base):
    __tablename__ = "insights"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    rule_id = Column(String, nullable=False)
    title = Column(String)
    detail = Column(String)
    impact_monthly_inr = Column(Numeric(12, 2))
    confidence = Column(String)
    actionability = Column(Numeric(3, 2))
    action_type = Column(String)
    action_target = Column(String)
    audit = Column(JSON)
    score = Column(Numeric(14, 4))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="insights")


class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True)
    insight_id = Column(Integer, ForeignKey("insights.id"))
    event_type = Column(String)
    payload = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatTurn(Base):
    __tablename__ = "chat_turns"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    role = Column(String)
    content = Column(String)
    tool_calls = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_turns")


class ActionProposal(Base):
    __tablename__ = "action_proposals"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    proposal_id = Column(String, unique=True, index=True)
    action_type = Column(String)
    target = Column(String)
    rationale = Column(String)
    status = Column(String, default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="proposals")
