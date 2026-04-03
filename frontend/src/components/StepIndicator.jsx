import React from 'react';

const STEPS = [
  { id: 1, label: 'Register', icon: '👤' },
  { id: 2, label: 'Fraud Check', icon: '🤖' },
  { id: 3, label: 'Credential', icon: '🔐' },
  { id: 4, label: 'ZK Proof', icon: '🧮' },
  { id: 5, label: 'Verify', icon: '✅' },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between relative">
          {/* Connecting line background */}
          <div
            className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 z-0"
            style={{ left: '5%', right: '5%' }}
          />
          {/* Progress fill */}
          <div
            className="absolute top-5 h-0.5 bg-blue-500 z-0 step-line-fill transition-all duration-700"
            style={{
              left: '5%',
              width: `${Math.max(0, ((currentStep - 1) / (STEPS.length - 1)) * 90)}%`,
            }}
          />

          {STEPS.map((step) => {
            const isDone = currentStep > step.id;
            const isActive = currentStep === step.id;
            const isPending = currentStep < step.id;

            return (
              <div key={step.id} className="flex flex-col items-center gap-1.5 z-10 flex-1">
                {/* Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    transition-all duration-300 select-none
                    ${isDone
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200 animate-pulse-slow shadow-md shadow-blue-200'
                      : 'bg-white text-slate-400 border-2 border-slate-200'
                    }
                  `}
                >
                  {isDone ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </div>
                {/* Label */}
                <span
                  className={`text-xs font-semibold hidden sm:block transition-colors duration-300 ${
                    isDone || isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                {/* Step number for small screens */}
                <span className={`text-xs font-semibold sm:hidden ${
                  isDone || isActive ? 'text-blue-600' : 'text-slate-400'
                }`}>
                  {step.id}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
