import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, Copy, Code, Lock } from 'lucide-react';
import FraudBadge from './FraudBadge';

export default function CredentialCard({ credential, signature, did, status, isFullView = false }) {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  if (!credential) return null;

  return (
    <motion.div layout className="relative">
      {/* Front of Card */}
      <div className="relative glass-card overflow-hidden shadow-[0_20px_50px_rgba(8,112,184,0.15)] glow-blue">
        {/* Holographic background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-slate-900/90 to-blue-800/30 -z-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-24 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl translate-y-16 -translate-x-12" />
        
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">VERIFIABLE CREDENTIAL</h3>
              <p className="text-[10px] text-zinc-400 font-mono tracking-widest">{credential.issuer}</p>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest border
            ${status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
              status === 'REVOKED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 
              'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}
          >
            {status}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
            
            <div className="space-y-4">
              <div>
                <p className="font-sans text-[11px] tracking-[1.5px] uppercase text-white/50 mb-1">Subject DID</p>
                <div 
                  className="flex items-center gap-2 text-xs font-mono text-blue-300 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 cursor-pointer hover:bg-black/60 transition group selection:bg-blue-500/30"
                  onClick={() => handleCopy(did)}
                >
                  <span className="truncate">{did}</span>
                  <Copy className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-sans text-[11px] tracking-[1.5px] uppercase text-white/50 mb-1">Holder Name</p>
                  <p className="text-[14px] font-sans font-medium text-[#E6EAF2]">{credential.name}</p>
                </div>
                <div>
                  <p className="font-sans text-[11px] tracking-[1.5px] uppercase text-white/50 mb-1">Trust Tier</p>
                  <FraudBadge score={credential.trust_tier || credential.fraud_score} />
                </div>
                <div>
                  <p className="font-sans text-[11px] tracking-[1.5px] uppercase text-white/50 mb-1">Issued</p>
                  <p className="text-[12px] text-zinc-300 font-mono">{formatDate(credential.issued_at)}</p>
                </div>
                <div>
                  <p className="font-sans text-[11px] tracking-[1.5px] uppercase text-white/50 mb-1">Expires</p>
                  <p className="text-[12px] text-amber-400/80 font-mono">{formatDate(credential.expires_at)}</p>
                </div>
              </div>
            </div>

            {/* QR Code Segment */}
            {isFullView && (
              <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-white/20 self-start hidden md:block">
                <QRCodeSVG 
                  value={JSON.stringify({ did, signature })} 
                  size={100}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"Q"}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black/50 px-6 py-3 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
            <Lock className="w-3 h-3 text-emerald-400/70" />
            <span>SHA-256 Sig: {signature.substring(0,24)}...</span>
          </div>
          {copied && <span className="text-[10px] text-emerald-400 font-mono">✓ COPIED</span>}
        </div>
      </div>

      {isFullView && (
        <div className="mt-4">
          <button 
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition w-full p-2 bg-white/5 rounded-lg border border-white/10 justify-center"
          >
            <Code className="w-4 h-4" /> {showJson ? 'HIDE RAW DATA' : 'VIEW RAW DATA'}
          </button>
          
          <AnimatePresence>
            {showJson && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="p-4 bg-black/60 rounded-xl border border-white/5 font-mono text-xs overflow-auto max-h-64 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]">
                  <pre className="text-zinc-300">
                    <span className="text-pink-400">{`{`}</span>{`\n`}
                    <span className="text-blue-300">  "did"</span>: <span className="text-emerald-300">"{did}"</span>,{`\n`}
                    <span className="text-blue-300">  "status"</span>: <span className="text-emerald-300">"{status}"</span>,{`\n`}
                    <span className="text-blue-300">  "credential"</span>: {JSON.stringify(credential, null, 4).replace(/\n/g, '\n  ').replace(/"([^"]+)":/g, '<span class="text-blue-300">"$1"</span>:').replace(/: "([^"]+)"/g, ': <span class="text-emerald-300">"$1"</span>').replace(/: true/gi, ': <span class="text-amber-300">true</span>').replace(/: false/gi, ': <span class="text-rose-300">false</span>').replace(/: ([0-9]+)/g, ': <span class="text-sky-300">$1</span>')},{`\n`}
                    <span className="text-blue-300">  "signature"</span>: <span className="text-emerald-300">"{signature}"</span>{`\n`}
                    <span className="text-pink-400">{`}`}</span>
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
