import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell } from 'lucide-react';

export default function Topbar({ nav, go, BreadcrumbSlot }) {
  const { user, logout } = useAuth();

  return (
    <header
      className="flex items-center justify-between px-5 py-3 shrink-0"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        minHeight: 52,
      }}
    >
      {/* Left — Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {BreadcrumbSlot}
      </div>

      {/* Right — Officer identity + actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* System status */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          AI Verifier Online
        </div>

        {/* Officer badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: '#f7f8fa', border: '1px solid #e5e7eb' }}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{ background: '#2563eb' }}
          >
            {(user?.name || 'O').charAt(0)}
          </div>
          <div className="hidden md:block">
            <div className="text-[11px] font-bold" style={{ color: '#111827' }}>
              {user?.name?.split(' ')[0] || 'Officer'}
            </div>
            <div className="text-[9px]" style={{ color: '#9ca3af' }}>
              {user?.role || 'Procurement Officer'}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out"
          className="p-2 rounded-xl transition-all"
          style={{ color: '#9ca3af', border: '1px solid #e5e7eb' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
