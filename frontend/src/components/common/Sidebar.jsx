import React from 'react';
import { LayoutDashboard, FileText, Users, ShieldAlert, FolderOpen, Landmark, Activity, FileSpreadsheet, Plus, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const menuGroups = [
  {
    title: 'Core Procurement',
    items: [
      { id: 'dashboard',      label: 'Main Dashboard',   icon: LayoutDashboard },
      { id: 'tenders',        label: 'Tenders',           icon: FileText },
    ]
  },
  {
    title: 'Bidder Verification',
    items: [
      { id: 'new-verification', label: 'New Verification',     icon: Plus },
      { id: 'bidder-profile',   label: 'Bidder Profile',       icon: ClipboardList },
      { id: 'bidders',          label: 'Bid Compliance List',  icon: Users },
    ]
  },
  {
    title: 'Verification Engine',
    items: [
      { id: 'documents',    label: 'GeM Import (Sim.)',   icon: FolderOpen,   badge: 'MVP' },
      { id: 'govt-sources', label: 'Gov. Sources',        icon: Landmark },
      { id: 'risk-overview',label: 'Risk Analytics',      icon: ShieldAlert },
    ]
  },
  {
    title: 'Governance',
    items: [
      { id: 'audit-trail',  label: 'Audit Trail',         icon: Activity },
      { id: 'reports',      label: 'Reports',             icon: FileSpreadsheet },
    ]
  }
];

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { user } = useAuth();
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
  return (
    <aside
      className="glass-sidebar w-60 flex flex-col shrink-0"
      style={{ minHeight: '100vh' }}
    >
      {/* Brand Header */}
      <div className="px-4 py-5 border-b border-white/[0.06] flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base text-slate-950 shrink-0"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}
        >
          G
        </div>
        <div>
          <div className="text-[13px] font-bold text-white leading-tight">GeM Compliance</div>
          <div className="text-[10px] font-medium mt-0.5" style={{ color: '#f59e0b' }}>AI Verification Engine</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {menuGroups.map((group, gi) => (
          <div key={gi}>
            <div className="px-3 mb-1.5 text-[9px] font-bold tracking-widest uppercase text-slate-600">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => setCurrentTab(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group"
                    style={active ? {
                      background: 'rgba(59,130,246,0.18)',
                      border: '1px solid rgba(59,130,246,0.30)',
                      color: '#93c5fd',
                      boxShadow: '0 0 20px rgba(59,130,246,0.10)'
                    } : {
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: '#64748b',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-md font-bold"
                        style={active
                          ? { background: 'rgba(59,130,246,0.25)', color: '#93c5fd' }
                          : { background: 'rgba(255,255,255,0.05)', color: '#475569', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — Live user info from AuthContext */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(99,102,241,0.8))' }}
          >
            {initials}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Guest'}</div>
            <div className="text-[10px] text-slate-500 truncate">{user?.role || ''}</div>
          </div>
          <div className="ml-auto shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}>SSO</div>
        </div>
      </div>
    </aside>
  );
}
