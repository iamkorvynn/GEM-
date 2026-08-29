from datetime import datetime
from typing import List, Dict, Any
from backend.services.mock_govt_adapters import GovernmentVerificationFactory

class ComplianceRuleEngine:
    """
    Deterministic rule engine that checks bidder evidence and mock government verification
    against specific tender requirements.
    """

    @classmethod
    def evaluate_bidder(
        cls,
        bidder_data: Dict[str, Any],
        requirements: List[Dict[str, Any]],
        documents: List[Dict[str, Any]],
        verification_records: Dict[str, Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        
        results = []
        current_date_str = "2026-08-27" # Current baseline date

        # Map documents by type
        doc_by_type = {}
        for d in documents:
            classified = d.get("classified_type") or d.get("file_name")
            doc_by_type[classified] = d

        for req in requirements:
            req_id = req["id"]
            title = req["title"]
            is_mandatory = req.get("is_mandatory", True)
            source = req.get("verification_source", "Generic")
            evidence_type = req.get("evidence_type", "")
            rule_type = req.get("rule_type", "VALID")
            threshold = req.get("threshold_value")

            # Default outcome
            status = "VERIFIED"
            extracted_val = None
            verified_val = None
            explanation = "Requirement satisfied cleanly with verified evidence."
            evidence_doc = doc_by_type.get(evidence_type)

            # Rule 1: Check document presence for mandatory requirements.
            # IMPORTANT: For requirements verifiable via government registry adapters
            # (GST, PAN, Debarment DB, Income Tax, MCA, Make in India threshold),
            # the registry record is the primary evidence — a physical document upload
            # is supplementary. Only hard-fail on MISSING for requirements that are
            # purely document-based (OEM auth letter, Technical ISO cert, Udyam cert).
            REGISTRY_VERIFIED_SOURCES = {
                "GST", "PAN", "Debarment DB", "Income Tax", "MCA", "Make in India"
            }
            if is_mandatory and not evidence_doc and source not in REGISTRY_VERIFIED_SOURCES:
                # Check if the government adapter has a record we can use
                govt_fallback = verification_records.get(source)
                if not govt_fallback or govt_fallback.get("status") == "FAILED":
                    status = "MISSING"
                    explanation = f"Mandatory evidence document '{evidence_type}' was not submitted by bidder."
                    results.append({
                        "requirement_id": req_id,
                        "requirement_title": title,
                        "status": status,
                        "extracted_value": None,
                        "verified_value": None,
                        "verification_source": source,
                        "confidence": 1.0,
                        "evidence_doc_id": None,
                        "evidence_file_name": None,
                        "rule_explanation": explanation
                    })
                    continue
                # else: fall through — registry data available, continue evaluation

            # Rule 2: Conditional Requirements (e.g. Udyam required ONLY if MSME benefit claimed)
            if "Udyam" in title or "MSME" in title:
                if not bidder_data.get("claims_msme", False):
                    status = "NOT_APPLICABLE"
                    explanation = "Bidder did not claim MSME exemption benefits; Udyam verification is not applicable."
                    results.append({
                        "requirement_id": req_id,
                        "requirement_title": title,
                        "status": status,
                        "extracted_value": "N/A (No MSME Claim)",
                        "verified_value": "NOT_APPLICABLE",
                        "verification_source": source,
                        "confidence": 1.0,
                        "evidence_doc_id": evidence_doc.get("id") if evidence_doc else None,
                        "evidence_file_name": evidence_doc.get("file_name") if evidence_doc else None,
                        "rule_explanation": explanation
                    })
                    continue

            # Rule 3: Verification against Mock Govt Adapter
            govt_rec = verification_records.get(source)
            if govt_rec:
                verified_val = govt_rec.get("legal_name") or govt_rec.get("registration_status") or govt_rec.get("status")
                
                if govt_rec.get("status") == "FAILED":
                    if source == "Debarment DB":
                        status = "FAILED"
                        explanation = f"CRITICAL: Match found in Debarment Watchlist! Entity '{govt_rec.get('debarred_entity')}' is blacklisted."
                    else:
                        status = "FAILED"
                        explanation = f"Mock {source} verification failed: {govt_rec.get('error', 'Status not active or match failed')}"
                
                elif govt_rec.get("status") == "VERIFIED":
                    if source == "GST":
                        # Check name mismatch
                        sub_name = bidder_data.get("company_name", "").lower().replace(".", "").replace("pvt", "").replace("ltd", "").strip()
                        rec_name = (govt_rec.get("legal_name") or "").lower().replace(".", "").replace("pvt", "").replace("ltd", "").strip()
                        
                        if sub_name and rec_name and sub_name != rec_name:
                            # Fuzzy/minor mismatch vs direct conflict
                            if sub_name in rec_name or rec_name in sub_name:
                                status = "REVIEW_REQUIRED"
                                explanation = f"Minor legal name variation detected between GST record ('{govt_rec.get('legal_name')}') and tender submission ('{bidder_data.get('company_name')}')."
                            else:
                                status = "FAILED"
                                explanation = f"Company name conflict: Submitted '{bidder_data.get('company_name')}' does not match GST legal name '{govt_rec.get('legal_name')}'."

            # Rule 4: Expiry Date check on certificates
            if evidence_doc:
                for entity in evidence_doc.get("entities", []):
                    if entity.get("entity_key") == "gstin":
                        extracted_val = entity.get("entity_value")
                    elif entity.get("entity_key") == "pan":
                        extracted_val = entity.get("entity_value")
                    elif entity.get("entity_key") == "udyam_id":
                        extracted_val = entity.get("entity_value")
                    elif entity.get("entity_key") == "local_content_pct":
                        extracted_val = entity.get("entity_value")
                    elif entity.get("entity_key") == "expiry_date":
                        exp_date_str = entity.get("entity_value")
                        if exp_date_str:
                            if exp_date_str < current_date_str:
                                status = "EXPIRED"
                                explanation = f"Document expired on {exp_date_str} (Baseline: {current_date_str})."
                            elif exp_date_str < "2026-11-01":
                                if status != "EXPIRED" and status != "FAILED":
                                    status = "REVIEW_REQUIRED"
                                    explanation = f"Document is close to expiry ({exp_date_str}). Mandatory renewal check required."

            # Rule 5: Threshold Check (e.g. Local Content % for Make in India)
            if "Local Content" in title or "Make in India" in title:
                local_pct = bidder_data.get("local_content_pct", 0.0)
                extracted_val = f"{local_pct}%"
                target_pct = float(threshold or 50.0)
                if local_pct < target_pct:
                    status = "FAILED"
                    explanation = f"Declared local content of {local_pct}% is below required threshold of {target_pct}%."

            results.append({
                "requirement_id": req_id,
                "requirement_title": title,
                "status": status,
                "extracted_value": extracted_val or bidder_data.get("company_name"),
                "verified_value": str(verified_val) if verified_val else "VERIFIED",
                "verification_source": source,
                "confidence": 0.98 if status in ["VERIFIED", "NOT_APPLICABLE"] else 0.90,
                "evidence_doc_id": evidence_doc.get("id") if evidence_doc else None,
                "evidence_file_name": evidence_doc.get("file_name") if evidence_doc else None,
                "rule_explanation": explanation
            })

        return results
