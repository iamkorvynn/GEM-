from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="Procurement Officer")
    department = Column(String, default="Central Procurement Dept")
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Tender(Base):
    __tablename__ = "tenders"

    id = Column(String, primary_key=True, index=True) # e.g. GEM/2026/B/784921
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_date = Column(String, nullable=False)
    deadline = Column(String, nullable=False)
    estimated_cost = Column(String, nullable=True)
    status = Column(String, default="ACTIVE") # ACTIVE, CLOSED, UNDER_EVALUATION
    raw_document_path = Column(String, nullable=True)

    requirements = relationship("Requirement", back_populates="tender", cascade="all, delete-orphan")
    bidders = relationship("Bidder", back_populates="tender", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="tender", cascade="all, delete-orphan")

class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(String, primary_key=True, index=True) # e.g. REQ-GST-001
    tender_id = Column(String, ForeignKey("tenders.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_mandatory = Column(Boolean, default=True)
    evidence_type = Column(String, nullable=False) # e.g. GST Certificate
    verification_source = Column(String, nullable=False) # GST, PAN, Udyam, Debarment DB, etc.
    rule_type = Column(String, nullable=False) # ACTIVE, VALID_DATE, EXACT_MATCH, THRESHOLD
    threshold_value = Column(String, nullable=True) # e.g. 50% for MII
    clause_reference = Column(String, nullable=True)

    tender = relationship("Tender", back_populates="requirements")

class Bidder(Base):
    __tablename__ = "bidders"

    id = Column(String, primary_key=True, index=True) # e.g. BIDDER-A
    tender_id = Column(String, ForeignKey("tenders.id"), nullable=False)
    company_name = Column(String, nullable=False)
    gstin = Column(String, nullable=True)
    pan = Column(String, nullable=True)
    udyam_id = Column(String, nullable=True)
    claims_msme = Column(Boolean, default=False)
    claims_startup = Column(Boolean, default=False)
    local_content_pct = Column(Float, default=0.0)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    compliance_score = Column(Float, default=0.0)
    risk_level = Column(String, default="PENDING") # LOW, MEDIUM, HIGH, CRITICAL, PENDING
    verification_progress = Column(Float, default=0.0) # 0 to 100 %
    overall_status = Column(String, default="PENDING") # VERIFIED, REVIEW_REQUIRED, QUALIFIED, DISQUALIFIED

    tender = relationship("Tender", back_populates="bidders")
    documents = relationship("Document", back_populates="bidder", cascade="all, delete-orphan")
    verification_records = relationship("VerificationRecord", back_populates="bidder", cascade="all, delete-orphan")
    compliance_results = relationship("ComplianceRuleResult", back_populates="bidder", cascade="all, delete-orphan")
    ai_findings = relationship("AIFinding", back_populates="bidder", cascade="all, delete-orphan")
    risk_assessment = relationship("RiskAssessment", back_populates="bidder", uselist=False, cascade="all, delete-orphan")
    officer_decision = relationship("OfficerDecision", back_populates="bidder", uselist=False, cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    bidder_id = Column(String, ForeignKey("bidders.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    checksum = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    classified_type = Column(String, nullable=True)
    classification_confidence = Column(Float, default=0.0)
    status = Column(String, default="UPLOADED")

    bidder = relationship("Bidder", back_populates="documents")
    entities = relationship("ExtractedEntity", back_populates="document", cascade="all, delete-orphan")

class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    entity_key = Column(String, nullable=False)
    entity_value = Column(String, nullable=False)
    confidence = Column(Float, default=1.0)
    page_number = Column(Integer, default=1)
    bbox_json = Column(String, nullable=True)

    document = relationship("Document", back_populates="entities")

class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(String, primary_key=True, index=True)
    bidder_id = Column(String, ForeignKey("bidders.id"), nullable=False)
    source = Column(String, nullable=False)
    query_key = Column(String, nullable=False)
    status = Column(String, nullable=False)
    submitted_value = Column(String, nullable=True)
    government_record_json = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow)
    reference_id = Column(String, nullable=True)
    is_simulated = Column(Boolean, default=True)

    bidder = relationship("Bidder", back_populates="verification_records")

class ComplianceRuleResult(Base):
    __tablename__ = "compliance_results"

    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(String, ForeignKey("bidders.id"), nullable=False)
    requirement_id = Column(String, nullable=False)
    requirement_title = Column(String, nullable=False)
    status = Column(String, nullable=False)
    extracted_value = Column(String, nullable=True)
    verified_value = Column(String, nullable=True)
    verification_source = Column(String, nullable=False)
    confidence = Column(Float, default=1.0)
    evidence_doc_id = Column(String, nullable=True)
    evidence_file_name = Column(String, nullable=True)
    rule_explanation = Column(Text, nullable=True)

    bidder = relationship("Bidder", back_populates="compliance_results")

class AIFinding(Base):
    __tablename__ = "ai_findings"

    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(String, ForeignKey("bidders.id"), nullable=False)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    document_value = Column(String, nullable=True)
    verified_value = Column(String, nullable=True)
    source = Column(String, nullable=True)
    confidence = Column(Float, default=0.95)
    recommendation = Column(Text, nullable=True)
    evidence_doc_id = Column(String, nullable=True)
    evidence_file_name = Column(String, nullable=True)

    bidder = relationship("Bidder", back_populates="ai_findings")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(String, ForeignKey("bidders.id"), nullable=False)
    compliance_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    critical_issues_count = Column(Integer, default=0)
    medium_issues_count = Column(Integer, default=0)
    score_breakdown_json = Column(Text, nullable=False)
    reasons_json = Column(Text, nullable=False)
    evaluated_at = Column(DateTime, default=datetime.utcnow)

    bidder = relationship("Bidder", back_populates="risk_assessment")

class OfficerDecision(Base):
    __tablename__ = "officer_decisions"

    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(String, ForeignKey("bidders.id"), nullable=False)
    officer_email = Column(String, nullable=False)
    decision = Column(String, nullable=False)
    remarks = Column(Text, nullable=False)
    ai_recommendation = Column(String, nullable=False)
    override_justification = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=datetime.utcnow)

    bidder = relationship("Bidder", back_populates="officer_decision")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(String, ForeignKey("tenders.id"), nullable=True)
    bidder_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    actor = Column(String, default="System / Officer")
    source = Column(String, nullable=False)
    result = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    tender = relationship("Tender", back_populates="audit_events")
