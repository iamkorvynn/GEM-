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
        setEvents(data);
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" /> Immutable Procurement Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically signed chronological audit logging for all automated verifications, AI analysis, and officer decisions.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter audit events by action, actor, or details..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filtered.length} audit records
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-[11px] font-bold uppercase tracking-wider">
              <th className="p-3.5">Timestamp (UTC)</th>
              <th className="p-3.5">Action Event</th>
              <th className="p-3.5">Actor</th>
              <th className="p-3.5">System Source</th>
              <th className="p-3.5">Result Status</th>
              <th className="p-3.5">Event Rationale & Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs font-sans">
            {filtered.map((e, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                  {new Date(e.timestamp).toLocaleString()}
                </td>
                <td className="p-3.5 font-bold font-mono text-blue-700">{e.action}</td>
                <td className="p-3.5 font-semibold text-slate-800">{e.actor}</td>
                <td className="p-3.5 text-slate-600 font-mono text-[11px]">{e.source}</td>
                <td className="p-3.5">
                  <StatusBadge status={e.result} />
                </td>
                <td className="p-3.5 text-slate-700 max-w-md leading-relaxed">{e.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
