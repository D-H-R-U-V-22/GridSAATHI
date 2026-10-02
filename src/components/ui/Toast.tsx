import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.durationMs || 4000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => {
            const icon = {
              success: <CheckCircle2 className="w-5 h-5 text-[#27A163] shrink-0" strokeWidth={1.75} />,
              warning: <AlertTriangle className="w-5 h-5 text-[#E9A820] shrink-0" strokeWidth={1.75} />,
              error: <AlertCircle className="w-5 h-5 text-[#C73E3A] shrink-0" strokeWidth={1.75} />,
              info: <Info className="w-5 h-5 text-[#3B7DD8] shrink-0" strokeWidth={1.75} />,
            }[t.type];

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto bg-white border border-[#DDE9E0] rounded-[8px] p-3.5 shadow-floating flex items-start gap-3"
              >
                {icon}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#16241D] leading-tight">{t.title}</h4>
                  {t.message && <p className="text-xs text-[#5B6B62] mt-0.5">{t.message}</p>}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-[#5B6B62] hover:text-[#16241D] p-0.5 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
