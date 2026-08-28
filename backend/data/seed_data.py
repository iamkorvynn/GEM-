import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.models.models import (
    User, Tender, Requirement, Bidder, Document,
    ExtractedEntity, VerificationRecord, ComplianceRuleResult,
    AIFinding, RiskAssessment, OfficerDecision, AuditEvent
)

def seed_database(db: Session):
    # Idempotent: only seed if not already done
    existing_user = db.query(User).filter(User.email == "procurement.officer@demo.gov.in").first()
    if existing_user:
        return

    # 1. Demo User (Procurement Officer)
    demo_user = User(
        email="procurement.officer@demo.gov.in",
        name="Rajesh Sharma",
        role="Senior Procurement Officer",
        department="PSU Industrial Procurement Dept",
        hashed_password="demo_hashed_pass_123"
    )
    db.add(demo_user)

    # 2. GeM Tender
    tender_id = "GEM/2026/B/784921"
    tender = Tender(
        id=tender_id,
        title="Supply & Installation of High-Grade Industrial Safety Equipment",
        department="Ministry of Heavy Industries / PSU Procurement Division",
        description="National competitive bidding for supply of protective gear, gas detection systems, and safety harnesses for industrial power plants.",
        created_date="2026-08-01",
        deadline="2026-09-30",
        estimated_cost="INR 4.5 Crores",
        status="ACTIVE"
    )
    db.add(tender)

    # 3. Requirements
    reqs = [
        Requirement(id="REQ-GST-001", tender_id=tender_id, title="GST Registration",
            description="Active GSTIN registration certificate.", is_mandatory=True,
            evidence_type="GST Certificate", verification_source="GST", rule_type="ACTIVE",
            clause_reference="Clause 3.1 (a)"),
        Requirement(id="REQ-PAN-001", tender_id=tender_id, title="PAN Card Verification",
            description="Valid PAN from Income Tax Dept.", is_mandatory=True,
            evidence_type="PAN Card", verification_source="PAN", rule_type="VALID",
            clause_reference="Clause 3.1 (b)"),
        Requirement(id="REQ-UDYAM-001", tender_id=tender_id, title="Udyam / MSME Registration",
            description="Required only if MSME benefit claimed.", is_mandatory=False,
            evidence_type="Udyam Certificate", verification_source="Udyam", rule_type="VALID",
            clause_reference="Clause 4.2"),
        Requirement(id="REQ-ITR-001", tender_id=tender_id, title="Income Tax Return Compliance",
            description="Filed ITRs for AY 2025-26 and 2024-25.", is_mandatory=True,
            evidence_type="ITR Document", verification_source="Income Tax", rule_type="VALID",
            clause_reference="Clause 3.2"),
        Requirement(id="REQ-OEM-001", tender_id=tender_id, title="OEM Manufacturer Authorization",
            description="OEM authorization letter for bidding items.", is_mandatory=True,
            evidence_type="OEM Authorization", verification_source="OEM Registry", rule_type="REQUIRED",
            clause_reference="Clause 5.1"),
        Requirement(id="REQ-MII-001", tender_id=tender_id, title="Make in India Local Content Declaration",
            description="Minimum 50% local content for Class-I Local Supplier.", is_mandatory=True,
            evidence_type="Make in India Declaration", verification_source="Make in India",
            rule_type="THRESHOLD", threshold_value="50", clause_reference="Clause 6.3"),
        Requirement(id="REQ-DEBAR-001", tender_id=tender_id, title="Non-Blacklisting & Debarment Declaration",
            description="Affidavit confirming entity has not been debarred.", is_mandatory=True,
            evidence_type="Debarment Declaration", verification_source="Debarment DB",
            rule_type="EXACT_MATCH", clause_reference="Clause 7.1"),
        Requirement(id="REQ-TECH-001", tender_id=tender_id, title="Technical ISO Certification",
            description="Valid ISO 9001 QMS certificate.", is_mandatory=True,
            evidence_type="Technical Certificate", verification_source="Document",
            rule_type="VALID_DATE", clause_reference="Clause 8.4"),
    ]
    for r in reqs:
        db.add(r)

    # -----------------------------------------------------------------------
    # 4. PRD §10 — 5 Test Bidders matching the demo script exactly
    # -----------------------------------------------------------------------

    # BIDDER 1: Clean bidder — all documents consistent, no blacklist hit → LOW
    bidder1 = Bidder(
        id="BIDDER-A", tender_id=tender_id,
        company_name="ABC Industrial Solutions Pvt. Ltd.",
        gstin="27ABCDE1234F1Z5", pan="ABCDE1234F",
        udyam_id="UDYAM-MH-01-0012345",
        company_type="Pvt Ltd",
        incorporation_date="2015-03-10",       # MCA21 data
        claims_msme=True, claims_startup=False, local_content_pct=65.0,
        compliance_score=98.0, risk_level="LOW",
        verification_progress=100.0, overall_status="VERIFIED"
    )

    # BIDDER 2: Mismatched GSTIN / expired OEM letter → MEDIUM (Track A FAIL)
    bidder2 = Bidder(
        id="BIDDER-B", tender_id=tender_id,
        company_name="Nova Safety Systems Pvt. Ltd.",
        gstin="27NOVAS9876K1Z9", pan="NOVAS9876K",
        udyam_id="UDYAM-KA-02-0098765",
        company_type="Pvt Ltd",
        incorporation_date="2019-03-15",
        claims_msme=True, claims_startup=False, local_content_pct=55.0,
        compliance_score=72.0, risk_level="MEDIUM",
        verification_progress=100.0, overall_status="REVIEW_REQUIRED"
    )

    # BIDDER 3: OEM letter pre-dates MCA21 incorporation → HIGH (Track C FLAGGED)
    bidder3 = Bidder(
        id="BIDDER-C", tender_id=tender_id,
        company_name="Alpha Tech Enterprises",
        gstin="07ALPHX1122A1ZP", pan="ALPHX1122A",
        udyam_id=None,
        company_type="Proprietorship",
        incorporation_date="2020-09-15",       # OEM letter issue_date will predate this
        claims_msme=False, claims_startup=False, local_content_pct=52.0,
        compliance_score=61.0, risk_level="HIGH",
        verification_progress=100.0, overall_status="REVIEW_REQUIRED"
    )

    # BIDDER 4: Name near-variant of blacklisted "PRIME INDUSTRIAL TECHNOLOGIES" → MEDIUM-HIGH (Track B FLAGGED)
    bidder4 = Bidder(
        id="BIDDER-D", tender_id=tender_id,
        company_name="Prime Industrial Technologies",  # fuzzy match to blacklist
        gstin="27PRIME5432M1Z2", pan="PRIME5432M",
        udyam_id=None,
        company_type="Pvt Ltd",
        incorporation_date="2021-01-10",
        claims_msme=False, claims_startup=False, local_content_pct=40.0,
        compliance_score=55.0, risk_level="HIGH",
        verification_progress=100.0, overall_status="REVIEW_REQUIRED"
    )

    # BIDDER 5 (optional combo): Fuzzy + Correlation both trigger → HIGH (stress-tests verdict aggregation)
    bidder5 = Bidder(
        id="BIDDER-E", tender_id=tender_id,
        company_name="Radiant Procurement Solutions Pvt. Ltd.",  # fuzzy match to blacklist
        gstin="07RADNT6789R1ZA", pan="RADNT6789R",
        udyam_id=None,
        company_type="Pvt Ltd",
        incorporation_date="2022-06-01",       # OEM letter will also predate this
        claims_msme=False, claims_startup=False, local_content_pct=48.0,
        compliance_score=42.0, risk_level="HIGH",
        verification_progress=100.0, overall_status="REVIEW_REQUIRED"
    )

    db.add_all([bidder1, bidder2, bidder3, bidder4, bidder5])
    db.commit()

    # Seed per-bidder details
    _seed_bidder1(db, bidder1)
    _seed_bidder2(db, bidder2)
    _seed_bidder3(db, bidder3)
    _seed_bidder4(db, bidder4)
    _seed_bidder5(db, bidder5)

    db.add(AuditEvent(
        tender_id=tender_id, action="SYSTEM_INIT", actor="System",
        source="GeM Core Engine", result="SUCCESS",
        details="Initialized GeM Tender GEM/2026/B/784921 with 8 compliance rules and 5 PRD demo bidders.",
        timestamp=datetime.now(timezone.utc)
    ))
    db.commit()


# ---- BIDDER 1: Clean (all pass) ----
def _seed_bidder1(db: Session, b: Bidder):
    d1 = Document(id="DOC-A-GST", bidder_id=b.id, file_name="ABC_GST_Certificate.pdf",
        file_path="/mock_docs/ABC_GST_Certificate.pdf", file_size=1048576,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.99, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "27ABCDE1234F1Z5", "legal_name": "ABC Industrial Solutions Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-01"}),
        confirmed_fields=json.dumps({"gstin": "27ABCDE1234F1Z5", "legal_name": "ABC Industrial Solutions Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-01"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d2 = Document(id="DOC-A-OEM", bidder_id=b.id, file_name="OEM_Authorization_Suraksha.pdf",
        file_path="/mock_docs/OEM_Authorization_Suraksha.pdf", file_size=824000,
        classified_type="OEM Authorization", doc_type="OEM_AUTH_LETTER",
        classification_confidence=0.98, status="CONFIRMED",
        extracted_fields=json.dumps({"issuing_entity": "Suraksha Global Safety Corp", "authorized_entity": "ABC Industrial Solutions Pvt. Ltd.", "product_category": "Safety Equipment", "issue_date": "2023-05-10", "expiry_date": "2027-12-31", "signature_present": True}),
        confirmed_fields=json.dumps({"issuing_entity": "Suraksha Global Safety Corp", "authorized_entity": "ABC Industrial Solutions Pvt. Ltd.", "product_category": "Safety Equipment", "issue_date": "2023-05-10", "expiry_date": "2027-12-31", "signature_present": True}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add_all([d1, d2])
    db.commit()
    db.add_all([
        ExtractedEntity(document_id=d1.id, entity_key="gstin", entity_value="27ABCDE1234F1Z5", confidence=0.99, page_number=1),
        ExtractedEntity(document_id=d1.id, entity_key="legal_name", entity_value="ABC Industrial Solutions Pvt. Ltd.", confidence=0.99, page_number=1),
        ExtractedEntity(document_id=d2.id, entity_key="oem_name", entity_value="Suraksha Global Safety Corp", confidence=0.98, page_number=1),
        ExtractedEntity(document_id=d2.id, entity_key="issue_date", entity_value="2023-05-10", confidence=0.98, page_number=1),
        ExtractedEntity(document_id=d2.id, entity_key="expiry_date", entity_value="2027-12-31", confidence=0.98, page_number=1),
    ])
    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-GST-001", requirement_title="GST Registration",
            status="VERIFIED", extracted_value="27ABCDE1234F1Z5", verified_value="Active",
            verification_source="GST", confidence=0.99, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="GSTIN active and legal name matches submission exactly."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-OEM-001", requirement_title="OEM Manufacturer Authorization",
            status="VERIFIED", extracted_value="Valid till 2027-12-31", verified_value="VERIFIED",
            verification_source="OEM Registry", confidence=0.98, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
            rule_explanation="Valid OEM authorization. Issue date (2023-05-10) after incorporation (2015-03-10) — consistent."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-DEBAR-001", requirement_title="Non-Blacklisting",
            status="VERIFIED", extracted_value="Not Debarred", verified_value="Clean",
            verification_source="Debarment DB", confidence=0.99, evidence_doc_id=None, evidence_file_name=None,
            rule_explanation="No match in debarment watchlist."),
    ])
    db.add(AIFinding(bidder_id=b.id, title="Verified: Full Eligibility Compliant",
        severity="VERIFIED", description="All mandatory checks pass. No blacklist match. OEM letter date consistent with incorporation.",
        document_value="All Clear", verified_value="All Clear", source="GeM Verification Engine",
        confidence=0.99, recommendation="Recommended for Qualification."))
    db.add(RiskAssessment(bidder_id=b.id, compliance_score=98.0, risk_level="LOW",
        critical_issues_count=0, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 15, "PAN": 10, "OEM": 20, "Debarment": 10, "ITR": 15, "MII": 15, "Tech": 8, "Udyam": 5}),
        reasons_json=json.dumps(["All mandatory documents valid and verified. No anomalies detected."])))
    db.commit()


# ---- BIDDER 2: Mismatched GSTIN name + OEM nearing expiry → MEDIUM (Track A FAIL) ----
def _seed_bidder2(db: Session, b: Bidder):
    d1 = Document(id="DOC-B-GST", bidder_id=b.id, file_name="Nova_GST_Certificate.pdf",
        file_path="/mock_docs/Nova_GST_Certificate.pdf", file_size=980000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.98, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "27NOVAS9876K1Z9", "legal_name": "Nova Safety Systems Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-07-15"}),
        confirmed_fields=json.dumps({"gstin": "27NOVAS9876K1Z9", "legal_name": "Nova Safety Systems Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-07-15"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d2 = Document(id="DOC-B-OEM", bidder_id=b.id, file_name="OEM_Letter_ShieldTech.pdf",
        file_path="/mock_docs/OEM_Letter_ShieldTech.pdf", file_size=750000,
        classified_type="OEM Authorization", doc_type="OEM_AUTH_LETTER",
        classification_confidence=0.97, status="CONFIRMED",
        extracted_fields=json.dumps({"issuing_entity": "ShieldTech Safety Systems", "authorized_entity": "Nova Safety Systems Pvt. Ltd.", "product_category": "Safety Equipment", "issue_date": "2022-10-01", "expiry_date": "2026-10-15", "signature_present": True}),
        confirmed_fields=json.dumps({"issuing_entity": "ShieldTech Safety Systems", "authorized_entity": "Nova Safety Systems Pvt. Ltd.", "product_category": "Safety Equipment", "issue_date": "2022-10-01", "expiry_date": "2026-10-15", "signature_present": True}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add_all([d1, d2])
    db.commit()
    db.add_all([
        ExtractedEntity(document_id=d1.id, entity_key="gstin", entity_value="27NOVAS9876K1Z9", confidence=0.98, page_number=1),
        ExtractedEntity(document_id=d1.id, entity_key="legal_name", entity_value="Nova Safety Systems Pvt. Ltd.", confidence=0.97, page_number=1),
        ExtractedEntity(document_id=d2.id, entity_key="issue_date", entity_value="2022-10-01", confidence=0.97, page_number=1),
        ExtractedEntity(document_id=d2.id, entity_key="expiry_date", entity_value="2026-10-15", confidence=0.97, page_number=1),
    ])
    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-GST-001", requirement_title="GST Registration",
            status="REVIEW_REQUIRED", extracted_value="Nova Safety Systems Pvt. Ltd.",
            verified_value="Nova Safety Systems Private Limited",
            verification_source="GST", confidence=0.92, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="Minor legal name variation: Submitted 'Pvt. Ltd.' vs GST Portal 'Private Limited'."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-OEM-001", requirement_title="OEM Authorization",
            status="REVIEW_REQUIRED", extracted_value="Expires: 2026-10-15", verified_value="Valid (Close to expiry)",
            verification_source="OEM Registry", confidence=0.90, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
            rule_explanation="OEM authorization expires 2026-10-15 — within 45 days of bid submission."),
    ])
    db.add(AIFinding(bidder_id=b.id, title="MEDIUM: GST Legal Name Mismatch + OEM Near Expiry",
        severity="MEDIUM", description="Submitted company name differs from GST portal record. OEM letter expires soon.",
        document_value="Nova Safety Systems Pvt. Ltd.", verified_value="Nova Safety Systems Private Limited",
        source="GST + OEM Registry", confidence=0.93, recommendation="Request notarized name clarification and renewed OEM letter."))
    db.add(RiskAssessment(bidder_id=b.id, compliance_score=72.0, risk_level="MEDIUM",
        critical_issues_count=0, medium_issues_count=2,
        score_breakdown_json=json.dumps({"GST": 11, "PAN": 10, "OEM": 14, "Debarment": 10, "ITR": 15, "MII": 13, "Udyam": 9}),
        reasons_json=json.dumps(["Minor legal name variation in GST certificate.", "OEM Authorization nearing expiry."])))
    db.commit()


# ---- BIDDER 3: OEM letter pre-dates incorporation → HIGH (Track C FLAGGED) ----
def _seed_bidder3(db: Session, b: Bidder):
    # incorporation_date = 2020-09-15; OEM issue_date = 2019-03-01 (BEFORE incorporation — fraud signal)
    d1 = Document(id="DOC-C-GST", bidder_id=b.id, file_name="AlphaTech_GST_Certificate.pdf",
        file_path="/mock_docs/AlphaTech_GST_Certificate.pdf", file_size=900000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.96, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "07ALPHX1122A1ZP", "legal_name": "Alpha Tech Enterprises", "filing_status": "UP_TO_DATE", "certificate_date": "2026-07-20"}),
        confirmed_fields=json.dumps({"gstin": "07ALPHX1122A1ZP", "legal_name": "Alpha Tech Enterprises", "filing_status": "UP_TO_DATE", "certificate_date": "2026-07-20"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d2 = Document(id="DOC-C-OEM", bidder_id=b.id, file_name="OEM_AlphaTech_Suspicious.pdf",
        file_path="/mock_docs/OEM_AlphaTech_Suspicious.pdf", file_size=680000,
        classified_type="OEM Authorization", doc_type="OEM_AUTH_LETTER",
        classification_confidence=0.94, status="CONFIRMED",
        # OEM issue_date 2019-03-01 is BEFORE incorporation_date 2020-09-15 ← PRD Track C trigger
        extracted_fields=json.dumps({"issuing_entity": "TechGuard Supplies India", "authorized_entity": "Alpha Tech Enterprises", "product_category": "Safety Equipment", "issue_date": "2019-03-01", "expiry_date": "2027-03-01", "signature_present": True}),
        confirmed_fields=json.dumps({"issuing_entity": "TechGuard Supplies India", "authorized_entity": "Alpha Tech Enterprises", "product_category": "Safety Equipment", "issue_date": "2019-03-01", "expiry_date": "2027-03-01", "signature_present": True}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add_all([d1, d2])
    db.commit()
    db.add_all([
        ExtractedEntity(document_id=d2.id, entity_key="issue_date", entity_value="2019-03-01", confidence=0.95, page_number=1),
        ExtractedEntity(document_id=d2.id, entity_key="expiry_date", entity_value="2027-03-01", confidence=0.95, page_number=1),
        ExtractedEntity(document_id=d2.id, entity_key="authorized_entity", entity_value="Alpha Tech Enterprises", confidence=0.94, page_number=1),
    ])
    db.add(ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-OEM-001", requirement_title="OEM Authorization",
        status="FAILED", extracted_value="Issue date: 2019-03-01", verified_value="Incorporation: 2020-09-15",
        verification_source="MCA21 Correlation", confidence=0.97, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
        rule_explanation="CRITICAL FRAUD SIGNAL: OEM letter (2019-03-01) predates company incorporation (2020-09-15). Document cannot be genuine."))
    db.add(AIFinding(bidder_id=b.id, title="HIGH RISK: OEM Letter Pre-dates Company Incorporation",
        severity="CRITICAL",
        description="OEM Authorization letter issue date (2019-03-01) is 18 months BEFORE the company's MCA21 incorporation date (2020-09-15). This is a document inconsistency that indicates potential forgery.",
        document_value="OEM Issue Date: 2019-03-01", verified_value="Incorporation Date: 2020-09-15",
        source="Track C — Cross-Document Correlation (MCA21)", confidence=0.97,
        recommendation="REJECT. OEM letter cannot predate company existence. Escalate for investigation."))
    db.add(RiskAssessment(bidder_id=b.id, compliance_score=61.0, risk_level="HIGH",
        critical_issues_count=1, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 12, "PAN": 10, "OEM": 0, "Debarment": 10, "ITR": 15, "MII": 10, "Correlation": 0}),
        reasons_json=json.dumps(["CRITICAL: OEM letter issue date predates MCA21 incorporation date — document forgery signal."])))
    db.commit()


# ---- BIDDER 4: Near-variant of blacklisted name → MEDIUM-HIGH (Track B FLAGGED) ----
def _seed_bidder4(db: Session, b: Bidder):
    d1 = Document(id="DOC-D-GST", bidder_id=b.id, file_name="Prime_GST_Cert_Provisional.pdf",
        file_path="/mock_docs/Prime_GST_Cert_Provisional.pdf", file_size=880000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.96, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "27PRIME5432M1Z2", "legal_name": "Prime Industrial Technologies", "filing_status": "DEFECTIVE_FILING", "certificate_date": "2025-01-10"}),
        confirmed_fields=json.dumps({"gstin": "27PRIME5432M1Z2", "legal_name": "Prime Industrial Technologies", "filing_status": "DEFECTIVE_FILING", "certificate_date": "2025-01-10"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add(d1)
    db.commit()
    db.add(ExtractedEntity(document_id=d1.id, entity_key="gstin", entity_value="27PRIME5432M1Z2", confidence=0.96, page_number=1))
    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-DEBAR-001", requirement_title="Non-Blacklisting",
            status="FAILED", extracted_value="Prime Industrial Technologies",
            verified_value="FLAGGED — 100% match to debarred entity",
            verification_source="Debarment DB (Fuzzy)", confidence=0.99,
            evidence_doc_id=None, evidence_file_name=None,
            rule_explanation="Bidder name is 100% similar to 'PRIME INDUSTRIAL TECHNOLOGIES' which is debarred by Ministry of Heavy Industries until 2028-05-10."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-GST-001", requirement_title="GST Registration",
            status="FAILED", extracted_value="DEFECTIVE_FILING",
            verified_value="GST filing status: DEFECTIVE",
            verification_source="GST", confidence=0.97,
            evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="GST filing status is DEFECTIVE_FILING — bidder is a non-compliant filer."),
    ])
    db.add(AIFinding(bidder_id=b.id, title="HIGH RISK: Near-Match to Debarred Entity",
        severity="CRITICAL",
        description="Bidder name 'Prime Industrial Technologies' scores 100% similarity to blacklisted entity 'PRIME INDUSTRIAL TECHNOLOGIES' debarred by Ministry of Heavy Industries (Jaro-Winkler ≥ 0.85 threshold). GST filing also defective.",
        document_value="Prime Industrial Technologies", verified_value="Debarred: PRIME INDUSTRIAL TECHNOLOGIES",
        source="Track B — Fuzzy Blacklist (Jaro-Winkler)", confidence=0.99,
        recommendation="REJECT. Cross-reference debarment order. Do not proceed."))
    db.add(RiskAssessment(bidder_id=b.id, compliance_score=55.0, risk_level="HIGH",
        critical_issues_count=2, medium_issues_count=1,
        score_breakdown_json=json.dumps({"GST": 5, "PAN": 10, "OEM": 0, "Debarment": 0, "ITR": 15, "MII": 0, "Fuzzy": 0}),
        reasons_json=json.dumps(["CRITICAL: Fuzzy match to debarred entity (100% Jaro-Winkler similarity).", "GST filing status DEFECTIVE.", "OEM Authorization missing."])))
    db.commit()


# ---- BIDDER 5 (Combo): Fuzzy + Correlation both trigger → HIGH (stress test) ----
def _seed_bidder5(db: Session, b: Bidder):
    # incorporation_date = 2022-06-01; OEM issue_date = 2021-01-15 (BEFORE incorporation)
    # Name fuzzy-matches "RADIANT PROCUREMENT SOLUTIONS" on blacklist
    d1 = Document(id="DOC-E-GST", bidder_id=b.id, file_name="Radiant_GST_Certificate.pdf",
        file_path="/mock_docs/Radiant_GST_Certificate.pdf", file_size=760000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.95, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "07RADNT6789R1ZA", "legal_name": "Radiant Procurement Solutions Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-10"}),
        confirmed_fields=json.dumps({"gstin": "07RADNT6789R1ZA", "legal_name": "Radiant Procurement Solutions Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-10"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d2 = Document(id="DOC-E-OEM", bidder_id=b.id, file_name="OEM_Radiant_Backdated.pdf",
        file_path="/mock_docs/OEM_Radiant_Backdated.pdf", file_size=620000,
        classified_type="OEM Authorization", doc_type="OEM_AUTH_LETTER",
        classification_confidence=0.93, status="CONFIRMED",
        # OEM issue_date 2021-01-15 is BEFORE incorporation 2022-06-01 — Track C trigger
        extracted_fields=json.dumps({"issuing_entity": "SafetyFirst Global Corp", "authorized_entity": "Radiant Procurement Solutions Pvt. Ltd.", "product_category": "Safety Equipment", "issue_date": "2021-01-15", "expiry_date": "2027-01-15", "signature_present": True}),
        confirmed_fields=json.dumps({"issuing_entity": "SafetyFirst Global Corp", "authorized_entity": "Radiant Procurement Solutions Pvt. Ltd.", "product_category": "Safety Equipment", "issue_date": "2021-01-15", "expiry_date": "2027-01-15", "signature_present": True}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add_all([d1, d2])
    db.commit()
    db.add_all([
        ExtractedEntity(document_id=d2.id, entity_key="issue_date", entity_value="2021-01-15", confidence=0.93, page_number=1),
        ExtractedEntity(document_id=d2.id, entity_key="expiry_date", entity_value="2027-01-15", confidence=0.93, page_number=1),
    ])
    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-DEBAR-001", requirement_title="Non-Blacklisting",
            status="FAILED", extracted_value="Radiant Procurement Solutions Pvt. Ltd.",
            verified_value="FLAGGED — near-match to debarred 'RADIANT PROCUREMENT SOLUTIONS'",
            verification_source="Debarment DB (Fuzzy)", confidence=0.92,
            evidence_doc_id=None, evidence_file_name=None,
            rule_explanation="Bidder name scores above Jaro-Winkler 0.85 against debarred entity 'RADIANT PROCUREMENT SOLUTIONS' (cartel bidding, MoF order 2025-01-15)."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-OEM-001", requirement_title="OEM Authorization",
            status="FAILED", extracted_value="Issue date: 2021-01-15", verified_value="Incorporation: 2022-06-01",
            verification_source="MCA21 Correlation", confidence=0.96,
            evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
            rule_explanation="OEM letter (2021-01-15) predates company incorporation (2022-06-01). Combination of Track B + Track C flags."),
    ])
    db.add(AIFinding(bidder_id=b.id, title="CRITICAL: Double Red Flag — Blacklist Fuzzy Match AND Backdated OEM Letter",
        severity="CRITICAL",
        description="Two independent fraud signals detected: (1) Fuzzy blacklist match to 'RADIANT PROCUREMENT SOLUTIONS' (Jaro-Winkler ≥ 0.85). (2) OEM letter issue date (2021-01-15) predates company incorporation (2022-06-01) by 17 months.",
        document_value="Radiant Procurement Solutions Pvt. Ltd.", verified_value="Debarred + Backdated OEM",
        source="Track B (Fuzzy) + Track C (Correlation)", confidence=0.96,
        recommendation="REJECT immediately. Refer to vigilance cell. Two concurrent fraud signals detected."))
    db.add(RiskAssessment(bidder_id=b.id, compliance_score=42.0, risk_level="HIGH",
        critical_issues_count=2, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 10, "PAN": 10, "OEM": 0, "Debarment": 0, "ITR": 15, "MII": 0, "Fuzzy": 0, "Correlation": 0}),
        reasons_json=json.dumps(["CRITICAL: Fuzzy name match to debarred entity (Track B).", "CRITICAL: OEM letter predates company incorporation (Track C)."])))
    db.commit()
