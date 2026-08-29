import React, { useEffect, useState } from 'react';
import {
  TrendingUp, ShieldCheck, ChevronRight, MoreVertical,
  CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight,
  FileText, Users, Clock, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardStats } from '../services/api';

/* ── Officer reviewers list ────────────────────────────────────────── */
const REVIEWER_TEAM = [
  { name: 'Rajesh Sharma',   initials: 'RS', bg: '#dbeafe', color: '#1d4ed8' },
  { name: 'Priya V.',        initials: 'PV', bg: '#f3e8ff', color: '#7e22ce' },
  { name: 'Arun Mehta',      initials: 'AM', bg: '#dcfce7', color: '#15803d' },
  { name: 'Kavita Rao',      initials: 'KR', bg: '#ffedd5', color: '#c2410c' },
  { name: 'Vikram Seth',     initials: 'VS', bg: '#fee2e2', color: '#b91c1c' },
];

/* ── Recent Bid Submissions (Real GeM data) ────────────────────────── */
const RECENT_SUBMISSIONS = [
  {
    id: 'BIDDER-A',
    name: 'ABC Industrial Solutions Pvt. Ltd.',
    tender: 'GEM/2026/B/784921 · Industrial Safety Gear',
    value: '₹2.50 Cr',
    status: 'QUALIFIED',
    risk: 'LOW',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: '🏗️',
  },
  {
    id: 'BIDDER-B',
    name: 'Nova Safety Systems & Controls',
    tender: 'GEM/2026/B/784921 · Fire Alarm System',
    value: '₹1.15 Cr',
    status: 'REVIEW',
    risk: 'MEDIUM',
    color: '#92400e',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: '🚨',
  },
  {
    id: 'BIDDER-C',
    name: 'Alpha Tech Enterprises Ltd.',
    tender: 'GEM/2026/B/891042 · IT Infrastructure',
    value: '₹4.80 Cr',
    status: 'HIGH RISK',
    risk: 'HIGH',
    color: '#991b1b',
    bg: '#fef2f2',
    border: '#fecaca',
    icon: '🖥️',
  },
];

/* ── Card container matching Fenco UI ──────────────────────────────── */
function FencoCard({ children, style = {}, className = '' }) {
  return (
    <div
      className={className}
      style={{
        background: '#ffffff',
        borderRadius: 24,
        padding: '24px',
        boxShadow: '0 2px 14px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Three vertical dots menu icon ─────────────────────────────────── */
function MenuDots() {
  return (
    <button
      type="button"
      style={{
        background: 'transparent',
        border: 'none',
        color: '#c4c8d0',
        cursor: 'pointer',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#6b7280'}
      onMouseLeave={e => e.currentTarget.style.color = '#c4c8d0'}
      title="Options"
    >
      <MoreVertical style={{ width: 16, height: 16 }} />
    </button>
  );
}

/* ── Segmented Half-Circle Gauge ───────────────────────────────────── */
function ComplianceGauge({ pct = 88 }) {
  const totalLen = 204.2;

  return (
    <div style={{ position: 'relative', width: 170, margin: '8px auto 0' }}>
      <svg width="170" height="96" viewBox="0 0 170 96" style={{ display: 'block' }}>
        {/* Background track */}
        <path
          d="M 20,85 A 65,65 0 0,1 150,85"
          fill="none"
          stroke="#edf0f5"
          strokeWidth="13"
          strokeLinecap="round"
        />
        {/* Track C: Red/Coral segment (High Risk / Flagged — up to 88%) */}
        <path
          d="M 20,85 A 65,65 0 0,1 150,85"
          fill="none"
          stroke="#e88b8b"
          strokeWidth="13"
          strokeDasharray={`${totalLen * 0.88} ${totalLen}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        {/* Track B: Yellow segment (Under Review / Fuzzy — up to 76%) */}
        <path
          d="M 20,85 A 65,65 0 0,1 150,85"
          fill="none"
          stroke="#f5d678"
          strokeWidth="13"
          strokeDasharray={`${totalLen * 0.76} ${totalLen}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        {/* Track A: Blue segment (Fully Verified / Exact — up to 60%) */}
        <path
          d="M 20,85 A 65,65 0 0,1 150,85"
          fill="none"
          stroke="#7494ec"
          strokeWidth="13"
          strokeDasharray={`${totalLen * 0.60} ${totalLen}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
      </svg>
      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          bottom: 2,
          left: 0,
          right: 0,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e2433', lineHeight: 1.1 }}>
          {pct}%
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginTop: 2 }}>
          Evaluated
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ go, showToast }) {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const officerName = user?.name || 'Officer Rajesh Sharma';
  const firstName = officerName.split(' ')[0] || 'Officer';

  useEffect(() => {
    fetchDashboardStats()
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-32 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div
      className="p-6 md:p-8 space-y-6"
      style={{ background: '#f0f2f5', minHeight: '100%', color: '#1e2433' }}
    >
      {/* ── Top Header Row: Officer Greeting + Procurement Team ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1
            style={{
              fontSize: '30px',
              fontWeight: 800,
              color: '#1e2433',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            Welcome, <span style={{ color: '#7494ec' }}>{officerName}</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
            BidSatark Compliance Verification Platform · AI-driven 3-track procurement intelligence
          </p>
        </div>

        {/* Right review team avatars */}
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-full"
          style={{
            background: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.04)',
            alignSelf: 'flex-start',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginRight: 6 }}>
            Evaluation Panel:
          </span>
          {REVIEWER_TEAM.map((av, i) => (
            <div
              key={i}
              title={av.name}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: av.bg,
                color: av.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                border: '2px solid #ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                cursor: 'pointer',
              }}
            >
              {av.initials}
            </div>
          ))}
          <button
            type="button"
            onClick={() => go('audit-trail')}
            title="View Audit Trail"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#f0f2f5',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              cursor: 'pointer',
              marginLeft: 4,
            }}
          >
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* ── ROW 1: Bid Evaluation Statistics + Tender Health Overview + Compliance Analytics ── */}
      <div
        className="grid gap-5"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        }}
      >
        {/* Card 1: Evaluation Statistics */}
        <FencoCard>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
            Evaluation Statistics
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
            <span
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: '#1e2433',
                letterSpacing: '-0.02em',
              }}
            >
              48 Bidders
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
              Across 12 tenders
            </span>
          </div>

          {/* Bottom row: Wave curve on left, vertical month bars on right */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <svg width="68" height="24" viewBox="0 0 68 24" fill="none">
                  <path
                    d="M 2,18 C 16,18 20,4 34,4 C 48,4 52,18 66,18"
                    stroke="#7494ec"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    border: '1.5px solid #1e2433',
                    borderRadius: 999,
                    padding: '2px 7px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#1e2433',
                  }}
                >
                  <TrendingUp style={{ width: 11, height: 11 }} /> +14%
                </span>
              </div>

              <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.3 }}>
                Verified submissions<br />cleared this cycle
              </div>
            </div>

            {/* Vertical bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              {[
                { month: 'Nov', height: 14 },
                { month: 'Dec', height: 8 },
                { month: 'Jan', height: 32 },
                { month: 'Feb', height: 26 },
                { month: 'Mar', height: 42 },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 14,
                      height: item.height,
                      background: '#7494ec',
                      borderRadius: 999,
                      margin: '0 auto 6px',
                    }}
                  />
                  <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
                    {item.month}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FencoCard>

        {/* Card 2: Tender Pipeline Health (Replaces credit card with procurement stats) */}
        <FencoCard
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
              Tender Pipeline Status
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 999,
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
              }}
            >
              12 Active
            </span>
          </div>

          <div style={{ margin: '14px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 18,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                Verified Clean
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#15803d', marginTop: 2 }}>
                31
              </div>
              <div style={{ fontSize: 10, color: '#16a34a' }}>
                Track A cleared
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 18,
                background: '#fef2f2',
                border: '1px solid #fecaca',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                Discrepancies
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#991b1b', marginTop: 2 }}>
                6
              </div>
              <div style={{ fontSize: 10, color: '#dc2626' }}>
                Requires review
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => go('tenders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '11px 16px',
              borderRadius: 14,
              background: '#1e2433',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#2b3447'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e2433'}
          >
            <span>Inspect Tenders</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </FencoCard>

        {/* Card 3: Verification Analytics Gauge */}
        <FencoCard>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
              Verification Pipeline
            </div>
            <MenuDots />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {[
              { label: 'Track A (Exact Match)', color: '#7494ec' },
              { label: 'Track B (Fuzzy OCR)', color: '#f5d678' },
              { label: 'Track C (Cross-Adapter Flag)', color: '#e88b8b' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                  color: '#4b5563',
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: item.color,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Half-circle segmented Gauge */}
          <ComplianceGauge pct={88} />
        </FencoCard>
      </div>

      {/* ── ROW 2: Recent Submissions + Compliance & Risk Distribution ── */}
      <div
        className="grid gap-5"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        }}
      >
        {/* Recent Bidder Submissions */}
        <FencoCard>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                Recent Bidder Submissions
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                Pending and processed tender submissions
              </div>
            </div>
            <button
              type="button"
              onClick={() => go('tenders')}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#7494ec',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {RECENT_SUBMISSIONS.map((tx, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  padding: '8px 10px',
                  borderRadius: 14,
                  background: '#f9fafb',
                  border: '1px solid #f0f2f5',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => go('bidder-detail', { bidderId: tx.id, bidderName: tx.name })}
                onMouseEnter={e => e.currentTarget.style.background = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
              >
                {/* Icon avatar */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: '#1e2433',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {tx.icon}
                </div>

                {/* Company & Tender */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#1e2433',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {tx.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#9ca3af',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {tx.tender}
                  </div>
                </div>

                {/* Value & Badge */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#1e2433' }}>
                    {tx.value}
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 2,
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 999,
                      background: tx.bg,
                      color: tx.color,
                      border: `1px solid ${tx.border}`,
                    }}
                  >
                    {tx.risk}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </FencoCard>

        {/* Compliance & Risk Distribution + Direct Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FencoCard>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                Compliance & Risk Ratio
              </div>
              <MenuDots />
            </div>

            {/* 76% Compliant  ·  24% Flagged */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#1e2433' }}>
                  76%
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                  Compliant Bidders
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#1e2433' }}>
                  24%
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                  Under Review / Flagged
                </div>
              </div>
            </div>

            {/* Two horizontal rounded pill bars side-by-side */}
            <div style={{ display: 'flex', gap: 10, height: 14, alignItems: 'center' }}>
              <div
                style={{
                  flex: '0 0 76%',
                  height: 14,
                  background: '#7494ec',
                  borderRadius: 999,
                }}
              />
              <div
                style={{
                  flex: '1',
                  height: 14,
                  background: '#f5d678',
                  borderRadius: 999,
                }}
              />
            </div>
          </FencoCard>

          {/* AI Verification Action Card */}
          <div
            style={{
              background: '#1e2433',
              borderRadius: 24,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              boxShadow: '0 4px 18px rgba(30, 36, 51, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                🛡️
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>
                  Ready to Award or Inspect?
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.55)', marginTop: 2 }}>
                  Access active tenders to run verifications or finalize award decisions
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => go('tenders')}
              style={{
                background: '#ffffff',
                color: '#1e2433',
                fontWeight: 700,
                fontSize: 12,
                padding: '10px 18px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              View Tenders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
