import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const CONFIGS = {
  success: { Icon: CheckCircle2, accent: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.28)', glow: '0 0 30px rgba(16,185,129,0.18)' },
  warning: { Icon: AlertTriangle, accent: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.28)', glow: '0 0 30px rgba(245,158,11,0.18)' },
  error:   { Icon: XCircle,      accent: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.28)',  glow: '0 0 30px rgba(239,68,68,0.18)' },
  info:    { Icon: Info,         accent: '#3b82f6', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.28)', glow: '0 0 30px rgba(59,130,246,0.18)' },
};

export default function Toast({ toast, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) { setVisible(false); requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true))); }
    else { setVisible(false); }
  }, [toast]);

  if (!toast) return null;
  const cfg = CONFIGS[toast.type] || CONFIGS.info;
  const { Icon, accent, bg, border, glow } = cfg;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full transition-all duration-300"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)' }}
    >
      <div
        className="relative p-4 rounded-2xl flex items-start gap-3 overflow-hidden"
        style={{
          background: `${bg}`,
          border: `1px solid ${border}`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: `${glow}, 0 16px 48px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Top shimmer */}
        <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}50, transparent)` }} />

        <div className="shrink-0 mt-0.5" style={{ color: accent }}>
          <Icon className="w-4.5 h-4.5" />
        </div>

        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>
              {toast.title}
            </div>
          )}
          <div className="text-xs text-slate-300 leading-relaxed">{toast.message}</div>
        </div>

        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg transition btn-glass-ghost"
          style={{ color: '#64748b' }}
          onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
