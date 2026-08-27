import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { type = 'success', message, title } = toast;

  let bgClass = 'bg-slate-900 border-slate-700 text-slate-100';
  let Icon = Info;

  if (type === 'success') {
    bgClass = 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 glow-emerald';
    Icon = CheckCircle2;
  } else if (type === 'warning') {
    bgClass = 'bg-amber-950/90 border-amber-500/50 text-amber-100 glow-amber';
    Icon = AlertTriangle;
  } else if (type === 'error') {
    bgClass = 'bg-rose-950/90 border-rose-500/50 text-rose-100 glow-rose';
    Icon = XCircle;
  } else if (type === 'info') {
    bgClass = 'bg-blue-950/90 border-blue-500/50 text-blue-100 glow-blue';
    Icon = Info;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-short">
      <div className={`p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-start space-x-3 ${bgClass}`}>
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <div className="font-bold text-xs uppercase tracking-wider mb-0.5">{title}</div>}
          <div className="text-xs font-medium leading-relaxed">{message}</div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-0.5 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
