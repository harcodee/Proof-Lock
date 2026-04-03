import React from 'react';

const CONFIG = {
  LOW: {
    className: 'badge-low',
    dot: '🟢',
    label: 'LOW RISK',
    desc: 'Face detected. Identity appears genuine.',
  },
  MEDIUM: {
    className: 'badge-medium',
    dot: '🟡',
    label: 'MEDIUM RISK',
    desc: 'Some anomalies detected. Manual review may be needed.',
  },
  HIGH: {
    className: 'badge-high',
    dot: '🔴',
    label: 'HIGH RISK',
    desc: 'Face not detected or synthetic identity suspected.',
  },
};

export default function FraudBadge({ score, showDescription = false }) {
  const cfg = CONFIG[score] || CONFIG.MEDIUM;

  return (
    <div className="inline-flex flex-col gap-1">
      <span className={cfg.className}>
        {cfg.dot} {cfg.label}
      </span>
      {showDescription && (
        <p className="text-xs text-slate-500 mt-0.5">{cfg.desc}</p>
      )}
    </div>
  );
}
