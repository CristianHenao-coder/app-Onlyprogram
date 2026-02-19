import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export interface SnackbarProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: 'info' | 'success' | 'warning' | 'error';
}

export default function Snackbar({
  message,
  isOpen,
  onClose,
  duration = 5000,
  action,
  type = 'info'
}: SnackbarProps) {
  
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const colors = {
    info: 'bg-surface border-border',
    success: 'bg-green-500/10 border-green-500/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
    error: 'bg-red-500/10 border-red-500/30'
  };

  const iconColors = {
    info: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500'
  };

  const icons = {
    info: 'info',
    success: 'check_circle',
    warning: 'warning',
    error: 'error'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200]"
        >
          <div className={`${colors[type]} border backdrop-blur-xl rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-[320px] max-w-[500px]`}>
            <span className={`material-symbols-outlined ${iconColors[type]}`}>
              {icons[type]}
            </span>
            
            <p className="text-white font-medium text-sm flex-1">{message}</p>
            
            {action && (
              <button
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className="text-primary font-black text-xs uppercase tracking-widest hover:text-primary-dark transition-colors"
              >
                {action.label}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-silver/40 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
