import React, { useEffect, useState } from 'react';
import {
  MoreVertical, ChevronRight, TrendingUp, Sparkles,
  ShieldCheck, CreditCard, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardStats } from '../services/api';

/* ── Circle avatar row data ────────────────────────────────────────── */
const TEAM_AVATARS = [
  { name: 'Rajesh Sharma',   initials: 'RS', bg: '#dbeafe', color: '#1d4ed8' },
  { name: 'Priya V.',        initials: 'PV', bg: '#f3e8ff', color: '#7e22ce' },
  { name: 'Arun Mehta',      initials: 'AM', bg: '#dcfce7', color: '#15803d' },
  { name: 'Kavita Rao',      initials: 'KR', bg: '#ffedd5', color: '#c2410c' },
  { name: 'Vikram Seth',     initials: 'VS', bg: '#fee2e2', color: '#b91c1c' },
  { name: 'Ananya Sen',      initials: 'AS', bg: '#e0e7ff', color: '#4338ca' },
  { name: 'Sanjay Dutt',     initials: 'SD', bg: '#fef3c7', color: '#b45309' },
];

/* ── Recent bids / transactions ────────────────────────────────────── */
const TRANSACTIONS = [
  {
    id: 'BID-001',
    company: 'Apple Systems India',
    sub: 'Industrial Tech · 03 April, 2026',
    amount: '$653',
    inr: '₹54,200',
    icon: '🍎',
  },
  {
    id: 'BID-002',
    company: 'Ralph Edwards Logistics',
    sub: 'Supply & Freight · 01 April, 2026',
    amount: '$2,643',
    inr: '₹2,19,400',
    icon: '📦',
  },
  {
    id: 'BID-003',
    company: 'Jerome Bell Hardware',
    sub: 'Safety Equipment · 27 March, 2026',
    amount: '$20',
    inr: '₹1,660',
    icon: '🔧',
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

/* ── Segmented Half-Circle Gauge 1:1 with Fenco UI ─────────────────── */
function AnalyticsGauge() {
  // Arc math:
  // Semi-circle from (20, 85) to (150, 85) with radius 65.
  // Arc length = pi * 65 = 204.2
  // Segments:
  //   Total filled: 90% (183.8 / 204.2)
  //   Blue (Done): 60% (122.5)
  //   Yellow (In progress): 20% (from 60% to 80% = 163.4)
  //   Red/Pink (To do): 10% (from 80% to 90% = 183.8)
  //   Remaining: 10% (unfilled track)
  const totalLen = 204.2;

  return (
    <div style={{ position: 'relative', width: 170, margin: '8px auto 0' }}>
      <svg width="170" height="96" viewBox="0 0 170 96" style={{ display: 'block' }}>
        {/* Background gray track */}
        <path
          d="M 20,85 A 65,65 0 0,1 150,85"
          fill="none"
          stroke="#edf0f5"
          strokeWidth="13"
          strokeLinecap="round"
        />
        {/* Pink/Red segment (To do — extends to 90%) */}
        <path
          d="M 20,85 A 65,65 0 0,1 150,85"
          fill="none"
          stroke="#e88b8b"
          strokeWidth="13"
          strokeDasharray={`${totalLen * 0.90} ${totalLen}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        {/* Yellow segment (In progress — extends to 80%) */}
        <path
          d="M 20,85 A 65,65 0 0,1 150,85"
          fill="none"
          stroke="#f5d678"
          strokeWidth="13"
          strokeDasharray={`${totalLen * 0.80} ${totalLen}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        {/* Blue segment (Done — extends to 60%) */}
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
          90%
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', marginTop: 2 }}>
          Done
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ go, showToast }) {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const officerName = user?.name || 'Alif Reza';
  const firstName = officerName.split(' ')[0] || 'Alif';

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
      {/* ── Top Header Row: Greeting + Circle Avatar Row ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left greeting */}
        <div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#1e2433',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            Hello, <span style={{ color: '#7494ec' }}>{officerName}</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
            View and control your finances & procurement compliance here!
          </p>
        </div>

        {/* Right circle avatar row */}
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-full"
          style={{
            background: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.04)',
            alignSelf: 'flex-start',
          }}
        >
          {TEAM_AVATARS.map((av, i) => (
            <div
              key={i}
              title={av.name}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: av.bg,
                color: av.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
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
            title="Next"
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

      {/* ── ROW 1: Balance Statistics + Blue Credit Card + Analytics ── */}
      <div
        className="grid gap-5"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        }}
      >
        {/* Card 1: Balance Statistics */}
        <FencoCard>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
            Balance Statistics
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
              $38,729.61
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
              Total amount
            </span>
          </div>

          {/* Bottom row: Wave sparkline on left, vertical pill bars on right */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            {/* Left: wave curve + 14% badge */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {/* SVG wave sparkline */}
                <svg width="68" height="24" viewBox="0 0 68 24" fill="none">
                  <path
                    d="M 2,18 C 16,18 20,4 34,4 C 48,4 52,18 66,18"
                    stroke="#7494ec"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>

                {/* 14% badge */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    border: '1.5px solid #374151',
                    borderRadius: 999,
                    padding: '2px 7px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#1e2433',
                  }}
                >
                  <TrendingUp style={{ width: 11, height: 11 }} /> 14%
                </span>
              </div>

              <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.3 }}>
                Always see<br />your earning updates
              </div>
            </div>

            {/* Right: vertical month bars */}
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

        {/* Card 2: THE BANK OF ANYTHING (Fenco Blue Card Mockup) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #7494ec 0%, #5d7fe8 100%)',
            borderRadius: 24,
            padding: '22px 24px',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(116, 148, 236, 0.28)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 190,
          }}
        >
          {/* Subtle background curved wave overlay */}
          <div
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              pointerEvents: 'none',
            }}
          />

          {/* Card header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.9,
              }}
            >
              THE BANK OF ANYTHING
            </span>
          </div>

          {/* Gold EMV Chip */}
          <div style={{ margin: '14px 0 10px' }}>
            <div
              style={{
                width: 36,
                height: 26,
                background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)',
                borderRadius: 6,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.4)',
              }}
            />
          </div>

          {/* Dots + 4 digits */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.15em',
            }}
          >
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span style={{ letterSpacing: '0.05em' }}>2734</span>
          </div>

          {/* Expiry + Name + Mastercard Circles */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginTop: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: '0.05em' }}>
                3/18 &nbsp; 3/28
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>
                {officerName}
              </div>
            </div>

            {/* Red & Yellow overlapping circles */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#ef4444',
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#f59e0b',
                  marginLeft: -10,
                  opacity: 0.9,
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Analytics (Done / In progress / To do + 90% Done Gauge) */}
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
              Analytics
            </div>
            <MenuDots />
          </div>

          {/* Legend dots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {[
              { label: 'Done', color: '#7494ec' },
              { label: 'In progres', color: '#f5d678' },
              { label: 'To do', color: '#e88b8b' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
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

          {/* Half-circle segmented Gauge (100% bug-free SVG) */}
          <AnalyticsGauge />
        </FencoCard>
      </div>

      {/* ── ROW 2: Last Transactions + Expenses & Income + More Features ── */}
      <div
        className="grid gap-5"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        }}
      >
        {/* Last Transactions Card */}
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
              Last Transactions
            </div>
            <MenuDots />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {TRANSACTIONS.map((tx, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  padding: '6px 0',
                }}
                onClick={() => go('tenders')}
              >
                {/* Circle Icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
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

                {/* Company & Date */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#1e2433',
                      truncate: true,
                    }}
                  >
                    {tx.company}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {tx.sub}
                  </div>
                </div>

                {/* Amount */}
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e2433' }}>
                  {tx.amount}
                </div>

                {/* Action */}
                <MenuDots />
              </div>
            ))}
          </div>
        </FencoCard>

        {/* Expenses & Income Card + Dark More Features Banner */}
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
                Expenses & Income
              </div>
              <MenuDots />
            </div>

            {/* 60% Expenses  ·  40% Income */}
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
                  60%
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                  Expenses
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#1e2433' }}>
                  40%
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                  Income
                </div>
              </div>
            </div>

            {/* Two horizontal rounded pill bars side-by-side (1:1 with Fenco) */}
            <div style={{ display: 'flex', gap: 10, height: 14, alignItems: 'center' }}>
              <div
                style={{
                  flex: '0 0 58%',
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

          {/* Dark "More features?" Card */}
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
                💎
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>
                  More features?
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.55)', marginTop: 2 }}>
                  Update your account to premium to get more features
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
              Go to premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
