import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { email: 'procurement.officer@demo.gov.in', password: 'demo123', role: 'Procurement Officer',  color: '#3b82f6' },
  { email: 'senior.manager@demo.gov.in',      password: 'demo456', role: 'Senior Manager',       color: '#8b5cf6' },
  { email: 'admin@demo.gov.in',               password: 'admin123', role: 'System Admin',        color: '#f59e0b' },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('procurement.officer@demo.gov.in');
  const [password, setPassword] = useState('demo123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // App.jsx will detect user in AuthContext and render dashboard
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#030712' }}>

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Grid */}
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative z-10 w-full max-w-md animate-fade-up">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-60" style={{ background: 'rgba(245,158,11,0.5)' }} />
              <div className="relative px-5 py-3 rounded-2xl text-3xl font-black text-slate-950"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 32px rgba(245,158,11,0.35)' }}>
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

        {/* Card */}
        <div className="glass rounded-2xl p-8 relative overflow-hidden"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)' }}>

          <div className="absolute top-0 left-8 right-8 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Officer Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="email@demo.gov.in"
                  className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="glass-input w-full pl-10 pr-10 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs text-red-300 px-3 py-2.5 rounded-xl flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <span className="text-red-400">✗</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-glass-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Authenticating…
                </>
              ) : (
                <>Sign In to Procurement Engine <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Demo Account Quick-Switcher */}
          <div className="mt-6 space-y-2">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
              Quick Login — Demo Accounts
            </div>
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => quickLogin(acc)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={{
                  background: email === acc.email ? `${acc.color}12` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${email === acc.email ? `${acc.color}30` : 'rgba(255,255,255,0.06)'}`,
                }}
                onMouseEnter={e => { if (email !== acc.email) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (email !== acc.email) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: `${acc.color}30`, border: `1px solid ${acc.color}40` }}>
                  {acc.role[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-300 truncate">{acc.role}</div>
                  <div className="text-[10px] text-slate-600 truncate font-mono">{acc.email}</div>
                </div>
                <div className="text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#475569' }}>
                  {acc.password}
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-slate-600">
          GeM Compliance v1.0.0 · Simulated Government Layer · JWT Auth
        </p>
      </div>
    </div>
  );
}
