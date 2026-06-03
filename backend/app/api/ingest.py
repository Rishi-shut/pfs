from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db import get_db
from app.models import User
from app.pipeline.ingest import parse_csv, save_transactions
from app.schemas import UploadOut

router = APIRouter(prefix="/api", tags=["ingest"])
DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"
SAMPLE_CSV = DATA_DIR / "sample_transactions.csv"
SAMPLES_DIR = DATA_DIR / "samples"

# Map short keys to (filename, label, description)
SAMPLE_CATALOG = {
    "typical": (
        "01_typical.csv",
        "Typical",
        "Bangalore young pro · fires all 5 insights",
    ),
    "subscription_heavy": (
        "02_subscription_heavy.csv",
        "Subscription overload",
        "9 active subs incl. 3 dormant",
    ),
    "payday_addict": (
        "03_payday_addict.csv",
        "Payday addict",
        "60% of discretionary in days 1-3",
    ),
    "minimal": (
        "04_minimal.csv",
        "Frugal user",
        "Minimal — most insights should NOT fire",
    ),
    "anomaly_heavy": (
        "05_anomaly_heavy.csv",
        "Anomaly heavy",
        "Multiple Z-score outliers + Shopping drift",
    ),
}


@router.post("/upload", response_model=UploadOut)
async def upload(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = await file.read()
    rows, errors = parse_csv(content)
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors[:10]})
    n = save_transactions(db, user, rows)
    return UploadOut(transaction_count=n, session_id=user.session_id)


@router.get("/samples")
def list_samples():
    """Return the catalog of available sample CSVs."""
    out = []
    for key, (fname, label, desc) in SAMPLE_CATALOG.items():
        path = SAMPLES_DIR / fname
        out.append({
            "key": key,
            "label": label,
            "description": desc,
            "available": path.exists(),
        })
    return out


@router.post("/upload/sample", response_model=UploadOut)
async def upload_sample(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Load the default (typical) sample. Kept for backwards compat."""
    if not SAMPLE_CSV.exists():
        raise HTTPException(status_code=500, detail="Sample CSV not found on server")
    content = SAMPLE_CSV.read_bytes()
    rows, errors = parse_csv(content)
    if errors:
        raise HTTPException(status_code=500, detail={"errors": errors[:10]})
    n = save_transactions(db, user, rows)
    return UploadOut(transaction_count=n, session_id=user.session_id)


@router.post("/upload/sample/{key}", response_model=UploadOut)
async def upload_named_sample(
    key: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Load a named sample from data/samples/."""
    entry = SAMPLE_CATALOG.get(key)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Unknown sample '{key}'. Choose from {list(SAMPLE_CATALOG)}")
    path = SAMPLES_DIR / entry[0]
    if not path.exists():
        raise HTTPException(status_code=500, detail=f"Sample file missing: {path.name}")
    content = path.read_bytes()
    rows, errors = parse_csv(content)
    if errors:
        raise HTTPException(status_code=500, detail={"errors": errors[:10]})
    n = save_transactions(db, user, rows)
    return UploadOut(transaction_count=n, session_id=user.session_id)
