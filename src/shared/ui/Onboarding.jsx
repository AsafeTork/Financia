import React from 'react';
import { Inp, Spin } from './ui.jsx';
import PhoneInput from './PhoneInput.jsx';
import Feedback from './Feedback.jsx';
import Tip from './Tip.jsx';
import { safe } from '../../lib/utils.js';
import { trackEvent } from '../../lib/analytics.js';

// Onboarding em etapas (wizard):
// - Indicador de progresso (segmentos + "Passo X de Y")
// - Tooltips contextuais explicando por que cada dado é necessário
// - Opção de pular ("Pular por agora") mantendo os dados já preenchidos
// - Progresso salvo entre sessões (localStorage por usuário)
// - Erros de validação inline + banner de erro amigável (com retry preservando valores)

var STORE_PREFIX = 'financia_onboarding_progress_';

function loadProgress(uid) {
  if (!uid) return null;
  try {
    var raw = localStorage.getItem(STORE_PREFIX + uid);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function saveProgress(uid, data) {
  if (!uid) return;
  try { localStorage.setItem(STORE_PREFIX + uid, JSON.stringify(data)); } catch (_) { /* ignore */ }
}

function clearProgress(uid) {
  if (!uid) return;
  try { localStorage.removeItem(STORE_PREFIX + uid); } catch (_) { /* ignore */ }
}

export default React.memo(function Onboarding({ brand, needsName, needsPhone, onSave, uid }) {
  React.useEffect(function() { trackEvent('onboarding_started'); }, []);
  var brandColor = (brand && brand.color) || '#002f59';
  var steps = [{ key: 'welcome', label: 'Boas-vindas' }];
  if (needsName) steps.push({ key: 'name', label: 'Empresa' });
  if (needsPhone) steps.push({ key: 'phone', label: 'Contato' });
  var total = steps.length;

  var [step, setStep] = React.useState(function() {
    var p = loadProgress(uid);
    if (!p) return 0;
    var s = Number(p.step) || 0;
    return Math.min(Math.max(s, 0), total - 1);
  });
  var [name, setName] = React.useState(function() {
    var p = loadProgress(uid);
    return (p && p.name) || '';
  });
  var [phoneValue, setPhoneValue] = React.useState(function() {
    var p = loadProgress(uid);
    return (p && p.phone && p.phone.e164) || '';
  });
  var [phoneData, setPhoneData] = React.useState({ e164: phoneValue, national: '', valid: !!phoneValue });
  var [nameErr, setNameErr] = React.useState('');
  var [phoneErr, setPhoneErr] = React.useState('');
  var [loading, setLoading] = React.useState(false);
  var [saveErr, setSaveErr] = React.useState('');
  var [offline, setOffline] = React.useState(false);

  function persist(nextStep) {
    saveProgress(uid, { step: nextStep, name: name, phone: phoneData });
  }

  function go(nextStep) {
    setStep(nextStep);
    setSaveErr(''); setOffline(false);
    persist(nextStep);
  }

  function finish(data) {
    setLoading(true); setSaveErr(''); setOffline(false);
    var isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return onSave(data).then(function() {
      trackEvent('onboarding_complete');
      clearProgress(uid);
    }).catch(function(err) {
      setLoading(false);
      setOffline(isOffline);
      setSaveErr(err && err.message
        ? err.message
        : (isOffline
          ? 'Você está sem conexão. Seus dados foram salvos no aparelho e sincronizam quando a internet voltar.'
          : 'Não foi possível salvar agora. Tente novamente — seus dados continuam preenchidos.'));
    });
  }

  function skip() {
    var data = {};
    var cleanName = safe(name).trim();
    if (needsName && cleanName) data.name = cleanName;
    if (needsPhone && phoneData.valid) data.phone = phoneData.e164;
    finish(data);
  }

  function submit(e) {
    e.preventDefault();
    var cleanName = safe(name).trim();
    if (needsName && !cleanName) { setNameErr('Informe o nome da sua empresa.'); return; }
    if (needsPhone && !phoneData.valid) { setPhoneErr('Informe um telefone válido com DDD.'); return; }
    var data = {};
    if (needsName) data.name = cleanName;
    if (needsPhone) data.phone = phoneData.e164;
    finish(data);
  }

  function next() {
    var cleanName = safe(name).trim();
    if (needsName && !cleanName) { setNameErr('Informe o nome da sua empresa.'); return; }
    go(step + 1);
  }

  var onName = React.useCallback(function onName(e) {
    setName(e.target.value);
    if (e.target.value.trim()) setNameErr('');
  }, []);

  var onPhone = React.useCallback(function onPhone(d) {
    setPhoneData(d);
    setPhoneValue(d.e164);
    if (d.valid) setPhoneErr('');
  }, []);

  var cur = steps[step];
  var isLast = step === total - 1;

  function PrimaryBtn({ onClick, label, submitBtn }) {
    return (
      <button type={submitBtn ? 'submit' : 'button'} onClick={onClick} disabled={loading}
        className="pressable w-full text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition hover:opacity-90 min-h-[44px]"
        style={{ background: brandColor }}>
        {loading ? <Spin white /> : label}
      </button>
    );
  }

  function GhostBtn({ onClick, label }) {
    return (
      <button type="button" onClick={onClick} disabled={loading}
        className="pressable flex-1 rounded-xl py-3 text-sm font-medium transition hover:opacity-80 min-h-[44px]"
        style={{ border: '1px solid var(--border)', color: 'var(--text-sub)' }}>
        {label}
      </button>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-sm anim-up">

        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-sub)' }}>
              {step === 0 ? 'Começando' : 'Passo ' + step + ' de ' + (total - 1)}
            </span>
            {total > 1 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{cur.label}</span>}
          </div>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step + 1}
            aria-label="Progresso do cadastro" className="flex gap-1.5">
            {steps.map(function(s, i) {
              var done = i <= step;
              return (
                <span key={s.key} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                  style={{ background: done ? brandColor : 'var(--border-md)', opacity: done ? 1 : 0.55 }} />
              );
            })}
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate aria-label="Cadastro inicial do Financia">
          {step === 0 && (
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--brand-soft)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={brandColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                </svg>
              </div>
              <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Bem-vindo ao Financia</h1>
              <p className="text-sm mt-2" style={{ color: 'var(--text-sub)' }}>
                {needsName && needsPhone ? 'Antes de começar, conte um pouco sobre você. Leva menos de 1 minuto.' : needsName ? 'Como se chama o seu negócio?' : needsPhone ? 'Falta só o seu telefone de contato.' : 'Tudo pronto — pode começar!'}
              </p>
            </div>
          )}

          {cur.key === 'name' && (
            <div className="flex flex-col gap-4">
              <Inp label="Nome da empresa" tip="Esse nome aparece no topo do app, no relatório e nos arquivos exportados."
                value={name} onChange={onName} placeholder="Ex: Padaria do João" error={nameErr} autoFocus />
            </div>
          )}

          {cur.key === 'phone' && (
            <div className="flex flex-col gap-4">
              <PhoneInput label="Telefone (com DDD)" tip="Usamos só para contato sobre seu plano — você pode trocar depois nas configurações."
                value={phoneValue} onChange={onPhone} error={phoneErr} autoFocus
                hint="Ex: (11) 91234-5678" />
            </div>
          )}

          {saveErr && (
            <Feedback type="error">
              {offline ? 'Você está sem conexão. Verifique sua internet e tente novamente — seus dados continuam preenchidos.' : saveErr}
            </Feedback>
          )}

          {step === 0 && (
            <div className="flex flex-col gap-3">
              {total === 1
                ? <PrimaryBtn submitBtn label="Começar" />
                : <PrimaryBtn onClick={function() { go(1); }} label="Começar" />}
              <GhostBtn onClick={skip} label="Pular por agora" />
            </div>
          )}

          {cur.key === 'name' && (
            <div className="flex flex-col gap-3">
              {isLast
                ? <PrimaryBtn submitBtn label="Concluir" />
                : <PrimaryBtn onClick={next} label="Continuar" />}
              <div className="flex gap-2">
                <GhostBtn onClick={function() { go(step - 1); }} label="Voltar" />
                <GhostBtn onClick={skip} label="Pular" />
              </div>
            </div>
          )}

          {cur.key === 'phone' && (
            <div className="flex flex-col gap-3">
              <PrimaryBtn submitBtn label="Concluir" />
              <div className="flex gap-2">
                <GhostBtn onClick={function() { go(step - 1); }} label="Voltar" />
                <GhostBtn onClick={skip} label="Pular" />
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                Criptografado
              </div>
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                LGPD
              </div>
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Rápido
              </div>
            </div>
            <p className="text-xs inline-flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              Seus dados ficam salvos com segurança
              <Tip text="Usamos seus dados apenas para personalizar o app e entrar em contato sobre seu plano. Nada é compartilhado com terceiros." />
            </p>
          </div>

          {!loading && (
            <p className="text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {total > 1 ? 'Você pode pular e preencher depois nas configurações.' : 'Suas informações podem ser alteradas a qualquer momento nas configurações.'}
            </p>
          )}
        </form>
      </div>
    </div>
  );
});
