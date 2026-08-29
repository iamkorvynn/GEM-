import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Plus, ChevronRight, Trophy, ArrowLeft, AlertTriangle,
  CheckCircle2, Clock, ShieldAlert, X, Loader2, RefreshCw
} from 'lucide-react';

const BASE = '/api';

const RISK_STYLE = {
  LOW:      { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  MEDIUM:   { color: '#92400e', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  HIGH:     { color: '#991b1b', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
  CRITICAL: { color: '#9f1239', bg: '#fff1f2', border: '#fda4af', dot: '#f43f5e' },
  PENDING:  { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8' },
};

const DECISION_STYLE = {
  QUALIFIED:              { color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  DISQUALIFIED:           { color: '#991b1b', bg: '#fee2e2', border: '#fecaca' },
  REQUEST_CLARIFICATION:  { color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
};

const COMPANY_TYPES = ['Pvt Ltd', 'OPC', 'Partnership', 'Proprietorship', 'Public Ltd', 'LLP'];

export default function TenderBidderList({
  tenderId, tenderTitle, onSelectBidder, onAwardDecision, onBack, showToast
}) {
  const [bidders, setBidders]     = useState([]);
  const [tender, setTender]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    company_name: '', pan: '', gstin: '', udyam_id: '',
    company_type: 'Pvt Ltd', claims_msme: false, local_content_pct: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, bRes] = await Promise.all([
        fetch(`${BASE}/tenders/${tenderId}`),
        fetch(`${BASE}/tenders/${tenderId}/bidders`),
      ]);
      if (tRes.ok) setTender(await tRes.json());
      if (bRes.ok) setBidders(await bRes.json());
    } catch {}
    setLoading(false);
  }, [tenderId]);

  useEffect(() => { load(); }, [load]);

  const handleImportBidder = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.pan.trim() || !form.gstin.trim()) {
      showToast?.('Missing Fields', 'Company name, PAN and GSTIN are required.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/bidders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: form.company_name,
          pan: form.pan.toUpperCase().trim(),
          gstin: form.gstin.toUpperCase().trim(),
          company_type: form.company_type,
          claims_msme: form.claims_msme,
          local_content_pct: Number(form.local_content_pct),
          tender_id: tenderId,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Import failed');
      const created = await res.json();
      setShowForm(false);
      setForm({ company_name: '', pan: '', gstin: '', udyam_id: '', company_type: 'Pvt Ltd', claims_msme: false, local_content_pct: 0 });
      await load();
      showToast?.('Bidder Imported', `${created.company_name} added to ${tenderId}`, 'success');
    } catch (err) {
      showToast?.('Import Failed', err.message, 'error');
    }
    setSubmitting(false);
  };

  // Stats
  const verified  = bidders.filter(b => b.risk_level === 'LOW').length;
  const highRisk  = bidders.filter(b => ['HIGH', 'CRITICAL'].includes(b.risk_level)).length;
  const pending   = bidders.filter(b => b.risk_level === 'PENDING' || !b.compliance_score).length;
  const canAward  = bidders.length > 0 && bidders.some(b => b.officer_decision === 'QUALIFIED' || b.risk_level !== 'PENDING');
  const isCompleted = tender?.status === 'COMPLETED';

  return (
    <div className="p-6 space-y-5">

      {/* ── Tender Header ── */}
      <div
        className="card px-6 py-5"
        style={{ borderTop: `3px solid ${isCompleted ? '#8b5cf6' : '#3b82f6'}` }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md"
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}
              >
                {tenderId}
              </span>
              {isCompleted ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed' }}>
                  ✓ COMPLETED
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                  ACTIVE
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold leading-tight" style={{ color: '#111827' }}>
              {tenderTitle || tender?.title || tenderId}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {tender?.department} · Deadline: {tender?.deadline} · {tender?.estimated_cost}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={load}
              className="btn-secondary p-2.5 rounded-xl"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {!isCompleted && (
              <button
                id="import-bidder-btn"
                onClick={() => setShowForm(v => !v)}
                className="btn-secondary px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
              >
                {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showForm ? 'Cancel' : '+ Import Bidder'}
              </button>
            )}
            <button
              id="award-decision-btn"
              onClick={onAwardDecision}
              disabled={!canAward && !isCompleted}
              className="btn-primary px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
              style={{ opacity: (!canAward && !isCompleted) ? 0.5 : 1 }}
              title={!canAward ? 'Run verification on at least one bidder first' : ''}
            >
              <Trophy className="w-3.5 h-3.5" />
              {isCompleted ? 'View Award' : 'Award Decision'}
            </button>
          </div>
        </div>

        {/* Completed winner strip */}
        {isCompleted && tender?.winner_bidder_id && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl"
            style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
            <Trophy className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="text-xs font-bold" style={{ color: '#7c3aed' }}>
              Awarded to: {bidders.find(b => b.id === tender.winner_bidder_id)?.company_name || tender.winner_bidder_id}
            </span>
            {tender.award_notes && (
              <span className="text-xs ml-2" style={{ color: '#9ca3af' }}>· {tender.award_notes}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Bids',  value: bidders.length,    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', Icon: Users },
          { label: 'Verified',    value: verified,           color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', Icon: CheckCircle2 },
          { label: 'High Risk',   value: highRisk,           color: '#991b1b', bg: '#fef2f2', border: '#fecaca', Icon: ShieldAlert },
          { label: 'Pending',     value: pending,            color: '#92400e', bg: '#fffbeb', border: '#fde68a', Icon: Clock },
        ].map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-3" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="p-2 rounded-xl shrink-0" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <s.Icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Import Bidder Form ── */}
      {showForm && (
        <div className="card p-5 animate-fade-up" style={{ borderTop: '3px solid #6366f1' }}>
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <h2 className="text-sm font-bold" style={{ color: '#111827' }}>Import Bidder Submission</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md ml-1"
              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}>
              Auto-scoped to: {tenderId}
            </span>
          </div>
          <form onSubmit={handleImportBidder} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
                Company / Entity Name *
              </label>
              <input
                type="text" required
                value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                placeholder="e.g. ABC Industrial Solutions Pvt. Ltd."
                className="form-input w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
                PAN Number *
              </label>
              <input
                type="text" required maxLength={10}
                value={form.pan}
                onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
                placeholder="ABCDE1234F"
                className="form-input w-full px-3 py-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
                GSTIN *
              </label>
              <input
                type="text" required maxLength={15}
                value={form.gstin}
                onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                placeholder="27ABCDE1234F1Z5"
                className="form-input w-full px-3 py-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
                Entity Type
              </label>
              <select
                value={form.company_type}
                onChange={e => setForm(f => ({ ...f, company_type: e.target.value }))}
                className="form-input w-full px-3 py-2.5 text-sm"
              >
                {COMPANY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
                Local Content % (MII Claim)
              </label>
              <input
                type="number" min={0} max={100}
                value={form.local_content_pct}
                onChange={e => setForm(f => ({ ...f, local_content_pct: e.target.value }))}
                className="form-input w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox" id="claims_msme"
                checked={form.claims_msme}
                onChange={e => setForm(f => ({ ...f, claims_msme: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="claims_msme" className="text-xs font-medium" style={{ color: '#374151' }}>
                Claims MSME / Udyam registration
              </label>
            </div>

            <div className="md:col-span-2 flex items-center justify-between pt-2"
              style={{ borderTop: '1px solid #e5e7eb' }}>
              <button
                type="button"
                onClick={() => setForm({
                  company_name: 'Apex Shield Safety Systems Pvt. Ltd.',
                  pan: 'APEXS9988D',
                  gstin: '27APEXS9988D1Z8',
                  company_type: 'Pvt Ltd',
                  claims_msme: true,
                  local_content_pct: 68
                })}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
                className="hover:bg-slate-100"
              >
                🪄 Autofill Mock Bidder
              </button>
              <button
                type="submit" disabled={submitting}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {submitting ? 'Importing…' : 'Import Bidder'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Bidder List ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: '#f7f8fa', borderBottom: '1px solid #e5e7eb' }}>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#111827' }}>
            <Users className="w-4 h-4 text-blue-500" />
            Bidder Submissions
            <span className="text-[10px] px-2 py-0.5 rounded-md font-normal"
              style={{ background: '#e5e7eb', color: '#6b7280' }}>
              {bidders.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : bidders.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-semibold" style={{ color: '#374151' }}>No bidders yet</p>
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
              Click <strong>+ Import Bidder</strong> to add the first submission
            </p>
          </div>
        ) : (
          <div>
            {bidders.map((b, idx) => {
              const rs = RISK_STYLE[b.risk_level] || RISK_STYLE.PENDING;
              const ds = b.officer_decision ? (DECISION_STYLE[b.officer_decision] || {}) : null;
              const scoreColor = b.compliance_score >= 75 ? '#15803d'
                : b.compliance_score >= 50 ? '#d97706' : '#dc2626';
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-all"
                  style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7f8fa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => onSelectBidder(b.id, b.company_name)}
                >
                  {/* Rank */}
                  <span className="text-xs font-bold w-6 text-right shrink-0" style={{ color: '#d1d5db' }}>
                    {idx + 1}
                  </span>

                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{ background: rs.color }}
                  >
                    {b.company_name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate" style={{ color: '#111827' }}>{b.company_name}</span>
                    </div>
                    <div className="text-[10px] mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: '#9ca3af' }}>
                      <span className="font-mono">{b.id}</span>
                      {b.pan && <><span>·</span><span>PAN: {b.pan}</span></>}
                      {b.gstin && <><span>·</span><span>GST: {b.gstin}</span></>}
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="w-28 shrink-0 hidden md:block">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px]" style={{ color: '#9ca3af' }}>Score</span>
                      <span className="text-xs font-bold" style={{ color: scoreColor }}>
                        {b.compliance_score ? b.compliance_score.toFixed(0) : '—'}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full progress-track overflow-hidden">
                      <div style={{ width: `${b.compliance_score || 0}%`, background: scoreColor, height: '100%', borderRadius: 999 }} />
                    </div>
                  </div>

                  {/* Risk badge */}
                  <span
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0"
                    style={{ background: rs.bg, border: `1.5px solid ${rs.border}`, color: rs.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: rs.dot }} />
                    {b.risk_level || 'PENDING'}
                  </span>

                  {/* Officer decision */}
                  {ds && (
                    <span
                      className="hidden md:flex px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0"
                      style={{ background: ds.bg, border: `1.5px solid ${ds.border}`, color: ds.color }}
                    >
                      {b.officer_decision}
                    </span>
                  )}

                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#d1d5db' }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Award nudge */}
      {!isCompleted && bidders.length > 0 && canAward && (
        <div className="card px-5 py-3.5 flex items-center justify-between"
          style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe' }}>
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: '#6d28d9' }}>
            <Trophy className="w-4 h-4" />
            All bidders reviewed — ready to record the Award Decision
          </div>
          <button onClick={onAwardDecision} className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
            Award Decision <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

