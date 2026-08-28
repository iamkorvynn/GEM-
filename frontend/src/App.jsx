import React, { useState } from 'react';
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeTenderId, setActiveTenderId] = useState('GEM/2026/B/784921');
  const [activeBidderId, setActiveBidderId] = useState('BIDDER-A');

  // UI Toast State
  const [toast, setToast] = useState(null);
  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Verification Progress Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleTriggerVerificationDrawer = () => setIsDrawerOpen(true);

  const handleDrawerComplete = () => {
    setIsDrawerOpen(false);
    showToast(
      'Verification Pipeline Complete',
      'Track A (Exact), Track B (Fuzzy Blacklist), Track C (Correlation) all executed.',
      'success'
    );
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white" style={{ background: '#030712', color: '#e2e8f0' }}>
      {/* 1. Government Simulated Layer Top Notification Banner */}
      <HeaderBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* 2. Left Enterprise GovTech Sidebar */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* 3. Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* PRD §5.1 — Topbar with demo switcher + system status indicator */}
          <Topbar
            activeBidderId={activeBidderId}
            setActiveBidderId={(id) => {
              setActiveBidderId(id);
              showToast('Demo Scenario Switched', `Switched active view to bidder ${id}`, 'info');
            }}
            setCurrentTab={setCurrentTab}
          />

          {/* Main Dynamic View Content */}
          <main className="flex-1">
            {currentTab === 'dashboard' && (
              <Dashboard
                setCurrentTab={setCurrentTab}
                setActiveBidderId={(id) => {
                  setActiveBidderId(id);
                  setCurrentTab('bidder-profile');
                  showToast('Selected Demo Bidder', `Loading 4-tab profile for ${id}`, 'info');
                }}
              />
            )}

            {currentTab === 'tenders' && (
              <TenderList
                onSelectTender={(id) => {
                  setActiveTenderId(id);
                  setCurrentTab('tender-details');
                  showToast('Tender Loaded', `Loaded Tender ${id}`, 'info');
                }}
              />
            )}

            {currentTab === 'tender-details' && (
              <TenderDetails
                tenderId={activeTenderId}
                onProceedToBidders={() => setCurrentTab('bidders')}
              />
            )}

            {/* PRD §5.2 — 4-Tab Bidder Profile (Documents, Overview, Verification Detail, Audit Log) */}
            {currentTab === 'bidder-profile' && (
              <BidderProfile
                bidderId={activeBidderId}
                onRunVerificationTrigger={handleTriggerVerificationDrawer}
                showToast={showToast}
              />
            )}

            {/* PRD §5 — New Verification form (POST /bidders) */}
            {currentTab === 'new-verification' && (
              <NewVerification
                showToast={showToast}
                onBidderCreated={(newId) => {
                  setActiveBidderId(newId);
                  setCurrentTab('bidder-profile');
                }}
              />
            )}

            {currentTab === 'bidders' && (
              <BidderComplianceDashboard
                bidderId={activeBidderId}
                onNavigateToReport={(id) => {
                  setActiveBidderId(id);
                  setCurrentTab('reports');
                }}
                onRunVerificationTrigger={handleTriggerVerificationDrawer}
                showToast={showToast}
              />
            )}

            {currentTab === 'documents' && (
              <DocumentManagement activeBidderId={activeBidderId} />
            )}

            {currentTab === 'govt-sources' && (
              <div className="p-6">
                <GovVerificationView />
              </div>
            )}

            {currentTab === 'risk-overview' && (
              <BidderComplianceDashboard
                bidderId={activeBidderId}
                onNavigateToReport={(id) => {
                  setActiveBidderId(id);
                  setCurrentTab('reports');
                }}
                onRunVerificationTrigger={handleTriggerVerificationDrawer}
                showToast={showToast}
              />
            )}

            {/* PRD §5 — Global Audit Trail */}
            {currentTab === 'audit-trail' && <AuditTrailView />}

            {currentTab === 'reports' && (
              <ReportGenerator
                bidderId={activeBidderId}
                onBack={() => setCurrentTab('bidder-profile')}
              />
            )}
          </main>
        </div>
      </div>

      {/* Floating Global Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Animated 3-Track Verification Drawer */}
      <VerificationProgressDrawer
        isOpen={isDrawerOpen}
        bidderName={
          activeBidderId === 'BIDDER-A' ? 'ABC Industrial Solutions' :
          activeBidderId === 'BIDDER-B' ? 'Nova Safety Systems' :
          activeBidderId === 'BIDDER-C' ? 'Alpha Tech Enterprises' :
          activeBidderId === 'BIDDER-D' ? 'Prime Industrial Technologies' :
          'Radiant Procurement Solutions'
        }
        onComplete={handleDrawerComplete}
      />
    </div>
  );
}
