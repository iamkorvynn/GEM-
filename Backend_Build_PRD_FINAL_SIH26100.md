**BACKEND BUILD PRD — FINAL** 

# **Bid Compliance Verification Platform** 

_Backend Build Spec + Navigation Map + PS Coverage Audit_ 

Smart India Hackathon 2026  |  Problem Statement SIH26100 

|**Field**|**Detail**|
|---|---|
|Companion Documents|Product PRD v1.0 + Technical PRD v1.0 (Aug 28, 2026)|
|Document Purpose|Final, build-ready backend spec, full navigaton hierarchy, and an honest audit<br>of what the original problem statement asked for vs. what's in scope|
|Date|August 29, 2026|
|Build Window|Remaining hours before prototype due Aug 29, 2026|



## **1. What's Mocked vs. Real — Read This First** 

Every "import" action in this system stands in for a real government API pull the team does not have credentials for during the hackathon. This table is the single source of truth for what's simulated and why — refer back to it before building anything that looks like a login or fetch flow. 

|**Data**|**Real Source (Producton)**|**MVP Stand-in**|
|---|---|---|
|Login / session|GeM portal login (ofcer's existng<br>GeM session)|No login built — ofcer identty<br>hardcoded|
|Tender|GeM (posted by a department)|“+ Import Tender” manual form|
|Bidder registraton info|GeM (bidder's registraton profle)|“+ Import Bidder” manual form, nested<br>inside a tender|
|Bidder documents (Tax Cert,<br>OEM Leter)|DigiLocker — bundled with the<br>bidder's GeM applicaton, not a<br>separate fetch|Manual fle upload, on the same screen<br>fow as bidder import|
|GST fling status|GSTN (GST Network)|MockGST JSON table|
|Incorporaton date, company<br>details|MCA21 (Ministry of Corporate Afairs)|MockMCA21 JSON table|
|Blacklist / debarment status|CVC / ministry-level debarment<br>registry|MockBlacklist JSON table|
|EPFO/ESIC compliance|EPFO (Employees' Provident Fund<br>Organisaton)|MockEPFO JSON table|



_Key correction from planning: GeM is the front door, not the data source. It is a federated system — GST comes from GSTN, incorporation data from MCA21, documents from DigiLocker, etc. — and this platform's mock layer mirrors that federation rather than treating “GeM” as one monolithic source._ 

## **2. PS Coverage Audit — What SIH26100 Asked For vs. What's Built** 

Section 5.1 of the Product PRD is the literal baseline the problem statement expects. Listed here plainly so nothing is mistaken for “done” when it isn't. 

### **2.1 Covered** 

- GST verification (via Tax Certificate + MockGST) 

- OEM Authorization verification 

- EPFO/ESIC compliance (mocked) 

- Blacklist/debarment status — plus fuzzy matching, which goes beyond the PS ask 

- AI document verification; identifies missing/inconsistent info 

- Compliance Score and Risk Level (Low/Medium/High) 

- Final qualification decision remains with the officer (the Award Decision flow) 

- Auditable record of verification (Audit Log) 

### **2.2 NOT Covered — Named in the PS, Absent from This Build** 

|**Gap**|**PS Reference**|
|---|---|
|Udyam/MSME verifcaton|PS 5.1 item 1|
|Income Tax status check (separate from GST)|PS 5.1 item 1|
|Startup India verifcaton|PS 5.1 item 1|
|NSIC registraton check|PS 5.1 item 1|
|Make in India / local content check|PS 2.1|
|DigiLocker integraton (no mock exists)|PS 5.1 item 2|
|“Pending Requirements” as a distnct dashboard element|PS 5.1 item 6|
|“Recommendatons” as a distnct dashboard element|PS 5.1 item 6|
|Standalone Registraton module (Udyam/MSME validity)|Product PRD §7.1, Module 1 — not in<br>2-doc MVP|



_None of this blocks the demo — the correlation engine (the actual differentiator) is unaffected. But state these gaps out loud if asked; it reads as rigor, not weakness._ 

## **3. Backend Feature Checklist (Build Today)** 

|**#**|**Feature**|**Notes**|
|---|---|---|
|1|DB schema + seed script (mock registries, 2–3<br>tenders, 5 test bidders)|Foundaton — build frst|
|2|POST /tenders — “Import Tender”|Title, department, reference no.; top-<br>level acton, no parent|
|3|GET /tenders — list with status (Open/Completed)|Powers the Tenders landing screen|



|**#**|**Feature**|**Notes**|
|---|---|---|
||+ bidder count||
|4|POST /tenders/:id/bidders — “Import Bidder”|Nested under a tender — no Tender<br>dropdown; tender_id comes from the<br>URL/page context, not a form feld.<br>Auto-triggers mock registry pre-fetch<br>(GST, EPFO, Blacklist, MCA21) on<br>submit|
|5|GET /tenders/:id/bidders — paginated, fltered list|page, limit params; indexed on<br>tender_id so it scales past the 5 demo<br>bidders|
|6|POST /bidders/:id/documents — upload + async<br>OCR/LLM extracton|Tax Certfcate + OEM Authorizaton<br>Leter; get one doc type fully working<br>before the second|
|7|GET /documents/:id/extracton — poll extracton<br>result|Simple job-status patern|
|8|PATCH /documents/:id/confrm — ofcer<br>confrms/edits felds|Human-in-the-loop checkpoint; writes<br>AuditLog row|
|9|POST /bidders/:id/verify — runs all 3 tracks|Core diferentator; highest priority<br>afer skeleton|
|10|GET /bidders/:id/dashboard — checklist + verdict<br>+ drill-down|Consolidated single-bidder view:<br>documents, confrmed felds, checklist,<br>audit trail all in one place|
|11|PATCH /tenders/:id/award — ofcer's fnal award<br>decision|Selects awarded_bidder_id (or none),<br>notes; this is what marks the tender<br>Completed — not individual bidder<br>verifcaton fnishing|
|12|GET /bidders/:id/audit-log and GET /audit-log|Scoped and global views|
|13|Auth / roles|Not building — explicitly out of MVP<br>scope|
|14|Real GeM/GSTN/MCA21/DigiLocker/EPFO<br>integraton|Not building — mock adapters only,<br>interface designed to swap in later|



## **4. Data Model (Final)** 

### **4.1 Tender** 

Tender { id: string (PK) title: string department: string status: enum ['OPEN', 'COMPLETED'] awarded_bidder_id: string (FK -> Bidder), nullable award_notes: string, nullable 

decided_by: string            // officer id, nullable until awarded decided_at: timestamp, nullable } 

### **4.2 Bidder** 

Bidder { id: string (PK) tender_id: string (FK, required) // set from URL context on import, not a form field name: string pan: string gstin: string company_type: string incorporation_date: date        // from MockMCA21, pre-fetched on import risk_verdict: enum ['LOW','MEDIUM','HIGH'], nullable until verified } 

### **4.3 Document** 

Document { id: string (PK) bidder_id: string (FK) doc_type: enum ['TAX_CERTIFICATE', 'OEM_AUTH_LETTER'] file_path: string extracted_fields: json confirmed_fields: json, nullable confirmed_by: string, nullable confirmed_at: timestamp, nullable } 

### **4.4 MockRegistry tables (unchanged from Technical PRD)** 

MockGST { gstin, legal_name, filing_status, last_filed_date } MockEPFO { pan, registration_status, compliance_flag } MockBlacklist { entity_name, reason, date_listed } MockMCA21 { pan, company_name, incorporation_date, directors[] } 

### **4.5 VerificationCheck** 

VerificationCheck { id: string (PK) bidder_id: string (FK) check_type: enum ['EXACT', 'FUZZY', 'CORRELATION'] module: string result: enum ['PASS', 'FAIL', 'FLAGGED'] reason: string source_fields: json checked_at: timestamp } 

### **4.6 AuditLog** 

AuditLog { id: string (PK) bidder_id: string (FK), nullable  // null for tender-level actions tender_id: string (FK), nullable actor: string                     // officer id or 'SYSTEM' action: string                    // IMPORT_TENDER, IMPORT_BIDDER, UPLOAD, 

// CONFIRM_FIELDS, CHECK_RUN, VERDICT_ISSUED, AWARD_DECISION source: string result: string, nullable timestamp: timestamp } 

## **5. Verification Engine — Call Sequence (unchanged from Technical PRD)** 

- Load bidder + confirmed documents; if any required doc unconfirmed, return 409 

- Run Track A (exact), Track B (fuzzy blacklist), Track C (correlation) independently — one failing never blocks the others 

- Unreachable mock source → write a FLAGGED check, reason “Manual Verification Required” — never throw, never silently pass 

- Persist every check (including PASS rows) as a VerificationCheck 

- Aggregate: any CORRELATION flag → High; FUZZY flag alone → Medium; EXACT fail alone → Medium; all pass → Low 

- Write bidder.risk_verdict; write one AuditLog row (CHECK_RUN / VERDICT_ISSUED) 

## **6. Application Navigation & Screen Map (Final Hierarchy)** 

Tenders is the landing page. Bidders only ever exist inside a tender — there is no global bidder list or global “Import Bidder” action. 

### **6.1 Navbar** 

+---------------------------------------------------------------+ |  [Logo] GeM Bid Compliance          Tenders        Audit Log  | |                                                    [Officer]  | +---------------------------------------------------------------+ 

|**Nav Item**|**Route**|**Shows**|
|---|---|---|
|Tenders (landing)|/tenders|All tenders — ttle, department, status badge<br>(Open/Completed<br>), bidder count. “+ Import Tender” buton<br>✓<br>here|
|Audit Log|/audit-log|Global chronological log, flterable by tender/bidder|
|Ofcer badge|—|Statc, hardcoded — no login fow|



### **6.2 Screen-by-Screen Flow** 

- Screen 1 — Tenders (/tenders): list of tenders with status. “+ Import Tender” opens a form (title, department) → POST /tenders. 

- Screen 2 — Tender Detail (/tenders/:id): shows this tender's bidders (paginated table: name, verdict badge, last verified). “+ Import Bidder” button here — no tender dropdown, tender_id comes from the page. 

- Screen 3 — Import Bidder form: name, PAN, GSTIN → POST /tenders/:id/bidders — auto pre-fetches mock registry data, then proceeds to document upload for this bidder. 

- Screen 4 — Document Upload: two slots (Tax Certificate, OEM Letter), status per file (Uploading → Extracting → Ready). 

- Screen 5 — Field Confirmation: editable table per document → “Confirm & Run Verification” → PATCH confirm, then POST /verify. 

- Screen 6 — Bidder Detail / Compliance Dashboard (/bidders/:id): consolidated view — documents, confirmed fields, full checklist with Pass/Fail/Flagged + reasons, drill-down panel, verdict badge, scoped audit log link. This is the single place an officer looks at everything for one bidder. 

- Screen 7 — Award Decision (/tenders/:id/award): reached from Tender Detail once bidders have verdicts — shows all bidders side-by-side with verdicts, officer selects winner (or none) + notes → PATCH /tenders/:id/award → tender flips to Completed ✓. 

- Screen 8 — Audit Log (/audit-log): chronological table, filterable. 

### **6.3 Screen Flow Diagram** 

Tenders --> [+ Import Tender] | v Tender Detail (bidder list) --> [+ Import Bidder] --> Upload --> Confirm |                                                              | |                                                              v |                                                     Bidder Dashboard |  (repeat per bidder)                                  (verdict shown) |                                                              | +------------------------- once reviewed --------------------> Award Decision | Tender -> Completed 

## **7. Product Philosophy (keep this framing in the pitch)** 

The AI does the tedious, error-prone cross-verification work — extracting fields, checking registries, catching fuzzy blacklist variants, and catching cross-document inconsistencies invisible to single-document review. It produces a scored, explainable verdict. It never decides. The officer makes the final award call, using that score and reasoning plus their own judgment — formalized here as the Award Decision step. Every fallback flags for manual review rather than silently passing or failing, because a wrong silent pass is worse than admitting the system doesn't know. 

_Ties directly to the real fraud cases the Product PRD cites (Goa, Delhi, Tamil Nadu): each involved documents that were individually clean but collectively inconsistent — exactly what Track C (correlation) exists to catch._ 

## **8. Build Order (Today)** 

### **Block 1 — Foundation** 

- DB schema + seed (2–3 tenders, 5 bidders, mock registries) 

- POST/GET /tenders — unblocks Screen 1 

### **Block 2 — Bidder Import + Documents** 

- POST/GET /tenders/:id/bidders (with pre-fetch) — unblocks Screens 2–3 

- Document upload + extraction + confirm — unblocks Screens 4–5 

### **Block 3 — Verification Engine** 

- Track A → B → C, then aggregation — unblocks Screen 6 

### **Block 4 — Award + Audit + Polish** 

- PATCH /tenders/:id/award — unblocks Screen 7 

- Audit log endpoints — unblocks Screen 8 

- Run all 5 seeded bidders end-to-end through the real UI; fix what breaks first 

## **9. Visual Direction** 

Fenco-style fintech dashboard: neutral gray background, white rounded cards, dark charcoal icon sidebar, single blue accent (~#2E74B5), color-coded verdict badges (green/amber/red for Low/Medium/High). No playful colors or illustrations — this is a government fraud-detection tool and should read as trustworthy and official. 

