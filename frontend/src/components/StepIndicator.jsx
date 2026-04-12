import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { LogOut } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Identity Intake', icon: 'scan' },
  { id: 2, label: 'AI Oracle', icon: 'cpu' },
  { id: 3, label: 'Credential', icon: 'wallet' },
  { id: 4, label: 'ZKP Engine', icon: 'fingerprint' },
  { id: 5, label: 'Access', icon: 'unlock' },
];

export default function StepIndicator({ currentStep }) {
  const reset = useStore(state => state.reset);
  
  const handleLogout = () => {
    localStorage.removeItem('user_id');
    reset();
  };

  return (
    <div className="w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 relative">
      {currentStep >= 2 && (
        <button 
          onClick={handleLogout}
          title="Logout / Start Over"
          className="absolute top-2 right-4 text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-rose-400 transition flex items-center gap-1 bg-zinc-900/80 border border-white/10 rounded-full px-3 py-1.5 z-50 shadow-md"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">LOGOUT</span>
        </button>
      )}
      <div className="max-w-5xl mx-auto px-4 py-5 sm:py-7 mt-3">
        <div className="flex items-center justify-between relative">
          {/* Background Line */}
          <div className="absolute top-1/2 left-[5%] right-[5%] h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />
          
          {/* Active Line Fill */}
          <motion.div 
            className="absolute top-1/2 left-[5%] h-0.5 bg-gradient-to-r from-blue-500 to-transparent -translate-y-1/2 z-0"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(0, ((currentStep - 1) / (STEPS.length - 1)) * 90)}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />

          {STEPS.map((step) => {
            const isDone = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2 z-10 flex-1 relative">
                <motion.div
                  className={` w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl transition-colors duration-300
                    ${isDone 
                      ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-500' 
                      : isActive 
                      ? 'bg-zinc-950 border border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-600 text-opacity-50'}
                  `}
                  animate={isActive ? { scale: [1, 1.1, 1]} : { scale: 1 }}
                  transition={isActive ? { duration: 2, repeat: Infinity } : { duration: 0 }}
                >
                  {isDone ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="opacity-80 font-mono text-sm">{step.id}</span>
                  )}
                </motion.div>
                <div className={`hidden sm:block text-[11px] font-semibold uppercase tracking-[1.5px] mt-2 transition-colors ${
                  isDone || isActive ? 'text-blue-300' : 'text-zinc-600'
                }`}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
