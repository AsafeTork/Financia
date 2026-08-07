import React, { lazy, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { PageSkeleton } from '../shared/ui/ui.jsx';
import { useAppContext } from '../App/contexts/AppContext.jsx';
import { useDataContext } from '../App/contexts/AppContext.jsx';
import LazyPage from '../App/components/LazyPage.jsx';

var Dashboard     = lazy(function() { return import('../features/dashboard/Dashboard.jsx'); });
var TxView        = lazy(function() { return import('../features/transactions/TxView.jsx'); });
var InventoryView = lazy(function() { return import('../features/inventory/InventoryView.jsx'); });
var ReportView    = lazy(function() { return import('../features/reports/ReportView.jsx'); });
var EmailView     = lazy(function() { return import('../features/email/EmailView.jsx'); });
var SettingsView  = lazy(function() { return import('../features/settings/SettingsView.jsx'); });
var PlansView     = lazy(function() { return import('../features/plans/PlansView.jsx'); });
var BrandStudioView = lazy(function() { return import('../features/branding/BrandStudioView.jsx'); });

var pathMap = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/income': 'income',
  '/expense': 'expense',
  '/inventory': 'inventory',
  '/email': 'email',
  '/report': 'report',
  '/settings': 'settings',
  '/planos': 'planos',
  '/brandstudio': 'brandstudio',
};

var AppRoutes = React.memo(function AppRoutes() {
  var ctx = useAppContext();
  var dataCtx = useDataContext();
  var location = useLocation();
  var pathname = location.pathname;
  var currentPath = pathMap[pathname] || 'dashboard';

  var tx = dataCtx.tx, products = dataCtx.products, losses = dataCtx.losses;
  var brand = ctx.brand, planInfo = ctx.planInfo, onNav = ctx.navTo;
  var toast = ctx.toast, confirm = ctx.confirm;
  var uid = ctx.session ? ctx.session.user.id : null;
  var addTx = dataCtx.addTx, editTx = dataCtx.editTx, deleteTx = dataCtx.deleteTx;
  var addGenerated = dataCtx.addGenerated, onDeductStock = ctx.handleDeductStock;
  var addProduct = dataCtx.addProduct, editProduct = dataCtx.editProduct, deleteProduct = dataCtx.deleteProduct;
  var addLoss = dataCtx.addLoss, editLoss = dataCtx.editLoss, deleteLoss = dataCtx.deleteLoss;
  var adjustStock = dataCtx.adjustStock, saveBrand = ctx.saveBrand, savePhone = ctx.savePhone;
  var session = ctx.session, isAdmin = ctx.isAdminDB, dataLoading = ctx.dataLoading;
  var loadData = ctx.loadData;

  var noop = useMemo(function() { return function() {}; }, []);
  var onUpgradePlano = useMemo(function() { return function() { onNav('planos'); }; }, [onNav]);

  var onRefresh = useCallback(function() {
    if (uid && loadData && navigator.onLine) {
      loadData(uid);
    } else if (uid && loadData) {
      loadData(uid);
    }
  }, [uid, loadData]);

  var element = useMemo(function() {
    switch (currentPath) {
      case 'income':
        return <TxView type="income" tx={tx} products={products} onAdd={addTx} onEdit={editTx} onDelete={deleteTx} onDeductStock={onDeductStock} planInfo={planInfo} onNav={onNav} onRefresh={onRefresh} brand={brand} toast={toast} confirm={confirm}/>;
      case 'expense':
        return <TxView type="expense" tx={tx} products={products} onAdd={addTx} onEdit={editTx} onDelete={deleteTx} onDeductStock={noop} onAddGenerated={addGenerated} uid={uid} planInfo={planInfo} onNav={onNav} onRefresh={onRefresh} brand={brand} toast={toast} confirm={confirm}/>;
      case 'inventory':
        return <InventoryView products={products} losses={losses} onAddProduct={addProduct} onEditProduct={editProduct} onDeleteProduct={deleteProduct} onAddLoss={addLoss} onEditLoss={editLoss} onDeleteLoss={deleteLoss} onAdjustStock={adjustStock} planInfo={planInfo} onNav={onNav} brand={brand} toast={toast} confirm={confirm}/>;
      case 'settings':
        return <SettingsView brand={brand} session={session} planInfo={planInfo} onSave={saveBrand} onSavePhone={savePhone} toast={toast} confirm={confirm} isAdmin={isAdmin} onNav={onNav}/>;
      case 'planos':
        return <PlansView brand={brand} planInfo={planInfo} toast={toast} onNav={onNav} isAdmin={isAdmin}/>;
      case 'brandstudio':
        return <BrandStudioView brand={brand} planInfo={planInfo} onSave={saveBrand} toast={toast} onNav={onNav} isAdmin={isAdmin}/>;
      case 'email':
        return <EmailView brand={brand} toast={toast}/>;
      case 'report':
        return <ReportView tx={tx} brand={brand} toast={toast} onNav={onNav} planInfo={planInfo} onRefresh={onRefresh}/>;
      default:
        return <Dashboard tx={tx} products={products} brand={brand} onNav={onNav} planInfo={planInfo} lossesCount={losses.length} onUpgrade={onUpgradePlano} loading={dataLoading}/>;
    }
  }, [currentPath, tx, products, losses, addTx, editTx, deleteTx, addGenerated, addProduct, editProduct, deleteProduct, addLoss, editLoss, deleteLoss, adjustStock, onDeductStock, brand, planInfo, onNav, toast, confirm, uid, session, isAdmin, dataLoading, saveBrand, savePhone, noop, onUpgradePlano, onRefresh]);

  return (
    <LazyPage fallback={<PageSkeleton/>}>
      {element}
    </LazyPage>
  );
});

export default AppRoutes;