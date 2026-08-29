import React, { useEffect, useState } from 'react';
import {
  FileText, Plus, Search, ChevronRight, Clock, CheckCircle2,
  X, Trophy, AlertTriangle, Loader2
} from 'lucide-react';

const BASE = '/api';

const STATUS_STYLE = {
  ACTIVE:           { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e', label: 'Active' },
  OPEN:             { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e', label: 'Open' },
  COMPLETED:        { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', dot: '#8b5cf6', label: 'Completed' },
  UNDER_EVALUATION: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', label: 'Under Review' },
  CLOSED:           { color: '#6b7280', bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8', label: 'Closed' },
};

const DEPT_OPTIONS = [
  'Ministry of Defence',
  'Ministry of Finance',
  'Ministry of Health & Family Welfare',
  'Ministry of Heavy Industries',
  'Ministry of Electronics & IT',
  'Ministry of Road Transport',
  'Ministry of Railways',
  'GeM Central Procurement',
  'Department of Pharmaceuticals',
  'Other',
];

export default function TenderList({ onSelectTender, showToast }) {
  const [tenders, setTenders]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '', department: DEPT_OPTIONS[0], description: '',
    deadline: '', estimated_cost: '',
  });

  const load = async () => {
    try {
      const res = await fetch(`${BASE}/tenders`);
      if (res.ok) setTenders(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.deadline.trim()) {
      showToast?.('Missing Fields', 'Title and deadline are required.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/tenders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          department: form.department,
          description: form.description || `${form.title} — Simulated GeM auto-pull`,
          deadline: form.deadline,
          estimated_cost: form.estimated_cost || 'INR 1.0 Crore',
        }),
      });
      if (!res.ok) {
        let msg = 'Failed';
        try {
          const errData = await res.json();
          msg = errData.detail || msg;
        } catch {
          msg = `HTTP Error ${res.status}`;
        }
        throw new Error(msg);
      }
      const created = await res.json();
      setShowForm(false);
      setForm({ title: '', department: DEPT_OPTIONS[0], description: '', deadline: '', estimated_cost: '' });
      await load();
      showToast?.('Tender Imported', `${created.id} — ${created.title}`, 'success');
    } catch (err) {
      showToast?.('Import Failed', err.message, 'error');
    }
    setSubmitting(false);
  };

  const filtered = tenders.filter(t => {
    const matchSearch =
      (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.department || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openCount      = tenders.filter(t => ['ACTIVE', 'OPEN', 'UNDER_EVALUATION'].includes(t.status)).length;
  const completedCount = tenders.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="p-6 space-y-5">

      {/* ── Page Header ── */}
      <div className="card px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{ borderLeft: '4px solid #3b82f6' }}>
        <div className="flex items-center gap-3 pl-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Tenders</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {openCount} open · {completedCount} completed · Click any tender to manage bidders
            </p>
          </div>
        </div>
        <button
          id="import-tender-btn"
          onClick={() => setShowForm(v => !v)}
          className="btn-primary px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : '+ Import Tender'}
        </button>
      </div>

      {/* ── Import Tender Form ── */}
      {showForm && (
        <div className="card p-5 animate-fade-up" style={{ borderTop: '3px solid #3b82f6' }}>
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-sm font-bold" style={{ color: '#111827' }}>Import Tender from GeM Portal</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md ml-auto" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
              Simulates GeM auto-pull
            </span>
          </div>
          <form onSubmit={handleImport} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
                Tender Title *
              </label>
              <input
                type="text" required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Supply of Industrial Safety Equipment — Phase II"
                className="form-input w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
                Department *
              </label>
              <select
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                className="form-input w-full px-3 py-2.5 text-sm"
              >
                {DEPT_OPTIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
                Submission Deadline *
              </label>
              <input
                type="date" required
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="form-input w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
                Estimated Value
              </label>
              <input
                type="text"
                value={form.estimated_cost}
                onChange={e => setForm(f => ({ ...f, estimated_cost: e.target.value }))}
                placeholder="e.g. INR 2.5 Crore"
                className="form-input w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
                Description (optional)
              </label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief scope of work"
                className="form-input w-full px-3 py-2.5 text-sm"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between pt-2"
              style={{ borderTop: '1px solid #e5e7eb' }}>
              <button
                type="button"
                onClick={() => setForm({
                  title: 'Supply and Installation of Electric Vehicle (EV) Charging Stations',
                  department: 'Ministry of Heavy Industries',
                  description: 'Procurement of 50kW DC fast chargers and associated electrical panels for installation across national PSU parking hubs.',
                  deadline: '2026-11-20',
                  estimated_cost: 'INR 3.20 Crores'
                })}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
                className="hover:bg-slate-100"
              >
                🪄 Autofill Mock Tender
              </button>
              <button
                type="submit" disabled={submitting}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {submitting ? 'Importing…' : 'Import Tender'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 pointer-events-none" style={{ color: '#9ca3af' }} />
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tenders…"
            className="form-input w-full pl-10 pr-4 py-2.5 text-xs rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'ACTIVE', 'COMPLETED', 'UNDER_EVALUATION'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
              style={filterStatus === s
                ? { background: '#dbeafe', border: '1.5px solid #bfdbfe', color: '#1d4ed8' }
                : { background: '#f7f8fa', border: '1px solid #e5e7eb', color: '#9ca3af' }}
            >
              {s === 'UNDER_EVALUATION' ? 'Under Review' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs shrink-0" style={{ color: '#9ca3af' }}>
          {filtered.length} tender{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Tender Cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-semibold" style={{ color: '#374151' }}>
            {tenders.length === 0 ? 'No tenders yet — import one above' : 'No tenders match your filter'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(t => {
            const st = STATUS_STYLE[t.status] || STATUS_STYLE.ACTIVE;
            const isCompleted = t.status === 'COMPLETED';
            return (
              <div
                key={t.id}
                id={`tender-card-${t.id}`}
                className="card card-hover p-5 cursor-pointer animate-fade-up"
                style={{ borderLeft: `4px solid ${st.dot}` }}
                onClick={() => onSelectTender(t.id, t.title)}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <span
                      className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md"
                      style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}
                    >
                      {t.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                    <span className="text-[10px] font-bold" style={{ color: st.color }}>{st.label}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold mt-2 mb-1 leading-snug" style={{ color: '#111827' }}>{t.title}</h3>
                <p className="text-xs mb-3 line-clamp-2" style={{ color: '#6b7280' }}>{t.description}</p>

                {/* Winner badge (completed) */}
                {isCompleted && t.winner_bidder_id && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-xl"
                    style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                    <Trophy className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="text-[11px] font-bold" style={{ color: '#7c3aed' }}>
                      Winner: {t.winner_bidder_id}
                    </span>
                  </div>
                )}
                {isCompleted && !t.winner_bidder_id && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-xl"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-[11px]" style={{ color: '#9ca3af' }}>No award given</span>
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Department', value: t.department?.split(' ').slice(-2).join(' ') || t.department },
                    { label: 'Deadline',   value: t.deadline },
                    { label: 'Bidders',    value: `${t.bidder_count ?? t.bidders_count ?? 0} submitted` },
                  ].map((item, i) => (
                    <div key={i} className="card-inner px-2.5 py-2">
                      <div className="text-[9px] font-bold uppercase tracking-wide mb-0.5" style={{ color: '#9ca3af' }}>{item.label}</div>
                      <div className="text-[11px] font-semibold truncate" style={{ color: '#374151' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#9ca3af' }}>
                    <Clock className="w-3 h-3" />
                    Created {t.created_date}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onSelectTender(t.id, t.title); }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                    style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}
                  >
                    View Bidders <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

