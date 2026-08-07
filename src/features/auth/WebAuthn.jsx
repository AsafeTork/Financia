import React, { useState, useCallback, useEffect } from 'react';
import { Spin } from '../../shared/ui/ui.jsx';
import { registerPasskey, signInWithPasskey, listPasskeys, deletePasskey, isWebAuthnSupported } from '../../lib/auth.js';

// WebAuthn / Passkey — WCAG 3.3.8 (auth acessível)
// - Login passwordless via credencial descobrível (discoverable credential): o
//   app NÃO pede e-mail/senha; o authenticator resolve a conta da credencial.
// - Registro opcional pós-login (gerencia em Configurações → Conta).
// - Fallback para senha SEMPRE disponível (progressive enhancement): a passkey é
//   uma alternativa, nunca a única forma de entrar/sair.
// - UI acessível: rótulos, instruções claras, status via aria-live (role=alert),
//   touch targets >= 44px e foco visível.
// Usa o motor nativo do Supabase Auth (ver DECISIONS.md D017) — nenhuma EF customizada.

function StatusMsg({ children }) {
  return (
    <p role="status" aria-live="polite" className="text-xs" style={{ color: 'var(--text-sub)' }}>
      {children}
    </p>
  );
}

function ErrMsg({ children }) {
  return (
    <p role="alert" aria-live="assertive" className="text-xs" style={{ color: '#ef4444' }}>
      {children}
    </p>
  );
}

var PASSKEY_LABEL = function(d) {
  // friendly, non-revealing label (nunca expor o raw credentialId ao usuário)
  if (!d) return 'Passkey';
  var ts = d.created_at ? new Date(d.created_at) : null;
  var date = ts ? ts.toLocaleDateString('pt-BR') : '';
  var device = d.device_type ? (d.device_type === 'platform' ? 'dispositivo' : 'chave externa') : '';
  var parts = [date, device].filter(Boolean);
  return parts.length ? 'Passkey (' + parts.join(' • ') + ')' : 'Passkey';
};

export default React.memo(function WebAuthn({ mode, brand, session, onSuccess, onStatus }) {
  mode = mode || 'login';
  var supported = isWebAuthnSupported();
  var [busy, setBusy] = useState(false);
  var [status, setStatus] = useState('');
  var [error, setError] = useState('');
  var [passkeys, setPasskeys] = useState(null);
  var [actionLabel, setActionLabel] = useState('');

  var brandColor = (brand && brand.color) || '#002f59';

  var setStatusMsg = useCallback(function(msg) {
    setStatus(msg || '');
    if (onStatus) onStatus(msg || '');
  }, [onStatus]);

  var loadPasskeys = useCallback(async function() {
    if (!session) { setPasskeys([]); return; }
    setStatusMsg('Carregando credenciais...');
    var res = await listPasskeys();
    if (res.error) {
      setError(res.message);
      setPasskeys([]);
    } else {
      setPasskeys((res.data && res.data.keys) || []);
    }
    setStatusMsg('');
  }, [session, setStatusMsg]);

  useEffect(function() {
    if (mode === 'register') loadPasskeys();
  }, [mode, session, loadPasskeys]);

  var beginSignIn = async function() {
    setBusy(true); setError('');
    setStatusMsg('Abrindo sua credencial...');
    var res = await signInWithPasskey();
    setBusy(false);
    if (res.error) {
      setError(res.message);
      setStatusMsg('');
    } else {
      setStatusMsg('Login concluído.');
      if (onSuccess) onSuccess(res.data);
    }
  };

  var beginRegister = async function() {
    if (!session) { setError('Faça login para registrar uma passkey.'); return; }
    setBusy(true); setError('');
    setStatusMsg('Preparando o cadastro da credencial...');
    var res = await registerPasskey();
    setBusy(false);
    if (res.error) {
      setError(res.message);
      setStatusMsg('');
    } else {
      setStatusMsg('Passkey cadastrada com sucesso!');
      await loadPasskeys();
      if (onStatus) onStatus('Passkey cadastrada com sucesso!');
    }
  };

  var handleDelete = useCallback(async function(d) {
    if (!confirm('Remover esta passkey? Você continuará entrando com senha ou outra passkey.')) return;
    setBusy(true); setError('');
    setStatusMsg('Removendo credencial...');
    var res = await deletePasskey(d.id || d.credential_id || d.credentialId);
    setBusy(false);
    if (res.error) {
      setError(res.message);
      setStatusMsg('');
    } else {
      setStatusMsg('Passkey removida.');
      await loadPasskeys();
      if (onStatus) onStatus('Passkey removida.');
    }
  }, [setStatusMsg, onStatus, loadPasskeys]);

  // ---- Login (passwordless) ----
  if (mode === 'login') {
    if (!supported) {
      return (
        <div className="flex flex-col gap-2">
          <StatusMsg>Login por passkey não disponível neste navegador. Use e-mail e senha ou Google.</StatusMsg>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={beginSignIn}
          disabled={busy}
          aria-label="Entrar com passkey (biometria, PIN ou chave de segurança)"
          className="w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition hover:opacity-90 min-h-[44px]"
          style={{ background: 'var(--brand-soft)', color: 'var(--text-main)' }}
        >
          {busy ? <Spin size="sm" /> : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 14.5V7m0 0l-3.5 3.5M12 7l3.5 3.5" /><path d="M2 12h20" /></svg>
          )}
          <span>{busy ? 'Entrando...' : 'Entrar com passkey'}</span>
        </button>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Usar biometria, PIN ou chave de segurança. <b>Tem senha?</b> Entre com e-mail e senha abaixo.
        </p>
        {(!!error || !!status) && (
          <div className="flex flex-col gap-1">
            {error && <ErrMsg>{error}</ErrMsg>}
            {status && <StatusMsg>{status}</StatusMsg>}
          </div>
        )}
      </div>
    );
  }

  // ---- Register / gerenciamento (exige sessão ativa) ----
  if (!session) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Entre para gerenciar suas credenciais de passkey.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--text-main)' }}>Login por passkey</h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Senha de acesso também disponível</span>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-sub)' }}>
        Credenciais registradas resolvem sua conta automaticamente (login sem senha). A senha continua ativa como fallback.
      </p>

      <button
        type="button"
        onClick={beginRegister}
        disabled={busy}
        className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition hover:opacity-90 min-h-[44px]"
        style={{ background: brandColor, color: '#fff' }}
      >
        {busy ? <Spin white /> : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        )}
        <span>{busy ? 'Cadastrando...' : 'Adicionar passkey'}</span>
      </button>

      {!!passkeys && passkeys.length === 0 && !error && (
        <StatusMsg>Nenhuma credencial registrada. Cadastre uma passkey para entrar sem senha.</StatusMsg>
      )}

      {!!passkeys && passkeys.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {passkeys.map(function(d) {
            var label = PASSKEY_LABEL(d);
            var credId = d.id || d.credential_id || d.credentialId;
            return (
              <div key={String(credId)} className="flex items-center justify-between gap-3 p-2.5 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>{label}</p>
                </div>
                <button
                  type="button"
                  onClick={function() { handleDelete(d); }}
                  disabled={busy}
                  aria-label={'Remover ' + label}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium min-h-[44px] min-w-[44px] flex items-center justify-center transition hover:opacity-80"
                  style={{ background: 'rgba(239,68,68,0.09)', color: '#ef4444' }}
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      )}

      {(!!error || !!status) && (
        <div className="flex flex-col gap-1">
          {error && <ErrMsg>{error}</ErrMsg>}
          {status && <StatusMsg>{status}</StatusMsg>}
        </div>
      )}
    </div>
  );
});
