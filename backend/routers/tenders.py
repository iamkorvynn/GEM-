from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import Tender, Requirement, Bidder, AuditEvent
from backend.schemas.schemas import (
    TenderSchema, TenderCreate, RequirementSchema, AwardDecisionCreate, BidderSchema, DocumentSchema
)
from backend.services.audit_report_service import AuditAndReportService
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/tenders", tags=["Tenders"])

@router.get("", response_model=List[TenderSchema])
def list_tenders(db: Session = Depends(get_db)):
    tenders = db.query(Tender).all()
    res = []
    for t in tenders:
        bidders_count = db.query(Bidder).filter(Bidder.tender_id == t.id).count()
        reqs = db.query(Requirement).filter(Requirement.tender_id == t.id).all()
        req_schemas = [
            RequirementSchema(
                id=r.id, title=r.title, description=r.description,
                is_mandatory=r.is_mandatory, evidence_type=r.evidence_type,
                verification_source=r.verification_source, rule_type=r.rule_type,
                threshold_value=r.threshold_value, clause_reference=r.clause_reference
            ) for r in reqs
        ]
        res.append(TenderSchema(
            id=t.id,
            title=t.title,
            department=t.department,
            description=t.description,
            created_date=t.created_date,
            deadline=t.deadline,
            estimated_cost=t.estimated_cost,
            status=t.status,
            bidders_count=bidders_count,
            verification_progress=88.5,
            requirements=req_schemas
        ))
    return res

@router.get("/{id:path}", response_model=TenderSchema)
def get_tender(id: str, db: Session = Depends(get_db)):
    t = db.query(Tender).filter(Tender.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tender not found")
    bidders_count = db.query(Bidder).filter(Bidder.tender_id == t.id).count()
    reqs = db.query(Requirement).filter(Requirement.tender_id == t.id).all()
    req_schemas = [
        RequirementSchema(
            id=r.id, title=r.title, description=r.description,
            is_mandatory=r.is_mandatory, evidence_type=r.evidence_type,
            verification_source=r.verification_source, rule_type=r.rule_type,
            threshold_value=r.threshold_value, clause_reference=r.clause_reference
        ) for r in reqs
    ]
    return TenderSchema(
        id=t.id, title=t.title, department=t.department,
        description=t.description, created_date=t.created_date,
        deadline=t.deadline, estimated_cost=t.estimated_cost,
        status=t.status, bidders_count=bidders_count,
        verification_progress=88.5, requirements=req_schemas
    )

@router.post("", response_model=TenderSchema)
def create_tender(req: TenderCreate, db: Session = Depends(get_db)):
    tender_id = req.id or f"GEM/{datetime.now().year}/B/{uuid.uuid4().hex[:6].upper()}"
    existing = db.query(Tender).filter(Tender.id == tender_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tender ID already exists")

    t = Tender(
        id=tender_id,
        title=req.title,
        department=req.department,
        description=req.description,
        created_date=datetime.now().strftime("%Y-%m-%d"),
        deadline=req.deadline,
        estimated_cost=req.estimated_cost or "INR 1.0 Crore",
        status="ACTIVE"
    )
    db.add(t)
    db.commit()

    AuditAndReportService.log_event(
        db, action="TENDER_CREATED", source="Officer — Import Tender",
        result="SUCCESS", details=f"Created tender {t.id} — {t.title}", tender_id=t.id
    )

    return TenderSchema(
        id=t.id, title=t.title, department=t.department,
        description=t.description, created_date=t.created_date,
        deadline=t.deadline, estimated_cost=t.estimated_cost,
        status=t.status, bidders_count=0, verification_progress=0.0, requirements=[]
    )


@router.get("/{id:path}/bidders")
def get_tender_bidders(id: str, db: Session = Depends(get_db)):
    """Return all bidders scoped to a tender with summary fields."""
    t = db.query(Tender).filter(Tender.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tender not found")
    bidders = db.query(Bidder).filter(Bidder.tender_id == id).all()
    result = []
    for b in bidders:
        from backend.models.models import OfficerDecision
        od = db.query(OfficerDecision).filter(OfficerDecision.bidder_id == b.id).order_by(OfficerDecision.decided_at.desc()).first()
        result.append({
            "id": b.id,
            "company_name": b.company_name,
            "pan": b.pan,
            "gstin": b.gstin,
            "risk_level": b.risk_level,
            "compliance_score": b.compliance_score,
            "overall_status": b.overall_status,
            "verification_progress": b.verification_progress,
            "officer_decision": od.decision if od else None,
            "submitted_at": str(b.submitted_at),
        })
    return result


@router.patch("/{id:path}/award", response_model=TenderSchema)
def award_tender(id: str, req: AwardDecisionCreate, db: Session = Depends(get_db)):
    """Officer makes final award decision — marks tender COMPLETED."""
    t = db.query(Tender).filter(Tender.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tender not found")

    t.winner_bidder_id = req.winner_bidder_id
    t.award_notes = req.award_notes
    t.status = "COMPLETED"
    db.commit()

    winner_company = None
    if req.winner_bidder_id:
        wb = db.query(Bidder).filter(Bidder.id == req.winner_bidder_id).first()
        winner_company = wb.company_name if wb else req.winner_bidder_id

    AuditAndReportService.log_event(
        db, action="AWARD_DECISION", source="Officer — Award Decision",
        result="SUCCESS",
        details=f"Tender {id} awarded to {winner_company or 'NO AWARD'}. Notes: {req.award_notes or '—'}",
        tender_id=id
    )

    bidders_count = db.query(Bidder).filter(Bidder.tender_id == id).count()
    reqs = db.query(Requirement).filter(Requirement.tender_id == id).all()
    req_schemas = [
        RequirementSchema(
            id=r.id, title=r.title, description=r.description,
            is_mandatory=r.is_mandatory, evidence_type=r.evidence_type,
            verification_source=r.verification_source, rule_type=r.rule_type,
            threshold_value=r.threshold_value, clause_reference=r.clause_reference
        ) for r in reqs
    ]
    return TenderSchema(
        id=t.id, title=t.title, department=t.department,
        description=t.description, created_date=t.created_date,
        deadline=t.deadline, estimated_cost=t.estimated_cost,
        status=t.status, bidders_count=bidders_count,
        verification_progress=100.0, requirements=req_schemas,
        winner_bidder_id=t.winner_bidder_id, award_notes=t.award_notes
    )

@router.post("/{id:path}/analyze")
def analyze_tender_document(id: str, db: Session = Depends(get_db)):
    """Simulate AI extraction of tender requirements sequence."""
    t = db.query(Tender).filter(Tender.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tender not found")

    # Log audit event
    AuditAndReportService.log_event(
        db, action="TENDER_AI_ANALYSIS", source="AI Tender Engine",
        result="SUCCESS", details=f"Extracted 8 compliance requirements and clauses for tender {id}.",
        tender_id=id
    )

    return {
        "tender_id": id,
        "status": "COMPLETED",
        "extracted_requirements_count": 8,
        "stages": [
            {"step": 1, "name": "Reading tender document", "status": "DONE"},
            {"step": 2, "name": "Extracting eligibility clauses", "status": "DONE"},
            {"step": 3, "name": "Identifying mandatory requirements", "status": "DONE"},
            {"step": 4, "name": "Identifying conditional requirements", "status": "DONE"},
            {"step": 5, "name": "Mapping verification sources", "status": "DONE"},
            {"step": 6, "name": "Building compliance matrix", "status": "DONE"}
        ]
    }
