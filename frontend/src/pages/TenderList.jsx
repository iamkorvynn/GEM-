import React, { useEffect, useState } from 'react';
import { FileText, Plus, Search, Calendar, Users, Eye, Sparkles, Building, ArrowRight } from 'lucide-react';
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
        setTenders(data);
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" /> GeM Tender Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active procurement tenders, compliance rules, and bidder evaluation progress.
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Tender</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tender ID, title, or department..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filtered.length} of {tenders.length} tenders
        </div>
      </div>

      {/* Tenders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-[11px] font-bold uppercase tracking-wider">
              <th className="p-3.5">Tender ID</th>
              <th className="p-3.5">Tender Title</th>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Deadline</th>
              <th className="p-3.5 text-center">Bidders</th>
              <th className="p-3.5">Verification Progress</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-bold text-blue-600 font-mono">{t.id}</td>
                <td className="p-3.5 font-semibold text-slate-900 max-w-xs truncate">{t.title}</td>
                <td className="p-3.5 text-slate-600 max-w-xs truncate">{t.department}</td>
                <td className="p-3.5 text-slate-600 whitespace-nowrap">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> {t.deadline}
                  </span>
                </td>
                <td className="p-3.5 text-center font-bold text-slate-800">
                  <span className="px-2 py-0.5 bg-slate-100 rounded-full">{t.bidders_count || 3}</span>
                </td>
                <td className="p-3.5">
                  <div className="w-36">
                    <div className="flex justify-between text-[10px] text-slate-600 mb-1">
                      <span>Verified</span>
                      <span className="font-semibold">{t.verification_progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${t.verification_progress}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="p-3.5">
                  <StatusBadge status={t.status} />
                </td>
                <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => onSelectTender(t.id)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs transition-all inline-flex items-center"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View & Analyze
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Tender Modal Placeholder */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Create New GeM Tender</h3>
            <p className="text-xs text-slate-500">
              Enter tender identification parameters or upload tender document PDF for AI requirement extraction.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700">Tender Reference ID</label>
                <input type="text" defaultValue="GEM/2026/B/891204" className="w-full mt-1 p-2 border rounded bg-slate-50" />
              </div>
              <div>
                <label className="font-medium text-slate-700">Tender Title</label>
                <input type="text" defaultValue="Supply of Industrial Gas Detectors" className="w-full mt-1 p-2 border rounded bg-slate-50" />
              </div>
              <div>
                <label className="font-medium text-slate-700">Department</label>
                <input type="text" defaultValue="Central Thermal Power Station" className="w-full mt-1 p-2 border rounded bg-slate-50" />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setShowNewModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNewModal(false);
                  onSelectTender('GEM/2026/B/784921');
                }}
                className="px-4 py-1.5 text-xs bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
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
