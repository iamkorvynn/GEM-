import React, { useEffect, useState } from 'react';
import {
  FileText, Sparkles, CheckCircle2, ShieldCheck, ArrowRight,
  Database, Layers, FileCode, Check, Play, RefreshCw
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
    return <div className="p-8 text-center text-slate-500">Loading tender requirements...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{tender.id}</span>
              <span>•</span>
              <span>{tender.department}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{tender.title}</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">{tender.description}</p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Re-analyzing Clauses...' : 'Re-run AI Extraction'}</span>
            </button>

            <button
              onClick={() => onProceedToBidders(tender.id)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
            >
              <span>View Bidder Submissions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Key Tender Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Created Date</span>
            <span className="font-semibold text-slate-800">{tender.created_date}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Bid Submission Deadline</span>
            <span className="font-semibold text-slate-800">{tender.deadline}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated Tender Value</span>
            <span className="font-semibold text-slate-800">{tender.estimated_cost}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Extracted Rule Items</span>
            <span className="font-bold text-emerald-600">{tender.requirements.length} Requirements</span>
          </div>
        </div>
      </div>

      {/* AI Requirement Extraction Progress Sequence */}
      <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Tender Document Extraction Pipeline</h2>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800">
            {activeStep === 6 ? '100% Extraction Complete' : `Processing Step ${activeStep}/6...`}
          </span>
        </div>

        {/* Step Progress Sequence */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {analysisSteps.map((s) => {
            const isDone = s.step <= activeStep;
            const isCurrent = s.step === activeStep && analyzing;
            return (
              <div
                key={s.step}
                className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                  isDone
                    ? 'bg-slate-800/80 border-emerald-500/50 text-slate-100'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold text-slate-400">0{s.step}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </div>
                <div className="font-medium leading-tight text-[11px]">{s.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extracted Tender Compliance Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <Layers className="w-4 h-4 mr-2 text-blue-600" /> Extracted Compliance Requirements Matrix
          </h2>
          <span className="text-xs text-slate-500">
            {tender.requirements.length} Configured Criteria Rules
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-200 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5">REQ ID</th>
                <th className="p-3.5">Requirement Title</th>
                <th className="p-3.5">Mandatory / Conditional</th>
                <th className="p-3.5">Evidence Type Required</th>
                <th className="p-3.5">Verification Source</th>
                <th className="p-3.5">Deterministic Rule</th>
                <th className="p-3.5">Clause Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {tender.requirements.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold font-mono text-slate-900 bg-slate-50/50">{req.id}</td>
                  <td className="p-3.5 font-semibold text-slate-900">
                    <div>{req.title}</div>
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">{req.description}</div>
                  </td>
                  <td className="p-3.5">
                    {req.is_mandatory ? (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-bold text-[11px]">
                        Yes (Mandatory)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold text-[11px]">
                        Conditional
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-medium text-slate-700">{req.evidence_type}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-[11px] rounded font-semibold border border-slate-200">
                      {req.verification_source}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-700">
                    {req.rule_type === 'ACTIVE' && 'Status == ACTIVE'}
                    {req.rule_type === 'VALID' && 'Status == VALID'}
                    {req.rule_type === 'REQUIRED' && 'Document Exists == true'}
                    {req.rule_type === 'THRESHOLD' && `Local Content >= ${req.threshold_value}%`}
                    {req.rule_type === 'EXACT_MATCH' && 'Debarment Match == false'}
                    {req.rule_type === 'VALID_DATE' && 'Expiry Date > Current'}
                  </td>
                  <td className="p-3.5 text-slate-500 font-mono text-[11px]">{req.clause_reference || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
