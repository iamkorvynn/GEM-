import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.models.models import (
    User, Tender, Requirement, Bidder, Document,
    ExtractedEntity, VerificationRecord, ComplianceRuleResult,
    AIFinding, RiskAssessment, OfficerDecision, AuditEvent
)

def seed_database(db: Session):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == "procurement.officer@demo.gov.in").first()
    if existing_user:
        return

    # 1. Create Demo User
    demo_user = User(
        email="procurement.officer@demo.gov.in",
        name="Rajesh Sharma",
        role="Senior Procurement Officer",
        department="PSU Industrial Procurement Dept",
        hashed_password="demo_hashed_pass_123"
    )
    db.add(demo_user)

    # 2. Create Realistic GeM Tender
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

    # 3. Create Requirements
    reqs = [
        Requirement(
            id="REQ-GST-001",
            tender_id=tender_id,
            title="GST Registration",
            description="Active GSTIN registration certificate in name of bidder company.",
            is_mandatory=True,
            evidence_type="GST Certificate",
            verification_source="GST",
            rule_type="ACTIVE",
            clause_reference="Clause 3.1 (a)"
        ),
        Requirement(
            id="REQ-PAN-001",
            tender_id=tender_id,
            title="PAN Card Verification",
            description="Valid Permanent Account Number allotted by Income Tax Dept.",
            is_mandatory=True,
            evidence_type="PAN Card",
            verification_source="PAN",
            rule_type="VALID",
            clause_reference="Clause 3.1 (b)"
        ),
        Requirement(
            id="REQ-UDYAM-001",
            tender_id=tender_id,
            title="Udyam / MSME Registration",
            description="Udyam Certificate required ONLY if bidder claims MSME purchase preference / EMD exemption.",
            is_mandatory=False, # Conditional
            evidence_type="Udyam Certificate",
            verification_source="Udyam",
            rule_type="VALID",
            clause_reference="Clause 4.2 (Conditional MSME Benefit)"
        ),
        Requirement(
            id="REQ-ITR-001",
            tender_id=tender_id,
            title="Income Tax Return Compliance",
            description="Filed Income Tax Returns for Assessment Year 2025-26 and 2024-25.",
            is_mandatory=True,
            evidence_type="ITR Document",
            verification_source="Income Tax",
            rule_type="VALID",
            clause_reference="Clause 3.2 (Financial Intactness)"
        ),
        Requirement(
            id="REQ-OEM-001",
            tender_id=tender_id,
            title="OEM Manufacturer Authorization",
            description="Direct Original Equipment Manufacturer authorization letter for bidding items.",
            is_mandatory=True,
            evidence_type="OEM Authorization",
            verification_source="OEM Registry",
            rule_type="REQUIRED",
            clause_reference="Clause 5.1 (Technical & OEM Backing)"
        ),
        Requirement(
            id="REQ-MII-001",
            tender_id=tender_id,
            title="Make in India Local Content Declaration",
            description="Minimum 50% local content required to qualify as Class-I Local Supplier.",
            is_mandatory=True,
            evidence_type="Make in India Declaration",
            verification_source="Make in India",
            rule_type="THRESHOLD",
            threshold_value="50",
            clause_reference="Clause 6.3 (PPP-MII Order 2017)"
        ),
        Requirement(
            id="REQ-DEBAR-001",
            tender_id=tender_id,
            title="Non-Blacklisting & Debarment Declaration",
            description="Affidavit confirming entity has not been debarred by any Govt/PSU organization.",
            is_mandatory=True,
            evidence_type="Debarment Declaration",
            verification_source="Debarment DB",
            rule_type="EXACT_MATCH",
            clause_reference="Clause 7.1 (Integrity Pact)"
        ),
        Requirement(
            id="REQ-TECH-001",
            tender_id=tender_id,
            title="Technical ISO Certification",
            description="Valid ISO 9001 quality management system certificate.",
            is_mandatory=True,
            evidence_type="Technical Certificate",
            verification_source="Document",
            rule_type="VALID_DATE",
            clause_reference="Clause 8.4 (Quality Assurance)"
        )
    ]
    for r in reqs:
        db.add(r)

    # 4. Create Demo Bidders
    # Bidder A: Fully Compliant
    bidder_a = Bidder(
        id="BIDDER-A",
        tender_id=tender_id,
        company_name="ABC Industrial Solutions Pvt. Ltd.",
        gstin="27ABCDE1234F1Z5",
        pan="ABCDE1234F",
        udyam_id="UDYAM-MH-01-0012345",
        claims_msme=True,
        claims_startup=False,
        local_content_pct=65.0,
        compliance_score=98.0,
        risk_level="LOW",
        verification_progress=100.0,
        overall_status="VERIFIED"
    )

    # Bidder B: Inconsistent
    bidder_b = Bidder(
        id="BIDDER-B",
        tender_id=tender_id,
        company_name="Nova Safety Systems Pvt. Ltd.",
        gstin="27NOVAS9876K1Z9",
        pan="NOVAS9876K",
        udyam_id="UDYAM-KA-02-0098765",
        claims_msme=True,
        claims_startup=False,
        local_content_pct=55.0,
        compliance_score=78.0,
        risk_level="MEDIUM",
        verification_progress=100.0,
        overall_status="REVIEW_REQUIRED"
    )

    # Bidder C: High Risk / Significant Issues
    bidder_c = Bidder(
        id="BIDDER-C",
        tender_id=tender_id,
        company_name="Prime Industrial Technologies",
        gstin="27PRIME5432M1Z2",
        pan="PRIME5432M",
        udyam_id=None,
        claims_msme=False,
        claims_startup=False,
        local_content_pct=40.0,
        compliance_score=58.0,
        risk_level="HIGH",
        verification_progress=100.0,
        overall_status="REVIEW_REQUIRED"
    )

    db.add_all([bidder_a, bidder_b, bidder_c])
    db.commit()

    # Seed Documents & Verification Results for Bidder A
    _seed_bidder_a_details(db, bidder_a)
    _seed_bidder_b_details(db, bidder_b)
    _seed_bidder_c_details(db, bidder_c)

    # Seed Initial Audit Log
    db.add(AuditEvent(
        tender_id=tender_id,
        action="SYSTEM_INIT",
        actor="System",
        source="GeM Core Engine",
        result="SUCCESS",
        details="Initialized GeM Tender GEM/2026/B/784921 with 8 compliance rules and 3 demo bidder submissions.",
        timestamp=datetime.now(timezone.utc)
    ))
    db.commit()

def _seed_bidder_a_details(db: Session, bidder: Bidder):
    # Documents
    d1 = Document(
        id="DOC-A-GST", bidder_id=bidder.id, file_name="ABC_GST_Certificate.pdf",
        file_path="/mock_docs/ABC_GST_Certificate.pdf", file_size=1048576,
        classified_type="GST Certificate", classification_confidence=0.99, status="VERIFIED"
    )
    d2 = Document(
        id="DOC-A-OEM", bidder_id=bidder.id, file_name="OEM_Authorization_Suraksha.pdf",
        file_path="/mock_docs/OEM_Authorization_Suraksha.pdf", file_size=824000,
        classified_type="OEM Authorization", classification_confidence=0.98, status="VERIFIED"
    )
    d3 = Document(
        id="DOC-A-MII", bidder_id=bidder.id, file_name="Make_in_India_Declaration_65pct.pdf",
        file_path="/mock_docs/Make_in_India_Declaration_65pct.pdf", file_size=420000,
        classified_type="Make in India Declaration", classification_confidence=0.97, status="VERIFIED"
    )
    db.add_all([d1, d2, d3])
    db.commit()

    # Entities
    db.add(ExtractedEntity(document_id=d1.id, entity_key="gstin", entity_value="27ABCDE1234F1Z5", confidence=0.99, page_number=1))
    db.add(ExtractedEntity(document_id=d1.id, entity_key="legal_name", entity_value="ABC Industrial Solutions Pvt. Ltd.", confidence=0.99, page_number=1))
    db.add(ExtractedEntity(document_id=d2.id, entity_key="oem_name", entity_value="Suraksha Global Safety Corp", confidence=0.98, page_number=1))
    db.add(ExtractedEntity(document_id=d3.id, entity_key="local_content_pct", entity_value="65%", confidence=0.98, page_number=1))

    # Results
    db.add(ComplianceRuleResult(
        bidder_id=bidder.id, requirement_id="REQ-GST-001", requirement_title="GST Registration",
        status="VERIFIED", extracted_value="27ABCDE1234F1Z5", verified_value="Active (ABC Industrial Solutions Pvt. Ltd.)",
        verification_source="GST", confidence=0.99, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
        rule_explanation="GSTIN active and legal name matches submission exactly."
    ))
    db.add(ComplianceRuleResult(
        bidder_id=bidder.id, requirement_id="REQ-OEM-001", requirement_title="OEM Manufacturer Authorization",
        status="VERIFIED", extracted_value="Suraksha Global Safety Corp (Valid till 2027-12-31)", verified_value="VERIFIED",
        verification_source="OEM Registry", confidence=0.98, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
        rule_explanation="Valid OEM authorization on file till 2027."
    ))
    db.add(ComplianceRuleResult(
        bidder_id=bidder.id, requirement_id="REQ-MII-001", requirement_title="Make in India Local Content Declaration",
        status="VERIFIED", extracted_value="65%", verified_value="Pass (>= 50%)",
        verification_source="Make in India", confidence=0.98, evidence_doc_id=d3.id, evidence_file_name=d3.file_name,
        rule_explanation="Local content of 65% exceeds required 50% threshold."
    ))
    db.add(ComplianceRuleResult(
        bidder_id=bidder.id, requirement_id="REQ-DEBAR-001", requirement_title="Non-Blacklisting & Debarment Declaration",
        status="VERIFIED", extracted_value="Not Debarred", verified_value="Clean (No Debarment Match)",
        verification_source="Debarment DB", confidence=0.99, evidence_doc_id=None, evidence_file_name=None,
        rule_explanation="No match in CPPP / GeM Debarment Watchlist."
    ))

    # AI Findings
    db.add(AIFinding(
        bidder_id=bidder.id, title="Verified: Full Eligibility Compliant",
        severity="VERIFIED", description="Bidder satisfies all mandatory and conditional eligibility clauses with zero discrepancies.",
        document_value="All Clear", verified_value="All Clear", source="GeM Verification Engine", confidence=0.99,
        recommendation="Recommended for Qualification.", evidence_doc_id=d1.id, evidence_file_name=d1.file_name
    ))

    # Risk Assessment
    db.add(RiskAssessment(
        bidder_id=bidder.id, compliance_score=98.0, risk_level="LOW",
        critical_issues_count=0, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 15, "PAN": 10, "Udyam": 10, "ITR": 15, "OEM": 20, "MII": 15, "Debarment": 5, "Tech": 8}),
        reasons_json=json.dumps(["All mandatory documents valid and verified against government portals."])
    ))

def _seed_bidder_b_details(db: Session, bidder: Bidder):
    d1 = Document(
        id="DOC-B-GST", bidder_id=bidder.id, file_name="Nova_GST_Certificate.pdf",
        file_path="/mock_docs/Nova_GST_Certificate.pdf", file_size=980000,
        classified_type="GST Certificate", classification_confidence=0.98, status="VERIFIED"
    )
    d2 = Document(
        id="DOC-B-OEM", bidder_id=bidder.id, file_name="OEM_Letter_ShieldTech.pdf",
        file_path="/mock_docs/OEM_Letter_ShieldTech.pdf", file_size=750000,
        classified_type="OEM Authorization", classification_confidence=0.97, status="VERIFIED"
    )
    db.add_all([d1, d2])
    db.commit()

    db.add(ComplianceRuleResult(
        bidder_id=bidder.id, requirement_id="REQ-GST-001", requirement_title="GST Registration",
        status="REVIEW_REQUIRED", extracted_value="Nova Safety Systems Pvt. Ltd.",
        verified_value="Nova Safety Systems Private Limited", verification_source="GST", confidence=0.92,
        evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
        rule_explanation="Minor legal name variation: Submitted 'Pvt. Ltd.' vs GST Portal 'Private Limited'."
    ))
    db.add(ComplianceRuleResult(
        bidder_id=bidder.id, requirement_id="REQ-OEM-001", requirement_title="OEM Manufacturer Authorization",
        status="REVIEW_REQUIRED", extracted_value="Expires: 2026-10-15", verified_value="Valid (Close to expiry)",
        verification_source="OEM Registry", confidence=0.90, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
        rule_explanation="OEM authorization letter expires on 2026-10-15 (within 45 days of bid submission)."
    ))

    db.add(AIFinding(
        bidder_id=bidder.id, title="Legal Name Minor Variation",
        severity="MEDIUM", description="GST registration legal name contains 'Private Limited' while bid submission uses 'Pvt. Ltd.'",
        document_value="Nova Safety Systems Pvt. Ltd.", verified_value="Nova Safety Systems Private Limited",
        source="GST", confidence=0.94, recommendation="Manual officer verification suggested to confirm legal entity identity.",
        evidence_doc_id=d1.id, evidence_file_name=d1.file_name
    ))

    db.add(RiskAssessment(
        bidder_id=bidder.id, compliance_score=78.0, risk_level="MEDIUM",
        critical_issues_count=0, medium_issues_count=2,
        score_breakdown_json=json.dumps({"GST": 11, "PAN": 10, "Udyam": 10, "ITR": 15, "OEM": 14, "MII": 13, "Debarment": 5}),
        reasons_json=json.dumps(["Minor legal name variation in GST certificate.", "OEM Authorization is nearing expiry date."])
    ))

def _seed_bidder_c_details(db: Session, bidder: Bidder):
    d1 = Document(
        id="DOC-C-GST", bidder_id=bidder.id, file_name="Prime_GST_Cert_Provisional.pdf",
        file_path="/mock_docs/Prime_GST_Cert_Provisional.pdf", file_size=880000,
        classified_type="GST Certificate", classification_confidence=0.96, status="VERIFIED"
    )
    d2 = Document(
        id="DOC-C-ISO", bidder_id=bidder.id, file_name="ISO_9001_2015_Expired.pdf",
        file_path="/mock_docs/ISO_9001_2015_Expired.pdf", file_size=650000,
        classified_type="Technical Certificate", classification_confidence=0.95, status="VERIFIED"
    )
    db.add_all([d1, d2])
    db.commit()

    db.add(ComplianceRuleResult(
        bidder_id=bidder.id, requirement_id="REQ-OEM-001", requirement_title="OEM Manufacturer Authorization",
        status="MISSING", extracted_value="Not Provided", verified_value="Required",
        verification_source="OEM Registry", confidence=1.0, evidence_doc_id=None, evidence_file_name=None,
        rule_explanation="Mandatory OEM authorization letter missing from bidder uploads."
    ))
    db.add(ComplianceRuleResult(
        bidder_id=bidder.id, requirement_id="REQ-TECH-001", requirement_title="Technical ISO Certification",
        status="EXPIRED", extracted_value="Expired: 2025-11-30", verified_value="Active Cert Required",
        verification_source="Document", confidence=0.97, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
        rule_explanation="Submitted ISO 9001 certificate expired on 2025-11-30."
    ))
    db.add(ComplianceRuleResult(
        bidder_id=bidder.id, requirement_id="REQ-DEBAR-001", requirement_title="Non-Blacklisting & Debarment Declaration",
        status="FAILED", extracted_value="Prime Industrial Technologies",
        verified_value="DEBARRED (Ministry of Heavy Ind.)", verification_source="Debarment DB", confidence=0.98,
        evidence_doc_id=None, evidence_file_name=None,
        rule_explanation="Active match found in CPPP Debarment Watchlist. Debarred till May 2028."
    ))

    db.add(AIFinding(
        bidder_id=bidder.id, title="CRITICAL: Debarment Watchlist Match",
        severity="CRITICAL", description="Entity matches blacklisted bidder 'Prime Industrial Technologies' debarred by Ministry of Heavy Industries.",
        document_value="Prime Industrial Technologies", verified_value="DEBARRED UNTIL 2028-05-10",
        source="Debarment DB", confidence=0.98, recommendation="PROCUREMENT OFFICER REVIEW REQUIRED. Immediate inspection of debarment order recommended.",
        evidence_doc_id=None, evidence_file_name=None
    ))

    db.add(RiskAssessment(
        bidder_id=bidder.id, compliance_score=58.0, risk_level="HIGH",
        critical_issues_count=3, medium_issues_count=1,
        score_breakdown_json=json.dumps({"GST": 8, "PAN": 10, "Udyam": 0, "ITR": 15, "OEM": 0, "MII": 10, "Debarment": 0, "Tech": 0}),
        reasons_json=json.dumps([
            "Mandatory OEM Authorization missing.",
            "ISO 9001 Quality Certificate is expired.",
            "Match found in CPPP Debarment Watchlist."
        ])
    ))
