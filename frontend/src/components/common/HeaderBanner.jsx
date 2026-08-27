import React from 'react';
import { AlertTriangle, Info, ShieldCheck } from 'lucide-react';

export default function HeaderBanner() {
  return (
    <div className="bg-slate-900 border-b border-amber-500/40 text-slate-200 px-4 py-2 text-xs flex flex-col md:flex-row items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider uppercase">
          <AlertTriangle className="w-3 h-3 mr-1" /> Prototype / Demo Mode
        </span>
        <span className="font-semibold text-slate-100">
          GeM Integrated Bid Compliance Verification Platform
        </span>
        <span className="hidden lg:inline text-slate-400">
          — Automated AI & Deterministic Rule Engine for Government Procurement
        </span>
      </div>
      
      <div className="flex items-center space-x-3 mt-1 md:mt-0 text-[11px] text-amber-200/90 font-medium">
        <span className="flex items-center">
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Simulated Govt Verification Adapters Active
        </span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">Not connected to live production databases</span>
      </div>
    </div>
  );
}
