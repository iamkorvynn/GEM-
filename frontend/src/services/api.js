const API_BASE_URL = '/api';

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json();
}

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE_URL}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchTenders() {
  const res = await fetch(`${API_BASE_URL}/tenders`);
  if (!res.ok) throw new Error('Failed to fetch tenders');
  return res.json();
}

export async function fetchTenderDetails(id) {
  const res = await fetch(`${API_BASE_URL}/tenders/${id}`);
  if (!res.ok) throw new Error('Failed to fetch tender details');
  return res.json();
}

export async function analyzeTender(id) {
  const res = await fetch(`${API_BASE_URL}/tenders/${id}/analyze`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to analyze tender');
  return res.json();
}

export async function fetchBidders(tenderId) {
  const url = tenderId ? `${API_BASE_URL}/bidders?tender_id=${tenderId}` : `${API_BASE_URL}/bidders`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch bidders');
  return res.json();
}

export async function fetchBidderDetails(id) {
  const res = await fetch(`${API_BASE_URL}/bidders/${id}`);
  if (!res.ok) throw new Error('Failed to fetch bidder details');
  return res.json();
}

export async function runFullVerification(id) {
  const res = await fetch(`${API_BASE_URL}/bidders/${id}/verify`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to execute verification pipeline');
  return res.json();
}

export async function submitOfficerDecision(id, decision, remarks, overrideJustification = null) {
  const res = await fetch(`${API_BASE_URL}/bidders/${id}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, remarks, override_justification: overrideJustification })
  });
  if (!res.ok) throw new Error('Failed to submit decision');
  return res.json();
}

export async function uploadDocument(bidderId, file) {
  const formData = new FormData();
  formData.append('bidder_id', bidderId);
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload document');
  return res.json();
}

export async function fetchAuditTrail(tenderId = null, bidderId = null) {
  let url = `${API_BASE_URL}/audit`;
  const params = new URLSearchParams();
  if (tenderId) params.append('tender_id', tenderId);
  if (bidderId) params.append('bidder_id', bidderId);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch audit trail');
  return res.json();
}

export function getReportHtmlUrl(bidderId) {
  return `${API_BASE_URL}/reports/bidder/${bidderId}/html`;
}
