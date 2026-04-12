import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react';

export default function ProofBadge({ claimKey, claimData, isSelected, onToggle, disabled }) {
  
  const formatKey = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatValue = (val) => {
    if (typeof val === 'boolean') {
      return val ? 'TRUE' : 'FALSE';
    }
    return val;
  };

  return (
    <motion.div 
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={() => !disabled && onToggle(claimKey)}
      className={`
        relative overflow-hidden cursor-pointer rounded-xl border p-3 flex items-center justify-between transition-all duration-300
        ${isSelected && !disabled 
          ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.2)] opacity-100' 
          : disabled 
            ? 'bg-black/20 border-white/5 opacity-50 cursor-not-allowed'
            : 'bg-white/[0.02] border-white/10 opacity-60 hover:opacity-100 hover:bg-white/5 hover:border-blue-500/30 hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)]'
        }
      `}
    >
      <div className="flex items-center gap-3 relative z-10">
        <div className={`transition-colors ${isSelected ? 'text-blue-400' : 'text-zinc-600'}`}>
          {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </div>
        <div>
          <p className={`font-sans text-[11px] font-bold uppercase tracking-[1.5px] mb-0.5 ${isSelected ? 'text-blue-300' : 'text-zinc-400'}`}>
            {formatKey(claimKey)}
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
              {formatValue(claimData.value)}
            </span>
            {claimData.disclosure === 'HIDDEN' && (
              <span className="text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-mono tracking-widest border border-amber-500/30">
                HIDDEN
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {isSelected ? (
          <Eye className="w-4 h-4 text-blue-400/50" />
        ) : (
          <EyeOff className="w-4 h-4 text-zinc-600" />
        )}
      </div>

      {/* Selected Indicator Glow */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_#3B82F6]" />
      )}
    </motion.div>
  );
}
