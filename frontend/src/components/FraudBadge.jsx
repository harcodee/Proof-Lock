import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

const CONFIG = {
  LOW: {
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    label: 'VERIFIED',
    desc: 'High confidence identity match.',
  },
  MEDIUM: {
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'MODERATE RISK',
    desc: 'Some anomalies. Subject to restrictions.',
  },
  HIGH: {
    className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
    label: 'HIGH RISK',
    desc: 'Verification failed or anomalies found.',
  },
};

export default function FraudBadge({ score, showDescription = false }) {
  const cfg = CONFIG[score] || CONFIG.HIGH; // safe fallback

  return (
    <div className="inline-flex flex-col gap-1 items-start">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${cfg.className}`}>
        {cfg.icon}
        {cfg.label}
      </span>
      {showDescription && (
        <p className="text-xs text-zinc-500 mt-1 pl-1">{cfg.desc}</p>
      )}
    </div>
  );
}
