import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Loader2, ShieldCheck, Landmark, FileCode, Check } from 'lucide-react';

export default function VerificationProgressDrawer({ isOpen, bidderName, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: 'Ingesting & Validating Document Batch', source: 'OCR & Ingestion Engine' },
    { title: 'Extracting Entities (GSTIN, PAN, Expiry Dates)', source: 'Entity Parser' },
    { title: 'Querying Mock GST Portal Adapter', source: 'GST Verification Adapter' },
    { title: 'Querying Mock PAN Registry Adapter', source: 'PAN Verification Adapter' },
    { title: 'Querying Mock MSME Udyam Adapter', source: 'Udyam Adapter' },
    { title: 'Screening CPPP & GeM Debarment Watchlist', source: 'Debarment DB Adapter' },
    { title: 'Cross-Checking OEM Authorization Letter', source: 'OEM Registry Adapter' },
    { title: 'Executing Deterministic Rule Engine', source: 'Compliance Engine' },
    { title: 'Synthesizing Explainable AI Findings', source: 'AI Analysis Provider' },
    { title: 'Computing Compliance Score & Risk Level', source: 'Risk Scoring Engine' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    setCurrentStep(1);
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length) {
          clearInterval(interval);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 400);
          return steps.length;
        }
        return prev + 1;
      });
    }, 350);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const pct = Math.round((currentStep / steps.length) * 100);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-6 glow-blue">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-xl animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Full Verification Pipeline Active</h3>
              <p className="text-xs text-slate-400">Bidder: <span className="font-semibold text-slate-200">{bidderName}</span></p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-800">
            {pct}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Executing Automated Rules & Govt Adapters</span>
            <span className="font-mono">{currentStep} / {steps.length} Steps</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 h-1.5 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${pct}%` }}
            ></div>
          </div>
        </div>

        {/* Animated Step List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {steps.map((s, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < currentStep || currentStep === steps.length;
            const isCurrent = stepNum === currentStep && currentStep < steps.length;

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                  isDone
                    ? 'bg-slate-950/60 border-emerald-500/40 text-slate-200'
                    : isCurrent
                    ? 'bg-blue-950/60 border-blue-500 text-white font-semibold glow-blue'
                    : 'bg-slate-950/20 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    ) : (
                      <span className="text-slate-600">{stepNum}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{s.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.source}</div>
                  </div>
                </div>
                {isDone && <span className="text-[10px] text-emerald-400 font-mono font-bold">PASS</span>}
              </div>
            );
          })}
        </div>

        <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          Simulated Govt Verification Layer • GeM Procurement Intelligence Platform
        </div>
      </div>
    </div>
  );
}
