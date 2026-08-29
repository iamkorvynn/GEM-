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
        "07ALPHX1122A1ZP": {
            "gstin": "07ALPHX1122A1ZP",
            "legal_name": "Alpha Tech Enterprises",
            "trade_name": "Alpha Tech",
            "registration_status": "ACTIVE",
            "taxpayer_type": "Regular",
            "registration_date": "2020-09-15",
            "address": "Block C, Connaught Place, New Delhi 110001",
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
        },
        "07RADNT6789R1ZA": {
            "gstin": "07RADNT6789R1ZA",
            "legal_name": "Radiant Procurement Solutions Pvt. Ltd.",
            "trade_name": "Radiant Procurement",
            "registration_status": "ACTIVE",
            "taxpayer_type": "Regular",
            "registration_date": "2022-06-01",
            "address": "Industrial Area, Okhla Phase III, New Delhi 110020",
            "filing_status_gstr3b": "UP_TO_DATE"
        },
        "27ZENIT1234E1Z0": {
            "gstin": "27ZENIT1234E1Z0",
            "legal_name": "Zenith Safety Equipment Pvt. Ltd.",
            "trade_name": "Zenith Safety",
            "registration_status": "ACTIVE",
            "taxpayer_type": "Regular",
            "registration_date": "2018-05-12",
            "address": "Sector 4, MIDC Industrial Area, Pune, Maharashtra 411026",
            "filing_status_gstr3b": "UP_TO_DATE"
        },
        "27SOLAR1234S1Z4": {
            "gstin": "27SOLAR1234S1Z4",
            "legal_name": "Solaria Energy Grid Pvt. Ltd.",
            "trade_name": "Solaria Energy",
            "registration_status": "ACTIVE",
            "taxpayer_type": "Regular",
            "registration_date": "2017-06-18",
            "address": "Sector 10, MIDC Industrial Area, Pune, Maharashtra 411018",
            "filing_status_gstr3b": "UP_TO_DATE"
        },
        "07VIKAS4321P1ZA": {
            "gstin": "07VIKAS4321P1ZA",
            "legal_name": "Vikas Solar Power Solutions",
            "trade_name": "Vikas Solar",
            "registration_status": "ACTIVE",
            "taxpayer_type": "Regular",
            "registration_date": "2020-11-20",
            "address": "Okhla Phase I, New Delhi 110020",
            "filing_status_gstr3b": "UP_TO_DATE"
        },
        # --- Tender 2 (Medical Equipment) ---
        "27MEDTC1234A1Z5": {
            "gstin": "27MEDTC1234A1Z5",
            "legal_name": "MedTech Precision Diagnostics Ltd.",
            "trade_name": "MedTech Precision",
            "registration_status": "ACTIVE",
            "taxpayer_type": "Regular",
            "registration_date": "2016-04-10",
            "address": "Bio-Tech Park, Kanjurmarg West, Mumbai, Maharashtra 400078",
            "filing_status_gstr3b": "UP_TO_DATE"
        },
        "29APEXH5678B1Z2": {
            "gstin": "29APEXH5678B1Z2",
            "legal_name": "Apex Healthcare Instruments Pvt. Ltd.",
            "trade_name": "Apex Healthcare",
            "registration_status": "ACTIVE",
            "taxpayer_type": "Regular",
            "registration_date": "2018-08-22",
            "address": "Bannerghatta Main Road, Bengaluru, Karnataka 560076",
            "filing_status_gstr3b": "UP_TO_DATE"
        },
        "07BIOSD9012C1ZX": {
            "gstin": "07BIOSD9012C1ZX",
            "legal_name": "BioShield Diagnostics Solutions",
            "trade_name": "BioShield Med",
            "registration_status": "CANCELLED_PROVISIONAL",
            "taxpayer_type": "Regular",
            "registration_date": "2022-02-14",
            "address": "Plot 99, Patparganj Industrial Area, New Delhi 110092",
            "filing_status_gstr3b": "DEFECTIVE_FILING"
        },
        # --- Tender 3 (Cloud & Datacenter) ---
        "07BHRTC3344D1Z6": {
            "gstin": "07BHRTC3344D1Z6",
            "legal_name": "Bharat Cloud Infrastructure Ltd.",
            "trade_name": "Bharat Cloud",
            "registration_status": "ACTIVE",
            "taxpayer_type": "Regular",
            "registration_date": "2015-09-01",
            "address": "Barakhamba Road, Connaught Place, New Delhi 110001",
            "filing_status_gstr3b": "UP_TO_DATE"
        },
        "27NETCR7788E1Z1": {
            "gstin": "27NETCR7788E1Z1",
            "legal_name": "NetCore Cyber Systems Pvt. Ltd.",
            "trade_name": "NetCore Cyber",
            "registration_status": "ACTIVE",
            "taxpayer_type": "Regular",
            "registration_date": "2018-11-15",
            "address": "Hinjawadi Phase 2, Pune, Maharashtra 411057",
            "filing_status_gstr3b": "UP_TO_DATE"
        },
        "24HORIZ2233F1Z9": {
            "gstin": "24HORIZ2233F1Z9",
            "legal_name": "Horizon Tech Solutions India",
            "trade_name": "Horizon Tech",
            "registration_status": "SUSPENDED",
            "taxpayer_type": "Regular",
            "registration_date": "2021-05-18",
            "address": "SG Highway, Prahlad Nagar, Ahmedabad, Gujarat 380015",
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
        "ALPHX1122A": {
            "pan": "ALPHX1122A",
            "name": "ALPHA TECH ENTERPRISES",
            "category": "Proprietorship",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        "PRIME5432M": {
            "pan": "PRIME5432M",
            "name": "PRIME INDUSTRIAL TECHNOLOGIES ENTERPRISE",
            "category": "Company",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        "RADNT6789R": {
            "pan": "RADNT6789R",
            "name": "RADIANT PROCUREMENT SOLUTIONS PVT. LTD.",
            "category": "Company",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        "ZENIT1234E": {
            "pan": "ZENIT1234E",
            "name": "ZENITH SAFETY EQUIPMENT PVT. LTD.",
            "category": "Company",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        "SOLAR1234S": {
            "pan": "SOLAR1234S",
            "name": "SOLARIA ENERGY GRID PVT. LTD.",
            "category": "Company",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        "VIKAS4321P": {
            "pan": "VIKAS4321P",
            "name": "VIKAS SOLAR POWER SOLUTIONS",
            "category": "Proprietorship",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        # --- Tender 2 ---
        "MEDTC1234A": {
            "pan": "MEDTC1234A",
            "name": "MEDTECH PRECISION DIAGNOSTICS LTD.",
            "category": "Company",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        "APEXH5678B": {
            "pan": "APEXH5678B",
            "name": "APEX HEALTHCARE INSTRUMENTS PVT. LTD.",
            "category": "Company",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        "BIOSD9012C": {
            "pan": "BIOSD9012C",
            "name": "BIOSHIELD DIAGNOSTICS SOLUTIONS",
            "category": "Company",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        # --- Tender 3 ---
        "BHRTC3344D": {
            "pan": "BHRTC3344D",
            "name": "BHARAT CLOUD INFRASTRUCTURE LTD.",
            "category": "Company",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        "NETCR7788E": {
            "pan": "NETCR7788E",
            "name": "NETCORE CYBER SYSTEMS PVT. LTD.",
            "category": "Company",
            "status": "VALID",
            "aadhaar_seeding": "NOT_APPLICABLE"
        },
        "HORIZ2233F": {
            "pan": "HORIZ2233F",
            "name": "HORIZON TECH SOLUTIONS INDIA",
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
        },
        "UDYAM-MH-02-0089123": {
            "udyam_number": "UDYAM-MH-02-0089123",
            "enterprise_name": "MedTech Precision Diagnostics Ltd.",
            "enterprise_type": "MEDIUM",
            "major_activity": "Manufacturing",
            "status": "ACTIVE",
            "nic_code": "26600 - Manufacture of electromedical and electrotherapeutic apparatus"
        },
        "UDYAM-KA-03-0045678": {
            "udyam_number": "UDYAM-KA-03-0045678",
            "enterprise_name": "Apex Healthcare Instruments Pvt. Ltd.",
            "enterprise_type": "SMALL",
            "major_activity": "Manufacturing",
            "status": "ACTIVE",
            "nic_code": "26600 - Manufacture of electromedical apparatus"
        },
        "UDYAM-DL-04-0012984": {
            "udyam_number": "UDYAM-DL-04-0012984",
            "enterprise_name": "Bharat Cloud Infrastructure Ltd.",
            "enterprise_type": "MEDIUM",
            "major_activity": "Services",
            "status": "ACTIVE",
            "nic_code": "62020 - Computer consultancy and computer facilities management"
        },
        "UDYAM-MH-05-0067890": {
            "udyam_number": "UDYAM-MH-05-0067890",
            "enterprise_name": "NetCore Cyber Systems Pvt. Ltd.",
            "enterprise_type": "SMALL",
            "major_activity": "Services",
            "status": "ACTIVE",
            "nic_code": "62099 - Other information technology service activities"
        },
        "UDYAM-MH-01-0099887": {
            "udyam_number": "UDYAM-MH-01-0099887",
            "enterprise_name": "Zenith Safety Equipment Pvt. Ltd.",
            "enterprise_type": "SMALL",
            "major_activity": "Manufacturing",
            "status": "ACTIVE",
            "nic_code": "32909 - Manufacture of safety equipment"
        },
        "UDYAM-MH-03-0098124": {
            "udyam_number": "UDYAM-MH-03-0098124",
            "enterprise_name": "Solaria Energy Grid Pvt. Ltd.",
            "enterprise_type": "SMALL",
            "major_activity": "Manufacturing",
            "status": "ACTIVE",
            "nic_code": "35106 - Manufacture of solar energy"
        }
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
        },
        {
            "name": "RADIANT PROCUREMENT SOLUTIONS",
            "aliases": ["RADIANT PROCUREMENT SOLUTIONS PVT. LTD."],
            "debarment_reason": "Cartel bidding and collusive submission in MoF Tender GEM/2024/B/8912",
            "debarred_by": "Ministry of Finance",
            "debarred_from": "2025-01-15",
            "debarred_until": "2027-01-15",
            "severity": "CRITICAL"
        },
        {
            "name": "BIOSHIELD DIAGNOSTICS SOLUTIONS",
            "aliases": ["BIOSHIELD DIAGNOSTICS", "BIOSHIELD MED"],
            "debarment_reason": "Submission of forged CDSCO manufacturing license in Central Hospital Tender",
            "debarred_by": "Ministry of Health & Family Welfare",
            "debarred_from": "2025-07-20",
            "debarred_until": "2028-07-20",
            "severity": "CRITICAL"
        },
        {
            "name": "HORIZON TECH SOLUTIONS INDIA",
            "aliases": ["HORIZON TECH SOLUTIONS", "HORIZON NETWORKS"],
            "debarment_reason": "Default on high-availability cloud SLA and security breach penalty",
            "debarred_by": "Ministry of Electronics & IT",
            "debarred_from": "2025-08-01",
            "debarred_until": "2027-08-01",
            "severity": "HIGH"
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
        },
        "MedTech Precision Diagnostics Ltd.": {
            "oem_name": "Siemens Healthineers Bharat Corp",
            "auth_letter_no": "OEM-MED-2026-8812",
            "valid_until": "2028-12-31",
            "status": "VERIFIED"
        },
        "Apex Healthcare Instruments Pvt. Ltd.": {
            "oem_name": "Philips Healthcare Diagnostic OEM",
            "auth_letter_no": "OEM-PHL-2026-3391",
            "valid_until": "2026-11-30",
            "status": "VERIFIED"
        },
        "Bharat Cloud Infrastructure Ltd.": {
            "oem_name": "Hewlett Packard Enterprise Bharat",
            "auth_letter_no": "OEM-HPE-2026-7719",
            "valid_until": "2028-06-30",
            "status": "VERIFIED"
        },
        "NetCore Cyber Systems Pvt. Ltd.": {
            "oem_name": "Dell Technologies India OEM",
            "auth_letter_no": "OEM-DEL-2026-5521",
            "valid_until": "2027-03-31",
            "status": "VERIFIED"
        }
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
