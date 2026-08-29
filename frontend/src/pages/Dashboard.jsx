import React, { useEffect, useState } from 'react';
import {
  FileText, Users, CheckCircle2, Clock, ShieldAlert,
  TrendingUp, Activity, ArrowRight, ShieldCheck, Plus
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardStats } from '../services/api';

const KPI_CARDS = [
  { label: 'Active Tenders',  value: 12, sub: '2 closing this week',    icon: FileText,     accent: '#2563eb', light: '#eff6ff', border: '#bfdbfe', textColor: '#1e40af' },
  { label: 'Total Bidders',   value: 48, sub: 'Across all tenders',     icon: Users,        accent: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe', textColor: '#5b21b6' },
  { label: 'Verified',        value: 31, sub: '64.5% Fully Compliant',  icon: CheckCircle2, accent: '#16a34a', light: '#f0fdf4', border: '#bbf7d0', textColor: '#15803d' },
  { label: 'Pending Reviews', value: 11, sub: 'Officer Action Required', icon: Clock,        accent: '#d97706', light: '#fffbeb', border: '#fde68a', textColor: '#92400e' },
  { label: 'High Risk',       value: 6,  sub: 'Critical Discrepancies', icon: ShieldAlert,  accent: '#dc2626', light: '#fef2f2', border: '#fecaca', textColor: '#991b1b' },
];

const PIE_DATA = [
  { name: 'Compliant (90–100)', value: 31, color: '#22c55e' },
  { name: 'Review Req (70–89)', value: 11, color: '#f59e0b' },
  { name: 'Non-Compliant (<70)', value: 6, color: '#ef4444' },
];

const BAR_DATA = [
  { category: 'GST Reg',    Pass: 44, Fail: 4  },
  { category: 'PAN Card',   Pass: 46, Fail: 2  },
  { category: 'Udyam',      Pass: 38, Fail: 10 },
  { category: 'OEM Auth',   Pass: 32, Fail: 16 },
  { category: 'Local Ctnt', Pass: 41, Fail: 7  },
  { category: 'Debarment',  Pass: 46, Fail: 2  },
];

const DEMO_SCENARIOS = [
  { id: 'BIDDER-A', label: 'Bidder A — Fully Compliant',       sub: 'ABC Industrial Solutions · Score: 98', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'BIDDER-B', label: 'Bidder B — GSTIN Mismatch',        sub: 'Nova Safety Systems · Score: 72',     color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  { id: 'BIDDER-C', label: 'Bidder C — OEM Date Fraud Signal', sub: 'Alpha Tech Enterprises · Score: 61',  color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  { id: 'BIDDER-D', label: 'Bidder D — Blacklist Match',       sub: 'Prime Industrial Tech · Score: 55',   color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  { id: 'BIDDER-E', label: 'Bidder E — Dual Red Flags',        sub: 'Radiant Procurement · Score: 42',     color: '#9f1239', bg: '#fff1f2', border: '#fda4af' },
];

const ACTIVITY_FEED = [
  { time: '20:14 IST', title: 'GSTIN Verification Complete',      bidder: 'ABC Industrial Solutions', source: 'GST Adapter',         result: 'VERIFIED',        color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  { time: '20:15 IST', title: 'Legal Name Discrepancy Flagged',   bidder: 'Nova Safety Systems',      source: 'AI Extract Engine',   result: 'REVIEW REQUIRED', color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
  { time: '20:17 IST', title: 'OEM Date Pre-dates Incorporation', bidder: 'Alpha Tech Enterprises',   source: 'MCA21 Correlation',   result: 'HIGH RISK',       color: '#991b1b', bg: '#fee2e2', border: '#fecaca' },
  { time: '20:18 IST', title: 'Fuzzy Blacklist Match (97%)',      bidder: 'Prime Industrial Tech',    source: 'Debarment Watchlist', result: 'HIGH RISK',       color: '#991b1b', bg: '#fee2e2', border: '#fecaca' },
  { time: '20:19 IST', title: 'Officer Decision Recorded',        bidder: 'ABC Industrial Solutions', source: 'Rajesh Sharma',       result: 'QUALIFIED',       color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' },
];

function LightTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs"
      style={{ background: '#fff', border: '1.5px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
    >
      <div className="font-bold text-gray-700 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="text-gray-900 font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ go, showToast }) {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Officer';

  useEffect(() => {
    fetchDashboardStats()
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 space-y-4">
      {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
    </div>
  );

  return (
    <div className="p-6 space-y-6">

      {/* ── Welcome Header ── */}
      <div
        className="card px-7 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-fade-up overflow-hidden"
        style={{ borderTop: '4px solid #3b82f6' }}
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: '#111827' }}>
            Hello, <span style={{ color: '#2563eb' }}>{firstName}</span> 👋
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#6b7280' }}>
            GeM Bid Compliance Intelligence &middot; AI-powered 3-track verification
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d' }}>Track A • Exact</span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#dbeafe', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>Track B • Fuzzy</span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>Track C • Correlation</span>
          </div>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <button
            onClick={() => go('tenders')}
            className="btn-secondary px-5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Tenders
          </button>
          <button
            onClick={() => go('tenders')}
            className="btn-primary px-5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> New Verification
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {KPI_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="card p-4 animate-fade-up cursor-default"
              style={{ animationDelay: `${i * 60}ms`, borderTop: `3px solid ${card.accent}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest leading-tight" style={{ color: '#9ca3af' }}>
                  {card.label}
                </span>
                <div className="p-2 rounded-xl" style={{ background: card.light, border: `1px solid ${card.border}` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: card.accent }} />
                </div>
              </div>
              <div className="text-3xl font-black" style={{ color: card.accent }}>{card.value}</div>
              <div className="text-[10px] mt-1.5 font-medium" style={{ color: '#9ca3af' }}>{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut */}
        <div className="card p-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: '#111827' }}>Compliance Distribution</h2>
            <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>48 Bidders</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {PIE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<LightTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar */}
        <div className="card p-5 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: '#111827' }}>Verification Breakdown by Rule</h2>
            <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>By Category</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BAR_DATA} barCategoryGap="30%">
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<LightTooltip />} cursor={{ fill: 'rgba(59,130,246,0.04)' }} />
                <Bar dataKey="Pass" fill="#22c55e" stackId="a" radius={[4,4,0,0]} />
                <Bar dataKey="Fail" fill="#ef4444" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Activity + Demo Launcher ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Activity Feed */}
        <div className="lg:col-span-2 card p-5 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#111827' }}>
              <Activity className="w-4 h-4 text-blue-500" /> Recent Verification Activity
            </h2>
            <button
              onClick={() => go('audit-trail')}
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 transition font-semibold"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {ACTIVITY_FEED.map((act, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl transition-all"
                style={{ background: '#f7f8fa', border: '1px solid #e5e7eb' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f2f5'}
                onMouseLeave={e => e.currentTarget.style.background = '#f7f8fa'}
              >
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: act.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: '#111827' }}>{act.title}</div>
                  <div className="text-[10px] mt-0.5 truncate" style={{ color: '#9ca3af' }}>
                    {act.bidder} · {act.source}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                    style={{ background: act.bg, border: `1px solid ${act.border}`, color: act.color }}>
                    {act.result}
                  </span>
                  <span className="text-[10px]" style={{ color: '#d1d5db' }}>{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Scenario Launcher */}
        <div
          className="card p-5 flex flex-col animate-fade-up"
          style={{ animationDelay: '240ms', borderTop: '3px solid #f59e0b' }}
        >
          <div className="text-[9px] font-bold tracking-widest uppercase text-amber-600 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> Quick Bid Review
          </div>
          <h3 className="text-sm font-bold mb-1" style={{ color: '#111827' }}>5 Demo Scenarios</h3>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: '#9ca3af' }}>
            Select any bid below to open its full compliance review.
          </p>

          <div className="space-y-2 flex-1">
            {DEMO_SCENARIOS.map(sc => (
              <button
                key={sc.id}
                id={`demo-${sc.id}`}
                onClick={() => { go('bidder-detail', { bidderId: sc.id, bidderName: sc.sub.split(' · ')[0] }); }}
                className="w-full text-left p-3 rounded-xl flex items-center justify-between text-xs transition-all"
                style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <div>
                  <div className="font-semibold" style={{ color: sc.color }}>{sc.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>{sc.sub}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5" style={{ color: sc.color }} />
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 text-[10px] text-center" style={{ borderTop: '1px solid #e5e7eb', color: '#d1d5db' }}>
            GeM Compliance Platform · Prototype
          </div>
        </div>
      </div>
    </div>
  );
}
