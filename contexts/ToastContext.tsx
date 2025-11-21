
import React, { createContext, useState, useCallback, useContext } from 'react';
import { createPortal } from 'react-dom';
import Toast, { ToastProps } from '../components/Toast';

type ToastMessage = Omit<ToastProps, 'onDismiss'>;

interface ToastContextType {
  addToast: (toast: ToastMessage) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: ToastMessage) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {createPortal(
        <div className="space-y-3">
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id!)} />
          ))}
        </div>,
        document.getElementById('toast-container')!
      )}
    </ToastContext.Provider>
  );
};
