import uuid
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.schemas import SessionCreate, SessionOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/session", response_model=SessionOut)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    sid = f"sess_{uuid.uuid4().hex[:16]}"
    user = User(session_id=sid, name=payload.name.strip())
    db.add(user)
    db.commit()
    return SessionOut(session_id=sid, name=user.name)


def get_current_user(
    x_session_id: str | None = Header(default=None, alias="X-Session-Id"),
    db: Session = Depends(get_db),
) -> User:
    if not x_session_id:
        raise HTTPException(status_code=401, detail="X-Session-Id header required")
    user = db.query(User).filter(User.session_id == x_session_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Session not found")
    return user
