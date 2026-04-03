import React, { useState, useEffect } from 'react';
import { generateProof, verifyProof } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const SERVICES = [
  { id: 'banking', icon: '🏦', label: 'Banking', desc: 'Open a bank account' },
  { id: 'healthcare', icon: '🏥', label: 'Healthcare', desc: 'Access medical services' },
  { id: 'government', icon: '🏛️', label: 'Government DBT', desc: 'Direct benefit transfer' },
];

const EXAMPLE_CONDITIONS = ['age > 18', 'age >= 21', 'age < 60', 'age >= 65'];

function Confetti() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'][i % 5],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2 + Math.random() * 2}s`,
    size: `${6 + Math.random() * 8}px`,
  }));

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </>
  );
}

export default function VerifyPage({ userId, onReset, addToast, onStepChange }) {
  const [condition, setCondition] = useState('age > 18');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [proof, setProof] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (verifyResult?.status === 'ACCESS_GRANTED') {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [verifyResult]);

  const handleGenerateProof = async () => {
    if (!condition.trim()) {
      addToast('Please enter a condition.', 'error');
      return;
    }
    setLoading(true);
    setLoadingMsg('Computing zero-knowledge proof... 🔐');
    setProof(null);
    setVerifyResult(null);
    setSelectedService(null);
    try {
      const res = await generateProof(userId, condition);
      setProof(res.data);
      addToast('ZK Proof generated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to generate proof.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!proof?.proof_id) {
      addToast('No proof to verify. Generate a proof first.', 'error');
      return;
    }
    if (!selectedService) {
      addToast('Please select a service provider.', 'error');
      return;
    }
    setLoading(true);
    setLoadingMsg('Verifying proof with service provider...');
    try {
      const res = await verifyProof(proof.proof_id);
      setVerifyResult(res.data);
      if (onStepChange) onStepChange(5);
    } catch (err) {
      addToast(err.message || 'Verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceObj = SERVICES.find((s) => s.id === selectedService);

  return (
    <>
      {loading && <LoadingSpinner message={loadingMsg} />}
      {showConfetti && <Confetti />}

      <div className="min-h-screen bg-grid px-4 py-12">
        <div className="max-w-xl mx-auto">

          {/* Final result — ACCESS GRANTED/DENIED */}
          {verifyResult ? (
            <div className="animate-bounce-in">
              {verifyResult.status === 'ACCESS_GRANTED' ? (
                <div className="card p-8 text-center glow-green border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                  <div className="text-6xl mb-4 animate-bounce">✅</div>
                  <h2 className="text-3xl font-black text-emerald-700 mb-2">ACCESS GRANTED</h2>
                  <p className="text-emerald-600 text-base mb-6 leading-relaxed">
                    "Your identity condition has been verified. Welcome aboard."
                  </p>

                  <div className="bg-white rounded-xl p-4 mb-6 space-y-3 text-left border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Service</span>
                      <span className="font-semibold text-slate-800">
                        {selectedServiceObj?.icon} {selectedServiceObj?.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Condition</span>
                      <span className="font-mono font-semibold text-slate-800">{verifyResult.statement} ✓</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Privacy</span>
                      <span className="text-emerald-600 font-semibold text-sm">🔒 Zero data exposed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Proof ID</span>
                      <span className="font-mono text-xs text-slate-500">{proof?.proof_id?.slice(0, 12)}...</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      id="start-over-btn"
                      onClick={onReset}
                      className="btn-ghost flex-1"
                    >
                      Start Over
                    </button>
                    <button
                      id="try-another-btn"
                      onClick={() => setVerifyResult(null)}
                      className="btn-success flex-1"
                    >
                      Try Another Proof
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card p-8 text-center glow-red border-red-200 bg-gradient-to-br from-red-50 to-white">
                  <div className="text-6xl mb-4">❌</div>
                  <h2 className="text-3xl font-black text-red-600 mb-2">ACCESS DENIED</h2>
                  <p className="text-red-500 mb-4">"Condition not met. Access denied."</p>
                  <p className="text-xs text-slate-500 mb-6">
                    Statement: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{verifyResult.statement}</code>
                  </p>
                  <button
                    id="try-different-btn"
                    onClick={() => { setVerifyResult(null); setProof(null); }}
                    className="btn-primary w-full"
                  >
                    Try Different Condition
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Phase A: Generate Proof */}
              <div className="animate-fade-in">
                <div className="mb-8">
                  <div className="flex items-center gap-2 text-violet-600 text-sm font-semibold mb-2">
                    <span>🧮</span> Zero-Knowledge Proof Engine
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Prove Without Revealing</h1>
                  <p className="text-slate-500 mt-1">Prove your eligibility without sharing any personal data.</p>
                </div>

                {/* ZKP explainer box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <span className="text-blue-500 text-lg mt-0.5">💡</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-800 mb-1">How Zero-Knowledge Proofs Work</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      In a real ZKP system, cryptographic circuits evaluate your data locally.
                      The verifier only receives <strong>TRUE or FALSE</strong> — never your actual value.
                      Your age is checked server-side and <strong>never transmitted</strong> to any service.
                    </p>
                  </div>
                </div>

                <div className="card p-6 mb-4">
                  {/* Condition input */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Enter Eligibility Condition
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        placeholder="e.g. age > 18"
                        className="input-field pr-24"
                        id="condition-input"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateProof()}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                        {condition.trim() || '—'}
                      </span>
                    </div>
                    {/* Example conditions */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {EXAMPLE_CONDITIONS.map((ex) => (
                        <button
                          key={ex}
                          onClick={() => setCondition(ex)}
                          className={`text-xs px-2 py-1 rounded-lg border transition-all duration-150 font-mono
                            ${condition === ex
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'}`}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    id="generate-proof-btn"
                    onClick={handleGenerateProof}
                    className="btn-primary w-full"
                  >
                    <span>🔏</span>
                    <span>Generate Proof</span>
                  </button>
                </div>

                {/* Proof result */}
                {proof && (
                  <div className="card p-6 mb-4 border-violet-200 bg-gradient-to-br from-violet-50 to-white animate-bounce-in">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">✅</span>
                      <span className="font-bold text-slate-900 text-lg">Proof Generated</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: 'Statement', value: proof.statement, mono: true },
                        {
                          label: 'Result',
                          value: proof.result ? (
                            <span className="text-emerald-600 font-bold">✅ TRUE</span>
                          ) : (
                            <span className="text-red-600 font-bold">❌ FALSE</span>
                          ),
                        },
                        {
                          label: 'Data Revealed',
                          value: <span className="text-slate-500">❌ NONE</span>,
                        },
                        { label: 'Proof ID', value: proof.proof_id?.slice(0, 16) + '...', mono: true, small: true },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{row.label}</span>
                          {row.value?.type ? (
                            row.value
                          ) : (
                            <span className={`${row.mono ? 'font-mono' : 'font-semibold'} ${row.small ? 'text-xs text-slate-600' : 'text-slate-800'}`}>
                              {row.value}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                      <span>🔒</span>
                      <span>No personal data was shared. Your actual age was never transmitted.</span>
                    </div>
                  </div>
                )}

                {/* Phase B: Service Verification */}
                {proof && (
                  <div className="card p-6 animate-fade-in">
                    <h3 className="font-bold text-slate-900 mb-1">Submit to Service Provider</h3>
                    <p className="text-xs text-slate-500 mb-4">Select the service you want to access with your verified identity.</p>

                    {/* Service selector */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {SERVICES.map((svc) => (
                        <button
                          key={svc.id}
                          id={`service-${svc.id}-btn`}
                          onClick={() => setSelectedService(svc.id)}
                          className={`
                            flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-center
                            ${selectedService === svc.id
                              ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                            }
                          `}
                        >
                          <span className="text-2xl">{svc.icon}</span>
                          <span className="text-xs font-semibold text-slate-700">{svc.label}</span>
                          <span className="text-xs text-slate-500 leading-tight">{svc.desc}</span>
                        </button>
                      ))}
                    </div>

                    <button
                      id="verify-with-service-btn"
                      onClick={handleVerify}
                      disabled={!selectedService}
                      className="btn-success w-full"
                    >
                      <span>🔍</span>
                      <span>Verify with {selectedServiceObj ? selectedServiceObj.label : 'Selected Service'}</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
