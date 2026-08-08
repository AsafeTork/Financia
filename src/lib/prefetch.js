export function prefetchRoutes() {
  var routes = [
    import('../features/dashboard/Dashboard.jsx'),
    import('../features/transactions/TxView.jsx'),
    import('../features/reports/ReportView.jsx'),
  ];
  var idle = function() { routes.forEach(function(p) { p.catch(function() {}); }); };
  if ('requestIdleCallback' in window) requestIdleCallback(idle, { timeout: 4000 });
  else setTimeout(idle, 1000);
}
