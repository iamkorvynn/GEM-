import React, { useState } from 'react';
import {
  LayoutDashboard, FileText, Shield, ScrollText, HelpCircle, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard',      Icon: LayoutDashboard, title: 'Dashboard' },
  { id: 'tenders',        Icon: FileText,         title: 'Tenders' },
  { id: 'risk-analytics', Icon: Shield,           title: 'Risk Analytics' },
  { id: 'audit-trail',    Icon: ScrollText,       title: 'Audit Trail' },
];

function NavBtn({ id, Icon, title, active, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);

  const bg = active
    ? '#ffffff'
    : hovered && danger
    ? 'rgba(239,68,68,0.15)'
    : hovered
    ? 'rgba(255,255,255,0.10)'
    : 'transparent';

  const color = active
    ? '#111827'
    : hovered && danger
    ? '#f87171'
    : hovered
    ? 'rgba(255,255,255,0.9)'
    : 'rgba(255,255,255,0.45)';

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        id={id ? `sidebar-${id}` : undefined}
        onClick={onClick}
        title={title}
        style={{
          width: 40, height: 40, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: bg,
          boxShadow: active ? '0 2px 8px rgba(0,0,0,0.20)' : 'none',
          color,
          border: 'none', cursor: 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
      >
        <Icon style={{ width: 17, height: 17, strokeWidth: active ? 2.2 : 1.8 }} />

        {/* Active indicator dot */}
        {active && (
          <span style={{
            position: 'absolute', width: 4, height: 4, borderRadius: '50%',
            background: '#3b82f6', bottom: 5, right: 5,
          }} />
        )}
      </button>

      {/* Tooltip */}
      {hovered && (
        <span style={{
          position: 'absolute',
          left: 'calc(100% + 14px)',
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#111827',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          padding: '5px 10px',
          borderRadius: 8,
          whiteSpace: 'nowrap',
          zIndex: 999,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          letterSpacing: '0.01em',
        }}>
          {title}
          {/* arrow */}
          <span style={{
            position: 'absolute',
            right: '100%', top: '50%', transform: 'translateY(-50%)',
            border: '5px solid transparent',
            borderRightColor: '#111827',
          }} />
        </span>
      )}
    </div>
  );
}

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { logout } = useAuth();

  return (
    <aside
      style={{
        width: 68,
        background: '#f0f2f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12,
        flexShrink: 0,
        zIndex: 10,
        overflow: 'visible',
      }}
    >
      {/* ── Brand logo ── */}
      <div
        title="BidSatark Compliance Platform"
        style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(245,158,11,0.45)',
          fontSize: 16, fontWeight: 900, color: '#fff',
          cursor: 'default', userSelect: 'none',
          marginBottom: 14,
          flexShrink: 0,
        }}
      >
        B
      </div>

      {/* ── Main nav pill ── */}
      <div style={{
        background: '#1e2433',
        borderRadius: 28,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
      }}>
        {NAV_ITEMS.map(({ id, Icon, title }) => (
          <NavBtn
            key={id}
            id={id}
            Icon={Icon}
            title={title}
            active={currentTab === id}
            onClick={() => setCurrentTab(id)}
          />
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* ── Bottom pill — help + logout ── */}
      <div style={{
        background: '#1e2433',
        borderRadius: 28,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
      }}>
        <NavBtn
          Icon={HelpCircle}
          title="Help"
          active={false}
          onClick={() => {}}
        />
        <NavBtn
          id="logout"
          Icon={LogOut}
          title="Sign Out"
          active={false}
          onClick={logout}
          danger
        />
      </div>
    </aside>
  );
}
