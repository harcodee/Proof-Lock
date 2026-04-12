import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Info, CheckCircle2 } from 'lucide-react';

const ICONS = {
  success: <CheckCircle2 className="w-5 h-5" />,
  error: <ShieldAlert className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const TYPE_STYLES = {
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
  error: 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
};

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 min-w-[300px] max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  React.useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onRemove(toast.id)}
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md cursor-pointer
        ${TYPE_STYLES[toast.type] || TYPE_STYLES.info}
      `}
    >
      <span className="mt-0.5 flex-shrink-0">{ICONS[toast.type] || ICONS.info}</span>
      <span className="leading-snug text-sm font-medium">{toast.message}</span>
    </motion.div>
  );
}
