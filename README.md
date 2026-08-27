# 🏛️ GeM AI-Powered Integrated Bid Compliance Verification Platform

An AI-assisted, rule-based, end-to-end bid compliance verification platform built for **Government e-Marketplace (GeM)** procurement officers.

The system automates tender requirement extraction, document classification, OCR information extraction, mock government API cross-verification (GST, PAN, Udyam, Debarment Watchlist, OEM Registry), deterministic compliance rule evaluation, explainable AI risk scoring, side-by-side evidence inspection, human officer decision recording, and immutable audit logging.

---

## 📐 System Architecture & Layer Separation

```
 ┌────────────────────────────────────────────────────────┐
 │                     EVIDENCE LAYER                     │
 │  Uploaded PDFs, OCR Text, Document Classification      │
 └───────────────────────────┬────────────────────────────┘
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                   VERIFICATION LAYER                   │
 │  Mock Govt APIs (GST, PAN, Udyam, Debarment DB, OEM)   │
 └───────────────────────────┬────────────────────────────┘
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                       RULE LAYER                       │
 │  Deterministic Engine (Mandatory/Conditional Rules)   │
 └───────────────────────────┬────────────────────────────┘
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                        AI LAYER                        │
 │  Discrepancy Analysis, Risk Engine, Score Breakdown    │
 └───────────────────────────┬────────────────────────────┘
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                     DECISION LAYER                     │
 │  Human Officer Action, Audit Trail, Report Generation  │
 └───────────────────────────┬────────────────────────────┘
```

> **Core System Principle**:
> *"AI verifies and explains. Rules evaluate. Evidence proves. The Procurement Officer decides."*

---

## ✨ Key Features

1. **Enterprise GovTech UI/UX**: High-contrast Navy/Slate enterprise styling, Recharts visualizations, interactive side-by-side evidence viewer, and glassmorphism badges.
2. **Automated 10-Step Verification Pipeline**: Animated progress modal stepping through document ingestion, OCR parsing, GST/PAN/Udyam queries, Debarment Watchlist screening, rule engine execution, and AI risk scoring.
3. **Simulated Government Verification Layer**: Mock adapters for GST, PAN, Udyam, Debarment Watchlist, OEM Registry, MCA, and Income Tax with an interactive sandbox query tester.
4. **Deterministic Compliance Rule Engine**: Hardened logic for mandatory vs. conditional requirements (e.g., Udyam required ONLY if MSME benefit claimed), certificate expiry dates, Make in India local content thresholds, and legal name variations.
5. **Explainable AI & Risk Score (0-100)**: Structured JSON findings with severity ratings (`CRITICAL`, `MEDIUM`, `LOW`, `VERIFIED`), clear explanations, and risk level mapping (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
6. **Side-by-Side Document Evidence Inspector**: Zoom controls (50%-200%), page navigation, and visual bounding box overlays for extracted entities.
7. **Human-in-the-Loop Officer Decision Interface**: Final qualification action (`QUALIFIED`, `DISQUALIFIED`, `REQUEST CLARIFICATION`) with mandatory remarks and AI recommendation override justification warnings.
8. **Immutable Audit Trail & Official Report Generator**: Cryptographically hashed audit logs and printable government compliance report generator.

---

## 👥 Demo Bidders Included

- **Bidder A (ABC Industrial Solutions Pvt. Ltd.)**: Fully Compliant (Score: 98/100, Risk: **LOW**).
- **Bidder B (Nova Safety Systems Pvt. Ltd.)**: Minor Inconsistencies (GST legal name variation 'Pvt. Ltd.' vs 'Private Limited', OEM cert nearing expiry, Score: 78/100, Risk: **MEDIUM**).
- **Bidder C (Prime Industrial Technologies)**: High Risk / Significant Issues (Missing OEM Authorization, expired ISO cert, GST mismatch, active match in CPPP Debarment Watchlist, Score: 20/100, Risk: **HIGH**).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js v18+ & npm
- Python 3.10+

### 2. Backend Setup (FastAPI)
```bash
# Navigate to project root
cd "AI GEM"

# Create and activate Python virtual environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install fastapi uvicorn sqlalchemy pydantic jinja2 python-multipart reportlab pytest

# Start FastAPI Server
uvicorn backend.main:app --port 8000 --reload
```
Backend API docs available at: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup (Vite + React + Tailwind CSS)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```
Frontend Web App available at: `http://localhost:3002/`

---

## 🔑 Demo Credentials

- **Officer Email**: `procurement.officer@demo.gov.in`
- **Password**: `demo123`

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion
- **Backend**: Python, FastAPI, SQLite, SQLAlchemy, Pydantic v2
- **Document Engine**: Mock OCR & Entity Classification Engine, ReportLab / HTML PDF Exporter
- **Governance**: Append-only Audit Event Logger & Mock Govt API Adapters
