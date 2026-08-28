import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveSession, loadSession, clearSession } from '../services/auth';

const AuthContext = createContext(null);

/**
 * Role permission map — controls which sidebar tabs each officer role can access.
 * In a real GeM SSO integration, this would come from the officer's IAM claims.
 */
const ROLE_PERMISSIONS = {
  'Procurement Officer':        ['dashboard', 'tenders', 'tender-details', 'new-verification', 'bidder-profile', 'bidders', 'documents', 'govt-sources', 'risk-overview', 'audit-trail', 'reports'],
  'Senior Procurement Officer': ['dashboard', 'tenders', 'tender-details', 'new-verification', 'bidder-profile', 'bidders', 'documents', 'govt-sources', 'risk-overview', 'audit-trail', 'reports'],
  'Senior Manager':             ['dashboard', 'tenders', 'tender-details', 'bidder-profile', 'bidders', 'risk-overview', 'audit-trail', 'reports'],
  'System Admin':               ['dashboard', 'tenders', 'tender-details', 'new-verification', 'bidder-profile', 'bidders', 'documents', 'govt-sources', 'risk-overview', 'audit-trail', 'reports'],
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore any existing session (simulates GeM SSO cookie persistence)
  useEffect(() => {
    const session = loadSession();
    if (session) setUser(session);
    setLoading(false);
  }, []);

  /**
   * selectOfficer — simulates receiving officer identity from GeM SSO.
   * In production this would be called automatically on mount using the
   * parent GeM session token, not triggered by the user.
   */
  const selectOfficer = (officer) => {
    saveSession(officer);
    setUser(officer);
  };

  /**
   * logout — simulates the officer closing this tool / GeM SSO session expiry.
   * Returns to the officer-selection landing so a different officer can take over
   * (useful for shared workstations in a procurement office).
   */
  const logout = () => {
    clearSession();
    setUser(null);
  };

  const canAccess = (tabId) => {
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] ?? ROLE_PERMISSIONS['Procurement Officer'];
    return perms.includes(tabId);
  };

  return (
    <AuthContext.Provider value={{ user, loading, selectOfficer, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
