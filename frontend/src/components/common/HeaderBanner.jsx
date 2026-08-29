import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

export default function HeaderBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="relative flex items-center justify-between gap-3 px-5 py-1.5 text-xs"
      style={{
        background: '#fffbeb',
        borderBottom: '1px solid #fde68a',
        minHeight: 32,
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-widest uppercase shrink-0"
          style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}
        >
          <AlertTriangle className="w-2.5 h-2.5" /> Prototype
        </span>
        <span className="font-semibold text-amber-900 truncate text-[11px]">
          GeM Compliance Platform · AI-powered 3-track bid verification
        </span>
        <span className="hidden lg:flex items-center gap-1 shrink-0 text-green-700 text-[10px] font-medium">
          <ShieldCheck className="w-3 h-3" /> Simulated adapters active
        </span>
      </div>

      <button
        onClick={() => setDismissed(true)}
        title="Dismiss"
        className="shrink-0 p-1 rounded-md transition-all"
        style={{ color: '#d97706' }}
        onMouseEnter={e => e.currentTarget.style.background = '#fef3c7'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
