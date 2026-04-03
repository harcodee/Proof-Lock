import React, { useState } from 'react';
import FraudBadge from './FraudBadge';

export default function CredentialCard({ credential, signature, signatureShort }) {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(signature).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
      });
    } catch {
      return iso;
    }
  };

  const highlightJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json
      .replace(/(".*?")(\s*:\s*)/g, '<span style="color:#93C5FD">$1</span>$2')
      .replace(/:\s*(".*?")/g, ': <span style="color:#6EE7B7">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span style="color:#FCA5A5">$1</span>')
      .replace(/:\s*(\d+)/g, ': <span style="color:#FDE68A">$1</span>');
  };

  if (!credential) return null;

  return (
    <div className="animate-fade-in">
      {/* Visual credential card */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white overflow-hidden shadow-2xl glow-blue mb-4">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 opacity-5 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500 opacity-5 rounded-full translate-y-8 -translate-x-8" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-base">🔐</div>
          <div>
            <p className="text-xs text-blue-300 font-medium uppercase tracking-widest">Verifiable Credential</p>
            <p className="text-sm font-semibold text-white">{credential.issuer}</p>
          </div>
          <div className="ml-auto">
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              ✓ VERIFIED
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-5" />

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Full Name</p>
            <p className="text-white font-semibold">{credential.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Verification Status</p>
            <p className="text-emerald-400 font-semibold">✓ TRUE</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Fraud Score</p>
            <FraudBadge score={credential.fraud_score} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Credential Type</p>
            <p className="text-blue-300 text-xs font-medium">{credential.credential_type}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Issued At</p>
            <p className="text-white text-sm">{formatDate(credential.issued_at)}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-4" />

        {/* Signature */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">SHA-256 Signature</p>
            <p className="text-blue-300 font-mono text-xs truncate">{signatureShort}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-all duration-200 font-medium border border-white/20"
          >
            {copied ? '✓ Copied' : 'Copy Full'}
          </button>
        </div>
      </div>

      {/* JSON Viewer Toggle */}
      <button
        onClick={() => setShowJson((p) => !p)}
        className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl flex items-center justify-between transition-all duration-200 mb-2"
      >
        <span>View Raw JSON</span>
        <span className={`transition-transform duration-200 ${showJson ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {showJson && (
        <div className="json-viewer animate-fade-in">
          <pre
            dangerouslySetInnerHTML={{
              __html: highlightJson({ credential, signature }),
            }}
          />
        </div>
      )}

      {/* Privacy note */}
      <p className="mt-3 text-xs text-slate-500 flex items-start gap-1.5">
        <span className="text-blue-500 mt-0.5">🔒</span>
        Your age and ID number are embedded in this credential but will never be shared directly.
        Only zero-knowledge proofs are transmitted to service providers.
      </p>
    </div>
  );
}
