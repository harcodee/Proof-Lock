import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSelectiveProof, verifyProof } from '../api/client';
import { useStore } from '../store';
import ProofBadge from '../components/ProofBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Shield, LayoutGrid, ScanEye, ArrowLeft, ArrowRight, Share2, Ban, LockKeyhole } from 'lucide-react';

const SERVICES = [
  { id: 'banking', icon: '🏦', label: 'Fintegrity Bank', desc: 'Req: Identity, Age > 18' },
  { id: 'healthcare', icon: '🏥', label: 'OmniHealth Portal', desc: 'Req: Full Identity' },
  { id: 'government', icon: '🏛️', label: 'Gov DB Transfer', desc: 'Req: Verified Status' },
];

// Base claims format mapping for UI
const AVAILABLE_CLAIMS = [
  { key: 'identity_verified', value: true, type: 'boolean' },
  { key: 'face_verified', value: true, type: 'boolean' },
  { key: 'doc_valid', value: true, type: 'boolean' },
  { key: 'age_over_18', value: true, type: 'boolean' },
  { key: 'age_over_21', value: true, type: 'boolean' },
];

export default function VerifyPage() {
  const { userId, credential, addToast, setCurrentStep, reset } = useStore();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  const [selectedClaims, setSelectedClaims] = useState(['identity_verified', 'age_over_18']);
  const [activeProof, setActiveProof] = useState(null);
  
  const [selectedService, setSelectedService] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  const toggleClaim = (key) => {
    setSelectedClaims(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleGenerateProof = async () => {
    if (selectedClaims.length === 0) {
      addToast('Select at least one claim to disclose', 'error');
      return;
    }

    setLoading(true);
    setLoadingMsg('Generating Zero-Knowledge Payload...');
    
    try {
      const res = await generateSelectiveProof(userId, selectedClaims, false, 1);
      setActiveProof(res.data);
      addToast('ZK Payload Signed & Ready', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to generate proof.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!activeProof) return;
    if (!selectedService) {
      addToast('Select a target service provider.', 'error');
      return;
    }

    setLoading(true);
    setLoadingMsg('Transmitting Proof Context...');
    
    try {
      const res = await verifyProof(activeProof.proof_id);
      setVerifyResult(res.data);
      if (res.data.status === 'ACCESS_GRANTED') {
         // Optionally confetti could be added here
      }
    } catch (err) {
      addToast(err.message || 'Verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setActiveProof(null);
    setVerifyResult(null);
    setSelectedService(null);
  };

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingSpinner message={loadingMsg} />}
      </AnimatePresence>

      <div className="min-h-[calc(100vh-80px)] p-4 sm:p-8 flex justify-center pb-20">
        <div className="w-full max-w-4xl">
          
          <div className="mb-8 max-w-2xl">
            <h1 className="font-serif text-[36px] md:text-[48px] font-medium leading-[1.1] tracking-[-0.3px] text-[#E6EAF2] flex items-center gap-3">
              <ScanEye className="w-8 h-8 text-blue-400" /> Selective Disclosure
            </h1>
            <p className="text-zinc-500 mt-2 text-sm">
              Construct a cryptographic proof targeting specific claims. Providers will verify the signature without seeing your underlying raw data.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {verifyResult ? (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center">
                <div className={`glass-card p-8 w-full max-w-lg text-center relative overflow-hidden transition-colors duration-500
                  ${verifyResult.status === 'ACCESS_GRANTED' ? 'border-emerald-500/30' : 'border-rose-500/30'}
                `}>
                  {verifyResult.status === 'ACCESS_GRANTED' ? (
                    <>
                      <div className="absolute inset-0 bg-emerald-500/10 blur-2xl -z-10" />
                      <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                         <Shield className="w-10 h-10" />
                      </div>
                      <h2 className="text-3xl font-black text-emerald-400 mb-2 tracking-tight">ACCESS GRANTED</h2>
                      <p className="text-emerald-500/80 mb-8 font-mono text-sm">Cryptographic verification successful.</p>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-rose-500/10 blur-2xl -z-10" />
                      <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                         <Ban className="w-10 h-10" />
                      </div>
                      <h2 className="text-3xl font-black text-rose-400 mb-2 tracking-tight">ACCESS DENIED</h2>
                      <p className="text-rose-500/80 mb-8 font-mono text-sm">Proof requirements not satisfied.</p>
                    </>
                  )}

                  <div className="bg-black/50 border border-white/5 rounded-xl p-4 text-left font-mono text-xs space-y-3 mb-8 text-zinc-300">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                       <span className="text-zinc-500">Service</span>
                       <span>{SERVICES.find(s=>s.id===selectedService)?.label}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                       <span className="text-zinc-500">Provided DID</span>
                       <span className="text-blue-400">{credential?.did?.substring(0,18)}...</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                       <span className="text-zinc-500">Data Transmitted</span>
                       <span className="text-emerald-400">Zero Raw PII</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-zinc-500">Proof Hash</span>
                       <span className="text-zinc-500">{verifyResult.proof_id?.substring(0,16)}...</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                     <button onClick={reset} className="btn-ghost flex-1">END SESSION</button>
                     <button onClick={resetFlow} className="btn-primary flex-1">NEW PROOF</button>
                  </div>
                </div>
              </motion.div>
            ) : !activeProof ? (
              <motion.div key="builder" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Claims Selector */}
                <div className="glass-card p-6 flex flex-col h-full">
                  <h2 className="font-serif text-[20px] md:text-[24px] font-medium text-[#E6EAF2] mb-4 flex items-center gap-2">
                     <LayoutGrid className="w-5 h-5 text-blue-400" /> Available Claims
                  </h2>
                  <div className="space-y-3 flex-1">
                    {AVAILABLE_CLAIMS.map((claim) => (
                      <ProofBadge 
                        key={claim.key}
                        claimKey={claim.key}
                        claimData={claim}
                        isSelected={selectedClaims.includes(claim.key)}
                        onToggle={toggleClaim}
                      />
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                <div className="glass-card p-6 bg-zinc-900/50 flex flex-col h-full border-blue-500/20">
                  <h2 className="font-serif text-[20px] md:text-[24px] font-medium text-[#E6EAF2] mb-4 flex items-center gap-2">
                     <LockKeyhole className="w-5 h-5 text-blue-400" /> Verifier's View
                  </h2>
                  
                  <div className="flex-1 bg-black/60 rounded-xl border border-white/5 p-5 font-mono text-xs overflow-auto shadow-[inset_0_0_20px_rgba(37,99,235,0.05)] text-zinc-400">
                     <div className="animate-pulse-slow text-blue-400/50 mb-4 text-[11px] uppercase tracking-[1.5px] border-b border-blue-500/20 pb-2">
                       Simulated Verifier Payload
                     </div>
                     <pre>
                       <span className="text-pink-400">{`{`}</span>{`\n`}
                       <span className="text-blue-300">  "did"</span>: <span className="text-emerald-300">"{credential?.did || 'did:ivp:...'}"</span>,{`\n`}
                       <span className="text-blue-300">  "disclosed_claims"</span>: <span className="text-pink-400">{`{`}</span>{`\n`}
                       {selectedClaims.map((claim, idx) => (
                         <React.Fragment key={claim}>
                           <span className="text-blue-300">    "{claim}"</span>: <span className="text-emerald-300">true</span>{idx < selectedClaims.length - 1 ? ',' : ''}{`\n`}
                         </React.Fragment>
                       ))}
                       {selectedClaims.length === 0 && <span className="text-zinc-600 italic">    // Select claims to disclose\n</span>}
                       <span className="text-pink-400">  {`}`}</span>{`\n`}
                       <span className="text-pink-400">{`}`}</span>
                     </pre>
                  </div>

                  <button 
                    onClick={handleGenerateProof}
                    className="btn-primary w-full mt-6 py-4"
                  >
                    SIGN PAYLOAD <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="service-select" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 md:p-8">
                 
                 <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setActiveProof(null)} className="p-2 hover:bg-white/10 rounded-full transition text-zinc-400">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="text-xl font-bold text-white">Target Service</h3>
                      <p className="text-xs text-zinc-500 font-mono mt-1">Proof Hash: {activeProof.proof_id.substring(0,16)}...</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {SERVICES.map((svc) => (
                      <div 
                        key={svc.id}
                        onClick={() => setSelectedService(svc.id)}
                        className={`cursor-pointer rounded-xl border p-4 text-center transition-all
                          ${selectedService === svc.id 
                            ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }
                        `}
                      >
                         <div className="text-4xl mb-3">{svc.icon}</div>
                         <div className="text-sm font-bold text-zinc-200">{svc.label}</div>
                         <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wide">{svc.desc}</div>
                      </div>
                    ))}
                 </div>

                 <button 
                   onClick={handleVerify}
                   disabled={!selectedService}
                   className="btn-success w-full py-4 text-sm"
                 >
                   <Share2 className="w-4 h-4" /> TRANSMIT ZK PROOF
                 </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}
