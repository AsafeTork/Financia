import React, { createContext, useContext, useState, useCallback } from 'react';

const UpgradeModalContext = createContext(null);

export function UpgradeModalProvider({ children }) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const triggerUpgrade = useCallback((reason) => {
    setShowUpgrade(reason || true);
  }, []);

  const closeUpgrade = useCallback(() => {
    setShowUpgrade(false);
  }, []);

  return (
    <UpgradeModalContext.Provider value={{ showUpgrade, triggerUpgrade, closeUpgrade }}>
      {children}
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const context = useContext(UpgradeModalContext);
  if (!context) {
    throw new Error('useUpgradeModal must be used within an UpgradeModalProvider');
  }
  return context;
}