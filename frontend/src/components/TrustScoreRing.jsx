import React from 'react';
import { motion } from 'framer-motion';

export default function TrustScoreRing({ score, tierLabel, size = 160 }) {
  // Config based on score
  let color = 'text-emerald-500';
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  
  if (score < 0.5) {
    color = 'text-rose-500';
    glowColor = 'rgba(244, 63, 94, 0.4)';
  } else if (score < 0.85) {
    color = 'text-amber-500';
    glowColor = 'rgba(245, 158, 11, 0.4)';
  }

  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - score * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      
      {/* Glow Effect behind the ring */}
      <div 
        className="absolute inset-0 rounded-full blur-[20px] transition-all duration-1000" 
        style={{ background: glowColor, transform: 'scale(0.8)' }} 
      />

      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={color}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
      </svg>
      
      {/* Content inside ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="font-serif text-3xl font-bold tracking-tighter text-white"
        >
          {Math.round(score * 100)}<span className="text-lg text-zinc-400">%</span>
        </motion.span>
        <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mt-1">
          {tierLabel.split('—')[0].trim()}
        </span>
      </div>
    </div>
  );
}
