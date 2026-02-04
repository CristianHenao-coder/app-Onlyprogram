import { createContext, useContext, useState, ReactNode } from 'react';
import PremiumModal from '@/components/PremiumModal';

interface ModalOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose?: () => void;
}

interface ModalContextType {
  showAlert: (options: ModalOptions) => void;
  showConfirm: (options: ModalOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ModalOptions>({ title: '', message: '' });
  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>();

  const showAlert = (options: ModalOptions) => {
    setConfig({ ...options, type: options.type || 'info' });
    setIsOpen(true);
  };

  const showConfirm = (options: ModalOptions): Promise<boolean> => {
    setConfig({ ...options, type: 'confirm' });
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(false);
    config.onClose?.();
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(true);
    config.onConfirm?.();
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <PremiumModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        {...config}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
}
