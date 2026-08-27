import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import Document, ExtractedEntity, Bidder
from backend.schemas.schemas import DocumentSchema
from backend.services.ocr_extraction_service import OCRAndExtractionService
from backend.services.audit_report_service import AuditAndReportService

router = APIRouter(prefix="/api/documents", tags=["Documents & Upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=DocumentSchema)
async def upload_bidder_document(
    bidder_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
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

    # Automatic Document Classification
    cls_res = OCRAndExtractionService.classify_document(text_sample, file_name)
    doc_type = cls_res["type"]
    confidence = cls_res["confidence"]

    # Extract Entities
    entities_data = OCRAndExtractionService.extract_entities(doc_type, file_name, bidder_preset=bidder.company_name)

    doc = Document(
        id=file_id,
        bidder_id=bidder.id,
        file_name=file_name,
        file_path=file_path,
        file_size=len(contents),
        classified_type=doc_type,
        classification_confidence=confidence,
        status="EXTRACTED"
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
        db, action="DOCUMENT_UPLOADED", source="Document Management",
        result="SUCCESS", details=f"Uploaded '{file_name}'. Classified as '{doc_type}' ({confidence*100:.1f}% confidence).",
        tender_id=bidder.tender_id, bidder_id=bidder.id
    )

    db.refresh(doc)
    return DocumentSchema(
        id=doc.id, bidder_id=doc.bidder_id, file_name=doc.file_name,
        file_path=doc.file_path, file_size=doc.file_size, uploaded_at=doc.uploaded_at,
        classified_type=doc.classified_type, classification_confidence=doc.classification_confidence,
        status=doc.status,
        entities=[
            {
                "id": ent.id, "entity_key": ent.entity_key, "entity_value": ent.entity_value,
                "confidence": ent.confidence, "page_number": ent.page_number, "bbox_json": ent.bbox_json
            } for ent in doc.entities
        ]
    )

@router.get("/bidder/{bidder_id}", response_model=List[DocumentSchema])
def list_bidder_documents(bidder_id: str, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.bidder_id == bidder_id).all()
    return [
        DocumentSchema(
            id=d.id, bidder_id=d.bidder_id, file_name=d.file_name,
            file_path=d.file_path, file_size=d.file_size, uploaded_at=d.uploaded_at,
            classified_type=d.classified_type, classification_confidence=d.classification_confidence,
            status=d.status,
            entities=[
                {
                    "id": ent.id, "entity_key": ent.entity_key, "entity_value": ent.entity_value,
                    "confidence": ent.confidence, "page_number": ent.page_number, "bbox_json": ent.bbox_json
                } for ent in d.entities
            ]
        ) for d in docs
    ]
