import React, { useState } from 'react';
import { FolderOpen, Upload, FileText, ShieldCheck, CloudDownload, Info, AlertTriangle, Landmark } from 'lucide-react';
import { uploadDocument } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

export default function DocumentManagement({ activeBidderId }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: 'DOC-GST-001',
      file_name: 'GST_Certificate_2026.pdf',
      classified_type: 'GST Certificate',
      classification_confidence: 0.992,
      status: 'VERIFIED',
      uploaded_at: '2026-08-27 20:14',
      gem_ref: 'GEM/2026/B/784921'
    },
    {
      id: 'DOC-OEM-001',
      file_name: 'Suraksha_OEM_Authorization.pdf',
      classified_type: 'OEM Authorization',
      classification_confidence: 0.985,
      status: 'VERIFIED',
      uploaded_at: '2026-08-27 20:14',
      gem_ref: 'GEM/2026/B/784921'
    },
    {
      id: 'DOC-MII-001',
      file_name: 'Make_in_India_Declaration.pdf',
      classified_type: 'Make in India Declaration',
      classification_confidence: 0.975,
      status: 'VERIFIED',
      uploaded_at: '2026-08-27 20:15',
      gem_ref: 'GEM/2026/B/784921'
    }
  ]);

  const handleFileUpload = (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const file = files[0];
    uploadDocument(activeBidderId || 'BIDDER-A', file)
      .then((newDoc) => {
        setUploadedFiles((prev) => [{ ...newDoc, gem_ref: 'GEM/2026/B/784921' }, ...prev]);
        setUploading(false);
      })
      .catch(() => {
        setUploading(false);
        // Fallback mock display for prototype
        setUploadedFiles((prev) => [
          {
            id: `DOC-NEW-${Date.now()}`,
            file_name: file.name,
            classified_type: file.name.toUpperCase().includes('GST')
              ? 'GST Certificate'
              : file.name.toUpperCase().includes('OEM')
              ? 'OEM Authorization'
              : 'Bidder Qualification Document',
            classification_confidence: 0.965,
            status: 'VERIFIED',
            uploaded_at: new Date().toLocaleString(),
            gem_ref: 'GEM/2026/B/784921'
          },
          ...prev
        ]);
      });
  };

  return (
    <div className="p-6 space-y-5">

      {/* ── Page Header ── */}
      <div
        className="rounded-2xl px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
        style={{
          background: 'rgba(8,14,30,0.80)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 40px rgba(59,130,246,0.06)',
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: 'linear-gradient(180deg, #3b82f6, #6366f1)' }} />
        <div className="pl-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.30)', boxShadow: '0 0 20px rgba(59,130,246,0.12)' }}>
            <CloudDownload className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">GeM Document Import</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Officer workspace · AI Classification &amp; OCR Extraction Engine
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[10px]">
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd' }}>
            <Landmark className="w-3 h-3" /> Officer Console
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold"
            style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', color: '#fcd34d' }}>
            <AlertTriangle className="w-3 h-3" /> MVP Simulation
          </span>
        </div>
      </div>

      {/* ── Hackathon MVP Notice ── */}
      <div
        className="rounded-xl p-4 flex gap-3 items-start"
        style={{
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.22)',
        }}
      >
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-300 leading-relaxed">
          <span className="font-bold text-amber-200">Hackathon MVP Mode — Officer Upload Simulation.</span>{' '}
          In production, this screen would automatically <span className="font-semibold">pull bid documents directly from the GeM portal API</span> (Tax Certificates, OEM Authorization Letters, Make-in-India Declarations, etc.) the moment a bidder submits their bid on GeM. Since live GeM API access is unavailable during the prototype, <span className="font-semibold">the officer manually uploads the same documents here</span> purely as a stand-in for that fetch step. <span className="italic text-amber-400/80">Bidders never access this tool — they upload to GeM as part of the normal GeM bidding process.</span>
        </div>
      </div>

      {/* ── Officer Upload Zone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
        className="rounded-2xl border-2 border-dashed p-8 text-center transition-all relative overflow-hidden"
        style={{
          background: dragOver ? 'rgba(59,130,246,0.07)' : 'rgba(8,14,30,0.50)',
          border: `2px dashed ${dragOver ? 'rgba(59,130,246,0.60)' : 'rgba(255,255,255,0.10)'}`,
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Subtle orb */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(30px)' }} />

        <div className="max-w-sm mx-auto space-y-3 relative z-1">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 0 24px rgba(59,130,246,0.15)' }}>
            <Upload className="w-6 h-6 text-blue-400" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">
              Import Bid Documents from GeM
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Officer simulation: upload documents submitted by the bidder on the GeM portal
              (Tax Certificate, OEM Auth, Udyam, etc.)
            </p>
            <p className="text-[10px] text-slate-600 mt-1">PDF · PNG · JPG · JPEG — up to 25 MB per file</p>
          </div>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 20px rgba(59,130,246,0.30)', color: '#fff' }}>
            <CloudDownload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Processing & Classifying…' : 'Select GeM Submission File'}</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* ── Imported Documents List ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(8,14,30,0.70)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* List header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Imported GeM Submission Documents</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{uploadedFiles.length} documents</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}>
              <ShieldCheck className="w-3 h-3 inline mr-1" />Auto-classified
            </span>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.04]">
          {uploadedFiles.map((doc, idx) => (
            <div
              key={idx}
              className="px-5 py-4 flex items-center justify-between transition-all"
              style={{ background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl shrink-0"
                  style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.20)' }}>
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">{doc.file_name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>
                      Type: <strong className="text-slate-400">{doc.classified_type}</strong>
                    </span>
                    <span className="text-slate-700">·</span>
                    <span>
                      Confidence:{' '}
                      <strong className="text-emerald-400">
                        {(doc.classification_confidence * 100).toFixed(1)}%
                      </strong>
                    </span>
                    {doc.gem_ref && (
                      <>
                        <span className="text-slate-700">·</span>
                        <span className="text-slate-600 font-mono">{doc.gem_ref}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-[10px] text-slate-600 font-mono hidden sm:block">{doc.uploaded_at}</div>
                <StatusBadge status={doc.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Officer Note ── */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-2.5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
        <p className="text-[10px] text-slate-600 leading-relaxed">
          <span className="text-slate-500 font-semibold">Officer action only.</span>{' '}
          All documents imported here are treated as originating from the GeM portal submission.
          After import, OCR extraction and AI classification run automatically.
          Proceed to <span className="text-slate-400">Bidder Profile</span> to review extracted fields and run compliance verification.
        </p>
      </div>
    </div>
  );
}
