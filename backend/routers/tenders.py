from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import Tender, Requirement, Bidder, AuditEvent
from backend.schemas.schemas import TenderSchema, TenderCreate, RequirementSchema
from backend.services.audit_report_service import AuditAndReportService

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

@router.get("/{id}", response_model=TenderSchema)
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
    existing = db.query(Tender).filter(Tender.id == req.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tender ID already exists")

    t = Tender(
        id=req.id,
        title=req.title,
        department=req.department,
        description=req.description,
        created_date="2026-08-27",
        deadline=req.deadline,
        estimated_cost=req.estimated_cost or "INR 1.0 Crore",
        status="ACTIVE"
    )
    db.add(t)
    db.commit()

    # Log Audit Event
    AuditAndReportService.log_event(
        db, action="TENDER_CREATED", source="Tender Management",
        result="SUCCESS", details=f"Created tender {t.id} - {t.title}", tender_id=t.id
    )

    return TenderSchema(
        id=t.id, title=t.title, department=t.department,
        description=t.description, created_date=t.created_date,
        deadline=t.deadline, estimated_cost=t.estimated_cost,
        status=t.status, bidders_count=0, verification_progress=0.0, requirements=[]
    )

@router.post("/{id}/analyze")
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
