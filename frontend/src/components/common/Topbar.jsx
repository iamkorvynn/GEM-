import React, { useState } from 'react';
import { Search, Bell, Shield, Sparkles, UserCheck, AlertTriangle } from 'lucide-react';

export default function Topbar({ activeBidderId, setActiveBidderId, setCurrentTab, onGlobalSearch }) {
  const [searchQuery, setSearchQuery] = useState('');

  const demoBidders = [
    { id: 'BIDDER-A', name: 'Bidder A (Compliant)', score: '98/100', risk: 'LOW', color: 'emerald' },
    { id: 'BIDDER-B', name: 'Bidder B (Inconsistent)', score: '78/100', risk: 'MEDIUM', color: 'amber' },
    { id: 'BIDDER-C', name: 'Bidder C (High Risk)', score: '58/100', risk: 'HIGH', color: 'rose' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (onGlobalSearch) onGlobalSearch(searchQuery);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xs">
      {/* Global Search Bar */}
      <form onSubmit={handleSearch} className="relative w-80">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Tender ID, Bidder, GSTIN, PAN..."
          className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 placeholder-slate-400"
        />
      </form>

      {/* Demo Scenario Quick-Switcher */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
        <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" /> Demo Bidders:
        </span>
        {demoBidders.map((b) => {
          const isActive = activeBidderId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => {
                setActiveBidderId(b.id);
                setCurrentTab('bidders');
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>{b.name}</span>
              <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                b.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                b.color === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {b.score}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications & Profile */}
      <div className="flex items-center space-x-4">
        <button className="relative text-slate-500 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
        </button>
        <div className="h-4 w-[1px] bg-slate-300"></div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-700">GeM Portal Authenticated</span>
        </div>
      </div>
    </header>
  );
}
