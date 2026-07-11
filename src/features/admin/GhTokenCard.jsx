import React, { useState, useEffect } from 'react';
import { Card } from '../../shared/ui/ui.jsx';
import { sb } from '../../lib/supabase.js';

export default function GhTokenCard({ toast }) {
  var [status, setStatus] = useState('checking');
  useEffect(function() {
    sb.functions.invoke('trigger-apk-build', { body: { client_name: '_test', logo_url: '', primary_color: '002f59' } }).then(function(res) {
      setStatus(res && res.data && res.data.ok === false && res.data.reason ? 'configured' : 'error');
    }).catch(function() { setStatus('error'); if (toast) toast('Erro ao verificar token GitHub.', 'error'); });
  }, [toast]);
  return (
    <Card className="p-4 flex flex-col gap-2">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Token GitHub Actions</p>
      <div className="rounded-xl p-3 text-xs leading-relaxed flex flex-col gap-2" style={{background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.15)'}}>
        <p className="font-semibold flex items-center gap-1.5" style={{color:'#16a34a'}}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
          Token movido para o servidor
        </p>
        <p style={{color:'var(--text-sub)'}}>
          O token GitHub agora e gerenciado pela Edge Function <code>trigger-apk-build</code> e nunca e exposto ao navegador. Para configurar ou atualizar, va em Settings &gt; Edge Functions no painel Supabase e defina a secret <code>GITHUB_TOKEN</code>.
        </p>
        <p className="font-semibold flex items-center gap-1.5" style={{color: status === 'checking' ? '#d97706' : (status === 'configured' ? '#16a34a' : '#dc2626')}}>
          <span className="w-2 h-2 rounded-full" style={{background: status === 'checking' ? '#d97706' : (status === 'configured' ? '#16a34a' : '#dc2626')}}/>
          {status === 'checking' ? 'Verificando...' : (status === 'configured' ? 'Edge Function ativa' : 'Token nao configurado — configure GH_TOKEN no Supabase')}
        </p>
      </div>
    </Card>
  );
}
