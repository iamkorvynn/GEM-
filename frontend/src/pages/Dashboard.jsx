import React, { useEffect, useState } from 'react';
import { FileText, Users, CheckCircle2, Clock, ShieldAlert, TrendingUp, Activity, ArrowRight, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchDashboardStats } from '../services/api';

const KPI_CARDS = [
  { label: 'Active Tenders',    value: 12, sub: '2 closing this week',         icon: FileText,     accent: '#3b82f6', glow: 'rgba(59,130,246,0.18)' },
  { label: 'Total Bidders',     value: 48, sub: 'Across all tenders',          icon: Users,        accent: '#8b5cf6', glow: 'rgba(139,92,246,0.18)' },
  { label: 'Verified',          value: 31, sub: '64.5% Fully Compliant',       icon: CheckCircle2, accent: '#10b981', glow: 'rgba(16,185,129,0.18)' },
  { label: 'Pending Reviews',   value: 11, sub: 'Officer Action Required',     icon: Clock,        accent: '#f59e0b', glow: 'rgba(245,158,11,0.18)' },
  { label: 'High Risk',         value: 6,  sub: 'Critical Discrepancies',      icon: ShieldAlert,  accent: '#ef4444', glow: 'rgba(239,68,68,0.18)' },
];

const PIE_DATA = [
  { name: 'Compliant (90–100)', value: 31, color: '#10b981' },
  { name: 'Review Req (70–89)', value: 11, color: '#f59e0b' },
  { name: 'Non-Compliant (<70)', value: 6, color: '#ef4444' },
];

const BAR_DATA = [
  { category: 'GST Reg',   Pass: 44, Fail: 4  },
  { category: 'PAN Card',  Pass: 46, Fail: 2  },
  { category: 'Udyam',     Pass: 38, Fail: 10 },
  { category: 'OEM Auth',  Pass: 32, Fail: 16 },
  { category: 'Local Ctnt',Pass: 41, Fail: 7  },
  { category: 'Debarment', Pass: 46, Fail: 2  },
];

const DEMO_SCENARIOS = [
  { id: 'BIDDER-A', label: 'Bidder A — Fully Compliant',       sub: 'ABC Industrial Solutions · Score: 98', color: '#10b981' },
  { id: 'BIDDER-B', label: 'Bidder B — GSTIN Mismatch',        sub: 'Nova Safety Systems · Score: 72',     color: '#f59e0b' },
  { id: 'BIDDER-C', label: 'Bidder C — OEM Date Fraud Signal', sub: 'Alpha Tech Enterprises · Score: 61',  color: '#ef4444' },
  { id: 'BIDDER-D', label: 'Bidder D — Blacklist Match',       sub: 'Prime Industrial Tech · Score: 55',   color: '#ef4444' },
  { id: 'BIDDER-E', label: 'Bidder E — Dual Red Flags',        sub: 'Radiant Procurement · Score: 42',     color: '#ef4444' },
];

const ACTIVITY_FEED = [
  { time: '20:14 IST', title: 'GSTIN Verification Complete',        bidder: 'ABC Industrial Solutions', source: 'GST Adapter',        result: 'VERIFIED',        accent: '#10b981' },
  { time: '20:15 IST', title: 'Legal Name Discrepancy Flagged',     bidder: 'Nova Safety Systems',      source: 'AI Extract Engine',  result: 'REVIEW REQUIRED', accent: '#f59e0b' },
  { time: '20:17 IST', title: 'OEM Date Pre-dates Incorporation',   bidder: 'Alpha Tech Enterprises',   source: 'MCA21 Correlation',  result: 'HIGH RISK',       accent: '#ef4444' },
  { time: '20:18 IST', title: 'Fuzzy Blacklist Match (97%)',        bidder: 'Prime Industrial Tech',    source: 'Debarment Watchlist', result: 'HIGH RISK',       accent: '#ef4444' },
  { time: '20:19 IST', title: 'Officer Decision Recorded',          bidder: 'ABC Industrial Solutions', source: 'Rajesh Sharma',      result: 'QUALIFIED',       accent: '#3b82f6' },
];

function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 text-xs shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="font-bold text-slate-300 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ setCurrentTab, setActiveBidderId }) {
  const [loading, setLoading] = useState(true);

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
    <div className="p-6 space-y-6 relative z-1">

      {/* ── Welcome Header ── */}
      <div
        className="glass rounded-2xl px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-up overflow-hidden relative"
        style={{ boxShadow: '0 0 40px rgba(59,130,246,0.08)' }}
      >
        {/* accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: 'linear-gradient(180deg, #3b82f6, #8b5cf6)' }} />
        <div className="pl-4">
          <h1 className="text-lg font-bold text-white tracking-tight">GeM Procurement Compliance Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">Automated 3-track verification · Track A (Exact) · Track B (Fuzzy) · Track C (Correlation)</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setCurrentTab('tenders')}
            className="btn-glass-ghost px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Tenders
          </button>
          <button
            onClick={() => setCurrentTab('new-verification')}
            className="btn-glass-primary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
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
              className="glass rounded-2xl p-4 relative overflow-hidden animate-fade-up group"
              style={{ animationDelay: `${i * 60}ms`, boxShadow: `0 0 30px ${card.glow}` }}
            >
              {/* Background glow orb */}
              <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl opacity-25 transition-opacity group-hover:opacity-40" style={{ background: card.accent }} />
              <div className="flex items-center justify-between mb-3 relative z-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">{card.label}</span>
                <div className="p-2 rounded-xl" style={{ background: `${card.accent}18`, border: `1px solid ${card.accent}30` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: card.accent }} />
                </div>
              </div>
              <div className="text-3xl font-black relative z-1" style={{ color: card.accent }}>{card.value}</div>
              <div className="text-[10px] text-slate-500 mt-1 relative z-1">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut */}
        <div className="glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Compliance Distribution</h2>
            <span className="text-xs text-slate-500">48 Bidders</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {PIE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar */}
        <div className="glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Verification Breakdown by Rule</h2>
            <span className="text-xs text-slate-500">By Category</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BAR_DATA} barCategoryGap="30%">
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="Pass" fill="#10b981" stackId="a" radius={[4,4,0,0]} opacity={0.85} />
                <Bar dataKey="Fail" fill="#ef4444" stackId="a" radius={[0,0,0,0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Activity + Demo Launcher ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Activity Feed */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Recent Verification Activity
            </h2>
            <button
              onClick={() => setCurrentTab('audit-trail')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {ACTIVITY_FEED.map((act, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl transition"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
              >
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ background: act.accent }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate">{act.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {act.bidder} · {act.source}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${act.accent}15`, border: `1px solid ${act.accent}30`, color: act.accent }}>
                    {act.result}
                  </span>
                  <span className="text-[10px] text-slate-600">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Scenario Launcher */}
        <div
          className="rounded-2xl p-5 flex flex-col animate-fade-up relative overflow-hidden"
          style={{
            animationDelay: '240ms',
            background: 'rgba(8,14,30,0.80)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 0 40px rgba(59,130,246,0.08)',
          }}
        >
          {/* Orb accent */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(30px)' }} />

          <div className="relative z-1">
              <div className="text-[9px] font-bold tracking-widest uppercase text-amber-400 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> Quick Bid Review
            </div>
            <h3 className="text-sm font-bold text-white mb-1">5 Demo Scenarios</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">Select any bid below to open its full compliance review.</p>

            <div className="space-y-2">
              {DEMO_SCENARIOS.map(sc => (
                <button
                  key={sc.id}
                  id={`demo-${sc.id}`}
                  onClick={() => { setActiveBidderId(sc.id); setCurrentTab('bidder-profile'); }}
                  className="w-full text-left p-3 rounded-xl flex items-center justify-between text-xs transition-all group"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  <div>
                    <div className="font-semibold" style={{ color: sc.color }}>{sc.label}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">{sc.sub}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition" />
                </button>
              ))}
            </div>
          </div>

          <div className="relative z-1 mt-4 pt-3 border-t border-white/[0.06] text-[10px] text-slate-600 text-center">
            GeM Compliance Platform · Prototype
          </div>
        </div>
      </div>
    </div>
  );
}
