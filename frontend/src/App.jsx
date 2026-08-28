import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import HeaderBanner from './components/common/HeaderBanner';
import Sidebar from './components/common/Sidebar';
import Topbar from './components/common/Topbar';
import Toast from './components/common/Toast';
import VerificationProgressDrawer from './components/verification/VerificationProgressDrawer';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TenderList from './pages/TenderList';
import TenderDetails from './pages/TenderDetails';
import BidderComplianceDashboard from './pages/BidderComplianceDashboard';
import BidderProfile from './pages/BidderProfile';
import NewVerification from './pages/NewVerification';
import DocumentManagement from './pages/DocumentManagement';
import GovVerificationView from './components/verification/GovVerificationView';
import AuditTrailView from './pages/AuditTrailView';
import ReportGenerator from './pages/ReportGenerator';

// ── Inner app (needs AuthContext available) ───────────────────────────────────
function AppInner() {
  const { user, loading, canAccess } = useAuth();

  const [currentTab, setCurrentTab]       = useState('dashboard');
  const [activeTenderId, setActiveTenderId] = useState('GEM/2026/B/784921');
  const [activeBidderId, setActiveBidderId] = useState('BIDDER-A');
  const [toast, setToast]                 = useState(null);
  const [isDrawerOpen, setIsDrawerOpen]   = useState(false);

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Safe tab setter — falls back to dashboard if role can't access
  const safeSetTab = (tab) => {
    if (canAccess(tab)) setCurrentTab(tab);
    else { setCurrentTab('dashboard'); showToast('Access Restricted', `Your role cannot access "${tab}".`, 'warning'); }
  };

  // While checking localStorage for saved token
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#030712' }}>
      <div className="flex items-center gap-3 text-slate-500 text-sm">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Checking session…
      </div>
    </div>
  );

  // Not logged in → show Login
  if (!user) return <Login />;

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white"
      style={{ background: '#030712', color: '#e2e8f0' }}>

      <HeaderBanner />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentTab={currentTab} setCurrentTab={safeSetTab} />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Topbar
            activeBidderId={activeBidderId}
            setActiveBidderId={(id) => {
              setActiveBidderId(id);
              showToast('Bidder Switched', `Active bidder → ${id}`, 'info');
            }}
            setCurrentTab={safeSetTab}
          />

          <main className="flex-1">
            {currentTab === 'dashboard' && (
              <Dashboard
                setCurrentTab={safeSetTab}
                setActiveBidderId={(id) => { setActiveBidderId(id); safeSetTab('bidder-profile'); }}
              />
            )}
            {currentTab === 'tenders' && (
              <TenderList onSelectTender={(id) => { setActiveTenderId(id); safeSetTab('tender-details'); }} />
            )}
            {currentTab === 'tender-details' && (
              <TenderDetails tenderId={activeTenderId} onProceedToBidders={() => safeSetTab('bidders')} />
            )}
            {currentTab === 'bidder-profile' && (
              <BidderProfile
                bidderId={activeBidderId}
                onRunVerificationTrigger={() => setIsDrawerOpen(true)}
                showToast={showToast}
              />
            )}
            {currentTab === 'new-verification' && (
              <NewVerification
                showToast={showToast}
                onBidderCreated={(id) => { setActiveBidderId(id); safeSetTab('bidder-profile'); }}
              />
            )}
            {currentTab === 'bidders' && (
              <BidderComplianceDashboard
                bidderId={activeBidderId}
                onNavigateToReport={(id) => { setActiveBidderId(id); safeSetTab('reports'); }}
                onRunVerificationTrigger={() => setIsDrawerOpen(true)}
                showToast={showToast}
              />
            )}
            {currentTab === 'documents' && <DocumentManagement activeBidderId={activeBidderId} />}
            {currentTab === 'govt-sources' && (
              <div className="p-6"><GovVerificationView /></div>
            )}
            {currentTab === 'risk-overview' && (
              <BidderComplianceDashboard
                bidderId={activeBidderId}
                onNavigateToReport={(id) => { setActiveBidderId(id); safeSetTab('reports'); }}
                onRunVerificationTrigger={() => setIsDrawerOpen(true)}
                showToast={showToast}
              />
            )}
            {currentTab === 'audit-trail' && <AuditTrailView />}
            {currentTab === 'reports' && (
              <ReportGenerator bidderId={activeBidderId} onBack={() => safeSetTab('bidder-profile')} />
            )}
          </main>
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <VerificationProgressDrawer
        isOpen={isDrawerOpen}
        bidderName={
          activeBidderId === 'BIDDER-A' ? 'ABC Industrial Solutions' :
          activeBidderId === 'BIDDER-B' ? 'Nova Safety Systems' :
          activeBidderId === 'BIDDER-C' ? 'Alpha Tech Enterprises' :
          activeBidderId === 'BIDDER-D' ? 'Prime Industrial Technologies' :
          'Radiant Procurement Solutions'
        }
        onComplete={() => {
          setIsDrawerOpen(false);
          showToast('Verification Pipeline Complete', 'Track A + B + C executed successfully.', 'success');
        }}
      />
    </div>
  );
}

// ── Root — wraps everything in AuthProvider ───────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
