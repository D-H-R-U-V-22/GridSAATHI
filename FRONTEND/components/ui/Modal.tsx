import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#07261C]/35 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full ${maxWidth} bg-white rounded-[12px] shadow-floating border border-[#DDE9E0] overflow-hidden z-10`}
          >
            <div className="flex items-start justify-between p-5 border-b border-[#DDE9E0] bg-[#F5FAF6]">
              <div>
                <h3 className="text-base font-semibold text-[#0C3B2B]">{title}</h3>
                {subtitle && <p className="text-xs text-[#5B6B62] mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-[#5B6B62] hover:text-[#16241D] hover:bg-white border border-transparent hover:border-[#DDE9E0] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
