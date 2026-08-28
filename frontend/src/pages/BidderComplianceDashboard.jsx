import React, { useEffect, useState } from 'react';
import {
  Users, Search, Filter, ShieldAlert, CheckCircle2, AlertTriangle,
  ArrowRight, Sparkles, Building2, FileText, Check, ShieldCheck, ChevronRight
} from 'lucide-react';
import { fetchBidders } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

const RISK_BADGES = {
  LOW:      { text: 'text-emerald-400', bg: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', dot: '#10b981' },
  MEDIUM:   { text: 'text-amber-400',   bg: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', dot: '#f59e0b' },
  HIGH:     { text: 'text-rose-400',    bg: 'rgba(244,63,94,0.10)',  border: '1px solid rgba(244,63,94,0.25)',  dot: '#f43f5e' },
  CRITICAL: { text: 'text-rose-300',    bg: 'rgba(244,63,94,0.18)',  border: '1px solid rgba(244,63,94,0.35)',  dot: '#f43f5e' },
  PENDING:  { text: 'text-slate-400',   bg: 'rgba(100,116,139,0.10)',border: '1px solid rgba(100,116,139,0.20)',dot: '#64748b' },
};

export default function BidderComplianceDashboard({ bidderId, onSelectBidder, showToast, setCurrentTab }) {
  const [bidders, setBidders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    fetchBidders()
      .then((data) => {
        setBidders(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = bidders.filter((b) => {
    const matchSearch =
      (b.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.gstin || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.pan || '').toLowerCase().includes(search.toLowerCase());
    const matchRisk = filterRisk === 'ALL' || b.risk_level === filterRisk;
    return matchSearch && matchRisk;
  });

  const handleOpenBidder = (id) => {
    if (onSelectBidder) {
      onSelectBidder(id);
    }
  };

  return (
    <div className="p-6 space-y-6 relative z-1">
      {/* Header */}
      <div
        className="rounded-2xl px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
        style={{
          background: 'rgba(8,14,30,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 40px rgba(59,130,246,0.06)',
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: 'linear-gradient(180deg, #3b82f6, #6366f1)' }} />
        <div className="pl-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.30)', boxShadow: '0 0 20px rgba(59,130,246,0.12)' }}
          >
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Bid Compliance Master List</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive list of all submitted bids, compliance evaluations, and risk classifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-white">{bidders.length}</span> Total Registered Submissions
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ background: 'rgba(8,14,30,0.70)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
      >
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, PAN, GSTIN, or ID..."
            className="glass-input w-full pl-10 pr-4 py-2.5 text-xs rounded-xl"
          />
        </div>

        {/* Risk Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Risk:
          </span>
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((risk) => (
            <button
              key={risk}
              onClick={() => setFilterRisk(risk)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
              style={
                filterRisk === risk
                  ? { background: 'rgba(59,130,246,0.22)', border: '1px solid rgba(59,130,246,0.40)', color: '#93c5fd' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }
              }
            >
              {risk}
            </button>
          ))}
        </div>
      </div>

      {/* Bidders Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(8,14,30,0.80)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}
      >
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No bidder submissions found matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th className="py-3.5 px-4">Bidder Reference</th>
                  <th className="py-3.5 px-4">Company Entity</th>
                  <th className="py-3.5 px-4">Identifiers</th>
                  <th className="py-3.5 px-4">Tender ID</th>
                  <th className="py-3.5 px-4 text-center">Score</th>
                  <th className="py-3.5 px-4 text-center">Risk Level</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filtered.map((b) => {
                  const riskStyle = RISK_BADGES[b.risk_level] || RISK_BADGES.PENDING;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => handleOpenBidder(b.id)}
                      className="hover:bg-white/[0.025] transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 font-mono font-bold text-blue-400">
                        {b.id}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white group-hover:text-blue-300 transition-colors">
                          {b.company_name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {b.company_type || 'Private Limited'} · Local Content: {b.local_content_pct || 0}%
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-400">
                        <div>PAN: <span className="text-slate-300">{b.pan || '—'}</span></div>
                        <div>GST: <span className="text-slate-300">{b.gstin || '—'}</span></div>
                      </td>
                      <td className="py-4 px-4 text-[11px] text-slate-400">
                        {b.tender_id}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="font-black text-base text-white">
                          {b.compliance_score != null ? b.compliance_score.toFixed(0) : '—'}
                          <span className="text-[10px] text-slate-500 font-normal">/100</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: riskStyle.bg, border: riskStyle.border, color: riskStyle.dot }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: riskStyle.dot }} />
                          {b.risk_level || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusBadge status={b.overall_status || 'PENDING'} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBidder(b.id);
                          }}
                          className="btn-glass-ghost px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1 font-semibold group-hover:text-blue-400 transition"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
