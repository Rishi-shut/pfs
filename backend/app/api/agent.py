from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db import get_db
from app.models import ActionProposal, User
from app.schemas import ChatIn, ChatOut, ProposalOut
from app.agent.orchestrator import chat as run_chat

router = APIRouter(prefix="/api", tags=["agent"])


@router.post("/agent/chat", response_model=ChatOut)
async def agent_chat(
    payload: ChatIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = await run_chat(payload.message, user, db)
    return ChatOut(
        reply=result["reply"],
        tool_calls=result["tool_calls"],
        proposal_ids=result.get("proposal_ids", []),
    )


@router.get("/proposals/{session_id}", response_model=list[ProposalOut])
def list_proposals(session_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.session_id == session_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Session not found")
    rows = (
        db.query(ActionProposal)
        .filter(ActionProposal.user_id == user.id)
        .order_by(ActionProposal.created_at.desc())
        .all()
    )
    return [
        ProposalOut(
            proposal_id=r.proposal_id,
            action_type=r.action_type,
            target=r.target,
            rationale=r.rationale,
            status=r.status,
        )
        for r in rows
    ]


@router.post("/proposals/{proposal_id}/confirm", response_model=ProposalOut)
def confirm_proposal(proposal_id: str, db: Session = Depends(get_db)):
    p = db.query(ActionProposal).filter(ActionProposal.proposal_id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
    p.status = "CONFIRMED"
    db.commit()
    return ProposalOut(
        proposal_id=p.proposal_id,
        action_type=p.action_type,
        target=p.target,
        rationale=p.rationale,
        status=p.status,
    )
