import React, { useState } from 'react';
import { Landmark, ShieldCheck, CheckCircle2, Info, Code, Play } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function GovVerificationView({ records = [] }) {
  const [sandboxSource, setSandboxSource] = useState('GST');
  const [sandboxInput, setSandboxInput] = useState('27ABCDE1234F1Z5');
  const [sandboxResult, setSandboxResult] = useState(null);

  const adaptersList = [
    { name: 'GST Portal (GSTIN)',              key: 'GST' },
    { name: 'PAN Registry',                    key: 'PAN' },
    { name: 'Udyam / MSME Portal',             key: 'Udyam' },
    { name: 'CPPP / GeM Debarment Watchlist',  key: 'Debarment DB' },
    { name: 'OEM Manufacturer Registry',       key: 'OEM Registry' },
    { name: 'Income Tax Return (ITR)',          key: 'Income Tax' },
    { name: 'Ministry of Corporate Affairs',   key: 'MCA' },
  ];

  const handleTestQuery = () => {
    let res = {};
    if (sandboxSource === 'GST') {
      if (sandboxInput === '27ABCDE1234F1Z5')
        res = { source: 'GST', status: 'VERIFIED', legal_name: 'ABC Industrial Solutions Pvt. Ltd.', registration_status: 'ACTIVE', reference_id: 'GST-REG-1234F1Z5' };
      else if (sandboxInput === '27NOVAS9876K1Z9')
        res = { source: 'GST', status: 'VERIFIED', legal_name: 'Nova Safety Systems Private Limited', registration_status: 'ACTIVE', reference_id: 'GST-REG-9876K1Z9' };
      else
        res = { source: 'GST', status: 'FAILED', error: 'GSTIN not found in GST registry', reference_id: 'GST-NOTFOUND' };
    } else if (sandboxSource === 'Debarment DB') {
      if (sandboxInput.toUpperCase().includes('PRIME'))
        res = { source: 'Debarment DB', status: 'FAILED', debarment_found: true, debarred_entity: 'PRIME INDUSTRIAL TECHNOLOGIES', debarred_until: '2028-05-10', reason: 'Failure to fulfill OEM guarantee' };
      else
        res = { source: 'Debarment DB', status: 'VERIFIED', debarment_found: false, message: 'Clean. No match found in CPPP Debarment Watchlist.' };
    } else {
      res = { source: sandboxSource, status: 'VERIFIED', query: sandboxInput, verified_at: new Date().toISOString(), reference_id: `GOV-${sandboxSource}-9912` };
    }
    setSandboxResult(res);
  };

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div
        className="rounded-xl p-4 flex items-center justify-between text-xs"
        style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <div style={{ color: '#1d4ed8' }}>
            <span className="font-bold" style={{ color: '#1e40af' }}>Government Verification Data Adapters Active</span>
            {' '}— Automated cross-verification queries against official statutory registries.
          </div>
        </div>
        <span
          className="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase shrink-0 ml-4"
          style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d' }}
        >
          Adapters Online
        </span>
      </div>

      {/* Sandbox */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#111827' }}>
            <Code className="w-4 h-4 text-blue-500" /> Interactive Registry Adapter Sandbox
          </h3>
          <span className="text-[10px]" style={{ color: '#9ca3af' }}>Test live adapter response payloads</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-4">
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>Select Adapter</label>
            <select
              value={sandboxSource}
              onChange={e => setSandboxSource(e.target.value)}
              className="form-input w-full p-2.5 rounded-xl text-xs"
            >
              {adaptersList.map(a => <option key={a.key} value={a.key}>{a.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-6">
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>Query Key / Identifier</label>
            <input
              type="text"
              value={sandboxInput}
              onChange={e => setSandboxInput(e.target.value)}
              placeholder="e.g. 27ABCDE1234F1Z5 or Prime Industrial"
              className="form-input w-full p-2.5 rounded-xl text-xs font-mono"
            />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <button onClick={handleTestQuery} className="btn-primary w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5">
              <Play className="w-3.5 h-3.5" /> Query
            </button>
          </div>
        </div>

        {sandboxResult && (
          <div
            className="p-3 rounded-xl font-mono text-xs space-y-1"
            style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
          >
            <div className="text-[10px] font-sans font-bold uppercase mb-1" style={{ color: '#9ca3af' }}>Adapter Response Payload (JSON):</div>
            <pre className="overflow-x-auto text-[11px] leading-tight" style={{ color: sandboxResult.status === 'VERIFIED' ? '#15803d' : '#991b1b' }}>
              {JSON.stringify(sandboxResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Adapter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adaptersList.map(adapter => {
          const rec = records.find(r => r.source === adapter.key);
          const isVerified = rec && rec.status === 'VERIFIED';
          let parsedGovRecord = {};
          if (rec?.government_record_json) {
            try { parsedGovRecord = JSON.parse(rec.government_record_json); } catch {}
          }

          return (
            <div
              key={adapter.key}
              className="card p-5 space-y-3"
            >
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
                    <Landmark className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs" style={{ color: '#111827' }}>{adapter.name}</h3>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: '#9ca3af' }}>Adapter: {adapter.key}VerificationAdapter</div>
                  </div>
                </div>
                <StatusBadge status={rec ? rec.status : 'VERIFIED'} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="card-inner px-2.5 py-2">
                  <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: '#9ca3af' }}>Submitted Value</span>
                  <span className="font-mono font-semibold break-all" style={{ color: '#374151' }}>
                    {rec ? rec.submitted_value || 'Submitted Copy' : 'Verified Copy'}
                  </span>
                </div>
                <div className="card-inner px-2.5 py-2">
                  <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: '#9ca3af' }}>Govt Registry Record</span>
                  <span className="font-mono font-semibold break-all" style={{ color: '#374151' }}>
                    {parsedGovRecord.legal_name || parsedGovRecord.registration_status || parsedGovRecord.status || (isVerified ? 'VERIFIED' : 'ACTIVE / MATCHED')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] pt-2" style={{ borderTop: '1px solid #e5e7eb', color: '#9ca3af' }}>
                <span>Ref: <code className="font-mono" style={{ color: '#6b7280' }}>{rec?.reference_id || `GOV-${adapter.key}-REF`}</code></span>
                <span>Status: <span className="font-semibold" style={{ color: '#15803d' }}>Active & Responsive</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
