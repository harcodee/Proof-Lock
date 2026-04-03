import React, { useState } from 'react';
import { generateCredential } from '../api/client';
import FraudBadge from '../components/FraudBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage({ userId, userData, onCredentialIssued, addToast }) {
  const [loading, setLoading] = useState(false);
  const [issued, setIssued] = useState(false);

  const initials = userData?.name
    ? userData.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const maskedId = userData?.id_number_masked || '****';

  const handleIssue = async () => {
    setLoading(true);
    try {
      const res = await generateCredential(userId);
      setIssued(true);
      addToast('✓ Credential Issued Successfully!', 'success');
      onCredentialIssued(res.data);
    } catch (err) {
      addToast(err.message || 'Failed to generate credential.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <LoadingSpinner message="Issuing verifiable credential... 🔐" />}

      <div className="min-h-screen bg-grid px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Page header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Identity Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your verified identity and credentials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile card */}
            <div className="card p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {initials}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{userData?.name}</h2>
                  <p className="text-sm text-slate-500">Verified Identity Holder</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">User ID</span>
                  <span className="text-slate-800 font-mono font-semibold">#{userId}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ID Number</span>
                  <span className="text-slate-800 font-mono">{maskedId}</span>
                </div>
                <div className="flex justify-between items-start py-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-0.5">Risk Score</span>
                  <FraudBadge score={userData?.fraud_score} showDescription />
                </div>
              </div>

              {/* Verification status */}
              <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
                <span className="text-emerald-600 text-lg">✅</span>
                <div>
                  <p className="text-xs font-semibold text-emerald-700">Identity Verified</p>
                  <p className="text-xs text-emerald-600">AI fraud analysis complete</p>
                </div>
              </div>
            </div>

            {/* Action card */}
            <div className="card p-6 flex flex-col animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-lg">💼</div>
                <div>
                  <h3 className="font-bold text-slate-900">Digital Identity Wallet</h3>
                  <p className="text-xs text-slate-500">Issue reusable credentials</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
                Your identity has been verified by our AI system. Issue a <strong>Verifiable Credential</strong> — a cryptographically signed token that proves your identity to any service provider without exposing your raw data.
              </p>

              {/* How it works mini-steps */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
                {[
                  { icon: '1️⃣', text: 'Credential signed with SHA-256' },
                  { icon: '2️⃣', text: 'Stored securely on our servers' },
                  { icon: '3️⃣', text: 'Used to generate ZK proofs' },
                ].map((item) => (
                  <div key={item.icon} className="flex items-center gap-2 text-xs text-slate-600">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {!issued ? (
                <button
                  id="generate-credential-btn"
                  onClick={handleIssue}
                  className="btn-primary w-full"
                >
                  <span>🔐</span>
                  <span>Generate Verifiable Credential</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold justify-center py-2">
                    <span>✅</span> Credential issued successfully
                  </div>
                  <button
                    id="view-credential-btn"
                    onClick={() => onCredentialIssued(null, true)}
                    className="btn-success w-full"
                  >
                    <span>🔍</span>
                    <span>View Credential →</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Privacy notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <span className="text-blue-600 text-lg mt-0.5">ℹ️</span>
            <div>
              <p className="text-sm font-semibold text-blue-800">Privacy Guarantee</p>
              <p className="text-xs text-blue-600 mt-0.5">
                When you share your identity with services, only a <strong>zero-knowledge proof</strong> is transmitted — never your actual name, age, or ID number.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
