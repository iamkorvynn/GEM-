from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    department: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class RequirementSchema(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    is_mandatory: bool
    evidence_type: str
    verification_source: str
    rule_type: str
    threshold_value: Optional[str] = None
    clause_reference: Optional[str] = None

class RequirementCreate(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    is_mandatory: bool = True
    evidence_type: str
    verification_source: str
    rule_type: str = "VALID"
    threshold_value: Optional[str] = None
    clause_reference: Optional[str] = None

class TenderSchema(BaseModel):
    id: str
    title: str
    department: str
    description: Optional[str] = None
    created_date: str
    deadline: str
    estimated_cost: Optional[str] = None
    status: str
    bidders_count: int = 0
    verification_progress: float = 0.0
    requirements: List[RequirementSchema] = []

class TenderCreate(BaseModel):
    id: str
    title: str
    department: str
    description: Optional[str] = None
    deadline: str
    estimated_cost: Optional[str] = None

class ExtractedEntitySchema(BaseModel):
    id: int
    entity_key: str
    entity_value: str
    confidence: float
    page_number: int
    bbox_json: Optional[str] = None

class DocumentSchema(BaseModel):
    id: str
    bidder_id: str
    file_name: str
    file_path: str
    file_size: int
    uploaded_at: datetime
    classified_type: Optional[str] = None
    doc_type: Optional[str] = None
    classification_confidence: float = 0.0
    status: str
    extracted_fields: Optional[Dict[str, Any]] = None
    confirmed_fields: Optional[Dict[str, Any]] = None
    confirmed_by: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    entities: List[ExtractedEntitySchema] = []

class DocumentConfirmRequest(BaseModel):
    confirmed_fields: Dict[str, Any]
    officer_id: str = "procurement.officer@demo.gov.in"

class VerificationRecordSchema(BaseModel):
    id: str
    bidder_id: str
    source: str
    query_key: str
    status: str
    submitted_value: Optional[str] = None
    government_record_json: Optional[str] = None
    verified_at: datetime
    reference_id: Optional[str] = None
    is_simulated: bool = True

# PRD §6.4 — VerificationCheck schema for 3-track engine results
class VerificationCheckSchema(BaseModel):
    id: str
    bidder_id: str
    check_type: str        # EXACT | FUZZY | CORRELATION
    module: str
    result: str            # PASS | FAIL | FLAGGED
    reason: str
    source_fields: Optional[Dict[str, Any]] = None
    checked_at: datetime

class ComplianceResultSchema(BaseModel):
    id: int
    requirement_id: str
    requirement_title: str
    status: str
    extracted_value: Optional[str] = None
    verified_value: Optional[str] = None
    verification_source: str
    confidence: float
    evidence_doc_id: Optional[str] = None
    evidence_file_name: Optional[str] = None
    rule_explanation: Optional[str] = None

class AIFindingSchema(BaseModel):
    id: int
    title: str
    severity: str
    description: str
    document_value: Optional[str] = None
    verified_value: Optional[str] = None
    source: Optional[str] = None
    confidence: float
    recommendation: Optional[str] = None
    evidence_doc_id: Optional[str] = None
    evidence_file_name: Optional[str] = None

class RiskAssessmentSchema(BaseModel):
    compliance_score: float
    risk_level: str
    critical_issues_count: int
    medium_issues_count: int
    score_breakdown: Dict[str, Any]
    reasons: List[str]
    evaluated_at: datetime

class OfficerDecisionSchema(BaseModel):
    officer_email: str
    decision: str
    remarks: str
    ai_recommendation: str
    override_justification: Optional[str] = None
    decided_at: datetime

class OfficerDecisionCreate(BaseModel):
    decision: str  # QUALIFIED, DISQUALIFIED, REQUEST_CLARIFICATION
    remarks: str
    override_justification: Optional[str] = None

class AuditEventSchema(BaseModel):
    id: int
    tender_id: Optional[str] = None
    bidder_id: Optional[str] = None
    action: str
    actor: str
    source: str
    result: str
    details: Optional[str] = None
    timestamp: datetime

class BidderSchema(BaseModel):
    id: str
    tender_id: str
    company_name: str
    gstin: Optional[str] = None
    pan: Optional[str] = None
    udyam_id: Optional[str] = None
    company_type: Optional[str] = None
    incorporation_date: Optional[str] = None
    claims_msme: bool
    claims_startup: bool
    local_content_pct: float
    submitted_at: datetime
    compliance_score: float
    risk_level: str
    verification_progress: float
    overall_status: str
    documents: List[DocumentSchema] = []
    verification_records: List[VerificationRecordSchema] = []
    verification_checks: List[VerificationCheckSchema] = []
    compliance_results: List[ComplianceResultSchema] = []
    ai_findings: List[AIFindingSchema] = []
    risk_assessment: Optional[RiskAssessmentSchema] = None
    officer_decision: Optional[OfficerDecisionSchema] = None

class BidderCreate(BaseModel):
    company_name: str
    pan: str
    gstin: str
    company_type: Optional[str] = "Pvt Ltd"
    tender_id: str
    claims_msme: bool = False
    claims_startup: bool = False
    local_content_pct: float = 0.0

# PRD §5.2 — Per-bidder dashboard with checklist + risk verdict + drill-down
class ChecklistItem(BaseModel):
    module: str
    check_type: str
    result: str            # PASS | FAIL | FLAGGED
    reason: str
    source_fields: Optional[Dict[str, Any]] = None
    checked_at: datetime

class BidderDashboard(BaseModel):
    bidder_id: str
    company_name: str
    risk_level: str        # LOW | MEDIUM | HIGH
    compliance_score: float
    overall_status: str
    checklist: List[ChecklistItem]
    documents_confirmed: bool
    total_checks: int
    pass_count: int
    fail_count: int
    flagged_count: int

class DashboardStats(BaseModel):
    active_tenders: int
    total_bidders: int
    verified_bidders: int
    pending_reviews: int
    high_risk_bidders: int
    compliance_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    verification_progress_pct: float
    recent_activity: List[AuditEventSchema]
