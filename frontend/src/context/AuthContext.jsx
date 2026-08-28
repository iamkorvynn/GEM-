import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, saveSession, loadSession, clearSession } from '../services/auth';

const AuthContext = createContext(null);

// Role permission map
const ROLE_PERMISSIONS = {
  'Procurement Officer':       ['dashboard', 'tenders', 'tender-details', 'new-verification', 'bidder-profile', 'bidders', 'documents', 'govt-sources', 'risk-overview', 'audit-trail', 'reports'],
  'Senior Procurement Officer':['dashboard', 'tenders', 'tender-details', 'new-verification', 'bidder-profile', 'bidders', 'documents', 'govt-sources', 'risk-overview', 'audit-trail', 'reports'],
  'Senior Manager':            ['dashboard', 'tenders', 'tender-details', 'bidder-profile', 'bidders', 'risk-overview', 'audit-trail', 'reports'],
  'System Admin':              ['dashboard', 'tenders', 'tender-details', 'new-verification', 'bidder-profile', 'bidders', 'documents', 'govt-sources', 'risk-overview', 'audit-trail', 'reports'],
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true); // true while checking localStorage

  // On mount — restore session from localStorage
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setToken(session.token);
      setUser(session.user);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginApi(email, password); // throws on failure
    saveSession(data.access_token, data.user);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  const canAccess = (tabId) => {
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS['Procurement Officer'];
    return perms.includes(tabId);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
