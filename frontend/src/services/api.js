/**
 * api.js — GeM Compliance Platform · Frontend API Client
 *
 * All endpoints are officer-facing. Officer identity comes from the GeM SSO
 * session (simulated via sessionStorage in the prototype). There is no bidder
 * login and no JWT auth header — the backend is open to the officer console.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Attach the simulated officer identity to audit-sensitive requests. */
function officerHeaders() {
  try {
    const session = JSON.parse(sessionStorage.getItem('gem_officer_session') || 'null');
    if (session) {
      return {
        'Content-Type': 'application/json',
        'X-Officer-Id':   session.employeeId || session.id || 'UNKNOWN',
        'X-Officer-Name': session.name || 'Unknown Officer',
        'X-Officer-Role': session.role || 'Procurement Officer',
      };
    }
  } catch { /* ignore */ }
  return { 'Content-Type': 'application/json' };
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

// ── Tenders ──────────────────────────────────────────────────────────────────

export async function fetchTenders() {
  const res = await fetch(`${API_BASE}/tenders`);
  if (!res.ok) throw new Error('Failed to fetch tenders');
  return res.json();
}

export async function fetchTenderDetails(id) {
  const res = await fetch(`${API_BASE}/tenders/${id}`);
  if (!res.ok) throw new Error('Failed to fetch tender details');
  return res.json();
}

export async function analyzeTender(id) {
  const res = await fetch(`${API_BASE}/tenders/${id}/analyze`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to analyze tender');
  return res.json();
}

// ── Bidders ──────────────────────────────────────────────────────────────────

export async function fetchBidders(tenderId) {
  const url = tenderId
    ? `${API_BASE}/bidders?tender_id=${tenderId}`
    : `${API_BASE}/bidders`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch bidders');
  return res.json();
}

export async function fetchBidderDetails(id) {
  const res = await fetch(`${API_BASE}/bidders/${id}`);
  if (!res.ok) throw new Error('Failed to fetch bidder details');
  return res.json();
}

export async function runFullVerification(id) {
  const res = await fetch(`${API_BASE}/bidders/${id}/verify`, {
    method: 'POST',
    headers: officerHeaders(),
  });
  if (!res.ok) throw new Error('Failed to execute verification pipeline');
  return res.json();
}

export async function submitOfficerDecision(id, decision, remarks, overrideJustification = null) {
  const res = await fetch(`${API_BASE}/bidders/${id}/decision`, {
    method: 'POST',
    headers: officerHeaders(),
    body: JSON.stringify({
      decision,
      remarks,
      override_justification: overrideJustification,
    }),
  });
  if (!res.ok) throw new Error('Failed to submit decision');
  return res.json();
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function uploadDocument(bidderId, file) {
  const formData = new FormData();
  formData.append('bidder_id', bidderId);
  formData.append('file', file);

  // Note: don't set Content-Type here — browser must set multipart boundary
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload document');
  return res.json();
}

// ── Audit Trail ───────────────────────────────────────────────────────────────

export async function fetchAuditTrail(tenderId = null, bidderId = null) {
  let url = `${API_BASE}/audit`;
  const params = new URLSearchParams();
  if (tenderId) params.append('tender_id', tenderId);
  if (bidderId) params.append('bidder_id', bidderId);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch audit trail');
  return res.json();
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function getReportHtmlUrl(bidderId) {
  return `${API_BASE}/reports/bidder/${bidderId}/html`;
}
