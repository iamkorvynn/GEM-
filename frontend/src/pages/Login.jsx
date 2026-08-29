import React, { useState } from 'react';
import { ShieldCheck, ChevronRight, Landmark, Lock, BadgeCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const OFFICERS = [
  {
    id: 'OFF-001',
    name: 'Rajesh Kumar Sharma',
    role: 'Procurement Officer',
    department: 'Ministry of Defence — Equipment Division',
    employeeId: 'MOD/PO/2021/4471',
    location: 'New Delhi',
    accent: '#2563eb',
    initials: 'RK',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    id: 'OFF-002',
    name: 'Priya Venkataraman',
    role: 'Senior Procurement Officer',
    department: 'Ministry of Finance — Public Procurement Cell',
    employeeId: 'MOF/SPO/2019/1183',
    location: 'Mumbai',
    accent: '#7c3aed',
    initials: 'PV',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    id: 'OFF-003',
    name: 'Arun Mehta',
    role: 'Senior Manager',
    department: 'GeM Procurement Oversight — Regional North',
    employeeId: 'GEM/SM/2018/0094',
    location: 'Chandigarh',
    accent: '#16a34a',
    initials: 'AM',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
];

export default function GemSSOLanding() {
  const { selectOfficer } = useAuth();
  const [selected, setSelected] = useState(OFFICERS[0].id);
  const [confirming, setConfirming] = useState(false);

  const activeOfficer = OFFICERS.find(o => o.id === selected);

  const handleEnter = () => {
    setConfirming(true);
    setTimeout(() => { selectOfficer(activeOfficer); }, 700);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#f0f2f5' }}
    >
      <div className="w-full max-w-lg">

        {/* ── Brand ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div
              className="px-5 py-3 rounded-2xl text-2xl font-black text-white"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
              }}
            >
              BidSatark
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#111827' }}>
            Integrated Bid Compliance Platform
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Government e-Marketplace · Officer Verification Console
          </p>
        </div>

        {/* ── SSO notice ── */}
        <div
          className="mb-5 rounded-xl px-4 py-3 flex gap-3 items-start"
          style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}
        >
          <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 leading-relaxed">
            <span className="font-bold text-blue-900">BidSatark SSO Session Detected.</span>{' '}
            In production, your officer identity is passed automatically from the GeM portal — no
            separate login is required. This selector simulates that handshake for the hackathon prototype.
            <span className="block mt-1 text-blue-600 text-[11px]">
              Bidders are not users of this tool and have no access here.
            </span>
          </div>
        </div>

        {/* ── Officer Card ── */}
        <div
          className="card p-6"
          style={{ borderTop: '4px solid #3b82f6' }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#9ca3af' }}>
            <Landmark className="w-3 h-3" /> Select Officer Identity (GeM SSO Simulation)
          </div>

          {/* Officer selector */}
          <div className="space-y-2.5 mb-6">
            {OFFICERS.map(o => {
              const isActive = selected === o.id;
              return (
                <button
                  key={o.id}
                  id={`officer-${o.id}`}
                  type="button"
                  onClick={() => setSelected(o.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                  style={{
                    background: isActive ? o.bg : '#f7f8fa',
                    border: `1.5px solid ${isActive ? o.border : '#e5e7eb'}`,
                    boxShadow: isActive ? `0 0 0 2px ${o.border}` : 'none',
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{
                      background: o.accent,
                      boxShadow: isActive ? `0 4px 12px ${o.accent}40` : 'none',
                    }}
                  >
                    {o.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate" style={{ color: '#111827' }}>{o.name}</span>
                      {isActive && <BadgeCheck className="w-3.5 h-3.5 shrink-0" style={{ color: o.accent }} />}
                    </div>
                    <div className="text-[11px] font-semibold mt-0.5" style={{ color: o.accent }}>
                      {o.role}
                    </div>
                    <div className="text-[10px] mt-0.5 truncate" style={{ color: '#9ca3af' }}>
                      {o.department}
                    </div>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: '#c0c7d0' }}>
                      {o.employeeId} · {o.location}
                    </div>
                  </div>

                  {/* Radio */}
                  <div
                    className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                    style={{
                      border: `2px solid ${isActive ? o.accent : '#d1d5db'}`,
                      background: isActive ? o.accent : 'transparent',
                    }}
                  >
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Enter button */}
          <button
            id="sso-enter-btn"
            onClick={handleEnter}
            disabled={confirming}
            className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all btn-primary"
          >
            {confirming ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Resolving GeM SSO Session…
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Enter as {activeOfficer.name.split(' ')[0]}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-5 flex items-start gap-2 px-1">
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed" style={{ color: '#9ca3af' }}>
            <span className="font-semibold" style={{ color: '#6b7280' }}>Hackathon Prototype.</span> This officer-selection
            screen exists only because live GeM SSO is unavailable during the demo. In deployment,
            this screen does not exist — the tool opens directly inside the GeM officer session.
          </p>
        </div>
      </div>
    </div>
  );
}
