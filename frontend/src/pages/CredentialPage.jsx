import React from 'react';
import CredentialCard from '../components/CredentialCard';

export default function CredentialPage({ credential, onNext }) {
  if (!credential) return null;

  return (
    <div className="min-h-screen bg-grid px-4 py-12">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Credential Issued
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Verifiable Credential</h1>
          <p className="text-slate-500 mt-1">This cryptographically signed credential can be used to prove your identity to any service provider.</p>
        </div>

        {/* Credential card */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CredentialCard
            credential={credential.credential}
            signature={credential.signature}
            signatureShort={credential.signature_short}
          />
        </div>

        {/* What happens next */}
        <div className="mt-6 card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>🧮</span> What Happens Next?
          </h3>
          <div className="space-y-3">
            {[
              { step: '1', title: 'You define a condition', desc: 'e.g., "age > 18" or "age >= 21"', color: 'blue' },
              { step: '2', title: 'ZK Proof engine evaluates it', desc: 'Your actual age is never transmitted', color: 'violet' },
              { step: '3', title: 'Service receives TRUE/FALSE', desc: 'Zero personal data exposed', color: 'emerald' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 
                  ${item.color === 'blue' ? 'bg-blue-100 text-blue-700' : 
                    item.color === 'violet' ? 'bg-violet-100 text-violet-700' : 
                    'bg-emerald-100 text-emerald-700'}`}>
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          id="goto-zkp-btn"
          onClick={onNext}
          className="btn-primary w-full mt-6 animate-fade-in"
          style={{ animationDelay: '0.25s' }}
        >
          <span>🧮</span>
          <span>Generate Zero-Knowledge Proof →</span>
        </button>
      </div>
    </div>
  );
}
