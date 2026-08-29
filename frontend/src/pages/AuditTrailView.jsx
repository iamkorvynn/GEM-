import React, { useEffect, useState } from 'react';
import { Activity, Search, UserCheck } from 'lucide-react';
import { fetchAuditTrail } from '../services/api';

export default function AuditTrailView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAuditTrail()
      .then(data => { setEvents(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = events.filter(e =>
    (e.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.source || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.actor || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.details || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="card px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ borderLeft: '4px solid #6366f1' }}>
        <div className="flex items-center gap-3 pl-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe' }}>
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: '#111827' }}>Immutable Procurement Audit Trail</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              Cryptographically timestamped chronological logging for automated verifications, AI analysis, and officer decisions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: '#6b7280' }}>
          <span className="font-bold" style={{ color: '#111827' }}>{events.length}</span> Total Logged Events
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 pointer-events-none" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by action, actor, or details..."
            className="form-input w-full pl-10 pr-4 py-2.5 text-xs rounded-xl"
          />
        </div>
        <div className="text-xs font-medium" style={{ color: '#9ca3af' }}>
          Showing <span className="font-bold" style={{ color: '#111827' }}>{filtered.length}</span> audit records
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs" style={{ color: '#9ca3af' }}>
            No audit records found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-fenco">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Action</th>
                  <th>Entity / Source</th>
                  <th>Actor</th>
                  <th>Result</th>
                  <th>Event Details & Integrity Proof</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, idx) => {
                  const isGood = ['VERIFIED', 'PASS', 'QUALIFIED', 'SUCCESS'].includes(e.result);
                  const isBad  = ['HIGH', 'FAILED', 'CRITICAL', 'DISQUALIFIED'].includes(e.result);
                  const color  = isGood ? '#15803d' : isBad ? '#991b1b' : '#92400e';
                  const bg     = isGood ? '#dcfce7' : isBad ? '#fee2e2' : '#fef3c7';
                  const border = isGood ? '#bbf7d0' : isBad ? '#fecaca' : '#fde68a';
                  return (
                    <tr key={idx}>
                      <td>
                        <span className="font-mono text-[11px]" style={{ color: '#6b7280' }}>
                          {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <div className="text-[10px]" style={{ color: '#9ca3af' }}>{new Date(e.timestamp).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <span className="font-bold text-xs" style={{ color: '#111827' }}>{e.action}</span>
                      </td>
                      <td>
                        <span className="font-mono text-[11px]" style={{ color: '#374151' }}>{e.source || 'SYSTEM'}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 font-medium text-xs" style={{ color: '#374151' }}>
                          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                          <span>{e.actor}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-block"
                          style={{ background: bg, border: `1.5px solid ${border}`, color }}
                        >
                          {e.result}
                        </span>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <div className="line-clamp-2 leading-relaxed text-xs" style={{ color: '#6b7280' }}>{e.details}</div>
                        {e.previous_state && (
                          <div className="text-[10px] font-mono mt-0.5 truncate" style={{ color: '#9ca3af' }}>
                            State: {e.previous_state} → {e.new_state}
                          </div>
                        )}
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
