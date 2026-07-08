import { sb } from '../../lib/supabase.js';

export function useRealtime(props, ctx) {
  var { setPlanInfo } = props;
  var { uidRef, channelRef, debounceRef, retryRef, retryDelayRef, runSync, reconnectRef } = ctx;

  var subscribeRealtime = function(uid) {
    if (channelRef.current) { sb.removeChannel(channelRef.current); channelRef.current = null; }
    var doSync = function() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(runSync, 800);
    };
    var applyPlan = function(payload) {
      var row = payload && payload['new'] ? payload['new'] : null;
      if (!row || row.user_id !== uid) return;
      setPlanInfo({
        plan: row.plan || 'free',
        plan_expires_at: row.plan_expires_at || null,
        plan_activated_by: row.plan_activated_by || null
      });
    };
    channelRef.current = sb.channel('rt-' + uid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, doSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, doSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'losses' }, doSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_profiles' }, doSync)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'company_profiles', filter: 'user_id=eq.' + uid }, applyPlan)
      .subscribe(function(status) {
        if (status === 'SUBSCRIBED') {
          retryDelayRef.current = 1000;
          runSync();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (retryRef.current) clearTimeout(retryRef.current);
          var delay = retryDelayRef.current;
          retryDelayRef.current = Math.min(delay * 2, 30000);
          retryRef.current = setTimeout(function() {
            if (uidRef.current && navigator.onLine) subscribeRealtime(uidRef.current);
          }, delay);
        }
      });
  };

  reconnectRef.current = subscribeRealtime;
}
