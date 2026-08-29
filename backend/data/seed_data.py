import json
from datetime import datetime, timezone, timedelta
from backend.services.auth_service import hash_password
from sqlalchemy.orm import Session
from backend.models.models import (
    User, Tender, Requirement, Bidder, Document,
    ExtractedEntity, VerificationRecord, VerificationCheck, ComplianceRuleResult,
    AIFinding, RiskAssessment, OfficerDecision, AuditEvent
)

def seed_database(db: Session):
    # ── 1. Seed role-based users if not existing ─────────────────────────
    existing_user = db.query(User).filter(User.email == "procurement.officer@demo.gov.in").first()
    if not existing_user:
        users = [
            User(
                email="procurement.officer@demo.gov.in",
                name="Rajesh Sharma",
                role="Procurement Officer",
                department="PSU Industrial Procurement Dept",
                hashed_password=hash_password("demo123"),
            ),
            User(
                email="senior.manager@demo.gov.in",
                name="Priya Mehta",
                role="Senior Manager",
                department="Ministry of Heavy Industries",
                hashed_password=hash_password("demo456"),
            ),
            User(
                email="admin@demo.gov.in",
                name="Arjun Kapoor",
                role="System Admin",
                department="GeM Platform Administration",
                hashed_password=hash_password("admin123"),
            ),
        ]
        for u in users:
            db.add(u)
        db.commit()
    else:
        if not existing_user.hashed_password.startswith("$2b$"):
            existing_user.hashed_password = hash_password("demo123")
            db.commit()

    # ── 2. Seed Tender 1: Industrial Safety Equipment ─────────────────────
    _seed_tender_1(db)

    # ── 3. Seed Tender 2: Medical Diagnostic Equipment ────────────────────
    _seed_tender_2(db)

    # ── 4. Seed Tender 3: Secured Campus Cloud & Datacenter ───────────────
    _seed_tender_3(db)

    # ── 5. Seed Tender 4: Grid-Connected Solar Rooftop Power Plants ───────
    _seed_tender_4(db)

    db.commit()


# ===========================================================================
# TENDER 1: Industrial Safety Equipment (GEM/2026/B/784921)
# ===========================================================================
def _seed_tender_1(db: Session):
    tender_id = "GEM/2026/B/784921"
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
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
        db.commit()

    # Ensure requirements exist
    req_count = db.query(Requirement).filter(Requirement.tender_id == tender_id).count()
    if req_count == 0:
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
            Requirement(id="REQ-STARTUP-001", tender_id=tender_id, title="Startup India Recognition Certificate",
                description="Required only if Startup benefit is claimed.", is_mandatory=False,
                evidence_type="Startup India Certificate", verification_source="Startup India", rule_type="VALID",
                clause_reference="Clause 4.3"),
            Requirement(id="REQ-NSIC-001", tender_id=tender_id, title="NSIC Registration Certificate",
                description="Optional NSIC certificate for registration exemption.", is_mandatory=False,
                evidence_type="NSIC Certificate", verification_source="NSIC", rule_type="VALID",
                clause_reference="Clause 4.4"),
            Requirement(id="REQ-EPFO-001", tender_id=tender_id, title="EPFO/ESIC Compliance",
                description="Valid EPFO compliance clearance.", is_mandatory=True,
                evidence_type="EPFO Compliance", verification_source="EPFO", rule_type="VALID",
                clause_reference="Clause 4.5"),
        ]
        db.add_all(reqs)
        db.commit()

    # Seed or refresh bidders
    bidders_data = [
        {
            "id": "BIDDER-A", "tender_id": tender_id,
            "company_name": "ABC Industrial Solutions Pvt. Ltd.",
            "gstin": "27ABCDE1234F1Z5", "pan": "ABCDE1234F",
            "udyam_id": "UDYAM-MH-01-0012345", "company_type": "Pvt Ltd",
            "incorporation_date": "2015-03-10", "claims_msme": True, "claims_startup": True,
            "local_content_pct": 65.0, "compliance_score": 98.0, "risk_level": "LOW",
            "verification_progress": 100.0, "overall_status": "VERIFIED"
        },
        {
            "id": "BIDDER-B", "tender_id": tender_id,
            "company_name": "Nova Safety Systems Pvt. Ltd.",
            "gstin": "27NOVAS9876K1Z9", "pan": "NOVAS9876K",
            "udyam_id": "UDYAM-KA-02-0098765", "company_type": "Pvt Ltd",
            "incorporation_date": "2019-03-15", "claims_msme": True,
            "local_content_pct": 55.0, "compliance_score": 72.0, "risk_level": "MEDIUM",
            "verification_progress": 100.0, "overall_status": "REVIEW_REQUIRED"
        },
        {
            "id": "BIDDER-C", "tender_id": tender_id,
            "company_name": "Alpha Tech Enterprises",
            "gstin": "07ALPHX1122A1ZP", "pan": "ALPHX1122A",
            "udyam_id": None, "company_type": "Proprietorship",
            "incorporation_date": "2020-09-15", "claims_msme": False,
            "local_content_pct": 52.0, "compliance_score": 61.0, "risk_level": "HIGH",
            "verification_progress": 100.0, "overall_status": "REVIEW_REQUIRED"
        },
        {
            "id": "BIDDER-D", "tender_id": tender_id,
            "company_name": "Prime Industrial Technologies",
            "gstin": "27PRIME5432M1Z2", "pan": "PRIME5432M",
            "udyam_id": None, "company_type": "Pvt Ltd",
            "incorporation_date": "2021-01-10", "claims_msme": False,
            "local_content_pct": 40.0, "compliance_score": 55.0, "risk_level": "HIGH",
            "verification_progress": 100.0, "overall_status": "REVIEW_REQUIRED"
        },
        {
            "id": "BIDDER-E", "tender_id": tender_id,
            "company_name": "Radiant Procurement Solutions Pvt. Ltd.",
            "gstin": "07RADNT6789R1ZA", "pan": "RADNT6789R",
            "udyam_id": None, "company_type": "Pvt Ltd",
            "incorporation_date": "2022-06-01", "claims_msme": False,
            "local_content_pct": 48.0, "compliance_score": 42.0, "risk_level": "HIGH",
            "verification_progress": 100.0, "overall_status": "REVIEW_REQUIRED"
        },
        {
            "id": "BIDDER-F", "tender_id": tender_id,
            "company_name": "Zenith Safety Equipment Pvt. Ltd.",
            "gstin": "27ZENIT1234E1Z0", "pan": "ZENIT1234E",
            "udyam_id": "UDYAM-MH-01-0099887", "company_type": "Pvt Ltd",
            "incorporation_date": "2018-05-12", "claims_msme": True,
            "local_content_pct": 70.0, "compliance_score": 92.0, "risk_level": "LOW",
            "verification_progress": 100.0, "overall_status": "VERIFIED"
        }
    ]

    for bd in bidders_data:
        b = db.query(Bidder).filter(Bidder.id == bd["id"]).first()
        if not b:
            b = Bidder(**bd)
            db.add(b)
        else:
            for k, v in bd.items():
                setattr(b, k, v)
        db.commit()

        if bd["id"] == "BIDDER-A":
            _seed_bidder1(db, b)
        elif bd["id"] == "BIDDER-B":
            _seed_bidder2(db, b)
        elif bd["id"] == "BIDDER-C":
            _seed_bidder3(db, b)
        elif bd["id"] == "BIDDER-D":
            _seed_bidder4(db, b)
        elif bd["id"] == "BIDDER-E":
            _seed_bidder5(db, b)
        elif bd["id"] == "BIDDER-F":
            _seed_bidder6(db, b)


# ===========================================================================
# TENDER 2: Specialized Diagnostic Medical Equipment (GEM/2026/B/891042)
# ===========================================================================
def _seed_tender_2(db: Session):
    tender_id = "GEM/2026/B/891042"
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        tender = Tender(
            id=tender_id,
            title="Procurement of Specialized Diagnostic Medical Equipment & Consumables",
            department="Ministry of Health & Family Welfare / Central Procurement Cell",
            description="Procurement of advanced MRI consumables, digital ultrasound scanners, automated ICU ventilators, and patient monitoring systems for central government hospitals.",
            created_date="2026-08-05",
            deadline="2026-10-15",
            estimated_cost="INR 6.8 Crores",
            status="ACTIVE"
        )
        db.add(tender)
        db.commit()

    # Requirements
    db.query(Requirement).filter(Requirement.tender_id == tender_id).delete()
    reqs = [
        Requirement(id="REQ-MED-GST-001", tender_id=tender_id, title="GST Registration",
            description="Active GSTIN with up-to-date monthly return filings.", is_mandatory=True,
            evidence_type="GST Certificate", verification_source="GST", rule_type="ACTIVE",
            clause_reference="Clause 3.1 (a)"),
        Requirement(id="REQ-MED-PAN-001", tender_id=tender_id, title="PAN Card Verification",
            description="Valid PAN registered with Income Tax Department.", is_mandatory=True,
            evidence_type="PAN Card", verification_source="PAN", rule_type="VALID",
            clause_reference="Clause 3.1 (b)"),
        Requirement(id="REQ-MED-CDSCO-001", tender_id=tender_id, title="CDSCO Medical Device License",
            description="Valid Form MD-15 / MD-9 medical device manufacturing/import license.", is_mandatory=True,
            evidence_type="CDSCO Regulatory License", verification_source="CDSCO Registry", rule_type="VALID_DATE",
            clause_reference="Clause 4.1"),
        Requirement(id="REQ-MED-OEM-001", tender_id=tender_id, title="Tier-1 OEM Authorization & Warranty",
            description="Direct OEM authorization with 5-year Comprehensive Maintenance Contract (CMC).", is_mandatory=True,
            evidence_type="OEM Authorization Letter", verification_source="OEM Registry", rule_type="REQUIRED",
            clause_reference="Clause 5.2"),
        Requirement(id="REQ-MED-ISO-001", tender_id=tender_id, title="ISO 13485 QMS Certification",
            description="Valid ISO 13485 Medical Devices Quality Management System certification.", is_mandatory=True,
            evidence_type="ISO Certificate", verification_source="Document", rule_type="VALID_DATE",
            clause_reference="Clause 6.1"),
        Requirement(id="REQ-MED-MII-001", tender_id=tender_id, title="Make in India Local Content Declaration",
            description="Minimum 50% local content for Class-I Local Supplier preference.", is_mandatory=True,
            evidence_type="Make in India Declaration", verification_source="Make in India",
            rule_type="THRESHOLD", threshold_value="50", clause_reference="Clause 7.3"),
        Requirement(id="REQ-MED-DEBAR-001", tender_id=tender_id, title="Non-Blacklisting & Integrity Pact",
            description="Declaration of no debarment by MoHFW or any Central/State health procurement agency.", is_mandatory=True,
            evidence_type="Debarment Affidavit", verification_source="Debarment DB",
            rule_type="EXACT_MATCH", clause_reference="Clause 8.1"),
        Requirement(id="REQ-MED-ITR-001", tender_id=tender_id, title="Income Tax Returns (3 Years)",
            description="Audited financial returns confirming minimum average turnover of INR 10 Crores.", is_mandatory=True,
            evidence_type="ITR Document", verification_source="Income Tax", rule_type="VALID",
            clause_reference="Clause 9.2"),
    ]
    db.add_all(reqs)
    db.commit()

    # Bidders for Tender 2
    bidders_data = [
        {
            "id": "BID-MED-01", "tender_id": tender_id,
            "company_name": "MedTech Precision Diagnostics Ltd.",
            "gstin": "27MEDTC1234A1Z5", "pan": "MEDTC1234A",
            "udyam_id": "UDYAM-MH-02-0089123", "company_type": "Public Ltd",
            "incorporation_date": "2016-04-10", "claims_msme": True,
            "local_content_pct": 68.0, "compliance_score": 95.0, "risk_level": "LOW",
            "verification_progress": 100.0, "overall_status": "VERIFIED"
        },
        {
            "id": "BID-MED-02", "tender_id": tender_id,
            "company_name": "Apex Healthcare Instruments Pvt. Ltd.",
            "gstin": "29APEXH5678B1Z2", "pan": "APEXH5678B",
            "udyam_id": "UDYAM-KA-03-0045678", "company_type": "Pvt Ltd",
            "incorporation_date": "2018-08-22", "claims_msme": True,
            "local_content_pct": 48.0, "compliance_score": 74.0, "risk_level": "MEDIUM",
            "verification_progress": 100.0, "overall_status": "REVIEW_REQUIRED"
        },
        {
            "id": "BID-MED-03", "tender_id": tender_id,
            "company_name": "BioShield Diagnostics Solutions",
            "gstin": "07BIOSD9012C1ZX", "pan": "BIOSD9012C",
            "udyam_id": None, "company_type": "Pvt Ltd",
            "incorporation_date": "2022-02-14", "claims_msme": False,
            "local_content_pct": 35.0, "compliance_score": 42.0, "risk_level": "HIGH",
            "verification_progress": 100.0, "overall_status": "REVIEW_REQUIRED"
        }
    ]

    for bd in bidders_data:
        b = db.query(Bidder).filter(Bidder.id == bd["id"]).first()
        if not b:
            b = Bidder(**bd)
            db.add(b)
        else:
            for k, v in bd.items():
                setattr(b, k, v)
        db.commit()

        if bd["id"] == "BID-MED-01":
            _seed_bidder_med1(db, b)
        elif bd["id"] == "BID-MED-02":
            _seed_bidder_med2(db, b)
        elif bd["id"] == "BID-MED-03":
            _seed_bidder_med3(db, b)

    db.add(AuditEvent(
        tender_id=tender_id, action="TENDER_INITIALIZED", actor="Procurement Officer",
        source="GeM Evaluation Engine", result="SUCCESS",
        details=f"Tender {tender_id} seeded with 8 medical requirements and 3 evaluated bidders.",
        timestamp=datetime.now(timezone.utc) - timedelta(days=2)
    ))
    db.commit()


# ===========================================================================
# TENDER 3: Secured Campus Cloud & Datacenter (GEM/2026/B/952317)
# ===========================================================================
def _seed_tender_3(db: Session):
    tender_id = "GEM/2026/B/952317"
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        tender = Tender(
            id=tender_id,
            title="Turnkey Deployment of Secured Campus Cloud & Datacenter Networking",
            department="Ministry of Electronics & IT / NIC Systems Division",
            description="High-availability core networking, hybrid cloud infrastructure deployment, enterprise SAN storage, and cyber protection suite for NIC datacenter nodes.",
            created_date="2026-08-10",
            deadline="2026-10-30",
            estimated_cost="INR 12.5 Crores",
            status="ACTIVE"
        )
        db.add(tender)
        db.commit()

    db.query(Requirement).filter(Requirement.tender_id == tender_id).delete()
    reqs = [
        Requirement(id="REQ-CLOUD-GST-001", tender_id=tender_id, title="GST Registration",
            description="Active GSTIN registration with GSTR-3B filings up to date.", is_mandatory=True,
            evidence_type="GST Certificate", verification_source="GST", rule_type="ACTIVE",
            clause_reference="Clause 2.1"),
        Requirement(id="REQ-CLOUD-PAN-001", tender_id=tender_id, title="PAN Card Verification",
            description="Valid PAN entity registration.", is_mandatory=True,
            evidence_type="PAN Card", verification_source="PAN", rule_type="VALID",
            clause_reference="Clause 2.2"),
        Requirement(id="REQ-CLOUD-OEM-001", tender_id=tender_id, title="Tier-1 Cloud/Server OEM Authorization",
            description="Manufacturer authorization for blade servers and SAN storage with 24x7 mission-critical support SLA.", is_mandatory=True,
            evidence_type="OEM Authorization", verification_source="OEM Registry", rule_type="REQUIRED",
            clause_reference="Clause 4.1"),
        Requirement(id="REQ-CLOUD-ISO-001", tender_id=tender_id, title="ISO 27001 Information Security Management",
            description="Valid ISO/IEC 27001 certificate covering datacenter operations and cloud hosting.", is_mandatory=True,
            evidence_type="Security Certificate", verification_source="Document", rule_type="VALID_DATE",
            clause_reference="Clause 5.3"),
        Requirement(id="REQ-CLOUD-CMMI-001", tender_id=tender_id, title="CMMI Level 3+ Software & Services Appraisal",
            description="Active CMMI Maturity Level 3 or higher appraisal for systems integration.", is_mandatory=True,
            evidence_type="CMMI Certificate", verification_source="Document", rule_type="VALID_DATE",
            clause_reference="Clause 6.2"),
        Requirement(id="REQ-CLOUD-MII-001", tender_id=tender_id, title="Make in India Local Content Declaration",
            description="Minimum 50% local content requirement for Class-I Local Supplier preference.", is_mandatory=True,
            evidence_type="Make in India Declaration", verification_source="Make in India",
            rule_type="THRESHOLD", threshold_value="50", clause_reference="Clause 7.1"),
        Requirement(id="REQ-CLOUD-DEBAR-001", tender_id=tender_id, title="Non-Debarment & Cyber Integrity Declaration",
            description="Affidavit confirming entity has not been blacklisted by MeitY, CERT-In, or CPPP.", is_mandatory=True,
            evidence_type="Debarment Declaration", verification_source="Debarment DB",
            rule_type="EXACT_MATCH", clause_reference="Clause 8.4"),
        Requirement(id="REQ-CLOUD-FIN-001", tender_id=tender_id, title="Audited Financial Net Worth & Turnover",
            description="Average annual turnover of at least INR 25 Crores over the past 3 fiscal years.", is_mandatory=True,
            evidence_type="Financial Audit Report", verification_source="Income Tax", rule_type="VALID",
            clause_reference="Clause 9.1"),
    ]
    db.add_all(reqs)
    db.commit()

    # Bidders for Tender 3
    bidders_data = [
        {
            "id": "BID-CLOUD-01", "tender_id": tender_id,
            "company_name": "Bharat Cloud Infrastructure Ltd.",
            "gstin": "07BHRTC3344D1Z6", "pan": "BHRTC3344D",
            "udyam_id": "UDYAM-DL-04-0012984", "company_type": "Public Ltd",
            "incorporation_date": "2015-09-01", "claims_msme": True,
            "local_content_pct": 72.0, "compliance_score": 96.0, "risk_level": "LOW",
            "verification_progress": 100.0, "overall_status": "VERIFIED"
        },
        {
            "id": "BID-CLOUD-02", "tender_id": tender_id,
            "company_name": "NetCore Cyber Systems Pvt. Ltd.",
            "gstin": "27NETCR7788E1Z1", "pan": "NETCR7788E",
            "udyam_id": "UDYAM-MH-05-0067890", "company_type": "Pvt Ltd",
            "incorporation_date": "2018-11-15", "claims_msme": True,
            "local_content_pct": 60.0, "compliance_score": 76.0, "risk_level": "MEDIUM",
            "verification_progress": 100.0, "overall_status": "REVIEW_REQUIRED"
        },
        {
            "id": "BID-CLOUD-03", "tender_id": tender_id,
            "company_name": "Horizon Tech Solutions India",
            "gstin": "24HORIZ2233F1Z9", "pan": "HORIZ2233F",
            "udyam_id": None, "company_type": "Pvt Ltd",
            "incorporation_date": "2021-05-18", "claims_msme": False,
            "local_content_pct": 36.0, "compliance_score": 46.0, "risk_level": "HIGH",
            "verification_progress": 100.0, "overall_status": "REVIEW_REQUIRED"
        }
    ]

    for bd in bidders_data:
        b = db.query(Bidder).filter(Bidder.id == bd["id"]).first()
        if not b:
            b = Bidder(**bd)
            db.add(b)
        else:
            for k, v in bd.items():
                setattr(b, k, v)
        db.commit()

        if bd["id"] == "BID-CLOUD-01":
            _seed_bidder_cloud1(db, b)
        elif bd["id"] == "BID-CLOUD-02":
            _seed_bidder_cloud2(db, b)
        elif bd["id"] == "BID-CLOUD-03":
            _seed_bidder_cloud3(db, b)

    db.add(AuditEvent(
        tender_id=tender_id, action="TENDER_INITIALIZED", actor="System Admin",
        source="GeM Core Cloud System", result="SUCCESS",
        details=f"Tender {tender_id} initialized with 8 cloud/datacenter criteria and 3 technical bids.",
        timestamp=datetime.now(timezone.utc) - timedelta(days=1)
    ))
    db.commit()


# ===========================================================================
# TENDER 4: Grid-Connected Solar Rooftop Power Plants (GEM/2026/B/102948)
# ===========================================================================
def _seed_tender_4(db: Session):
    tender_id = "GEM/2026/B/102948"
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        tender = Tender(
            id=tender_id,
            title="Design, Supply, Installation, and Commissioning of Grid-Connected Solar Rooftop Power Plants",
            department="Ministry of New and Renewable Energy / PSU Infrastructure Division",
            description="Sealed bids for design, engineering, supply of solar PV modules, grid tie inverters, installation and commissioning of rooftop solar plants with 5-year comprehensive O&M at government buildings.",
            created_date="2026-08-15",
            deadline="2026-11-15",
            estimated_cost="INR 8.5 Crores",
            status="ACTIVE"
        )
        db.add(tender)
        db.commit()

    db.query(Requirement).filter(Requirement.tender_id == tender_id).delete()
    reqs = [
        Requirement(id="REQ-SOLAR-GST-001", tender_id=tender_id, title="GST Registration",
            description="Active GSTIN registration certificate.", is_mandatory=True,
            evidence_type="GST Certificate", verification_source="GST", rule_type="ACTIVE",
            clause_reference="Clause 2.1"),
        Requirement(id="REQ-SOLAR-PAN-001", tender_id=tender_id, title="PAN Card Verification",
            description="Valid PAN entity registration.", is_mandatory=True,
            evidence_type="PAN Card", verification_source="PAN", rule_type="VALID",
            clause_reference="Clause 2.2"),
        Requirement(id="REQ-SOLAR-OEM-001", tender_id=tender_id, title="Solar PV Module Tier-1 OEM Authorization",
            description="Tier-1 OEM manufacturer authorization certificate for PV modules.", is_mandatory=True,
            evidence_type="OEM Authorization", verification_source="OEM Registry", rule_type="REQUIRED",
            clause_reference="Clause 4.1"),
        Requirement(id="REQ-SOLAR-MII-001", tender_id=tender_id, title="Make in India Local Content Declaration (60%)",
            description="Minimum 60% local content requirement for solar PV modules under ALMM list.", is_mandatory=True,
            evidence_type="Make in India Declaration", verification_source="Make in India",
            rule_type="THRESHOLD", threshold_value="60", clause_reference="Clause 5.2"),
        Requirement(id="REQ-SOLAR-DEBAR-001", tender_id=tender_id, title="Non-Blacklisting & Debarment Declaration",
            description="Declaration confirming no debarment by MNRE or any government agency.", is_mandatory=True,
            evidence_type="Debarment Declaration", verification_source="Debarment DB",
            rule_type="EXACT_MATCH", clause_reference="Clause 6.1"),
    ]
    db.add_all(reqs)
    db.commit()

    # Bidders for Tender 4
    bidders_data = [
        {
            "id": "BID-SOLAR-01", "tender_id": tender_id,
            "company_name": "Solaria Energy Grid Pvt. Ltd.",
            "gstin": "27SOLAR1234S1Z4", "pan": "SOLAR1234S",
            "udyam_id": "UDYAM-MH-03-0098124", "company_type": "Pvt Ltd",
            "incorporation_date": "2017-06-18", "claims_msme": True,
            "local_content_pct": 65.0, "compliance_score": 94.0, "risk_level": "LOW",
            "verification_progress": 100.0, "overall_status": "VERIFIED"
        },
        {
            "id": "BID-SOLAR-02", "tender_id": tender_id,
            "company_name": "Vikas Solar Power Solutions",
            "gstin": "07VIKAS4321P1ZA", "pan": "VIKAS4321P",
            "udyam_id": None, "company_type": "Proprietorship",
            "incorporation_date": "2020-11-20", "claims_msme": False,
            "local_content_pct": 45.0, "compliance_score": 52.0, "risk_level": "HIGH",
            "verification_progress": 100.0, "overall_status": "REVIEW_REQUIRED"
        }
    ]

    for bd in bidders_data:
        b = db.query(Bidder).filter(Bidder.id == bd["id"]).first()
        if not b:
            b = Bidder(**bd)
            db.add(b)
        else:
            for k, v in bd.items():
                setattr(b, k, v)
        db.commit()

        if bd["id"] == "BID-SOLAR-01":
            _seed_bidder_solar1(db, b)
        elif bd["id"] == "BID-SOLAR-02":
            _seed_bidder_solar2(db, b)

    db.add(AuditEvent(
        tender_id=tender_id, action="TENDER_INITIALIZED", actor="Procurement Officer",
        source="GeM Evaluation Engine", result="SUCCESS",
        details=f"Tender {tender_id} seeded with solar requirements and 2 mock bidders.",
        timestamp=datetime.now(timezone.utc) - timedelta(days=1)
    ))
    db.commit()


def _seed_bidder_solar1(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)

    d1 = Document(id="DOC-SOLAR1-GST", bidder_id=b.id, file_name="Solaria_GST_Certificate.pdf",
        file_path="/mock_docs/Solaria_GST_Certificate.pdf", file_size=820000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.98, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "27SOLAR1234S1Z4", "legal_name": "Solaria Energy Grid Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-01"}),
        confirmed_fields=json.dumps({"gstin": "27SOLAR1234S1Z4", "legal_name": "Solaria Energy Grid Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-01"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))

    d2 = Document(id="DOC-SOLAR1-OEM", bidder_id=b.id, file_name="Solaria_OEM_Authorization.pdf",
        file_path="/mock_docs/Solaria_OEM_Authorization.pdf", file_size=740000,
        classified_type="OEM Authorization", doc_type="OEM_AUTH_LETTER",
        classification_confidence=0.96, status="CONFIRMED",
        extracted_fields=json.dumps({"issuing_entity": "Tata Power Solar Systems", "authorized_entity": "Solaria Energy Grid Pvt. Ltd.", "product_category": "Solar PV Modules", "issue_date": "2024-03-10", "expiry_date": "2029-12-31", "signature_present": True}),
        confirmed_fields=json.dumps({"issuing_entity": "Tata Power Solar Systems", "authorized_entity": "Solaria Energy Grid Pvt. Ltd.", "product_category": "Solar PV Modules", "issue_date": "2024-03-10", "expiry_date": "2029-12-31", "signature_present": True}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    
    db.add_all([d1, d2])
    db.commit()

    db.add_all([
        VerificationCheck(id=f"CHK-EX-GST-{b.id}", bidder_id=b.id, check_type="EXACT", module="GSTIN_VALIDITY", result="PASS",
            reason=f"GSTIN '{b.gstin}' active on GST portal and GSTR-3B filings up to date",
            source_fields=json.dumps({"doc_gstin": b.gstin, "registry_status": "ACTIVE"})),
        VerificationCheck(id=f"CHK-EX-PAN-{b.id}", bidder_id=b.id, check_type="EXACT", module="PAN_MATCH", result="PASS",
            reason=f"PAN '{b.pan}' matches legal entity name on Income Tax registry",
            source_fields=json.dumps({"pan": b.pan, "registry_name": b.company_name})),
    ])

    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-SOLAR-GST-001", requirement_title="GST Registration",
            status="VERIFIED", extracted_value="27SOLAR1234S1Z4", verified_value="Active",
            verification_source="GST", confidence=0.98, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="GSTIN active and legal name matches submission exactly."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-SOLAR-OEM-001", requirement_title="Solar PV Module Tier-1 OEM Authorization",
            status="VERIFIED", extracted_value="Valid till 2029-12-31", verified_value="VERIFIED",
            verification_source="OEM Registry", confidence=0.96, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
            rule_explanation="Valid OEM authorization. Issue date after incorporation — consistent."),
    ])

    db.add(AIFinding(bidder_id=b.id, title="Verified: Fully Compliant",
        severity="VERIFIED", description="Solaria satisfies all criteria with no deviations or risk markers.",
        document_value=b.company_name, verified_value="Fully Compliant",
        source="Evaluation Module", confidence=0.97, recommendation="QUALIFY bidder."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=94.0, risk_level="LOW",
        critical_issues_count=0, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 20, "PAN": 20, "OEM": 20, "Debarment": 20, "MII": 14}),
        reasons_json=json.dumps(["All checks passed.", "Document signatures verified."])))
    db.commit()


def _seed_bidder_solar2(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)

    d1 = Document(id="DOC-SOLAR2-GST", bidder_id=b.id, file_name="Vikas_GST_Certificate.pdf",
        file_path="/mock_docs/Vikas_GST_Certificate.pdf", file_size=780000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.95, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "07VIKAS4321P1ZA", "legal_name": "Vikas Solar Power Solutions", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-10"}),
        confirmed_fields=json.dumps({"gstin": "07VIKAS4321P1ZA", "legal_name": "Vikas Solar Power Solutions", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-10"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))

    db.add(d1)
    db.commit()

    db.add_all([
        VerificationCheck(id=f"CHK-EX-GST-{b.id}", bidder_id=b.id, check_type="EXACT", module="GSTIN_VALIDITY", result="PASS",
            reason=f"GSTIN '{b.gstin}' active on GST portal",
            source_fields=json.dumps({"doc_gstin": b.gstin, "registry_status": "ACTIVE"})),
        VerificationCheck(id=f"CHK-EX-PAN-{b.id}", bidder_id=b.id, check_type="EXACT", module="PAN_MATCH", result="PASS",
            reason=f"PAN '{b.pan}' matches legal name on Income Tax registry",
            source_fields=json.dumps({"pan": b.pan, "registry_name": b.company_name})),
    ])

    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-SOLAR-GST-001", requirement_title="GST Registration",
            status="VERIFIED", extracted_value="07VIKAS4321P1ZA", verified_value="Active",
            verification_source="GST", confidence=0.95, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="GSTIN active and legal name matches submission exactly."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-SOLAR-MII-001", requirement_title="Make in India Local Content Declaration (60%)",
            status="FAILED", extracted_value="45%", verified_value="45% (Below 60% threshold)",
            verification_source="Make in India", confidence=0.90, evidence_doc_id=None, evidence_file_name=None,
            rule_explanation="Local content of 45% is below the required 60% local content requirement."),
    ])

    db.add(AIFinding(bidder_id=b.id, title="CRITICAL: Local Content below threshold",
        severity="CRITICAL", description="Make in India declaration shows 45% local content, which is below the mandatory 60% threshold for solar modules.",
        document_value="45%", verified_value="Non-Compliant",
        source="MII Evaluation", confidence=0.92, recommendation="DISQUALIFY bidder."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=52.0, risk_level="HIGH",
        critical_issues_count=1, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 20, "PAN": 20, "OEM": 0, "Debarment": 12, "MII": 0}),
        reasons_json=json.dumps(["CRITICAL: Make in India local content below 60% threshold.", "Missing OEM authorization letter."])))
    db.commit()


# ===========================================================================
# BIDDER DETAILS SEEDERS — TENDER 1
# ===========================================================================

def _clear_bidder_children(db: Session, bidder_id: str):
    db.query(Document).filter(Document.bidder_id == bidder_id).delete()
    db.query(VerificationRecord).filter(VerificationRecord.bidder_id == bidder_id).delete()
    db.query(VerificationCheck).filter(VerificationCheck.bidder_id == bidder_id).delete()
    db.query(ComplianceRuleResult).filter(ComplianceRuleResult.bidder_id == bidder_id).delete()
    db.query(AIFinding).filter(AIFinding.bidder_id == bidder_id).delete()
    db.query(RiskAssessment).filter(RiskAssessment.bidder_id == bidder_id).delete()
    db.commit()


def _seed_bidder1(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)

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
    d3 = Document(id="DOC-A-STARTUP", bidder_id=b.id, file_name="DIPP_Startup_India_Certificate.pdf",
        file_path="/mock_docs/DIPP_Startup_India_Certificate.pdf", file_size=650000,
        classified_type="Startup India Certificate", doc_type="Startup India Certificate",
        classification_confidence=0.98, status="CONFIRMED",
        extracted_fields=json.dumps({"dipp_number": "DIPP99281", "recognition_status": "RECOGNIZED"}),
        confirmed_fields=json.dumps({"dipp_number": "DIPP99281", "recognition_status": "RECOGNIZED"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d4 = Document(id="DOC-A-NSIC", bidder_id=b.id, file_name="NSIC_GP_Registration_Certificate.pdf",
        file_path="/mock_docs/NSIC_GP_Registration_Certificate.pdf", file_size=720000,
        classified_type="NSIC Certificate", doc_type="NSIC Certificate",
        classification_confidence=0.97, status="CONFIRMED",
        extracted_fields=json.dumps({"nsic_certificate_no": "NSIC/GP/MUM/2024/0091823", "valid_till": "2028-12-31", "monetary_limit": "INR 50 Lakhs"}),
        confirmed_fields=json.dumps({"nsic_certificate_no": "NSIC/GP/MUM/2024/0091823", "valid_till": "2028-12-31", "monetary_limit": "INR 50 Lakhs"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d5 = Document(id="DOC-A-EPFO", bidder_id=b.id, file_name="EPFO_Challan_Receipt_AY_2026.pdf",
        file_path="/mock_docs/EPFO_Challan_Receipt_AY_2026.pdf", file_size=580000,
        classified_type="EPFO Compliance", doc_type="EPFO Compliance",
        classification_confidence=0.96, status="CONFIRMED",
        extracted_fields=json.dumps({"epfo_id": "MH/BAN/0012345/000", "compliance_flag": "COMPLIANT"}),
        confirmed_fields=json.dumps({"epfo_id": "MH/BAN/0012345/000", "compliance_flag": "COMPLIANT"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))

    db.add_all([d1, d2, d3, d4, d5])
    db.commit()

    db.add_all([
        ExtractedEntity(document_id=d1.id, entity_key="gstin", entity_value="27ABCDE1234F1Z5", confidence=0.99, page_number=1),
        ExtractedEntity(document_id=d1.id, entity_key="legal_name", entity_value="ABC Industrial Solutions Pvt. Ltd.", confidence=0.99, page_number=1),
        ExtractedEntity(document_id=d2.id, entity_key="oem_name", entity_value="Suraksha Global Safety Corp", confidence=0.98, page_number=1),
        ExtractedEntity(document_id=d2.id, entity_key="issue_date", entity_value="2023-05-10", confidence=0.98, page_number=1),
        ExtractedEntity(document_id=d2.id, entity_key="expiry_date", entity_value="2027-12-31", confidence=0.98, page_number=1),
        ExtractedEntity(document_id=d3.id, entity_key="dipp_number", entity_value="DIPP99281", confidence=0.98, page_number=1),
        ExtractedEntity(document_id=d4.id, entity_key="nsic_certificate_no", entity_value="NSIC/GP/MUM/2024/0091823", confidence=0.98, page_number=1),
        ExtractedEntity(document_id=d5.id, entity_key="epfo_id", entity_value="MH/BAN/0012345/000", confidence=0.98, page_number=1),
    ])

    db.add_all([
        VerificationRecord(id=f"VR-GST-{b.id}", bidder_id=b.id, source="GST", query_key=b.gstin, status="VERIFIED",
            submitted_value=b.gstin, government_record_json=json.dumps({"legal_name": b.company_name, "status": "ACTIVE", "filing_status": "UP_TO_DATE"}),
            reference_id="MOCK-GST-1Z5"),
        VerificationRecord(id=f"VR-PAN-{b.id}", bidder_id=b.id, source="PAN", query_key=b.pan, status="VERIFIED",
            submitted_value=b.pan, government_record_json=json.dumps({"name": b.company_name, "status": "VALID"}),
            reference_id="MOCK-PAN-ABCDE"),
        VerificationRecord(id=f"VR-DEB-{b.id}", bidder_id=b.id, source="Debarment DB", query_key=b.company_name, status="VERIFIED",
            submitted_value=b.company_name, government_record_json=json.dumps({"debarment_found": False, "message": "Clean"}),
            reference_id="MOCK-DEBAR-CLEAN"),
        VerificationRecord(id=f"VR-OEM-{b.id}", bidder_id=b.id, source="OEM Registry", query_key=b.company_name, status="VERIFIED",
            submitted_value=b.company_name, government_record_json=json.dumps({"oem_name": "Suraksha Global Safety Corp", "status": "VERIFIED"}),
            reference_id="MOCK-OEM-9912"),
        VerificationRecord(id=f"VR-STARTUP-{b.id}", bidder_id=b.id, source="Startup India", query_key=b.pan, status="VERIFIED",
            submitted_value=b.pan, government_record_json=json.dumps({"dipp_number": "DIPP99281", "recognition_status": "RECOGNIZED", "sectors": ["Manufacturing", "Safety Solutions"]}),
            reference_id="MOCK-DPIIT-99281"),
        VerificationRecord(id=f"VR-NSIC-{b.id}", bidder_id=b.id, source="NSIC", query_key=b.pan, status="VERIFIED",
            submitted_value=b.pan, government_record_json=json.dumps({"nsic_certificate_no": "NSIC/GP/MUM/2024/0091823", "category": "Micro", "valid_till": "2028-12-31", "monetary_limit": "INR 50 Lakhs"}),
            reference_id="MOCK-NSIC-0091823"),
        VerificationRecord(id=f"VR-EPFO-{b.id}", bidder_id=b.id, source="EPFO", query_key=b.pan, status="VERIFIED",
            submitted_value=b.pan, government_record_json=json.dumps({"compliance_flag": "COMPLIANT", "epfo_id": "MH/BAN/0012345/000", "active_members_count": 142, "dues_pending": "NIL"}),
            reference_id="MOCK-EPFO-12345"),
    ])

    db.add_all([
        VerificationCheck(id=f"CHK-EX-GST-{b.id}", bidder_id=b.id, check_type="EXACT", module="GSTIN_VALIDITY", result="PASS",
            reason=f"GSTIN '{b.gstin}' active on GST portal and GSTR-3B filings up to date",
            source_fields=json.dumps({"doc_gstin": b.gstin, "registry_status": "ACTIVE"})),
        VerificationCheck(id=f"CHK-EX-PAN-{b.id}", bidder_id=b.id, check_type="EXACT", module="PAN_MATCH", result="PASS",
            reason=f"PAN '{b.pan}' matches legal entity name on Income Tax registry",
            source_fields=json.dumps({"pan": b.pan, "registry_name": b.company_name})),
        VerificationCheck(id=f"CHK-FZ-DEB-{b.id}", bidder_id=b.id, check_type="FUZZY", module="BLACKLIST_MATCH", result="PASS",
            reason="Bidder name has zero fuzzy similarity to blacklisted entities on CPPP/GeM",
            source_fields=json.dumps({"company_name": b.company_name, "max_similarity": 0.12})),
        VerificationCheck(id=f"CHK-CR-OEM-{b.id}", bidder_id=b.id, check_type="CORRELATION", module="OEM_DATE_CORRELATION", result="PASS",
            reason="OEM Authorization issue date (2023-05-10) is consistent with company incorporation (2015-03-10)",
            source_fields=json.dumps({"oem_issue_date": "2023-05-10", "incorporation_date": "2015-03-10"})),
        VerificationCheck(id=f"CHK-EX-STARTUP-{b.id}", bidder_id=b.id, check_type="EXACT", module="STARTUP_INDIA_STATUS", result="PASS",
            reason="Startup India recognized under DIPP Number DIPP99281 (sectors: Manufacturing, Safety Solutions)",
            source_fields=json.dumps({"claims_startup": True, "dipp_number": "DIPP99281", "status": "RECOGNIZED"})),
        VerificationCheck(id=f"CHK-EX-NSIC-{b.id}", bidder_id=b.id, check_type="EXACT", module="NSIC_REGISTRATION", result="PASS",
            reason="NSIC GP Registration active (Cert No: NSIC/GP/MUM/2024/0091823, limit: INR 50 Lakhs)",
            source_fields=json.dumps({"nsic_registered": True, "cert_no": "NSIC/GP/MUM/2024/0091823", "limit": "INR 50 Lakhs"})),
        VerificationCheck(id=f"CHK-EX-EPFO-{b.id}", bidder_id=b.id, check_type="EXACT", module="EPFO_COMPLIANCE", result="PASS",
            reason="EPFO/ESIC compliance verified — no adverse flag",
            source_fields=json.dumps({"compliance_flag": "COMPLIANT"})),
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
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-STARTUP-001", requirement_title="Startup India Recognition Certificate",
            status="VERIFIED", extracted_value="DIPP99281", verified_value="RECOGNIZED",
            verification_source="Startup India", confidence=0.98, evidence_doc_id=d3.id, evidence_file_name=d3.file_name,
            rule_explanation="Active DPIIT recognition certificate present on central registry."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-NSIC-001", requirement_title="NSIC Registration Certificate",
            status="VERIFIED", extracted_value="NSIC/GP/MUM/2024/0091823", verified_value="VERIFIED",
            verification_source="NSIC", confidence=0.97, evidence_doc_id=d4.id, evidence_file_name=d4.file_name,
            rule_explanation="Active NSIC registration matches legal entity details."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-EPFO-001", requirement_title="EPFO/ESIC Compliance",
            status="VERIFIED", extracted_value="MH/BAN/0012345/000", verified_value="COMPLIANT",
            verification_source="EPFO", confidence=0.96, evidence_doc_id=d5.id, evidence_file_name=d5.file_name,
            rule_explanation="EPFO clearance check returned green compliance flag status."),
    ])

    db.add(AIFinding(bidder_id=b.id, title="Verified: Full Eligibility Compliant",
        severity="VERIFIED", description="All mandatory checks pass. No blacklist match. OEM letter date consistent with incorporation.",
        document_value="All Clear", verified_value="All Clear", source="GeM Verification Engine",
        confidence=0.99, recommendation="Recommended for Technical Qualification."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=98.0, risk_level="LOW",
        critical_issues_count=0, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 15, "PAN": 10, "OEM": 20, "Debarment": 10, "ITR": 15, "MII": 15, "Tech": 8, "Udyam": 5}),
        reasons_json=json.dumps(["All mandatory documents valid and verified. No anomalies detected."])))

    db.query(OfficerDecision).filter(OfficerDecision.bidder_id == b.id).delete()
    db.add(OfficerDecision(
        bidder_id=b.id, officer_email="procurement.officer@demo.gov.in",
        decision="QUALIFIED", remarks="All documentary evidence validated against government databases.",
        ai_recommendation="RECOMMEND_QUALIFIED"
    ))
    db.commit()


def _seed_bidder2(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)

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
        VerificationRecord(id=f"VR-GST-{b.id}", bidder_id=b.id, source="GST", query_key=b.gstin, status="VERIFIED",
            submitted_value=b.gstin, government_record_json=json.dumps({"legal_name": "Nova Safety Systems Private Limited", "status": "ACTIVE"}),
            reference_id="MOCK-GST-1Z9"),
        VerificationRecord(id=f"VR-OEM-{b.id}", bidder_id=b.id, source="OEM Registry", query_key=b.company_name, status="VERIFIED",
            submitted_value=b.company_name, government_record_json=json.dumps({"oem_name": "ShieldTech Safety Systems", "status": "VERIFIED", "valid_until": "2026-10-15"}),
            reference_id="MOCK-OEM-4410"),
    ])

    db.add_all([
        VerificationCheck(id=f"CHK-EX-GST-{b.id}", bidder_id=b.id, check_type="EXACT", module="GSTIN_VALIDITY", result="FLAGGED",
            reason="Legal name variation: GST portal lists 'Nova Safety Systems Private Limited' vs submitted 'Nova Safety Systems Pvt. Ltd.'",
            source_fields=json.dumps({"doc_gstin": b.gstin, "registry_name": "Nova Safety Systems Private Limited", "submitted_name": b.company_name})),
        VerificationCheck(id=f"CHK-CR-OEM-{b.id}", bidder_id=b.id, check_type="CORRELATION", module="OEM_EXPIRY", result="FLAGGED",
            reason="OEM Authorization letter expires on 2026-10-15 (within 45 days of bid submission deadline)",
            source_fields=json.dumps({"expiry_date": "2026-10-15", "tender_deadline": "2026-09-30"})),
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

    db.add(AIFinding(bidder_id=b.id, title="MEDIUM: GST Legal Name Variation + OEM Near Expiry",
        severity="MEDIUM", description="Submitted company name differs from GST portal record. OEM authorization expires shortly.",
        document_value="Nova Safety Systems Pvt. Ltd.", verified_value="Nova Safety Systems Private Limited",
        source="GST + OEM Registry", confidence=0.93, recommendation="Request official name consistency affidavit and renewed OEM commitment letter."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=72.0, risk_level="MEDIUM",
        critical_issues_count=0, medium_issues_count=2,
        score_breakdown_json=json.dumps({"GST": 11, "PAN": 10, "OEM": 14, "Debarment": 10, "ITR": 15, "MII": 13, "Udyam": 9}),
        reasons_json=json.dumps(["Minor legal name variation in GST certificate.", "OEM Authorization nearing expiry."])))
    db.commit()


def _seed_bidder3(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)

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
        extracted_fields=json.dumps({"issuing_entity": "TechGuard Supplies India", "authorized_entity": "Alpha Tech Enterprises", "product_category": "Safety Equipment", "issue_date": "2019-03-01", "expiry_date": "2027-03-01", "signature_present": True}),
        confirmed_fields=json.dumps({"issuing_entity": "TechGuard Supplies India", "authorized_entity": "Alpha Tech Enterprises", "product_category": "Safety Equipment", "issue_date": "2019-03-01", "expiry_date": "2027-03-01", "signature_present": True}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add_all([d1, d2])
    db.commit()

    db.add(VerificationCheck(id=f"CHK-CR-OEM-{b.id}", bidder_id=b.id, check_type="CORRELATION", module="OEM_DATE_CORRELATION", result="FAIL",
        reason="CRITICAL ANOMALY: OEM authorization issue date (2019-03-01) is 18 months BEFORE MCA21 incorporation date (2020-09-15)",
        source_fields=json.dumps({"oem_issue_date": "2019-03-01", "incorporation_date": "2020-09-15"})))

    db.add(ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-OEM-001", requirement_title="OEM Authorization",
        status="FAILED", extracted_value="Issue date: 2019-03-01", verified_value="Incorporation: 2020-09-15",
        verification_source="MCA21 Correlation", confidence=0.97, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
        rule_explanation="CRITICAL FRAUD SIGNAL: OEM letter (2019-03-01) predates company incorporation (2020-09-15). Document cannot be genuine."))

    db.add(AIFinding(bidder_id=b.id, title="HIGH RISK: OEM Letter Pre-dates Company Incorporation",
        severity="CRITICAL",
        description="OEM Authorization letter issue date (2019-03-01) is 18 months BEFORE the company's MCA21 incorporation date (2020-09-15). This indicates backdated forgery.",
        document_value="OEM Issue Date: 2019-03-01", verified_value="Incorporation Date: 2020-09-15",
        source="Track C — Cross-Document Correlation (MCA21)", confidence=0.97,
        recommendation="REJECT. Document predates entity existence. Escalate for vigilance review."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=61.0, risk_level="HIGH",
        critical_issues_count=1, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 12, "PAN": 10, "OEM": 0, "Debarment": 10, "ITR": 15, "MII": 10, "Correlation": 0}),
        reasons_json=json.dumps(["CRITICAL: OEM letter issue date predates MCA21 incorporation date — document forgery signal."])))
    db.commit()


def _seed_bidder4(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)
    d1 = Document(id="DOC-D-GST", bidder_id=b.id, file_name="Prime_GST_Cert_Provisional.pdf",
        file_path="/mock_docs/Prime_GST_Cert_Provisional.pdf", file_size=880000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.96, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "27PRIME5432M1Z2", "legal_name": "Prime Industrial Technologies", "filing_status": "DEFECTIVE_FILING", "certificate_date": "2025-01-10"}),
        confirmed_fields=json.dumps({"gstin": "27PRIME5432M1Z2", "legal_name": "Prime Industrial Technologies", "filing_status": "DEFECTIVE_FILING", "certificate_date": "2025-01-10"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add(d1)
    db.commit()

    db.add(VerificationCheck(id=f"CHK-FZ-DEB-{b.id}", bidder_id=b.id, check_type="FUZZY", module="BLACKLIST_MATCH", result="FAIL",
        reason="Bidder name is a 100% match to 'PRIME INDUSTRIAL TECHNOLOGIES' debarred by Ministry of Heavy Industries",
        source_fields=json.dumps({"company_name": b.company_name, "debarred_entity": "PRIME INDUSTRIAL TECHNOLOGIES"})))

    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-DEBAR-001", requirement_title="Non-Blacklisting",
            status="FAILED", extracted_value="Prime Industrial Technologies",
            verified_value="FLAGGED — 100% match to debarred entity",
            verification_source="Debarment DB (Fuzzy)", confidence=0.99,
            rule_explanation="Bidder name matches 'PRIME INDUSTRIAL TECHNOLOGIES' debarred until 2028-05-10."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-GST-001", requirement_title="GST Registration",
            status="FAILED", extracted_value="DEFECTIVE_FILING",
            verified_value="GST filing status: DEFECTIVE",
            verification_source="GST", confidence=0.97, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="GST filing status is DEFECTIVE_FILING — bidder is a non-compliant filer."),
    ])

    db.add(AIFinding(bidder_id=b.id, title="HIGH RISK: Near-Match to Debarred Entity",
        severity="CRITICAL", description="Bidder name matches blacklisted entity debarred by Ministry of Heavy Industries.",
        document_value=b.company_name, verified_value="Debarred: PRIME INDUSTRIAL TECHNOLOGIES",
        source="Track B — Fuzzy Blacklist", confidence=0.99, recommendation="REJECT. Cross-reference debarment order."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=55.0, risk_level="HIGH",
        critical_issues_count=2, medium_issues_count=1,
        score_breakdown_json=json.dumps({"GST": 5, "PAN": 10, "OEM": 0, "Debarment": 0, "ITR": 15, "MII": 0, "Fuzzy": 0}),
        reasons_json=json.dumps(["CRITICAL: Fuzzy match to debarred entity.", "GST filing status DEFECTIVE."])))
    db.commit()


def _seed_bidder5(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)
    d1 = Document(id="DOC-E-GST", bidder_id=b.id, file_name="Radiant_GST_Certificate.pdf",
        file_path="/mock_docs/Radiant_GST_Certificate.pdf", file_size=760000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.95, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "07RADNT6789R1ZA", "legal_name": "Radiant Procurement Solutions Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-10"}),
        confirmed_fields=json.dumps({"gstin": "07RADNT6789R1ZA", "legal_name": "Radiant Procurement Solutions Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-10"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add(d1)
    db.commit()

    db.add(VerificationCheck(id=f"CHK-FZ-DEB-{b.id}", bidder_id=b.id, check_type="FUZZY", module="BLACKLIST_MATCH", result="FAIL",
        reason="Bidder name scores above Jaro-Winkler 0.85 against debarred entity 'RADIANT PROCUREMENT SOLUTIONS' (cartel bidding, MoF)",
        source_fields=json.dumps({"company_name": b.company_name, "debarred_entity": "RADIANT PROCUREMENT SOLUTIONS"})))

    db.add(ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-DEBAR-001", requirement_title="Non-Blacklisting",
        status="FAILED", extracted_value="Radiant Procurement Solutions Pvt. Ltd.",
        verified_value="FLAGGED — near-match to debarred entity",
        verification_source="Debarment DB (Fuzzy)", confidence=0.92,
        rule_explanation="Bidder name matches debarred entity 'RADIANT PROCUREMENT SOLUTIONS' (cartel bidding)."))

    db.add(AIFinding(bidder_id=b.id, title="CRITICAL: Blacklist Fuzzy Match (Cartel Bidding)",
        severity="CRITICAL", description="Fuzzy match to debarred entity 'RADIANT PROCUREMENT SOLUTIONS' on MoF blacklist.",
        document_value=b.company_name, verified_value="Debarred Entity Match",
        source="Track B (Fuzzy)", confidence=0.96, recommendation="REJECT immediately."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=42.0, risk_level="HIGH",
        critical_issues_count=2, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 10, "PAN": 10, "OEM": 0, "Debarment": 0, "ITR": 15, "MII": 0, "Fuzzy": 0}),
        reasons_json=json.dumps(["CRITICAL: Fuzzy name match to debarred entity (Track B)."])))
    db.commit()


def _seed_bidder6(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)

    d1 = Document(id="DOC-F-GST", bidder_id=b.id, file_name="Zenith_GST_Certificate.pdf",
        file_path="/mock_docs/Zenith_GST_Certificate.pdf", file_size=820000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.98, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "27ZENIT1234E1Z0", "legal_name": "Zenith Safety Equipment Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-01"}),
        confirmed_fields=json.dumps({"gstin": "27ZENIT1234E1Z0", "legal_name": "Zenith Safety Equipment Pvt. Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-08-01"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))

    d2 = Document(id="DOC-F-OEM", bidder_id=b.id, file_name="OEM_Authorization_Zenith.pdf",
        file_path="/mock_docs/OEM_Authorization_Zenith.pdf", file_size=740000,
        classified_type="OEM Authorization", doc_type="OEM_AUTH_LETTER",
        classification_confidence=0.96, status="CONFIRMED",
        extracted_fields=json.dumps({"issuing_entity": "Suraksha Global Safety Corp", "authorized_entity": "Zenith Safety Equipment Pvt. Ltd.", "product_category": "Safety Equipment", "issue_date": "2024-02-15", "expiry_date": "2028-12-31", "signature_present": True}),
        confirmed_fields=json.dumps({"issuing_entity": "Suraksha Global Safety Corp", "authorized_entity": "Zenith Safety Equipment Pvt. Ltd.", "product_category": "Safety Equipment", "issue_date": "2024-02-15", "expiry_date": "2028-12-31", "signature_present": True}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    
    db.add_all([d1, d2])
    db.commit()

    db.add_all([
        VerificationCheck(id=f"CHK-EX-GST-{b.id}", bidder_id=b.id, check_type="EXACT", module="GSTIN_VALIDITY", result="PASS",
            reason=f"GSTIN '{b.gstin}' active on GST portal and GSTR-3B filings up to date",
            source_fields=json.dumps({"doc_gstin": b.gstin, "registry_status": "ACTIVE"})),
        VerificationCheck(id=f"CHK-EX-PAN-{b.id}", bidder_id=b.id, check_type="EXACT", module="PAN_MATCH", result="PASS",
            reason=f"PAN '{b.pan}' matches legal entity name on Income Tax registry",
            source_fields=json.dumps({"pan": b.pan, "registry_name": b.company_name})),
    ])

    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-GST-001", requirement_title="GST Registration",
            status="VERIFIED", extracted_value="27ZENIT1234E1Z0", verified_value="Active",
            verification_source="GST", confidence=0.98, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="GSTIN active and legal name matches submission exactly."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-OEM-001", requirement_title="OEM Manufacturer Authorization",
            status="VERIFIED", extracted_value="Valid till 2028-12-31", verified_value="VERIFIED",
            verification_source="OEM Registry", confidence=0.96, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
            rule_explanation="Valid OEM authorization. Issue date after incorporation — consistent."),
    ])

    db.add(AIFinding(bidder_id=b.id, title="Verified: Fully Compliant",
        severity="VERIFIED", description="Zenith satisfies all criteria with no deviations or risk markers.",
        document_value=b.company_name, verified_value="Fully Compliant",
        source="Evaluation Module", confidence=0.97, recommendation="QUALIFY bidder."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=92.0, risk_level="LOW",
        critical_issues_count=0, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 15, "PAN": 15, "OEM": 15, "Debarment": 15, "ITR": 12, "MII": 10, "Fuzzy": 10}),
        reasons_json=json.dumps(["All checks passed.", "Document signatures verified."])))
    db.commit()


# ===========================================================================
# BIDDER DETAILS SEEDERS — TENDER 2 (Medical Equipment)
# ===========================================================================

def _seed_bidder_med1(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)

    d1 = Document(id="DOC-MED1-GST", bidder_id=b.id, file_name="MedTech_GST_Certificate.pdf",
        file_path="/mock_docs/MedTech_GST_Certificate.pdf", file_size=920000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.99, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "27MEDTC1234A1Z5", "legal_name": "MedTech Precision Diagnostics Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-07-15"}),
        confirmed_fields=json.dumps({"gstin": "27MEDTC1234A1Z5", "legal_name": "MedTech Precision Diagnostics Ltd.", "filing_status": "UP_TO_DATE", "certificate_date": "2026-07-15"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d2 = Document(id="DOC-MED1-CDSCO", bidder_id=b.id, file_name="CDSCO_License_MD15_MedTech.pdf",
        file_path="/mock_docs/CDSCO_License_MD15_MedTech.pdf", file_size=1250000,
        classified_type="CDSCO Regulatory License", doc_type="REGULATORY_LICENSE",
        classification_confidence=0.98, status="CONFIRMED",
        extracted_fields=json.dumps({"license_no": "MD-15-MH-2024-00412", "entity_name": "MedTech Precision Diagnostics Ltd.", "device_category": "Class C & D Medical Devices", "valid_until": "2029-05-31", "issuing_authority": "Central Drugs Standard Control Organisation (CDSCO)"}),
        confirmed_fields=json.dumps({"license_no": "MD-15-MH-2024-00412", "entity_name": "MedTech Precision Diagnostics Ltd.", "device_category": "Class C & D Medical Devices", "valid_until": "2029-05-31", "issuing_authority": "Central Drugs Standard Control Organisation (CDSCO)"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d3 = Document(id="DOC-MED1-OEM", bidder_id=b.id, file_name="Siemens_OEM_Authorization_2026.pdf",
        file_path="/mock_docs/Siemens_OEM_Authorization_2026.pdf", file_size=880000,
        classified_type="OEM Authorization Letter", doc_type="OEM_AUTH_LETTER",
        classification_confidence=0.97, status="CONFIRMED",
        extracted_fields=json.dumps({"issuing_entity": "Siemens Healthineers Bharat Corp", "authorized_bidder": "MedTech Precision Diagnostics Ltd.", "auth_letter_no": "OEM-MED-2026-8812", "valid_until": "2028-12-31", "cmc_warranty_included": True}),
        confirmed_fields=json.dumps({"issuing_entity": "Siemens Healthineers Bharat Corp", "authorized_bidder": "MedTech Precision Diagnostics Ltd.", "auth_letter_no": "OEM-MED-2026-8812", "valid_until": "2028-12-31", "cmc_warranty_included": True}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add_all([d1, d2, d3])
    db.commit()

    db.add_all([
        ExtractedEntity(document_id=d1.id, entity_key="gstin", entity_value="27MEDTC1234A1Z5", confidence=0.99, page_number=1),
        ExtractedEntity(document_id=d2.id, entity_key="license_no", entity_value="MD-15-MH-2024-00412", confidence=0.98, page_number=1),
        ExtractedEntity(document_id=d3.id, entity_key="oem_auth_no", entity_value="OEM-MED-2026-8812", confidence=0.97, page_number=1),
    ])

    db.add_all([
        VerificationRecord(id=f"VR-GST-{b.id}", bidder_id=b.id, source="GST", query_key=b.gstin, status="VERIFIED",
            submitted_value=b.gstin, government_record_json=json.dumps({"legal_name": b.company_name, "status": "ACTIVE", "filing_status": "UP_TO_DATE"}),
            reference_id="MOCK-GST-MEDTC"),
        VerificationRecord(id=f"VR-PAN-{b.id}", bidder_id=b.id, source="PAN", query_key=b.pan, status="VERIFIED",
            submitted_value=b.pan, government_record_json=json.dumps({"name": b.company_name, "status": "VALID"}),
            reference_id="MOCK-PAN-MEDTC"),
        VerificationRecord(id=f"VR-OEM-{b.id}", bidder_id=b.id, source="OEM Registry", query_key=b.company_name, status="VERIFIED",
            submitted_value=b.company_name, government_record_json=json.dumps({"oem_name": "Siemens Healthineers Bharat Corp", "status": "VERIFIED", "valid_until": "2028-12-31"}),
            reference_id="MOCK-OEM-8812"),
        VerificationRecord(id=f"VR-DEB-{b.id}", bidder_id=b.id, source="Debarment DB", query_key=b.company_name, status="VERIFIED",
            submitted_value=b.company_name, government_record_json=json.dumps({"debarment_found": False, "message": "Clean"}),
            reference_id="MOCK-DEBAR-CLEAN"),
    ])

    db.add_all([
        VerificationCheck(id=f"CHK-EX-GST-{b.id}", bidder_id=b.id, check_type="EXACT", module="GSTIN_VALIDITY", result="PASS",
            reason="GSTIN active on portal, all tax filings regular and verified",
            source_fields=json.dumps({"doc_gstin": b.gstin, "registry_status": "ACTIVE"})),
        VerificationCheck(id=f"CHK-EX-CDSCO-{b.id}", bidder_id=b.id, check_type="EXACT", module="CDSCO_REGULATORY", result="PASS",
            reason="Valid Form MD-15 Medical Device license confirmed through CDSCO central portal (valid until 2029-05-31)",
            source_fields=json.dumps({"license_no": "MD-15-MH-2024-00412", "valid_until": "2029-05-31"})),
        VerificationCheck(id=f"CHK-CR-OEM-{b.id}", bidder_id=b.id, check_type="CORRELATION", module="OEM_DATE_CORRELATION", result="PASS",
            reason="OEM Authorization letter valid until 2028-12-31 with explicit 5-year onsite warranty commitment",
            source_fields=json.dumps({"oem": "Siemens Healthineers", "expiry": "2028-12-31"})),
        VerificationCheck(id=f"CHK-FZ-DEB-{b.id}", bidder_id=b.id, check_type="FUZZY", module="BLACKLIST_MATCH", result="PASS",
            reason="Clean record on MoHFW and GeM central debarment registers",
            source_fields=json.dumps({"company_name": b.company_name, "match_found": False})),
    ])

    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-MED-GST-001", requirement_title="GST Registration",
            status="VERIFIED", extracted_value=b.gstin, verified_value="Active",
            verification_source="GST", confidence=0.99, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="GSTIN active, legal name matches submission exactly."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-MED-CDSCO-001", requirement_title="CDSCO Medical Device License",
            status="VERIFIED", extracted_value="Form MD-15 (Valid till 2029-05-31)", verified_value="VERIFIED",
            verification_source="CDSCO Registry", confidence=0.98, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
            rule_explanation="Valid Form MD-15 license on file covering high-grade diagnostic imaging equipment."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-MED-OEM-001", requirement_title="OEM Authorization",
            status="VERIFIED", extracted_value="Valid till 2028-12-31 + 5Y CMC", verified_value="VERIFIED",
            verification_source="OEM Registry", confidence=0.97, evidence_doc_id=d3.id, evidence_file_name=d3.file_name,
            rule_explanation="OEM Authorization letter verified with full 5-year CMC warranty backing."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-MED-MII-001", requirement_title="Make in India Local Content",
            status="VERIFIED", extracted_value="68.0% Local Content", verified_value="Pass (>=50%)",
            verification_source="Make in India", confidence=0.96, evidence_doc_id=None, evidence_file_name=None,
            rule_explanation="Class-I Local Supplier claim of 68.0% satisfies minimum 50% threshold."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-MED-DEBAR-001", requirement_title="Non-Blacklisting",
            status="VERIFIED", extracted_value="Clean", verified_value="Clean",
            verification_source="Debarment DB", confidence=0.99, evidence_doc_id=None, evidence_file_name=None,
            rule_explanation="No match found in CPPP / GeM Debarment Watchlist."),
    ])

    db.add(AIFinding(bidder_id=b.id, title="VERIFIED: Complete Regulatory & Clinical Compliance",
        severity="VERIFIED", description="CDSCO Form MD-15 verified with DCGI database. OEM warranty authorization fully backstopped. Zero debarment hits.",
        document_value="All Clear", verified_value="All Clear", source="GeM Health Verification Suite",
        confidence=0.98, recommendation="Recommended for Technical Bid Acceptance."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=95.0, risk_level="LOW",
        critical_issues_count=0, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 15, "PAN": 10, "CDSCO": 25, "OEM": 20, "ISO_13485": 10, "MII": 10, "Debarment": 10}),
        reasons_json=json.dumps(["Full regulatory compliance confirmed across CDSCO and OEM registries."])))

    db.query(OfficerDecision).filter(OfficerDecision.bidder_id == b.id).delete()
    db.add(OfficerDecision(
        bidder_id=b.id, officer_email="procurement.officer@demo.gov.in",
        decision="QUALIFIED", remarks="All regulatory medical certificates verified. CDSCO license MD-15 confirmed genuine.",
        ai_recommendation="RECOMMEND_QUALIFIED"
    ))
    db.commit()


def _seed_bidder_med2(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)

    d1 = Document(id="DOC-MED2-GST", bidder_id=b.id, file_name="ApexHealthcare_GST.pdf",
        file_path="/mock_docs/ApexHealthcare_GST.pdf", file_size=870000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.98, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "29APEXH5678B1Z2", "legal_name": "Apex Healthcare Instruments Pvt. Ltd.", "filing_status": "UP_TO_DATE"}),
        confirmed_fields=json.dumps({"gstin": "29APEXH5678B1Z2", "legal_name": "Apex Healthcare Instruments Pvt. Ltd.", "filing_status": "UP_TO_DATE"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d2 = Document(id="DOC-MED2-OEM", bidder_id=b.id, file_name="Philips_OEM_Letter_Apex.pdf",
        file_path="/mock_docs/Philips_OEM_Letter_Apex.pdf", file_size=740000,
        classified_type="OEM Authorization Letter", doc_type="OEM_AUTH_LETTER",
        classification_confidence=0.95, status="CONFIRMED",
        extracted_fields=json.dumps({"issuing_entity": "Philips Healthcare Diagnostic OEM", "authorized_bidder": "Apex Healthcare Instruments Pvt. Ltd.", "valid_until": "2026-11-30"}),
        confirmed_fields=json.dumps({"issuing_entity": "Philips Healthcare Diagnostic OEM", "authorized_bidder": "Apex Healthcare Instruments Pvt. Ltd.", "valid_until": "2026-11-30"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d3 = Document(id="DOC-MED2-MII", bidder_id=b.id, file_name="Apex_Make_in_India_Declaration.pdf",
        file_path="/mock_docs/Apex_Make_in_India_Declaration.pdf", file_size=610000,
        classified_type="Make in India Declaration", doc_type="MII_DECLARATION",
        classification_confidence=0.94, status="CONFIRMED",
        extracted_fields=json.dumps({"local_content_pct": 48.0, "supplier_class": "Class-II Local Supplier"}),
        confirmed_fields=json.dumps({"local_content_pct": 48.0, "supplier_class": "Class-II Local Supplier"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add_all([d1, d2, d3])
    db.commit()

    db.add_all([
        VerificationRecord(id=f"VR-GST-{b.id}", bidder_id=b.id, source="GST", query_key=b.gstin, status="VERIFIED",
            submitted_value=b.gstin, government_record_json=json.dumps({"legal_name": b.company_name, "status": "ACTIVE"}),
            reference_id="MOCK-GST-APEXH"),
        VerificationRecord(id=f"VR-OEM-{b.id}", bidder_id=b.id, source="OEM Registry", query_key=b.company_name, status="VERIFIED",
            submitted_value=b.company_name, government_record_json=json.dumps({"status": "VERIFIED", "valid_until": "2026-11-30"}),
            reference_id="MOCK-OEM-3391"),
    ])

    db.add_all([
        VerificationCheck(id=f"CHK-EX-MII-{b.id}", bidder_id=b.id, check_type="EXACT", module="LOCAL_CONTENT_THRESHOLD", result="FLAGGED",
            reason="Declared local content is 48.0% (Class-II Supplier) — below 50.0% threshold for Class-I purchase preference",
            source_fields=json.dumps({"declared_local_content": 48.0, "required_threshold": 50.0})),
        VerificationCheck(id=f"CHK-CR-OEM-{b.id}", bidder_id=b.id, check_type="CORRELATION", module="OEM_EXPIRY", result="FLAGGED",
            reason="OEM Authorization letter valid until 2026-11-30 (nearing expiry during installation window)",
            source_fields=json.dumps({"expiry_date": "2026-11-30", "tender_window": "2026-10-15 to 2027-04-15"}))
    ])

    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-MED-MII-001", requirement_title="Make in India Local Content",
            status="REVIEW_REQUIRED", extracted_value="48.0% Local Content", verified_value="Below 50% Class-I Threshold",
            verification_source="Make in India", confidence=0.93, evidence_doc_id=d3.id, evidence_file_name=d3.file_name,
            rule_explanation="Bidder qualifies only as Class-II Local Supplier (48%). May be superseded if Class-I bidders qualify."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-MED-OEM-001", requirement_title="OEM Authorization",
            status="REVIEW_REQUIRED", extracted_value="Expires 2026-11-30", verified_value="Short Expiry Period",
            verification_source="OEM Registry", confidence=0.91, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
            rule_explanation="OEM authorization expires within 45 days after tender deadline. Extension undertaking required."),
    ])

    db.add(AIFinding(bidder_id=b.id, title="MEDIUM RISK: Class-II Local Content (48%) & Short OEM Validity",
        severity="MEDIUM", description="Bidder is Class-II Local Supplier (48.0% local content vs 50% Class-I threshold). OEM authorization expires on 2026-11-30.",
        document_value="48.0% MII / OEM Nov-2026", verified_value="Class-II / Expiry Nearing",
        source="Make in India + OEM Registry", confidence=0.92,
        recommendation="Seek undertaking for OEM letter extension and evaluate Class-I vs Class-II procurement rules."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=74.0, risk_level="MEDIUM",
        critical_issues_count=0, medium_issues_count=2,
        score_breakdown_json=json.dumps({"GST": 15, "PAN": 10, "CDSCO": 20, "OEM": 12, "ISO_13485": 10, "MII": 7, "Debarment": 10}),
        reasons_json=json.dumps(["Local content is 48.0% (Class-II Local Supplier).", "OEM Authorization nearing expiry date."])))
    db.commit()


def _seed_bidder_med3(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)

    d1 = Document(id="DOC-MED3-GST", bidder_id=b.id, file_name="BioShield_GST_Provisional.pdf",
        file_path="/mock_docs/BioShield_GST_Provisional.pdf", file_size=750000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.93, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "07BIOSD9012C1ZX", "legal_name": "BioShield Diagnostics Solutions", "filing_status": "DEFECTIVE_FILING"}),
        confirmed_fields=json.dumps({"gstin": "07BIOSD9012C1ZX", "legal_name": "BioShield Diagnostics Solutions", "filing_status": "DEFECTIVE_FILING"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d2 = Document(id="DOC-MED3-CDSCO", bidder_id=b.id, file_name="CDSCO_Expired_Certificate_BioShield.pdf",
        file_path="/mock_docs/CDSCO_Expired_Certificate_BioShield.pdf", file_size=620000,
        classified_type="CDSCO Regulatory License", doc_type="REGULATORY_LICENSE",
        classification_confidence=0.91, status="CONFIRMED",
        extracted_fields=json.dumps({"license_no": "MD-15-DL-2021-00109", "valid_until": "2024-12-31", "status": "EXPIRED"}),
        confirmed_fields=json.dumps({"license_no": "MD-15-DL-2021-00109", "valid_until": "2024-12-31", "status": "EXPIRED"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add_all([d1, d2])
    db.commit()

    db.add_all([
        VerificationRecord(id=f"VR-GST-{b.id}", bidder_id=b.id, source="GST", query_key=b.gstin, status="FAILED",
            submitted_value=b.gstin, government_record_json=json.dumps({"registration_status": "CANCELLED_PROVISIONAL", "filing_status": "DEFECTIVE_FILING"}),
            reference_id="MOCK-GST-BIOSD"),
        VerificationRecord(id=f"VR-DEB-{b.id}", bidder_id=b.id, source="Debarment DB", query_key=b.company_name, status="FAILED",
            submitted_value=b.company_name, government_record_json=json.dumps({"debarment_found": True, "reason": "Submission of forged CDSCO license", "debarred_until": "2028-07-20"}),
            reference_id="MOCK-DEBAR-MATCH-8891"),
    ])

    db.add_all([
        VerificationCheck(id=f"CHK-FZ-DEB-{b.id}", bidder_id=b.id, check_type="FUZZY", module="BLACKLIST_MATCH", result="FAIL",
            reason="Bidder matches entity 'BIOSHIELD DIAGNOSTICS SOLUTIONS' debarred by Ministry of Health until 2028-07-20",
            source_fields=json.dumps({"matched_entity": "BIOSHIELD DIAGNOSTICS SOLUTIONS", "debarred_until": "2028-07-20"})),
        VerificationCheck(id=f"CHK-EX-CDSCO-{b.id}", bidder_id=b.id, check_type="EXACT", module="CDSCO_REGULATORY", result="FAIL",
            reason="Submitted CDSCO MD-15 license is EXPIRED (expiry date: 2024-12-31). No active license on file.",
            source_fields=json.dumps({"license_no": "MD-15-DL-2021-00109", "expiry": "2024-12-31"})),
        VerificationCheck(id=f"CHK-EX-GST-{b.id}", bidder_id=b.id, check_type="EXACT", module="GSTIN_VALIDITY", result="FAIL",
            reason="GST portal registration status is CANCELLED_PROVISIONAL with DEFECTIVE_FILING flag",
            source_fields=json.dumps({"gstin": b.gstin, "status": "CANCELLED_PROVISIONAL"}))
    ])

    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-MED-DEBAR-001", requirement_title="Non-Blacklisting",
            status="FAILED", extracted_value="BioShield Diagnostics Solutions", verified_value="FLAGGED: Debarred Entity",
            verification_source="Debarment DB", confidence=0.99, evidence_doc_id=None, evidence_file_name=None,
            rule_explanation="Entity blacklisted by Ministry of Health for fraudulent submissions."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-MED-CDSCO-001", requirement_title="CDSCO Medical Device License",
            status="FAILED", extracted_value="Expired: 2024-12-31", verified_value="EXPIRED LICENSE",
            verification_source="CDSCO Registry", confidence=0.96, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
            rule_explanation="CDSCO device license expired over 18 months ago. Entity not authorized to sell medical devices."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-MED-GST-001", requirement_title="GST Registration",
            status="FAILED", extracted_value="CANCELLED_PROVISIONAL", verified_value="Registration Inactive",
            verification_source="GST", confidence=0.95, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="GSTIN registration is cancelled and filing status is defective."),
    ])

    db.add(AIFinding(bidder_id=b.id, title="CRITICAL FRAUD SIGNAL: Debarred Entity & Expired Medical License",
        severity="CRITICAL",
        description="Two critical disqualifications: (1) Match on MoHFW Debarment Watchlist for forged certificates. (2) Submitted CDSCO MD-15 license expired in Dec 2024. Inactive GST.",
        document_value="Expired CDSCO + Defective GST", verified_value="Debarred Watchlist Match",
        source="Debarment DB + CDSCO Registry", confidence=0.99,
        recommendation="REJECT & DISQUALIFY. Immediate referral to vigilance and CPPP compliance registry."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=42.0, risk_level="HIGH",
        critical_issues_count=3, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 0, "PAN": 10, "CDSCO": 0, "OEM": 0, "ISO_13485": 0, "MII": 0, "Debarment": 0}),
        reasons_json=json.dumps(["CRITICAL: Match on CPPP/MoHFW debarment watchlist.", "CRITICAL: Expired CDSCO Medical Device License.", "GSTIN registration cancelled."])))
    db.commit()


# ===========================================================================
# BIDDER DETAILS SEEDERS — TENDER 3 (Cloud & Datacenter)
# ===========================================================================

def _seed_bidder_cloud1(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)

    d1 = Document(id="DOC-CLD1-GST", bidder_id=b.id, file_name="BharatCloud_GST.pdf",
        file_path="/mock_docs/BharatCloud_GST.pdf", file_size=1120000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.99, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "07BHRTC3344D1Z6", "legal_name": "Bharat Cloud Infrastructure Ltd.", "filing_status": "UP_TO_DATE"}),
        confirmed_fields=json.dumps({"gstin": "07BHRTC3344D1Z6", "legal_name": "Bharat Cloud Infrastructure Ltd.", "filing_status": "UP_TO_DATE"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d2 = Document(id="DOC-CLD1-OEM", bidder_id=b.id, file_name="HPE_Tier1_Server_OEM_Auth.pdf",
        file_path="/mock_docs/HPE_Tier1_Server_OEM_Auth.pdf", file_size=940000,
        classified_type="OEM Authorization Letter", doc_type="OEM_AUTH_LETTER",
        classification_confidence=0.98, status="CONFIRMED",
        extracted_fields=json.dumps({"issuing_entity": "Hewlett Packard Enterprise Bharat", "authorized_bidder": "Bharat Cloud Infrastructure Ltd.", "auth_letter_no": "OEM-HPE-2026-7719", "valid_until": "2028-06-30", "tier_level": "Tier-1 Cloud Provider"}),
        confirmed_fields=json.dumps({"issuing_entity": "Hewlett Packard Enterprise Bharat", "authorized_bidder": "Bharat Cloud Infrastructure Ltd.", "auth_letter_no": "OEM-HPE-2026-7719", "valid_until": "2028-06-30", "tier_level": "Tier-1 Cloud Provider"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d3 = Document(id="DOC-CLD1-ISO", bidder_id=b.id, file_name="ISO_27001_Information_Security.pdf",
        file_path="/mock_docs/ISO_27001_Information_Security.pdf", file_size=820000,
        classified_type="Security Certificate", doc_type="SECURITY_CERTIFICATE",
        classification_confidence=0.97, status="CONFIRMED",
        extracted_fields=json.dumps({"certificate_type": "ISO/IEC 27001:2022", "valid_until": "2028-09-30", "scope": "Datacenter Operations, Cloud Hosting & Managed Cyber Security"}),
        confirmed_fields=json.dumps({"certificate_type": "ISO/IEC 27001:2022", "valid_until": "2028-09-30", "scope": "Datacenter Operations, Cloud Hosting & Managed Cyber Security"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add_all([d1, d2, d3])
    db.commit()

    db.add_all([
        VerificationRecord(id=f"VR-GST-{b.id}", bidder_id=b.id, source="GST", query_key=b.gstin, status="VERIFIED",
            submitted_value=b.gstin, government_record_json=json.dumps({"legal_name": b.company_name, "status": "ACTIVE"}),
            reference_id="MOCK-GST-BHRTC"),
        VerificationRecord(id=f"VR-PAN-{b.id}", bidder_id=b.id, source="PAN", query_key=b.pan, status="VERIFIED",
            submitted_value=b.pan, government_record_json=json.dumps({"name": b.company_name, "status": "VALID"}),
            reference_id="MOCK-PAN-BHRTC"),
        VerificationRecord(id=f"VR-OEM-{b.id}", bidder_id=b.id, source="OEM Registry", query_key=b.company_name, status="VERIFIED",
            submitted_value=b.company_name, government_record_json=json.dumps({"oem_name": "Hewlett Packard Enterprise Bharat", "status": "VERIFIED"}),
            reference_id="MOCK-OEM-7719"),
        VerificationRecord(id=f"VR-DEB-{b.id}", bidder_id=b.id, source="Debarment DB", query_key=b.company_name, status="VERIFIED",
            submitted_value=b.company_name, government_record_json=json.dumps({"debarment_found": False, "message": "Clean"}),
            reference_id="MOCK-DEBAR-CLEAN"),
    ])

    db.add_all([
        VerificationCheck(id=f"CHK-EX-GST-{b.id}", bidder_id=b.id, check_type="EXACT", module="GSTIN_VALIDITY", result="PASS",
            reason="GSTIN active and regular monthly filings validated with GST system",
            source_fields=json.dumps({"gstin": b.gstin, "status": "ACTIVE"})),
        VerificationCheck(id=f"CHK-CR-OEM-{b.id}", bidder_id=b.id, check_type="CORRELATION", module="OEM_DATE_CORRELATION", result="PASS",
            reason="Tier-1 HPE OEM Authorization valid until 2028-06-30 with full hardware warranty SLA",
            source_fields=json.dumps({"oem": "HPE", "valid_until": "2028-06-30"})),
        VerificationCheck(id=f"CHK-EX-ISO-{b.id}", bidder_id=b.id, check_type="EXACT", module="ISO_27001_VALIDITY", result="PASS",
            reason="ISO/IEC 27001:2022 InfoSec certificate active, covering NIC datacenter nodes",
            source_fields=json.dumps({"standard": "ISO 27001:2022", "expiry": "2028-09-30"})),
        VerificationCheck(id=f"CHK-FZ-DEB-{b.id}", bidder_id=b.id, check_type="FUZZY", module="BLACKLIST_MATCH", result="PASS",
            reason="Zero matches on CERT-In, MeitY, or CPPP debarment registers",
            source_fields=json.dumps({"company_name": b.company_name, "match_found": False}))
    ])

    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-CLOUD-GST-001", requirement_title="GST Registration",
            status="VERIFIED", extracted_value=b.gstin, verified_value="Active",
            verification_source="GST", confidence=0.99, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="Active GST registration with verified compliance."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-CLOUD-OEM-001", requirement_title="Tier-1 OEM Authorization",
            status="VERIFIED", extracted_value="Tier-1 HPE (Valid till 2028-06-30)", verified_value="VERIFIED",
            verification_source="OEM Registry", confidence=0.98, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
            rule_explanation="Direct Tier-1 server and cloud OEM authorization confirmed."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-CLOUD-ISO-001", requirement_title="ISO 27001 Certification",
            status="VERIFIED", extracted_value="ISO 27001:2022 (Valid till 2028-09-30)", verified_value="VERIFIED",
            verification_source="Document", confidence=0.97, evidence_doc_id=d3.id, evidence_file_name=d3.file_name,
            rule_explanation="Accredited ISO/IEC 27001:2022 certificate for datacenter security."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-CLOUD-MII-001", requirement_title="Make in India Local Content",
            status="VERIFIED", extracted_value="72.0% Local Content", verified_value="Pass (>=50%)",
            verification_source="Make in India", confidence=0.96, evidence_doc_id=None, evidence_file_name=None,
            rule_explanation="Class-I Local Supplier claim (72.0%) exceeds 50% requirement."),
    ])

    db.add(AIFinding(bidder_id=b.id, title="VERIFIED: Tier-1 Architecture & Cyber Security Alignment",
        severity="VERIFIED", description="Full Tier-1 OEM hardware warranty. ISO 27001 accredited. 72% domestic content confirmed.",
        document_value="All Clear", verified_value="All Clear", source="GeM IT Architecture Evaluator",
        confidence=0.99, recommendation="Recommended for Technical Bid Qualification."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=96.0, risk_level="LOW",
        critical_issues_count=0, medium_issues_count=0,
        score_breakdown_json=json.dumps({"GST": 15, "PAN": 10, "OEM": 20, "ISO_27001": 20, "CMMI": 10, "MII": 15, "Debarment": 10}),
        reasons_json=json.dumps(["All technical, cyber security, and financial criteria fully satisfied."])))

    db.query(OfficerDecision).filter(OfficerDecision.bidder_id == b.id).delete()
    db.add(OfficerDecision(
        bidder_id=b.id, officer_email="procurement.officer@demo.gov.in",
        decision="QUALIFIED", remarks="Technical evaluation passed. ISO 27001 and OEM SLA verified.",
        ai_recommendation="RECOMMEND_QUALIFIED"
    ))
    db.commit()


def _seed_bidder_cloud2(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)

    d1 = Document(id="DOC-CLD2-GST", bidder_id=b.id, file_name="NetCore_GST_Certificate.pdf",
        file_path="/mock_docs/NetCore_GST_Certificate.pdf", file_size=980000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.97, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "27NETCR7788E1Z1", "legal_name": "NetCore Cyber Systems Pvt. Ltd.", "filing_status": "UP_TO_DATE"}),
        confirmed_fields=json.dumps({"gstin": "27NETCR7788E1Z1", "legal_name": "NetCore Cyber Systems Pvt. Ltd.", "filing_status": "UP_TO_DATE"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d2 = Document(id="DOC-CLD2-OEM", bidder_id=b.id, file_name="Dell_OEM_Letter_NetCore.pdf",
        file_path="/mock_docs/Dell_OEM_Letter_NetCore.pdf", file_size=890000,
        classified_type="OEM Authorization Letter", doc_type="OEM_AUTH_LETTER",
        classification_confidence=0.96, status="CONFIRMED",
        extracted_fields=json.dumps({"issuing_entity": "Dell Technologies India OEM", "authorized_bidder": "NetCore Cyber Systems Pvt. Ltd.", "valid_until": "2027-03-31"}),
        confirmed_fields=json.dumps({"issuing_entity": "Dell Technologies India OEM", "authorized_bidder": "NetCore Cyber Systems Pvt. Ltd.", "valid_until": "2027-03-31"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add_all([d1, d2])
    db.commit()

    db.add_all([
        VerificationRecord(id=f"VR-GST-{b.id}", bidder_id=b.id, source="GST", query_key=b.gstin, status="VERIFIED",
            submitted_value=b.gstin, government_record_json=json.dumps({"legal_name": b.company_name, "status": "ACTIVE"}),
            reference_id="MOCK-GST-NETCR"),
        VerificationRecord(id=f"VR-OEM-{b.id}", bidder_id=b.id, source="OEM Registry", query_key=b.company_name, status="VERIFIED",
            submitted_value=b.company_name, government_record_json=json.dumps({"oem_name": "Dell Technologies India OEM", "status": "VERIFIED"}),
            reference_id="MOCK-OEM-5521"),
    ])

    db.add_all([
        VerificationCheck(id=f"CHK-EX-GST-{b.id}", bidder_id=b.id, check_type="EXACT", module="GSTIN_VALIDITY", result="FLAGGED",
            reason="GST portal record indicates a 15-day delay in Q2 GSTR-3B tax return filing; currently resolved",
            source_fields=json.dumps({"filing_delay_days": 15, "current_status": "UP_TO_DATE"})),
        VerificationCheck(id=f"CHK-EX-CMMI-{b.id}", bidder_id=b.id, check_type="EXACT", module="CMMI_ASSESSMENT", result="FLAGGED",
            reason="CMMI Maturity Level 3 appraisal is under recertification review (provisional certificate submitted)",
            source_fields=json.dumps({"cmmi_status": "RECERTIFICATION_PENDING"}))
    ])

    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-CLOUD-CMMI-001", requirement_title="CMMI Level 3+ Certification",
            status="REVIEW_REQUIRED", extracted_value="CMMI-DEV v2.0 (Recertification Pending)", verified_value="Provisional Appraisal Letter",
            verification_source="Document", confidence=0.91, evidence_doc_id=None, evidence_file_name=None,
            rule_explanation="Provisional CMMI renewal letter provided. Final appraisal verification pending from SEI Institute."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-CLOUD-GST-001", requirement_title="GST Registration",
            status="REVIEW_REQUIRED", extracted_value="Delayed Filing Note", verified_value="Active (Resolved)",
            verification_source="GST", confidence=0.94, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="Minor compliance flag regarding historical filing delay, though active registration verified."),
    ])

    db.add(AIFinding(bidder_id=b.id, title="MEDIUM: CMMI Level 3 Renewal Pending & Historical GST Filing Note",
        severity="MEDIUM", description="Bidder provided provisional CMMI appraisal renewal documentation. GSTR-3B had a historical 15-day filing gap.",
        document_value="Provisional CMMI / Active GST", verified_value="Provisional Under Review",
        source="SEI Database + GST Registry", confidence=0.92,
        recommendation="Request verified SEI appraisal registration ID before commercial bid opening."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=76.0, risk_level="MEDIUM",
        critical_issues_count=0, medium_issues_count=2,
        score_breakdown_json=json.dumps({"GST": 12, "PAN": 10, "OEM": 18, "ISO_27001": 15, "CMMI": 6, "MII": 15, "Debarment": 10}),
        reasons_json=json.dumps(["Provisional CMMI recertification status requires officer review.", "Minor historical filing delay flag in GST records."])))
    db.commit()


def _seed_bidder_cloud3(db: Session, b: Bidder):
    _clear_bidder_children(db, b.id)

    d1 = Document(id="DOC-CLD3-GST", bidder_id=b.id, file_name="Horizon_GST_Defective.pdf",
        file_path="/mock_docs/Horizon_GST_Defective.pdf", file_size=690000,
        classified_type="GST Certificate", doc_type="TAX_CERTIFICATE",
        classification_confidence=0.92, status="CONFIRMED",
        extracted_fields=json.dumps({"gstin": "24HORIZ2233F1Z9", "legal_name": "Horizon Tech Solutions India", "filing_status": "DEFECTIVE_FILING"}),
        confirmed_fields=json.dumps({"gstin": "24HORIZ2233F1Z9", "legal_name": "Horizon Tech Solutions India", "filing_status": "DEFECTIVE_FILING"}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    d2 = Document(id="DOC-CLD3-MII", bidder_id=b.id, file_name="Horizon_Local_Content_Declaration.pdf",
        file_path="/mock_docs/Horizon_Local_Content_Declaration.pdf", file_size=580000,
        classified_type="Make in India Declaration", doc_type="MII_DECLARATION",
        classification_confidence=0.94, status="CONFIRMED",
        extracted_fields=json.dumps({"local_content_pct": 36.0}),
        confirmed_fields=json.dumps({"local_content_pct": 36.0}),
        confirmed_by="procurement.officer@demo.gov.in", confirmed_at=datetime.now(timezone.utc))
    db.add_all([d1, d2])
    db.commit()

    db.add_all([
        VerificationRecord(id=f"VR-GST-{b.id}", bidder_id=b.id, source="GST", query_key=b.gstin, status="FAILED",
            submitted_value=b.gstin, government_record_json=json.dumps({"registration_status": "SUSPENDED", "filing_status": "DEFECTIVE_FILING"}),
            reference_id="MOCK-GST-HORIZ"),
        VerificationRecord(id=f"VR-DEB-{b.id}", bidder_id=b.id, source="Debarment DB", query_key=b.company_name, status="FAILED",
            submitted_value=b.company_name, government_record_json=json.dumps({"debarment_found": True, "debarred_by": "Ministry of Electronics & IT", "reason": "Default on SLA and security breach penalty"}),
            reference_id="MOCK-DEBAR-MATCH-8891"),
    ])

    db.add_all([
        VerificationCheck(id=f"CHK-FZ-DEB-{b.id}", bidder_id=b.id, check_type="FUZZY", module="BLACKLIST_MATCH", result="FAIL",
            reason="Bidder name matched to 'HORIZON TECH SOLUTIONS INDIA' debarred by MeitY until 2027-08-01 for cloud security default",
            source_fields=json.dumps({"debarred_by": "MeitY", "debarred_until": "2027-08-01"})),
        VerificationCheck(id=f"CHK-EX-GST-{b.id}", bidder_id=b.id, check_type="EXACT", module="GSTIN_VALIDITY", result="FAIL",
            reason="GST registration is SUSPENDED on GSTN portal with ongoing non-compliance inquiry",
            source_fields=json.dumps({"gstin": b.gstin, "status": "SUSPENDED"})),
        VerificationCheck(id=f"CHK-EX-MII-{b.id}", bidder_id=b.id, check_type="EXACT", module="LOCAL_CONTENT_THRESHOLD", result="FAIL",
            reason="Declared local content (36.0%) falls short of mandatory 50.0% Class-I threshold",
            source_fields=json.dumps({"declared_local_content": 36.0, "required": 50.0}))
    ])

    db.add_all([
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-CLOUD-DEBAR-001", requirement_title="Non-Debarment Declaration",
            status="FAILED", extracted_value="Horizon Tech Solutions India", verified_value="FLAGGED: Debarred by MeitY",
            verification_source="Debarment DB", confidence=0.99, evidence_doc_id=None, evidence_file_name=None,
            rule_explanation="Entity blacklisted by Ministry of Electronics & IT until 2027-08-01."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-CLOUD-GST-001", requirement_title="GST Registration",
            status="FAILED", extracted_value="SUSPENDED", verified_value="Registration Suspended",
            verification_source="GST", confidence=0.96, evidence_doc_id=d1.id, evidence_file_name=d1.file_name,
            rule_explanation="GST registration currently suspended by tax authorities."),
        ComplianceRuleResult(bidder_id=b.id, requirement_id="REQ-CLOUD-MII-001", requirement_title="Make in India Local Content",
            status="FAILED", extracted_value="36.0% Local Content", verified_value="Below 50% Threshold",
            verification_source="Make in India", confidence=0.95, evidence_doc_id=d2.id, evidence_file_name=d2.file_name,
            rule_explanation="Domestic content of 36.0% does not qualify for Class-I or Class-II eligibility."),
    ])

    db.add(AIFinding(bidder_id=b.id, title="CRITICAL: Debarred by MeitY & Suspended GSTIN",
        severity="CRITICAL",
        description="Entity listed on MeitY debarment registry for past cloud contract defaults. Current GSTIN is suspended on GST portal. Ineligible local content.",
        document_value="Suspended GST / 36% Local Content", verified_value="Active MeitY Debarment",
        source="MeitY Debarment DB + GSTN", confidence=0.99,
        recommendation="DISQUALIFY immediately. Do not open commercial bid."))

    db.add(RiskAssessment(bidder_id=b.id, compliance_score=46.0, risk_level="HIGH",
        critical_issues_count=2, medium_issues_count=1,
        score_breakdown_json=json.dumps({"GST": 0, "PAN": 10, "OEM": 0, "ISO_27001": 0, "CMMI": 0, "MII": 0, "Debarment": 0}),
        reasons_json=json.dumps(["CRITICAL: Active MeitY debarment record.", "CRITICAL: Suspended GSTIN registration.", "Local content 36.0% fails tender threshold."])))
    db.commit()
