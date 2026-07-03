import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
const ConfirmContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastId = React.useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((msg, type = 'success') => {
    var id = ++toastId.current;
    setToasts((list) => list.concat([{ id, msg, type }]));
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, type === 'error' ? 4000 : 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, dismissToast, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ConfirmProvider({ children }) {
  const [confirmData, setConfirmData] = useState(null);

  const confirm = useCallback((msg, onOk) => {
    setConfirmData({ msg, onOk });
  }, []);

  const dismissConfirm = useCallback(() => {
    setConfirmData(null);
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirmData, confirm, dismissConfirm }}>
      {children}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}