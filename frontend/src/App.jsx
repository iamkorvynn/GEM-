import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import HeaderBanner from './components/common/HeaderBanner';
import Sidebar from './components/common/Sidebar';
import Topbar from './components/common/Topbar';
import Breadcrumb from './components/common/Breadcrumb';
import Toast from './components/common/Toast';
import VerificationProgressDrawer from './components/verification/VerificationProgressDrawer';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TenderList from './pages/TenderList';
import TenderDetails from './pages/TenderDetails';
import TenderBidderList from './pages/TenderBidderList';
import BidderProfile from './pages/BidderProfile';
import AwardDecision from './pages/AwardDecision';
import AuditTrailView from './pages/AuditTrailView';
import RiskAnalytics from './pages/RiskAnalytics';

// ── Nav helpers ───────────────────────────────────────────────────────────────
// nav shape: { page, tenderId, tenderTitle, bidderId, bidderName }
const DEFAULT_NAV = { page: 'dashboard' };

function AppInner() {
  const { user, loading } = useAuth();

  const [nav, setNav]               = useState(DEFAULT_NAV);
  const [toast, setToast]           = useState(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // ── Navigation helper ──────────────────────────────────────────────────────
  const go = (page, params = {}) => setNav({ page, ...params });

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Loading screen
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f2f5' }}>
      <div className="flex items-center gap-3 text-gray-400 text-sm">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="4"/>
          <path className="opacity-75" fill="#3b82f6" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Resolving GeM SSO session…
      </div>
    </div>
  );

  if (!user) return <Login />;

  // ── Page router ────────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (nav.page) {
      case 'dashboard':
        return (
          <Dashboard
            go={go}
            showToast={showToast}
          />
        );

      case 'tenders':
        return (
          <TenderList
            onSelectTender={(tenderId, tenderTitle) => go('tender-detail', { tenderId, tenderTitle })}
            showToast={showToast}
          />
        );

      case 'tender-detail':
        return (
          <TenderBidderList
            tenderId={nav.tenderId}
            tenderTitle={nav.tenderTitle}
            onSelectBidder={(bidderId, bidderName) =>
              go('bidder-detail', { tenderId: nav.tenderId, tenderTitle: nav.tenderTitle, bidderId, bidderName })
            }
            onAwardDecision={() => go('award-decision', { tenderId: nav.tenderId, tenderTitle: nav.tenderTitle })}
            onBack={() => go('tenders')}
            showToast={showToast}
          />
        );

      case 'bidder-detail':
        return (
          <BidderProfile
            bidderId={nav.bidderId}
            bidderName={nav.bidderName}
            tenderId={nav.tenderId}
            tenderTitle={nav.tenderTitle}
            onBack={() => go('tender-detail', { tenderId: nav.tenderId, tenderTitle: nav.tenderTitle })}
            onRunVerificationTrigger={() => setDrawerOpen(true)}
            showToast={showToast}
          />
        );

      case 'award-decision':
        return (
          <AwardDecision
            tenderId={nav.tenderId}
            tenderTitle={nav.tenderTitle}
            onBack={() => go('tender-detail', { tenderId: nav.tenderId, tenderTitle: nav.tenderTitle })}
            onComplete={() => { go('tenders'); showToast('Tender Completed', `Award recorded for ${nav.tenderTitle || nav.tenderId}`, 'success'); }}
            showToast={showToast}
          />
        );

      case 'audit-trail':
        return <AuditTrailView />;

      case 'risk-analytics':
        return (
          <RiskAnalytics
            go={go}
            showToast={showToast}
          />
        );

      default:
        return (
          <TenderList
            onSelectTender={(tenderId, tenderTitle) => go('tender-detail', { tenderId, tenderTitle })}
            showToast={showToast}
          />
        );
    }
  };

  const sidebarPage = ['tenders', 'tender-detail', 'bidder-list', 'bidder-detail', 'award-decision'].includes(nav.page)
    ? 'tenders'
    : nav.page;

  return (
    <div
      className="min-h-screen flex flex-col font-sans antialiased"
      style={{ background: '#f0f2f5', color: '#111827' }}
    >
      <HeaderBanner />

      <div className="flex flex-1" style={{ minHeight: 0 }}>
        <Sidebar
          currentTab={sidebarPage}
          setCurrentTab={(page) => go(page)}
        />

        <div className="flex-1 flex flex-col min-w-0" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          {/* Topbar with breadcrumb */}
          <Topbar
            nav={nav}
            go={go}
            BreadcrumbSlot={<Breadcrumb nav={nav} go={go} />}
          />

          <main className="flex-1">
            {renderPage()}
          </main>
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <VerificationProgressDrawer
        isOpen={isDrawerOpen}
        bidderName={nav.bidderName || 'Selected Bidder'}
        onComplete={() => {
          setDrawerOpen(false);
          showToast('Verification Pipeline Complete', 'Track A + B + C executed.', 'success');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
