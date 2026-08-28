"""
Verification & Correlation Engine — 3-Track Implementation
PRD §8: Track A (Exact), Track B (Fuzzy Blacklist), Track C (Cross-doc Correlation)
PRD §8.4: Verdict Aggregation → Low / Medium / High
"""
import json
import uuid
from datetime import datetime, date
from typing import List, Dict, Any

try:
    from rapidfuzz.distance import JaroWinkler
    _HAS_RAPIDFUZZ = True
except ImportError:
    _HAS_RAPIDFUZZ = False

# ---------------------------------------------------------------------------
# Track A — Exact Checks
# PRD §8.1
# ---------------------------------------------------------------------------

def track_a_exact_checks(
    bidder: Dict[str, Any],
    confirmed_docs: List[Dict[str, Any]],
    mock_registries: Dict[str, Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Runs deterministic exact checks against mock registries and confirmed document fields.
    Returns a list of VerificationCheck-shaped dicts.
    """
    checks = []
    today_str = date.today().isoformat()

    # Helper: find confirmed doc by doc_type
    def get_doc(doc_type: str):
        for d in confirmed_docs:
            dt = (d.get("doc_type") or d.get("classified_type") or "").upper()
            if doc_type.upper() in dt:
                return d
        return None

    def get_field(doc: Dict, key: str):
        if not doc:
            return None
        cf = doc.get("confirmed_fields") or {}
        if isinstance(cf, str):
            try:
                cf = json.loads(cf)
            except Exception:
                cf = {}
        if cf.get(key):
            return cf.get(key)
        # fallback: entities list
        for e in doc.get("entities", []):
            if e.get("entity_key") == key:
                return e.get("entity_value")
        return None

    # -- Check 1: GSTIN validity --
    tax_doc = get_doc("TAX_CERTIFICATE") or get_doc("GST Certificate")
    gst_rec = mock_registries.get("GST", {})
    doc_gstin = get_field(tax_doc, "gstin") or bidder.get("gstin", "")
    registry_gstin = gst_rec.get("query", "")
    filing_status = gst_rec.get("filing_status", "")
    reg_status = gst_rec.get("registration_status", gst_rec.get("status", ""))

    if not doc_gstin:
        checks.append(_make_check("EXACT", "GSTIN_VALIDITY", "FAIL",
            "No GSTIN found in submitted Tax Certificate",
            {"doc_gstin": None, "registry": gst_rec.get("status")}))
    elif gst_rec.get("status") == "FAILED":
        checks.append(_make_check("EXACT", "GSTIN_VALIDITY", "FAIL",
            f"GSTIN '{doc_gstin}' not found or inactive in GST portal — status: {reg_status}",
            {"doc_gstin": doc_gstin, "registry_status": reg_status}))
    elif filing_status in ("DEFECTIVE_FILING", "DEFAULTER"):
        checks.append(_make_check("EXACT", "GSTIN_VALIDITY", "FAIL",
            f"GST filing status is '{filing_status}' — bidder is a GST defaulter/non-filer",
            {"doc_gstin": doc_gstin, "filing_status": filing_status}))
    else:
        # Check legal name consistency between GST portal and submitted doc
        registry_legal_name = (gst_rec.get("legal_name") or "").upper()
        doc_legal_name = (get_field(tax_doc, "legal_name") or bidder.get("company_name", "")).upper()
        # Normalize: strip common suffixes for comparison
        def _norm(s):
            return s.replace("PRIVATE LIMITED", "").replace("PVT. LTD.", "").replace("PVT LTD", "").replace("LTD.", "").replace("LIMITED", "").replace(".", "").strip()
        norm_registry = _norm(registry_legal_name)
        norm_doc = _norm(doc_legal_name)
        if norm_registry and norm_doc and norm_registry != norm_doc:
            checks.append(_make_check("EXACT", "GSTIN_VALIDITY", "FLAGGED",
                f"Legal name mismatch: GST portal shows '{gst_rec.get('legal_name')}' but submission says '{bidder.get('company_name')}' — confirm entity identity",
                {"doc_gstin": doc_gstin, "registry_name": gst_rec.get("legal_name"), "submitted_name": bidder.get("company_name"), "filing_status": filing_status}))
        else:
            checks.append(_make_check("EXACT", "GSTIN_VALIDITY", "PASS",
                f"GSTIN '{doc_gstin}' is active and filing status is up to date",
                {"doc_gstin": doc_gstin, "filing_status": filing_status}))


    # -- Check 2: PAN / company-name consistency --
    doc_pan = get_field(tax_doc, "pan") or bidder.get("pan", "")
    bidder_pan = bidder.get("pan", "")
    if doc_pan and bidder_pan and doc_pan.upper().strip() != bidder_pan.upper().strip():
        checks.append(_make_check("EXACT", "PAN_CONSISTENCY", "FAIL",
            f"PAN mismatch: document shows '{doc_pan}', bidder record has '{bidder_pan}'",
            {"doc_pan": doc_pan, "bidder_pan": bidder_pan}))
    else:
        checks.append(_make_check("EXACT", "PAN_CONSISTENCY", "PASS",
            f"PAN '{bidder_pan}' consistent across document and bidder record",
            {"pan": bidder_pan}))

    # -- Check 3: OEM letter expiry --
    oem_doc = get_doc("OEM_AUTH_LETTER") or get_doc("OEM Authorization")
    oem_expiry = get_field(oem_doc, "expiry_date")
    if oem_doc and not oem_expiry:
        checks.append(_make_check("EXACT", "OEM_EXPIRY", "FLAGGED",
            "OEM Authorization letter found but no expiry date could be extracted — manual review required",
            {"expiry_date": None}))
    elif oem_expiry:
        from datetime import timedelta
        try:
            expiry_dt = datetime.strptime(oem_expiry, "%Y-%m-%d").date()
            today_dt = date.today()
            days_until_expiry = (expiry_dt - today_dt).days
        except Exception:
            days_until_expiry = 999

        if oem_expiry < today_str:
            checks.append(_make_check("EXACT", "OEM_EXPIRY", "FAIL",
                f"OEM Authorization letter expired on {oem_expiry} (today: {today_str})",
                {"expiry_date": oem_expiry, "today": today_str}))
        elif days_until_expiry <= 60:
            checks.append(_make_check("EXACT", "OEM_EXPIRY", "FLAGGED",
                f"OEM Authorization letter expires soon on {oem_expiry} ({days_until_expiry} days remaining) — renewal required before award",
                {"expiry_date": oem_expiry, "days_remaining": days_until_expiry}))
        else:
            checks.append(_make_check("EXACT", "OEM_EXPIRY", "PASS",
                f"OEM Authorization letter is valid until {oem_expiry}",
                {"expiry_date": oem_expiry}))
    else:
        checks.append(_make_check("EXACT", "OEM_EXPIRY", "FAIL",
            "No OEM Authorization Letter found in confirmed documents",
            {"oem_doc_found": False}))

    # -- Check 4: EPFO/ESIC compliance --
    epfo_rec = mock_registries.get("EPFO", {})
    epfo_flag = epfo_rec.get("compliance_flag", epfo_rec.get("status", "VERIFIED"))
    if epfo_flag in ("NON_COMPLIANT", "FAILED"):
        checks.append(_make_check("EXACT", "EPFO_COMPLIANCE", "FAIL",
            f"EPFO/ESIC compliance flag is '{epfo_flag}'",
            {"compliance_flag": epfo_flag}))
    else:
        checks.append(_make_check("EXACT", "EPFO_COMPLIANCE", "PASS",
            "EPFO/ESIC compliance verified — no adverse flag",
            {"compliance_flag": epfo_flag}))

    return checks


# ---------------------------------------------------------------------------
# Track B — Fuzzy Blacklist Match
# PRD §8.2 — Jaro-Winkler ≥ 0.85
# ---------------------------------------------------------------------------

BLACKLIST = [
    {"entity_name": "PRIME INDUSTRIAL TECHNOLOGIES", "reason": "Failure to fulfill OEM guarantee in Tender GEM/2024/B/11294", "date_listed": "2025-05-10"},
    {"entity_name": "PRIME INDUSTRIAL TECHNOLOGIES ENTERPRISE", "reason": "Same entity, alternate name", "date_listed": "2025-05-10"},
    {"entity_name": "NOVA FRAUDULENT SYSTEMS", "reason": "Fraudulent document submission in 2024", "date_listed": "2024-09-01"},
    {"entity_name": "RADIANT PROCUREMENT SOLUTIONS", "reason": "Cartel bidding — Ministry of Finance order", "date_listed": "2025-01-15"},
]

FUZZY_THRESHOLD = 0.85

def track_b_fuzzy_blacklist(bidder_name: str) -> List[Dict[str, Any]]:
    """
    Compares bidder name against the MockBlacklist using Jaro-Winkler ≥ 0.85.
    Returns FLAGGED checks for near-matches; empty list if clean.
    PRD §8.2
    """
    checks = []
    name_upper = bidder_name.upper().strip()

    for entry in BLACKLIST:
        listed = entry["entity_name"].upper().strip()
        score = _jaro_winkler(name_upper, listed)
        if score >= FUZZY_THRESHOLD:
            checks.append(_make_check(
                "FUZZY", "BLACKLIST_MATCH", "FLAGGED",
                f"Name {score*100:.0f}% similar to blacklisted entity '{entry['entity_name']}' "
                f"(reason: {entry['reason']})",
                {"bidder_name": bidder_name, "matched_entity": entry["entity_name"],
                 "similarity_score": round(score, 4), "date_listed": entry["date_listed"],
                 "threshold": FUZZY_THRESHOLD}
            ))

    if not checks:
        checks.append(_make_check("FUZZY", "BLACKLIST_MATCH", "PASS",
            f"No match found in debarment/blacklist registry (Jaro-Winkler threshold: {FUZZY_THRESHOLD})",
            {"bidder_name": bidder_name, "threshold": FUZZY_THRESHOLD}))

    return checks


# ---------------------------------------------------------------------------
# Track C — Cross-Document Correlation (Core Differentiator)
# PRD §8.3 — OEM letter issue_date vs MCA21 incorporation_date
# ---------------------------------------------------------------------------

MCA21_DATABASE = {
    "ABCDE1234F": {
        "pan": "ABCDE1234F",
        "company_name": "ABC Industrial Solutions Pvt. Ltd.",
        "incorporation_date": "2015-03-10",
        "directors": ["Ramesh Kumar", "Priya Singh"],
    },
    "NOVAS9876K": {
        "pan": "NOVAS9876K",
        "company_name": "Nova Safety Systems Private Limited",
        "incorporation_date": "2019-03-15",
        "directors": ["Anita Sharma", "Vikram Nair"],
    },
    "PRIME5432M": {
        "pan": "PRIME5432M",
        "company_name": "Prime Industrial Technologies Enterprise",
        "incorporation_date": "2021-01-10",
        "directors": ["Suresh Mehta"],
    },
    "RADNT6789R": {
        "pan": "RADNT6789R",
        "company_name": "Radiant Procurement Solutions Pvt. Ltd.",
        "incorporation_date": "2022-06-01",
        "directors": ["Kavita Rao"],
    },
    "ALPHX1122A": {
        "pan": "ALPHX1122A",
        "company_name": "Alpha Tech Enterprises",
        "incorporation_date": "2020-09-15",
        "directors": ["Deepak Verma", "Sunita Patel"],
    },
}

def track_c_correlation(
    bidder: Dict[str, Any],
    confirmed_docs: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Cross-document correlation checks.
    Primary: OEM letter issue_date vs MCA21 incorporation_date (PRD §8.3)
    Secondary (if time allows): entity-name consistency across documents
    """
    checks = []

    def get_doc(doc_type: str):
        for d in confirmed_docs:
            dt = (d.get("doc_type") or d.get("classified_type") or "").upper()
            if doc_type.upper() in dt:
                return d
        return None

    def get_field(doc, key):
        if not doc:
            return None
        cf = doc.get("confirmed_fields") or {}
        if isinstance(cf, str):
            try:
                cf = json.loads(cf)
            except Exception:
                cf = {}
        if cf.get(key):
            return cf.get(key)
        for e in doc.get("entities", []):
            if e.get("entity_key") == key:
                return e.get("entity_value")
        return None

    # -- Correlation Check 1: OEM letter issue_date vs incorporation_date --
    pan = bidder.get("pan", "")
    mca21 = MCA21_DATABASE.get(pan)
    incorporation_date = bidder.get("incorporation_date") or (mca21.get("incorporation_date") if mca21 else None)

    oem_doc = get_doc("OEM_AUTH_LETTER") or get_doc("OEM Authorization")
    oem_issue_date = get_field(oem_doc, "issue_date")

    if oem_issue_date and incorporation_date:
        if oem_issue_date < incorporation_date:
            checks.append(_make_check(
                "CORRELATION", "OEM_DATE_CORRELATION", "FLAGGED",
                f"OEM letter issue date ({oem_issue_date}) is BEFORE company incorporation date "
                f"({incorporation_date}) — document inconsistency detected",
                {
                    "oem_issue_date": oem_issue_date,
                    "incorporation_date": incorporation_date,
                    "pan": pan,
                    "mca21_company": mca21.get("company_name") if mca21 else "Unknown",
                    "flag": "OEM letter cannot predate company existence"
                }
            ))
        else:
            checks.append(_make_check(
                "CORRELATION", "OEM_DATE_CORRELATION", "PASS",
                f"OEM letter issue date ({oem_issue_date}) is after incorporation date ({incorporation_date}) — consistent",
                {"oem_issue_date": oem_issue_date, "incorporation_date": incorporation_date}
            ))
    elif not incorporation_date:
        checks.append(_make_check(
            "CORRELATION", "OEM_DATE_CORRELATION", "FLAGGED",
            f"Cannot verify OEM date correlation — incorporation date not found in MCA21 for PAN '{pan}'",
            {"pan": pan, "oem_issue_date": oem_issue_date}
        ))
    else:
        checks.append(_make_check(
            "CORRELATION", "OEM_DATE_CORRELATION", "FLAGGED",
            "OEM Authorization letter present but issue_date not extractable — manual verification required",
            {"oem_issue_date": None, "incorporation_date": incorporation_date}
        ))

    # -- Correlation Check 2: Entity name consistency across Tax Certificate and OEM Letter --
    tax_doc = get_doc("TAX_CERTIFICATE") or get_doc("GST Certificate")
    tax_legal_name = get_field(tax_doc, "legal_name") or get_field(tax_doc, "legal name")
    oem_auth_entity = get_field(oem_doc, "authorized_entity") or get_field(oem_doc, "authorized entity")

    if tax_legal_name and oem_auth_entity:
        t_norm = tax_legal_name.upper().replace("PVT.", "").replace("LTD.", "").replace("LIMITED", "").replace("PRIVATE", "").strip()
        o_norm = oem_auth_entity.upper().replace("PVT.", "").replace("LTD.", "").replace("LIMITED", "").replace("PRIVATE", "").strip()
        score = _jaro_winkler(t_norm, o_norm)
        if score < 0.80:
            checks.append(_make_check(
                "CORRELATION", "ENTITY_NAME_CONSISTENCY", "FLAGGED",
                f"Entity name mismatch across documents: Tax Certificate says '{tax_legal_name}' "
                f"but OEM Letter authorizes '{oem_auth_entity}' (similarity: {score*100:.0f}%)",
                {"tax_legal_name": tax_legal_name, "oem_authorized_entity": oem_auth_entity, "similarity": round(score, 4)}
            ))
        else:
            checks.append(_make_check(
                "CORRELATION", "ENTITY_NAME_CONSISTENCY", "PASS",
                f"Entity name consistent across Tax Certificate ('{tax_legal_name}') and OEM Letter ('{oem_auth_entity}')",
                {"tax_legal_name": tax_legal_name, "oem_authorized_entity": oem_auth_entity}
            ))

    return checks


# ---------------------------------------------------------------------------
# PRD §8.4 — Verdict Aggregation
# ---------------------------------------------------------------------------

def aggregate_verdict(checks: List[Dict[str, Any]]) -> str:
    """
    Single function for the risk verdict — defensible and demoable.
    PRD §8.4:
      - Any CORRELATION FAIL/FLAGGED → HIGH
      - Any FUZZY FLAGGED (no correlation flag) → MEDIUM
      - Any EXACT FAIL (no correlation/fuzzy flag) → MEDIUM
      - All PASS → LOW
    """
    has_correlation_flag = any(
        c["check_type"] == "CORRELATION" and c["result"] in ("FAIL", "FLAGGED")
        for c in checks
    )
    has_fuzzy_flag = any(
        c["check_type"] == "FUZZY" and c["result"] == "FLAGGED"
        for c in checks
    )
    has_exact_issue = any(
        c["check_type"] == "EXACT" and c["result"] in ("FAIL", "FLAGGED")
        for c in checks
    )

    if has_correlation_flag:
        return "HIGH"
    if has_fuzzy_flag or has_exact_issue:
        return "MEDIUM"
    return "LOW"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_check(check_type: str, module: str, result: str, reason: str, source_fields: Dict) -> Dict:
    return {
        "id": f"CHK-{uuid.uuid4().hex[:8].upper()}",
        "check_type": check_type,
        "module": module,
        "result": result,
        "reason": reason,
        "source_fields": json.dumps(source_fields),
        "checked_at": datetime.utcnow(),
    }

def _jaro_winkler(s1: str, s2: str) -> float:
    if _HAS_RAPIDFUZZ:
        return JaroWinkler.normalized_similarity(s1, s2)
    # Minimal fallback if rapidfuzz somehow unavailable
    if s1 == s2:
        return 1.0
    return 0.0
