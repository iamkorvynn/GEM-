import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_COLOR = {
  'Procurement Officer':       { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.30)',  text: '#93c5fd' },
  'Senior Procurement Officer':{ bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.30)',  text: '#93c5fd' },
  'Senior Manager':            { bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.30)',  text: '#c4b5fd' },
  'System Admin':              { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.30)',  text: '#fcd34d' },
};

export default function Topbar({ activeBidderId, setActiveBidderId, setCurrentTab, onGlobalSearch }) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [systemStatus, setSystemStatus] = useState('ONLINE');

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/', { signal: AbortSignal.timeout(3000) });
        setSystemStatus(res.ok ? 'ONLINE' : 'FALLBACK');
      } catch { setSystemStatus('FALLBACK'); }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const demoBidders = [
    { id: 'BIDDER-A', name: 'Bidder A', risk: 'LOW',  dot: '#10b981' },
    { id: 'BIDDER-B', name: 'Bidder B', risk: 'MED',  dot: '#f59e0b' },
    { id: 'BIDDER-C', name: 'Bidder C', risk: 'HIGH', dot: '#ef4444' },
    { id: 'BIDDER-D', name: 'Bidder D', risk: 'HIGH', dot: '#ef4444' },
    { id: 'BIDDER-E', name: 'Bidder E', risk: 'HIGH', dot: '#ef4444' },
  ];

  const roleStyle = ROLE_COLOR[user?.role] || ROLE_COLOR['Procurement Officer'];
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <header className="glass-topbar px-5 py-2.5 flex items-center gap-3 sticky top-0 z-30">

      {/* Search */}
      <form
        onSubmit={e => { e.preventDefault(); onGlobalSearch?.(searchQuery); }}
        className="relative w-56 shrink-0"
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

      {/* Demo Switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="text-[10px] font-bold text-slate-500 px-2 flex items-center gap-1 shrink-0">
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
                ? { background: 'rgba(59,130,246,0.22)', border: '1px solid rgba(59,130,246,0.38)', color: '#93c5fd' }
                : { background: 'transparent', border: '1px solid transparent', color: '#475569' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.dot }} />
              {b.name}
              <span className="text-[9px] font-bold opacity-70">{b.risk}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* System status */}
      <div
        id="system-status-indicator"
        title={systemStatus === 'ONLINE' ? 'All mock adapters operational' : 'Fallback mode active'}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-help shrink-0"
        style={{
          background: systemStatus === 'ONLINE' ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)',
          border: `1px solid ${systemStatus === 'ONLINE' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
        }}
      >
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${systemStatus === 'ONLINE' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <span className={systemStatus === 'ONLINE' ? 'text-emerald-300' : 'text-amber-300'}>
          {systemStatus === 'ONLINE' ? 'Adapters Online' : 'Manual Verify Required'}
        </span>
      </div>

      <div className="w-px h-5 bg-white/10 shrink-0" />

      {/* Bell */}
      <button className="relative p-2 rounded-lg btn-glass-ghost shrink-0">
        <Bell className="w-4 h-4 text-slate-500" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
      </button>

      {/* User pill */}
      {user && (
        <div className="flex items-center gap-2.5 pl-1 shrink-0">
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(99,102,241,0.8))', border: '1px solid rgba(99,102,241,0.4)' }}
          >
            {initials}
          </div>

          {/* Name + Role */}
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</div>
            <div className="text-[10px] leading-tight">
              <span
                className="px-1.5 py-0.5 rounded-md font-bold text-[9px]"
                style={{ background: roleStyle.bg, border: `1px solid ${roleStyle.border}`, color: roleStyle.text }}
              >
                {user.role}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            id="logout-btn"
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg btn-glass-ghost transition flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
}
