import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function HeaderBanner() {
  return (
    <div
      className="relative px-5 py-2 flex flex-col md:flex-row items-center justify-between gap-2 text-xs overflow-hidden"
      style={{
        background: 'rgba(245,158,11,0.06)',
        borderBottom: '1px solid rgba(245,158,11,0.20)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Ambient line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.35), transparent)' }} />

      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-widest uppercase" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)', color: '#fcd34d' }}>
          <AlertTriangle className="w-2.5 h-2.5" /> Prototype / Demo
        </span>
        <span className="font-semibold text-slate-200 text-xs">
          GeM Integrated Bid Compliance Verification Platform
        </span>
        <span className="hidden lg:inline text-slate-500 text-[11px]">
          — AI + Deterministic Rule Engine for Government Procurement
        </span>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-medium">
        <span className="flex items-center gap-1 text-emerald-400">
          <ShieldCheck className="w-3 h-3" /> Simulated Govt Adapters Active
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-500">Not connected to live production databases</span>
      </div>
    </div>
  );
}
