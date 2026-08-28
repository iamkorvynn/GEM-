import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Filter, Search, Clock, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';
import { fetchAuditTrail } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

export default function AuditTrailView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAuditTrail()
      .then((data) => {
        setEvents(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = events.filter(
    (e) =>
      (e.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.source || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.actor || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.details || '').toLowerCase().includes(search.toLowerCase())
  );

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
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Immutable Procurement Audit Trail</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographically timestamped chronological logging for automated verifications, AI analysis, and officer decisions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-white">{events.length}</span> Total Logged Events
        </div>
      </div>

      {/* Filter Bar */}
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
            placeholder="Filter audit events by action, actor, or details..."
            className="glass-input w-full pl-10 pr-4 py-2.5 text-xs rounded-xl"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="text-white font-semibold">{filtered.length}</span> audit records
        </div>
      </div>

      {/* Audit Log Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(8,14,30,0.80)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}
      >
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No audit records found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Event Action</th>
                  <th className="py-3.5 px-4">Entity / Source</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Result</th>
                  <th className="py-3.5 px-4">Event Details & Integrity Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filtered.map((e, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.025] transition-colors">
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <div className="text-[10px] text-slate-600">{new Date(e.timestamp).toLocaleDateString()}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-white">
                      {e.action}
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-300">
                      {e.source || 'SYSTEM'}
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>{e.actor}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-block"
                        style={{
                          background: e.result === 'VERIFIED' || e.result === 'PASS' || e.result === 'QUALIFIED' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                          color: e.result === 'VERIFIED' || e.result === 'PASS' || e.result === 'QUALIFIED' ? '#6ee7b7' : '#fcd34d',
                          border: `1px solid ${e.result === 'VERIFIED' || e.result === 'PASS' || e.result === 'QUALIFIED' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                        }}
                      >
                        {e.result}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 max-w-md">
                      <div className="line-clamp-2 leading-relaxed">{e.details}</div>
                      {e.previous_state && (
                        <div className="text-[10px] text-slate-600 font-mono mt-0.5 truncate">
                          State Transition: {e.previous_state} → {e.new_state}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
