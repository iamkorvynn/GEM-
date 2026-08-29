import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

export default function VerificationProgressDrawer({ isOpen, bidderName, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: 'Ingesting & Validating Document Batch',          source: 'OCR & Ingestion Engine' },
    { title: 'Extracting Entities (GSTIN, PAN, Expiry Dates)', source: 'Entity Parser' },
    { title: 'Querying Mock GST Portal Adapter',               source: 'GST Verification Adapter' },
    { title: 'Querying Mock PAN Registry Adapter',             source: 'PAN Verification Adapter' },
    { title: 'Querying Mock MSME Udyam Adapter',               source: 'Udyam Adapter' },
    { title: 'Screening CPPP & GeM Debarment Watchlist',       source: 'Debarment DB Adapter' },
    { title: 'Cross-Checking OEM Authorization Letter',        source: 'OEM Registry Adapter' },
    { title: 'Executing Deterministic Rule Engine',            source: 'Compliance Engine' },
    { title: 'Synthesizing Explainable AI Findings',           source: 'AI Analysis Provider' },
    { title: 'Computing Compliance Score & Risk Level',        source: 'Risk Scoring Engine' },
  ];

  useEffect(() => {
    if (!isOpen) { setCurrentStep(0); return; }
    setCurrentStep(1);
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length) {
          clearInterval(interval);
          setTimeout(() => { if (onComplete) onComplete(); }, 400);
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
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-xl p-6 space-y-5"
        style={{
          background: '#ffffff',
          border: '1.5px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
              <Sparkles className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: '#111827' }}>Full Verification Pipeline Active</h3>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                Bidder: <span className="font-semibold" style={{ color: '#374151' }}>{bidderName}</span>
              </p>
            </div>
          </div>
          <span
            className="text-xs font-mono font-bold px-2.5 py-1 rounded-md"
            style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d' }}
          >
            {pct}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs" style={{ color: '#9ca3af' }}>
            <span>Executing Automated Rules & Govt Adapters</span>
            <span className="font-mono">{currentStep} / {steps.length} Steps</span>
          </div>
          <div className="w-full h-2 rounded-full progress-track overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #3b82f6, #6366f1, #22c55e)',
              }}
            />
          </div>
        </div>

        {/* Step List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {steps.map((s, idx) => {
            const stepNum = idx + 1;
            const isDone    = stepNum < currentStep || currentStep === steps.length;
            const isCurrent = stepNum === currentStep && currentStep < steps.length;

            return (
              <div
                key={idx}
                className="p-2.5 rounded-xl text-xs flex items-center justify-between transition-all"
                style={{
                  background: isDone ? '#f0fdf4' : isCurrent ? '#eff6ff' : '#f7f8fa',
                  border: `1px solid ${isDone ? '#bbf7d0' : isCurrent ? '#bfdbfe' : '#e5e7eb'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    ) : (
                      <span style={{ color: '#d1d5db' }}>{stepNum}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: isDone ? '#15803d' : isCurrent ? '#1d4ed8' : '#9ca3af' }}>{s.title}</div>
                    <div className="text-[10px] font-mono" style={{ color: '#9ca3af' }}>{s.source}</div>
                  </div>
                </div>
                {isDone && <span className="text-[10px] font-mono font-bold" style={{ color: '#15803d' }}>PASS</span>}
              </div>
            );
          })}
        </div>

        <div className="text-center text-[11px] pt-2" style={{ borderTop: '1px solid #e5e7eb', color: '#9ca3af' }}>
          Simulated Govt Verification Layer · GeM Procurement Intelligence Platform
        </div>
      </div>
    </div>
  );
}
