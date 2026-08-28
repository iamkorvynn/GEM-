import os
import json
import uuid
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import Document, ExtractedEntity, Bidder
from backend.schemas.schemas import DocumentSchema, DocumentConfirmRequest
from backend.services.ocr_extraction_service import OCRAndExtractionService
from backend.services.audit_report_service import AuditAndReportService

router = APIRouter(prefix="/api/documents", tags=["Documents & Upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _doc_to_schema(doc: Document) -> DocumentSchema:
    """Convert Document ORM object to DocumentSchema, parsing JSON fields."""
    extracted = None
    if doc.extracted_fields:
        try:
            extracted = json.loads(doc.extracted_fields)
        except Exception:
            extracted = {}
    confirmed = None
    if doc.confirmed_fields:
        try:
            confirmed = json.loads(doc.confirmed_fields)
        except Exception:
            confirmed = {}
    return DocumentSchema(
        id=doc.id, bidder_id=doc.bidder_id, file_name=doc.file_name,
        file_path=doc.file_path, file_size=doc.file_size, uploaded_at=doc.uploaded_at,
        classified_type=doc.classified_type, doc_type=doc.doc_type,
        classification_confidence=doc.classification_confidence,
        status=doc.status,
        extracted_fields=extracted,
        confirmed_fields=confirmed,
        confirmed_by=doc.confirmed_by,
        confirmed_at=doc.confirmed_at,
        entities=[
            {
                "id": ent.id, "entity_key": ent.entity_key, "entity_value": ent.entity_value,
                "confidence": ent.confidence, "page_number": ent.page_number, "bbox_json": ent.bbox_json
            } for ent in doc.entities
        ]
    )


# PRD §7 — POST /bidders/:id/documents
@router.post("/upload", response_model=DocumentSchema)
async def upload_bidder_document(
    bidder_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a document; kicks off OCR+LLM extraction and stores extracted_fields."""
    bidder = db.query(Bidder).filter(Bidder.id == bidder_id).first()
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    file_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    file_name = file.filename
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file_name}")

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    text_sample = contents.decode("utf-8", errors="ignore")

    # Document Classification
    cls_res = OCRAndExtractionService.classify_document(text_sample, file_name)
    doc_type_classified = cls_res["type"]
    confidence = cls_res["confidence"]

    # Map classified type to PRD doc_type enum
    doc_type_prd = _map_to_prd_doc_type(doc_type_classified)

    # Extract Entities — structured JSON per PRD extraction schema
    entities_data = OCRAndExtractionService.extract_entities(
        doc_type_classified, file_name, bidder_preset=bidder.company_name
    )

    # Build extracted_fields dict from entities (PRD extraction schema)
    extracted_fields_dict = {e["entity_key"]: e["entity_value"] for e in entities_data}

    doc = Document(
        id=file_id,
        bidder_id=bidder.id,
        file_name=file_name,
        file_path=file_path,
        file_size=len(contents),
        classified_type=doc_type_classified,
        doc_type=doc_type_prd,
        classification_confidence=confidence,
        status="EXTRACTED",
        extracted_fields=json.dumps(extracted_fields_dict),
        confirmed_fields=None,
        confirmed_by=None,
        confirmed_at=None,
    )
    db.add(doc)
    db.commit()

    for e in entities_data:
        db.add(ExtractedEntity(
            document_id=doc.id,
            entity_key=e["entity_key"],
            entity_value=e["entity_value"],
            confidence=e.get("confidence", 0.95),
            page_number=e.get("page_number", 1),
            bbox_json=e.get("bbox_json")
        ))
    db.commit()

    AuditAndReportService.log_event(
        db, action="UPLOAD",
        source="Document Management",
        result="SUCCESS",
        details=f"Uploaded '{file_name}'. Classified as '{doc_type_classified}' ({confidence*100:.1f}% confidence). Extraction complete — awaiting officer confirmation.",
        tender_id=bidder.tender_id, bidder_id=bidder.id
    )

    db.refresh(doc)
    return _doc_to_schema(doc)


# PRD §7 — GET /documents/:id/extraction
@router.get("/{doc_id}/extraction", response_model=DocumentSchema)
def get_extraction(doc_id: str, db: Session = Depends(get_db)):
    """Poll extracted fields for human confirmation table."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return _doc_to_schema(doc)


# PRD §7 — PATCH /documents/:id/confirm (Human-in-the-loop checkpoint)
@router.patch("/{doc_id}/confirm", response_model=DocumentSchema)
def confirm_fields(doc_id: str, req: DocumentConfirmRequest, db: Session = Depends(get_db)):
    """
    Officer submits corrected/confirmed fields.
    Writes confirmed_fields + confirmed_by + confirmed_at.
    Logs CONFIRM_FIELDS audit event.
    Nothing is verified until this endpoint is called (PRD §9).
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.confirmed_fields = json.dumps(req.confirmed_fields)
    doc.confirmed_by = req.officer_id
    doc.confirmed_at = datetime.utcnow()
    doc.status = "CONFIRMED"
    db.commit()

    bidder = db.query(Bidder).filter(Bidder.id == doc.bidder_id).first()
    AuditAndReportService.log_event(
        db, action="CONFIRM_FIELDS",
        source="Human Officer Interface",
        result="SUCCESS",
        details=f"Officer '{req.officer_id}' confirmed extracted fields for document '{doc.file_name}'. Fields: {list(req.confirmed_fields.keys())}",
        tender_id=bidder.tender_id if bidder else None,
        bidder_id=doc.bidder_id,
        actor=req.officer_id
    )

    db.refresh(doc)
    return _doc_to_schema(doc)


# Existing — list documents by bidder
@router.get("/bidder/{bidder_id}", response_model=List[DocumentSchema])
def list_bidder_documents(bidder_id: str, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.bidder_id == bidder_id).all()
    return [_doc_to_schema(d) for d in docs]


def _map_to_prd_doc_type(classified_type: str) -> str:
    """Map free-text classified_type to PRD doc_type enum."""
    ct = (classified_type or "").upper()
    if "GST" in ct or "TAX" in ct:
        return "TAX_CERTIFICATE"
    if "OEM" in ct or "AUTHORIZ" in ct:
        return "OEM_AUTH_LETTER"
    return classified_type
