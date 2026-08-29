import React from 'react';

const BADGE_STYLE = {
  // Success
  VERIFIED:    { bg: '#dcfce7', border: '#bbf7d0', color: '#15803d' },
  QUALIFIED:   { bg: '#dcfce7', border: '#bbf7d0', color: '#15803d' },
  ACTIVE:      { bg: '#dcfce7', border: '#bbf7d0', color: '#15803d' },
  PASS:        { bg: '#dcfce7', border: '#bbf7d0', color: '#15803d' },
  LOW:         { bg: '#dcfce7', border: '#bbf7d0', color: '#15803d' },
  // Warning
  'REVIEW REQUIRED': { bg: '#fef3c7', border: '#fde68a', color: '#92400e' },
  REVIEW_REQUIRED:   { bg: '#fef3c7', border: '#fde68a', color: '#92400e' },
  MEDIUM:      { bg: '#fef3c7', border: '#fde68a', color: '#92400e' },
  PENDING:     { bg: '#f1f5f9', border: '#e2e8f0', color: '#475569' },
  FLAGGED:     { bg: '#fef3c7', border: '#fde68a', color: '#92400e' },
  // Danger
  'HIGH RISK': { bg: '#fee2e2', border: '#fecaca', color: '#991b1b' },
  HIGH:        { bg: '#fee2e2', border: '#fecaca', color: '#991b1b' },
  CRITICAL:    { bg: '#fff1f2', border: '#fda4af', color: '#9f1239' },
  FAILED:      { bg: '#fee2e2', border: '#fecaca', color: '#991b1b' },
  FAIL:        { bg: '#fee2e2', border: '#fecaca', color: '#991b1b' },
};

export default function StatusBadge({ status }) {
  const s = BADGE_STYLE[status?.toUpperCase()] || BADGE_STYLE[status] || { bg: '#f1f5f9', border: '#e2e8f0', color: '#475569' };
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide uppercase shrink-0"
      style={{ background: s.bg, border: `1.5px solid ${s.border}`, color: s.color }}
    >
      {status}
    </span>
  );
}
