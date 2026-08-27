import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, MinusCircle, FileSearch } from 'lucide-react';

export default function StatusBadge({ status, type = 'status' }) {
  const s = (status || '').toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
  let Icon = MinusCircle;

  if (s === 'VERIFIED' || s === 'QUALIFIED' || s === 'LOW' || s === 'ACTIVE') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
    Icon = CheckCircle2;
  } else if (s === 'REVIEW_REQUIRED' || s === 'MEDIUM' || s === 'PENDING') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-300 font-semibold';
    Icon = AlertTriangle;
  } else if (s === 'FAILED' || s === 'DISQUALIFIED' || s === 'HIGH' || s === 'CRITICAL' || s === 'EXPIRED') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
    Icon = XCircle;
  } else if (s === 'MISSING') {
    colorClasses = 'bg-purple-50 text-purple-700 border-purple-300 font-semibold';
    Icon = FileSearch;
  } else if (s === 'NOT_APPLICABLE' || s === 'N/A') {
    colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
    Icon = MinusCircle;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${colorClasses} tracking-tight shadow-2xs`}>
      <Icon className="w-3.5 h-3.5 mr-1 shrink-0" />
      <span>{s.replace('_', ' ')}</span>
    </span>
  );
}
