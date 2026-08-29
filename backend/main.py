import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base, SessionLocal
from backend.data.seed_data import seed_database
from backend.routers import auth, tenders, bidders, documents, audit, reports

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed database with demo tender and bidders
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title="BidSatark | GeM AI Bid Compliance Verification Platform",
    description="AI-Powered Integrated Bid Compliance Verification Engine (BidSatark) for GeM Government Procurement",
    version="1.0.0"
)

# Configure CORS for local development & frontend demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(tenders.router)
app.include_router(bidders.router)
app.include_router(documents.router)
app.include_router(audit.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "system": "AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement",
        "mode": "PROTOTYPE / SIMULATED GOVERNMENT VERIFICATION LAYER",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

