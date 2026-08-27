import React, { useEffect, useState } from 'react';
import { Printer, Download, ArrowLeft, ShieldCheck, FileSpreadsheet } from 'lucide-react';
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
    return <div className="p-8 text-center text-slate-500">Generating Official Compliance Verification Report...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bidder Dashboard</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Report Frame Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden min-h-[800px]">
        <iframe
          id="report-iframe"
          srcDoc={reportHtml}
          title="GeM Official Bid Compliance Report"
          className="w-full h-[800px] border-none"
        ></iframe>
      </div>
    </div>
  );
}
