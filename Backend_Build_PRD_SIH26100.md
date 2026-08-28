# **BACKEND BUILD PRD** 

### AI-Powered Integrated Bid Compliance Verification Platform 

_Consolidated engineering spec for the GeM Procurement prototype backend — SIH26100_ 

|**Field**|**Detail**|
|---|---|
|Source documents|Product PRD v1.0 (Aug 28, 2026) + Technical PRD v1.0 (Aug 28, 2026), SIH26100|
|This document|Backend-only build PRD — consolidates both source PRDs into one implementation-ready<br>spec,plus the application navigation / screen mapthat the backend API must support|
|Organisation|Ministry of Petroleum & Natural Gas / Chennai Petroleum Corporation Limited (CPCL)|
|Build window|1 day (prototype due Aug29, 2026)|
|Status|Draft for build — internal hackathon prototype|



## **1. Purpose & How to Read This Document** 

This is a single, backend-focused build spec. It merges everything in the two source PRDs — the product PRD (why we're building this, scope, differentiators) and the technical PRD (architecture, data model, APIs, verification logic) — into one document a backend engineer can build straight from, without flipping between files. 

It also adds one thing neither source PRD spelled out explicitly: the application's navigation structure — every screen the officer moves through, and exactly which backend endpoint each screen depends on. That mapping is in Section 5. 

##### **What's already decided vs. what this adds** 

Everything in Sections 2–4, 6–13 is carried over directly from the product PRD and technical PRD — architecture, tech stack, data model, API list, verification logic, test bidders, build phases, risks. 

Section 5 (Navigation & Screen Map) is new — it did not exist as a standalone spec in either source document and is synthesized here from the dashboard/upload/checklist/audit-log descriptions scattered across both PRDs, so the frontend nav and backend routes are defined together and can't drift apart. 

## **2. System Architecture** 

Single-instance, locally deployed web app, four logical layers. Every external government integration is mocked for the MVP behind an adapter interface, so a mock data source can be swapped for a real API client later without touching verification logic. 

|**Layer**|**Responsibility**|
|---|---|
|Frontend|React + Tailwind — upload flow, field confirmation table, checklist, risk dashboard, drill-down<br>explainability panel (see Section 5 for full screen map)|
|Backend API|Node.js/Express or Python/FastAPI — three internal services: Extraction Service (OCR+LLM),<br>Verification & Correlation Engine(rules + fuzzy+ cross-document), Audit LoggingService|
|Data layer|SQLite (or JSON store) — Bidders, Documents, MockRegistry tables<br>(GST/EPFO/Blacklist/MCA21), VerificationChecks, AuditLog|



|**Layer**|**Responsibility**|
|---|---|
||GeM, GSTN, EPFO, MCA21, CVC blacklist — all mocked for MVP; every adapter call wrapped|
|External (mocked)|with a fallback that returns "Manual Verification Required" instead of throwing or silently<br>passing|



_Design principle carried through the whole build: every external dependency has a mock adapter behind the same interface as its future real counterpart, and every adapter call degrades to an explicit flagged state on failure — never a silent pass, never a crash._ 

## **3. Tech Stack** 

|**Layer**|**Choice**|**Why**|
|---|---|---|
|Frontend|React + Tailwind CSS|Fast to scaffold; component reuse across upload / checklist /<br>dashboard views|
|Backend|Node.js (Express) or Python<br>(FastAPI)|Either works — pick based on team's OCR/LLM comfort;<br>FastAPI edges out if extraction is Python-native<br>(Tesseract/PyMuPDF)|
|Document extraction|Tesseract / cloud OCR + LLM<br>structured extraction|OCR for raw text, LLM call maps it into a fixed field schema per<br>doc type|
|Data store|SQLite|Zero-setup, file-based, sufficient for 4–5 mock bidders and a live<br>demo|
|Verification logic|Plain functions + Levenshtein /<br>Jaro-Winkler ('fast-levenshtein',<br>'jaro-winkler', or 'rapidfuzz')|No generic rules-engine framework needed at this scale — adds<br>build risk for no benefit|
|Audit logging|Append-onlySQLite table|Simplicity— everywrite is an insert, never an update|
|Deployment|Local / single instance|Demo-only; no auth or multi-tenant concerns for MVP|



## **4. Full Feature Set — Baseline vs. Additions** 

#### **4.1 Baseline (given in the problem statement — the expected floor)** 

|**#**|**Requirement**|
|---|---|
|1|Verify Udyam/MSME, GST, PAN, Income Tax, EPFO/ESIC, Startup India, NSIC, OEM authorization|
|2|Integrate withgovernmentportals(GeM, GSTN, MCA21, DigiLocker, etc.)— mocked for MVP|
|3|Check blacklisting / debarment status|
|4|AI verifies documents; identifies missingor inconsistent information|
|5|Generate a Compliance Score and Risk Level|
|6|Compliance Dashboard: status,pendingrequirements, recommendations|
|7|Final qualification decision stays with the Procurement Officer|
|8|Maintain an auditable record of verification|



#### **4.2 MVP module coverage (what the backend actually verifies by Aug 29)** 

|**Module**|**MVP status**|**What it checks**|
|---|---|---|
|1. Registration|In scope if time allows|Valid, active GeM-registered entity; PAN/GSTIN/company name<br>consistency|
|2. Tax Compliance|In scope — build first|GST filingstatus; no default/non-filer flags|
|3. Labor Law<br>(EPFO/ESIC)|Deferred if time-<br>constrained|EPFO/ESIC registration and compliance status|
|4. Blacklist / Debarment|In scope — build first|Cross-reference debarred-vendor registry, incl. fuzzy name<br>matching|
|5. OEM Authorization|In scope — build first|Letter is genuine, current (not expired), matches product category|



#### **4.3 Additions on top of the baseline (the differentiators)** 

These are not asked for in the problem statement. They are what the backend is actually architected around — build these, not just the checklist above. 

|**Addition**|**Catches**|**Backend component**|
|---|---|---|
|Correlation Engine|Documents that each<br>individually pass but<br>contradict each other —<br>e.g. an OEM letter dated<br>before the company<br>existed|Track C in the Verification Engine (Section 8.3)|
|Fuzzy blacklist<br>matching|Blacklisted entities re-<br>appearing under slightly<br>altered names|Track B — Levenshtein / Jaro-Winkler similarity (Section 8.2)|
|Explainable scoring|Black-box verdicts an<br>officer can't defend in<br>audit|Every VerificationCheck row stores source_fields + a specific<br>reason string|
|Human-in-the-loop<br>OCR confirmation|Garbage-in-garbage-out<br>from misread<br>documents|PATCH /documents/:id/confirm — nothing is verified until an<br>officer confirms extracted fields|
|Fallback architecture|Silent failure or false-<br>pass when a (mocked)<br>government API is<br>unavailable|Adapter wrapper returns "Manual Verification Required" instead<br>of throwing/passing|
|Cross-bidder collusion<br>check (stretch)|Two bidders in one<br>tender sharing a<br>director, address, or<br>suspiciously close<br>incorporation dates|Only after the core pipeline is stable — not core scope|



## **5. Application Navigation & Screen Map** 

Neither source PRD laid the navigation out as its own artifact — it was implied across the "Officer Dashboard" and workflow sections. This is that structure made explicit, so the frontend nav bar and the backend routes are built to the same map. There is no login/auth for MVP (explicit non-goal), so the nav bar itself is deliberately minimal: three toplevel destinations plus a persistent system-status indicator. 

#### **5.1 Top navigation bar (persistent, all screens)** 

|**Nav item**|**Takes the officer to**|**Backend endpoint(s) it calls on load**|
|---|---|---|
|①Bidders  (home)|Bidder Dashboard — table of every<br>bidder verified so far, across<br>tenders, with risk badge and last-<br>updated time|GET /bidders/:id/dashboard (per row, or a list<br>variant of it)|
|②New Verification|Bidder Entry form — officer types<br>bidder name, selects the tender|POST /bidders on submit (triggers mock registry<br>pre-fetch: GST, blacklist, EPFO byPAN/GSTIN)|
|③Audit Trail|Global, filterable audit log across all<br>bidders|GET /bidders/:id/audit-log, aggregated across<br>bidders for the global view|
|● System status (icon, far<br>right)|Small indicator only — shows if<br>any mocked registry adapter is in<br>fallback mode|Reflects the fallback state from the adapter layer<br>described in Section 2; no dedicated endpoint<br>required for MVP, can read the last AuditLog<br>fallback event|



#### **5.2 Bidder Profile — the core screen (reached via** ① **or after submitting** ② **)** 

Once a bidder exists, everything happens inside their profile, organized as four tabs. This is where Sections 7.2–7.4 and 8 of the product PRD physically live. 

|**Tab**|**Contents**|**Backend endpoint(s)**|
|---|---|---|
|Documents|Upload Tax Certificate + OEM Authorization<br>Letter; shows extraction status per file; editable<br>field-confirmation table (human-in-the-loop<br>checkpoint)|POST /bidders/:id/documents · GET<br>/documents/:id/extraction · PATCH<br>/documents/:id/confirm|
|Overview / Checklist|All checks as a checklist (Pass / Fail / Flagged),<br>overall risk verdict badge (Low/Medium/High),<br>"Run Verification" action once required docs are<br>confirmed|POST /bidders/:id/verify · GET<br>/bidders/:id/dashboard|
|Verification Detail|Drill-down per flagged/failed check — exact field<br>or document that caused it, source registry, reason<br>string (explainability panel)|GET /bidders/:id/dashboard (per-check<br>drill-down payload)|
|Bidder Audit Log|Chronological trail scoped to this bidder: uploads,<br>confirmations, checks run, sources used, verdict<br>issued|GET /bidders/:id/audit-log|



#### **5.3 Screen flow** 

1. Bidders (home) → tap New Verification. 

2. Bidder Entry form → submit → POST /bidders → lands on the new Bidder Profile, Documents tab. 

3. Upload both documents → extraction runs async → officer reviews/edits the confirmation table → PATCH /documents/:id/confirm for each. 

4. Once both documents are confirmed, "Run Verification" becomes active on the Overview tab → POST /bidders/:id/verify. 

5. Overview tab renders the checklist and risk badge from GET /bidders/:id/dashboard. Officer clicks any flagged item → jumps to Verification Detail for that specific check. 

6. Officer can jump to Bidder Audit Log at any point to see the full timestamped trail, or back to the Bidders home list. 

##### **Deliberately not in the nav bar for MVP** 

No login/user switcher — no auth or role-based access this build. 

No Settings screen — nothing user-configurable for the demo. 

No Registration / Labor-law tabs unless Section 4.2 modules 1 and 3 get built — the tab set should be driven by which VerificationCheck.module values actually exist for that bidder, not hardcoded to 5. 

## **6. Data Model** 

Five core entities. Add fields only if a specific check in Section 8 requires them. 

##### **6.1 Bidder** 

```
Bidder {
  id: string (PK)
  name: string
  pan: string
  gstin: string
  company_type: string   // e.g. 'Pvt Ltd', 'Proprietorship'
  incorporation_date: date   // from mock MCA21
  tender_id: string   // FK -> Tender
}
```

##### **6.2 Document** 

```
Document {
  id: string (PK)
  bidder_id: string (FK)
  doc_type: enum ['TAX_CERTIFICATE', 'OEM_AUTH_LETTER']
  file_path: string
  extracted_fields: json   // raw LLM/OCR output, pre-confirmation
  confirmed_fields: json   // post human-in-the-loop edit, nullable
  confirmed_by: string     // officer id, nullable until confirmed
  confirmed_at: timestamp  // nullable
}
```

##### **6.3 MockRegistry (one table per source, same shape family)** 

```
MockGST        { gstin, legal_name, filing_status, last_filed_date }
MockEPFO       { pan, registration_status, compliance_flag }
MockBlacklist  { entity_name, reason, date_listed }
MockMCA21      { pan, company_name, incorporation_date, directors[] }
```

##### **6.4 VerificationCheck** 

```
VerificationCheck {
  id: string (PK)
```

```
  bidder_id: string (FK)
  check_type: enum ['EXACT', 'FUZZY', 'CORRELATION']
''''
  module: string     // e.g. GSTIN_VALIDITY, BLACKLIST_MATCH
  result: enum ['PASS', 'FAIL', 'FLAGGED']
  reason: string     // human-readable, specific
  source_fields: json   // which extracted/registry fields drove this
  checked_at: timestamp
```

```
}
```

**6.5 AuditLog  (append-only — API layer never issues UPDATE or DELETE)** 

```
AuditLog {
```

```
  id: string (PK)
  bidder_id: string (FK)
```

```
  actor: string    // officer id or 'SYSTEM'
  action: string   // 'UPLOAD', 'CONFIRM_FIELDS', 'CHECK_RUN', 'VERDICT_ISSUED'
  source: string   // which module/registry was involved
  result: string   // outcome or null
```

```
  timestamp: timestamp
```

```
}
```

## **7. API Design** 

REST, JSON in/out. This is the minimum endpoint set required to support every screen in Section 5. 

|**Method &path**|**Purpose**|
|---|---|
|POST /bidders|Create bidder record — officer enters name + selects tender; triggers mock<br>registry pre-fetch (GST, blacklist, EPFO by PAN/GSTIN)|
|POST /bidders/:id/documents|Upload a document (multipart); kicks off OCR+LLM extraction async,<br>returns extractionjob id|
|GET /documents/:id/extraction|Poll/fetch extracted fields for the human confirmation table|
|PATCH /documents/:id/confirm|Officer submits corrected/confirmed fields; logs confirmation with officer<br>id + timestamp|
|POST /bidders/:id/verify|Runs the three-track verification (exact, fuzzy, correlation) once all<br>required documents are confirmed|
|GET /bidders/:id/dashboard|Returns checklist, overall risk verdict, andper-check drill-down data|
|GET /bidders/:id/audit-log|Returns the full chronological audit trail for that bidder|



## **8. Verification & Correlation Engine — Logic Spec** 

Highest-value, highest-risk part of the build. Implement as three independent, parallel-callable functions, each returning a list of VerificationCheck records. Do not couple them — a failure in one must not block the others. 

#### **8.1 Track A — Exact checks** 

- GSTIN validity: confirmed doc GSTIN vs MockGST.gstin — must match; filing_status must not be 'DEFAULTER' 

- PAN / company-name consistency: Document.confirmed_fields.pan vs Bidder.pan 

- OEM letter expiry: confirmed expiry date vs current date — FAIL if expired 

- EPFO/ESIC compliance flag: pass-through from MockEPFO.compliance_flag 

#### **8.2 Track B — Fuzzy blacklist match** 

Compare Bidder.name against every MockBlacklist.entity_name using both Levenshtein distance and Jaro-Winkler similarity. Flag for review (not auto-fail) above a similarity threshold — recommended: Jaro-Winkler ≥ 0.85, tuned against the seeded test bidders in Section 10. 

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

#### **8.3 Track C — Cross-document correlation (the core differentiator)** 

At minimum, implement the incorporation-date-vs-OEM-letter-date check from the demo script: 

- Pull Bidder incorporation_date from MockMCA21 (by PAN) 

- Compare against the OEM Authorization Letter's issue date (from confirmed_fields) 

- If letter issue date < incorporation date → FLAGGED, reason: "OEM letter dated before company incorporation — document inconsistency" 

_If time allows: extend correlation to entity-name consistency across the two uploaded documents (Tax Certificate vs. OEM Letter should reference the same legal entity name)._ 

#### **8.4 Verdict aggregation** 

Aggregate all VerificationCheck records for a bidder into one Low / Medium / High risk verdict: 

- Any CORRELATION-type FAIL/FLAGGED → High — this is the fraud signal the platform exists to catch 

- Any FUZZY FLAGGED with no correlation flag → Medium 

- Any EXACT FAIL (e.g. expired OEM, GST defaulter) with no correlation/fuzzy flag → Medium 

- All PASS → Low 

_Keep this mapping in a single function so it's demoable and defensible — "why is this bidder High risk" should be answerable by pointing at one line of code._ 

## **9. Document Intelligence Layer — Extraction Pipeline** 

7. Input: PDF/image upload → OCR pass (Tesseract) → raw text 

8. Raw text → LLM call with a fixed extraction schema per doc_type → structured JSON 

9. Structured JSON shown to officer in an editable table (human-in-the-loop checkpoint) — nothing is written to confirmed_fields until the officer submits 

10. On confirm: write confirmed_fields + confirmed_by + confirmed_at; write an AuditLog row 

**Extraction schemas** 

```
TAX_CERTIFICATE:   { gstin, legal_name, filing_status, certificate_date }
OEM_AUTH_LETTER:   { issuing_entity, authorized_entity, product_category,
                     issue_date, expiry_date, signature_present: bool }
```

## **10. Test Bidder Seed Set** 

Seed exactly these into the mock data layer — they match the demo script end-to-end. 

|**#**|**Bidderprofile**|**Expected verdict**|**Trigger**|
|---|---|---|---|
|1|Clean bidder — all documents consistent, no<br>blacklist hit|Low|None — baseline pass case|
|2|Mismatched GSTIN or expired OEM letter|Medium|Track A exact check FAIL|
|3|OEM letter pre-dates MCA21 incorporation date|High|Track C correlation FLAGGED|
|4|Bidder name is a near-variant of a blacklisted<br>entity|Medium–High|Track B fuzzy match<br>FLAGGED|
|5<br>(optional)|Combination case — fuzzy + correlation both<br>trigger|High|Stress-tests verdict aggregation|



## **11. Backend Build Sequence** 

Stabilize the skeleton first; add the differentiators on top of it. 

#### **Phase 1 — Skeleton (first half of the day)** 

- Data models + SQLite schema + seed script for mock registries and the 4–5 test bidders 

- Upload endpoint + OCR/LLM extraction — get ONE document type fully working end-to-end before starting the second 

- Human confirmation endpoint (PATCH /documents/:id/confirm) 

- Dashboard endpoint returning a static/skeleton checklist shape 

#### **Phase 2 — Differentiators (second half)** 

- Track A exact checks wired to mock registries 

- Track B fuzzy blacklist matching 

- Track C correlation engine (incorporation-date vs. OEM-date, at minimum) 

- Verdict aggregation + drill-down data in GET /bidders/:id/dashboard 

#### **Phase 3 — Polish (final hours)** 

- Audit log endpoint fully populated across the whole flow 

- Fallback-state behavior ("Manual Verification Required") — even a mocked API-down toggle demonstrates the design principle 

- Run all 4–5 seeded bidders live end-to-end through the real pipeline; fix whatever breaks 

_Explicitly deferred if time-constrained: Registration and Labor Law modules, cross-bidder collusion check, auth/roles._ 

## **12. Risks & Mitigations** 

|**Risk**|**Mitigation**|
|---|---|
|LLM extraction misreads a field (wrong<br>date format, OCR noise)|Human confirmation checkpoint is mandatory before verification runs —<br>this is the architecture's built-in safeguard, not an add-on|
|Fuzzy match threshold too loose/tight<br>for demo bidders|Tune the Jaro-Winkler threshold against the seeded set in Section 10 before<br>the demo, not live|
|Correlation engine only covers one date<br>pair|Acceptable for MVP — explicitly scoped; do not over-build here under<br>time pressure|
|SQLite concurrency|Non-issue at single-officer local demo scale — do not spend time on this|
|Demo looking hardcoded/scripted|Test bidders must run through the real pipeline live, not pre-computed<br>outputs|



## **13. Explicit Non-Goals for This Build** 

- No real GeM / GST / EPFO / CVC API integration — mock data only 

- No authentication or role-based access 

- No production-grade forgery detection (image tampering, digital signatures) 

- No multi-language OCR support 

- Cross-bidder collusion detection only if the core pipeline is stable with time to spare 

##### **One-line frame for the backend team** 

The problem statement asks: does this bidder pass each check? This backend answers: even if every check passes individually, could this bidder still be fraudulent — and can we show our work? Build Sections 8.3 and 8.4 like they're the product, not an add-on to a checklist. 

