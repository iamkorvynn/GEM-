import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles } from 'lucide-react';

export default function Topbar({ activeBidderId, setActiveBidderId, setCurrentTab, onGlobalSearch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [systemStatus, setSystemStatus] = useState('ONLINE');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/', { signal: AbortSignal.timeout(3000) });
        setSystemStatus(res.ok ? 'ONLINE' : 'FALLBACK');
      } catch { setSystemStatus('FALLBACK'); }
    };
    checkStatus();
    const id = setInterval(checkStatus, 30000);
    return () => clearInterval(id);
  }, []);

  const demoBidders = [
    { id: 'BIDDER-A', name: 'Bidder A', risk: 'LOW',    dot: '#10b981' },
    { id: 'BIDDER-B', name: 'Bidder B', risk: 'MED',    dot: '#f59e0b' },
    { id: 'BIDDER-C', name: 'Bidder C', risk: 'HIGH',   dot: '#ef4444' },
    { id: 'BIDDER-D', name: 'Bidder D', risk: 'HIGH',   dot: '#ef4444' },
    { id: 'BIDDER-E', name: 'Bidder E', risk: 'HIGH',   dot: '#ef4444' },
  ];

  return (
    <header className="glass-topbar px-5 py-2.5 flex items-center gap-4 sticky top-0 z-30">

      {/* Search */}
      <form
        onSubmit={e => { e.preventDefault(); onGlobalSearch?.(searchQuery); }}
        className="relative w-60 shrink-0"
      >
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search GSTIN, PAN, Tender…"
          className="glass-input w-full pl-9 pr-3 py-2 text-xs"
          style={{ borderRadius: 10 }}
        />
      </form>

      {/* Demo quick-switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto shrink" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="text-[10px] font-bold text-slate-500 px-2 flex items-center gap-1 shrink-0 whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-amber-400" /> Demo:
        </span>
        {demoBidders.map(b => {
          const active = activeBidderId === b.id;
          return (
            <button
              key={b.id}
              id={`switch-${b.id}`}
              onClick={() => { setActiveBidderId(b.id); setCurrentTab('bidder-profile'); }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all"
              style={active
                ? { background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.40)', color: '#93c5fd' }
                : { background: 'transparent', border: '1px solid transparent', color: '#64748b' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: b.dot }} />
              {b.name}
              <span className="text-[9px] font-bold opacity-70">{b.risk}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Bell */}
      <button className="relative p-2 rounded-lg transition btn-glass-ghost">
        <Bell className="w-4 h-4 text-slate-400" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
      </button>

      <div className="w-px h-5 bg-white/10" />

      {/* System status indicator — PRD §5.1 */}
      <div
        id="system-status-indicator"
        title={systemStatus === 'ONLINE' ? 'All mock government adapters operational' : 'Adapters in fallback — Manual Verification Required'}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-help"
        style={{
          background: systemStatus === 'ONLINE' ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)',
          border: `1px solid ${systemStatus === 'ONLINE' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
        }}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${systemStatus === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
        <span className={systemStatus === 'ONLINE' ? 'text-emerald-300' : 'text-amber-300'}>
          {systemStatus === 'ONLINE' ? 'Adapters Online' : 'Manual Verify Required'}
        </span>
      </div>
    </header>
  );
}
