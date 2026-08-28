import React, { useState, useEffect, useCallback } from 'react';

const TABS = ['Documents', 'Overview', 'Verification Detail', 'Audit Log'];

const RISK = {
  LOW:      { text: 'text-emerald-300', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)', glow: '0 0 40px rgba(16,185,129,0.12)', dot: '#10b981' },
  MEDIUM:   { text: 'text-amber-300',   bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', glow: '0 0 40px rgba(245,158,11,0.12)', dot: '#f59e0b' },
  HIGH:     { text: 'text-red-300',     bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  glow: '0 0 40px rgba(239,68,68,0.12)',  dot: '#ef4444' },
  CRITICAL: { text: 'text-red-200',     bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  glow: '0 0 50px rgba(239,68,68,0.18)',  dot: '#ef4444' },
  PENDING:  { text: 'text-slate-400',   bg: 'rgba(100,116,139,0.08)',border: 'rgba(100,116,139,0.20)',glow: 'none',                           dot: '#64748b' },
};

const CHK = {
  PASS:    { cls: 'check-row-pass',    icon: '✓', color: '#10b981' },
  FAIL:    { cls: 'check-row-fail',    icon: '✗', color: '#ef4444' },
  FLAGGED: { cls: 'check-row-flagged', icon: '⚠', color: '#f59e0b' },
};

const BASE = 'http://127.0.0.1:8000/api';

export default function BidderProfile({ bidderId, onRunVerificationTrigger, showToast }) {
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
    <div className="flex items-center justify-center h-64 text-slate-600 text-sm">
      No bidder selected. Pick one from the topbar or Demo Launcher.
    </div>
  );

  return (
    <div className="flex flex-col h-full relative z-1">

      {/* ── Bidder Header ── */}
      <div
        className="px-6 pt-6 pb-0 relative"
        style={{ background: `${riskStyle.bg}`, borderBottom: `1px solid ${riskStyle.border}`, boxShadow: riskStyle.glow }}
      >
        {/* Top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${riskStyle.dot}40, transparent)` }} />

        <div className="flex items-start justify-between gap-6 mb-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: riskStyle.dot }} />
              <h1 className="text-xl font-bold text-white leading-tight">{bidder.company_name}</h1>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: riskStyle.bg, border: `1px solid ${riskStyle.border}`, color: riskStyle.dot }}
              >
                {bidder.risk_level || 'PENDING'} RISK
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
              <span>PAN: <span className="font-mono text-slate-300">{bidder.pan || '—'}</span></span>
              <span>GSTIN: <span className="font-mono text-slate-300">{bidder.gstin || '—'}</span></span>
              <span>Tender: <span className="text-slate-400">{bidder.tender_id}</span></span>
              {bidder.incorporation_date && <span>Incorporated: <span className="text-slate-400">{bidder.incorporation_date}</span></span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-black text-white">{bidder.compliance_score?.toFixed(0) ?? '—'}<span className="text-sm font-normal text-slate-500">/100</span></div>
            <div className="text-[10px] text-slate-500 mt-0.5">Compliance Score</div>
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
                  ? { background: 'rgba(14,22,40,0.75)', backdropFilter: 'blur(12px)', color: '#e2e8f0', border: `1px solid ${riskStyle.border}`, borderBottom: 'none', marginBottom: '-1px' }
                  : { color: '#475569', background: 'transparent', border: '1px solid transparent' }
                }
              >
                {tab}
                {flagCount > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.25)', color: '#fcd34d' }}>{flagCount}</span>}
                {failCount > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5' }}>{failCount}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* DOCUMENTS */}
        {activeTab === 'Documents' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Submitted Documents</h2>
              {!allConfirmed && bidder.documents.length > 0 && (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fcd34d' }}>
                  Confirm all extractions before running verification
                </span>
              )}
            </div>

            {bidder.documents.length === 0 && (
              <div className="text-center py-16 text-slate-600">
                <div className="text-5xl mb-3 opacity-20">📄</div>
                <p>No documents uploaded yet.</p>
              </div>
            )}

            {bidder.documents.map(doc => {
              const confirmed = !!doc.confirmed_fields;
              const fields = doc.confirmed_fields || doc.extracted_fields || {};
              return (
                <div key={doc.id} className="glass rounded-2xl overflow-hidden animate-fade-up" style={{ boxShadow: confirmed ? '0 0 20px rgba(16,185,129,0.06)' : '0 0 20px rgba(245,158,11,0.06)' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: confirmed ? '#10b981' : '#f59e0b' }} />
                      <span className="text-sm font-semibold text-white">{doc.file_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md text-slate-500" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {doc.doc_type || doc.classified_type || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={confirmed
                          ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', color: '#6ee7b7' }
                          : { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', color: '#fcd34d' }
                        }
                      >
                        {confirmed ? '✓ CONFIRMED' : '⏳ AWAITING CONFIRMATION'}
                      </span>
                      {!confirmed && (
                        <button
                          id={`confirm-${doc.id}`}
                          onClick={() => startConfirm(doc)}
                          className="btn-glass-primary px-3 py-1.5 rounded-lg text-xs"
                        >
                          Review & Confirm
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Fields grid */}
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
                      {confirmed ? 'Confirmed Fields' : 'Extracted Fields (Pending Confirmation)'}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(fields).map(([k, v]) => (
                        <div key={k} className="glass-inner px-3 py-2">
                          <div className="text-[10px] text-slate-600 capitalize mb-0.5">{k.replace(/_/g, ' ')}</div>
                          <div className="text-sm text-white font-medium break-all">{String(v)}</div>
                        </div>
                      ))}
                      {Object.keys(fields).length === 0 && <p className="text-xs text-slate-600 col-span-3">No fields extracted.</p>}
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
                className="btn-glass-primary w-full py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2"
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

        {/* OVERVIEW / CHECKLIST */}
        {activeTab === 'Overview' && (
          <div className="p-6 space-y-5">
            {/* Risk Verdict Banner */}
            {dashboard && (
              <div
                className="rounded-2xl p-5 animate-fade-up relative overflow-hidden"
                style={{ background: riskStyle.bg, border: `1px solid ${riskStyle.border}`, boxShadow: riskStyle.glow }}
              >
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${riskStyle.dot}50, transparent)` }} />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Overall Risk Verdict</div>
                    <div className="text-4xl font-black" style={{ color: riskStyle.dot }}>{dashboard.risk_level}</div>
                    <div className="text-sm text-slate-400 mt-1">{dashboard.company_name} — {dashboard.overall_status?.replace(/_/g, ' ')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black text-white">{dashboard.compliance_score?.toFixed(0)}</div>
                    <div className="text-xs text-slate-500">/ 100</div>
                  </div>
                </div>
                <div className="flex gap-5 mt-4 pt-4 text-sm font-semibold" style={{ borderTop: `1px solid ${riskStyle.dot}20` }}>
                  <span className="text-emerald-400">✓ {dashboard.pass_count} Pass</span>
                  <span className="text-red-400">✗ {dashboard.fail_count} Fail</span>
                  <span className="text-amber-400">⚠ {dashboard.flagged_count} Flagged</span>
                  <span className="ml-auto text-[11px] text-slate-600">{dashboard.total_checks} checks total</span>
                </div>
              </div>
            )}

            {/* No checks yet */}
            {(!dashboard || dashboard.checklist?.length === 0) && (
              <div className="text-center py-16 text-slate-600">
                <div className="text-5xl mb-3 opacity-20">🛡</div>
                <p className="mb-3">No verification checks run yet.</p>
                <button onClick={() => setActiveTab('Documents')} className="text-sm text-blue-400 hover:text-blue-300 underline transition">
                  Go to Documents to run verification →
                </button>
              </div>
            )}

            {/* Grouped Checklist */}
            {dashboard?.checklist?.length > 0 && (
              <div className="space-y-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
                {['CORRELATION', 'FUZZY', 'EXACT'].map(trackType => {
                  const items = dashboard.checklist.filter(c => c.check_type === trackType);
                  if (!items.length) return null;
                  const label = {
                    CORRELATION: '🔗 Track C — Cross-Document Correlation',
                    FUZZY: '🔍 Track B — Fuzzy Blacklist (Jaro-Winkler)',
                    EXACT: '✓ Track A — Exact Registry Checks',
                  }[trackType];
                  return (
                    <div key={trackType}>
                      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">{label}</div>
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
                                  <span className="text-sm font-semibold text-white">{chk.module.replace(/_/g, ' ')}</span>
                                  <span className="text-[10px] text-slate-600 ml-auto">{chk.check_type}</span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-2">{chk.reason}</p>
                              </div>
                              <svg className="w-4 h-4 shrink-0 mt-1 text-slate-700 group-hover:text-slate-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* VERIFICATION DETAIL / DRILL-DOWN */}
        {activeTab === 'Verification Detail' && (
          <div className="p-6">
            {!selectedCheck && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Select a flagged/failed check to inspect:</h2>
                {(dashboard?.checklist || []).filter(c => c.result !== 'PASS').map((chk, i) => {
                  const c = CHK[chk.result] || CHK.PASS;
                  return (
                    <button key={i} onClick={() => setSelectedCheck(chk)} className={`${c.cls} w-full flex items-start gap-3 p-4 rounded-xl text-left`}>
                      <span className="text-lg font-bold" style={{ color: c.color }}>{c.icon}</span>
                      <div><div className="font-semibold text-sm text-white">{chk.module.replace(/_/g, ' ')}</div><div className="text-xs text-slate-500 mt-0.5">{chk.reason}</div></div>
                    </button>
                  );
                })}
                {(dashboard?.checklist || []).filter(c => c.result !== 'PASS').length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-emerald-400 font-semibold">All checks passed — no issues to inspect</p>
                  </div>
                )}
              </div>
            )}

            {selectedCheck && (() => {
              const c = CHK[selectedCheck.result] || CHK.PASS;
              return (
                <div className="max-w-2xl animate-fade-up">
                  <button onClick={() => setSelectedCheck(null)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white mb-6 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to all checks
                  </button>

                  {/* Verdict Card */}
                  <div
                    className="rounded-2xl p-6 mb-5 relative overflow-hidden"
                    style={{ background: `${c.color}12`, border: `1px solid ${c.color}30`, boxShadow: `0 0 40px ${c.color}12` }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.color}50, transparent)` }} />
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-4xl">{c.icon}</div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: c.color }}>
                          {selectedCheck.check_type} — {selectedCheck.result}
                        </div>
                        <div className="text-xl font-bold text-white">{selectedCheck.module.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{selectedCheck.reason}</p>
                  </div>

                  {/* Evidence Fields */}
                  {selectedCheck.source_fields && Object.keys(selectedCheck.source_fields).length > 0 && (
                    <div className="glass rounded-2xl p-5">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Evidence — Fields That Drove This Check</h3>
                      <div className="space-y-2">
                        {Object.entries(selectedCheck.source_fields).map(([k, v]) => (
                          <div key={k} className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <span className="text-[11px] text-slate-600 w-48 shrink-0 font-mono capitalize pt-0.5">{k.replace(/_/g, ' ')}</span>
                            <span className="text-sm text-white font-medium break-all">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 px-4 py-3 rounded-xl text-xs text-slate-600 glass-inner">
                    <span className="font-semibold text-slate-500">Checked:</span> {new Date(selectedCheck.checked_at).toLocaleString()}
                    <span className="ml-4 font-semibold text-slate-500">Type:</span> {selectedCheck.check_type}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* AUDIT LOG */}
        {activeTab === 'Audit Log' && (
          <div className="p-6 space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Audit Trail — {bidder.company_name}
            </h2>
            {auditLog.length === 0 && <div className="text-center py-16 text-slate-600">No audit events recorded yet.</div>}
            {auditLog.map((e, i) => {
              const isGood = ['SUCCESS', 'LOW', 'QUALIFIED', 'VERIFIED'].includes(e.result);
              const isBad  = ['HIGH', 'FAILED', 'CRITICAL', 'DISQUALIFIED'].includes(e.result);
              const accent = isGood ? '#10b981' : isBad ? '#ef4444' : '#f59e0b';
              return (
                <div key={i} className="glass rounded-xl flex gap-4 p-4 animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="w-2 h-2 rounded-full mt-2 shrink-0 animate-pulse" style={{ background: accent }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-white">{e.action?.replace(/_/g, ' ')}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ background: `${accent}15`, border: `1px solid ${accent}28`, color: accent }}
                      >
                        {e.result}
                      </span>
                      <span className="text-[10px] text-slate-600 ml-auto">{new Date(e.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">{e.details}</div>
                    <div className="text-[10px] text-slate-600 mt-1">Source: {e.source} · {e.actor}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Confirm Fields Modal ── */}
      {confirmingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div
            className="glass-elevated rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col animate-fade-up"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h3 className="text-sm font-bold text-white">Review & Confirm Extracted Fields</h3>
                <p className="text-xs text-slate-500 mt-0.5">{confirmingDoc.file_name}</p>
              </div>
              <button onClick={() => setConfirmingDoc(null)} className="btn-glass-ghost p-2 rounded-xl">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              <div
                className="text-xs text-blue-300 p-3 rounded-xl flex gap-2"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.20)' }}
              >
                <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Human-in-the-loop checkpoint — edit any field before confirming. Nothing is verified until you confirm.
              </div>
              {Object.entries(confirmFields).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{k.replace(/_/g, ' ')}</label>
                  <input
                    type="text"
                    value={String(v)}
                    onChange={e => setConfirmFields(f => ({ ...f, [k]: e.target.value }))}
                    className="glass-input px-3 py-2 text-sm w-full"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setConfirmingDoc(null)} className="btn-glass-ghost flex-1 py-2.5 rounded-xl text-sm">Cancel</button>
              <button id="confirm-fields-submit" onClick={submitConfirm} className="btn-glass-primary flex-1 py-2.5 rounded-xl text-sm">
                ✓ Confirm Fields
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
