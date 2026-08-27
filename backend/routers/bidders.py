import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import (
    Bidder, Tender, Requirement, Document, VerificationRecord,
    ComplianceRuleResult, AIFinding, RiskAssessment, OfficerDecision, AuditEvent
)
from backend.schemas.schemas import (
    BidderSchema, DocumentSchema, VerificationRecordSchema,
    ComplianceResultSchema, AIFindingSchema, RiskAssessmentSchema,
    OfficerDecisionSchema, OfficerDecisionCreate, DashboardStats, AuditEventSchema
)
from backend.services.mock_govt_adapters import GovernmentVerificationFactory
from backend.services.compliance_rule_engine import ComplianceRuleEngine
from backend.services.ai_analysis_engine import get_ai_provider
from backend.services.risk_scoring_service import RiskScoringService
from backend.services.audit_report_service import AuditAndReportService

router = APIRouter(prefix="/api", tags=["Bidders & Dashboard"])

@router.get("/bidders", response_model=List[BidderSchema])
def list_bidders(tender_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Bidder)
    if tender_id:
        query = query.filter(Bidder.tender_id == tender_id)
    bidders = query.all()
    return [_format_bidder_response(b) for b in bidders]

@router.get("/bidders/{id}", response_model=BidderSchema)
def get_bidder(id: str, db: Session = Depends(get_db)):
    b = db.query(Bidder).filter(Bidder.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bidder not found")
    return _format_bidder_response(b)

@router.post("/bidders/{id}/verify")
def run_full_verification_pipeline(id: str, db: Session = Depends(get_db)):
    """
    End-To-End Automation Pipeline Trigger:
    1. Classify documents 2. Extract entities 3. Query Mock Govt Adapters 
    4. Deterministic Compliance Rules 5. AI Findings 6. Risk Score Calculation 7. Audit Log.
    """
    b = db.query(Bidder).filter(Bidder.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bidder not found")

    tender = db.query(Tender).filter(Tender.id == b.tender_id).first()
    requirements = db.query(Requirement).filter(Requirement.tender_id == b.tender_id).all()
    req_dicts = [
        {
            "id": r.id, "title": r.title, "is_mandatory": r.is_mandatory,
            "evidence_type": r.evidence_type, "verification_source": r.verification_source,
            "rule_type": r.rule_type, "threshold_value": r.threshold_value
        } for r in requirements
    ]

    docs = db.query(Document).filter(Document.bidder_id == b.id).all()
    doc_dicts = [
        {
            "id": d.id, "file_name": d.file_name, "classified_type": d.classified_type,
            "entities": [{"entity_key": e.entity_key, "entity_value": e.entity_value} for e in d.entities]
        } for d in docs
    ]

    # Query Mock Government Adapters
    verification_records = {}
    sources_to_query = ["GST", "PAN", "Udyam", "Debarment DB", "OEM Registry", "Income Tax", "MCA"]

    db.query(VerificationRecord).filter(VerificationRecord.bidder_id == b.id).delete()

    for src in sources_to_query:
        adapter = GovernmentVerificationFactory.get_adapter(src)
        query_key = b.gstin if src == "GST" else (b.pan if src == "PAN" else (b.udyam_id if src == "Udyam" else b.company_name))
        res = adapter.query(query_key, bidder_name=b.company_name)
        verification_records[src] = res

        rec = VerificationRecord(
            id=f"VERIF-{src}-{b.id}",
            bidder_id=b.id,
            source=src,
            query_key=query_key or b.company_name,
            status=res.get("status", "UNAVAILABLE"),
            submitted_value=query_key,
            government_record_json=json.dumps(res),
            reference_id=res.get("reference_id"),
            is_simulated=True
        )
        db.add(rec)

    # Deterministic Compliance Rule Engine
    bidder_dict = {
        "company_name": b.company_name,
        "gstin": b.gstin,
        "pan": b.pan,
        "udyam_id": b.udyam_id,
        "claims_msme": b.claims_msme,
        "claims_startup": b.claims_startup,
        "local_content_pct": b.local_content_pct
    }

    rule_results = ComplianceRuleEngine.evaluate_bidder(bidder_dict, req_dicts, doc_dicts, verification_records)

    db.query(ComplianceRuleResult).filter(ComplianceRuleResult.bidder_id == b.id).delete()
    for r in rule_results:
        db.add(ComplianceRuleResult(
            bidder_id=b.id,
            requirement_id=r["requirement_id"],
            requirement_title=r["requirement_title"],
            status=r["status"],
            extracted_value=r["extracted_value"],
            verified_value=r["verified_value"],
            verification_source=r["verification_source"],
            confidence=r["confidence"],
            evidence_doc_id=r["evidence_doc_id"],
            evidence_file_name=r["evidence_file_name"],
            rule_explanation=r["rule_explanation"]
        ))

    # AI Findings Generation
    ai_provider = get_ai_provider()
    findings = ai_provider.analyze_bidder_compliance(b.company_name, rule_results, doc_dicts, list(verification_records.values()))

    db.query(AIFinding).filter(AIFinding.bidder_id == b.id).delete()
    for f in findings:
        db.add(AIFinding(
            bidder_id=b.id,
            title=f["title"],
            severity=f["severity"],
            description=f["description"],
            document_value=f.get("document_value"),
            verified_value=f.get("verified_value"),
            source=f.get("source"),
            confidence=f.get("confidence", 0.95),
            recommendation=f.get("recommendation"),
            evidence_doc_id=f.get("evidence_doc_id"),
            evidence_file_name=f.get("evidence_file_name")
        ))

    # Calculate Compliance Score and Risk Level
    score_risk = RiskScoringService.calculate_score_and_risk(rule_results, findings)
    b.compliance_score = score_risk["compliance_score"]
    b.risk_level = score_risk["risk_level"]
    b.verification_progress = 100.0
    b.overall_status = "REVIEW_REQUIRED" if b.risk_level in ["MEDIUM", "HIGH", "CRITICAL"] else "VERIFIED"

    db.query(RiskAssessment).filter(RiskAssessment.bidder_id == b.id).delete()
    db.add(RiskAssessment(
        bidder_id=b.id,
        compliance_score=score_risk["compliance_score"],
        risk_level=score_risk["risk_level"],
        critical_issues_count=score_risk["critical_issues_count"],
        medium_issues_count=score_risk["medium_issues_count"],
        score_breakdown_json=json.dumps(score_risk["score_breakdown"]),
        reasons_json=json.dumps(score_risk["reasons"])
    ))

    # Log Audit Event
    AuditAndReportService.log_event(
        db, action="FULL_VERIFICATION_EXECUTED", source="Verification Pipeline",
        result="SUCCESS", details=f"Executed end-to-end compliance check. Score: {b.compliance_score}/100, Risk: {b.risk_level}.",
        tender_id=b.tender_id, bidder_id=b.id
    )

    db.commit()
    db.refresh(b)
    return _format_bidder_response(b)

@router.post("/bidders/{id}/decision")
def record_officer_decision(id: str, req: OfficerDecisionCreate, db: Session = Depends(get_db)):
    b = db.query(Bidder).filter(Bidder.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bidder not found")

    db.query(OfficerDecision).filter(OfficerDecision.bidder_id == b.id).delete()
    
    ai_rec = "RECOMMEND_QUALIFIED" if b.risk_level == "LOW" else "RECOMMEND_MANUAL_REVIEW"
    decision = OfficerDecision(
        bidder_id=b.id,
        officer_email="procurement.officer@demo.gov.in",
        decision=req.decision,
        remarks=req.remarks,
        ai_recommendation=ai_rec,
        override_justification=req.override_justification
    )
    db.add(decision)

    b.overall_status = req.decision
    db.commit()

    # Log Audit Event
    AuditAndReportService.log_event(
        db, action="OFFICER_DECISION_RECORDED", source="Human Officer Interface",
        result=req.decision, details=f"Officer recorded decision '{req.decision}'. Remarks: {req.remarks}",
        tender_id=b.tender_id, bidder_id=b.id, actor="Procurement Officer (Rajesh Sharma)"
    )

    return {"status": "SUCCESS", "decision": req.decision, "bidder_id": b.id}

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    tenders_count = db.query(Tender).filter(Tender.status == "ACTIVE").count()
    bidders_count = db.query(Bidder).count()
    verified_bidders = db.query(Bidder).filter(Bidder.overall_status.in_(["VERIFIED", "QUALIFIED"])).count()
    pending_reviews = db.query(Bidder).filter(Bidder.overall_status == "REVIEW_REQUIRED").count()
    high_risk_bidders = db.query(Bidder).filter(Bidder.risk_level.in_(["HIGH", "CRITICAL"])).count()

    events = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(8).all()
    event_schemas = [
        AuditEventSchema(
            id=e.id, tender_id=e.tender_id, bidder_id=e.bidder_id,
            action=e.action, actor=e.actor, source=e.source,
            result=e.result, details=e.details, timestamp=e.timestamp
        ) for e in events
    ]

    return DashboardStats(
        active_tenders=tenders_count or 1,
        total_bidders=bidders_count or 3,
        verified_bidders=verified_bidders or 1,
        pending_reviews=pending_reviews or 2,
        high_risk_bidders=high_risk_bidders or 1,
        compliance_distribution={"Verified (90-100)": 1, "Review Required (70-89)": 1, "Non-Compliant (<70)": 1},
        risk_distribution={"Low Risk": 1, "Medium Risk": 1, "High Risk": 1, "Critical Risk": 0},
        verification_progress_pct=88.5,
        recent_activity=event_schemas
    )

def _format_bidder_response(b: Bidder) -> BidderSchema:
    docs = [
        DocumentSchema(
            id=d.id, bidder_id=d.bidder_id, file_name=d.file_name,
            file_path=d.file_path, file_size=d.file_size, uploaded_at=d.uploaded_at,
            classified_type=d.classified_type, classification_confidence=d.classification_confidence,
            status=d.status,
            entities=[
                {
                    "id": e.id, "entity_key": e.entity_key, "entity_value": e.entity_value,
                    "confidence": e.confidence, "page_number": e.page_number, "bbox_json": e.bbox_json
                } for e in d.entities
            ]
        ) for d in b.documents
    ]

    verifs = [
        VerificationRecordSchema(
            id=v.id, bidder_id=v.bidder_id, source=v.source, query_key=v.query_key,
            status=v.status, submitted_value=v.submitted_value,
            government_record_json=v.government_record_json, verified_at=v.verified_at,
            reference_id=v.reference_id, is_simulated=v.is_simulated
        ) for v in b.verification_records
    ]

    rules = [
        ComplianceResultSchema(
            id=r.id, requirement_id=r.requirement_id, requirement_title=r.requirement_title,
            status=r.status, extracted_value=r.extracted_value, verified_value=r.verified_value,
            verification_source=r.verification_source, confidence=r.confidence,
            evidence_doc_id=r.evidence_doc_id, evidence_file_name=r.evidence_file_name,
            rule_explanation=r.rule_explanation
        ) for r in b.compliance_results
    ]

    findings = [
        AIFindingSchema(
            id=f.id, title=f.title, severity=f.severity, description=f.description,
            document_value=f.document_value, verified_value=f.verified_value,
            source=f.source, confidence=f.confidence, recommendation=f.recommendation,
            evidence_doc_id=f.evidence_doc_id, evidence_file_name=f.evidence_file_name
        ) for f in b.ai_findings
    ]

    risk_schema = None
    if b.risk_assessment:
        ra = b.risk_assessment
        risk_schema = RiskAssessmentSchema(
            compliance_score=ra.compliance_score, risk_level=ra.risk_level,
            critical_issues_count=ra.critical_issues_count, medium_issues_count=ra.medium_issues_count,
            score_breakdown=json.loads(ra.score_breakdown_json or "{}"),
            reasons=json.loads(ra.reasons_json or "[]"), evaluated_at=ra.evaluated_at
        )

    decision_schema = None
    if b.officer_decision:
        od = b.officer_decision
        decision_schema = OfficerDecisionSchema(
            officer_email=od.officer_email, decision=od.decision, remarks=od.remarks,
            ai_recommendation=od.ai_recommendation, override_justification=od.override_justification,
            decided_at=od.decided_at
        )

    return BidderSchema(
        id=b.id, tender_id=b.tender_id, company_name=b.company_name,
        gstin=b.gstin, pan=b.pan, udyam_id=b.udyam_id,
        claims_msme=b.claims_msme, claims_startup=b.claims_startup,
        local_content_pct=b.local_content_pct, submitted_at=b.submitted_at,
        compliance_score=b.compliance_score, risk_level=b.risk_level,
        verification_progress=b.verification_progress, overall_status=b.overall_status,
        documents=docs, verification_records=verifs, compliance_results=rules,
        ai_findings=findings, risk_assessment=risk_schema, officer_decision=decision_schema
    )
