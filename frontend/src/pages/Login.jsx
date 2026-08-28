import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('procurement.officer@demo.gov.in');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLoginSuccess({ email, name: 'Rajesh Sharma', role: 'Senior Procurement Officer', department: 'PSU Industrial Procurement Department' });
      setLoading(false);
    }, 700);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#030712' }}>

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative z-10 w-full max-w-md animate-fade-up">

        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-60" style={{ background: 'rgba(245,158,11,0.5)' }} />
              <div className="relative px-5 py-3 rounded-2xl text-3xl font-black text-slate-950" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 32px rgba(245,158,11,0.35)' }}>
                GeM
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Government e-Marketplace</h1>
          <p className="text-sm text-slate-400 mt-1">Integrated Bid Compliance Verification Platform</p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs text-amber-300 font-medium glass-badge-amber">
            <ShieldCheck className="w-3.5 h-3.5" />
            Authorized Enterprise Procurement Officer Portal
          </div>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)' }}>

          {/* Inner shimmer line */}
          <div className="absolute top-0 left-8 right-8 h-px rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Officer Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="procurement.officer@demo.gov.in"
                  className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded accent-blue-500" />
                <span>Remember Session</span>
              </label>
              <button type="button" className="text-blue-400 hover:text-blue-300 transition">Forgot credentials?</button>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-glass-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Authenticating…
                </>
              ) : (
                <>Sign In to Procurement Engine <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3 rounded-xl glass-inner text-xs text-slate-400 space-y-1">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1.5">Demo Credentials Preloaded</div>
            <div>Email: <code className="text-slate-200 font-mono bg-white/5 px-1.5 py-0.5 rounded">procurement.officer@demo.gov.in</code></div>
            <div>Password: <code className="text-slate-200 font-mono bg-white/5 px-1.5 py-0.5 rounded">demo123</code></div>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-slate-600">GeM Compliance Verification System v1.0.0 · Simulated Government Layer</p>
      </div>
    </div>
  );
}
