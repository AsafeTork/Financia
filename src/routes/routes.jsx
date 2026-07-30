import React, { lazy, Suspense, useCallback, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PageSkeleton } from '../shared/ui/ui.jsx';

const Dashboard     = lazy(function() { return import('../features/dashboard/Dashboard.jsx'); });
const TxView        = lazy(function() { return import('../features/transactions/TxView.jsx'); });
const InventoryView = lazy(function() { return import('../features/inventory/InventoryView.jsx'); });
const ReportView    = lazy(function() { return import('../features/reports/ReportView.jsx'); });
const EmailView     = lazy(function() { return import('../features/email/EmailView.jsx'); });
const SettingsView  = lazy(function() { return import('../features/settings/SettingsView.jsx'); });
const PlansView     = lazy(function() { return import('../features/plans/PlansView.jsx'); });
const BrandStudioView = lazy(function() { return import('../features/branding/BrandStudioView.jsx'); });

var AppRoutes = React.memo(function AppRoutes(props) {
  var tx = props.tx, products = props.products, losses = props.losses, brand = props.brand;
  var planInfo = props.planInfo, onNav = props.onNav, toast = props.toast, confirm = props.confirm;
  var uid = props.uid, addTx = props.addTx, editTx = props.editTx, deleteTx = props.deleteTx;
  var addGenerated = props.addGenerated, onDeductStock = props.onDeductStock;
  var addProduct = props.addProduct, editProduct = props.editProduct, deleteProduct = props.deleteProduct;
  var addLoss = props.addLoss, editLoss = props.editLoss, deleteLoss = props.deleteLoss;
  var adjustStock = props.adjustStock, saveBrand = props.saveBrand, savePhone = props.savePhone;
  var session = props.session, isAdmin = props.isAdmin, dataLoading = props.dataLoading;

  var noop = useMemo(function() { return function() {}; }, []);
  var onUpgradePlano = useMemo(function() { return function() { onNav('planos'); }; }, [onNav]);

  var incomeElement = useMemo(function() {
    return <TxView type="income" tx={tx} products={products} onAdd={addTx} onEdit={editTx} onDelete={deleteTx} onDeductStock={onDeductStock} planInfo={planInfo} onNav={onNav} brand={brand} toast={toast} confirm={confirm}/>;
  }, [tx, products, addTx, editTx, deleteTx, onDeductStock, planInfo, onNav, brand, toast, confirm]);

  var expenseElement = useMemo(function() {
    return <TxView type="expense" tx={tx} products={products} onAdd={addTx} onEdit={editTx} onDelete={deleteTx} onDeductStock={noop} onAddGenerated={addGenerated} uid={uid} planInfo={planInfo} onNav={onNav} brand={brand} toast={toast} confirm={confirm}/>;
  }, [tx, products, addTx, editTx, deleteTx, noop, addGenerated, uid, planInfo, onNav, brand, toast, confirm]);

  var inventoryElement = useMemo(function() {
    return <InventoryView products={products} losses={losses} onAddProduct={addProduct} onEditProduct={editProduct} onDeleteProduct={deleteProduct} onAddLoss={addLoss} onEditLoss={editLoss} onDeleteLoss={deleteLoss} onAdjustStock={adjustStock} planInfo={planInfo} onNav={onNav} brand={brand} toast={toast} confirm={confirm}/>;
  }, [products, losses, addProduct, editProduct, deleteProduct, addLoss, editLoss, deleteLoss, adjustStock, planInfo, onNav, brand, toast, confirm]);

  var settingsElement = useMemo(function() {
    return <SettingsView brand={brand} session={session} planInfo={planInfo} onSave={saveBrand} onSavePhone={savePhone} toast={toast} confirm={confirm} isAdmin={isAdmin} onNav={onNav}/>;
  }, [brand, session, planInfo, saveBrand, savePhone, toast, confirm, isAdmin, onNav]);

  var planosElement = useMemo(function() {
    return <PlansView brand={brand} planInfo={planInfo} toast={toast} onNav={onNav} isAdmin={isAdmin}/>;
  }, [brand, planInfo, toast, onNav, isAdmin]);

  var brandstudioElement = useMemo(function() {
    return <BrandStudioView brand={brand} planInfo={planInfo} onSave={saveBrand} toast={toast} onNav={onNav} isAdmin={isAdmin}/>;
  }, [brand, planInfo, saveBrand, toast, onNav, isAdmin]);

  var emailElement = useMemo(function() {
    return <EmailView brand={brand} toast={toast}/>;
  }, [brand, toast]);

  var dashboardElement = useMemo(function() {
    return <Dashboard tx={tx} products={products} brand={brand} onNav={onNav} planInfo={planInfo} lossesCount={losses.length} onUpgrade={onUpgradePlano} loading={dataLoading}/>;
  }, [tx, products, brand, onNav, planInfo, losses.length, onUpgradePlano, dataLoading]);

  var reportElement = useMemo(function() {
    return <ReportView tx={tx} brand={brand} toast={toast} onNav={onNav} planInfo={planInfo}/>;
  }, [tx, brand, toast, onNav, planInfo]);

  return (
    <Suspense fallback={<PageSkeleton/>}>
      <Routes>
        <Route path="/" element={dashboardElement} />
        <Route path="/dashboard" element={dashboardElement} />
        <Route path="/income" element={incomeElement} />
        <Route path="/expense" element={expenseElement} />
        <Route path="/inventory" element={inventoryElement} />
        <Route path="/email" element={emailElement} />
        <Route path="/report" element={reportElement} />
        <Route path="/settings" element={settingsElement} />
        <Route path="/planos" element={planosElement} />
        <Route path="/brandstudio" element={brandstudioElement} />
      </Routes>
    </Suspense>
  );
});

export default AppRoutes;
