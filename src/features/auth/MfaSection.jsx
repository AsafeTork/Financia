import React, { useState, useEffect, useCallback } from 'react';
import { Spin } from '../../shared/ui/ui.jsx';
import { sb } from '../../lib/supabase.js';

// MFA TOTP (Supabase Auth nativo) — verificação em duas etapas
// - Enroll: sb.auth.mfa.enroll({ factorType: 'totp', friendlyName })
//   retorna QR code (base64) + secret para cadastro manual em autenticador.
// - Verify: challengeAndVerify({ factorId, code }) valida o 6 dígitos do app
//   autenticador e confirma o fator (upgrade de sessão para AAL2).
// - List/unenroll: listFactors() / unenroll({ factorId }).
// - Fallback SEMPRE disponível: o fator é uma camada extra opcional —
//   senha e passkey continuam funcionando sem ele (opt-in por segurança).
// UI acessível: rótulos, instruções claras, status via aria-live (role=alert),
// touch targets >= 44px e foco visível.

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

var TOTP_LABEL = function(d) {
  if (!d) return 'Autenticador (2FA)';
  var ts = d.created_at ? new Date(d.created_at) : null;
  var date = ts ? ts.toLocaleDateString('pt-BR') : '';
  return date ? 'Autenticador (2FA) — desde ' + date : 'Autenticador (2FA)';
};

function friendlyError(e) {
  if (!e) return 'Falha ao executar operação.';
  var code = String((e.code || e.status || e.name || '')).toLowerCase();
  if (code.indexOf('invalid_totp') !== -1) return 'Código de verificação inválido. Confira o número de 6 dígitos do autenticador.';
  if (code.indexOf('factor_not_found') !== -1) return 'Fator de verificação não encontrado.';
  if (code.indexOf('unauthorized') !== -1) return 'Sessão expirada. Faça login novamente.';
  if (e.message) return e.message;
  return 'Falha ao executar operação.';
}

export default React.memo(function MfaSection({ brand, session }) {
  var brandColor = (brand && brand.color) || '#002f59';
  var [busy, setBusy] = useState(false);
  var [status, setStatus] = useState('');
  var [error, setError] = useState('');
  var [factors, setFactors] = useState(null);
  var [enrolling, setEnrolling] = useState(false);
  var [pending, setPending] = useState(null); // { factorId, qr_code, secret, uri }
  var [code, setCode] = useState('');

  var loadFactors = useCallback(async function() {
    if (!session) { setFactors([]); return; }
    var res = await sb.auth.mfa.listFactors();
    if (res.error) {
      setError(friendlyError(res.error));
      setFactors([]);
    } else {
      setFactors(res.data && res.data.totp ? res.data.totp : []);
    }
  }, [session]);

  useEffect(function() {
    loadFactors();
  }, [session, loadFactors]);

  var beginEnroll = async function() {
    setBusy(true); setError(''); setStatus('');
    setStatus('Gerando chave de segurança...');
    var res = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator app' });
    setBusy(false);
    if (res.error) {
      setError(friendlyError(res.error));
      setStatus('');
      return;
    }
    var d = res.data || {};
    var t = d.totp || {};
    setPending({ factorId: d.id, qr_code: t.qr_code || '', secret: t.secret || '', uri: t.uri || '' });
    setCode('');
    setEnrolling(true);
    setStatus('');
  };

  var cancelEnroll = async function() {
    setBusy(true);
    if (pending && pending.factorId) {
      var res = await sb.auth.mfa.unenroll({ factorId: pending.factorId });
      if (res.error) setError(friendlyError(res.error));
    }
    setBusy(false);
    setPending(null);
    setCode('');
    setEnrolling(false);
    setStatus('');
    await loadFactors();
  };

  var confirmCode = async function() {
    if (!pending || !pending.factorId) return;
    if (!/^\d{6}$/.test(String(code).trim())) {
      setError('Digite os 6 dígitos do autenticador.');
      return;
    }
    setBusy(true); setError(''); setStatus('');
    setStatus('Verificando código...');
    var res = await sb.auth.mfa.challengeAndVerify({ factorId: pending.factorId, code: String(code).trim() });
    setBusy(false);
    if (res.error) {
      setError(friendlyError(res.error));
      setStatus('');
      return;
    }
    setPending(null);
    setCode('');
    setEnrolling(false);
    setStatus('Verificação em duas etapas ativada com sucesso!');
    await loadFactors();
  };

  var handleRemove = useCallback(async function(d) {
    if (!window.confirm('Desativar a verificação em duas etapas? Sua conta ficará protegida apenas por senha/passkey.')) return;
    setBusy(true); setError(''); setStatus('');
    setStatus('Desativando 2FA...');
    var res = await sb.auth.mfa.unenroll({ factorId: d.id });
    setBusy(false);
    if (res.error) {
      setError(friendlyError(res.error));
      setStatus('');
    } else {
      setStatus('Verificação em duas etapas desativada.');
      await loadFactors();
    }
  }, [loadFactors]);

  if (!session) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Entre para gerenciar a verificação em duas etapas.</p>
      </div>
    );
  }

  var active = (factors || []).filter(function(f) { return f.status === 'verified'; });

  if (enrolling && pending) {
    return (
      <div className="flex flex-col gap-3 rounded-xl p-4" style={{ background: 'var(--bg-subtle)' }}>
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>Ativar verificação em duas etapas</h4>
        <p className="text-xs" style={{ color: 'var(--text-sub)' }}>
          Escaneie o QR code com o app autenticador (Google Authenticator, Microsoft Authenticator, Authy...) ou digite a chave manualmente. Depois confirme com o código de 6 dígitos.
        </p>
        {pending.qr_code && (
          <div className="flex items-center justify-center rounded-xl p-2 bg-white w-fit mx-auto">
            <img src={pending.qr_code} alt="QR code para configurar o autenticador" className="w-44 h-44" decoding="async" />
          </div>
        )}
        {pending.secret && (
          <div className="flex flex-col gap-1">
            <label htmlFor="mfa-secret" className="text-xs font-medium" style={{ color: 'var(--text-sub)' }}>Ou digite a chave manualmente</label>
            <div className="flex items-center gap-2">
              <input
                id="mfa-secret"
                readOnly
                value={pending.secret}
                onFocus={function(e) { e.target.select(); }}
                className="w-full rounded-lg px-3 py-2.5 text-sm font-mono tracking-wider min-h-[44px]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label htmlFor="mfa-code" className="text-xs font-medium" style={{ color: 'var(--text-sub)' }}>Código de 6 dígitos</label>
          <input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={function(e) { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); }}
            placeholder="000000"
            aria-label="Código de verificação do autenticador"
            className="w-full rounded-lg px-3 py-2.5 text-sm tracking-[0.3em] text-center min-h-[44px]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={confirmCode}
            disabled={busy || code.length !== 6}
            className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition hover:opacity-90 min-h-[44px]"
            style={{ background: brandColor, color: '#fff' }}
          >
            {busy ? <Spin white /> : <span>Confirmar e ativar</span>}
          </button>
          <button
            type="button"
            onClick={cancelEnroll}
            disabled={busy}
            className="w-full rounded-xl py-3 text-sm font-medium transition min-h-[44px]"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sub)', background: 'var(--bg-card)' }}
          >
            Cancelar
          </button>
        </div>
        {(!!error || !!status) && (
          <div className="flex flex-col gap-1">
            {error && <ErrMsg>{error}</ErrMsg>}
            {status && <StatusMsg>{status}</StatusMsg>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>Verificação em duas etapas (2FA)</h4>
        {active.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}>
            Ativa
          </span>
        )}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-sub)' }}>
        Proteja sua conta com um código gerado por app autenticador a cada novo login. Senha e passkey continuam funcionando como fallback.
      </p>

      {active.length === 0 && !enrolling && (
        <button
          type="button"
          onClick={beginEnroll}
          disabled={busy}
          className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition hover:opacity-90 min-h-[44px]"
          style={{ background: brandColor, color: '#fff' }}
        >
          {busy ? <Spin white /> : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
          )}
          <span>{busy ? 'Preparando...' : 'Ativar verificação em duas etapas'}</span>
        </button>
      )}

      {active.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {active.map(function(d) {
            return (
              <div key={String(d.id)} className="flex items-center justify-between gap-3 p-2.5 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>{TOTP_LABEL(d)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-sub)' }}>Gera um código a cada novo login</p>
                </div>
                <button
                  type="button"
                  onClick={function() { handleRemove(d); }}
                  disabled={busy}
                  aria-label="Desativar verificação em duas etapas"
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium min-h-[44px] min-w-[44px] flex items-center justify-center transition hover:opacity-80"
                  style={{ background: 'rgba(239,68,68,0.09)', color: '#ef4444' }}
                >
                  Desativar
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
