from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import Bidder, Tender
from backend.services.audit_report_service import AuditAndReportService

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/bidder/{bidder_id}/html", response_class=HTMLResponse)
def get_bidder_html_report(bidder_id: str, db: Session = Depends(get_db)):
    b = db.query(Bidder).filter(Bidder.id == bidder_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bidder not found")
    t = db.query(Tender).filter(Tender.id == b.tender_id).first()

    html = AuditAndReportService.generate_html_report(b, t)
    return HTMLResponse(content=html, status_code=200)
