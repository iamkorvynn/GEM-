import React, { useEffect, useState } from 'react';
import { FileText, Sparkles, CheckCircle2, ArrowRight, Layers, RefreshCw } from 'lucide-react';
import { fetchTenderDetails, analyzeTender } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

export default function TenderDetails({ tenderId, onProceedToBidders }) {
  const [tender, setTender] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeStep, setActiveStep] = useState(6);

  const analysisSteps = [
    { step: 1, name: 'Reading tender document' },
    { step: 2, name: 'Extracting eligibility clauses' },
    { step: 3, name: 'Identifying mandatory requirements' },
    { step: 4, name: 'Identifying conditional requirements' },
    { step: 5, name: 'Mapping verification sources' },
    { step: 6, name: 'Building compliance matrix' },
  ];

  useEffect(() => {
    fetchTenderDetails(tenderId).then(setTender).catch(err => console.error(err));
  }, [tenderId]);

  const handleRunAnalysis = () => {
    setAnalyzing(true);
    setActiveStep(1);
    const interval = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= 6) { clearInterval(interval); setAnalyzing(false); return 6; }
        return prev + 1;
      });
    }, 600);
  };

  if (!tender) return (
    <div className="p-8 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="card p-6 relative overflow-hidden" style={{ borderTop: '4px solid #3b82f6' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: '#9ca3af' }}>
              <span className="font-mono font-bold px-2.5 py-0.5 rounded-lg" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}>
                {tender.id}
              </span>
              <span>•</span>
              <span>{tender.department}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: '#111827' }}>{tender.title}</h1>
            <p className="text-xs mt-1 max-w-3xl leading-relaxed" style={{ color: '#6b7280' }}>{tender.description}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="btn-secondary px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-blue-500' : ''}`} />
              {analyzing ? 'Re-analyzing...' : 'Re-run AI Extraction'}
            </button>
            <button
              onClick={() => onProceedToBidders(tender.id)}
              className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <span>View Bidder Submissions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 mt-2 text-xs" style={{ borderTop: '1px solid #e5e7eb' }}>
          {[
            { label: 'Created Date',       value: tender.created_date },
            { label: 'Submission Deadline', value: tender.deadline },
            { label: 'Estimated Value',     value: tender.estimated_cost },
            { label: 'Extracted Criteria',  value: `${tender.requirements?.length || 0} Rule Items`, highlight: true },
          ].map((item, i) => (
            <div key={i}>
              <span className="block text-[10px] uppercase font-bold tracking-wider mb-0.5" style={{ color: '#9ca3af' }}>{item.label}</span>
              <span className={`font-semibold ${item.highlight ? 'text-green-600' : ''}`} style={item.highlight ? {} : { color: '#374151' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Pipeline */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#374151' }}>
              AI Tender Document Extraction Pipeline
            </h2>
          </div>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg"
            style={{ background: activeStep === 6 ? '#dcfce7' : '#dbeafe', border: `1px solid ${activeStep === 6 ? '#bbf7d0' : '#bfdbfe'}`, color: activeStep === 6 ? '#15803d' : '#1d4ed8' }}
          >
            {activeStep === 6 ? '100% Extraction Complete' : `Processing Step ${activeStep}/6...`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {analysisSteps.map(s => {
            const isDone = s.step <= activeStep;
            return (
              <div
                key={s.step}
                className="p-3 rounded-xl text-xs flex flex-col justify-between transition-all"
                style={{
                  background: isDone ? '#f0fdf4' : '#f7f8fa',
                  border: `1px solid ${isDone ? '#bbf7d0' : '#e5e7eb'}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold" style={{ color: '#d1d5db' }}>0{s.step}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                </div>
                <div className="font-semibold leading-tight text-[11px]" style={{ color: isDone ? '#15803d' : '#9ca3af' }}>{s.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Requirements Table */}
      <div className="card overflow-hidden">
        <div className="p-4 flex items-center justify-between" style={{ background: '#f7f8fa', borderBottom: '1px solid #e5e7eb' }}>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#111827' }}>
            <Layers className="w-4 h-4 text-blue-500" /> Extracted Compliance Requirements Matrix
          </h2>
          <span className="text-xs" style={{ color: '#9ca3af' }}>{tender.requirements?.length || 0} Configured Criteria Rules</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table-fenco">
            <thead>
              <tr>
                <th>REQ ID</th>
                <th>Requirement Title</th>
                <th>Type</th>
                <th>Evidence Type</th>
                <th>Verification Source</th>
                <th>Rule Logic</th>
                <th>Clause Ref</th>
              </tr>
            </thead>
            <tbody>
              {tender.requirements?.map(req => (
                <tr key={req.id}>
                  <td><span className="font-mono font-bold" style={{ color: '#2563eb' }}>{req.id}</span></td>
                  <td>
                    <div className="font-semibold" style={{ color: '#111827' }}>{req.title}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>{req.description}</div>
                  </td>
                  <td>
                    {req.is_mandatory ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>Mandatory</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>Conditional</span>
                    )}
                  </td>
                  <td className="font-medium" style={{ color: '#374151' }}>{req.evidence_type}</td>
                  <td>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold font-mono" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
                      {req.verification_source}
                    </span>
                  </td>
                  <td className="font-mono text-[11px]" style={{ color: '#6b7280' }}>
                    {req.rule_type === 'ACTIVE'      && 'Status == ACTIVE'}
                    {req.rule_type === 'VALID'       && 'Status == VALID'}
                    {req.rule_type === 'REQUIRED'    && 'Document Exists == true'}
                    {req.rule_type === 'THRESHOLD'   && `Local Content >= ${req.threshold_value}%`}
                    {req.rule_type === 'EXACT_MATCH' && 'Debarment Match == false'}
                    {req.rule_type === 'VALID_DATE'  && 'Expiry Date > Current'}
                  </td>
                  <td className="font-mono text-[11px]" style={{ color: '#9ca3af' }}>{req.clause_reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
