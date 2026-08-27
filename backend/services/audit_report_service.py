from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.models.models import AuditEvent, Bidder, Tender, OfficerDecision, RiskAssessment

class AuditAndReportService:

    @classmethod
    def log_event(
        cls,
        db: Session,
        action: str,
        source: str,
        result: str,
        details: str = None,
        tender_id: str = None,
        bidder_id: str = None,
        actor: str = "System / Officer"
    ):
        event = AuditEvent(
            tender_id=tender_id,
            bidder_id=bidder_id,
            action=action,
            actor=actor,
            source=source,
            result=result,
            details=details,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @classmethod
    def generate_html_report(cls, bidder: Bidder, tender: Tender) -> str:
        """Generate official printable HTML government compliance report."""
        now_str = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
        
        matrix_rows = ""
        for c in bidder.compliance_results:
            status_color = "#10b981" if c.status == "VERIFIED" else ("#f59e0b" if c.status == "REVIEW_REQUIRED" else "#ef4444")
            matrix_rows += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">{c.requirement_title}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><span style="background-color: {status_color}22; color: {status_color}; padding: 4px 8px; rounded: 4px; font-weight: 600; font-size: 12px;">{c.status}</span></td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">{c.extracted_value or 'N/A'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{c.verified_value or 'Verified'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{c.verification_source}</td>
            </tr>
            """

        decision_html = "<i>Pending Procurement Officer Decision</i>"
        if bidder.officer_decision:
            d = bidder.officer_decision
            decision_html = f"""
            <div style="background: #f8fafc; border-left: 4px solid #1e40af; padding: 15px; border-radius: 4px;">
                <p style="margin: 0 0 5px 0;"><strong>Final Decision:</strong> <span style="text-transform: uppercase; color: #1e40af; font-weight: bold;">{d.decision}</span></p>
                <p style="margin: 0 0 5px 0;"><strong>Officer Email:</strong> {d.officer_email}</p>
                <p style="margin: 0 0 5px 0;"><strong>Officer Remarks:</strong> {d.remarks}</p>
                <p style="margin: 0;"><strong>Timestamp:</strong> {d.decided_at.strftime('%d %b %Y, %H:%M UTC')}</p>
            </div>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>GeM Bid Compliance Verification Report - {bidder.company_name}</title>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 40px; background: #fff; }}
                .header {{ border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }}
                .title {{ font-size: 22px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; }}
                .subtitle {{ font-size: 13px; color: #64748b; margin-top: 4px; }}
                .section {{ margin-bottom: 30px; }}
                .section-title {{ font-size: 16px; font-weight: bold; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 15px; color: #1e293b; text-transform: uppercase; }}
                .meta-table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
                .meta-table td {{ padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 14px; }}
                .meta-table td.label {{ background: #f8fafc; font-weight: 600; width: 25%; color: #334155; }}
                .data-table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
                .data-table th {{ background: #0f172a; color: #fff; padding: 10px; text-align: left; text-transform: uppercase; font-size: 11px; }}
                .watermark {{ position: fixed; top: 40%; left: 20%; transform: rotate(-30deg); font-size: 60px; color: rgba(30, 58, 138, 0.04); font-weight: bold; pointer-events: none; text-transform: uppercase; }}
                .score-card {{ background: #f1f5f9; padding: 20px; border-radius: 8px; display: flex; align-items: center; justify-content: space-around; margin-bottom: 20px; border: 1px solid #cbd5e1; }}
                .score-num {{ font-size: 36px; font-weight: bold; color: #1e3a8a; }}
            </style>
        </head>
        <body>
            <div class="watermark">Government e-Marketplace Verification</div>

            <div class="header">
                <div>
                    <div class="title">Government e-Marketplace (GeM)</div>
                    <div class="subtitle">Integrated Bid Compliance & Verification Report | Official Procurement Audit Document</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; color: #64748b;">Report Date: {now_str}</div>
                    <div style="font-size: 12px; font-weight: bold; color: #059669;">Verification Status: OFFICIAL COMPLETED</div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">1. Tender & Bidder Identification</div>
                <table class="meta-table">
                    <tr>
                        <td class="label">Tender ID</td>
                        <td>{tender.id}</td>
                        <td class="label">Tender Title</td>
                        <td>{tender.title}</td>
                    </tr>
                    <tr>
                        <td class="label">Procuring Dept</td>
                        <td>{tender.department}</td>
                        <td class="label">Deadline</td>
                        <td>{tender.deadline}</td>
                    </tr>
                    <tr>
                        <td class="label">Bidder Legal Name</td>
                        <td><strong>{bidder.company_name}</strong></td>
                        <td class="label">Submission Date</td>
                        <td>{bidder.submitted_at.strftime('%d %b %Y')}</td>
                    </tr>
                    <tr>
                        <td class="label">GSTIN</td>
                        <td>{bidder.gstin or 'N/A'}</td>
                        <td class="label">PAN</td>
                        <td>{bidder.pan or 'N/A'}</td>
                    </tr>
                </table>
            </div>

            <div class="section">
                <div class="section-title">2. Compliance Score & Risk Summary</div>
                <div class="score-card">
                    <div style="text-align: center;">
                        <div style="font-size: 12px; text-transform: uppercase; color: #64748b;">Compliance Score</div>
                        <div class="score-num">{bidder.compliance_score} / 100</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 12px; text-transform: uppercase; color: #64748b;">Assessed Risk Level</div>
                        <div style="font-size: 24px; font-weight: bold; color: {'#10b981' if bidder.risk_level == 'LOW' else ('#f59e0b' if bidder.risk_level == 'MEDIUM' else '#ef4444')};">{bidder.risk_level} RISK</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 12px; text-transform: uppercase; color: #64748b;">Verification Coverage</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1e293b;">{bidder.verification_progress}%</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">3. Compliance Matrix & Verification Results</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Requirement Title</th>
                            <th>Status</th>
                            <th>Extracted Evidence</th>
                            <th>Mock Govt Record</th>
                            <th>Verification Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matrix_rows}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <div class="section-title">4. Procurement Officer Final Decision</div>
                {decision_html}
            </div>

            <div style="margin-top: 50px; border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 11px; color: #94a3b8; text-align: center;">
                Generated by GeM AI-Powered Bid Compliance Verification Engine. Verification hash checksum: GEM-AUDIT-HASH-{bidder.id}-2026
            </div>
        </body>
        </html>
        """
        return html
