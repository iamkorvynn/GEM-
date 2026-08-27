import React, { useState } from 'react';
import { UserCheck, CheckCircle2, XCircle, HelpCircle, AlertTriangle, ShieldCheck, Save } from 'lucide-react';
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
    if (!remarks.trim()) {
      alert('Mandatory Procurement Officer remarks are required.');
      return;
    }
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
      .catch((err) => {
        setSaving(false);
        alert(err.message);
      });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <UserCheck className="w-4 h-4 mr-2 text-blue-600" /> Procurement Officer Final Qualification Decision
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Human-in-the-loop governance: The Procurement Officer makes the final legally binding qualification action.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-bold uppercase">AI System Recommendation</span>
          <span className={`text-xs font-bold ${aiRecommendation === 'QUALIFIED' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {aiRecommendation === 'QUALIFIED' ? 'RECOMMEND QUALIFICATION' : 'RECOMMEND MANUAL REVIEW'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Decision Action Radio Cards */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Select Officer Decision Action
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setDecision('QUALIFIED')}
              className={`p-3.5 rounded-lg border text-left font-semibold transition-all flex items-center space-x-2 ${
                decision === 'QUALIFIED'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${decision === 'QUALIFIED' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <div>QUALIFIED</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">Approve bid for commercial evaluation</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDecision('REQUEST_CLARIFICATION')}
              className={`p-3.5 rounded-lg border text-left font-semibold transition-all flex items-center space-x-2 ${
                decision === 'REQUEST_CLARIFICATION'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className={`w-4 h-4 ${decision === 'REQUEST_CLARIFICATION' ? 'text-amber-600' : 'text-slate-400'}`} />
              <div>
                <div>REQUEST CLARIFICATION</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">Issue clarification notice to bidder</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDecision('DISQUALIFIED')}
              className={`p-3.5 rounded-lg border text-left font-semibold transition-all flex items-center space-x-2 ${
                decision === 'DISQUALIFIED'
                  ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <XCircle className={`w-4 h-4 ${decision === 'DISQUALIFIED' ? 'text-rose-600' : 'text-slate-400'}`} />
              <div>
                <div>DISQUALIFIED</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">Reject bid due to non-compliance</div>
              </div>
            </button>
          </div>
        </div>

        {/* AI Override Notice */}
        {isOverriding && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-800 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>AI Recommendation Override Warning</span>
            </div>
            <p className="text-amber-900 leading-relaxed text-[11px]">
              You have selected <strong>{decision}</strong>, which differs from the AI System recommendation (<strong>{aiRecommendation}</strong>). Please enter a justification below for the audit log.
            </p>
            <div>
              <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">
                Override Justification (Mandatory)
              </label>
              <textarea
                required
                rows={2}
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
                placeholder="Explain legal or regulatory grounds for overriding AI recommendation..."
                className="w-full p-2 bg-white border border-amber-300 rounded text-xs focus:ring-2 focus:ring-amber-500"
              ></textarea>
            </div>
          </div>
        )}

        {/* Mandatory Remarks Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Officer Qualification Remarks (Mandatory)
          </label>
          <textarea
            required
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Record official procurement remarks and notes..."
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Decision saved to immutable audit trail!
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Recorded under officer account: procurement.officer@demo.gov.in</span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Decision...' : 'Save & Record Final Decision'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
