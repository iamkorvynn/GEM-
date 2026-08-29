import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, LogOut } from 'lucide-react';

function CircleBtn({ children, onClick, title, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '1.5px solid #e5e7eb',
        background: hov ? '#f7f8fa' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative', flexShrink: 0,
        transition: 'all 0.15s ease',
        boxShadow: hov ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {children}
      {badge && (
        <span style={{
          position: 'absolute', top: 7, right: 7,
          width: 7, height: 7, borderRadius: '50%',
          background: '#ef4444', border: '1.5px solid #fff',
        }} />
      )}
    </button>
  );
}

export default function Topbar({ nav, go, BreadcrumbSlot }) {
  const { user, logout } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        minHeight: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        gap: 16,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Left — breadcrumb */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
        {BreadcrumbSlot}
      </div>

      {/* Right — search + bell + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

        {/* Bell */}
        <CircleBtn title="Notifications" badge>
          <Bell style={{ width: 16, height: 16, color: '#6b7280' }} />
        </CircleBtn>

        {/* Search — single unified element */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {/* Search pill / input toggle */}
          {searchFocused ? (
            <input
              type="text"
              placeholder="Search tenders, bidders…"
              autoFocus
              onBlur={() => setSearchFocused(false)}
              style={{
                width: 220, height: 40,
                border: '1.5px solid #3b82f6', borderRadius: 999,
                padding: '0 16px', fontSize: 12,
                color: '#374151', outline: 'none',
                background: '#fff',
                fontFamily: 'inherit',
                boxShadow: '0 0 0 3px rgba(59,130,246,0.10)',
              }}
            />
          ) : (
            <button
              onClick={() => setSearchFocused(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0 14px 0 12px',
                height: 40, borderRadius: 999,
                border: '1.5px solid #e5e7eb',
                background: '#f7f8fa',
                fontSize: 12, color: '#9ca3af',
                cursor: 'text',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f7f8fa'; }}
            >
              <Search style={{ width: 14, height: 14 }} />
              Search me...
            </button>
          )}
        </div>

        {/* System status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 999,
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          fontSize: 10, fontWeight: 700, color: '#15803d',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite', display: 'inline-block' }} />
          AI Online
        </div>

        {/* Officer avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: '#111827',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: '#fff',
          cursor: 'default', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          border: '2px solid #fff',
        }}
          title={user?.name || 'Officer'}
        >
          {(user?.name || 'O').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
