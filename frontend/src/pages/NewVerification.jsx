import React, { useState, useRef } from 'react';
import { Upload, FileText, Plus, CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { uploadDocument } from '../services/api';

const SAMPLE_TENDERS = [
  { id: 'TENDER-001', label: 'TENDER-001 — Industrial Safety Equipment (MHI)' },
  { id: 'TENDER-002', label: 'TENDER-002 — Medical Supply Procurement (MoH)' },
  { id: 'TENDER-003', label: 'TENDER-003 — IT Infrastructure Services (MEITY)' },
];

const BIDDER_TEMPLATES = [
  { id: 'BIDDER-A', label: 'BIDDER-A — ABC Industrial Solutions Pvt. Ltd.', riskHint: 'LOW', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'BIDDER-B', label: 'BIDDER-B — Nova Safety Systems Ltd.', riskHint: 'MEDIUM', color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  { id: 'BIDDER-C', label: 'BIDDER-C — Alpha Tech Enterprises', riskHint: 'HIGH', color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  { id: 'BIDDER-D', label: 'BIDDER-D — Prime Industrial Technologies', riskHint: 'HIGH', color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  { id: 'BIDDER-E', label: 'BIDDER-E — Radiant Procurement Solutions', riskHint: 'CRITICAL', color: '#9f1239', bg: '#fff1f2', border: '#fda4af' },
  { id: 'NEW', label: 'New Bidder / Enter Manually', riskHint: 'UNKNOWN', color: '#6b7280', bg: '#f7f8fa', border: '#e5e7eb' },
];

export default function NewVerification({ setActiveBidderId, setCurrentTab, showToast }) {
  const [tenderId, setTenderId] = useState('TENDER-001');
  const [bidderId, setBidderId] = useState('BIDDER-A');
  const [companyName, setCompanyName] = useState('');
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [uploadComplete, setUploadComplete] = useState(false);
  const dropRef = useRef(null);

  const handleFileDrop = e => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer?.files || e.target.files || []);
    const pdfs = dropped.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    setFiles(prev => [...prev, ...pdfs.filter(f => !prev.find(p => p.name === f.name))]);
  };

  const removeFile = name => setFiles(prev => prev.filter(f => f.name !== name));

  const handleSubmit = async e => {
    e.preventDefault();
    if (files.length === 0) { showToast?.('No Files', 'Please attach at least one PDF document.', 'warning'); return; }
    const finalBidderId = bidderId === 'NEW' ? `BID-NEW-${Date.now()}` : bidderId;
    setUploading(true);
    const results = [];
    for (const file of files) {
      try {
        const res = await uploadDocument(finalBidderId, file);
        results.push({ file: file.name, status: 'success', msg: res.classified_type || 'Classified' });
      } catch (err) {
        results.push({ file: file.name, status: 'error', msg: err.message });
      }
    }
    setUploadResults(results);
    setUploading(false);
    setUploadComplete(true);
    const successCount = results.filter(r => r.status === 'success').length;
    if (successCount > 0) {
      showToast?.('Upload Complete', `${successCount} document(s) uploaded and classified by AI.`, 'success');
    }
  };

  const selectedBidder = BIDDER_TEMPLATES.find(b => b.id === bidderId) || BIDDER_TEMPLATES[5];

  if (uploadComplete) {
    return (
      <div className="p-6">
        <div className="card p-8 max-w-lg mx-auto text-center" style={{ borderTop: '4px solid #22c55e' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#dcfce7', border: '2px solid #bbf7d0' }}>
            <CheckCircle2 className="w-7 h-7 text-green-500" />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>Documents Uploaded</h2>
          <p className="text-xs mb-6" style={{ color: '#6b7280' }}>AI classification complete. Ready to run verification.</p>
          <div className="space-y-2 mb-6 text-left">
            {uploadResults.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: r.status === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${r.status === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: r.status === 'success' ? '#16a34a' : '#dc2626' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: '#111827' }}>{r.file}</div>
                  <div className="text-[10px]" style={{ color: '#9ca3af' }}>{r.msg}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setActiveBidderId(bidderId === 'NEW' ? 'BIDDER-A' : bidderId); setCurrentTab('bidder-profile'); }}
            className="btn-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Open Bidder Profile & Run Verification
          </button>
          <button onClick={() => { setUploadComplete(false); setFiles([]); setUploadResults([]); }} className="mt-3 btn-secondary w-full py-2.5 rounded-xl text-xs">
            Start Another Verification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="card px-6 py-5 flex items-start justify-between gap-4" style={{ borderLeft: '4px solid #3b82f6' }}>
        <div className="flex items-center gap-3 pl-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
            <Plus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#111827' }}>New Bid Verification</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              Attach bid documents · AI classifies, OCR extracts, officer confirms, then run 3-track analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold shrink-0" style={{ color: '#9ca3af' }}>
          <span className="w-2 h-2 rounded-full bg-green-500" /> AI Classifier Online
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left — Form Fields */}
        <div className="space-y-4">
          {/* Tender Selector */}
          <div className="card p-5 space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Step 1 — Select Tender</div>
            <div className="space-y-2">
              {SAMPLE_TENDERS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTenderId(t.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all text-xs"
                  style={tenderId === t.id
                    ? { background: '#eff6ff', border: '1.5px solid #bfdbfe' }
                    : { background: '#f7f8fa', border: '1px solid #e5e7eb' }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: tenderId === t.id ? '#3b82f6' : '#d1d5db' }} />
                  <span style={{ color: tenderId === t.id ? '#1d4ed8' : '#374151' }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bidder Selector */}
          <div className="card p-5 space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Step 2 — Select or Enter Bidder</div>
            <div className="grid grid-cols-1 gap-2">
              {BIDDER_TEMPLATES.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBidderId(b.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all text-xs"
                  style={bidderId === b.id
                    ? { background: b.bg, border: `1.5px solid ${b.border}` }
                    : { background: '#f7f8fa', border: '1px solid #e5e7eb' }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: bidderId === b.id ? b.color : '#d1d5db' }} />
                  <span className="flex-1 truncate" style={{ color: bidderId === b.id ? b.color : '#374151' }}>{b.label}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                    style={{ background: b.bg, color: b.color }}>{b.riskHint}</span>
                </button>
              ))}
            </div>

            {bidderId === 'NEW' && (
              <div className="space-y-2 mt-2">
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company Name" className="form-input w-full px-3 py-2.5 text-sm" />
                <input type="text" value={pan} onChange={e => setPan(e.target.value)} placeholder="PAN Number" className="form-input w-full px-3 py-2.5 text-sm font-mono" />
                <input type="text" value={gstin} onChange={e => setGstin(e.target.value)} placeholder="GSTIN" className="form-input w-full px-3 py-2.5 text-sm font-mono" />
              </div>
            )}
          </div>
        </div>

        {/* Right — File Upload */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Step 3 — Attach Documents</div>

            {/* Drop Zone */}
            <div
              ref={dropRef}
              onClick={() => { const inp = document.createElement('input'); inp.type='file'; inp.accept='.pdf'; inp.multiple=true; inp.onchange=handleFileDrop; inp.click(); }}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f7f8fa'; }}
              onDrop={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f7f8fa'; handleFileDrop(e); }}
              className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all"
              style={{ background: '#f7f8fa', borderColor: '#d1d5db' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
                <Upload className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#374151' }}>Drag & drop PDFs here</p>
              <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>or click to browse · GST, PAN, OEM Auth, MSME, etc.</p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map(f => (
                  <div key={f.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: '#111827' }}>{f.name}</div>
                      <div className="text-[10px]" style={{ color: '#9ca3af' }}>{(f.size / 1024).toFixed(0)} KB · PDF</div>
                    </div>
                    <button type="button" onClick={() => removeFile(f.name)} className="p-1 rounded-lg transition-all" style={{ color: '#9ca3af' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#dc2626'} onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length === 0 && (
              <div className="text-center py-4">
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  Expected: GST Certificate, PAN, Udyam, OEM Authorization, MII Declaration
                </p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || files.length === 0}
            className="btn-primary w-full py-4 rounded-2xl text-sm flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Uploading & Classifying…
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Upload Documents & Start Verification Prep
              </>
            )}
          </button>

          {/* Info */}
          <div className="px-4 py-3 rounded-xl text-xs" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', color: '#1d4ed8' }}>
            <strong>How it works:</strong> AI classifies and OCR-extracts all document fields → Officer reviews and confirms extracted data → Run 3-track verification (Exact + Fuzzy + Correlation).
          </div>
        </div>
      </form>
    </div>
  );
}
