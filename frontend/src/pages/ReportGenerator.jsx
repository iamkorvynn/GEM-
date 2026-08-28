import React, { useEffect, useState } from 'react';
import { Printer, Download, ArrowLeft, ShieldCheck, FileSpreadsheet, Sparkles } from 'lucide-react';
import { getReportHtmlUrl } from '../services/api';

export default function ReportGenerator({ bidderId, onBack }) {
  const [reportHtml, setReportHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bidderId) return;
    fetch(getReportHtmlUrl(bidderId))
      .then((res) => res.text())
      .then((html) => {
        setReportHtml(html);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bidderId]);

  const handlePrint = () => {
    const iframe = document.getElementById('report-iframe');
    if (iframe) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  if (loading) {
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
      {/* Top Action Bar */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between relative overflow-hidden"
        style={{
          background: 'rgba(8,14,30,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 40px rgba(59,130,246,0.06)',
        }}
      >
        <button
          onClick={onBack}
          className="btn-glass-ghost px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bidder Profile</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="btn-glass-primary px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Report Frame Preview */}
      <div
        className="rounded-2xl overflow-hidden min-h-[850px] shadow-2xl"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <iframe
          id="report-iframe"
          srcDoc={reportHtml}
          title="GeM Official Bid Compliance Report"
          className="w-full h-[850px] border-0"
        />
      </div>
    </div>
  );
}
