import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTx } from '../hooks/useTx.js';
import { useProducts } from '../hooks/useProducts.js';
import { useLosses } from '../hooks/useLosses.js';

const TransactionContext = createContext(null);

export function TransactionProvider({ children, session, enforceLimit, toast }) {
  const txHook = useTx(session, enforceLimit, toast);
  const productsHook = useProducts(session, enforceLimit, toast);
  const lossesHook = useLosses(session, enforceLimit, toast);

  return (
    <TransactionContext.Provider value={{
      tx: txHook.tx,
      setTx: txHook.setTx,
      addTx: txHook.addTx,
      addGenerated: txHook.addGenerated,
      editTx: txHook.editTx,
      deleteTx: txHook.deleteTx,
      products: productsHook.products,
      setProducts: productsHook.setProducts,
      addProduct: productsHook.addProduct,
      editProduct: productsHook.editProduct,
      deleteProduct: productsHook.deleteProduct,
      adjustStock: productsHook.adjustStock,
      losses: lossesHook.losses,
      setLosses: lossesHook.setLosses,
      addLoss: lossesHook.addLoss,
      editLoss: lossesHook.editLoss,
      deleteLoss: lossesHook.deleteLoss,
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
}