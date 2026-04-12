import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import CredentialCard from '../components/CredentialCard';
import { revokeCredential } from '../api/client';
import { ArrowRight, ShieldBan, Download, BoxSelect } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CredentialPage() {
  const { credential, addToast, setCurrentStep, setCredential } = useStore((state) => state);
  const [loading, setLoading] = useState(false);
  const [showRevoke, setShowRevoke] = useState(false);
  const [revokeReason, setRevokeReason] = useState('Lost device access');

  if (!credential) return null;

  const handleRevoke = async () => {
    setLoading(true);
    try {
      await revokeCredential(credential.credential_id, revokeReason);
      addToast('Credential revoked successfully.', 'info');
      setShowRevoke(false);
      // Update local state to reflect revoked status
      setCredential({ ...credential, status: 'REVOKED' });
    } catch (err) {
      addToast(err.message || 'Failed to revoke credential.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (credential.status !== 'ACTIVE') {
      addToast('Cannot generate proofs with an inactive credential.', 'error');
      return;
    }
    setCurrentStep(4);
  };

  return (
    <>
      {loading && <LoadingSpinner message="Processing state transition..." />}
      
      <div className="min-h-[calc(100vh-80px)] p-4 sm:p-8 flex justify-center pb-20">
        <div className="w-full max-w-2xl flex flex-col gap-6">
          
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
            <div>
              <h1 className="font-serif text-[36px] md:text-[48px] font-medium leading-[1.1] tracking-[-0.3px] text-[#E6EAF2] flex items-center gap-2">
                <BoxSelect className="w-6 h-6 text-blue-400" /> Wallet Context
              </h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => addToast('PDF export simulated successfully', 'success')}
                className="btn-ghost !p-2 rounded-lg text-zinc-400 hover:text-white" title="Export PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              {credential.status === 'ACTIVE' && (
                <button 
                  onClick={() => setShowRevoke(!showRevoke)}
                  className={`btn-ghost !p-2 rounded-lg text-zinc-400 transition-colors ${showRevoke ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'hover:text-rose-400 hover:border-rose-500/40'}`} 
                  title="Revoke Credential"
                >
                  <ShieldBan className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {showRevoke && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex flex-col gap-3">
                  <h4 className="text-rose-400 text-sm font-bold flex items-center gap-2">
                    <ShieldBan className="w-4 h-4" /> Revoke Credential
                  </h4>
                  <p className="text-xs text-zinc-400">This action permanently invalidates the credential. Any future verifications using this DID will fail.</p>
                  <select 
                    value={revokeReason} 
                    onChange={(e) => setRevokeReason(e.target.value)}
                    className="input-field !py-2 !text-sm border-rose-500/30 focus:border-rose-400 focus:ring-rose-400/20"
                  >
                    <option>Lost device access</option>
                    <option>Information changed</option>
                    <option>Suspected compromise</option>
                  </select>
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setShowRevoke(false)} className="btn-ghost !py-1.5 !px-3 !text-xs">Cancel</button>
                    <button onClick={handleRevoke} className="btn-destructive !py-1.5 !px-3 !text-xs">Confirm Revocation</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <CredentialCard 
              credential={credential.credential}
              signature={credential.signature}
              did={credential.did || `did:ivp:legacy:${credential.credential_id}`}
              status={credential.status || 'ACTIVE'}
              isFullView={true}
            />
          </motion.div>

          {/* Context Actions */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4">
            <button 
              onClick={handleNext}
              disabled={credential.status !== 'ACTIVE'}
              className="btn-primary w-full py-4 text-sm group"
            >
              PROCEED TO ZKP ENGINE 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-center font-sans text-[11px] uppercase tracking-[1.5px] text-white/50 mt-4">Protected by Zero-Knowledge Cryptography</p>
          </motion.div>

        </div>
      </div>
    </>
  );
}
