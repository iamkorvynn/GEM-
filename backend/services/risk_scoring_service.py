from typing import List, Dict, Any

class RiskScoringService:
    """
    Calculates an explainable 0-100 Compliance Score and Risk Level mapping
    based on deterministic compliance results and AI findings.
    """

    MAX_WEIGHTS = {
        "GST Registration": 15.0,
        "PAN Card": 10.0,
        "Udyam Registration": 10.0,
        "Income Tax Return (ITR) Compliance": 15.0,
        "OEM Manufacturer Authorization": 20.0,
        "Make in India Local Content Declaration": 15.0,
        "Non-Blacklisting & Debarment Declaration": 5.0,
        "Technical & Quality Certification": 10.0
    }

    @classmethod
    def calculate_score_and_risk(
        cls,
        compliance_results: List[Dict[str, Any]],
        ai_findings: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        
        score_breakdown = {}
        total_score = 0.0
        max_possible_total = 100.0

        critical_count = 0
        medium_count = 0
        reasons = []

        # Map compliance status per category
        for res in compliance_results:
            title = res.get("requirement_title", "")
            status = res.get("status", "")
            
            # Find matching max weight key
            max_weight = 10.0
            for k, w in cls.MAX_WEIGHTS.items():
                if k.lower() in title.lower() or title.lower() in k.lower():
                    max_weight = w
                    break

            earned = 0.0
            if status == "VERIFIED":
                earned = max_weight
            elif status == "NOT_APPLICABLE":
                earned = max_weight # Not penalizing non-applicable
            elif status == "REVIEW_REQUIRED":
                earned = max_weight * 0.70 # 70% credit for minor name mismatch
                medium_count += 1
                reasons.append(f"Minor discrepancy in '{title}' requires review.")
            elif status in ["FAILED", "MISSING", "EXPIRED"]:
                earned = 0.0
                critical_count += 1
                reasons.append(f"Critical issue in '{title}': Status is {status}.")

            score_breakdown[title] = {
                "earned": round(earned, 1),
                "max": max_weight,
                "status": status
            }
            total_score += earned

        # Check debarment specific penalty
        debarment_failed = any(r.get("status") == "FAILED" and r.get("verification_source") == "Debarment DB" for r in compliance_results)
        if debarment_failed:
            reasons.insert(0, "CRITICAL: Active match in Debarment/Blacklist Watchlist!")

        # Determine Risk Level
        final_score = round(min(100.0, max(0.0, total_score)), 1)

        if debarment_failed:
            risk_level = "CRITICAL"
        elif critical_count >= 2 or final_score < 60:
            risk_level = "HIGH"
        elif critical_count == 1 or medium_count >= 2 or (60 <= final_score < 85):
            risk_level = "MEDIUM" if critical_count == 0 and final_score >= 70 else "HIGH"
        else:
            risk_level = "LOW"

        if not reasons:
            reasons.append("All mandatory tender requirements verified clean with zero discrepancies.")

        return {
            "compliance_score": final_score,
            "risk_level": risk_level,
            "critical_issues_count": critical_count,
            "medium_issues_count": medium_count,
            "score_breakdown": score_breakdown,
            "reasons": reasons
        }
