from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import AuditEvent
from backend.schemas.schemas import AuditEventSchema

router = APIRouter(prefix="/api/audit", tags=["Audit Trail"])

@router.get("", response_model=List[AuditEventSchema])
def get_audit_trail(tender_id: Optional[str] = None, bidder_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AuditEvent)
    if tender_id:
        query = query.filter(AuditEvent.tender_id == tender_id)
    if bidder_id:
        query = query.filter(AuditEvent.bidder_id == bidder_id)
    
    events = query.order_by(AuditEvent.timestamp.desc()).all()
    return [
        AuditEventSchema(
            id=e.id, tender_id=e.tender_id, bidder_id=e.bidder_id,
            action=e.action, actor=e.actor, source=e.source,
            result=e.result, details=e.details, timestamp=e.timestamp
        ) for e in events
    ]
