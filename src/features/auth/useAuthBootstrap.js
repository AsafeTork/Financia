import { useEffect } from 'react';
import { sb } from '../../lib/supabase.js';
import { trackEvent } from '../../lib/analytics.js';

function trackReturn(userId) {
  var key = 'financia_return_tracked_' + userId + '_' + new Date().toISOString().slice(0, 10);
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    trackEvent('return', { surface: 'authenticated_load' });
  } catch (_) { /* analytics is best effort */ }
}

export function useAuthBootstrap(props) {
  var { setSession, setAppLoading, toast: _toast, uidRef, loadingRef: _loadingRef, channelRef: _channelRef, debounceRef: _debounceRef, retryRef: _retryRef, loadData, loadFromLocal, onSessionEnd } = props;

  useEffect(function() {
    var cachedUid = localStorage.getItem('financia_last_uid');
    if (cachedUid) { loadFromLocal(cachedUid).catch(function() {}); }

    var _authTimer = setTimeout(function() { setAppLoading(false); }, 8000);
    sb.auth.getSession().then(function(res) {
      clearTimeout(_authTimer);
      var s = res.data.session;
      setSession(s);
      if (s) {
        localStorage.setItem('financia_last_uid', s.user.id);
        localStorage.setItem('financia_seen', '1');
        trackReturn(s.user.id);
        if (s.user.id !== uidRef.current) loadData(s.user.id);
      } else {
        localStorage.removeItem('financia_last_uid');
        if (cachedUid) onSessionEnd();
      }
      setAppLoading(false);
    }).catch(function() { clearTimeout(_authTimer); setAppLoading(false); });

    var authSub = sb.auth.onAuthStateChange(function(event, s) {
      if (event === 'INITIAL_SESSION') return;
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;
      setSession(s);
      if (s) {
        localStorage.setItem('financia_last_uid', s.user.id);
        localStorage.setItem('financia_seen', '1');
        trackReturn(s.user.id);
        if (s.user.id !== uidRef.current) {
          loadData(s.user.id);
        }
      } else {
        localStorage.removeItem('financia_last_uid');
        onSessionEnd();
      }
    });

    return function() {
      authSub.data.subscription.unsubscribe();
    };
  }, [loadData, loadFromLocal, onSessionEnd, setAppLoading, setSession, uidRef]);
}
