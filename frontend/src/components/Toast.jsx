import React, { useEffect, useState } from 'react';

const ICONS = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const TYPE_STYLES = {
  success: 'bg-emerald-600 text-white shadow-emerald-200',
  error: 'bg-red-600 text-white shadow-red-200',
  info: 'bg-blue-600 text-white shadow-blue-200',
};

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 350);
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [toast.id, onRemove]);

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
        transition-all duration-350 cursor-pointer select-none
        ${TYPE_STYLES[toast.type] || TYPE_STYLES.info}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}
      `}
      style={{ transitionProperty: 'opacity, transform' }}
      onClick={() => {
        setVisible(false);
        setTimeout(() => onRemove(toast.id), 350);
      }}
    >
      <span className="mt-0.5 flex-shrink-0">{ICONS[toast.type] || ICONS.info}</span>
      <span className="leading-snug">{toast.message}</span>
    </div>
  );
}
