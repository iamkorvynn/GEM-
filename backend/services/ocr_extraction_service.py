import re
import json
from typing import Dict, Any, List

class OCRAndExtractionService:
    DOCUMENT_PATTERNS = {
        "GST Certificate": [r"GSTIN", r"Goods and Services Tax", r"Form GST REG-06", r"Registration Certificate"],
        "PAN Card": [r"INCOME TAX DEPARTMENT", r"Permanent Account Number", r"GOVT\. OF INDIA", r"[A-Z]{5}[0-9]{4}[A-Z]{1}"],
        "Udyam Certificate": [r"Udyam Registration Certificate", r"UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}", r"Ministry of Micro, Small and Medium Enterprises"],
        "OEM Authorization": [r"Manufacturer Authorization", r"OEM Authorization", r"Authorized Signatory", r"distribute", r"resell"],
        "ITR Document": [r"INDIAN INCOME TAX RETURN", r"ITR-V", r"Acknowledgement Number", r"Assessment Year"],
        "Make in India Declaration": [r"Make in India", r"Local Content", r"Class-I Local Supplier", r"Class-II Local Supplier"],
        "Debarment Declaration": [r"Non-blacklisting", r"Debarment Declaration", r"Affidavit", r"not debarred", r"not blacklisted"]
    }

    @classmethod
    def classify_document(cls, text_content: str, file_name: str) -> Dict[str, Any]:
        """Classify uploaded document based on text & filename heuristics."""
        file_upper = file_name.upper()
        if "GST" in file_upper:
            return {"type": "GST Certificate", "confidence": 0.985}
        elif "PAN" in file_upper:
            return {"type": "PAN Card", "confidence": 0.991}
        elif "UDYAM" in file_upper or "MSME" in file_upper:
            return {"type": "Udyam Certificate", "confidence": 0.978}
        elif "OEM" in file_upper or "AUTHORIZATION" in file_upper:
            return {"type": "OEM Authorization", "confidence": 0.965}
        elif "ITR" in file_upper or "TAX" in file_upper:
            return {"type": "ITR Document", "confidence": 0.970}
        elif "LOCAL" in file_upper or "MII" in file_upper or "MAKE" in file_upper:
            return {"type": "Make in India Declaration", "confidence": 0.960}
        elif "DEBAR" in file_upper or "DECLARATION" in file_upper:
            return {"type": "Debarment Declaration", "confidence": 0.955}

        # Check regex rules on text content
        scores = {}
        for doc_type, patterns in cls.DOCUMENT_PATTERNS.items():
            matches = sum(1 for p in patterns if re.search(p, text_content, re.IGNORECASE))
            if matches > 0:
                scores[doc_type] = matches / len(patterns)

        if scores:
            best_type = max(scores, key=scores.get)
            return {"type": best_type, "confidence": min(0.99, 0.70 + scores[best_type] * 0.29)}

        return {"type": "Other / Generic Document", "confidence": 0.60}

    @classmethod
    def extract_entities(cls, doc_type: str, file_name: str, bidder_preset: str = None) -> List[Dict[str, Any]]:
        """
        Extract structured entities based on classified document type and file contents.
        Returns a list of entity dicts: {entity_key, entity_value, confidence, page_number, bbox_json}
        """
        file_upper = file_name.upper()
        entities = []

        # Synthetic entity presets for demo file names
        if "ABC" in bidder_preset or "ABC" in file_upper or "COMPLIANT" in bidder_preset:
            if doc_type == "GST Certificate":
                entities = [
                    {"entity_key": "gstin", "entity_value": "27ABCDE1234F1Z5", "confidence": 0.992, "page_number": 1, "bbox_json": json.dumps({"x": 120, "y": 180, "w": 300, "h": 40})},
                    {"entity_key": "legal_name", "entity_value": "ABC Industrial Solutions Pvt. Ltd.", "confidence": 0.988, "page_number": 1, "bbox_json": json.dumps({"x": 120, "y": 240, "w": 400, "h": 40})},
                    {"entity_key": "status", "entity_value": "Active", "confidence": 0.995, "page_number": 1, "bbox_json": json.dumps({"x": 120, "y": 300, "w": 150, "h": 30})},
                    {"entity_key": "issue_date", "entity_value": "2017-07-01", "confidence": 0.960, "page_number": 1, "bbox_json": json.dumps({"x": 120, "y": 350, "w": 200, "h": 30})}
                ]
            elif doc_type == "PAN Card":
                entities = [
                    {"entity_key": "pan", "entity_value": "ABCDE1234F", "confidence": 0.995, "page_number": 1, "bbox_json": json.dumps({"x": 100, "y": 150, "w": 250, "h": 35})},
                    {"entity_key": "legal_name", "entity_value": "ABC INDUSTRIAL SOLUTIONS PVT. LTD.", "confidence": 0.985, "page_number": 1, "bbox_json": json.dumps({"x": 100, "y": 200, "w": 380, "h": 35})}
                ]
            elif doc_type == "Udyam Certificate":
                entities = [
                    {"entity_key": "udyam_id", "entity_value": "UDYAM-MH-01-0012345", "confidence": 0.990, "page_number": 1, "bbox_json": json.dumps({"x": 110, "y": 140, "w": 320, "h": 35})},
                    {"entity_key": "enterprise_name", "entity_value": "ABC Industrial Solutions Pvt. Ltd.", "confidence": 0.980, "page_number": 1, "bbox_json": json.dumps({"x": 110, "y": 190, "w": 390, "h": 35})},
                    {"entity_key": "enterprise_type", "entity_value": "Medium", "confidence": 0.975, "page_number": 1, "bbox_json": json.dumps({"x": 110, "y": 240, "w": 150, "h": 30})}
                ]
            elif doc_type == "OEM Authorization":
                entities = [
                    {"entity_key": "oem_name", "entity_value": "Suraksha Global Safety Corp", "confidence": 0.970, "page_number": 1, "bbox_json": json.dumps({"x": 150, "y": 160, "w": 350, "h": 40})},
                    {"entity_key": "auth_letter_no", "entity_value": "OEM-SUR-2026-9912", "confidence": 0.982, "page_number": 1, "bbox_json": json.dumps({"x": 150, "y": 210, "w": 280, "h": 35})},
                    {"entity_key": "expiry_date", "entity_value": "2027-12-31", "confidence": 0.965, "page_number": 1, "bbox_json": json.dumps({"x": 150, "y": 260, "w": 200, "h": 30})}
                ]
            elif doc_type == "Make in India Declaration":
                entities = [
                    {"entity_key": "local_content_pct", "entity_value": "65%", "confidence": 0.985, "page_number": 1, "bbox_json": json.dumps({"x": 130, "y": 170, "w": 100, "h": 30})},
                    {"entity_key": "class_type", "entity_value": "Class-I Local Supplier", "confidence": 0.970, "page_number": 1, "bbox_json": json.dumps({"x": 130, "y": 210, "w": 250, "h": 30})}
                ]
            elif doc_type == "ITR Document":
                entities = [
                    {"entity_key": "assessment_year", "entity_value": "2025-26", "confidence": 0.990, "page_number": 1, "bbox_json": json.dumps({"x": 140, "y": 180, "w": 180, "h": 30})},
                    {"entity_key": "turnover", "entity_value": "INR 18.5 Crores", "confidence": 0.975, "page_number": 1, "bbox_json": json.dumps({"x": 140, "y": 230, "w": 220, "h": 30})}
                ]
            elif doc_type == "Debarment Declaration":
                entities = [
                    {"entity_key": "debarment_status", "entity_value": "NOT_DEBARRED", "confidence": 0.980, "page_number": 1, "bbox_json": json.dumps({"x": 120, "y": 190, "w": 200, "h": 30})}
                ]

        elif "NOVA" in bidder_preset or "NOVA" in file_upper or "INCONSISTENT" in bidder_preset:
            if doc_type == "GST Certificate":
                entities = [
                    {"entity_key": "gstin", "entity_value": "27NOVAS9876K1Z9", "confidence": 0.991, "page_number": 1, "bbox_json": json.dumps({"x": 120, "y": 180, "w": 300, "h": 40})},
                    {"entity_key": "legal_name", "entity_value": "Nova Safety Systems Private Limited", "confidence": 0.975, "page_number": 1, "bbox_json": json.dumps({"x": 120, "y": 240, "w": 400, "h": 40})}, # Note variation
                    {"entity_key": "address", "entity_value": "Tech Park, Whitefield, Bengaluru 560066", "confidence": 0.960, "page_number": 1, "bbox_json": json.dumps({"x": 120, "y": 300, "w": 420, "h": 40})}
                ]
            elif doc_type == "PAN Card":
                entities = [
                    {"entity_key": "pan", "entity_value": "NOVAS9876K", "confidence": 0.994, "page_number": 1, "bbox_json": json.dumps({"x": 100, "y": 150, "w": 250, "h": 35})},
                    {"entity_key": "legal_name", "entity_value": "NOVA SAFETY SYSTEMS PVT LTD", "confidence": 0.970, "page_number": 1, "bbox_json": json.dumps({"x": 100, "y": 200, "w": 380, "h": 35})}
                ]
            elif doc_type == "OEM Authorization":
                entities = [
                    {"entity_key": "oem_name", "entity_value": "ShieldTech Safety Systems", "confidence": 0.965, "page_number": 1, "bbox_json": json.dumps({"x": 150, "y": 160, "w": 350, "h": 40})},
                    {"entity_key": "auth_letter_no", "entity_value": "OEM-ST-2026-4410", "confidence": 0.980, "page_number": 1, "bbox_json": json.dumps({"x": 150, "y": 210, "w": 280, "h": 35})},
                    {"entity_key": "expiry_date", "entity_value": "2026-10-15", "confidence": 0.960, "page_number": 1, "bbox_json": json.dumps({"x": 150, "y": 260, "w": 200, "h": 30})} # Nearing expiry (within 45 days)
                ]
            elif doc_type == "Udyam Certificate":
                entities = [
                    {"entity_key": "udyam_id", "entity_value": "UDYAM-KA-02-0098765", "confidence": 0.988, "page_number": 1, "bbox_json": json.dumps({"x": 110, "y": 140, "w": 320, "h": 35})},
                    {"entity_key": "enterprise_name", "entity_value": "Nova Safety Systems Pvt. Ltd.", "confidence": 0.980, "page_number": 1, "bbox_json": json.dumps({"x": 110, "y": 190, "w": 390, "h": 35})}
                ]
            elif doc_type == "Make in India Declaration":
                entities = [
                    {"entity_key": "local_content_pct", "entity_value": "55%", "confidence": 0.980, "page_number": 1, "bbox_json": json.dumps({"x": 130, "y": 170, "w": 100, "h": 30})}
                ]
            elif doc_type == "ITR Document":
                entities = [
                    {"entity_key": "assessment_year", "entity_value": "2025-26", "confidence": 0.985, "page_number": 1, "bbox_json": json.dumps({"x": 140, "y": 180, "w": 180, "h": 30})}
                ]

        elif "PRIME" in bidder_preset or "PRIME" in file_upper or "HIGH_RISK" in bidder_preset:
            if doc_type == "GST Certificate":
                entities = [
                    {"entity_key": "gstin", "entity_value": "27PRIME5432M1Z2", "confidence": 0.990, "page_number": 1, "bbox_json": json.dumps({"x": 120, "y": 180, "w": 300, "h": 40})},
                    {"entity_key": "legal_name", "entity_value": "Prime Industrial Technologies Enterprise", "confidence": 0.965, "page_number": 1, "bbox_json": json.dumps({"x": 120, "y": 240, "w": 400, "h": 40})}, # Name conflict
                    {"entity_key": "status", "entity_value": "Cancelled Provisional", "confidence": 0.950, "page_number": 1, "bbox_json": json.dumps({"x": 120, "y": 300, "w": 250, "h": 30})}
                ]
            elif doc_type == "PAN Card":
                entities = [
                    {"entity_key": "pan", "entity_value": "PRIME5432M", "confidence": 0.992, "page_number": 1, "bbox_json": json.dumps({"x": 100, "y": 150, "w": 250, "h": 35})},
                    {"entity_key": "legal_name", "entity_value": "PRIME INDUSTRIAL TECHNOLOGIES", "confidence": 0.970, "page_number": 1, "bbox_json": json.dumps({"x": 100, "y": 200, "w": 380, "h": 35})}
                ]
            elif doc_type == "Technical Certificate":
                entities = [
                    {"entity_key": "cert_name", "entity_value": "ISO 9001:2015 Quality Certificate", "confidence": 0.975, "page_number": 1, "bbox_json": json.dumps({"x": 130, "y": 160, "w": 350, "h": 35})},
                    {"entity_key": "expiry_date", "entity_value": "2025-11-30", "confidence": 0.960, "page_number": 1, "bbox_json": json.dumps({"x": 130, "y": 210, "w": 180, "h": 30})} # EXPIRED CERTIFICATE
                ]
            elif doc_type == "Make in India Declaration":
                entities = [
                    {"entity_key": "local_content_pct", "entity_value": "40%", "confidence": 0.970, "page_number": 1, "bbox_json": json.dumps({"x": 130, "y": 170, "w": 100, "h": 30})} # Below 50% threshold!
                ]

        # Generic fallback if no specific preset matched
        if not entities:
            entities = [
                {"entity_key": "document_title", "entity_value": doc_type, "confidence": 0.95, "page_number": 1, "bbox_json": json.dumps({"x": 100, "y": 100, "w": 300, "h": 30})}
            ]

        return entities
