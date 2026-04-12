import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingSpinner({ message = 'Accessing Secure Enclave...' }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="glass-card p-8 flex flex-col items-center gap-6 max-w-sm w-full relative overflow-hidden">
        
        {/* Animated background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 blur-2xl rounded-full" />

        {/* Spinner ring structure */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="2" strokeDasharray="10 4" />
          </svg>
          <svg className="absolute inset-0 w-full h-full animate-[spin_2s_linear_infinite_reverse]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(96,165,250,0.3)" strokeWidth="1.5" strokeDasharray="30 10" />
          </svg>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-full blur-[2px]"
          />
        </div>

        {/* Typewriter message effect */}
        <div className="text-center">
          <p className="text-blue-100 font-mono text-sm tracking-wide">{message}</p>
          <div className="flex gap-1.5 justify-center mt-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -5, 0], opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                className="w-1.5 h-1.5 bg-blue-400 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
