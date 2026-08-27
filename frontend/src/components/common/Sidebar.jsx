import React from 'react';
import {
  LayoutDashboard, FileText, Users, ShieldAlert,
  FolderOpen, Landmark, Activity, FileSpreadsheet,
  CheckCircle, ChevronRight, Award
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const menuGroups = [
    {
      title: "Core Procurement",
      items: [
        { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
        { id: 'tenders', label: 'Tenders Management', icon: FileText },
        { id: 'bidders', label: 'Bidder Verification', icon: Users, badge: '3 Demo' },
      ]
    },
    {
      title: "Verification Engine",
      items: [
        { id: 'documents', label: 'Document Ingestion', icon: FolderOpen },
        { id: 'govt-sources', label: 'Government Sources', icon: Landmark, badge: 'Mock APIs' },
        { id: 'risk-overview', label: 'Risk Analytics', icon: ShieldAlert },
      ]
    },
    {
      title: "Governance & Reports",
      items: [
        { id: 'audit-trail', label: 'Audit Trail', icon: Activity },
        { id: 'reports', label: 'Compliance Reports', icon: FileSpreadsheet },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* GeM Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/60">
        <div className="bg-amber-500 text-slate-950 p-2 rounded-lg font-black text-lg shadow-sm">
          GeM
        </div>
        <div>
          <div className="font-bold text-slate-100 text-sm tracking-wide">Government e-Marketplace</div>
          <div className="text-[11px] text-amber-400 font-medium">Compliance Intelligence</div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                      active
                        ? 'bg-blue-600 text-white font-semibold shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        active ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer User Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            RS
          </div>
          <div className="overflow-hidden">
            <div className="font-semibold text-slate-200 truncate">Rajesh Sharma</div>
            <div className="text-[10px] text-slate-400 truncate">Senior Procurement Officer</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
