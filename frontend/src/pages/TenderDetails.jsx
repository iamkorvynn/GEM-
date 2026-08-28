import React, { useEffect, useState } from 'react';
import {
  FileText, Sparkles, CheckCircle2, ShieldCheck, ArrowRight,
  Database, Layers, FileCode, Check, Play, RefreshCw, AlertCircle
} from 'lucide-react';
import { fetchTenderDetails, analyzeTender } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

export default function TenderDetails({ tenderId, onProceedToBidders }) {
  const [tender, setTender] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeStep, setActiveStep] = useState(6); // Default completed

  const analysisSteps = [
    { step: 1, name: 'Reading tender document' },
    { step: 2, name: 'Extracting eligibility clauses' },
    { step: 3, name: 'Identifying mandatory requirements' },
    { step: 4, name: 'Identifying conditional requirements' },
    { step: 5, name: 'Mapping verification sources' },
    { step: 6, name: 'Building compliance matrix' }
  ];

  useEffect(() => {
    fetchTenderDetails(tenderId)
      .then(setTender)
      .catch((err) => console.error(err));
  }, [tenderId]);

  const handleRunAnalysis = () => {
    setAnalyzing(true);
    setActiveStep(1);

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= 6) {
          clearInterval(interval);
          setAnalyzing(false);
          return 6;
        }
        return prev + 1;
      });
    }, 600);
  };

  if (!tender) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 relative z-1">
      {/* Header Info Banner */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden space-y-4"
        style={{
          background: 'rgba(8,14,30,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 40px rgba(59,130,246,0.06)',
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: 'linear-gradient(180deg, #3b82f6, #6366f1)' }} />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-2">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
              <span className="font-mono font-bold text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-800/50">
                {tender.id}
              </span>
              <span>•</span>
              <span className="text-slate-400">{tender.department}</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">{tender.title}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">{tender.description}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="btn-glass-ghost px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-blue-400' : ''}`} />
              <span>{analyzing ? 'Re-analyzing Clauses...' : 'Re-run AI Extraction'}</span>
            </button>

            <button
              onClick={() => onProceedToBidders(tender.id)}
              className="btn-glass-primary px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>View Bidder Submissions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Key Tender Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/[0.06] text-xs pl-2">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Created Date</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{tender.created_date}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Submission Deadline</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{tender.deadline}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Estimated Value</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{tender.estimated_cost}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Extracted Criteria</span>
            <span className="font-bold text-emerald-400 mt-0.5 block">{tender.requirements?.length || 0} Rule Items</span>
          </div>
        </div>
      </div>

      {/* AI Extraction Progress Sequence */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'rgba(8,14,30,0.80)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              AI Tender Document Extraction Pipeline
            </h2>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold px-2.5 py-0.5 rounded-lg border border-emerald-500/30" style={{ background: 'rgba(16,185,129,0.12)' }}>
            {activeStep === 6 ? '100% Extraction Complete' : `Processing Step ${activeStep}/6...`}
          </span>
        </div>

        {/* Step Sequence */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {analysisSteps.map((s) => {
            const isDone = s.step <= activeStep;
            return (
              <div
                key={s.step}
                className="p-3 rounded-xl border text-xs flex flex-col justify-between transition-all"
                style={{
                  background: isDone ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                  borderColor: isDone ? 'rgba(16,185,129,0.30)' : 'rgba(255,255,255,0.06)',
                  color: isDone ? '#e2e8f0' : '#64748b'
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold text-slate-500">0{s.step}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </div>
                <div className="font-semibold leading-tight text-[11px]">{s.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extracted Requirements Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(8,14,30,0.80)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}
      >
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" /> Extracted Compliance Requirements Matrix
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {tender.requirements?.length || 0} Configured Criteria Rules
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th className="py-3.5 px-4">REQ ID</th>
                <th className="py-3.5 px-4">Requirement Title</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Evidence Type</th>
                <th className="py-3.5 px-4">Verification Source</th>
                <th className="py-3.5 px-4">Rule Logic</th>
                <th className="py-3.5 px-4">Clause Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {tender.requirements?.map((req) => (
                <tr key={req.id} className="hover:bg-white/[0.025] transition-colors">
                  <td className="py-4 px-4 font-bold font-mono text-blue-400">
                    {req.id}
                  </td>
                  <td className="py-4 px-4 font-semibold text-white">
                    <div>{req.title}</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">{req.description}</div>
                  </td>
                  <td className="py-4 px-4">
                    {req.is_mandatory ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-400 border border-rose-500/30" style={{ background: 'rgba(244,63,94,0.10)' }}>
                        Mandatory
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-400 border border-amber-500/30" style={{ background: 'rgba(245,158,11,0.10)' }}>
                        Conditional
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-300">
                    {req.evidence_type}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-blue-300 border border-blue-500/30 font-mono" style={{ background: 'rgba(59,130,246,0.12)' }}>
                      {req.verification_source}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-[11px] text-slate-400">
                    {req.rule_type === 'ACTIVE' && 'Status == ACTIVE'}
                    {req.rule_type === 'VALID' && 'Status == VALID'}
                    {req.rule_type === 'REQUIRED' && 'Document Exists == true'}
                    {req.rule_type === 'THRESHOLD' && `Local Content >= ${req.threshold_value}%`}
                    {req.rule_type === 'EXACT_MATCH' && 'Debarment Match == false'}
                    {req.rule_type === 'VALID_DATE' && 'Expiry Date > Current'}
                  </td>
                  <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                    {req.clause_reference || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
