import React, { useEffect, useState } from 'react';
import {
  FileText, Users, CheckCircle2, Clock, ShieldAlert,
  TrendingUp, Activity, ArrowRight, ShieldCheck,
  MoreHorizontal, TrendingDown, ChevronRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardStats } from '../services/api';

/* ── Static demo data ─────────────────────────────────────────── */

const BALANCE_TREND = [
  { m: 'Nov', v: 28 }, { m: 'Dec', v: 22 }, { m: 'Jan', v: 35 },
  { m: 'Feb', v: 30 }, { m: 'Mar', v: 42 },
];

const ANALYTICS_DATA = [
  { name: 'Compliant',    value: 31, color: '#a5b4fc' },  // blue
  { name: 'In Review',   value: 11, color: '#fcd34d' },  // yellow
  { name: 'Non-Compliant', value: 6, color: '#fca5a5' }, // red
];

const RECENT_TENDERS = [
  { icon: '🏗️', title: 'Industrial Safety Equipment', dept: 'Ministry of Heavy Industries · 27 Aug 2026', amount: '₹2.5 Cr' },
  { icon: '💊', title: 'Medical Supplies Procurement',  dept: 'Ministry of Health · 22 Aug 2026',          amount: '₹1.1 Cr' },
  { icon: '🖥️', title: 'IT Infrastructure Services',   dept: 'MeitY · 18 Aug 2026',                       amount: '₹4.8 Cr' },
];

const ACTIVITY_FEED = [
  { time: '20:14', title: 'GSTIN Verified',              bidder: 'ABC Industrial Solutions', result: 'VERIFIED',  color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', icon: '✓' },
  { time: '20:15', title: 'Legal Name Mismatch',         bidder: 'Nova Safety Systems',      result: 'REVIEW',    color: '#92400e', bg: '#fef3c7', border: '#fde68a', icon: '⚠' },
  { time: '20:17', title: 'OEM Date Fraud Signal',       bidder: 'Alpha Tech Enterprises',   result: 'HIGH RISK', color: '#991b1b', bg: '#fee2e2', border: '#fecaca', icon: '✗' },
  { time: '20:18', title: 'Blacklist Match (97%)',       bidder: 'Prime Industrial Tech',    result: 'HIGH RISK', color: '#991b1b', bg: '#fee2e2', border: '#fecaca', icon: '✗' },
  { time: '20:19', title: 'Officer Decision Recorded',   bidder: 'ABC Industrial Solutions', result: 'QUALIFIED', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', icon: '★' },
];

const DEMO_SCENARIOS = [
  { id: 'BIDDER-A', label: 'ABC Industrial Solutions',  score: 98, risk: 'LOW',    color: '#15803d', dot: '#22c55e' },
  { id: 'BIDDER-B', label: 'Nova Safety Systems',       score: 72, risk: 'MEDIUM', color: '#92400e', dot: '#f59e0b' },
  { id: 'BIDDER-C', label: 'Alpha Tech Enterprises',    score: 61, risk: 'HIGH',   color: '#991b1b', dot: '#ef4444' },
  { id: 'BIDDER-D', label: 'Prime Industrial Tech',     score: 55, risk: 'HIGH',   color: '#991b1b', dot: '#ef4444' },
  { id: 'BIDDER-E', label: 'Radiant Procurement',       score: 42, risk: 'CRITICAL',color: '#9f1239', dot: '#f43f5e' },
];

/* ── Gauge arc component ────────────────────────────────────────── */
function GaugeArc({ pct = 90 }) {
  const r = 60, cx = 80, cy = 80;
  const start = Math.PI;
  const end   = start + (pct / 100) * Math.PI;
  const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
  const large = pct > 50 ? 1 : 0;

  // Track
  const tx1 = cx + r * Math.cos(Math.PI), ty1 = cy + r * Math.sin(Math.PI);
  const tx2 = cx + r * Math.cos(2 * Math.PI), ty2 = cy + r * Math.sin(2 * Math.PI);

  return (
    <svg width={160} height={92} style={{ display: 'block', margin: '0 auto' }}>
      {/* track */}
      <path
        d={`M ${tx1} ${ty1} A ${r} ${r} 0 0 1 ${tx2} ${ty2}`}
        fill="none" stroke="#e5e7eb" strokeWidth={10} strokeLinecap="round"
      />
      {/* fill — multi-color segments */}
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth={10} strokeLinecap="round"
      />
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#a5b4fc" />
          <stop offset="50%"  stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#fca5a5" />
        </linearGradient>
      </defs>
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={22} fontWeight={800} fill="#111827">{pct}%</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize={10} fill="#9ca3af">Done</text>
    </svg>
  );
}

/* ── Tooltip ────────────────────────────────────────────────────── */
function LightTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs"
      style={{ background: '#fff', border: '1.5px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
      <div className="font-bold text-gray-700 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.stroke }} />
          <span style={{ color: '#6b7280' }}>{p.name}:</span>
          <span style={{ color: '#111827', fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Card shell ─────────────────────────────────────────────────── */
function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '20px 20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Three-dot menu icon ─────────────────────────────────────────── */
function Dots() {
  return (
    <button
      style={{ color: '#d1d5db', padding: 4, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'}
      onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}
    >
      <MoreHorizontal style={{ width: 16, height: 16 }} />
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════════════════════════ */
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
    <div className="p-6 space-y-4">
      {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}
    </div>
  );

  return (
    <div className="p-6 space-y-5" style={{ background: '#f0f2f5', minHeight: '100%' }}>

      {/* ══ ROW 1 — Welcome + Balance Stats + Analytics ══ */}
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
      >

        {/* Welcome */}
        <Card>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1.2, marginBottom: 4 }}>
            Hello, <span style={{ color: '#3b82f6' }}>{firstName}</span>
          </h1>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
            View and manage GeM procurement compliance
          </p>

          {/* Mini trend */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 2 }}>Verification Activity</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#111827' }}>48</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Total bidders</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d',
              borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700,
            }}>
              <TrendingUp style={{ width: 12, height: 12 }} /> 14%
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>vs last month</span>
          </div>

          {/* Sparkline */}
          <div style={{ height: 56 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={BALANCE_TREND}>
                <defs>
                  <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2}
                  fill="url(#spark)" dot={false} />
                <XAxis dataKey="m" tick={{ fontSize: 9, fill: '#d1d5db' }} axisLine={false} tickLine={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: 10, color: '#d1d5db', marginTop: 4 }}>Always see your verification updates</p>
        </Card>

        {/* Balance / Stats card */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Verification Statistics</div>
            <Dots />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#111827' }}>31</span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Compliant bidders</span>
          </div>

          {/* Stacked bar */}
          <div style={{ height: 72 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { l: 'GST',  p: 44, f: 4  },
                { l: 'PAN',  p: 46, f: 2  },
                { l: 'OEM',  p: 32, f: 16 },
                { l: 'MII',  p: 41, f: 7  },
              ]} barCategoryGap="30%">
                <XAxis dataKey="l" tick={{ fontSize: 9, fill: '#d1d5db' }} axisLine={false} tickLine={false} />
                <Tooltip content={<LightTooltip />} cursor={false} />
                <Bar dataKey="p" fill="#a5b4fc" radius={[4,4,0,0]} stackId="a" name="Pass" />
                <Bar dataKey="f" fill="#fca5a5" radius={[4,4,0,0]} stackId="a" name="Fail" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            {[
              { label: 'Verified',  value: 31, color: '#a5b4fc' },
              { label: 'Pending',   value: 11, color: '#fcd34d' },
              { label: 'High Risk', value:  6, color: '#fca5a5' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, margin: '0 auto 4px' }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Analytics / Gauge card */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Analytics</div>
            <Dots />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {ANALYTICS_DATA.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ color: '#6b7280', flex: 1 }}>{d.name}</span>
                <span style={{ fontWeight: 700, color: '#374151' }}>{d.value}</span>
              </div>
            ))}
          </div>

          {/* Gauge */}
          <GaugeArc pct={64} />
          <p style={{ textAlign: 'center', fontSize: 10, color: '#9ca3af', marginTop: 4 }}>Compliance rate</p>
        </Card>
      </div>

      {/* ══ ROW 2 — Recent Tenders + Expenses/Income style + Quick Bids ══ */}
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
      >

        {/* Recent Tenders — "Last Transactions" style */}
        <Card style={{ gridColumn: '1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Recent Tenders</div>
            <Dots />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {RECENT_TENDERS.map((t, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0',
                  borderBottom: i < RECENT_TENDERS.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: '#f1f5f9', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>
                  {t.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.dept}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>{t.amount}</div>
                <Dots />
              </div>
            ))}
          </div>

          <button
            onClick={() => go('tenders')}
            style={{
              width: '100%', marginTop: 12, padding: '10px 0', borderRadius: 12,
              background: '#f7f8fa', border: '1px solid #e5e7eb',
              fontSize: 12, fontWeight: 600, color: '#6b7280', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
            onMouseLeave={e => e.currentTarget.style.background = '#f7f8fa'}
          >
            View All Tenders <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </Card>

        {/* Expenses & Income style → Bidder Risk Distribution + CTA */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Compliance & Risk</div>
            <Dots />
          </div>

          <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#a5b4fc' }}>64%</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Compliant</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#fca5a5' }}>13%</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>High Risk</div>
            </div>
          </div>

          {/* Progress bars */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: '64%', background: '#a5b4fc', borderRadius: 999 }} />
            </div>
            <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '13%', background: '#fca5a5', borderRadius: 999 }} />
            </div>
          </div>

          {/* "More features" dark CTA */}
          <div style={{
            marginTop: 20, borderRadius: 16,
            background: '#111827', padding: '16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <ShieldCheck style={{ width: 18, height: 18, color: '#a5b4fc' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Full Verification?</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                Run AI compliance pipeline on all bidders
              </div>
            </div>
            <button
              onClick={() => go('tenders')}
              style={{
                background: '#fff', color: '#111827',
                border: 'none', borderRadius: 999,
                padding: '8px 14px', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f2f5'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Start Now
            </button>
          </div>
        </Card>

        {/* Activity Feed */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Live Activity</div>
            <button
              onClick={() => go('audit-trail')}
              style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              View All <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ACTIVITY_FEED.map((act, i) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 8px', borderRadius: 10,
                borderBottom: i < ACTIVITY_FEED.length - 1 ? '1px solid #f1f5f9' : 'none',
                cursor: 'default', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f7f8fa'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: act.bg, border: `1.5px solid ${act.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: act.color, flexShrink: 0,
                }}>
                  {act.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.title}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.bidder}</div>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                  background: act.bg, border: `1px solid ${act.border}`, color: act.color,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {act.result}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ══ ROW 3 — Quick Bid Review (Demo Scenarios) ══ */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Quick Bid Review — Demo Scenarios</div>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>Click any bidder to open full compliance review</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {DEMO_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              id={`demo-${sc.id}`}
              onClick={() => go('bidder-detail', { bidderId: sc.id, bidderName: sc.label })}
              style={{
                background: '#f7f8fa', border: '1.5px solid #e5e7eb',
                borderRadius: 16, padding: '16px 14px',
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = sc.dot; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f7f8fa'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.dot, marginTop: 3 }} />
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                  background: sc.color + '18', color: sc.color,
                }}>{sc.risk}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{sc.score}</div>
              <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.4, fontWeight: 500 }}>{sc.label}</div>
              {/* Score bar */}
              <div style={{ marginTop: 10, height: 4, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${sc.score}%`, background: sc.dot, borderRadius: 999 }} />
              </div>
            </button>
          ))}
        </div>
      </Card>

    </div>
  );
}
