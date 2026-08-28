import React, { useState } from 'react';
import { ShieldCheck, ChevronRight, Landmark, Lock, BadgeCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * These represent officers whose identities would normally arrive automatically
 * from the GeM SSO session. In this prototype they are pre-seeded so the
 * evaluator can simulate different officer roles/permissions.
 */
const OFFICERS = [
  {
    id: 'OFF-001',
    name: 'Rajesh Kumar Sharma',
    role: 'Procurement Officer',
    department: 'Ministry of Defence — Equipment Division',
    employeeId: 'MOD/PO/2021/4471',
    location: 'New Delhi',
    accent: '#3b82f6',
    glow: 'rgba(59,130,246,0.22)',
    initials: 'RK',
  },
  {
    id: 'OFF-002',
    name: 'Priya Venkataraman',
    role: 'Senior Procurement Officer',
    department: 'Ministry of Finance — Public Procurement Cell',
    employeeId: 'MOF/SPO/2019/1183',
    location: 'Mumbai',
    accent: '#8b5cf6',
    glow: 'rgba(139,92,246,0.22)',
    initials: 'PV',
  },
  {
    id: 'OFF-003',
    name: 'Arun Mehta',
    role: 'Senior Manager',
    department: 'GeM Procurement Oversight — Regional North',
    employeeId: 'GEM/SM/2018/0094',
    location: 'Chandigarh',
    accent: '#10b981',
    glow: 'rgba(16,185,129,0.22)',
    initials: 'AM',
  },
];

export default function GemSSOLanding() {
  const { selectOfficer } = useAuth();
  const [selected, setSelected] = useState(OFFICERS[0].id);
  const [confirming, setConfirming] = useState(false);

  const activeOfficer = OFFICERS.find(o => o.id === selected);

  const handleEnter = () => {
    setConfirming(true);
    // Small deliberate delay — simulates the moment a real SSO token resolves
    setTimeout(() => {
      selectOfficer(activeOfficer);
    }, 700);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#030712' }}
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative z-10 w-full max-w-lg">

        {/* ── Brand ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-60" style={{ background: 'rgba(245,158,11,0.5)' }} />
              <div
                className="relative px-5 py-3 rounded-2xl text-3xl font-black text-slate-950"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 32px rgba(245,158,11,0.35)' }}
              >
                GeM
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Integrated Bid Compliance Platform
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Government e-Marketplace · Officer Verification Console
          </p>
        </div>

        {/* ── SSO context card ── */}
        <div
          className="mb-5 rounded-xl px-4 py-3 flex gap-3 items-start"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.22)' }}
        >
          <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-300 leading-relaxed">
            <span className="font-bold text-blue-200">GeM SSO Session Detected.</span>{' '}
            In production, your officer identity is passed automatically from the GeM portal — no
            separate login is required. This selector simulates that handshake for the hackathon prototype.
            <span className="block mt-1 text-blue-400/70 text-[11px]">
              Bidders are not users of this tool and have no access here.
            </span>
          </div>
        </div>

        {/* ── Officer Card ── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'rgba(8,14,30,0.85)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Top shimmer */}
          <div className="absolute top-0 left-8 right-8 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)' }} />

          {/* Section label */}
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Landmark className="w-3 h-3" /> Select Officer Identity (GeM SSO Simulation)
          </div>

          {/* Officer selector cards */}
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
                    background: isActive ? `${o.accent}10` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isActive ? `${o.accent}35` : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isActive ? `0 0 24px ${o.glow}` : 'none',
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${o.accent}80, ${o.accent}50)`,
                      border: `1px solid ${o.accent}40`,
                      boxShadow: isActive ? `0 4px 16px ${o.glow}` : 'none',
                    }}
                  >
                    {o.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{o.name}</span>
                      {isActive && (
                        <BadgeCheck className="w-3.5 h-3.5 shrink-0" style={{ color: o.accent }} />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold mt-0.5" style={{ color: o.accent }}>
                      {o.role}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5 truncate">
                      {o.department}
                    </div>
                    <div className="text-[10px] text-slate-700 font-mono mt-0.5">
                      {o.employeeId} · {o.location}
                    </div>
                  </div>

                  {/* Radio dot */}
                  <div
                    className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                    style={{
                      border: `2px solid ${isActive ? o.accent : 'rgba(255,255,255,0.15)'}`,
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
            className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: confirming
                ? 'rgba(59,130,246,0.20)'
                : `linear-gradient(135deg, ${activeOfficer.accent}, ${activeOfficer.accent}cc)`,
              boxShadow: confirming ? 'none' : `0 4px 24px ${activeOfficer.glow}`,
              color: '#fff',
              border: `1px solid ${activeOfficer.accent}40`,
            }}
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

        {/* ── Bottom disclaimer ── */}
        <div className="mt-5 flex items-start gap-2 px-1">
          <AlertTriangle className="w-3 h-3 text-amber-500/60 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-700 leading-relaxed">
            <span className="text-slate-600 font-semibold">Hackathon Prototype.</span> This officer-selection
            screen exists only because live GeM SSO is unavailable during the demo. In deployment,
            this screen does not exist — the tool opens directly inside the GeM officer session.
          </p>
        </div>
      </div>
    </div>
  );
}
