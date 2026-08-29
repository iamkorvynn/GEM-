import React, { useState, useEffect, useCallback } from 'react';
import OfficerDecisionPanel from '../components/decision/OfficerDecisionPanel';
import { ArrowLeft } from 'lucide-react';

const TABS = ['Documents', 'Overview', 'Verification Detail', 'Audit Log', 'Officer Decision'];

const RISK = {
  LOW:      { label: 'LOW RISK',      color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e', topBorder: '#22c55e' },
  MEDIUM:   { label: 'MEDIUM RISK',   color: '#92400e', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', topBorder: '#f59e0b' },
  HIGH:     { label: 'HIGH RISK',     color: '#991b1b', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444', topBorder: '#ef4444' },
  CRITICAL: { label: 'CRITICAL RISK', color: '#9f1239', bg: '#fff1f2', border: '#fda4af', dot: '#f43f5e', topBorder: '#f43f5e' },
  PENDING:  { label: 'PENDING',       color: '#475569', bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8', topBorder: '#94a3b8' },
};

const CHK = {
  PASS:    { cls: 'check-row-pass',    icon: '✓', color: '#15803d' },
  FAIL:    { cls: 'check-row-fail',    icon: '✗', color: '#991b1b' },
  FLAGGED: { cls: 'check-row-flagged', icon: '⚠', color: '#92400e' },
};

const BASE = '/api';

export default function BidderProfile({ bidderId, bidderName, tenderId, tenderTitle, onBack, onRunVerificationTrigger, showToast }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [bidder, setBidder] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [confirmingDoc, setConfirmingDoc] = useState(null);
  const [confirmFields, setConfirmFields] = useState({});

  const load = useCallback(async () => {
    if (!bidderId) return;
    setLoading(true);
    try {
      const [bR, dR, aR] = await Promise.all([
        fetch(`${BASE}/bidders/${bidderId}`),
        fetch(`${BASE}/bidders/${bidderId}/dashboard`),
        fetch(`${BASE}/bidders/${bidderId}/audit-log`),
      ]);
      if (bR.ok) setBidder(await bR.json());
      if (dR.ok) setDashboard(await dR.json());
      if (aR.ok) setAuditLog(await aR.json());
    } catch {}
    setLoading(false);
  }, [bidderId]);

  useEffect(() => { load(); setActiveTab('Overview'); setSelectedCheck(null); }, [load]);

  const runVerify = async () => {
    setVerifying(true);
    onRunVerificationTrigger?.();
    try {
      const res = await fetch(`${BASE}/bidders/${bidderId}/verify`, { method: 'POST' });
      if (!res.ok) throw new Error('Verification failed');
      await load();
      showToast?.('Verification Complete', 'Track A + B + C finished. Risk verdict updated.', 'success');
      setActiveTab('Overview');
    } catch (e) { showToast?.('Error', e.message, 'error'); }
    setVerifying(false);
  };

  const startConfirm = doc => {
    const base = doc.confirmed_fields || doc.extracted_fields || {};
    setConfirmFields(typeof base === 'string' ? JSON.parse(base) : (base || {}));
    setConfirmingDoc(doc);
  };

  const submitConfirm = async () => {
    if (!confirmingDoc) return;
    try {
      const res = await fetch(`${BASE}/documents/${confirmingDoc.id}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed_fields: confirmFields, officer_id: 'procurement.officer@demo.gov.in' }),
      });
      if (!res.ok) throw new Error('Confirmation failed');
      await load();
      setConfirmingDoc(null);
      showToast?.('Fields Confirmed', `Extraction locked for ${confirmingDoc.file_name}`, 'success');
    } catch (e) { showToast?.('Error', e.message, 'error'); }
  };

  const riskStyle = RISK[bidder?.risk_level] || RISK.PENDING;
  const allConfirmed = bidder?.documents?.length > 0 && bidder.documents.every(d => d.confirmed_fields);

  if (loading) return (
    <div className="p-8 space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)}
    </div>
  );

  if (!bidder) return (
    <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#9ca3af' }}>
      No bidder selected. Pick one from the topbar or Demo Launcher.
    </div>
  );

  // ── Bidder Header ──
  return (
    <div className="flex flex-col h-full">

      {/* Back button + header */}
      <div
        className="px-6 pt-5 pb-0"
        style={{
          background: riskStyle.bg,
          borderBottom: `2px solid ${riskStyle.border}`,
          borderTop: `4px solid ${riskStyle.topBorder}`,
        }}
      >
        {/* Back nav row */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs mb-3 transition-all font-medium"
            style={{ color: '#6b7280' }}
            onMouseEnter={e => e.currentTarget.style.color = '#111827'}
            onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {tenderTitle || tenderId || 'Bidder List'}
          </button>
        )}
        <div className="flex items-start justify-between gap-6 mb-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: riskStyle.dot }} />
              <h1 className="text-xl font-bold leading-tight" style={{ color: '#111827' }}>{bidder.company_name}</h1>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: riskStyle.bg, border: `1.5px solid ${riskStyle.border}`, color: riskStyle.color }}
              >
                {riskStyle.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] flex-wrap" style={{ color: '#9ca3af' }}>
              <span>PAN: <span className="font-mono font-semibold" style={{ color: '#374151' }}>{bidder.pan || '—'}</span></span>
              <span>GSTIN: <span className="font-mono font-semibold" style={{ color: '#374151' }}>{bidder.gstin || '—'}</span></span>
              <span>Tender: <span style={{ color: '#374151' }}>{bidder.tender_id}</span></span>
              {bidder.incorporation_date && <span>Incorporated: <span style={{ color: '#374151' }}>{bidder.incorporation_date}</span></span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-black" style={{ color: riskStyle.color }}>
              {bidder.compliance_score?.toFixed(0) ?? '—'}
              <span className="text-sm font-normal" style={{ color: '#9ca3af' }}>/100</span>
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>Compliance Score</div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1">
          {TABS.map(tab => {
            const active = activeTab === tab;
            const failCount = tab === 'Overview' && dashboard?.fail_count;
            const flagCount = tab === 'Overview' && dashboard?.flagged_count;
            return (
              <button
                key={tab}
                id={`tab-${tab.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setActiveTab(tab)}
                className="relative px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5"
                style={active
                  ? { background: '#ffffff', color: riskStyle.color, borderTop: `2px solid ${riskStyle.topBorder}`, borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', marginBottom: '-2px' }
                  : { color: '#9ca3af', background: 'transparent' }
                }
              >
                {tab}
                {flagCount > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#92400e' }}>{flagCount}</span>}
                {failCount > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: '#fee2e2', color: '#991b1b' }}>{failCount}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto" style={{ background: '#f0f2f5' }}>

        {/* DOCUMENTS */}
        {activeTab === 'Documents' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Submitted Documents</h2>
              {!allConfirmed && bidder.documents.length > 0 && (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full badge-amber">
                  Confirm all extractions before running verification
                </span>
              )}
            </div>

            {bidder.documents.length === 0 && (
              <div className="text-center py-16" style={{ color: '#9ca3af' }}>
                <div className="text-5xl mb-3 opacity-20">📄</div>
                <p>No documents uploaded yet.</p>
              </div>
            )}

            {bidder.documents.map(doc => {
              const confirmed = !!doc.confirmed_fields;
              const fields = doc.confirmed_fields || doc.extracted_fields || {};
              return (
                <div key={doc.id} className="card overflow-hidden animate-fade-up">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #e5e7eb', background: '#f7f8fa' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: confirmed ? '#22c55e' : '#f59e0b' }} />
                      <span className="text-sm font-semibold" style={{ color: '#111827' }}>{doc.file_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#6b7280' }}>
                        {doc.doc_type || doc.classified_type || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={confirmed
                          ? { background: '#dcfce7', border: '1.5px solid #bbf7d0', color: '#15803d' }
                          : { background: '#fef3c7', border: '1.5px solid #fde68a', color: '#92400e' }}
                      >
                        {confirmed ? '✓ CONFIRMED' : '⏳ AWAITING CONFIRMATION'}
                      </span>
                      {!confirmed && (
                        <button id={`confirm-${doc.id}`} onClick={() => startConfirm(doc)} className="btn-primary px-3 py-1.5 rounded-lg text-xs">
                          Review & Confirm
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Fields grid */}
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>
                      {confirmed ? 'Confirmed Fields' : 'Extracted Fields (Pending Confirmation)'}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(fields).map(([k, v]) => (
                        <div key={k} className="card-inner px-3 py-2">
                          <div className="text-[10px] capitalize mb-0.5" style={{ color: '#9ca3af' }}>{k.replace(/_/g, ' ')}</div>
                          <div className="text-sm font-medium break-all" style={{ color: '#111827' }}>{String(v)}</div>
                        </div>
                      ))}
                      {Object.keys(fields).length === 0 && <p className="text-xs col-span-3" style={{ color: '#9ca3af' }}>No fields extracted.</p>}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Run Verification */}
            <div className="pt-2">
              <button
                id="run-verification-btn"
                onClick={runVerify}
                disabled={verifying}
                className="btn-primary w-full py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Running 3-Track Verification…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Run AI Verification — Track A (Exact) + B (Fuzzy) + C (Correlation)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* OVERVIEW */}
        {activeTab === 'Overview' && (
          <div className="p-6 space-y-5">
            {/* Risk Verdict Banner */}
            {dashboard && (
              <div
                className="rounded-2xl p-5 animate-fade-up"
                style={{ background: riskStyle.bg, border: `1.5px solid ${riskStyle.border}` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>Overall Risk Verdict</div>
                    <div className="text-4xl font-black" style={{ color: riskStyle.color }}>{dashboard.risk_level}</div>
                    <div className="text-sm mt-1" style={{ color: '#6b7280' }}>{dashboard.company_name} — {dashboard.overall_status?.replace(/_/g, ' ')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black" style={{ color: '#111827' }}>{dashboard.compliance_score?.toFixed(0)}</div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>/ 100</div>
                  </div>
                </div>
                <div className="flex gap-5 mt-4 pt-4 text-sm font-semibold" style={{ borderTop: `1px solid ${riskStyle.border}` }}>
                  <span style={{ color: '#15803d' }}>✓ {dashboard.pass_count} Pass</span>
                  <span style={{ color: '#991b1b' }}>✗ {dashboard.fail_count} Fail</span>
                  <span style={{ color: '#92400e' }}>⚠ {dashboard.flagged_count} Flagged</span>
                  <span className="ml-auto text-[11px]" style={{ color: '#9ca3af' }}>{dashboard.total_checks} checks total</span>
                </div>
              </div>
            )}

            {(!dashboard || dashboard.checklist?.length === 0) && (
              <div className="text-center py-16" style={{ color: '#9ca3af' }}>
                <div className="text-5xl mb-3 opacity-20">🛡</div>
                <p className="mb-3">No verification checks run yet.</p>
                <button onClick={() => setActiveTab('Documents')} className="text-sm text-blue-600 hover:text-blue-800 underline transition">
                  Go to Documents to run verification →
                </button>
              </div>
            )}

            {dashboard?.checklist?.length > 0 && (
              <div className="space-y-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
                {['CORRELATION', 'FUZZY', 'EXACT'].map(trackType => {
                  const items = dashboard.checklist.filter(c => c.check_type === trackType);
                  if (!items.length) return null;
                  const label = {
                    CORRELATION: '🔗 Track C — Cross-Document Correlation',
                    FUZZY:       '🔍 Track B — Fuzzy Blacklist (Jaro-Winkler)',
                    EXACT:       '✓ Track A — Exact Registry Checks',
                  }[trackType];
                  return (
                    <div key={trackType}>
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>{label}</div>
                      <div className="space-y-2">
                        {items.map((chk, i) => {
                          const c = CHK[chk.result] || CHK.PASS;
                          return (
                            <button
                              key={i}
                              id={`chk-${trackType}-${i}`}
                              onClick={() => { setSelectedCheck(chk); setActiveTab('Verification Detail'); }}
                              className={`${c.cls} w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all group`}
                            >
                              <span className="text-lg font-bold w-5 shrink-0 mt-0.5" style={{ color: c.color }}>{c.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-semibold" style={{ color: '#111827' }}>{chk.module.replace(/_/g, ' ')}</span>
                                  <span className="text-[10px] ml-auto" style={{ color: '#9ca3af' }}>{chk.check_type}</span>
                                </div>
                                <p className="text-xs line-clamp-2" style={{ color: '#6b7280' }}>{chk.reason}</p>
                              </div>
                              <svg className="w-4 h-4 shrink-0 mt-1 transition" style={{ color: '#d1d5db' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VERIFICATION DETAIL */}
        {activeTab === 'Verification Detail' && (
          <div className="p-6">
            {!selectedCheck && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9ca3af' }}>Select a flagged/failed check to inspect:</h2>
                {(dashboard?.checklist || []).filter(c => c.result !== 'PASS').map((chk, i) => {
                  const c = CHK[chk.result] || CHK.PASS;
                  return (
                    <button key={i} onClick={() => setSelectedCheck(chk)} className={`${c.cls} w-full flex items-start gap-3 p-4 rounded-xl text-left`}>
                      <span className="text-lg font-bold" style={{ color: c.color }}>{c.icon}</span>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: '#111827' }}>{chk.module.replace(/_/g, ' ')}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{chk.reason}</div>
                      </div>
                    </button>
                  );
                })}
                {(dashboard?.checklist || []).filter(c => c.result !== 'PASS').length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="font-semibold" style={{ color: '#15803d' }}>All checks passed — no issues to inspect</p>
                  </div>
                )}
              </div>
            )}

            {selectedCheck && (() => {
              const c = CHK[selectedCheck.result] || CHK.PASS;
              return (
                <div className="max-w-2xl animate-fade-up">
                  <button onClick={() => setSelectedCheck(null)} className="flex items-center gap-1.5 text-xs mb-6 transition" style={{ color: '#9ca3af' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#111827'} onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to all checks
                  </button>

                  {/* Verdict Card */}
                  <div
                    className="rounded-2xl p-6 mb-5"
                    style={{
                      background: c.color === '#15803d' ? '#f0fdf4' : c.color === '#92400e' ? '#fffbeb' : '#fef2f2',
                      border: `1.5px solid ${c.color === '#15803d' ? '#bbf7d0' : c.color === '#92400e' ? '#fde68a' : '#fecaca'}`,
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-4xl">{c.icon}</div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: c.color }}>
                          {selectedCheck.check_type} — {selectedCheck.result}
                        </div>
                        <div className="text-xl font-bold" style={{ color: '#111827' }}>{selectedCheck.module.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{selectedCheck.reason}</p>
                  </div>

                  {/* Evidence */}
                  {selectedCheck.source_fields && Object.keys(selectedCheck.source_fields).length > 0 && (
                    <div className="card p-5">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#9ca3af' }}>Evidence — Fields That Drove This Check</h3>
                      <div className="space-y-2">
                        {Object.entries(selectedCheck.source_fields).map(([k, v]) => (
                          <div key={k} className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <span className="text-[11px] w-48 shrink-0 font-mono capitalize pt-0.5" style={{ color: '#9ca3af' }}>{k.replace(/_/g, ' ')}</span>
                            <span className="text-sm font-medium break-all" style={{ color: '#111827' }}>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 px-4 py-3 rounded-xl text-xs card-inner" style={{ color: '#9ca3af' }}>
                    <span className="font-semibold" style={{ color: '#6b7280' }}>Checked:</span> {new Date(selectedCheck.checked_at).toLocaleString()}
                    <span className="ml-4 font-semibold" style={{ color: '#6b7280' }}>Type:</span> {selectedCheck.check_type}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* AUDIT LOG */}
        {activeTab === 'Audit Log' && (
          <div className="p-6 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9ca3af' }}>
              Audit Trail — {bidder.company_name}
            </h2>
            {auditLog.length === 0 && <div className="text-center py-16" style={{ color: '#9ca3af' }}>No audit events recorded yet.</div>}
            {auditLog.map((e, i) => {
              const isGood = ['SUCCESS', 'LOW', 'QUALIFIED', 'VERIFIED'].includes(e.result);
              const isBad  = ['HIGH', 'FAILED', 'CRITICAL', 'DISQUALIFIED'].includes(e.result);
              const color  = isGood ? '#15803d' : isBad ? '#991b1b' : '#92400e';
              const bg     = isGood ? '#dcfce7' : isBad ? '#fee2e2' : '#fef3c7';
              const border = isGood ? '#bbf7d0' : isBad ? '#fecaca' : '#fde68a';
              return (
                <div key={i} className="card flex gap-4 p-4 animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: '#111827' }}>{e.action?.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ background: bg, border: `1px solid ${border}`, color }}>
                        {e.result}
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: '#9ca3af' }}>{new Date(e.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{e.details}</div>
                    <div className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>Source: {e.source} · {e.actor}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* OFFICER DECISION */}
        {activeTab === 'Officer Decision' && (
          <div className="p-6">
            <OfficerDecisionPanel bidder={bidder} onDecisionSaved={load} />
          </div>
        )}
      </div>

      {/* ── Confirm Fields Modal ── */}
      {confirmingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div
            className="card w-full max-w-xl max-h-[80vh] flex flex-col animate-fade-up"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.15)', borderTop: '4px solid #3b82f6' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#111827' }}>Review & Confirm Extracted Fields</h3>
                <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{confirmingDoc.file_name}</p>
              </div>
              <button onClick={() => setConfirmingDoc(null)} className="btn-secondary p-2 rounded-xl">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              <div className="text-xs p-3 rounded-xl flex gap-2" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', color: '#1d4ed8' }}>
                <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Human-in-the-loop checkpoint — edit any field before confirming. Nothing is verified until you confirm.
              </div>
              {Object.entries(confirmFields).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>{k.replace(/_/g, ' ')}</label>
                  <input
                    type="text"
                    value={String(v)}
                    onChange={e => setConfirmFields(f => ({ ...f, [k]: e.target.value }))}
                    className="form-input px-3 py-2 text-sm w-full"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #e5e7eb' }}>
              <button onClick={() => setConfirmingDoc(null)} className="btn-secondary flex-1 py-2.5 rounded-xl text-sm">Cancel</button>
              <button id="confirm-fields-submit" onClick={submitConfirm} className="btn-primary flex-1 py-2.5 rounded-xl text-sm">
                ✓ Confirm Fields
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

