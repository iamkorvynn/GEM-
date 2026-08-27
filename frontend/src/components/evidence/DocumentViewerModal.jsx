import React, { useState } from 'react';
import { X, FileText, CheckCircle2, ShieldCheck, ZoomIn, Eye, ExternalLink } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function DocumentViewerModal({ document, onClose }) {
  const [zoom, setZoom] = useState(100);

  if (!document) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-slate-100">{document.file_name}</h3>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded font-mono border border-slate-700">
                  {document.classified_type || 'Document'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Classification Confidence: <span className="text-emerald-400 font-bold">{(document.classification_confidence * 100).toFixed(1)}%</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-slate-800 rounded px-2 py-1 text-xs">
              <button onClick={() => setZoom(Math.max(75, zoom - 25))} className="px-1 text-slate-300 hover:text-white">-</button>
              <span className="text-slate-400 font-mono text-[11px]">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(150, zoom + 25))} className="px-1 text-slate-300 hover:text-white">+</button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Side-by-Side Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left: Interactive Visual Document Preview */}
          <div className="lg:col-span-7 bg-slate-950 p-6 overflow-auto flex flex-col justify-start items-center border-r border-slate-800">
            <div
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-lg p-6 shadow-2xl relative space-y-4 transition-all"
            >
              {/* Synthetic Visual Document Layout */}
              <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                <div>
                  <div className="font-bold text-xs text-slate-200 uppercase tracking-widest">GOVERNMENT OF INDIA</div>
                  <div className="text-[10px] text-slate-400">OFFICIAL REGISTRATION / AUTHORIZATION CERTIFICATE</div>
                </div>
                <div className="w-8 h-8 rounded border border-amber-500/40 bg-amber-500/10 flex items-center justify-center font-bold text-amber-400 text-xs">
                  GeM
                </div>
              </div>

              {/* Bounding Box Highlights for Extracted Entities */}
              <div className="space-y-3 font-mono text-xs">
                {document.entities && document.entities.length > 0 ? (
                  document.entities.map((e, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-blue-950/40 border border-blue-500/60 relative group hover:border-amber-400 transition-colors"
                    >
                      <span className="absolute -top-2 left-2 px-1.5 py-0.2 bg-blue-600 text-white text-[9px] font-sans font-bold rounded uppercase">
                        Bounding Region #{idx + 1}
                      </span>
                      <div className="text-[10px] text-blue-300 uppercase font-sans font-semibold mt-1">{e.entity_key.replace('_', ' ')}</div>
                      <div className="text-sm font-bold text-slate-100 mt-0.5">{e.entity_value}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-xs italic py-8 text-center">
                    Sample document rendering. Extracted entities highlighted.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between text-[10px] text-slate-500">
                <span>Verified OCR Text Stream</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>

          {/* Right: Extracted Structured Data & Evidence Links */}
          <div className="lg:col-span-5 bg-slate-900 p-6 overflow-y-auto space-y-5">
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-400" /> Extracted Structured Entities
              </h4>
              <div className="space-y-2.5">
                {document.entities && document.entities.length > 0 ? (
                  document.entities.map((e, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{e.entity_key.replace('_', ' ')}</span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                          {(e.confidence * 100).toFixed(1)}% Confidence
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white font-mono">{e.entity_value}</div>
                      <div className="text-[10px] text-slate-500 flex items-center pt-1">
                        <span>Source: Page {e.page_number}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 italic">No structured entities extracted yet.</div>
                )}
              </div>
            </div>

            {/* Government Verification Cross-Check Status */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                Government Adapter Cross-Check
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extracted entities have been matched against the Mock Government Verification Layer for synthetic verification.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400">Adapter Result:</span>
                <StatusBadge status="VERIFIED" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
