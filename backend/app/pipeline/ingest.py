"""
CSV -> DB ingestion. Expects columns: Date, Merchant, Amount, Category.
"""
from __future__ import annotations

import csv
import io
from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import Transaction, User

REQUIRED = {"Date", "Merchant", "Amount", "Category"}


def parse_csv(content: bytes) -> tuple[list[dict], list[str]]:
    """Return (parsed_rows, errors). Rows are dicts ready for ORM."""
    errors: list[str] = []
    rows: list[dict] = []
    text = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))

    missing = REQUIRED - set(reader.fieldnames or [])
    if missing:
        errors.append(f"Missing required columns: {sorted(missing)}")
        return rows, errors

    for line_no, row in enumerate(reader, start=2):
        try:
            d = datetime.strptime(row["Date"].strip(), "%Y-%m-%d").date()
            amt = Decimal(row["Amount"].strip())
            merchant = (row["Merchant"] or "").strip()
            category = (row["Category"] or "Other").strip()
            if not merchant:
                errors.append(f"Line {line_no}: empty merchant")
                continue
            rows.append(
                {
                    "date": d,
                    "merchant_raw": merchant,
                    "amount": amt,
                    "category": category,
                }
            )
        except Exception as e:
            errors.append(f"Line {line_no}: {e}")

    return rows, errors


def save_transactions(db: Session, user: User, rows: list[dict]) -> int:
    db.query(Transaction).filter(Transaction.user_id == user.id).delete()
    objs = [Transaction(user_id=user.id, **r) for r in rows]
    db.add_all(objs)
    db.commit()
    return len(objs)
