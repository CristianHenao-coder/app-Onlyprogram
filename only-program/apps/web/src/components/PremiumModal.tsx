import { motion, AnimatePresence } from 'framer-motion';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  isClosable?: boolean;
}

export default function PremiumModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  isClosable = true
}: PremiumModalProps) {
  
  const icons = {
    success: { icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-500/10' },
    error: { icon: 'error', color: 'text-red-500', bg: 'bg-red-500/10' },
    warning: { icon: 'warning', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    info: { icon: 'info', color: 'text-primary', bg: 'bg-primary/10' },
    confirm: { icon: 'help', color: 'text-primary', bg: 'bg-primary/10' }
  };

  const currentType = icons[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isClosable ? onClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-surface border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
          >
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className={`h-16 w-16 ${currentType.bg} ${currentType.color} rounded-2xl flex items-center justify-center mb-6`}>
                <span className="material-symbols-outlined text-3xl font-black">{currentType.icon}</span>
              </div>

              {/* Text */}
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{title}</h3>
              <p className="text-silver/60 text-sm leading-relaxed mb-8">{message}</p>

              {/* Actions */}
              <div className="flex gap-3 w-full">
                {type === 'confirm' && (
                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 text-white font-bold transition-all text-sm"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={onConfirm || onClose}
                  className={`flex-1 py-3.5 rounded-xl ${type === 'error' ? 'bg-red-500' : 'bg-primary'} text-white font-black uppercase tracking-widest text-[10px] shadow-lg ${type === 'error' ? 'shadow-red-500/20' : 'shadow-primary/20'} hover:scale-[1.02] active:scale-95 transition-all`}
                >
                  {confirmText}
                </button>
              </div>
            </div>

            {/* Close Button */}
            {isClosable && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-silver/20 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
