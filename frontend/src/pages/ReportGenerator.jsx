import React, { useState } from 'react';
import { FileSpreadsheet, RefreshCw, ExternalLink } from 'lucide-react';

const API_BASE = '/api';

export default function ReportGenerator({ bidderId, onBack }) {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const reportUrl = `${API_BASE}/reports/bidder/${bidderId}/html`;

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setGenerated(true); }, 1200);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="card px-6 py-5 flex items-center justify-between" style={{ borderLeft: '4px solid #7c3aed' }}>
        <div className="flex items-center gap-3 pl-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe' }}>
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Compliance Report Generator</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              Generate printable / exportable compliance report for bidder <span className="font-mono font-semibold" style={{ color: '#374151' }}>{bidderId}</span>
            </p>
          </div>
        </div>
        {onBack && (
          <button onClick={onBack} className="btn-secondary px-4 py-2 rounded-xl text-xs">
            ← Back to Profile
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold mb-1" style={{ color: '#374151' }}>Report Format</div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed' }}>HTML Report</span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' }}>PDF (coming soon)</span>
          </div>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {generated ? 'Regenerate Report' : 'Generate Report'}
              </>
            )}
          </button>
          {generated && (
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 no-underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Full Report
            </a>
          )}
        </div>
      </div>

      {/* Report Preview */}
      {generated ? (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#f7f8fa', borderBottom: '1px solid #e5e7eb' }}>
            <span className="text-xs font-semibold" style={{ color: '#374151' }}>Live Report Preview</span>
            <span className="text-[10px]" style={{ color: '#9ca3af' }}>Scrollable · Printable</span>
          </div>
          <iframe
            src={reportUrl}
            title="Compliance Report"
            className="w-full"
            style={{ height: '70vh', border: 'none' }}
          />
        </div>
      ) : (
        <div
          className="card p-16 flex flex-col items-center justify-center text-center"
          style={{ border: '2px dashed #e5e7eb' }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe' }}>
            <FileSpreadsheet className="w-7 h-7 text-purple-400" />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>No report generated yet</p>
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            Click <strong>Generate Report</strong> above to create a full compliance report for bidder {bidderId}
          </p>
        </div>
      )}
    </div>
  );
}
