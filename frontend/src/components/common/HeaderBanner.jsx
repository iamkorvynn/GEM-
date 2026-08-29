import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function HeaderBanner() {
  return (
    <div
      className="relative px-5 py-2 flex flex-col md:flex-row items-center justify-between gap-2 text-xs overflow-hidden"
      style={{
        background: '#fffbeb',
        borderBottom: '1px solid #fde68a',
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-widest uppercase"
          style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}
        >
          <AlertTriangle className="w-2.5 h-2.5" /> Prototype / Demo
        </span>
        <span className="font-semibold text-amber-900 text-xs">
          GeM Integrated Bid Compliance Verification Platform
        </span>
        <span className="hidden lg:inline text-amber-600 text-[11px]">
          — AI + Deterministic Rule Engine for Government Procurement
        </span>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-medium">
        <span className="flex items-center gap-1 text-green-700">
          <ShieldCheck className="w-3 h-3" /> Simulated Govt Adapters Active
        </span>
        <span className="text-amber-400">|</span>
        <span className="text-amber-700">Not connected to live production databases</span>
      </div>
    </div>
  );
}
