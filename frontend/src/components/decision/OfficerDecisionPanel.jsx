import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, CheckCircle2, XCircle, HelpCircle, AlertTriangle, Save } from 'lucide-react';
import { submitOfficerDecision } from '../../services/api';

export default function OfficerDecisionPanel({ bidder, onDecisionSaved }) {
  const [decision, setDecision] = useState(bidder.officer_decision?.decision || 'QUALIFIED');
  const [remarks, setRemarks] = useState(
    bidder.officer_decision?.remarks ||
      'Verified all submitted compliance evidence. Qualification approved based on procurement regulations.'
  );
  const [overrideJustification, setOverrideJustification] = useState(
    bidder.officer_decision?.override_justification || ''
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const aiRecommendation = bidder.risk_level === 'LOW' ? 'QUALIFIED' : 'REVIEW_REQUIRED';
  const isOverriding = decision !== aiRecommendation;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!remarks.trim()) { alert('Mandatory Procurement Officer remarks are required.'); return; }
    if (isOverriding && !overrideJustification.trim()) {
      alert('Justification is mandatory when overriding the AI recommendation.');
      return;
    }
    setSaving(true);
    submitOfficerDecision(bidder.id, decision, remarks, overrideJustification)
      .then(() => {
        setSaving(false);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        if (onDecisionSaved) onDecisionSaved();
      })
      .catch(err => { setSaving(false); alert(err.message); });
  };

  const DECISIONS = [
    { id: 'QUALIFIED',            label: 'QUALIFIED',             sub: 'Approve bid for commercial evaluation', Icon: CheckCircle2, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
    { id: 'REQUEST_CLARIFICATION',label: 'REQUEST CLARIFICATION', sub: 'Issue clarification notice to bidder',  Icon: HelpCircle,   color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
    { id: 'DISQUALIFIED',         label: 'DISQUALIFIED',          sub: 'Reject bid due to non-compliance',      Icon: XCircle,      color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  ];

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1.5px solid #e5e7eb' }}>
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#111827' }}>
            <UserCheck className="w-4 h-4 text-blue-600" />
            Procurement Officer Final Qualification Decision
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
            Human-in-the-loop governance: The Procurement Officer makes the final legally binding qualification action.
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <span className="text-[10px] font-bold uppercase block" style={{ color: '#9ca3af' }}>AI Recommendation</span>
          <span className="text-xs font-bold" style={{ color: aiRecommendation === 'QUALIFIED' ? '#15803d' : '#92400e' }}>
            {aiRecommendation === 'QUALIFIED' ? '✓ RECOMMEND QUALIFIED' : '⚠ RECOMMEND REVIEW'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Decision Cards */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#374151' }}>
            Select Officer Decision
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DECISIONS.map(d => {
              const active = decision === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDecision(d.id)}
                  className="p-3.5 rounded-xl text-left transition-all"
                  style={{
                    background: active ? d.bg : '#f7f8fa',
                    border: `1.5px solid ${active ? d.border : '#e5e7eb'}`,
                    boxShadow: active ? `0 0 0 2px ${d.border}` : 'none',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <d.Icon className="w-4 h-4" style={{ color: active ? d.color : '#9ca3af' }} />
                    <span className="text-xs font-bold" style={{ color: active ? d.color : '#374151' }}>{d.label}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: '#9ca3af' }}>{d.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Override warning */}
        {isOverriding && (
          <div className="p-3 rounded-xl" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: '#92400e' }}>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold">AI Recommendation Override Warning</span>
            </div>
            <p className="text-[11px] leading-relaxed mb-2" style={{ color: '#78350f' }}>
              You selected <strong>{decision}</strong>, which differs from the AI recommendation (<strong>{aiRecommendation}</strong>).
              Please enter justification below for the audit log.
            </p>
            <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: '#92400e' }}>
              Override Justification (Mandatory)
            </label>
            <textarea
              required
              rows={2}
              value={overrideJustification}
              onChange={e => setOverrideJustification(e.target.value)}
              placeholder="Explain legal or regulatory grounds for overriding AI recommendation..."
              className="form-input w-full p-2 text-xs"
              style={{ background: '#fffbeb', borderColor: '#fde68a' }}
            />
          </div>
        )}

        {/* Remarks */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#374151' }}>
            Officer Qualification Remarks (Mandatory)
          </label>
          <textarea
            required
            rows={3}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Record official procurement remarks and notes..."
            className="form-input w-full p-3 text-xs"
          />
        </div>

        {/* Action */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs font-bold text-green-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Decision saved to immutable audit trail!
            </span>
          ) : (
            <span className="text-[11px]" style={{ color: '#9ca3af' }}>
              Recorded under: procurement.officer@demo.gov.in
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Decision...' : 'Save & Record Final Decision'}
          </button>
        </div>
      </form>
    </div>
  );
}
