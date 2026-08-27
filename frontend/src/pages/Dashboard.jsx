import React, { useEffect, useState } from 'react';
import {
  FileText, Users, CheckCircle2, Clock, AlertTriangle, ShieldAlert,
  TrendingUp, Activity, ArrowRight, ShieldCheck, FileCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchDashboardStats } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

export default function Dashboard({ setCurrentTab, setActiveBidderId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const compliancePieData = [
    { name: 'Fully Compliant (90-100)', value: 31, color: '#10b981' },
    { name: 'Review Required (70-89)', value: 11, color: '#f59e0b' },
    { name: 'High Risk / Non-Compliant (<70)', value: 6, color: '#ef4444' },
  ];

  const riskBarData = [
    { category: 'GST Reg', Pass: 44, Fail: 4 },
    { category: 'PAN Card', Pass: 46, Fail: 2 },
    { category: 'Udyam/MSME', Pass: 38, Fail: 10 },
    { category: 'OEM Auth', Pass: 32, Fail: 16 },
    { category: 'Local Content', Pass: 41, Fail: 7 },
    { category: 'Debarment DB', Pass: 46, Fail: 2 },
  ];

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading procurement analytics dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            GeM Procurement Compliance Intelligence Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated verification overview across active government tenders and bidder submissions.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentTab('tenders')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Manage Tenders</span>
          </button>
          <button
            onClick={() => setCurrentTab('bidders')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Evaluate Demo Bidders</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Tenders</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">12</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> 2 closing this week
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Bidders</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">48</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all active tenders</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verified Bidders</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">31</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">64.5% Fully Compliant</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Reviews</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">11</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Requires Officer Action</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">High Risk Bidders</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">6</div>
          <div className="text-[11px] text-rose-700 font-medium mt-1">Critical Discrepancies</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Distribution Donut */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Compliance Distribution</span>
            <span className="text-xs font-normal text-slate-400">Total: 48 Bidders</span>
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compliancePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {compliancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Pass / Fail Status per Rule Category */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Requirement Verification Breakdown</span>
            <span className="text-xs font-normal text-slate-400">By Category</span>
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBarData}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Pass" fill="#10b981" stackId="a" />
                <Bar dataKey="Fail" fill="#ef4444" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline & Demo Bidder Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Activity Feed */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <Activity className="w-4 h-4 mr-2 text-blue-600" /> Recent Verification Activity Log
            </h2>
            <button
              onClick={() => setCurrentTab('audit-trail')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
            >
              View Complete Audit Log <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                time: '20:14:22 IST',
                title: 'GST Verification Completed',
                bidder: 'ABC Industrial Solutions Pvt. Ltd.',
                source: 'Mock GST Adapter',
                result: 'VERIFIED',
                color: 'emerald'
              },
              {
                time: '20:15:04 IST',
                title: 'Legal Name Discrepancy Flagged',
                bidder: 'Nova Safety Systems Pvt. Ltd.',
                source: 'AI Extraction Engine',
                result: 'REVIEW REQUIRED',
                color: 'amber'
              },
              {
                time: '20:17:30 IST',
                title: 'OEM Authorization Document Missing & Debarment Alert',
                bidder: 'Prime Industrial Technologies',
                source: 'Debarment Watchlist DB',
                result: 'HIGH RISK',
                color: 'rose'
              },
              {
                time: '20:19:02 IST',
                title: 'Officer Officer Decision Recorded',
                bidder: 'ABC Industrial Solutions Pvt. Ltd.',
                source: 'Procurement Officer (Rajesh Sharma)',
                result: 'QUALIFIED',
                color: 'blue'
              }
            ].map((act, idx) => (
              <div key={idx} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div>
                  <div className="text-xs font-semibold text-slate-800">{act.title}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Bidder: <span className="font-medium text-slate-900">{act.bidder}</span> • {act.source}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{act.time}</div>
                </div>
                <StatusBadge status={act.result} />
              </div>
            ))}
          </div>
        </div>

        {/* Demo Scenario Launcher Card */}
        <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" /> Judging Demo Launcher
            </div>
            <h3 className="text-base font-bold text-white mb-2">Evaluate Demo Tender Scenarios</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Test end-to-end compliance checking on pre-configured realistic bidder profiles.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveBidderId('BIDDER-A');
                  setCurrentTab('bidders');
                }}
                className="w-full text-left p-2.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-emerald-400">Bidder A — Fully Compliant</div>
                  <div className="text-[11px] text-slate-400">ABC Industrial Solutions (Score: 98)</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => {
                  setActiveBidderId('BIDDER-B');
                  setCurrentTab('bidders');
                }}
                className="w-full text-left p-2.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-amber-400">Bidder B — Inconsistent</div>
                  <div className="text-[11px] text-slate-400">Nova Safety Systems (Score: 78)</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => {
                  setActiveBidderId('BIDDER-C');
                  setCurrentTab('bidders');
                }}
                className="w-full text-left p-2.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-rose-400">Bidder C — High Risk</div>
                  <div className="text-[11px] text-slate-400">Prime Industrial Tech (Score: 58)</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 text-center">
            Simulated Govt Layer Active • GeM Procurement System
          </div>
        </div>
      </div>
    </div>
  );
}
