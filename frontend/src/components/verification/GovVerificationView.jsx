import React, { useState } from 'react';
import { Landmark, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Info, Code, Play } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function GovVerificationView({ records = [] }) {
  const [sandboxSource, setSandboxSource] = useState('GST');
  const [sandboxInput, setSandboxInput] = useState('27ABCDE1234F1Z5');
  const [sandboxResult, setSandboxResult] = useState(null);

  const adaptersList = [
    { name: 'GST Portal (GSTIN)', key: 'GST' },
    { name: 'PAN Registry', key: 'PAN' },
    { name: 'Udyam / MSME Portal', key: 'Udyam' },
    { name: 'CPPP / GeM Debarment Watchlist', key: 'Debarment DB' },
    { name: 'OEM Manufacturer Registry', key: 'OEM Registry' },
    { name: 'Income Tax Return (ITR)', key: 'Income Tax' },
    { name: 'Ministry of Corporate Affairs (MCA)', key: 'MCA' },
  ];

  const handleTestQuery = () => {
    let res = {};
    if (sandboxSource === 'GST') {
      if (sandboxInput === '27ABCDE1234F1Z5') {
        res = { source: 'GST', status: 'VERIFIED', legal_name: 'ABC Industrial Solutions Pvt. Ltd.', registration_status: 'ACTIVE', reference_id: 'MOCK-GST-1234F1Z5' };
      } else if (sandboxInput === '27NOVAS9876K1Z9') {
        res = { source: 'GST', status: 'VERIFIED', legal_name: 'Nova Safety Systems Private Limited', registration_status: 'ACTIVE', reference_id: 'MOCK-GST-9876K1Z9' };
      } else {
        res = { source: 'GST', status: 'FAILED', error: 'GSTIN not found in mock GST registry', reference_id: 'MOCK-GST-NOTFOUND' };
      }
    } else if (sandboxSource === 'Debarment DB') {
      if (sandboxInput.toUpperCase().includes('PRIME')) {
        res = { source: 'Debarment DB', status: 'FAILED', debarment_found: true, debarred_entity: 'PRIME INDUSTRIAL TECHNOLOGIES', debarred_until: '2028-05-10', reason: 'Failure to fulfill OEM guarantee' };
      } else {
        res = { source: 'Debarment DB', status: 'VERIFIED', debarment_found: false, message: 'Clean. No match found in CPPP Debarment Watchlist.' };
      }
    } else {
      res = { source: sandboxSource, status: 'VERIFIED', query: sandboxInput, verified_at: new Date().toISOString(), reference_id: `MOCK-${sandboxSource}-9912` };
    }
    setSandboxResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Banner Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between text-xs text-amber-300">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-amber-200">Government Verification Mock Layer Active</span> — Demonstrates automated API queries against synthetic databases.
          </div>
        </div>
        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-bold rounded text-[10px] uppercase border border-amber-500/40">
          Simulation Layer Mode
        </span>
      </div>

      {/* Live Sandbox Query Tester Component */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl space-y-4 glow-blue">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-white flex items-center">
            <Code className="w-4 h-4 mr-2 text-blue-400" /> Interactive Mock Adapter Sandbox Tester
          </h3>
          <span className="text-[10px] text-slate-400">Test live adapter response payloads</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Adapter</label>
            <select
              value={sandboxSource}
              onChange={(e) => setSandboxSource(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:ring-2 focus:ring-blue-500"
            >
              {adaptersList.map((a) => (
                <option key={a.key} value={a.key}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-6">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Query Key / Registration ID</label>
            <input
              type="text"
              value={sandboxInput}
              onChange={(e) => setSandboxInput(e.target.value)}
              placeholder="e.g. 27ABCDE1234F1Z5 or Prime Industrial"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              onClick={handleTestQuery}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-all flex items-center justify-center space-x-1"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Query Adapter</span>
            </button>
          </div>
        </div>

        {sandboxResult && (
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 space-y-1">
            <div className="text-[10px] text-slate-500 font-sans font-bold uppercase">Adapter Response Payload (JSON):</div>
            <pre className="overflow-x-auto text-[11px] leading-tight">{JSON.stringify(sandboxResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Grid of Government Verification Adapters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adaptersList.map((adapter) => {
          const rec = records.find((r) => r.source === adapter.key);
          const isVerified = rec && rec.status === 'VERIFIED';
          
          let parsedGovRecord = {};
          if (rec && rec.government_record_json) {
            try {
              parsedGovRecord = JSON.parse(rec.government_record_json);
            } catch (e) {}
          }

          return (
            <div
              key={adapter.key}
              className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-md space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-slate-800 text-blue-400 rounded-lg">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-100">{adapter.name}</h3>
                    <div className="text-[10px] text-slate-400 font-mono">Adapter: {adapter.key}VerificationAdapter</div>
                  </div>
                </div>
                <StatusBadge status={rec ? rec.status : 'PENDING'} />
              </div>

              {/* Submitted vs Government Record Breakdown */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Submitted Value</span>
                  <span className="font-mono font-semibold text-slate-200 break-all">
                    {rec ? rec.submitted_value || 'Submitted Copy' : 'Awaiting Query'}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mock Govt Record</span>
                  <span className="font-mono font-semibold text-slate-200 break-all">
                    {parsedGovRecord.legal_name || parsedGovRecord.registration_status || parsedGovRecord.status || (isVerified ? 'VERIFIED' : 'No Record')}
                  </span>
                </div>
              </div>

              {/* Timestamp & Reference ID */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                <span>Reference: <code className="font-mono text-slate-300">{rec?.reference_id || 'MOCK-REF-PENDING'}</code></span>
                <span>Verified: {rec?.verified_at ? new Date(rec.verified_at).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
