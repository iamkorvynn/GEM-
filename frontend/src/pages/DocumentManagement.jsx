import React, { useState, useEffect } from 'react';
import {
  CloudDownload, CheckCircle2, ShieldCheck, Landmark, AlertTriangle,
  RefreshCw, FileText, Zap, Clock, ExternalLink, ChevronRight, Info
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';

const GEM_PORTAL_DATA = {
  'GEM/2026/B/784921': {
    tenderTitle: 'Supply & Installation of High-Grade Industrial Safety Equipment',
    department: 'Ministry of Heavy Industries / PSU Procurement Division',
    deadline: '30 Sep 2026',
    bids: {
      'BIDDER-A': {
        company: 'ABC Industrial Solutions Pvt. Ltd.',
        gemBidId: 'GEM/BID/2026/A/001821',
        submittedAt: '2026-08-27 20:10 IST',
        documents: [
          { id: 'DOC-GST-001', file_name: 'GST_Certificate_2026.pdf',           classified_type: 'GST Certificate',          confidence: 0.992, status: 'VERIFIED', size: '284 KB', pages: 2 },
          { id: 'DOC-OEM-001', file_name: 'Suraksha_OEM_Authorization.pdf',     classified_type: 'OEM Authorization Letter',  confidence: 0.985, status: 'VERIFIED', size: '412 KB', pages: 3 },
          { id: 'DOC-MII-001', file_name: 'Make_in_India_Declaration.pdf',       classified_type: 'Make in India Declaration', confidence: 0.975, status: 'VERIFIED', size: '196 KB', pages: 1 },
          { id: 'DOC-UDY-001', file_name: 'Udyam_Registration_Certificate.pdf',  classified_type: 'Udyam (MSME) Certificate', confidence: 0.978, status: 'VERIFIED', size: '310 KB', pages: 1 },
          { id: 'DOC-PAN-001', file_name: 'PAN_Card_ABCDE1234F.pdf',             classified_type: 'PAN Card',                 confidence: 0.998, status: 'VERIFIED', size: '98 KB',  pages: 1 },
        ],
      },
      'BIDDER-B': {
        company: 'Nova Safety Systems Ltd.',
        gemBidId: 'GEM/BID/2026/B/001822',
        submittedAt: '2026-08-27 21:05 IST',
        documents: [
          { id: 'DOC-GST-002', file_name: 'Nova_GST_Reg_2026.pdf',              classified_type: 'GST Certificate',          confidence: 0.876, status: 'REVIEW_REQUIRED', size: '301 KB', pages: 2 },
          { id: 'DOC-OEM-002', file_name: 'Nova_OEM_Auth_Letter.pdf',           classified_type: 'OEM Authorization Letter',  confidence: 0.981, status: 'VERIFIED',        size: '228 KB', pages: 2 },
          { id: 'DOC-PAN-002', file_name: 'Nova_PAN_Document.pdf',              classified_type: 'PAN Card',                 confidence: 0.994, status: 'VERIFIED',        size: '102 KB', pages: 1 },
        ],
      },
      'BIDDER-C': {
        company: 'Alpha Tech Enterprises',
        gemBidId: 'GEM/BID/2026/C/001823',
        submittedAt: '2026-08-27 22:45 IST',
        documents: [
          { id: 'DOC-GST-003', file_name: 'AlphaTech_GST_Cert.pdf',             classified_type: 'GST Certificate',          confidence: 0.961, status: 'VERIFIED',          size: '271 KB', pages: 2 },
          { id: 'DOC-OEM-003', file_name: 'AlphaTech_OEM_Authorization.pdf',    classified_type: 'OEM Authorization Letter',  confidence: 0.972, status: 'REVIEW_REQUIRED', size: '389 KB', pages: 3 },
          { id: 'DOC-MII-003', file_name: 'AlphaTech_MII_Declaration.pdf',       classified_type: 'Make in India Declaration', confidence: 0.944, status: 'VERIFIED',          size: '188 KB', pages: 1 },
        ],
      },
      'BIDDER-D': {
        company: 'Prime Industrial Technologies',
        gemBidId: 'GEM/BID/2026/D/001824',
        submittedAt: '2026-08-28 09:20 IST',
        documents: [
          { id: 'DOC-GST-004', file_name: 'Prime_GST_Certificate.pdf',          classified_type: 'GST Certificate',          confidence: 0.987, status: 'VERIFIED', size: '295 KB', pages: 2 },
          { id: 'DOC-PAN-004', file_name: 'Prime_PAN_Card.pdf',                 classified_type: 'PAN Card',                 confidence: 0.999, status: 'VERIFIED', size: '89 KB',  pages: 1 },
        ],
      },
      'BIDDER-E': {
        company: 'Radiant Procurement Solutions',
        gemBidId: 'GEM/BID/2026/E/001825',
        submittedAt: '2026-08-28 11:55 IST',
        documents: [
          { id: 'DOC-GST-005', file_name: 'Radiant_GST_Reg.pdf',                classified_type: 'GST Certificate',          confidence: 0.832, status: 'REVIEW_REQUIRED', size: '318 KB', pages: 2 },
          { id: 'DOC-OEM-005', file_name: 'Radiant_OEM_Auth.pdf',               classified_type: 'OEM Authorization Letter',  confidence: 0.791, status: 'REVIEW_REQUIRED', size: '440 KB', pages: 4 },
          { id: 'DOC-UDY-005', file_name: 'Radiant_Udyam_Cert.pdf',             classified_type: 'Udyam (MSME) Certificate', confidence: 0.903, status: 'VERIFIED',        size: '307 KB', pages: 1 },
        ],
      },
    },
  },
};

const TENDERS = Object.keys(GEM_PORTAL_DATA);

const FETCH_STEPS = [
  { label: 'Authenticating with GeM Portal API…',   ms: 500 },
  { label: 'Resolving bid submission record…',       ms: 700 },
  { label: 'Enumerating submitted documents…',       ms: 600 },
  { label: 'Streaming document payloads…',           ms: 900 },
  { label: 'Running AI classification & OCR…',       ms: 1100 },
  { label: 'Indexing extracted fields…',             ms: 500 },
];

export default function DocumentManagement({ activeBidderId }) {
  const [tenderId,  setTenderId]  = useState(TENDERS[0]);
  const [bidderId,  setBidderId]  = useState(activeBidderId || 'BIDDER-A');
  const [fetching,  setFetching]  = useState(false);
  const [fetchStep, setFetchStep] = useState(-1);
  const [fetched,   setFetched]   = useState(false);
  const [docs,      setDocs]      = useState([]);
  const [lastFetch, setLastFetch] = useState(null);

  useEffect(() => {
    if (activeBidderId && activeBidderId !== bidderId) {
      setBidderId(activeBidderId);
      setFetched(false);
      setDocs([]);
    }
  }, [activeBidderId]);

  const tenderData = GEM_PORTAL_DATA[tenderId];
  const bidders    = tenderData ? Object.keys(tenderData.bids) : [];
  const bidData    = tenderData?.bids?.[bidderId];

  const handleFetch = async () => {
    if (!bidData) return;
    setFetching(true);
    setFetched(false);
    setDocs([]);
    setFetchStep(0);
    for (let i = 0; i < FETCH_STEPS.length; i++) {
      setFetchStep(i);
      await new Promise(r => setTimeout(r, FETCH_STEPS[i].ms));
    }
    setDocs(bidData.documents);
    setLastFetch(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setFetching(false);
    setFetched(true);
    setFetchStep(-1);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="card px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ borderLeft: '4px solid #3b82f6' }}>
        <div className="flex items-center gap-3 pl-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
            <CloudDownload className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#111827' }}>GeM Portal — Document Fetch</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              Pull bid submission documents directly from GeM · AI Classification & OCR run automatically
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[10px]">
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
            <Landmark className="w-3 h-3" /> Officer Console
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
            <AlertTriangle className="w-3 h-3" /> Simulated GeM API
          </span>
        </div>
      </div>

      {/* Info notice */}
      <div className="rounded-xl px-4 py-3 flex gap-3 items-start" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed" style={{ color: '#1d4ed8' }}>
          <span className="font-bold" style={{ color: '#1e40af' }}>Production behaviour:</span>{' '}
          When a bidder submits on GeM, their documents are automatically available here via the GeM API. The officer selects the tender and bid, then clicks <span className="font-semibold">Fetch from GeM</span>. All submitted documents are pulled, classified, and OCR-extracted in one step.
          <span className="block mt-1 text-[11px]" style={{ color: '#3b82f6' }}>Prototype uses mock GeM data — same UX, simulated API responses.</span>
        </p>
      </div>

      {/* Fetch Control Panel */}
      <div className="card p-5 space-y-5">
        <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: '#9ca3af' }}>
          <Zap className="w-3 h-3 text-amber-500" /> GeM Bid Selection
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Tender ID</label>
            <div className="relative">
              <select
                value={tenderId}
                onChange={e => { setTenderId(e.target.value); setFetched(false); setDocs([]); }}
                className="form-input w-full px-4 py-2.5 text-sm appearance-none pr-8"
                disabled={fetching}
              >
                {TENDERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronRight className="w-3.5 h-3.5 absolute right-3 top-3 rotate-90 pointer-events-none" style={{ color: '#9ca3af' }} />
            </div>
            {tenderData && (
              <p className="text-[10px] leading-relaxed" style={{ color: '#9ca3af' }}>
                {tenderData.tenderTitle} · Due {tenderData.deadline}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Bidder / Bid Submission</label>
            <div className="relative">
              <select
                value={bidderId}
                onChange={e => { setBidderId(e.target.value); setFetched(false); setDocs([]); }}
                className="form-input w-full px-4 py-2.5 text-sm appearance-none pr-8"
                disabled={fetching}
              >
                {bidders.map(b => {
                  const bd = tenderData.bids[b];
                  return <option key={b} value={b}>{b} — {bd.company}</option>;
                })}
              </select>
              <ChevronRight className="w-3.5 h-3.5 absolute right-3 top-3 rotate-90 pointer-events-none" style={{ color: '#9ca3af' }} />
            </div>
            {bidData && (
              <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                Bid ID: <span className="font-mono" style={{ color: '#374151' }}>{bidData.gemBidId}</span> · Submitted {bidData.submittedAt}
              </p>
            )}
          </div>
        </div>

        {bidData && (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f7f8fa', border: '1px solid #e5e7eb' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: '#111827' }}>{bidData.company}</div>
              <div className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>
                {bidData.documents.length} documents submitted on GeM · {bidData.submittedAt}
              </div>
            </div>
            <a href="#" onClick={e => e.preventDefault()} className="flex items-center gap-1 text-[10px] font-semibold shrink-0 transition" style={{ color: '#2563eb' }}
              title="Would open GeM portal bid page in production">
              View on GeM <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <button
          id="gem-fetch-btn"
          onClick={handleFetch}
          disabled={fetching || !bidData}
          className="btn-primary w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2.5"
          style={{ opacity: !bidData ? 0.5 : 1, cursor: !bidData ? 'not-allowed' : 'pointer' }}
        >
          {fetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
          {fetching ? 'Fetching from GeM Portal…' : fetched ? 'Re-fetch from GeM Portal' : 'Fetch Documents from GeM Portal'}
        </button>
      </div>

      {/* Fetch Progress */}
      {fetching && (
        <div className="card p-5 space-y-3" style={{ borderLeft: '3px solid #3b82f6' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: '#2563eb' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            GeM API — Live Fetch Progress
          </div>
          <div className="space-y-2">
            {FETCH_STEPS.map((step, i) => {
              const done    = i < fetchStep;
              const current = i === fetchStep;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: done ? '#dcfce7' : current ? '#dbeafe' : '#f1f5f9',
                      border: `1px solid ${done ? '#bbf7d0' : current ? '#bfdbfe' : '#e2e8f0'}`,
                    }}
                  >
                    {done    ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                    : current ? <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                    :           <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#d1d5db' }} />}
                  </div>
                  <span className={`text-xs transition-all ${done ? 'text-green-600' : current ? 'text-blue-600 font-medium' : ''}`}
                    style={!done && !current ? { color: '#d1d5db' } : {}}>
                    {step.label}
                  </span>
                  {done && <span className="ml-auto text-[10px] text-green-600">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fetched Documents */}
      {fetched && docs.length > 0 && (
        <div className="card overflow-hidden animate-fade-up">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #e5e7eb', background: '#f7f8fa' }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <h2 className="text-sm font-bold" style={{ color: '#111827' }}>Documents Fetched from GeM</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d' }}>
                {docs.length} files
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px]" style={{ color: '#9ca3af' }}>
              <Clock className="w-3 h-3" /> Fetched at {lastFetch}
            </div>
          </div>

          <div>
            {docs.map((doc, idx) => (
              <div
                key={idx}
                className="px-5 py-4 flex items-center justify-between transition-all"
                style={{ borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f7f8fa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl shrink-0" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#111827' }}>{doc.file_name}</div>
                    <div className="text-[10px] mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: '#9ca3af' }}>
                      <span>Type: <strong style={{ color: '#374151' }}>{doc.classified_type}</strong></span>
                      <span>·</span>
                      <span>Confidence: <strong style={{ color: '#15803d' }}>{(doc.confidence * 100).toFixed(1)}%</strong></span>
                      <span>·</span>
                      <span>{doc.size}</span>
                      <span>·</span>
                      <span>{doc.pages}p</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={doc.status} />
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #e5e7eb', background: '#f7f8fa' }}>
            <div className="flex items-center gap-2 text-[10px]" style={{ color: '#9ca3af' }}>
              <ShieldCheck className="w-3 h-3" />
              All documents auto-classified · OCR extraction complete · Ready for compliance check
            </div>
            <span className="text-[10px] font-semibold" style={{ color: '#9ca3af' }}>
              Navigate to <span style={{ color: '#2563eb' }}>Bidder Profile</span> to run verification →
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!fetching && !fetched && (
        <div
          className="card p-10 flex flex-col items-center justify-center text-center"
          style={{ border: '2px dashed #e5e7eb' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
            <CloudDownload className="w-6 h-6 text-blue-300" />
          </div>
          <p className="text-sm font-semibold" style={{ color: '#374151' }}>No documents fetched yet</p>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
            Select a tender and bid above, then click <span style={{ color: '#374151' }}>Fetch Documents from GeM Portal</span>
          </p>
        </div>
      )}
    </div>
  );
}
