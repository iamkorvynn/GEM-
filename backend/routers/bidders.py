import json
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import (
    Bidder, Tender, Requirement, Document, VerificationRecord,
    VerificationCheck, ComplianceRuleResult, AIFinding,
    RiskAssessment, OfficerDecision, AuditEvent
)
from backend.schemas.schemas import (
    BidderSchema, BidderCreate, DocumentSchema, VerificationRecordSchema,
    VerificationCheckSchema, ComplianceResultSchema, AIFindingSchema,
    RiskAssessmentSchema, OfficerDecisionSchema, OfficerDecisionCreate,
    DashboardStats, AuditEventSchema, BidderDashboard, ChecklistItem
)
from backend.services.mock_govt_adapters import GovernmentVerificationFactory
from backend.services.compliance_rule_engine import ComplianceRuleEngine
from backend.services.ai_analysis_engine import get_ai_provider
from backend.services.risk_scoring_service import RiskScoringService
from backend.services.audit_report_service import AuditAndReportService
from backend.services.verification_engine import (
    track_a_exact_checks, track_b_fuzzy_blacklist,
    track_c_correlation, aggregate_verdict, MCA21_DATABASE
)

# NOTE: auth_service / get_current_user removed.
# This is an officer-only tool — no bidder-facing auth or role-gating needed.
# Officer identity is simulated via GeM SSO pass-through on the frontend.

router = APIRouter(prefix="/api", tags=["Bidders & Dashboard"])



# ---------------------------------------------------------------------------
# PRD §7 — POST /bidders: Create bidder + trigger mock registry pre-fetch
# ---------------------------------------------------------------------------
@router.post("/bidders", response_model=BidderSchema)
def create_bidder(req: BidderCreate, db: Session = Depends(get_db)):
    """
    Create a new bidder record.
    Triggers mock registry pre-fetch: GST, blacklist, EPFO by PAN/GSTIN (PRD §5.3 step 2).
    """
    tender = db.query(Tender).filter(Tender.id == req.tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    bidder_id = f"BIDDER-{uuid.uuid4().hex[:6].upper()}"

    # Pull incorporation_date from MCA21 if PAN matches
    mca21 = MCA21_DATABASE.get(req.pan.upper().strip())
    incorporation_date = mca21.get("incorporation_date") if mca21 else None

    bidder = Bidder(
        id=bidder_id,
        tender_id=req.tender_id,
        company_name=req.company_name,
        gstin=req.gstin,
        pan=req.pan,
        company_type=req.company_type,
        incorporation_date=incorporation_date,
        claims_msme=req.claims_msme,
        claims_startup=req.claims_startup,
        local_content_pct=req.local_content_pct,
    )
    db.add(bidder)
    db.commit()

    # Mock registry pre-fetch (GST, blacklist, EPFO)
    for src in ["GST", "Debarment DB", "EPFO"]:
        adapter = GovernmentVerificationFactory.get_adapter(src)
        query_key = req.gstin if src == "GST" else req.pan
        res = adapter.query(query_key or "", bidder_name=req.company_name)
        rec = VerificationRecord(
            id=f"VERIF-{src}-{bidder_id}",
            bidder_id=bidder_id,
            source=src,
            query_key=query_key or req.company_name,
            status=res.get("status", "UNAVAILABLE"),
            submitted_value=query_key,
            government_record_json=json.dumps(res),
            reference_id=res.get("reference_id"),
            is_simulated=True
        )
        db.add(rec)

    AuditAndReportService.log_event(
        db, action="BIDDER_CREATED", source="New Verification",
        result="SUCCESS",
        details=f"Created bidder '{req.company_name}' for tender '{req.tender_id}'. Mock pre-fetch complete (GST, Debarment, EPFO).",
        tender_id=req.tender_id, bidder_id=bidder_id
    )
    db.commit()
    db.refresh(bidder)
    return _format_bidder_response(bidder)


# ---------------------------------------------------------------------------
# PRD §5 — GET /bidders (list) and GET /bidders/:id
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# PRD §7 — POST /bidders/:id/verify: 3-Track Verification Engine
# ---------------------------------------------------------------------------
@router.post("/bidders/{id}/verify")
def run_full_verification_pipeline(id: str, db: Session = Depends(get_db)):
    """
    Runs the 3-track verification (Track A: Exact, Track B: Fuzzy, Track C: Correlation).
    All tracks run independently — failure in one does not block others. (PRD §8)
    """
    b = db.query(Bidder).filter(Bidder.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bidder not found")

    # Check that at least one document is confirmed (human-in-the-loop checkpoint)
    confirmed_docs_orm = db.query(Document).filter(
        Document.bidder_id == b.id,
        Document.confirmed_fields.isnot(None)
    ).all()

    # Build confirmed_docs dicts for engine
    confirmed_docs = []
    for d in confirmed_docs_orm:
        cf = {}
        try:
            cf = json.loads(d.confirmed_fields or "{}")
        except Exception:
            pass
        ef = {}
        try:
            ef = json.loads(d.extracted_fields or "{}")
        except Exception:
            pass
        confirmed_docs.append({
            "id": d.id,
            "doc_type": d.doc_type,
            "classified_type": d.classified_type,
            "file_name": d.file_name,
            "confirmed_fields": cf,
            "extracted_fields": ef,
            "entities": [{"entity_key": e.entity_key, "entity_value": e.entity_value} for e in d.entities],
        })

    # Also fall back to all docs if none confirmed (for seeded demo data)
    all_docs_orm = db.query(Document).filter(Document.bidder_id == b.id).all()
    if not confirmed_docs:
        for d in all_docs_orm:
            ef = {}
            try:
                ef = json.loads(d.extracted_fields or "{}")
            except Exception:
                pass
            entities_dict = {e.entity_key: e.entity_value for e in d.entities}
            confirmed_docs.append({
                "id": d.id,
                "doc_type": d.doc_type,
                "classified_type": d.classified_type,
                "file_name": d.file_name,
                "confirmed_fields": ef or entities_dict,
                "extracted_fields": ef or entities_dict,
                "entities": [{"entity_key": e.entity_key, "entity_value": e.entity_value} for e in d.entities],
            })

    # Query Mock Government Adapters
    verification_records = {}
    sources_to_query = ["GST", "PAN", "Udyam", "Debarment DB", "OEM Registry", "Income Tax", "MCA"]
    db.query(VerificationRecord).filter(VerificationRecord.bidder_id == b.id).delete()
    for src in sources_to_query:
        adapter = GovernmentVerificationFactory.get_adapter(src)
        query_key = b.gstin if src == "GST" else (
            b.pan if src in ("PAN", "EPFO") else (
                b.udyam_id if src == "Udyam" else b.company_name
            )
        )
        res = adapter.query(query_key or "", bidder_name=b.company_name)
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

    # ---- 3-Track Verification Engine (PRD §8) ----
    bidder_dict = {
        "id": b.id, "company_name": b.company_name,
        "gstin": b.gstin, "pan": b.pan, "udyam_id": b.udyam_id,
        "claims_msme": b.claims_msme, "claims_startup": b.claims_startup,
        "local_content_pct": b.local_content_pct,
        "incorporation_date": b.incorporation_date,
    }

    track_a_results = []
    track_b_results = []
    track_c_results = []

    try:
        track_a_results = track_a_exact_checks(bidder_dict, confirmed_docs, verification_records)
    except Exception as e:
        track_a_results = []

    try:
        track_b_results = track_b_fuzzy_blacklist(b.company_name)
    except Exception as e:
        track_b_results = []

    try:
        track_c_results = track_c_correlation(bidder_dict, confirmed_docs)
    except Exception as e:
        track_c_results = []

    all_checks = track_a_results + track_b_results + track_c_results

    # Save VerificationCheck records
    db.query(VerificationCheck).filter(VerificationCheck.bidder_id == b.id).delete()
    for chk in all_checks:
        db.add(VerificationCheck(
            id=chk["id"],
            bidder_id=b.id,
            check_type=chk["check_type"],
            module=chk["module"],
            result=chk["result"],
            reason=chk["reason"],
            source_fields=chk.get("source_fields"),
            checked_at=chk.get("checked_at", datetime.utcnow()),
        ))

    # PRD §8.4 — Verdict Aggregation
    prd_risk_level = aggregate_verdict(all_checks)

    # Legacy Compliance Rule Engine (for compliance_results / existing dashboard)
    tender = db.query(Tender).filter(Tender.id == b.tender_id).first()
    requirements = db.query(Requirement).filter(Requirement.tender_id == b.tender_id).all()
    req_dicts = [
        {"id": r.id, "title": r.title, "is_mandatory": r.is_mandatory,
         "evidence_type": r.evidence_type, "verification_source": r.verification_source,
         "rule_type": r.rule_type, "threshold_value": r.threshold_value}
        for r in requirements
    ]
    doc_dicts = [
        {"id": d.id, "file_name": d.file_name, "classified_type": d.classified_type,
         "entities": [{"entity_key": e.entity_key, "entity_value": e.entity_value} for e in d.entities]}
        for d in all_docs_orm
    ]
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

    # AI Findings
    ai_provider = get_ai_provider()
    findings = ai_provider.analyze_bidder_compliance(b.company_name, rule_results, doc_dicts, list(verification_records.values()))
    db.query(AIFinding).filter(AIFinding.bidder_id == b.id).delete()
    for f in findings:
        db.add(AIFinding(
            bidder_id=b.id,
            title=f["title"], severity=f["severity"], description=f["description"],
            document_value=f.get("document_value"), verified_value=f.get("verified_value"),
            source=f.get("source"), confidence=f.get("confidence", 0.95),
            recommendation=f.get("recommendation"),
            evidence_doc_id=f.get("evidence_doc_id"), evidence_file_name=f.get("evidence_file_name")
        ))

    # Score — use PRD verdict for risk_level, scoring service for compliance_score
    score_risk = RiskScoringService.calculate_score_and_risk(rule_results, findings)
    b.compliance_score = score_risk["compliance_score"]
    b.risk_level = prd_risk_level  # PRD §8.4 verdict takes precedence
    b.verification_progress = 100.0
    b.overall_status = "REVIEW_REQUIRED" if prd_risk_level in ("MEDIUM", "HIGH", "CRITICAL") else "VERIFIED"

    db.query(RiskAssessment).filter(RiskAssessment.bidder_id == b.id).delete()
    db.add(RiskAssessment(
        bidder_id=b.id,
        compliance_score=score_risk["compliance_score"],
        risk_level=prd_risk_level,
        critical_issues_count=score_risk["critical_issues_count"],
        medium_issues_count=score_risk["medium_issues_count"],
        score_breakdown_json=json.dumps(score_risk["score_breakdown"]),
        reasons_json=json.dumps(score_risk["reasons"])
    ))

    AuditAndReportService.log_event(
        db, action="VERDICT_ISSUED", source="Verification Pipeline",
        result=prd_risk_level,
        details=(
            f"3-Track verification complete. "
            f"Track A: {len(track_a_results)} checks, Track B: {len(track_b_results)} checks, Track C: {len(track_c_results)} checks. "
            f"Score: {b.compliance_score}/100, Risk: {prd_risk_level}."
        ),
        tender_id=b.tender_id, bidder_id=b.id
    )

    db.commit()
    db.refresh(b)
    return _format_bidder_response(b)


# ---------------------------------------------------------------------------
# PRD §5.2 — GET /bidders/:id/dashboard: checklist + risk verdict + drill-down
# ---------------------------------------------------------------------------
@router.get("/bidders/{id}/dashboard", response_model=BidderDashboard)
def get_bidder_dashboard(id: str, db: Session = Depends(get_db)):
    """
    Returns per-bidder checklist (all VerificationChecks), overall risk verdict,
    and per-check drill-down data (source_fields, reason, module). PRD §5.2
    """
    b = db.query(Bidder).filter(Bidder.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bidder not found")

    checks = db.query(VerificationCheck).filter(VerificationCheck.bidder_id == id).all()

    # Check if all docs are confirmed
    all_docs = db.query(Document).filter(Document.bidder_id == id).all()
    docs_confirmed = all(d.confirmed_fields is not None for d in all_docs) if all_docs else False

    checklist = []
    for c in checks:
        sf = None
        if c.source_fields:
            try:
                sf = json.loads(c.source_fields)
            except Exception:
                sf = {}
        checklist.append(ChecklistItem(
            module=c.module,
            check_type=c.check_type,
            result=c.result,
            reason=c.reason,
            source_fields=sf,
            checked_at=c.checked_at,
        ))

    pass_count = sum(1 for c in checklist if c.result == "PASS")
    fail_count = sum(1 for c in checklist if c.result == "FAIL")
    flagged_count = sum(1 for c in checklist if c.result == "FLAGGED")

    return BidderDashboard(
        bidder_id=b.id,
        company_name=b.company_name,
        risk_level=b.risk_level,
        compliance_score=b.compliance_score,
        overall_status=b.overall_status,
        checklist=checklist,
        documents_confirmed=docs_confirmed,
        total_checks=len(checklist),
        pass_count=pass_count,
        fail_count=fail_count,
        flagged_count=flagged_count,
    )


# ---------------------------------------------------------------------------
# PRD §5 — GET /bidders/:id/audit-log: scoped to one bidder
# ---------------------------------------------------------------------------
@router.get("/bidders/{id}/audit-log", response_model=List[AuditEventSchema])
def get_bidder_audit_log(id: str, db: Session = Depends(get_db)):
    """Returns full chronological audit trail scoped to this bidder. PRD §5.2"""
    b = db.query(Bidder).filter(Bidder.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bidder not found")
    events = (
        db.query(AuditEvent)
        .filter(AuditEvent.bidder_id == id)
        .order_by(AuditEvent.timestamp.asc())
        .all()
    )
    return [
        AuditEventSchema(
            id=e.id, tender_id=e.tender_id, bidder_id=e.bidder_id,
            action=e.action, actor=e.actor, source=e.source,
            result=e.result, details=e.details, timestamp=e.timestamp
        ) for e in events
    ]


# ---------------------------------------------------------------------------
# Existing — Officer Decision
# ---------------------------------------------------------------------------
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

    AuditAndReportService.log_event(
        db, action="OFFICER_DECISION_RECORDED", source="Human Officer Interface",
        result=req.decision,
        details=f"Officer recorded decision '{req.decision}'. Remarks: {req.remarks}",
        tender_id=b.tender_id, bidder_id=b.id, actor="Procurement Officer"
    )
    return {"status": "SUCCESS", "decision": req.decision, "bidder_id": b.id}


# ---------------------------------------------------------------------------
# Existing — Global dashboard stats
# ---------------------------------------------------------------------------
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
        total_bidders=bidders_count or 5,
        verified_bidders=verified_bidders or 1,
        pending_reviews=pending_reviews or 3,
        high_risk_bidders=high_risk_bidders or 2,
        compliance_distribution={"Verified (90-100)": 1, "Review Required (70-89)": 2, "Non-Compliant (<70)": 2},
        risk_distribution={"Low Risk": 1, "Medium Risk": 2, "High Risk": 1, "Critical Risk": 1},
        verification_progress_pct=88.5,
        recent_activity=event_schemas
    )


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def _format_bidder_response(b: Bidder) -> BidderSchema:
    import json as _json

    def _parse_sf(sf_str):
        if not sf_str:
            return None
        try:
            return _json.loads(sf_str)
        except Exception:
            return {}

    def _parse_json_field(field):
        if isinstance(field, str):
            try:
                return _json.loads(field)
            except Exception:
                return {}
        return field or {}

    docs = [
        DocumentSchema(
            id=d.id, bidder_id=d.bidder_id, file_name=d.file_name,
            file_path=d.file_path, file_size=d.file_size, uploaded_at=d.uploaded_at,
            classified_type=d.classified_type, doc_type=d.doc_type,
            classification_confidence=d.classification_confidence,
            status=d.status,
            extracted_fields=_parse_json_field(d.extracted_fields),
            confirmed_fields=_parse_json_field(d.confirmed_fields),
            confirmed_by=d.confirmed_by,
            confirmed_at=d.confirmed_at,
            entities=[
                {"id": e.id, "entity_key": e.entity_key, "entity_value": e.entity_value,
                 "confidence": e.confidence, "page_number": e.page_number, "bbox_json": e.bbox_json}
                for e in d.entities
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

    checks = [
        VerificationCheckSchema(
            id=c.id, bidder_id=c.bidder_id, check_type=c.check_type,
            module=c.module, result=c.result, reason=c.reason,
            source_fields=_parse_sf(c.source_fields),
            checked_at=c.checked_at,
        ) for c in b.verification_checks
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
            critical_issues_count=ra.critical_issues_count,
            medium_issues_count=ra.medium_issues_count,
            score_breakdown=_parse_json_field(ra.score_breakdown_json),
            reasons=_json.loads(ra.reasons_json or "[]"),
            evaluated_at=ra.evaluated_at
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
        company_type=b.company_type, incorporation_date=b.incorporation_date,
        claims_msme=b.claims_msme, claims_startup=b.claims_startup,
        local_content_pct=b.local_content_pct, submitted_at=b.submitted_at,
        compliance_score=b.compliance_score, risk_level=b.risk_level,
        verification_progress=b.verification_progress, overall_status=b.overall_status,
        documents=docs, verification_records=verifs, verification_checks=checks,
        compliance_results=rules, ai_findings=findings,
        risk_assessment=risk_schema, officer_decision=decision_schema
    )
