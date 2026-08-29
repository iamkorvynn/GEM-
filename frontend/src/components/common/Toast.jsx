import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const TOAST_STYLES = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', Icon: CheckCircle2, iconColor: '#22c55e' },
  warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', Icon: AlertTriangle, iconColor: '#f59e0b' },
  error:   { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', Icon: XCircle,      iconColor: '#ef4444' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', Icon: Info,         iconColor: '#3b82f6' },
};

export default function Toast({ toast, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [toast]);

  if (!toast) return null;

  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  const { Icon } = style;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] animate-fade-up"
      style={{ maxWidth: 380 }}
    >
      <div
        className="flex items-start gap-3 p-4 rounded-2xl"
        style={{
          background: style.bg,
          border: `1.5px solid ${style.border}`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        }}
      >
        <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: style.iconColor }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold" style={{ color: style.color }}>{toast.title}</div>
          {toast.message && (
            <div className="text-xs mt-0.5 leading-relaxed" style={{ color: style.color, opacity: 0.8 }}>{toast.message}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg transition-all"
          style={{ color: style.color, opacity: 0.6 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
