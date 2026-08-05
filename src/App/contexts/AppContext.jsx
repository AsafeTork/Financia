import React, { createContext, useContext } from 'react';

var AppContext = createContext(null);
var DataContext = createContext(null);

export function AppProvider({ children, value }) {
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function DataProvider({ children, value }) {
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useAppContext() {
  var ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}

export function useDataContext() {
  var ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useDataContext must be used within DataProvider');
  }
  return ctx;
}

export default AppContext;