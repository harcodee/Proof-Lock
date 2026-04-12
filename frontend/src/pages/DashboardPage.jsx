import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { generateCredential } from '../api/client';
import { useStore } from '../store';
import FraudBadge from '../components/FraudBadge';
import TrustScoreRing from '../components/TrustScoreRing';
import LoadingSpinner from '../components/LoadingSpinner';
import { FileKey, Wallet, Fingerprint, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { userId, userData, trustData, addToast, setCredential } = useStore();
  const [loading, setLoading] = useState(false);
  const [issued, setIssued] = useState(false);

  const handleIssue = async () => {
    setLoading(true);
    try {
      const res = await generateCredential(userId);
      setIssued(true);
      setCredential(res.data); // Store active credential context
      addToast('Verifiable Credential generated securely.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to generate credential.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCredential = () => {
    // Navigating to credential view handled by App.jsx if credential is set
  };

  return (
    <>
      {loading && <LoadingSpinner message="Generating Cryptographic DID and Signature..." />}

      <div className="min-h-[calc(100vh-80px)] p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-5xl">
          
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="font-serif text-[36px] md:text-[48px] font-medium leading-[1.1] tracking-[-0.3px] text-[#E6EAF2]">Identity Enclave</h1>
              <p className="text-zinc-500 font-mono text-sm mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]"></span> SECURE CONNECTION ACTIVE
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="font-sans text-[11px] tracking-[1.5px] uppercase text-white/50 mb-1">Internal ID</p>
              <p className="text-sm text-zinc-400 font-mono">USR-{String(userId).padStart(6, '0')}</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Trust Profile */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-5 flex flex-col gap-6">
              
              <div className="glass-card p-6 flex flex-col items-center">
                <h3 className="w-full font-sans text-[11px] font-medium tracking-[1.5px] uppercase text-white/50 mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Global Trust Score
                </h3>
                
                <TrustScoreRing score={trustData?.composite_score || 0} tierLabel={trustData?.tier_label || 'UNVERIFIED'} size={180} />
                
                <div className="w-full mt-8 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="font-sans text-[11px] tracking-[1.5px] uppercase text-white/50">Identity Name</span>
                    <span className="font-sans text-[14px] font-medium text-[#E6EAF2]">{userData?.name}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="font-sans text-[11px] tracking-[1.5px] uppercase text-white/50">Risk Assessment</span>
                    <FraudBadge score={userData?.fraud_score} />
                  </div>
                </div>
              </div>

            </motion.div>

            {/* Right Column: Actions & Wallet */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="glass-card p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-[20px] md:text-[24px] font-medium text-[#E6EAF2]">Digital Identity Wallet</h2>
                    <p className="font-sans text-[14px] text-zinc-400">Issue and manage cryptographic proofs</p>
                  </div>
                </div>

                <div className="flex-1 text-sm text-zinc-400 leading-relaxed space-y-4 my-6">
                  <p>
                    Your biometric and biographical data has been securely verified. 
                    You can now issue a <strong>Verifiable Credential (VC)</strong> bound to a Decentralized Identifier (DID).
                  </p>
                  
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-400" />
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Fingerprint className="w-4 h-4 text-blue-400 mt-0.5" />
                        <span>Self-Sovereign: You hold the cryptographic keys.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <FileKey className="w-4 h-4 text-emerald-400 mt-0.5" />
                        <span>Zero-Knowledge: Prove eligibility without sharing raw data matrices.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-auto">
                  {!issued ? (
                    <button onClick={handleIssue} className="btn-primary w-full shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                      <FileKey className="w-4 h-4" /> GENERATE VERIFIABLE CREDENTIAL
                    </button>
                  ) : (
                    <div className="space-y-3 animate-fade-in">
                      <div className="text-xs text-center font-mono text-emerald-400 tracking-widest bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
                        ✓ CREDENTIAL ISSUED & STORED
                      </div>
                      <button onClick={handleViewCredential} className="btn-ghost w-full">
                        OPEN WALLET CONTEXT →
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </>
  );
}
