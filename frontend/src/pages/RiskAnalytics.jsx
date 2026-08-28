import React, { useEffect, useState } from 'react';
import { ShieldAlert, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';

const BASE = 'http://127.0.0.1:8000/api';

const RISK_META = {
  LOW:     { color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)', label: 'Low Risk' },
  MEDIUM:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', label: 'Medium Risk' },
  HIGH:    { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)',  label: 'High Risk' },
  PENDING: { color: '#64748b', bg: 'rgba(100,116,139,0.10)',border: 'rgba(100,116,139,0.20)',label: 'Pending' },
};

function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 text-xs shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
      {label && <div className="font-bold text-slate-300 mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color || p.stroke }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function RiskAnalytics({ setCurrentTab, setActiveBidderId }) {
  const [bidders, setBidders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BASE}/bidders`);
        if (res.ok) setBidders(await res.json());
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="p-8 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
    </div>
  );

  // ── Derived stats ──────────────────────────────────────────────────────────
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, PENDING: 0 };
  bidders.forEach(b => { counts[b.risk_level] = (counts[b.risk_level] || 0) + 1; });

  const avgScore = bidders.length
    ? (bidders.reduce((s, b) => s + (b.compliance_score || 0), 0) / bidders.length).toFixed(1)
    : 0;

  const scoreDistribution = [
    { range: '90–100', count: bidders.filter(b => b.compliance_score >= 90).length, color: '#10b981' },
    { range: '70–89',  count: bidders.filter(b => b.compliance_score >= 70 && b.compliance_score < 90).length, color: '#3b82f6' },
    { range: '50–69',  count: bidders.filter(b => b.compliance_score >= 50 && b.compliance_score < 70).length, color: '#f59e0b' },
    { range: '<50',    count: bidders.filter(b => b.compliance_score < 50).length, color: '#ef4444' },
  ];

  const radarData = [
    { subject: 'GST Valid',     score: bidders.filter(b => b.risk_level === 'LOW').length * 20 + 40 },
    { subject: 'PAN Match',     score: bidders.filter(b => b.risk_level !== 'HIGH').length * 15 + 30 },
    { subject: 'OEM Auth',      score: Math.max(10, 80 - counts.HIGH * 15) },
    { subject: 'Debarment',     score: Math.max(10, 90 - counts.HIGH * 10) },
    { subject: 'Local Content', score: Math.max(20, 75 - counts.MEDIUM * 8) },
    { subject: 'EPFO Active',   score: Math.max(30, 85 - counts.HIGH * 12) },
  ];

  const sorted = [...bidders].sort((a, b) => (a.compliance_score || 0) - (b.compliance_score || 0));

  return (
    <div className="p-6 space-y-6 relative z-1">

      {/* ── Header ── */}
      <div className="glass rounded-2xl px-6 py-5 relative overflow-hidden animate-fade-up"
        style={{ boxShadow: '0 0 40px rgba(239,68,68,0.06)' }}>
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: 'linear-gradient(180deg, #ef4444, #f59e0b)' }} />
        <div className="pl-4">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" /> Risk Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Aggregate risk distribution and compliance scoring across all {bidders.length} registered bidders</p>
        </div>
      </div>

      {/* ── Risk Distribution KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {Object.entries(RISK_META).map(([level, meta]) => (
          <div key={level} className="glass rounded-2xl p-5 relative overflow-hidden group"
            style={{ boxShadow: `0 0 30px ${meta.color}15` }}>
            <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full blur-xl opacity-20 group-hover:opacity-35 transition-opacity"
              style={{ background: meta.color }} />
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{meta.label}</div>
            <div className="text-4xl font-black" style={{ color: meta.color }}>{counts[level] || 0}</div>
            <div className="text-xs text-slate-600 mt-1">
              {bidders.length > 0 ? ((counts[level] || 0) / bidders.length * 100).toFixed(0) : 0}% of bidders
            </div>
            {/* Mini bar */}
            <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${bidders.length > 0 ? (counts[level] || 0) / bidders.length * 100 : 0}%`,
                background: meta.color
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Average score banner ── */}
      <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div>
          <div className="text-xs text-slate-500 mb-0.5">Portfolio Average Compliance Score</div>
          <div className="text-3xl font-black text-white">{avgScore}<span className="text-sm font-normal text-slate-500">/100</span></div>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {avgScore >= 70
            ? <><TrendingUp className="w-5 h-5 text-emerald-400" /><span className="text-emerald-400">Healthy Portfolio</span></>
            : <><TrendingDown className="w-5 h-5 text-red-400" /><span className="text-red-400">Needs Attention</span></>}
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Score distribution bar */}
        <div className="glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '140ms' }}>
          <h2 className="text-sm font-bold text-white mb-4">Compliance Score Distribution</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} barCategoryGap="35%">
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" name="Bidders" radius={[6, 6, 0, 0]}>
                  {scoreDistribution.map((d, i) => <Cell key={i} fill={d.color} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar — rule category health */}
        <div className="glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <h2 className="text-sm font-bold text-white mb-4">Rule Category Health</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#475569' }} />
                <Radar name="Health Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.18} strokeWidth={2} />
                <Tooltip content={<GlassTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bidder Risk Leaderboard ── */}
      <div className="glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '220ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Bidder Risk Leaderboard <span className="text-slate-600 font-normal text-xs">(sorted by score, lowest first)</span></h2>
          <span className="text-xs text-slate-600">{bidders.length} bidders</span>
        </div>
        <div className="space-y-2">
          {sorted.map((b, i) => {
            const meta = RISK_META[b.risk_level] || RISK_META.PENDING;
            const pct = b.compliance_score || 0;
            return (
              <button
                key={b.id}
                onClick={() => { setActiveBidderId(b.id); setCurrentTab('bidder-profile'); }}
                className="w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all group"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
              >
                {/* Rank */}
                <span className="text-xs font-bold text-slate-700 w-5 shrink-0 text-right">{i + 1}</span>

                {/* Risk dot */}
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />

                {/* Company name */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{b.company_name}</div>
                  <div className="text-[10px] text-slate-600 truncate font-mono">{b.id} · {b.pan || '—'}</div>
                </div>

                {/* Score bar */}
                <div className="w-32 shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500">Score</span>
                    <span className="text-xs font-bold" style={{ color: meta.color }}>{pct.toFixed(0)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: meta.color }} />
                  </div>
                </div>

                {/* Risk badge */}
                <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                  style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}>
                  {b.risk_level}
                </span>

                <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition shrink-0" />
              </button>
            );
          })}

          {bidders.length === 0 && (
            <div className="text-center py-12 text-slate-600">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No bidders registered yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Flags Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '260ms' }}>
        {[
          { label: 'Bidders Needing Immediate Action', count: counts.HIGH, icon: AlertTriangle, color: '#ef4444', desc: 'HIGH risk — critical discrepancies found' },
          { label: 'Bidders Under Review', count: counts.MEDIUM, icon: ShieldAlert, color: '#f59e0b', desc: 'MEDIUM risk — flagged for officer review' },
          { label: 'Fully Compliant Bidders', count: counts.LOW, icon: CheckCircle2, color: '#10b981', desc: 'LOW risk — all checks passed' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="glass rounded-2xl p-5" style={{ boxShadow: `0 0 25px ${item.color}10` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl" style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className="text-xs font-semibold text-slate-400">{item.label}</span>
              </div>
              <div className="text-4xl font-black mb-1" style={{ color: item.color }}>{item.count}</div>
              <div className="text-[10px] text-slate-600">{item.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
