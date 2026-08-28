**TECHNICAL PRODUCT REQUIREMENTS DOCUMENT** 

# **AI-Powered Integrated Bid Compliance Verification Platform** 

### _Engineering Architecture & Build Specification for GeM Procurement_ 

Smart India Hackathon 2026  |  Problem Statement SIH26100  |  Theme: Smart Automation 

|**Field**|**Detail**|
|---|---|
|Companion Document|Product PRD v1.0 (Aug 28, 2026)|
|Document Version|1.0 — Technical|
|Date|August 28, 2026|
|Status|Internal Hackathon — Build Specification|
|Build Window|1 day (prototype due Aug 29, 2026)|



## **1. Purpose & Scope of This Document** 

This document translates the product PRD's requirements into an implementable system: architecture, data models, module-level logic, APIs, and a build sequence sized for a one-day hackathon window. It assumes the product PRD's scope decisions (Section 5–9 of that document) as fixed — this document does not re-justify what to build, only how. 

_Companion reading: Product PRD — “AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement,” v1.0._ 

## **2. System Architecture Overview** 

The system is a single-instance, locally deployed web application with four logical layers. All external government integrations are mocked for the MVP; the architecture is designed so a mock data source can be swapped for a real API client without touching verification logic. 

|`+-----------------------------------------------------+`<br>`|  FRONTEND (React + Tailwind)                         |`<br>|
|---|
|`|  Upload flow . Field confirmation table . Checklist  |`|
|`|  Risk dashboard . Drill-down explainability panel    |`|
|`+---------------------------+---------------------------+`<br>`| REST / JSON`|
|`+---------------------------v---------------------------+`<br>`|  BACKEND API (Node.js/Express or Python/FastAPI)      |`|
|`|  +------------+  +------------------+  +------------+ |`|
|`|  | Extraction |  | Verification &   |  | Audit      | |`|
|`|  | Service    |  | Correlation      |  | Logging    | |`|
|`|  | (OCR+LLM)  |  | Engine (rules +  |  | Service    | |`|
|`|  |            |  | fuzzy + x-doc)   |  |            | |`|
|`|  +-----+------+  +--------+---------+  +-----+------+ |`|
|`+--------|------------------|------------------|--------+`<br>`|                  |                  |`|
|<br>`+--------v------------------v------------------v--------+`|
|`|  DATA LAYER -- SQLite (or JSON store)                  |`|
|`|  Bidders . Documents . MockRegistry(GST/EPFO/          |`|



```
|  Blacklist/MCA21) . VerificationChecks . AuditLog      |
+---------------------------------------------------------+
```

Design principle carried over from the product PRD: every external dependency (government API) has a mock adapter behind the same interface, and every adapter call is wrapped with a fallback that returns a “Manual Verification Required” state rather than throwing or silently passing. 

## **3. Tech Stack (Confirmed)** 

|**Layer**|**Choice**|**Why**|
|---|---|---|
|Frontend|React + Tailwind CSS|Fast to scaffold; component reuse across<br>upload/checklist/dashboard views|
|Backend|Node.js (Express) or Python (FastAPI)|Either is fine — pick based on team's<br>OCR/LLM tooling comfort; FastAPI edges out<br>if extraction is Python-native<br>(Tesseract/PyMuPDF)|
|Document<br>Extraction|Tesseract (or cloud OCR) + LLM structured<br>extraction|OCR for raw text, LLM call to map into a fixed<br>field schema per doc type|
|Data Store|SQLite|Zero-setup, file-based, sufficient for 4–5<br>mock bidders and a demo|
|Verification Logic|Rule engine (plain functions) +<br>Levenshtein/Jaro-Winkler (e.g. ‘fast-<br>levenshtein’, ‘jaro-winkler’ or ‘rapidfuzz’ in<br>Python)|No need for a generic rules engine framework<br>at this scale — adds build risk for no benefit|
|Audit Logging|Append-only SQLite table|Simplicity; every write is an insert, never an<br>update|
|Deployment|Local / single instance|Demo-only; no auth or multi-tenant concerns<br>for MVP|



## **4. Data Model** 

Five core entities. Field lists below are the MVP-minimum columns — add fields only if a specific check in Section 6 requires them. 

#### **4.1 Bidder** 

```
Bidder {
  id: string (PK)
  name: string
  pan: string
  gstin: string
  company_type: string        // e.g. 'Pvt Ltd', 'Proprietorship'
  incorporation_date: date    // from mock MCA21
  tender_id: string           // FK -> Tender
}
```

#### **4.2 Document** 

```
Document {
  id: string (PK)
  bidder_id: string (FK)
  doc_type: enum ['TAX_CERTIFICATE', 'OEM_AUTH_LETTER']
  file_path: string
  extracted_fields: json      // raw LLM/OCR output, pre-confirmation
  confirmed_fields: json      // post human-in-the-loop edit, nullable
  confirmed_by: string        // officer id, nullable until confirmed
  confirmed_at: timestamp     // nullable
}
```

#### **4.3 MockRegistry (one table per source, same shape)** 

```
MockGST { gstin, legal_name, filing_status, last_filed_date }
MockEPFO { pan, registration_status, compliance_flag }
MockBlacklist { entity_name, reason, date_listed }
MockMCA21 {pan, company_name, incorporation_date, directors[]}
```

#### **4.4 VerificationCheck** 

```
VerificationCheck {
  id: string (PK)
  bidder_id: string (FK)
  check_type: enum ['EXACT', 'FUZZY', 'CORRELATION']
  module: string              // e.g. 'GSTIN_VALIDITY', 'BLACKLIST_MATCH'
  result: enum ['PASS', 'FAIL', 'FLAGGED']
  reason: string              // human-readable, specific
  source_fields: json         // which extracted/registry fields drove this
  checked_at: timestamp
}
```

#### **4.5 AuditLog** 

```
AuditLog {
  id: string (PK)
  bidder_id: string (FK)
  actor: string               // officer id or 'SYSTEM'
  action: string              // 'UPLOAD', 'CONFIRM_FIELDS', 'CHECK_RUN', 'VERDICT_ISSUED'
  source: string              // which module/registry was involved
  result: string              // outcome or null
  timestamp: timestamp
}
```

Append-only by convention — the API layer never issues an UPDATE or DELETE against AuditLog. 

## **5. API Design** 

REST, JSON in/out. Minimum endpoint set to support the Section 8 workflow from the product PRD. 

|**Method & Path**|**Purpose**|
|---|---|
|POST /bidders|Create bidder record; officer enters name + selects tender; triggers mock<br>registry pre-fetch (GST, blacklist, EPFO by PAN/GSTIN)|
|POST /bidders/:id/documents|Upload a document (multipart); kicks off OCR+LLM extraction async,<br>returns extraction job id|
|GET /documents/:id/extraction|Poll/fetch extracted fields for the human confirmation table|
|PATCH /documents/:id/confirm|Officer submits corrected/confirmed fields; logs confirmation with officer<br>id + timestamp|



|**Method & Path**|**Purpose**|
|---|---|
|POST /bidders/:id/verify|Runs the three-track verification (exact, fuzzy, correlation) once all<br>required documents are confirmed|
|GET /bidders/:id/dashboard|Returns checklist, overall risk verdict, and per-check drill-down data|
|GET /bidders/:id/audit-log|Returns full chronological audit trail for that bidder|



## **6. Verification & Correlation Engine — Logic Spec** 

This is the highest-value, highest-risk part of the build. Implement as three independent, parallel-callable functions that each return a list of VerificationCheck records — do not couple them, so a failure in one does not block the others. 

#### **6.1 Track A — Exact Checks** 

- GSTIN validity: confirmed doc GSTIN vs MockGST.gstin — must match; filing_status must not be 'DEFAULTER' 

- PAN/company name consistency: Document.confirmed_fields.pan vs Bidder.pan 

- OEM letter expiry: confirmed expiry date vs current date — FAIL if expired 

- EPFO/ESIC compliance flag: pass-through from MockEPFO.compliance_flag 

#### **6.2 Track B — Fuzzy Blacklist Match** 

Compare Bidder.name against every MockBlacklist.entity_name using both Levenshtein distance and JaroWinkler similarity. Flag for review (not auto-fail) above a similarity threshold — recommend Jaro-Winkler ≥ 0.85 as the flag threshold, tune against the seeded test bidders in Section 8. 

```
function fuzzyBlacklistCheck(bidderName, blacklist) {
  return blacklist
    .map(b => ({ entity: b.entity_name, score: jaroWinkler(bidderName, b.entity_name) }))
    .filter(r => r.score >= 0.85)
    .map(r => ({
      result: 'FLAGGED',
      reason: `Name ${(r.score*100).toFixed(0)}% similar to blacklisted '${r.entity}'`
    }));
}
```

#### **6.3 Track C — Cross-Document Correlation** 

The core differentiator. At minimum, implement the incorporation-date-vs-OEM-letter-date check from the product PRD's demo script (Section 13, item 3): 

- Pull Bidder incorporation_date from MockMCA21 (by PAN) 

- Compare against OEM Authorization Letter's issue date (from confirmed_fields) 

- If letter issue date < incorporation date → FLAGGED, reason: “OEM letter dated before company incorporation — document inconsistency” 

_If time allows: extend correlation to entity-name consistency across the two uploaded documents (Tax Certificate vs OEM Letter should reference the same legal entity name)._ 

#### **6.4 Verdict Aggregation** 

Aggregate all VerificationCheck records for a bidder into an overall Low / Medium / High risk verdict: 

- Any CORRELATION-type FAIL/FLAGGED → High (this is the fraud signal the platform exists to catch) 

- Any FUZZY FLAGGED with no correlation flag → Medium 

- Any EXACT FAIL (e.g., expired OEM, GST defaulter) with no correlation/fuzzy flag → Medium 

- All PASS → Low 

Keep this mapping in one place (a single function) so it's demoable and defensible — “why is this bidder High risk” should be answerable by pointing at one line of code. 

## **7. Document Intelligence Layer — Extraction Pipeline** 

- Input: PDF/image upload → OCR pass (Tesseract) → raw text 

- Raw text → LLM call with a fixed extraction schema per doc_type (defined below) → structured JSON 

- Structured JSON shown to officer in an editable table (human-in-the-loop checkpoint) — nothing is written to confirmed_fields until the officer submits 

- On confirm: write confirmed_fields + confirmed_by + confirmed_at; write an AuditLog row 

#### **7.1 Extraction Schemas** 

```
TAX_CERTIFICATE schema:
```

```
  { gstin, legal_name, filing_status, certificate_date }
```

```
OEM_AUTH_LETTER schema:
```

```
  { issuing_entity, authorized_entity, product_category,
    issue_date, expiry_date, signature_present: bool }
```

## **8. Test Bidder Seed Set (for the demo)** 

Matches the product PRD's demo script (Section 13). Seed exactly these into the mock data layer: 

|**#**|**Bidder Profile**|**Expected Verdict**|**Trigger**|
|---|---|---|---|
|1|Clean bidder — all documents<br>consistent, no blacklist hit|Low|None — baseline pass case|
|2|Mismatched GSTIN or expired OEM<br>letter|Medium|Track A exact check FAIL|
|3|OEM letter pre-dates MCA21<br>incorporation date|High|Track C correlation FLAGGED|
|4|Bidder name is a near-variant of a<br>blacklisted entity|Medium–High|Track B fuzzy match<br>FLAGGED|
|5<br>(optional)|Combination case — fuzzy +<br>correlation both trigger|High|Stress-tests verdict<br>aggregation|



## **9. Build Sequence for the 1-Day Window** 

Directly follows the product PRD's build-order note (Section 8): stabilize the skeleton first, add differentiators on top. 

**Phase 1 — Skeleton (target: first half of the day)** 

- Data models + SQLite schema + seed script for mock registries and 4–5 test bidders 

- Upload endpoint + OCR/LLM extraction (Track: get ONE document type fully working end-to-end before starting the second) 

- Human confirmation table (frontend + PATCH endpoint) 

- Dashboard shell (checklist view, static risk badge) 

#### **Phase 2 — Differentiators (target: second half)** 

- Track A exact checks wired to mock registries 

- Track B fuzzy blacklist matching 

- Track C correlation engine (incorporation-date vs OEM-date, at minimum) 

- Verdict aggregation + drill-down explainability panel 

**Phase 3 — Polish (final hours)** 

- Audit log view 

- Fallback-state UI (“Manual Verification Required”) — even a mocked API-down toggle demonstrates the design principle 

- Run all 4–5 seeded bidders live end-to-end; fix whatever breaks 

_Explicitly deferred if time-constrained (per product PRD Section 9.2): Registration and Labor Law modules, crossbidder collusion check, auth/roles._ 

## **10. Technical Risks** 

|**Risk**|**Mitigation**|
|---|---|
|LLM extraction misreads a field (wrong date<br>format, OCR noise)|Human confirmation checkpoint is mandatory before<br>verification runs — this is already the architecture's<br>safeguard, not an add-on|
|Fuzzy match threshold too loose/tight for demo<br>bidders|Tune Jaro-Winkler threshold against the seeded set in<br>Section 8 before demo, not live|
|Correlation engine only covers one date pair|Acceptable for MVP — explicitly scoped in product PRD;<br>do not over-build here under time pressure|
|SQLite concurrency (unlikely at demo scale)|Non-issue for a single-officer local demo; do not spend<br>time on this|



## **11. Explicit Non-Goals for This Build** 

Restated from the product PRD to keep the engineering build honest under time pressure: 

- No real GeM/GST/EPFO/CVC API integration — mock data only 

- No authentication or role-based access 

- No production-grade forgery detection (image tampering, digital signatures) 

- No multi-language OCR support 

- Cross-bidder collusion detection only if core pipeline is stable with time to spare 

