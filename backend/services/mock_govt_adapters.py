import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class BaseVerificationAdapter:
    source_name: str = "GENERIC"

    def query(self, identifier: str, bidder_name: str = None) -> Dict[str, Any]:
        raise NotImplementedError

class GSTVerificationAdapter(BaseVerificationAdapter):
    source_name = "GST"

    # Synthetic GST Portal Registry Data
    GST_DATABASE = {
        "27ABCDE1234F1Z5": {
            "gstin": "27ABCDE1234F1Z5",
            "legal_name": "ABC Industrial Solutions Pvt. Ltd.",
            "trade_name": "ABC Industrial Solutions",
            "registration_status": "ACTIVE",
            "taxpayer_type": "Regular",
            "registration_date": "2017-07-01",
            "address": "Plot 42, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093",
            "filing_status_gstr3b": "UP_TO_DATE"
        },
        "27NOVAS9876K1Z9": {
            "gstin": "27NOVAS9876K1Z9",
            "legal_name": "Nova Safety Systems Private Limited", # Note: Full 'Private Limited' vs submitted 'Pvt. Ltd.'
            "trade_name": "Nova Safety Systems",
            "registration_status": "ACTIVE",
            "taxpayer_type": "Regular",
            "registration_date": "2019-03-15",
            "address": "Building 5, Tech Park, Whitefield, Bengaluru, Karnataka 560066",
            "filing_status_gstr3b": "UP_TO_DATE"
        },
        "27PRIME5432M1Z2": {
            "gstin": "27PRIME5432M1Z2",
            "legal_name": "Prime Industrial Technologies Enterprise", # Mismatch: Submitted 'Prime Industrial Technologies'
            "trade_name": "Prime Technologies",
            "registration_status": "CANCELLED_PROVISIONAL", # Cancelled/Inconsistent
            "taxpayer_type": "Regular",
            "registration_date": "2021-01-10",
            "address": "Sector 18, Electronic City, Gurgaon, Haryana 122015",
            "filing_status_gstr3b": "DEFECTIVE_FILING"
        }
    }

    def query(self, identifier: str, bidder_name: str = None) -> Dict[str, Any]:
        record = self.GST_DATABASE.get(identifier)
        if record:
            return {
                "source": "GST",
                "query": identifier,
                "status": "VERIFIED" if record["registration_status"] == "ACTIVE" else "FAILED",
                "legal_name": record["legal_name"],
                "trade_name": record["trade_name"],
                "registration_status": record["registration_status"],
                "address": record["address"],
                "filing_status": record["filing_status_gstr3b"],
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "reference_id": f"MOCK-GST-{identifier[-6:]}",
                "is_simulated": True
            }
        return {
            "source": "GST",
            "query": identifier,
            "status": "FAILED",
            "error": "GSTIN not found in mock GST portal database",
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "reference_id": "MOCK-GST-NOTFOUND",
            "is_simulated": True
        }

class PANVerificationAdapter(BaseVerificationAdapter):
    source_name = "PAN"

    PAN_DATABASE = {
        "ABCDE1234F": {
            "pan": "ABCDE1234F",
            "name": "ABC INDUSTRIAL SOLUTIONS PVT. LTD.",
            "category": "Company",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        "NOVAS9876K": {
            "pan": "NOVAS9876K",
            "name": "NOVA SAFETY SYSTEMS PRIVATE LIMITED",
            "category": "Company",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        "PRIME5432M": {
            "pan": "PRIME5432M",
            "name": "PRIME INDUSTRIAL TECHNOLOGIES ENTERPRISE",
            "category": "Company",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        }
    }

    def query(self, identifier: str, bidder_name: str = None) -> Dict[str, Any]:
        record = self.PAN_DATABASE.get(identifier.upper())
        if record:
            return {
                "source": "PAN",
                "query": identifier,
                "status": "VERIFIED",
                "legal_name": record["name"],
                "category": record["category"],
                "pan_status": record["status"],
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "reference_id": f"MOCK-PAN-{identifier}",
                "is_simulated": True
            }
        return {
            "source": "PAN",
            "query": identifier,
            "status": "FAILED",
            "error": "PAN record not found",
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "reference_id": "MOCK-PAN-NOTFOUND",
            "is_simulated": True
        }

class UdyamVerificationAdapter(BaseVerificationAdapter):
    source_name = "Udyam"

    UDYAM_DATABASE = {
        "UDYAM-MH-01-0012345": {
            "udyam_number": "UDYAM-MH-01-0012345",
            "enterprise_name": "ABC Industrial Solutions Pvt. Ltd.",
            "enterprise_type": "MEDIUM",
            "major_activity": "Manufacturing",
            "status": "ACTIVE",
            "nic_code": "32909 - Manufacture of safety equipment"
        },
        "UDYAM-KA-02-0098765": {
            "udyam_number": "UDYAM-KA-02-0098765",
            "enterprise_name": "Nova Safety Systems Private Limited",
            "enterprise_type": "SMALL",
            "major_activity": "Manufacturing",
            "status": "ACTIVE",
            "nic_code": "32909 - Manufacture of safety equipment"
        }
        # Bidder C Prime Industrial does NOT have an active Udyam registration
    }

    def query(self, identifier: str, bidder_name: str = None) -> Dict[str, Any]:
        record = self.UDYAM_DATABASE.get(identifier)
        if record:
            return {
                "source": "Udyam",
                "query": identifier,
                "status": "VERIFIED",
                "enterprise_name": record["enterprise_name"],
                "enterprise_type": record["enterprise_type"],
                "major_activity": record["major_activity"],
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "reference_id": f"MOCK-UDYAM-{identifier[-6:]}",
                "is_simulated": True
            }
        return {
            "source": "Udyam",
            "query": identifier,
            "status": "FAILED" if identifier else "NOT_APPLICABLE",
            "error": "Udyam registration not found in MSME Udyam portal",
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "reference_id": "MOCK-UDYAM-NOTFOUND",
            "is_simulated": True
        }

class DebarmentAdapter(BaseVerificationAdapter):
    source_name = "Debarment DB"

    # Central Public Procurement / CPPP / GeM Debarment Watchlist
    DEBARRED_ENTITIES = [
        {
            "name": "PRIME INDUSTRIAL TECHNOLOGIES",
            "aliases": ["PRIME INDUSTRIAL TECHNOLOGIES ENTERPRISE", "PRIME TECH INDIA"],
            "debarment_reason": "Failure to fulfill OEM guarantee in Tender GEM/2024/B/11294",
            "debarred_by": "Ministry of Heavy Industries",
            "debarred_from": "2025-05-10",
            "debarred_until": "2028-05-10",
            "severity": "CRITICAL"
        }
    ]

    def query(self, identifier: str, bidder_name: str = None) -> Dict[str, Any]:
        query_str = (bidder_name or identifier or "").strip().upper()
        for item in self.DEBARRED_ENTITIES:
            matched_name = item["name"].upper()
            if matched_name in query_str or query_str in matched_name:
                return {
                    "source": "Debarment DB",
                    "query": query_str,
                    "status": "FAILED", # FAILED means match found on blacklist
                    "debarment_found": True,
                    "debarred_entity": item["name"],
                    "reason": item["debarment_reason"],
                    "debarred_by": item["debarred_by"],
                    "debarred_until": item["debarred_until"],
                    "verified_at": datetime.now(timezone.utc).isoformat(),
                    "reference_id": "MOCK-DEBAR-MATCH-8891",
                    "is_simulated": True
                }
        return {
            "source": "Debarment DB",
            "query": query_str,
            "status": "VERIFIED", # VERIFIED means clean / no debarment match
            "debarment_found": False,
            "message": "No match found in CPPP / GeM Debarment Watchlist",
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "reference_id": "MOCK-DEBAR-CLEAN",
            "is_simulated": True
        }

class OEMVerificationAdapter(BaseVerificationAdapter):
    source_name = "OEM Registry"

    OEM_AUTHORIZATIONS = {
        "ABC Industrial Solutions Pvt. Ltd.": {
            "oem_name": "Suraksha Global Safety Corp",
            "auth_letter_no": "OEM-SUR-2026-9912",
            "valid_until": "2027-12-31",
            "status": "VERIFIED"
        },
        "Nova Safety Systems Pvt. Ltd.": {
            "oem_name": "ShieldTech Safety Systems",
            "auth_letter_no": "OEM-ST-2026-4410",
            "valid_until": "2026-10-15", # Nearing expiry
            "status": "VERIFIED"
        }
        # Prime Industrial Technologies missing OEM Auth
    }

    def query(self, identifier: str, bidder_name: str = None) -> Dict[str, Any]:
        key = bidder_name or identifier
        record = self.OEM_AUTHORIZATIONS.get(key)
        if record:
            return {
                "source": "OEM Registry",
                "query": key,
                "status": record["status"],
                "oem_name": record["oem_name"],
                "auth_letter_no": record["auth_letter_no"],
                "valid_until": record["valid_until"],
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "reference_id": f"MOCK-OEM-{record['auth_letter_no']}",
                "is_simulated": True
            }
        return {
            "source": "OEM Registry",
            "query": key,
            "status": "FAILED",
            "error": "No verified OEM Authorization on file for this bidder",
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "reference_id": "MOCK-OEM-MISSING",
            "is_simulated": True
        }

class MCAAdapter(BaseVerificationAdapter):
    source_name = "MCA"

    def query(self, identifier: str, bidder_name: str = None) -> Dict[str, Any]:
        return {
            "source": "MCA",
            "query": identifier or bidder_name,
            "status": "VERIFIED",
            "cin": "U29299MH2015PTC265431",
            "company_status": "ACTIVE",
            "authorized_capital": "INR 50,00,000",
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "reference_id": "MOCK-MCA-99120",
            "is_simulated": True
        }

class IncomeTaxAdapter(BaseVerificationAdapter):
    source_name = "Income Tax"

    def query(self, identifier: str, bidder_name: str = None) -> Dict[str, Any]:
        return {
            "source": "Income Tax",
            "query": identifier or bidder_name,
            "status": "VERIFIED",
            "itr_filed_ay_2025_26": True,
            "itr_filed_ay_2024_25": True,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "reference_id": "MOCK-ITR-77192",
            "is_simulated": True
        }

# Factory class for verification providers
class GovernmentVerificationFactory:
    adapters = {
        "GST": GSTVerificationAdapter(),
        "PAN": PANVerificationAdapter(),
        "Udyam": UdyamVerificationAdapter(),
        "Debarment DB": DebarmentAdapter(),
        "OEM Registry": OEMVerificationAdapter(),
        "MCA": MCAAdapter(),
        "Income Tax": IncomeTaxAdapter()
    }

    @classmethod
    def get_adapter(cls, source_name: str) -> BaseVerificationAdapter:
        return cls.adapters.get(source_name, GSTVerificationAdapter())
