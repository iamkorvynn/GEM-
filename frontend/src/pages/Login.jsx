import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Building2 } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('procurement.officer@demo.gov.in');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        email: email,
        name: 'Rajesh Sharma',
        role: 'Senior Procurement Officer',
        department: 'PSU Industrial Procurement Department'
      });
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Graphic Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>

      <div className="max-w-md w-full z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-2xl font-black shadow-lg mb-3">
            GeM
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Government e-Marketplace</h1>
          <p className="text-sm text-slate-400 mt-1">Integrated Bid Compliance Verification Platform</p>
          <div className="inline-flex items-center mt-3 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-amber-400">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Authorized Enterprise Procurement Officer Portal
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Officer Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
                  placeholder="procurement.officer@demo.gov.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500" />
                <span>Remember Officer Session</span>
              </label>
              <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-blue-400 hover:underline">Forgot credentials?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Procurement Engine'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-6 p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-amber-400 text-[11px] uppercase tracking-wider">Demo Credentials Preloaded</div>
            <div>Email: <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">procurement.officer@demo.gov.in</code></div>
            <div>Password: <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">demo123</code></div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          GeM Compliance Verification System v1.0.0 | Simulated Government Layer
        </div>
      </div>
    </div>
  );
}
