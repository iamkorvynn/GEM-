"""
auth.py — GeM SSO Pass-through stub

In production, this tool would receive officer identity from GeM's own SSO
(government employee ID / DSC). No independent authentication is needed here.

For the hackathon prototype, officer identity is selected on the frontend landing
screen and stored in sessionStorage — no backend auth calls are made at all.

This router is kept as a stub so the /api/auth prefix remains registered and
does not cause 404s if any legacy client hits it.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/auth", tags=["Authentication (GeM SSO Stub)"])


@router.get("/status")
def auth_status():
    """
    Health-check endpoint for the auth layer.
    In production: would validate the incoming GeM SSO session token.
    In prototype: always returns the simulated-SSO confirmation.
    """
    return {
        "mode": "GeM SSO Pass-through (Prototype Simulation)",
        "note": (
            "Officer identity is received from the parent GeM session. "
            "No independent login or JWT is issued by this tool. "
            "Bidders do not authenticate here."
        ),
        "bidder_login": False,
        "officer_sso": "simulated",
    }
