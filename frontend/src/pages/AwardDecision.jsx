import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy, ArrowLeft, CheckCircle2, XCircle, HelpCircle,
  ShieldAlert, AlertTriangle, Save, Loader2, Ban
} from 'lucide-react';

const BASE = '/api';

const RISK_STYLE = {
  LOW:      { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  MEDIUM:   { color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  HIGH:     { color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  CRITICAL: { color: '#9f1239', bg: '#fff1f2', border: '#fda4af' },
  PENDING:  { color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
};

const DECISION_ICON = {
  QUALIFIED:             { Icon: CheckCircle2, color: '#15803d' },
  DISQUALIFIED:          { Icon: XCircle,      color: '#991b1b' },
  REQUEST_CLARIFICATION: { Icon: HelpCircle,   color: '#92400e' },
};

export default function AwardDecision({ tenderId, tenderTitle, onBack, onComplete, showToast }) {
  const [bidders, setBidders]   = useState([]);
  const [tender, setTender]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [winner, setWinner]     = useState(null); // bidderId or 'NONE'
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, bRes] = await Promise.all([
        fetch(`${BASE}/tenders/${tenderId}`),
        fetch(`${BASE}/tenders/${tenderId}/bidders`),
      ]);
      if (tRes.ok) {
        const t = await tRes.json();
        setTender(t);
        if (t.winner_bidder_id) setWinner(t.winner_bidder_id);
        if (t.award_notes)      setNotes(t.award_notes);
      }
      if (bRes.ok) setBidders(await bRes.json());
    } catch {}
    setLoading(false);
  }, [tenderId]);

  useEffect(() => { load(); }, [load]);

  const handleAward = async () => {
    if (!winner) {
      showToast?.('Select Winner', 'Pick a bidder or "No Award" before saving.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/tenders/${tenderId}/award`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winner_bidder_id: winner === 'NONE' ? null : winner,
          award_notes: notes,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Award failed');
      setSaving(false);
      onComplete?.();
    } catch (err) {
      setSaving(false);
      showToast?.('Award Failed', err.message, 'error');
    }
  };

  const isCompleted = tender?.status === 'COMPLETED';

  if (loading) return (
    <div className="p-8 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
    </div>
  );

  const scoreSorted = [...bidders].sort((a, b) => (b.compliance_score || 0) - (a.compliance_score || 0));

  return (
    <div className="p-6 space-y-5">

      {/* ── Page Header ── */}
      <div className="card px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{ borderTop: '4px solid #7c3aed' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-purple-600" />
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}>
              {tenderId}
            </span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Award Decision</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
            {tenderTitle || tender?.title} · Review all bids and record the final award
          </p>
        </div>
        <button onClick={onBack} className="btn-secondary px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Bidders
        </button>
      </div>

      {/* Already completed banner */}
      {isCompleted && (
        <div className="rounded-xl px-5 py-4 flex items-center gap-3"
          style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe' }}>
          <Trophy className="w-5 h-5 text-purple-500 shrink-0" />
          <div>
            <div className="text-sm font-bold" style={{ color: '#7c3aed' }}>Tender Already Completed</div>
            <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {tender?.winner_bidder_id
                ? `Awarded to: ${bidders.find(b => b.id === tender.winner_bidder_id)?.company_name || tender.winner_bidder_id}`
                : 'No award was given'}
              {tender?.award_notes && ` · ${tender.award_notes}`}
            </div>
          </div>
        </div>
      )}

      {/* ── Bidder Comparison Table ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: '#f7f8fa', borderBottom: '1px solid #e5e7eb' }}>
          <h2 className="text-sm font-bold" style={{ color: '#111827' }}>
            Side-by-Side Bidder Comparison
          </h2>
          <span className="text-xs" style={{ color: '#9ca3af' }}>
            {bidders.length} submissions · Sorted by compliance score
          </span>
        </div>

        {bidders.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm" style={{ color: '#9ca3af' }}>No bidders in this tender yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-fenco">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Bidder</th>
                  <th>Identifiers</th>
                  <th className="text-center">Score</th>
                  <th className="text-center">Risk</th>
                  <th className="text-center">Officer Decision</th>
                  <th>Verification Status</th>
                </tr>
              </thead>
              <tbody>
                {scoreSorted.map(b => {
                  const rs = RISK_STYLE[b.risk_level] || RISK_STYLE.PENDING;
                  const di = b.officer_decision ? DECISION_ICON[b.officer_decision] : null;
                  const isWinner = winner === b.id;
                  const scoreColor = (b.compliance_score || 0) >= 75 ? '#15803d'
                    : (b.compliance_score || 0) >= 50 ? '#d97706' : '#dc2626';
                  return (
                    <tr
                      key={b.id}
                      className="cursor-pointer"
                      onClick={() => !isCompleted && setWinner(b.id)}
                      style={isWinner ? { background: '#f5f3ff' } : {}}
                    >
                      <td className="text-center w-12">
                        <div
                          className="w-5 h-5 rounded-full mx-auto flex items-center justify-center transition-all"
                          style={{
                            border: `2px solid ${isWinner ? '#7c3aed' : '#d1d5db'}`,
                            background: isWinner ? '#7c3aed' : 'transparent',
                          }}
                        >
                          {isWinner && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                            style={{ background: rs.color, boxShadow: isWinner ? `0 4px 12px ${rs.color}40` : 'none' }}
                          >
                            {b.company_name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold" style={{ color: '#111827' }}>{b.company_name}</div>
                            <div className="text-[10px] font-mono" style={{ color: '#9ca3af' }}>{b.id}</div>
                          </div>
                        </div>
                        {isWinner && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed' }}>
                            <Trophy className="w-2.5 h-2.5" /> Selected as Winner
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="text-[11px] font-mono" style={{ color: '#6b7280' }}>
                          {b.pan && <div>PAN: {b.pan}</div>}
                          {b.gstin && <div>GST: {b.gstin}</div>}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="font-black text-xl" style={{ color: scoreColor }}>
                          {b.compliance_score ? b.compliance_score.toFixed(0) : '—'}
                        </div>
                        <div className="text-[9px]" style={{ color: '#d1d5db' }}>/100</div>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: rs.bg, border: `1.5px solid ${rs.border}`, color: rs.color }}>
                          {b.risk_level || 'PENDING'}
                        </span>
                      </td>
                      <td className="text-center">
                        {di ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold"
                            style={{ color: di.color }}>
                            <di.Icon className="w-4 h-4" />
                            {b.officer_decision.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: '#d1d5db' }}>Not set</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className="w-24 h-1.5 rounded-full progress-track overflow-hidden">
                            <div style={{
                              width: `${b.verification_progress || 0}%`,
                              background: '#3b82f6', height: '100%', borderRadius: 999
                            }} />
                          </div>
                          <span className="text-[10px]" style={{ color: '#9ca3af' }}>
                            {(b.verification_progress || 0).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Award Form ── */}
      {!isCompleted && (
        <div className="card p-5 space-y-4" style={{ borderTop: '3px solid #7c3aed' }}>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#111827' }}>
            <Trophy className="w-4 h-4 text-purple-600" />
            Record Final Award Decision
          </h2>

          {/* No Award option */}
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all"
            style={{
              background: winner === 'NONE' ? '#fef2f2' : '#f7f8fa',
              border: `1.5px solid ${winner === 'NONE' ? '#fecaca' : '#e5e7eb'}`,
            }}
            onClick={() => setWinner('NONE')}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{
                border: `2px solid ${winner === 'NONE' ? '#dc2626' : '#d1d5db'}`,
                background: winner === 'NONE' ? '#dc2626' : 'transparent',
              }}
            >
              {winner === 'NONE' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <Ban className="w-4 h-4 shrink-0" style={{ color: winner === 'NONE' ? '#dc2626' : '#9ca3af' }} />
            <div>
              <div className="text-xs font-bold" style={{ color: winner === 'NONE' ? '#991b1b' : '#374151' }}>
                No Award — Cancel Tender
              </div>
              <div className="text-[10px]" style={{ color: '#9ca3af' }}>
                No bidder meets requirements; tender marked closed without a winner
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
              Award Justification / Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Record official procurement justification for this award decision…"
              className="form-input w-full px-3 py-2.5 text-sm"
            />
          </div>

          {/* Confirm & warning */}
          {winner && winner !== 'NONE' && (
            <div className="p-3.5 rounded-xl"
              style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe' }}>
              <div className="flex items-center gap-2 text-xs font-bold mb-1" style={{ color: '#7c3aed' }}>
                <Trophy className="w-4 h-4" />
                Award will be given to:
              </div>
              <div className="text-sm font-bold" style={{ color: '#111827' }}>
                {bidders.find(b => b.id === winner)?.company_name || winner}
                <span className="text-xs font-normal ml-2" style={{ color: '#9ca3af' }}>({winner})</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-2 text-[11px]" style={{ color: '#9ca3af' }}>
              <ShieldAlert className="w-3.5 h-3.5" />
              This action is final. Tender will be marked <strong>COMPLETED</strong>.
            </div>
            <button
              id="confirm-award-btn"
              onClick={handleAward}
              disabled={saving || !winner}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs flex items-center gap-2"
              style={{ opacity: !winner ? 0.5 : 1 }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Recording…' : 'Confirm & Record Award'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

