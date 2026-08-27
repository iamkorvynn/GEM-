import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, XCircle,
  FileText, Play, Eye, Sparkles, UserCheck, Layers, Landmark,
  PieChart as PieIcon, RefreshCw, FileSpreadsheet, AlertOctagon
} from 'lucide-react';
import { fetchBidderDetails, runFullVerification } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import DocumentViewerModal from '../components/evidence/DocumentViewerModal';
import GovVerificationView from '../components/verification/GovVerificationView';
import OfficerDecisionPanel from '../components/decision/OfficerDecisionPanel';

export default function BidderComplianceDashboard({ bidderId, onNavigateToReport, onRunVerificationTrigger, showToast }) {
  const [bidder, setBidder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('matrix');
  const [selectedDocForViewer, setSelectedDocForViewer] = useState(null);

  useEffect(() => {
    if (!bidderId) return;
    setLoading(true);
    fetchBidderDetails(bidderId)
      .then((data) => {
        setBidder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [bidderId]);

  const handleRunFullVerification = () => {
    if (onRunVerificationTrigger) onRunVerificationTrigger();
    setVerifying(true);
    runFullVerification(bidder.id)
      .then((updated) => {
        setBidder(updated);
        setVerifying(false);
      })
      .catch((err) => {
        setVerifying(false);
      });
  };

  if (loading || !bidder) {
    return <div className="p-8 text-center text-slate-500">Loading Bidder Compliance Dashboard...</div>;
  }

  const results = bidder.compliance_results || [];
  const verifiedCount = results.filter((r) => r.status === 'VERIFIED').length;
  const failedCount = results.filter((r) => r.status === 'FAILED').length;
  const missingCount = results.filter((r) => r.status === 'MISSING').length;
  const reviewCount = results.filter((r) => r.status === 'REVIEW_REQUIRED' || r.status === 'EXPIRED').length;
  const naCount = results.filter((r) => r.status === 'NOT_APPLICABLE').length;

  return (
    <div className="p-6 space-y-6">
      {/* 1. Header Compliance Summary Card */}
      <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 glow-blue">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
              <span className="font-mono font-bold text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded border border-blue-800">{bidder.tender_id}</span>
              <span>•</span>
              <span>Bidder Reference: {bidder.id}</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">{bidder.company_name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
              <span>GSTIN: <code className="font-mono font-semibold text-slate-200">{bidder.gstin || 'N/A'}</code></span>
              <span>•</span>
              <span>PAN: <code className="font-mono font-semibold text-slate-200">{bidder.pan || 'N/A'}</code></span>
              <span>•</span>
              <span>MSME Status: {bidder.claims_msme ? <span className="font-bold text-emerald-400">MSME Claimed ({bidder.udyam_id})</span> : 'General Bidder'}</span>
              <span>•</span>
              <span>Local Content: <span className="font-bold text-blue-400">{bidder.local_content_pct}%</span></span>
            </div>
          </div>

          <div className="flex items-center space-x-4 shrink-0 bg-slate-950 p-4 rounded-xl border border-slate-800">
            {/* Score Gauge */}
            <div className="text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance Score</div>
              <div className="text-3xl font-black text-white font-mono mt-0.5">
                {bidder.compliance_score} <span className="text-sm font-normal text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="h-8 w-[1px] bg-slate-800"></div>

            {/* Risk Badge */}
            <div className="text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Level</div>
              <StatusBadge status={bidder.risk_level} />
            </div>

            <div className="h-8 w-[1px] bg-slate-800"></div>

            {/* Action Trigger */}
            <button
              onClick={handleRunFullVerification}
              disabled={verifying}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg transition-all flex items-center space-x-2 glow-blue"
            >
              <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
              <span>{verifying ? 'Running Verification...' : 'Run Full Verification'}</span>
            </button>
          </div>
        </div>

        {/* 2. Requirement Summary Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
            <span className="font-semibold text-emerald-300">Verified</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{verifiedCount}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-center justify-between">
            <span className="font-semibold text-amber-300">Review Required</span>
            <span className="text-base font-bold text-amber-400 font-mono">{reviewCount}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-center justify-between">
            <span className="font-semibold text-rose-300">Failed Verification</span>
            <span className="text-base font-bold text-rose-400 font-mono">{failedCount}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/60 flex items-center justify-between">
            <span className="font-semibold text-purple-300">Missing Evidence</span>
            <span className="text-base font-bold text-purple-400 font-mono">{missingCount}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="font-semibold text-slate-400">Not Applicable</span>
            <span className="text-base font-bold text-slate-300 font-mono">{naCount}</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 rounded-xl shadow-lg">
        <div className="flex space-x-1">
          {[
            { id: 'matrix', label: 'Compliance Matrix', icon: Layers, badge: results.length },
            { id: 'ai-findings', label: 'AI Verification Findings', icon: Sparkles, badge: bidder.ai_findings?.length },
            { id: 'govt-sources', label: 'Mock Govt Sources', icon: Landmark, badge: '7 Adapters' },
            { id: 'risk-analysis', label: 'Risk Analysis & Score', icon: PieIcon },
            { id: 'decision', label: 'Officer Decision', icon: UserCheck, badge: bidder.officer_decision?.decision },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
                  active
                    ? 'border-blue-500 text-blue-400 bg-blue-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    active ? 'bg-blue-900 text-blue-200 border border-blue-700' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onNavigateToReport(bidder.id)}
          className="text-xs font-semibold text-slate-300 hover:text-blue-400 flex items-center space-x-1"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Generate Official Compliance Report</span>
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* Tab 1: Compliance Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md overflow-hidden text-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                  <th className="p-3.5">Requirement</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Extracted Value</th>
                  <th className="p-3.5">Verified Govt Value</th>
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5">Rule Explanation</th>
                  <th className="p-3.5 text-right">Evidence Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-850 transition-colors">
                    <td className="p-3.5 font-semibold text-white">
                      <div>{r.requirement_title}</div>
                      <div className="text-[10px] font-mono text-slate-500">{r.requirement_id}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-3.5 font-mono text-slate-200 max-w-xs truncate font-medium">
                      {r.extracted_value || <span className="text-slate-500 italic">Not Provided</span>}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300 max-w-xs truncate">
                      {r.verified_value || 'Verified'}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-950 text-slate-300 font-mono text-[10px] rounded border border-slate-800 font-bold">
                        {r.verification_source}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px] max-w-sm leading-relaxed">
                      {r.rule_explanation}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      {r.evidence_doc_id ? (
                        <button
                          onClick={() => {
                            const docObj = bidder.documents.find((d) => d.id === r.evidence_doc_id) || {
                              file_name: r.evidence_file_name || 'Evidence_Document.pdf',
                              classified_type: r.requirement_title,
                              classification_confidence: 0.98,
                              entities: [{ entity_key: 'value', entity_value: r.extracted_value, confidence: 0.98, page_number: 1 }]
                            };
                            setSelectedDocForViewer(docObj);
                          }}
                          className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 font-semibold text-[11px] rounded border border-blue-800 transition-all inline-flex items-center"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Evidence
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">No File</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: AI Verification Findings */}
      {activeTab === 'ai-findings' && (
        <div className="space-y-4">
          {bidder.ai_findings && bidder.ai_findings.length > 0 ? (
            bidder.ai_findings.map((f, idx) => {
              const isCritical = f.severity === 'CRITICAL';
              const isMedium = f.severity === 'MEDIUM';

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-xl border shadow-md space-y-3 ${
                    isCritical
                      ? 'bg-rose-950/30 border-rose-800/80 glow-rose'
                      : isMedium
                      ? 'bg-amber-950/30 border-amber-800/80 glow-amber'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-rose-500 animate-pulse' : isMedium ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                      <h3 className="font-bold text-sm text-white">{f.title}</h3>
                    </div>
                    <StatusBadge status={f.severity} />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{f.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Extracted Document Value</span>
                      <span className="font-mono font-semibold text-slate-100">{f.document_value || 'N/A'}</span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Mock Govt Verified Record</span>
                      <span className="font-mono font-semibold text-slate-100">{f.verified_value || 'VERIFIED'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <div className="text-[11px] text-slate-300">
                      <span className="font-bold text-blue-400">AI Recommendation:</span> {f.recommendation}
                    </div>

                    {f.evidence_doc_id && (
                      <button
                        onClick={() => {
                          const docObj = bidder.documents.find((d) => d.id === f.evidence_doc_id) || {
                            file_name: f.evidence_file_name || 'Document.pdf',
                            classified_type: f.title,
                            classification_confidence: 0.98,
                            entities: [{ entity_key: 'value', entity_value: f.document_value, confidence: 0.98, page_number: 1 }]
                          };
                          setSelectedDocForViewer(docObj);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px] rounded border border-slate-700 transition-all inline-flex items-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Inspect Evidence
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
              No AI findings generated yet. Run verification pipeline to analyze evidence.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Mock Govt Sources Adapter Inspector */}
      {activeTab === 'govt-sources' && (
        <GovVerificationView records={bidder.verification_records} />
      )}

      {/* Tab 4: Risk Analysis & Score Breakdown */}
      {activeTab === 'risk-analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Itemized Compliance Score Breakdown</h2>
            
            {bidder.risk_assessment ? (
              <div className="space-y-3 text-xs">
                {Object.entries(bidder.risk_assessment.score_breakdown || {}).map(([key, val], idx) => {
                  const pct = (val.earned / val.max) * 100;
                  return (
                    <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex justify-between font-semibold text-slate-200">
                        <span>{key}</span>
                        <span className="font-mono">{val.earned} / {val.max} pts</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-2 rounded-full ${pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-500">Run verification pipeline to calculate score breakdown.</div>
            )}
          </div>

          <div className="lg:col-span-5 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Risk Evaluation Rationale</h2>
            {bidder.risk_assessment ? (
              <div className="space-y-2 text-xs">
                {bidder.risk_assessment.reasons.map((r, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">No risk assessment generated yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Procurement Officer Final Decision */}
      {activeTab === 'decision' && (
        <OfficerDecisionPanel
          bidder={bidder}
          onDecisionSaved={() => {
            fetchBidderDetails(bidderId).then(setBidder);
            if (showToast) showToast('Decision Saved', 'Procurement officer decision recorded in audit log', 'success');
          }}
        />
      )}

      {/* Side-by-Side Evidence Viewer Modal */}
      {selectedDocForViewer && (
        <DocumentViewerModal document={selectedDocForViewer} onClose={() => setSelectedDocForViewer(null)} />
      )}
    </div>
  );
}
