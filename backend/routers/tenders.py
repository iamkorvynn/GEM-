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

def seed_imported_tender(db: Session, tender_id: str):
    from backend.models.models import Document, VerificationRecord, VerificationCheck, ComplianceRuleResult, AIFinding, RiskAssessment
    import json
    from datetime import timezone

    # 1. Requirements
    reqs = [
        Requirement(id=f"REQ-GST-{tender_id[-6:]}", tender_id=tender_id, title="GST Registration",
            description="Active GSTIN registration certificate.", is_mandatory=True,
            evidence_type="GST Certificate", verification_source="GST", rule_type="ACTIVE",
            clause_reference="Clause 3.1 (a)"),
        Requirement(id=f"REQ-PAN-{tender_id[-6:]}", tender_id=tender_id, title="PAN Card Verification",
            description="Valid PAN from Income Tax Dept.", is_mandatory=True,
            evidence_type="PAN Card", verification_source="PAN", rule_type="VALID",
            clause_reference="Clause 3.1 (b)"),
        Requirement(id=f"REQ-OEM-{tender_id[-6:]}", tender_id=tender_id, title="OEM Manufacturer Authorization",
            description="OEM authorization letter for bidding items.", is_mandatory=True,
            evidence_type="OEM Authorization", verification_source="OEM Registry", rule_type="REQUIRED",
            clause_reference="Clause 5.1"),
        Requirement(id=f"REQ-MII-{tender_id[-6:]}", tender_id=tender_id, title="Make in India Local Content Declaration",
            description="Minimum 50% local content for Class-I Local Supplier.", is_mandatory=True,
            evidence_type="Make in India Declaration", verification_source="Make in India",
            rule_type="THRESHOLD", threshold_value="50", clause_reference="Clause 6.3"),
        Requirement(id=f"REQ-DEBAR-{tender_id[-6:]}", tender_id=tender_id, title="Non-Blacklisting & Debarment Declaration",
            description="Affidavit confirming entity has not been debarred.", is_mandatory=True,
            evidence_type="Debarment Declaration", verification_source="Debarment DB",
            rule_type="EXACT_MATCH", clause_reference="Clause 7.1"),
    ]
    db.add_all(reqs)
    db.commit()

    # 2. Bidders
    b1_id = f"BID-{tender_id[-6:]}-A"
    b2_id = f"BID-{tender_id[-6:]}-B"
    b3_id = f"BID-{tender_id[-6:]}-C"

    b1 = Bidder(
        id=b1_id, tender_id=tender_id,
        company_name="Apex Safety Systems Pvt. Ltd.",
        gstin="27ABCDE1234F1Z5", pan="ABCDE1234F",
        udyam_id="UDYAM-MH-01-0012345", company_type="Pvt Ltd",
        incorporation_date="2015-03-10", claims_msme=True,
        local_content_pct=75.0, compliance_score=98.0, risk_level="LOW",
        verification_progress=100.0, overall_status="VERIFIED"
    )
    b2 = Bidder(
        id=b2_id, tender_id=tender_id,
        company_name="Vanguard Safety Equipments",
        gstin="27NOVAS9876K1Z9", pan="NOVAS9876K",
        udyam_id="UDYAM-KA-02-0098765", company_type="Pvt Ltd",
        incorporation_date="2019-03-15", claims_msme=True,
        local_content_pct=52.0, compliance_score=78.0, risk_level="MEDIUM",
        verification_progress=100.0, overall_status="REVIEW_REQUIRED"
    )
    b3 = Bidder(
        id=b3_id, tender_id=tender_id,
        company_name="Horizon Tech India",
        gstin="27PRIME5432M1Z2", pan="PRIME5432M",
        udyam_id=None, company_type="Pvt Ltd",
        incorporation_date="2021-01-10", claims_msme=False,
        local_content_pct=35.0, compliance_score=48.0, risk_level="HIGH",
        verification_progress=100.0, overall_status="REVIEW_REQUIRED"
    )
    db.add_all([b1, b2, b3])
    db.commit()

    # 3. Documents for b1
    d1 = Document(id=f"DOC-{b1_id}-GST", bidder_id=b1_id, file_name="Apex_GST_Certificate.pdf",
        file_path="/mock_docs/ABC_GST_Certificate.pdf", file_size=1048576,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.99, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "27ABCDE1234F1Z5", "legal_name": "Apex Safety Systems Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-01"}),
        confirmed_fields=json.dumps({"gstin": "27ABCDE1234F1Z5", "legal_name": "Apex Safety Systems Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-01"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d2 = Document(id=f"DOC-{b1_id}-OEM", bidder_id=b1_id, file_name="OEM_Authorization_Suraksha.pdf",
        file_path="/mock_docs/OEM_Authorization_Suraksha.pdf", file_size=824000,
        classified_type="OEM Authorization", doc_type="OEM_AUTH_LETTER",
        classification_confidence=0.98, status="CONFIRMED",
        extracted_fields=json.dumps({"issuing_entity": "Suraksha Global Safety Corp", "authorized_entity": "Apex Safety Systems Pvt. Ltd.", "product_category": "Safety Equipment", "issue_date": "2023-05-10", "expiry_date": "2027-12-31", "signature_present": True}),
        confirmed_fields=json.dumps({"issuing_entity": "Suraksha Global Safety Corp", "authorized_entity": "Apex Safety Systems Pvt. Ltd.", "product_category": "Safety Equipment", "issue_date": "2023-05-10", "expiry_date": "2027-12-31", "signature_present": True}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    
    db.add_all([d1, d2])
    db.commit()

    # 4. Verification Check / Compliance Results for b1
    db.add_all([
        VerificationCheck(id=f"CHK-EX-GST-{b1_id}", bidder_id=b1_id, check_type="EXACT", module="GSTIN_VALIDITY", result="PASS",
            reason="GSTIN active on GST portal and GSTR-3B filings up to date",
            source_fields=json.dumps({"doc_gstin": b1.gstin, "registry_status": "ACTIVE"})),
        VerificationCheck(id=f"CHK-EX-PAN-{b1_id}", bidder_id=b1_id, check_type="EXACT", module="PAN_MATCH", result="PASS",
            reason="PAN matches legal entity name on Income Tax registry",
            source_fields=json.dumps({"pan": b1.pan, "registry_name": b1.company_name})),
        ComplianceRuleResult(bidder_id=b1_id, requirement_id=f"REQ-GST-{tender_id[-6:]}", requirement_title="GST Registration",
            status="VERIFIED", extracted_value=b1.gstin, verified_value="Active",
            verification_source="GST", confidence=0.99, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="GSTIN active and legal name matches submission exactly."),
        ComplianceRuleResult(bidder_id=b1_id, requirement_id=f"REQ-OEM-{tender_id[-6:]}", requirement_title="OEM Manufacturer Authorization",
            status="VERIFIED", extracted_value="Valid till 2027-12-31", verified_value="VERIFIED",
            verification_source="OEM Registry", confidence=0.98, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
            rule_explanation="Valid OEM authorization. Issue date after incorporation — consistent."),
        AIFinding(bidder_id=b1_id, title="Verified: Full Eligibility Compliant",
            severity="VERIFIED", description="Bidder satisfies all mandatory and conditional eligibility clauses with zero discrepancies.",
            document_value=b1.company_name, verified_value="Fully Compliant",
            source="Evaluation Engine", confidence=0.99, recommendation="Recommended for Qualification."),
        RiskAssessment(bidder_id=b1_id, compliance_score=98.0, risk_level="LOW",
            critical_issues_count=0, medium_issues_count=0,
            score_breakdown_json=json.dumps({"GST": 20, "PAN": 20, "OEM": 20, "Debarment": 20, "ITR": 18}),
            reasons_json=json.dumps(["All checks passed.", "Document signatures verified."]))
    ])

    # 5. Documents for b2
    d3 = Document(id=f"DOC-{b2_id}-GST", bidder_id=b2_id, file_name="Vanguard_GST_Certificate.pdf",
        file_path="/mock_docs/Nova_GST_Certificate.pdf", file_size=760000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.98, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "27NOVAS9876K1Z9", "legal_name": "Vanguard Safety Equipments Private Limited", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-01"}),
        confirmed_fields=json.dumps({"gstin": "27NOVAS9876K1Z9", "legal_name": "Vanguard Safety Equipments Private Limited", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-01"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add(d3)
    db.commit()

    db.add_all([
        VerificationCheck(id=f"CHK-EX-GST-{b2_id}", bidder_id=b2_id, check_type="EXACT", module="GSTIN_VALIDITY", result="PASS",
            reason="GSTIN active on GST portal and GSTR-3B filings up to date",
            source_fields=json.dumps({"doc_gstin": b2.gstin, "registry_status": "ACTIVE"})),
        ComplianceRuleResult(bidder_id=b2_id, requirement_id=f"REQ-GST-{tender_id[-6:]}", requirement_title="GST Registration",
            status="REVIEW_REQUIRED", extracted_value=b2.company_name, verified_value="Fuzzy Match",
            verification_source="GST", confidence=0.94, evidence_doc_id=d3.id, evidence_file_name=d3.file_name,
            rule_explanation="Minor legal name variation: Submitted 'Equipments' vs GST Portal 'Private Limited'."),
        AIFinding(bidder_id=b2_id, title="Legal Name Minor Variation",
            severity="MEDIUM", description="GST registration legal name contains 'Private Limited' while bid submission uses 'Equipments'",
            document_value=b2.company_name, verified_value="Minor Discrepancy",
            source="Evaluation Engine", confidence=0.94, recommendation="Manual officer verification suggested to confirm legal entity identity."),
        RiskAssessment(bidder_id=b2_id, compliance_score=78.0, risk_level="MEDIUM",
            critical_issues_count=0, medium_issues_count=1,
            score_breakdown_json=json.dumps({"GST": 15, "PAN": 20, "OEM": 20, "Debarment": 20, "ITR": 3}),
            reasons_json=json.dumps(["Minor legal name variation (Submitted 'Equipments' vs GST Portal 'Private Limited')."]))
    ])

    # 6. Documents for b3
    d4 = Document(id=f"DOC-{b3_id}-GST", bidder_id=b3_id, file_name="Horizon_GST_Certificate.pdf",
        file_path="/mock_docs/Prime_GST_Cert_Provisional.pdf", file_size=780000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.95, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "27PRIME5432M1Z2", "legal_name": "Horizon Tech India Pvt Ltd", "filing_status": "DEFECTIVE_FILING", "certificate_date": "2026-08-10"}),
        confirmed_fields=json.dumps({"gstin": "27PRIME5432M1Z2", "legal_name": "Horizon Tech India Pvt Ltd", "filing_status": "DEFECTIVE_FILING", "certificate_date": "2026-08-10"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add(d4)
    db.commit()

    db.add_all([
        VerificationCheck(id=f"CHK-EX-GST-{b3_id}", bidder_id=b3_id, check_type="EXACT", module="GSTIN_VALIDITY", result="FAIL",
            reason="GSTIN registration status is CANCELLED_PROVISIONAL",
            source_fields=json.dumps({"doc_gstin": b3.gstin, "registry_status": "CANCELLED"})),
        ComplianceRuleResult(bidder_id=b3_id, requirement_id=f"REQ-GST-{tender_id[-6:]}", requirement_title="GST Registration",
            status="FAILED", extracted_value=b3.gstin, verified_value="Cancelled",
            verification_source="GST", confidence=0.95, evidence_doc_id=d4.id, evidence_file_name=d4.file_name,
            rule_explanation="GSTIN status is CANCELLED on GST portal."),
        AIFinding(bidder_id=b3_id, title="CRITICAL: GST Registration Cancelled",
            severity="CRITICAL", description="GST registration status is CANCELLED on the GST portal.",
            document_value=b3.gstin, verified_value="Cancelled",
            source="Evaluation Engine", confidence=0.95, recommendation="Disqualify bidder."),
        RiskAssessment(bidder_id=b3_id, compliance_score=48.0, risk_level="HIGH",
            critical_issues_count=1, medium_issues_count=0,
            score_breakdown_json=json.dumps({"GST": 0, "PAN": 20, "OEM": 20, "Debarment": 20, "ITR": 8}),
            reasons_json=json.dumps(["CRITICAL: GST registration status is CANCELLED on the GST portal.", "Missing OEM authorization letter."]))
    ])

    # 7. Audit log
    db.add(AuditEvent(
        tender_id=tender_id, action="TENDER_SEEDED_MOCK", actor="System Daemon (Auto-Pull)",
        source="GeM Gateway / Adapter", result="SUCCESS",
        details=f"Automatically seeded requirements and 3 mock bidders for newly imported tender {tender_id}.",
        timestamp=datetime.now(timezone.utc)
    ))
    db.commit()

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

    # Automatically seed the newly imported tender with mock requirements and bidders
    seed_imported_tender(db, t.id)
    db.refresh(t)

    AuditAndReportService.log_event(
        db, action="TENDER_CREATED", source="Officer — Import Tender",
        result="SUCCESS", details=f"Created tender {t.id} — {t.title} and automatically preloaded 3 mock bidders", tender_id=t.id
    )

    req_schemas = [
        RequirementSchema(
            id=r.id, tender_id=r.tender_id, title=r.title, description=r.description,
            is_mandatory=r.is_mandatory, evidence_type=r.evidence_type,
            verification_source=r.verification_source, rule_type=r.rule_type,
            threshold_value=r.threshold_value, clause_reference=r.clause_reference
        ) for r in t.requirements
    ]

    return TenderSchema(
        id=t.id, title=t.title, department=t.department,
        description=t.description, created_date=t.created_date,
        deadline=t.deadline, estimated_cost=t.estimated_cost,
        status=t.status, bidders_count=len(t.bidders), verification_progress=100.0, requirements=req_schemas
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


@router.post("/{id:path}/auto-fetch-bidders")
def auto_fetch_tender_bidders(id: str, db: Session = Depends(get_db)):
    """Simulate automated pulling of 2-3 GeM bidder submissions for a tender."""
    import random
    import string

    t = db.query(Tender).filter(Tender.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tender not found")

    POOL = [
        ("Paramount Infrastructure Solutions Pvt. Ltd.", "Pvt Ltd", "PARAM", 94.0, "LOW", 75.0),
        ("Kavach Safety & Protective Gears Ltd.", "Public Ltd", "KAVCH", 76.0, "MEDIUM", 58.0),
        ("Apex Diagnostic & Scientific Corp.", "Pvt Ltd", "APEXD", 92.0, "LOW", 65.0),
        ("Zenith Power & Telematics Systems", "LLP", "ZENTH", 62.0, "HIGH", 44.0),
        ("Navodaya Engineering & Technologies", "Partnership", "NAVOD", 85.0, "MEDIUM", 60.0),
        ("Vanguard Cyber Defense Systems Ltd.", "Public Ltd", "VANGR", 97.0, "LOW", 85.0),
        ("Sovereign Heavy Industries Corporation", "Pvt Ltd", "SOVRN", 55.0, "HIGH", 40.0),
    ]

    existing_names = {b.company_name for b in db.query(Bidder).filter(Bidder.tender_id == id).all()}
    available_pool = [item for item in POOL if item[0] not in existing_names]
    if len(available_pool) < 2:
        available_pool = POOL

    num_to_create = min(random.choice([2, 3]), len(available_pool))
    selected = random.sample(available_pool, num_to_create)

    created_bidders = []
    for name, ctype, code_prefix, score, risk, local_pct in selected:
        suffix = ''.join(random.choices(string.digits, k=4))
        bidder_id = f"BID-{code_prefix[:4]}-{suffix}"
        pan = f"{code_prefix[:5]}123{random.choice(string.ascii_uppercase)}"
        gstin = f"27{pan}1Z{random.choice(string.digits)}"
        udyam = f"UDYAM-DL-0{random.randint(1,9)}-00{suffix}" if risk != "HIGH" else None

        bidder = Bidder(
            id=bidder_id,
            tender_id=id,
            company_name=name,
            gstin=gstin,
            pan=pan,
            udyam_id=udyam,
            company_type=ctype,
            incorporation_date="2019-06-15",
            claims_msme=bool(udyam),
            claims_startup=False,
            local_content_pct=local_pct,
            compliance_score=score,
            risk_level=risk,
            verification_progress=100.0,
            overall_status="VERIFIED" if risk == "LOW" else "REVIEW_REQUIRED"
        )
        db.add(bidder)
        created_bidders.append(bidder)

    db.commit()

    AuditAndReportService.log_event(
        db,
        action="GEM_AUTO_PULL_BIDDERS",
        source="GeM Gateway / Adapter",
        actor="System Daemon (Auto-Pull)",
        result="SUCCESS",
        details=f"Simulated auto-pull from GeM Portal: Ingested {len(created_bidders)} technical bids for {id}.",
        tender_id=id
    )

    return [
        {
            "id": b.id,
            "company_name": b.company_name,
            "pan": b.pan,
            "gstin": b.gstin,
            "risk_level": b.risk_level,
            "compliance_score": b.compliance_score,
            "overall_status": b.overall_status,
            "verification_progress": b.verification_progress,
        }
        for b in created_bidders
    ]


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
