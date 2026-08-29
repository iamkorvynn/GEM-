import React from 'react';
import { ChevronRight, LayoutDashboard, FileText, User } from 'lucide-react';

const ICONS = {
  dashboard:    <LayoutDashboard className="w-3.5 h-3.5" />,
  tenders:      <FileText className="w-3.5 h-3.5" />,
  'tender-detail': <FileText className="w-3.5 h-3.5" />,
  'bidder-detail': <User className="w-3.5 h-3.5" />,
};

/**
 * nav  — current nav object: { page, tenderId, tenderTitle, bidderId, bidderName }
 * go   — navigate(page, params) function
 */
export default function Breadcrumb({ nav, go }) {
  const segments = [];

  if (nav.page === 'dashboard') return null;

  // Always start with Tenders
  segments.push({
    label: 'Tenders',
    icon: <FileText className="w-3 h-3" />,
    onClick: () => go('tenders'),
  });

  if (nav.page === 'tender-detail' || nav.page === 'bidder-detail' || nav.page === 'award-decision') {
    segments.push({
      label: nav.tenderTitle || nav.tenderId || 'Tender',
      icon: null,
      onClick: (nav.page === 'bidder-detail' || nav.page === 'award-decision')
        ? () => go('tender-detail', { tenderId: nav.tenderId, tenderTitle: nav.tenderTitle })
        : null,
    });
  }

  if (nav.page === 'bidder-detail') {
    segments.push({
      label: nav.bidderName || nav.bidderId || 'Bidder',
      icon: <User className="w-3 h-3" />,
      onClick: null, // current page
    });
  }

  if (nav.page === 'award-decision') {
    segments.push({
      label: 'Award Decision',
      icon: null,
      onClick: null,
    });
  }

  if (nav.page === 'audit-trail') {
    return (
      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#9ca3af' }}>
        <span style={{ color: '#6b7280' }}>Audit Trail</span>
      </div>
    );
  }

  if (nav.page === 'risk-analytics') {
    return (
      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#9ca3af' }}>
        <span style={{ color: '#6b7280' }}>Risk Analytics</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1 text-xs" aria-label="Breadcrumb">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3 h-3" style={{ color: '#d1d5db' }} />}
            {seg.onClick && !isLast ? (
              <button
                onClick={seg.onClick}
                className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all font-medium"
                style={{ color: '#2563eb' }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {seg.icon}
                <span className="max-w-[160px] truncate">{seg.label}</span>
              </button>
            ) : (
              <span
                className="flex items-center gap-1 px-2 py-1 font-semibold max-w-[180px] truncate"
                style={{ color: isLast ? '#111827' : '#6b7280' }}
              >
                {seg.icon}
                {seg.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
