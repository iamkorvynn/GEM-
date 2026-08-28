import React, { useEffect, useState } from 'react';
import { FileText, Plus, Search, Calendar, Users, Eye, Sparkles, Building, ArrowRight, Layers, ShieldCheck } from 'lucide-react';
import { fetchTenders } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

export default function TenderList({ onSelectTender }) {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchTenders()
      .then((data) => {
        setTenders(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = tenders.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.department.toLowerCase().includes(search.toLowerCase())
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
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">GeM Tender Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Active procurement tenders, compliance rules, and bidder evaluation progress
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-glass-primary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Tender</span>
        </button>
      </div>

      {/* Filter & Search */}
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
            placeholder="Search tender ID, title, or department..."
            className="glass-input w-full pl-10 pr-4 py-2.5 text-xs rounded-xl"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="text-white font-semibold">{filtered.length}</span> of {tenders.length} tenders
        </div>
      </div>

      {/* Tenders Table */}
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
            No tenders found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th className="py-3.5 px-4">Tender ID</th>
                  <th className="py-3.5 px-4">Tender Title</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Deadline</th>
                  <th className="py-3.5 px-4 text-center">Bidders</th>
                  <th className="py-3.5 px-4">Verification Progress</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTender(t.id)}
                    className="hover:bg-white/[0.025] transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4 font-bold text-blue-400 font-mono">
                      {t.id}
                    </td>
                    <td className="py-4 px-4 font-semibold text-white max-w-xs truncate group-hover:text-blue-300 transition-colors">
                      {t.title}
                    </td>
                    <td className="py-4 px-4 text-slate-400 max-w-xs truncate">
                      {t.department}
                    </td>
                    <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" /> {t.deadline}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-300">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {t.bidders_count || 3}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-36">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Verified</span>
                          <span className="font-semibold text-slate-300">{t.verification_progress}%</span>
                        </div>
                        <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            style={{ width: `${t.verification_progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTender(t.id);
                        }}
                        className="btn-glass-ghost px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1 font-semibold group-hover:text-blue-400 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View & Analyze</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Tender Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            className="rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative overflow-hidden"
            style={{
              background: 'rgba(11,18,36,0.95)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />
            <h3 className="text-base font-bold text-white">Create New GeM Tender</h3>
            <p className="text-xs text-slate-400">
              Enter tender identification parameters or select a pre-configured template for automated criteria extraction.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Tender Reference ID</label>
                <input type="text" defaultValue="GEM/2026/B/891204" className="glass-input w-full p-2.5 rounded-xl text-xs" />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Tender Title</label>
                <input type="text" defaultValue="Supply of Industrial Gas Detectors" className="glass-input w-full p-2.5 rounded-xl text-xs" />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Department</label>
                <input type="text" defaultValue="Central Thermal Power Station" className="glass-input w-full p-2.5 rounded-xl text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNewModal(false)} className="btn-glass-ghost px-3 py-1.5 text-xs rounded-xl">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNewModal(false);
                  onSelectTender('GEM/2026/B/784921');
                }}
                className="btn-glass-primary px-4 py-1.5 text-xs rounded-xl font-semibold"
              >
                Create & Ingest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
