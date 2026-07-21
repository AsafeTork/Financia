import { useEffect } from 'react';
import { sb } from '../../lib/supabase.js';

export function useImpersonation(props) {
  var { toast } = props;

  useEffect(function() {
    var hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;
    try {
      var params = new URLSearchParams(hash.replace('#', ''));
      var accessToken = params.get('access_token');
      var refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) return;
      sb.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(function(res) {
          if (res.error) throw res.error;
          window.location.hash = '';
          window.location.reload();
        })
        .catch(function(err) {
          if (toast) toast('Erro ao acessar conta: ' + (err.message || 'tente novamente'), 'error');
          window.location.hash = '';
        });
    } catch (_) {
      window.location.hash = '';
    }
  }, []);
}
