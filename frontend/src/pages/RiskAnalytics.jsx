import React, { useEffect, useState } from 'react';
import { ShieldAlert, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const BASE = '/api';

const RISK_META = {
  LOW:     { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', label: 'Low Risk' },
  MEDIUM:  { color: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: 'Medium Risk' },
  HIGH:    { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', text: '#991b1b', label: 'High Risk' },
  PENDING: { color: '#6b7280', bg: '#f8fafc', border: '#e2e8f0', text: '#475569', label: 'Pending' },
};

function LightTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-xs" style={{ background: '#fff', border: '1.5px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
      {label && <div className="font-bold mb-1" style={{ color: '#374151' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color || p.stroke }} />
          <span style={{ color: '#6b7280' }}>{p.name}:</span>
          <span className="font-semibold" style={{ color: '#111827' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function RiskAnalytics({ go, showToast }) {
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

  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, PENDING: 0 };
  bidders.forEach(b => { counts[b.risk_level] = (counts[b.risk_level] || 0) + 1; });

  const avgScore = bidders.length
    ? (bidders.reduce((s, b) => s + (b.compliance_score || 0), 0) / bidders.length).toFixed(1)
    : 0;

  const scoreDistribution = [
    { range: '90–100', count: bidders.filter(b => b.compliance_score >= 90).length, color: '#22c55e' },
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
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="card px-6 py-5" style={{ borderLeft: '4px solid #ef4444' }}>
        <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: '#111827' }}>
          <ShieldAlert className="w-5 h-5 text-red-500" /> Risk Analytics
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
          Aggregate risk distribution and compliance scoring across all {bidders.length} registered bidders
        </p>
      </div>

      {/* Risk Distribution KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {Object.entries(RISK_META).map(([level, meta]) => (
          <div key={level} className="card p-5" style={{ borderTop: `3px solid ${meta.color}` }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>{meta.label}</div>
            <div className="text-4xl font-black" style={{ color: meta.color }}>{counts[level] || 0}</div>
            <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>
              {bidders.length > 0 ? ((counts[level] || 0) / bidders.length * 100).toFixed(0) : 0}% of bidders
            </div>
            <div className="mt-3 h-1.5 rounded-full progress-track overflow-hidden">
              <div style={{ width: `${bidders.length > 0 ? (counts[level] || 0) / bidders.length * 100 : 0}%`, background: meta.color, height: '100%', borderRadius: '999px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Average Score Banner */}
      <div className="card px-6 py-4 flex items-center justify-between animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div>
          <div className="text-xs mb-0.5" style={{ color: '#9ca3af' }}>Portfolio Average Compliance Score</div>
          <div className="text-3xl font-black" style={{ color: '#111827' }}>
            {avgScore}<span className="text-sm font-normal" style={{ color: '#9ca3af' }}>/100</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {avgScore >= 70
            ? <><TrendingUp className="w-5 h-5 text-green-500" /><span style={{ color: '#15803d' }}>Healthy Portfolio</span></>
            : <><TrendingDown className="w-5 h-5 text-red-500" /><span style={{ color: '#991b1b' }}>Needs Attention</span></>}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5 animate-fade-up" style={{ animationDelay: '140ms' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#111827' }}>Compliance Score Distribution</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} barCategoryGap="35%">
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<LightTooltip />} cursor={{ fill: 'rgba(59,130,246,0.04)' }} />
                <Bar dataKey="count" name="Bidders" radius={[6, 6, 0, 0]}>
                  {scoreDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#111827' }}>Rule Category Health</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#d1d5db' }} />
                <Radar name="Health Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} />
                <Tooltip content={<LightTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bidder Risk Leaderboard */}
      <div className="card p-5 animate-fade-up" style={{ animationDelay: '220ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: '#111827' }}>
            Bidder Risk Leaderboard <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>(sorted by score, lowest first)</span>
          </h2>
          <span className="text-xs" style={{ color: '#9ca3af' }}>{bidders.length} bidders</span>
        </div>
        <div className="space-y-2">
          {sorted.map((b, i) => {
            const meta = RISK_META[b.risk_level] || RISK_META.PENDING;
            const pct = b.compliance_score || 0;
            return (
              <button
                key={b.id}
                onClick={() => {
                  go('bidder-detail', { bidderId: b.id, bidderName: b.company_name });
                }}
                className="w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all"
                style={{ background: '#f7f8fa', border: '1px solid #e5e7eb' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f7f8fa'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <span className="text-xs font-bold w-5 shrink-0 text-right" style={{ color: '#d1d5db' }}>{i + 1}</span>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: '#111827' }}>{b.company_name}</div>
                  <div className="text-[10px] truncate font-mono" style={{ color: '#9ca3af' }}>{b.id} · {b.pan || '—'}</div>
                </div>
                <div className="w-32 shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px]" style={{ color: '#9ca3af' }}>Score</span>
                    <span className="text-xs font-bold" style={{ color: meta.color }}>{pct.toFixed(0)}</span>
                  </div>
                  <div className="h-1.5 rounded-full progress-track overflow-hidden">
                    <div style={{ width: `${pct}%`, background: meta.color, height: '100%', borderRadius: '999px' }} />
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                  style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.text }}>
                  {b.risk_level}
                </span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: '#d1d5db' }} />
              </button>
            );
          })}
          {bidders.length === 0 && (
            <div className="text-center py-12" style={{ color: '#9ca3af' }}>
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No bidders registered yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Flags Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '260ms' }}>
        {[
          { label: 'Bidders Needing Immediate Action', count: counts.HIGH, Icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', text: '#991b1b', desc: 'HIGH risk — critical discrepancies found' },
          { label: 'Bidders Under Review',              count: counts.MEDIUM, Icon: ShieldAlert, color: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#92400e', desc: 'MEDIUM risk — flagged for officer review' },
          { label: 'Fully Compliant Bidders',           count: counts.LOW, Icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', desc: 'LOW risk — all checks passed' },
        ].map((item, i) => (
          <div key={i} className="card p-5" style={{ borderTop: `3px solid ${item.color}` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                <item.Icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: '#374151' }}>{item.label}</span>
            </div>
            <div className="text-4xl font-black mb-1" style={{ color: item.color }}>{item.count}</div>
            <div className="text-[10px]" style={{ color: '#9ca3af' }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

