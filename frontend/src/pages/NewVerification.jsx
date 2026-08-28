import React, { useState } from 'react';

export default function NewVerification({ onBidderCreated, showToast }) {
  const [form, setForm] = useState({
    company_name: '',
    pan: '',
    gstin: '',
    company_type: 'Pvt Ltd',
    tender_id: 'GEM/2026/B/784921',
    claims_msme: false,
    claims_startup: false,
    local_content_pct: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.company_name.trim()) e.company_name = 'Company name is required';
    if (!form.pan.trim()) e.pan = 'PAN is required';
    if (!form.gstin.trim()) e.gstin = 'GSTIN is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/bidders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, local_content_pct: parseFloat(form.local_content_pct) || 0 }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Failed'); }
      const bidder = await res.json();
      showToast('Bid Added', `${bidder.company_name} added to review queue. Registry pre-fetch complete.`, 'success');
      onBidderCreated(bidder.id);
    } catch (err) { showToast('Error', err.message, 'error'); }
    finally { setLoading(false); }
  };

  const Field = ({ field, label, placeholder, type = 'text' }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <input
        id={`nv-${field}`}
        type={type}
        value={form[field]}
        placeholder={placeholder}
        onChange={e => { setForm(f => ({ ...f, [field]: e.target.value })); setErrors(er => ({ ...er, [field]: undefined })); }}
        className="glass-input px-4 py-2.5 text-sm w-full"
        style={errors[field] ? { borderColor: 'rgba(239,68,68,0.50)', boxShadow: '0 0 0 2px rgba(239,68,68,0.12)' } : {}}
      />
      {errors[field] && <span className="text-xs text-red-400">{errors[field]}</span>}
    </div>
  );

  return (
    <div className="min-h-full p-6 md:p-10 relative z-1">
      <div className="max-w-2xl mx-auto">

        {/* Page header */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.30)', boxShadow: '0 0 20px rgba(59,130,246,0.15)' }}>
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">New Verification</h1>
              <p className="text-xs text-slate-500">Add a bid to the review queue — registry pre-fetch runs automatically on submit</p>
            </div>
          </div>

          {/* Info banner */}
          <div className="mt-4 p-3 rounded-xl text-xs text-blue-300 flex gap-2 items-start" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.20)' }}>
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            GST portal, Debarment Watchlist, and EPFO records will be pre-fetched automatically from government data adapters on submit.
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-6 md:p-8 space-y-6 animate-fade-up relative overflow-hidden"
          style={{ animationDelay: '80ms', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
        >
          {/* Top shimmer */}
          <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

          {/* Section: Company */}
          <div>
            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-4 pb-2 border-b border-white/[0.05]">Company Information</div>
            <div className="space-y-4">
              <Field field="company_name" label="Company / Entity Name" placeholder="e.g. ABC Industrial Solutions Pvt. Ltd." />
              <div className="grid grid-cols-2 gap-4">
                <Field field="pan" label="PAN" placeholder="e.g. ABCDE1234F" />
                <Field field="gstin" label="GSTIN" placeholder="e.g. 27ABCDE1234F1Z5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Company Type</label>
                <select
                  id="nv-company_type"
                  value={form.company_type}
                  onChange={e => setForm(f => ({ ...f, company_type: e.target.value }))}
                  className="glass-input px-4 py-2.5 text-sm w-full"
                  style={{ appearance: 'none' }}
                >
                  {['Pvt Ltd', 'Public Ltd', 'Proprietorship', 'Partnership', 'LLP', 'OPC'].map(t => (
                    <option key={t} value={t} style={{ background: '#0f172a' }}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Tender */}
          <div>
            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-4 pb-2 border-b border-white/[0.05]">Tender Assignment</div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tender ID</label>
              <select
                id="nv-tender_id"
                value={form.tender_id}
                onChange={e => setForm(f => ({ ...f, tender_id: e.target.value }))}
                className="glass-input px-4 py-2.5 text-sm w-full"
                style={{ appearance: 'none' }}
              >
                <option value="GEM/2026/B/784921" style={{ background: '#0f172a' }}>GEM/2026/B/784921 — Supply & Installation of Industrial Safety Equipment</option>
              </select>
            </div>
          </div>

          {/* Section: Claims */}
          <div>
            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-4 pb-2 border-b border-white/[0.05]">Eligibility Claims</div>
            <div className="space-y-4">
              {[
                { key: 'claims_msme',    title: 'Claims MSME Benefit',       desc: 'Requires valid Udyam Registration Certificate' },
                { key: 'claims_startup', title: 'Claims Startup India Benefit', desc: 'DPIIT-recognized startup registration required' },
              ].map(cl => (
                <button
                  key={cl.key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, [cl.key]: !f[cl.key] }))}
                  className="w-full flex items-center gap-3 text-left p-3 rounded-xl transition-all"
                  style={{
                    background: form[cl.key] ? 'rgba(59,130,246,0.10)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${form[cl.key] ? 'rgba(59,130,246,0.28)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all"
                    style={{ background: form[cl.key] ? '#3b82f6' : 'rgba(255,255,255,0.06)', border: `1px solid ${form[cl.key] ? '#3b82f6' : 'rgba(255,255,255,0.12)'}` }}
                  >
                    {form[cl.key] && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${form[cl.key] ? 'text-blue-300' : 'text-slate-300'}`}>{cl.title}</div>
                    <div className="text-xs text-slate-600">{cl.desc}</div>
                  </div>
                </button>
              ))}

              {/* Local content slider */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-300">Declared Local Content</div>
                    <div className="text-xs text-slate-600">Min 50% for Class-I Local Supplier</div>
                  </div>
                  <div className="text-2xl font-black" style={{ color: form.local_content_pct >= 50 ? '#10b981' : '#f59e0b' }}>
                    {form.local_content_pct}%
                  </div>
                </div>
                <input
                  type="range" min={0} max={100} step={5}
                  value={form.local_content_pct}
                  onChange={e => setForm(f => ({ ...f, local_content_pct: e.target.value }))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>0%</span>
                  <span className="text-amber-500">50% threshold</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              id="nv-submit"
              type="submit"
              disabled={loading}
              className="btn-glass-primary w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Adding to Queue…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Add Bid to Review Queue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
