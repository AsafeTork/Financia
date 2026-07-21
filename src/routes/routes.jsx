import React, { lazy, Suspense } from 'react';
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

export default function AppRoutes(props) {
  var { tx, products, losses, brand, planInfo, onNav, toast, confirm, uid, addTx, editTx, deleteTx, addGenerated, onDeductStock, addProduct, editProduct, deleteProduct, addLoss, editLoss, deleteLoss, adjustStock, saveBrand, savePhone, session, isAdmin, dataLoading } = props;
  var noop = function() {};
  return (
    <Suspense fallback={<PageSkeleton/>}>
      <Routes>
        <Route path="/" element={<Dashboard tx={tx} products={products} brand={brand} onNav={onNav} planInfo={planInfo} lossesCount={losses.length} onUpgrade={function() { onNav('planos'); }} loading={dataLoading}/>} />
        <Route path="/dashboard" element={<Dashboard tx={tx} products={products} brand={brand} onNav={onNav} planInfo={planInfo} lossesCount={losses.length} onUpgrade={function() { onNav('planos'); }} loading={dataLoading}/>} />
        <Route path="/income" element={<TxView type="income" tx={tx} products={products} onAdd={addTx} onEdit={editTx} onDelete={deleteTx} onDeductStock={onDeductStock} planInfo={planInfo} onNav={onNav} brand={brand} toast={toast} confirm={confirm}/>} />
        <Route path="/expense" element={<TxView type="expense" tx={tx} products={products} onAdd={addTx} onEdit={editTx} onDelete={deleteTx} onDeductStock={noop} onAddGenerated={addGenerated} uid={uid} planInfo={planInfo} onNav={onNav} brand={brand} toast={toast} confirm={confirm}/>} />
        <Route path="/inventory" element={<InventoryView products={products} losses={losses} onAddProduct={addProduct} onEditProduct={editProduct} onDeleteProduct={deleteProduct} onAddLoss={addLoss} onEditLoss={editLoss} onDeleteLoss={deleteLoss} onAdjustStock={adjustStock} planInfo={planInfo} onNav={onNav} brand={brand} toast={toast} confirm={confirm}/>} />
        <Route path="/email" element={<EmailView brand={brand} toast={toast}/>} />
        <Route path="/report" element={<ReportView tx={tx} brand={brand} toast={toast} onNav={onNav} planInfo={planInfo}/>} />
        <Route path="/settings" element={<SettingsView brand={brand} session={session} planInfo={planInfo} onSave={saveBrand} onSavePhone={savePhone} toast={toast} confirm={confirm} isAdmin={isAdmin} onNav={onNav}/>} />
        <Route path="/planos" element={<PlansView brand={brand} planInfo={planInfo} toast={toast} onNav={onNav} isAdmin={isAdmin}/>} />
        <Route path="/brandstudio" element={<BrandStudioView brand={brand} planInfo={planInfo} onSave={saveBrand} toast={toast} onNav={onNav} isAdmin={isAdmin}/>} />
      </Routes>
    </Suspense>
  );
}
