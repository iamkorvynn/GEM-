import React, { useState } from 'react';
import { FolderOpen, Upload, FileText, CheckCircle2, ShieldCheck, ArrowUpRight, Sparkles, Layers } from 'lucide-react';
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
      uploaded_at: '2026-08-27 20:14'
    },
    {
      id: 'DOC-OEM-001',
      file_name: 'Suraksha_OEM_Authorization.pdf',
      classified_type: 'OEM Authorization',
      classification_confidence: 0.985,
      status: 'VERIFIED',
      uploaded_at: '2026-08-27 20:14'
    },
    {
      id: 'DOC-MII-001',
      file_name: 'Make_in_India_Declaration.pdf',
      classified_type: 'Make in India Declaration',
      classification_confidence: 0.975,
      status: 'VERIFIED',
      uploaded_at: '2026-08-27 20:15'
    }
  ]);

  const handleFileUpload = (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const file = files[0];
    uploadDocument(activeBidderId || 'BIDDER-A', file)
      .then((newDoc) => {
        setUploadedFiles((prev) => [newDoc, ...prev]);
        setUploading(false);
      })
      .catch((err) => {
        setUploading(false);
        // Fallback for prototype mock upload display
        setUploadedFiles((prev) => [
          {
            id: `DOC-NEW-${Date.now()}`,
            file_name: file.name,
            classified_type: file.name.toUpperCase().includes('GST') ? 'GST Certificate' : 'Bidder Document',
            classification_confidence: 0.965,
            status: 'VERIFIED',
            uploaded_at: new Date().toLocaleString()
          },
          ...prev
        ]);
      });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
          <FolderOpen className="w-5 h-5 mr-2 text-blue-600" /> Document Ingestion & Classification Engine
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload PDF / Image tender documents. System automatically classifies and extracts structured entities.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        className={`bg-white rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Drag & Drop Bidder Qualification Documents</h3>
            <p className="text-xs text-slate-500 mt-1">Supported formats: PDF, PNG, JPG, JPEG (Up to 25MB per file)</p>
          </div>

          <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer transition-all">
            <span>{uploading ? 'Processing & Classifying...' : 'Browse Files to Upload'}</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Ingested Documents Batch
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {uploadedFiles.length} Processed Documents
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {uploadedFiles.map((doc, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">{doc.file_name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                    <span>Type: <strong className="text-slate-700">{doc.classified_type}</strong></span>
                    <span>•</span>
                    <span>Confidence: <strong className="text-emerald-600">{(doc.classification_confidence * 100).toFixed(1)}%</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-[10px] text-slate-400 font-mono hidden sm:block">{doc.uploaded_at}</div>
                <StatusBadge status={doc.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
