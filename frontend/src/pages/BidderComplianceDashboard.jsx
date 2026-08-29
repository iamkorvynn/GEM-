import React, { useEffect, useState } from 'react';
import { Users, Search, Filter, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, ChevronRight } from 'lucide-react';
import { fetchBidders } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

const RISK_BADGES = {
  LOW:      { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  MEDIUM:   { color: '#92400e', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  HIGH:     { color: '#991b1b', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
  CRITICAL: { color: '#9f1239', bg: '#fff1f2', border: '#fda4af', dot: '#f43f5e' },
  PENDING:  { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8' },
};

export default function BidderComplianceDashboard({ bidderId, onSelectBidder, showToast, setCurrentTab }) {
  const [bidders, setBidders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    fetchBidders()
      .then(data => { setBidders(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = bidders.filter(b => {
    const matchSearch =
      (b.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.gstin || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.pan || '').toLowerCase().includes(search.toLowerCase());
    const matchRisk = filterRisk === 'ALL' || b.risk_level === filterRisk;
    return matchSearch && matchRisk;
  });

  const handleOpenBidder = id => { if (onSelectBidder) onSelectBidder(id); };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="card px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ borderLeft: '4px solid #3b82f6' }}>
        <div className="flex items-center gap-3 pl-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: '#111827' }}>Bid Compliance Master List</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              Comprehensive list of all submitted bids, compliance evaluations, and risk classifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: '#6b7280' }}>
          <span className="font-bold" style={{ color: '#111827' }}>{bidders.length}</span> Total Registered Submissions
        </div>
      </div>

      {/* Filter & Search */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 pointer-events-none" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by company, PAN, GSTIN, or ID..."
            className="form-input w-full pl-10 pr-4 py-2.5 text-xs rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shrink-0" style={{ color: '#9ca3af' }}>
            <Filter className="w-3 h-3" /> Risk:
          </span>
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map(risk => {
            const meta = RISK_BADGES[risk] || {};
            const active = filterRisk === risk;
            return (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
                style={active
                  ? { background: risk === 'ALL' ? '#dbeafe' : meta.bg, border: `1.5px solid ${risk === 'ALL' ? '#bfdbfe' : meta.border}`, color: risk === 'ALL' ? '#1d4ed8' : meta.color }
                  : { background: '#f7f8fa', border: '1px solid #e5e7eb', color: '#9ca3af' }}
              >
                {risk}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bidders Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs" style={{ color: '#9ca3af' }}>
            No bidder submissions found matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-fenco">
              <thead>
                <tr>
                  <th>Bidder Reference</th>
                  <th>Company Entity</th>
                  <th>Identifiers</th>
                  <th>Tender ID</th>
                  <th className="text-center">Score</th>
                  <th className="text-center">Risk Level</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const riskStyle = RISK_BADGES[b.risk_level] || RISK_BADGES.PENDING;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => handleOpenBidder(b.id)}
                      className="cursor-pointer group"
                    >
                      <td>
                        <span className="font-mono font-bold text-xs" style={{ color: '#2563eb' }}>{b.id}</span>
                      </td>
                      <td>
                        <div className="font-bold text-xs" style={{ color: '#111827' }}>{b.company_name}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>
                          {b.company_type || 'Private Limited'} · Local Content: {b.local_content_pct || 0}%
                        </div>
                      </td>
                      <td>
                        <div className="font-mono text-[11px]" style={{ color: '#6b7280' }}>
                          <div>PAN: <span style={{ color: '#374151' }}>{b.pan || '—'}</span></div>
                          <div>GST: <span style={{ color: '#374151' }}>{b.gstin || '—'}</span></div>
                        </div>
                      </td>
                      <td className="text-[11px]" style={{ color: '#9ca3af' }}>{b.tender_id}</td>
                      <td className="text-center">
                        <div className="font-black text-base" style={{ color: '#111827' }}>
                          {b.compliance_score != null ? b.compliance_score.toFixed(0) : '—'}
                          <span className="text-[10px] font-normal" style={{ color: '#9ca3af' }}>/100</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: riskStyle.bg, border: `1.5px solid ${riskStyle.border}`, color: riskStyle.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: riskStyle.dot }} />
                          {b.risk_level || 'PENDING'}
                        </span>
                      </td>
                      <td className="text-center">
                        <StatusBadge status={b.overall_status || 'PENDING'} />
                      </td>
                      <td className="text-right">
                        <button
                          onClick={e => { e.stopPropagation(); handleOpenBidder(b.id); }}
                          className="btn-secondary px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1 font-semibold"
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
