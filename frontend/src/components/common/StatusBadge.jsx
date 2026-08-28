import React from 'react';

const BADGE_STYLE = {
  // Success states
  VERIFIED:    { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)', color: '#6ee7b7' },
  QUALIFIED:   { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)', color: '#6ee7b7' },
  ACTIVE:      { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)', color: '#6ee7b7' },
  PASS:        { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)', color: '#6ee7b7' },
  // Warning
  'REVIEW REQUIRED': { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)', color: '#fcd34d' },
  REVIEW_REQUIRED:   { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)', color: '#fcd34d' },
  MEDIUM:      { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)', color: '#fcd34d' },
  PENDING:     { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)', color: '#94a3b8' },
  // Danger
  'HIGH RISK': { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.28)', color: '#fca5a5' },
  HIGH:        { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.28)', color: '#fca5a5' },
  CRITICAL:    { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', color: '#fca5a5' },
  FAILED:      { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.28)', color: '#fca5a5' },
  FAIL:        { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.28)', color: '#fca5a5' },
  // Info
  LOW:         { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)', color: '#6ee7b7' },
  FLAGGED:     { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)', color: '#fcd34d' },
};

export default function StatusBadge({ status }) {
  const s = BADGE_STYLE[status?.toUpperCase()] || BADGE_STYLE[status] || { bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.20)', color: '#94a3b8' };
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide uppercase shrink-0"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, backdropFilter: 'blur(8px)' }}
    >
      {status}
    </span>
  );
}
