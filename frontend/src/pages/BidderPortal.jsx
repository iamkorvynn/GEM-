import React, { useEffect, useState } from 'react';
import {
  Building2, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
  XCircle, Upload, FileText, LogOut, Info, ArrowUpRight, Sparkles, AlertOctagon
} from 'lucide-react';
import { fetchBidderDetails, uploadDocument } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

export default function BidderPortal({ user, onLogout, showToast }) {
  const [bidder, setBidder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist', 'documents'
  const [dragOver, setDragOver] = useState(false);
  const [showDigiLocker, setShowDigiLocker] = useState(false);

  const bidderId = user?.bidder_id || 'BIDDER-A';

  const loadBidderData = () => {
    setLoading(true);
    fetchBidderDetails(bidderId)
      .then((data) => {
        setBidder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to load bidder data from API, using client mock:", err);
        // Fallback mock bidder records for offline capability
        const mockBidders = {
          'BIDDER-A': {
            id: 'BIDDER-A',
            company_name: 'ABC Industrial Solutions Pvt. Ltd.',
            tender_id: 'GEM/2026/B/784921',
            gstin: '27ABCDE1234F1Z5',
            pan: 'ABCDE1234F',
            udyam_id: 'UDYAM-MH-01-0012345',
            claims_msme: true,
            local_content_pct: 65.0,
            compliance_score: 98.0,
            risk_level: 'LOW',
            overall_status: 'VERIFIED',
            documents: [
              { id: 'DOC-A-GST', file_name: 'ABC_GST_Certificate.pdf', classified_type: 'GST Certificate', classification_confidence: 0.99, status: 'VERIFIED' },
              { id: 'DOC-A-OEM', file_name: 'OEM_Authorization_Suraksha.pdf', classified_type: 'OEM Authorization', classification_confidence: 0.98, status: 'VERIFIED' },
              { id: 'DOC-A-MII', file_name: 'Make_in_India_Declaration_65pct.pdf', classified_type: 'Make in India Declaration', classification_confidence: 0.97, status: 'VERIFIED' }
            ],
            compliance_results: [
              { requirement_id: 'REQ-GST-001', requirement_title: 'GST Registration', status: 'VERIFIED', extracted_value: '27ABCDE1234F1Z5', rule_explanation: 'GSTIN active and legal name matches submission exactly.' },
              { requirement_id: 'REQ-PAN-001', requirement_title: 'PAN Card Verification', status: 'VERIFIED', extracted_value: 'ABCDE1234F', rule_explanation: 'PAN matches registered business identity.' },
              { requirement_id: 'REQ-OEM-001', requirement_title: 'OEM Manufacturer Authorization', status: 'VERIFIED', extracted_value: 'Suraksha Global Safety Corp (Valid till 2027-12-31)', rule_explanation: 'Valid OEM authorization on file till 2027.' },
              { requirement_id: 'REQ-MII-001', requirement_title: 'Make in India Local Content Declaration', status: 'VERIFIED', extracted_value: '65%', rule_explanation: 'Local content of 65% exceeds required 50% threshold.' },
              { requirement_id: 'REQ-DEBAR-001', requirement_title: 'Non-Blacklisting & Debarment Declaration', status: 'VERIFIED', extracted_value: 'Not Debarred', rule_explanation: 'No match in CPPP / GeM Debarment Watchlist.' }
            ],
            ai_findings: [
              { title: 'Verified: Full Eligibility Compliant', severity: 'VERIFIED', description: 'Bidder satisfies all mandatory and conditional eligibility clauses with zero discrepancies.', confidence: 0.99, recommendation: 'Recommended for Qualification.' }
            ]
          },
          'BIDDER-B': {
            id: 'BIDDER-B',
            company_name: 'Nova Safety Systems Pvt. Ltd.',
            tender_id: 'GEM/2026/B/784921',
            gstin: '27NOVAS9876K1Z9',
            pan: 'NOVAS9876K',
            udyam_id: 'UDYAM-KA-02-0098765',
            claims_msme: true,
            local_content_pct: 55.0,
            compliance_score: 78.0,
            risk_level: 'MEDIUM',
            overall_status: 'REVIEW_REQUIRED',
            documents: [
              { id: 'DOC-B-GST', file_name: 'Nova_GST_Certificate.pdf', classified_type: 'GST Certificate', classification_confidence: 0.98, status: 'VERIFIED' },
              { id: 'DOC-B-OEM', file_name: 'OEM_Letter_ShieldTech.pdf', classified_type: 'OEM Authorization', classification_confidence: 0.97, status: 'VERIFIED' }
            ],
            compliance_results: [
              { requirement_id: 'REQ-GST-001', requirement_title: 'GST Registration', status: 'REVIEW_REQUIRED', extracted_value: 'Nova Safety Systems Pvt. Ltd.', rule_explanation: "Minor legal name variation: Submitted 'Pvt. Ltd.' vs GST Portal 'Private Limited'." },
              { requirement_id: 'REQ-PAN-001', requirement_title: 'PAN Card Verification', status: 'VERIFIED', extracted_value: 'NOVAS9876K', rule_explanation: 'PAN matches registered business identity.' },
              { requirement_id: 'REQ-OEM-001', requirement_title: 'OEM Manufacturer Authorization', status: 'REVIEW_REQUIRED', extracted_value: 'Expires: 2026-10-15', rule_explanation: 'OEM authorization letter expires on 2026-10-15 (within 45 days of bid submission).' },
              { requirement_id: 'REQ-MII-001', requirement_title: 'Make in India Local Content Declaration', status: 'VERIFIED', extracted_value: '55%', rule_explanation: 'Local content of 55% exceeds required 50% threshold.' },
              { requirement_id: 'REQ-DEBAR-001', requirement_title: 'Non-Blacklisting & Debarment Declaration', status: 'VERIFIED', extracted_value: 'Not Debarred', rule_explanation: 'No match in CPPP / GeM Debarment Watchlist.' }
            ],
            ai_findings: [
              { title: 'Legal Name Minor Variation', severity: 'MEDIUM', description: "GST registration legal name contains 'Private Limited' while bid submission uses 'Pvt. Ltd.'", confidence: 0.94, recommendation: 'Manual officer verification suggested to confirm legal entity identity.' },
              { title: 'OEM Authorization Approaching Expiry', severity: 'MEDIUM', description: 'OEM Authorization is valid but expires in less than 45 days.', confidence: 0.90, recommendation: 'Request updated OEM authorization letter.' }
            ]
          },
          'BIDDER-C': {
            id: 'BIDDER-C',
            company_name: 'Prime Industrial Technologies',
            tender_id: 'GEM/2026/B/784921',
            gstin: '27PRIME5432M1Z2',
            pan: 'PRIME5432M',
            udyam_id: null,
            claims_msme: false,
            local_content_pct: 40.0,
            compliance_score: 58.0,
            risk_level: 'HIGH',
            overall_status: 'REVIEW_REQUIRED',
            documents: [
              { id: 'DOC-C-GST', file_name: 'Prime_GST_Cert_Provisional.pdf', classified_type: 'GST Certificate', classification_confidence: 0.96, status: 'VERIFIED' },
              { id: 'DOC-C-ISO', file_name: 'ISO_9001_2015_Expired.pdf', classified_type: 'Technical Certificate', classification_confidence: 0.95, status: 'VERIFIED' }
            ],
            compliance_results: [
              { requirement_id: 'REQ-GST-001', requirement_title: 'GST Registration', status: 'VERIFIED', extracted_value: '27PRIME5432M1Z2', rule_explanation: 'GSTIN active and legal name matches submission exactly.' },
              { requirement_id: 'REQ-PAN-001', requirement_title: 'PAN Card Verification', status: 'VERIFIED', extracted_value: 'PRIME5432M', rule_explanation: 'PAN matches registered business identity.' },
              { requirement_id: 'REQ-OEM-001', requirement_title: 'OEM Manufacturer Authorization', status: 'MISSING', extracted_value: 'Not Provided', rule_explanation: 'Mandatory OEM authorization letter missing from bidder uploads.' },
              { requirement_id: 'REQ-TECH-001', requirement_title: 'Technical ISO Certification', status: 'EXPIRED', extracted_value: 'Expired: 2025-11-30', rule_explanation: 'Submitted ISO 9001 certificate expired on 2025-11-30.' },
              { requirement_id: 'REQ-DEBAR-001', requirement_title: 'Non-Blacklisting & Debarment Declaration', status: 'FAILED', extracted_value: 'Prime Industrial Technologies', rule_explanation: 'Active match found in CPPP Debarment Watchlist. Debarred till May 2028.' }
            ],
            ai_findings: [
              { title: 'CRITICAL: Debarment Watchlist Match', severity: 'CRITICAL', description: "Entity matches blacklisted bidder 'Prime Industrial Technologies' debarred by Ministry of Heavy Industries.", confidence: 0.98, recommendation: 'PROCUREMENT OFFICER REVIEW REQUIRED. Immediate inspection of debarment order recommended.' },
              { title: 'Mandatory OEM Authorization Missing', severity: 'CRITICAL', description: 'Mandatory OEM Authorization missing from bidder uploads.', confidence: 1.0, recommendation: 'Request bidder upload OEM authorization.' },
              { title: 'ISO Certificate Expired', severity: 'MEDIUM', description: 'ISO 9001 Quality Certificate is expired.', confidence: 0.95, recommendation: 'Request renewed ISO certificate.' }
            ]
          }
        };

        setBidder(mockBidders[bidderId] || mockBidders['BIDDER-A']);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBidderData();
  }, [bidderId]);

  const handleFileUpload = (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const file = files[0];
    uploadDocument(bidderId, file)
      .then((newDoc) => {
        if (showToast) {
          showToast(
            'Document Uploaded Successfully',
            `Document '${file.name}' was uploaded and auto-classified as '${newDoc.classified_type}'.`,
            'success'
          );
        }
        loadBidderData();
      })
      .catch((err) => {
        console.warn("Upload API failed, simulating file ingestion in frontend:", err);
        setTimeout(() => {
          setUploading(false);
          const mockDoc = {
            id: `DOC-MOCK-${Date.now()}`,
            file_name: file.name,
            classified_type: file.name.toUpperCase().includes('GST') ? 'GST Certificate' :
                             file.name.toUpperCase().includes('OEM') ? 'OEM Authorization' :
                             file.name.toUpperCase().includes('ISO') ? 'Technical Certificate' : 'Bidder Document',
            classification_confidence: 0.94 + Math.random() * 0.05,
            status: 'VERIFIED',
            uploaded_at: new Date().toISOString()
          };
          
          setBidder(prev => ({
            ...prev,
            documents: [mockDoc, ...(prev.documents || [])]
          }));

          if (showToast) {
            showToast(
              'Document Ingestion Complete',
              `Simulated upload of '${file.name}' and classified it as '${mockDoc.classified_type}'.`,
              'success'
            );
          }
        }, 1000);
      });
  };

  const handleDigiLockerImport = (doc) => {
    setUploading(true);
    setShowDigiLocker(false);
    
    // Simulate a File object
    const file = new File([doc.content], doc.name, { type: 'application/pdf' });
    uploadDocument(bidderId, file)
      .then((newDoc) => {
        setUploading(false);
        if (showToast) {
          showToast(
            'DigiLocker Import Successful',
            `Document '${doc.name}' fetched from DigiLocker and verified via central registry (DPIIT/NSIC/EPFO).`,
            'success'
          );
        }
        loadBidderData();
      })
      .catch((err) => {
        setUploading(false);
        // Fallback for offline mock simulation
        setTimeout(() => {
          const mockDoc = {
            id: `DOC-MOCK-${Date.now()}`,
            file_name: doc.name,
            classified_type: doc.name.toUpperCase().includes('STARTUP') ? 'Startup India Certificate' :
                             doc.name.toUpperCase().includes('NSIC') ? 'NSIC Certificate' : 'NSIC Certificate',
            classification_confidence: 0.98,
            status: 'VERIFIED',
            uploaded_at: new Date().toISOString()
          };
          
          setBidder(prev => ({
            ...prev,
            documents: [mockDoc, ...(prev.documents || [])]
          }));

          if (showToast) {
            showToast(
              'DigiLocker Ingestion Complete',
              `Simulated upload of '${doc.name}' and classified it as '${mockDoc.classified_type}'.`,
              'success'
            );
          }
        }, 800);
      });
  };

  if (loading || !bidder) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-12 bg-slate-950 text-slate-450">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-slate-800 rounded-full animate-spin mb-4"></div>
        <div>Loading your bidder workspace profile...</div>
      </div>
    );
  }

  const results = bidder.compliance_results || [];
  const documentsList = bidder.documents || [];
  const findings = bidder.ai_findings || [];
  
  const passedCount = results.filter((r) => r.status === 'VERIFIED').length;
  const failedCount = results.filter((r) => r.status === 'FAILED' || r.status === 'EXPIRED' || r.status === 'MISSING').length;
  const totalRules = results.length;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      {/* Dynamic Sub-header / Topbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 text-slate-950 px-2 py-1.5 rounded font-black text-sm shadow-sm">
            GeM
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center">
              <span>Bidder / Vendor Workspace</span>
              <span className="ml-2 text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-slate-700 font-extrabold uppercase tracking-wide">
                Demo Mode
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Simulated Government Compliance Node</p>
          </div>
        </div>

        {/* Profile info & Sign Out */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">{user.name}</div>
            <div className="text-[10px] text-slate-400">{user.department}</div>
          </div>
          <div className="h-6 w-[1px] bg-slate-800"></div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-rose-450 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-blue-900/30 to-slate-900 border border-blue-950 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Active Bid Submission</div>
            <h2 className="text-lg font-bold text-white tracking-tight">{bidder.tender_id}</h2>
            <p className="text-xs text-slate-300 mt-1">
              Supply & Installation of High-Grade Industrial Safety Equipment • Ministry of Heavy Industries
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Compliance Status:</span>
            <StatusBadge status={bidder.overall_status} />
          </div>
        </div>

        {/* Core KPI Matrix Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Compliance Score</div>
            <div className="flex items-baseline mt-2">
              <span className="text-3xl font-black text-slate-100 font-mono">{bidder.compliance_score}</span>
              <span className="text-xs text-slate-500 ml-1">/ 100</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">Calculated from AI rules verification</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Profile Classification</div>
            <div className="mt-2">
              <StatusBadge status={bidder.risk_level} />
            </div>
            <div className="text-[10px] text-slate-500 mt-2">Evaluated watchlists matching</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Checks Passed</div>
            <div className="flex items-baseline mt-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">{passedCount}</span>
              <span className="text-xs text-slate-500 ml-1">/ {totalRules} verified</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full" 
                style={{ width: `${totalRules > 0 ? (passedCount / totalRules) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discrepancies / Warnings</div>
            <div className="flex items-baseline mt-2">
              <span className={`text-3xl font-black font-mono ${failedCount > 0 ? 'text-rose-555' : 'text-slate-300'}`}>
                {failedCount}
              </span>
              <span className="text-xs text-slate-500 ml-1">Issues Flagged</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">Required action prior to evaluation</div>
          </div>
        </div>

        {/* Two Column Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT: Bid Profile Details & AI Advisory (1 column) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Bidder Credentials Block */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                <Building2 className="w-4 h-4 mr-1.5 text-blue-500" /> Organization Profile
              </h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Legal Entity Name</div>
                  <div className="font-semibold text-slate-200">{bidder.company_name}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">GSTIN</div>
                    <code className="font-mono font-bold text-slate-300">{bidder.gstin || 'N/A'}</code>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">PAN</div>
                    <code className="font-mono font-bold text-slate-300">{bidder.pan || 'N/A'}</code>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Udyam Registration</div>
                    <code className="font-mono font-semibold text-slate-300">{bidder.udyam_id || 'Not Linked'}</code>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Local Content Declared</div>
                    <div className="font-bold text-blue-400">{bidder.local_content_pct}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Advisor Panel */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 relative overflow-hidden">
              {/* Background gradient flare */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-xl"></div>
              
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-500 animate-pulse" /> AI Compliance Advisor
              </h3>

              <div className="space-y-3">
                {findings.length === 0 ? (
                  <div className="p-3 bg-slate-950 rounded-lg text-xs text-slate-450 border border-slate-850">
                    <div className="flex items-center text-emerald-450 font-semibold mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Profile Check Clean
                    </div>
                    No compliance warnings detected for your submission. All credentials match the requirements.
                  </div>
                ) : (
                  findings.map((f, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex items-start justify-between">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          f.severity === 'CRITICAL' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' :
                          f.severity === 'MEDIUM' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' :
                          'bg-blue-950/40 text-blue-400 border border-blue-900/30'
                        }`}>
                          {f.severity} Alert
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">Conf: {(f.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-xs font-bold text-slate-200">{f.title}</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{f.description}</p>
                      {f.recommendation && (
                        <div className="text-[11px] bg-slate-900/50 p-2 rounded text-amber-405 border-l border-amber-500/30 mt-1">
                          <span className="font-semibold">Recommended Fix:</span> {f.recommendation}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Compliance matrix & Ingested documents (2 columns) */}
          <div className="lg:col-span-2 space-y-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {/* Inner navigation tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/50 px-4">
              <button
                onClick={() => setActiveTab('checklist')}
                className={`py-3.5 px-4 text-xs font-bold transition-all relative border-b-2 ${
                  activeTab === 'checklist'
                    ? 'border-blue-500 text-blue-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Verification Checklist ({results.length})
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-3.5 px-4 text-xs font-bold transition-all relative border-b-2 ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Submitted Documents ({documentsList.length})
              </button>
            </div>

            {/* Tab 1: Checklist */}
            {activeTab === 'checklist' && (
              <div className="p-5 space-y-4">
                <div className="text-xs text-slate-400 pb-2 flex items-center justify-between border-b border-slate-800/80">
                  <span>Requirement Rule Clause Check</span>
                  <span>Status Match</span>
                </div>
                
                <div className="divide-y divide-slate-800/60 space-y-3">
                  {results.map((rule, idx) => {
                    const status = rule.status;
                    const isPass = status === 'VERIFIED';
                    const isReview = status === 'REVIEW_REQUIRED' || status === 'EXPIRED';
                    const isFail = status === 'FAILED' || status === 'MISSING';
                    
                    return (
                      <div key={idx} className="pt-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3 first:pt-0">
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-200">{rule.requirement_title}</span>
                            <span className="text-[10px] text-slate-500 font-medium">({rule.requirement_id})</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{rule.rule_explanation || 'Evaluation completed via government lookup API.'}</p>
                          {rule.extracted_value && (
                            <div className="flex items-center space-x-2 text-[10px] mt-1.5">
                              <span className="text-slate-500">Extracted value:</span>
                              <code className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 text-slate-300">
                                {rule.extracted_value}
                              </code>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-start">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold tracking-wider border uppercase flex items-center space-x-1 ${
                            isPass ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                            isReview ? 'bg-amber-950/20 border-amber-500/20 text-amber-400' :
                            'bg-rose-950/20 border-rose-500/20 text-rose-400'
                          }`}>
                            {isPass && <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />}
                            {isReview && <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />}
                            {isFail && <AlertOctagon className="w-3 h-3 mr-1 shrink-0" />}
                            {status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Submitted Documents & Upload */}
            {activeTab === 'documents' && (
              <div className="p-5 space-y-6">
                {/* File Drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  className={`border-2 border-dashed p-6 text-center rounded-xl transition-all ${
                    dragOver ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3 max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-blue-500 flex items-center justify-center mx-auto border border-slate-800">
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-t-blue-500 border-r-transparent border-slate-800 rounded-full animate-spin"></div>
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Upload Supplementary Qualification Documents</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Submit new GST, OEM auth letters, local declarations, or ISO certificates.</p>
                    </div>
                    
                    <div className="flex gap-2 justify-center">
                      <label className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer transition-all">
                        <span>{uploading ? 'Processing Document...' : 'Browse Documents'}</span>
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e.target.files)}
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDigiLocker(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-655 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer transition-all"
                        style={{ background: '#4f46e5' }}
                      >
                        ⚡ Pull from DigiLocker
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submitted Files List */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ingested Qualification Evidences</h3>
                  
                  <div className="space-y-2">
                    {documentsList.length === 0 ? (
                      <div className="text-center py-6 text-slate-600 text-xs">No documents uploaded for this bidder record.</div>
                    ) : (
                      documentsList.map((doc) => (
                        <div key={doc.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 overflow-hidden mr-2">
                            <div className="p-2 bg-slate-900 border border-slate-850 text-slate-400 rounded-md shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-xs font-semibold text-slate-200 truncate">{doc.file_name}</div>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                                <span>{doc.classified_type || 'Unclassified Document'}</span>
                                {doc.classification_confidence > 0 && (
                                  <span>• Confidence: {(doc.classification_confidence * 100).toFixed(0)}%</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-900 text-emerald-450 border border-slate-800">
                              {doc.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* DigiLocker Modal */}
      {showDigiLocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-up">
            <div className="px-5 py-4 border-b border-slate-850 flex items-center justify-between" style={{ background: '#0b0f19', borderBottom: '1px solid #1e293b' }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-100">DigiLocker Central Registry Gate</h3>
              </div>
              <button
                onClick={() => setShowDigiLocker(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Choose pre-verified statutory credentials from your linked DigiLocker business account to pull directly into this bid.
              </p>
              
              <div className="space-y-2">
                {[
                  { name: 'DIPP_Startup_India_Certificate.pdf', type: 'Startup Recognition', content: 'STARTUP INDIA DIPP RECOGNITION: DIPP99281' },
                  { name: 'NSIC_GP_Registration_Certificate.pdf', type: 'NSIC Registration', content: 'NSIC GP REGISTRATION CERTIFICATE: NSIC/GP/MUM/2024/0091823' },
                  { name: 'EPFO_Challan_Receipt_AY_2026.pdf', type: 'EPFO Compliance', content: 'EPFO ESTABLISHMENT ID: MH/BAN/0012345/000 dues: NIL' }
                ].map(doc => (
                  <button
                    key={doc.name}
                    type="button"
                    onClick={() => handleDigiLockerImport(doc)}
                    className="w-full p-3 bg-slate-950/50 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/50 flex items-center gap-3 text-left transition-all group rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-900/50 flex items-center justify-center shrink-0 text-indigo-400 group-hover:scale-105 transition-all text-xs font-bold">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-200 truncate">{doc.name}</div>
                      <div className="text-[10px] text-indigo-455 font-semibold mt-0.5" style={{ color: '#818cf8' }}>{doc.type}</div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-400 transition-all shrink-0">
                      Pull ⚡
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/20 flex items-center justify-between" style={{ borderTop: '1px solid #1e293b' }}>
              <span className="text-[9px] text-slate-500 font-mono">Status: Connected to central gov registry</span>
              <button
                type="button"
                onClick={() => setShowDigiLocker(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[10px] font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
