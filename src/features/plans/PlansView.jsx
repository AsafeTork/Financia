import React, { useState, useEffect } from 'react';
import { Card, PageHead, Modal } from '../../shared/ui/ui.jsx';
import { PRICING_PLANS, WHITELABEL, waLink, effectivePlan, planChangeCta, PLAN_VISUAL_DEFAULTS } from '../../lib/constants.js';
import { fmt, fmtDate, brandAlpha } from '../../lib/utils.js';
import { sb } from '../../lib/supabase.js';
import { friendlyStripeError, readFnErrorMessage } from '../../lib/stripe.js';
import StripeCheckout from '../../shared/ui/StripeCheckout.jsx';

var CheckIcon = function({ color }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7"/>
    </svg>
  );
};

var SparkleIcon = function({ className }) {
  return (
    <svg className={className || 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>
    </svg>
  );
};

var CrownIcon = function({ className }) {
  return (
    <svg className={className || 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
      <path d="M5 18h14v2H5v-2z"/>
    </svg>
  );
};

// Texto do botao conforme a acao decidida por planChangeCta.
function ctaLabel(kind, plan) {
  if (kind === 'subscribe') return 'Assinar ' + plan.name;
  if (kind === 'upgrade') return 'Fazer upgrade';
  if (kind === 'downgrade') return 'Mudar para ' + plan.name;
  if (kind === 'cancel') return 'Voltar para o Gratis';
  return 'Seu plano atual';
}

// Badge do plano no card
function PlanBadge({ planId }) {
  if (planId === 'pro') {
    return (
      <span className="badge-plan text-[10px] font-bold px-2 py-0.5 rounded-full">PRO</span>
    );
  }
  if (planId === 'premium') {
    return (
      <span className="badge-plan text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
        <CrownIcon className="w-3 h-3"/>
        PREMIUM
      </span>
    );
  }
  return null;
}

function PlanCard({ plan, brand, cta, onAction, planExpiresAt, currentPlanId, planActivatedBy, subStatus, onCancel }) {
  var popular = !!plan.popular;
  var isFree = plan.id === 'free';
  var isPro = plan.id === 'pro';
  var isPremium = plan.id === 'premium';
  var priceNote = isFree ? 'gratis para sempre, sem cartao' : 'cobrado mensalmente, cancele quando quiser';
  var current = cta.kind === 'current';
  var kind = cta.kind;
  var cardIdentity = 'card-plan-' + plan.id;
  var planVisual = PLAN_VISUAL_DEFAULTS[plan.id] || PLAN_VISUAL_DEFAULTS.free;

  return (
    <div className={'relative rounded-2xl overflow-hidden transition-all ' + cardIdentity} style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      boxShadow: current ? 'var(--plan-shadow-elevated)' : 'var(--plan-shadow)'
    }}>
      {!isFree && (
        <div className="h-1 w-full" style={{background: planVisual.color}}/>
      )}

      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isFree && <PlanBadge planId={plan.id}/>}
            {popular && !current && (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full text-white shadow-sm btn-plan-grad">
                Mais escolhido
              </span>
            )}
          </div>
          {current && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{
              background: 'var(--brand-soft)',
              color: brand.color
            }}>Seu plano</span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-xl font-bold truncate" style={{color:'var(--text-main)'}}>
              {plan.name}
            </p>
            {isPremium && <CrownIcon className="w-5 h-5 flex-shrink-0" style={{color: 'var(--plan-gold, #D4AF6A)'}}/>}
            {isPro && <SparkleIcon className="w-5 h-5 flex-shrink-0" style={{color: 'var(--plan-accent, #60A5FA)'}}/>}
          </div>
          <p className="text-xs mt-1" style={{color:'var(--text-sub)'}}>{plan.tagline}</p>
        </div>

        <div>
          <div className="flex items-end gap-1">
            <span className="font-display text-3xl font-bold" style={{color:'var(--text-main)'}}>
              {plan.price === 0 ? 'Gratis' : fmt(plan.price)}
            </span>
            {plan.period && <span className="text-sm mb-1" style={{color:'var(--text-sub)'}}>{plan.period}</span>}
          </div>
          {plan.original_price && plan.original_price > plan.price && (
            <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>
              De <span style={{textDecoration:'line-through'}}>{fmt(plan.original_price)}</span> por <b>{fmt(plan.price)}</b>/mes
            </p>
          )}
          <p className="text-xs mt-1.5" style={{color:'var(--text-sub)'}}>{priceNote}</p>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {plan.features.map(function(f) {
            var ladder = f.indexOf('Tudo do') === 0;
            var iconColor = isPremium ? 'var(--plan-gold, #D4AF6A)' : isPro ? 'var(--plan-accent, #60A5FA)' : planVisual.color;
            if (ladder) {
              return (
                <div key={f} className="flex items-center gap-2 pb-1.5 mb-0.5" style={{borderBottom:'1px dashed var(--border)'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                  <span className="text-sm font-bold" style={{color:'var(--text-main)'}}>{f}</span>
                </div>
              );
            }
            return (
              <div key={f} className="flex items-start gap-2">
                <CheckIcon color={iconColor}/>
                <span className="text-sm" style={{color:'var(--text-main)'}}>{f}</span>
              </div>
            );
          })}
        </div>

        {/* Botoes de acao */}
        {current && (
          <div className="mt-1 flex flex-col gap-1.5">
            <div className="text-center text-sm font-semibold px-4 py-3 rounded-xl min-h-[44px] flex items-center justify-center" style={{background:'var(--brand-soft)', color: brand.color}}>Seu plano atual</div>
            {!isFree && subStatus && subStatus.status === 'canceled_expiring' && subStatus.current_period_end && (
              <p className="text-xs text-center" style={{color:'#d97706'}}>
                Cancelada - expira em {fmtDate(new Date(Number(subStatus.current_period_end) * 1000).toISOString().slice(0, 10))}
              </p>
            )}
            {!isFree && subStatus && subStatus.status === 'active' && (
              <button type="button" onClick={onCancel}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg border transition hover:opacity-80 min-h-[44px] flex items-center justify-center gap-1.5"
                style={{borderColor:'#fca5a5', color:'#dc2626'}}>
                Cancelar assinatura
              </button>
            )}
          </div>
        )}
        {(kind === 'subscribe' || kind === 'upgrade') && (
          <button type="button" onClick={function() { onAction(plan, kind); }}
            className="mt-1 w-full text-sm font-semibold px-4 py-3 rounded-xl text-white transition hover:opacity-90 min-h-[44px] flex items-center justify-center gap-2 btn-plan-grad"
            style={{background: planVisual.color}}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            {ctaLabel(kind, plan)}
          </button>
        )}
        {kind === 'downgrade' && (
          <button type="button" onClick={function() { onAction(plan, kind); }}
            className="mt-1 w-full text-sm font-semibold px-4 py-3 rounded-xl transition hover:opacity-80 min-h-[44px] flex items-center justify-center gap-2"
            style={{background: brandAlpha(planVisual.color, 0.08), color: planVisual.color}}>
            {ctaLabel(kind, plan)}
          </button>
        )}
        {kind === 'cancel' && (
          <button type="button" onClick={function() { onAction(plan, kind); }}
            className="mt-1 w-full text-sm font-semibold px-4 py-3 rounded-xl border transition hover:bg-gray-50 min-h-[44px] flex items-center justify-center"
            style={{borderColor:'var(--border)', color:'var(--text-sub)'}}>
            {ctaLabel(kind, plan)}
          </button>
        )}
      </div>
    </div>
  );
}

var ADMIN_TEST_PRICE = 0.50;

export default function PlansView({ brand, planInfo, toast, onNav, isAdmin }) {
  var plan = effectivePlan(planInfo);
  var checkoutState = useState(null);
  var checkout = checkoutState[0];
  var setCheckout = checkoutState[1];
  var cancelState = useState(false);
  var cancelOpen = cancelState[0];
  var setCancelOpen = cancelState[1];
  var cancellingState = useState(false);
  var cancelling = cancellingState[0];
  var setCancelling = cancellingState[1];
  var customCents = planInfo && planInfo.custom_price_cents ? planInfo.custom_price_cents : 0;
  var customProCents = planInfo && planInfo.custom_price_cents_pro ? planInfo.custom_price_cents_pro : 0;
  var customPremiumCents = planInfo && planInfo.custom_price_cents_premium ? planInfo.custom_price_cents_premium : 0;
  var customWlCents = planInfo && planInfo.custom_price_cents_white_label ? planInfo.custom_price_cents_white_label : 0;
  var isAdminTest = !!isAdmin;
  var wlDiscountReais = customWlCents > 0 ? customWlCents / 100 : 0;
  var whiteLabelPrice = isAdminTest ? ADMIN_TEST_PRICE : (wlDiscountReais > 0 ? wlDiscountReais : WHITELABEL.price);
  var wlOriginalPrice = (wlDiscountReais > 0 && wlDiscountReais < WHITELABEL.price) ? WHITELABEL.price : null;
  var wlPlan = { id: 'white_label', name: 'Personalizacao', price: whiteLabelPrice, period: '' };
  var wlState = useState(false);
  var wlOpen = wlState[0];
  var setWlOpen = wlState[1];
  var hasWhiteLabel = !!(brand && brand.white_label);
  var wlMsg = 'Ola! Quero o app personalizado da minha empresa (logo, nome e cores). Pode me passar como funciona?';
  var duvidaMsg = 'Ola! Tenho uma duvida sobre o Financia.';


  var [subStatus, setSubStatus] = useState(null);

  useEffect(function() {
    if (plan === 'free') return;
    var alive = true;
    sb.functions.invoke('get-subscription-status', { body: {} }).then(function(res) {
      if (!alive) return;
      var d = res && res.data ? res.data : null;
      if (d && d.status) setSubStatus(d);
    }).catch(function() {});
    return function() { alive = false; };
  }, [plan]);

  // Decide o que fazer ao clicar no botao de um plano.
  var handleAction = function(p, kind) {
    if (kind === 'cancel') { setCancelOpen(true); return; }
    setCheckout({ plan: p, kind: kind });
  };

  var confirmCancel = async function() {
    setCancelling(true);
    try {
      var res = await sb.functions.invoke('cancel-subscription', { body: {} });
      var data = res && res.data ? res.data : null;
      if (!data || !data.ok) {
        var errMsg = '';
        if (data && data.error) {
          errMsg = data.error;
        } else {
          errMsg = await readFnErrorMessage(res, data);
        }
        if (toast) toast(friendlyStripeError(errMsg || 'Erro ao cancelar'), 'error');
        setCancelling(false);
        return;
      }
      var msg = 'Assinatura cancelada.';
      if (data.status === 'no_subscription') {
        msg = 'Nenhuma assinatura ativa encontrada para cancelar.';
        if (toast) toast(msg, 'warning');
        setCancelling(false);
        setCancelOpen(false);
        return;
      }
      if (data.cancel_at) {
        var d = new Date(Number(data.cancel_at) * 1000);
        var dateStr = d.toLocaleDateString('pt-BR');
        msg += ' Voce mantem o plano atual ate ' + dateStr + ' e depois volta para o Gratis.';
      } else {
        msg += ' Voce fica no plano atual ate o fim do periodo ja pago.';
      }
      if (toast) toast(msg, 'success');
      setCancelling(false);
      setCancelOpen(false);
    } catch (e) {
      if (toast) toast('Erro ao cancelar. Tente de novo.', 'error');
      setCancelling(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-20 lg:pb-0">
      {/* Voltar */}
      <button type="button" onClick={function() { try { sessionStorage.setItem('financia_settings_tab', 'subscription');         } catch (e) { void e; } if (onNav) onNav('settings'); }}
        className="self-start inline-flex items-center gap-1.5 text-sm font-semibold min-h-[44px] px-2 -ml-2 rounded-xl transition hover:opacity-70"
        style={{color:'var(--text-sub)'}}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        Voltar para Assinatura
      </button>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <PageHead
          icon="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
          color={brand.color}
          title="Planos e personalizacao"
          sub="Escolha o plano ou tenha o app com a cara da sua empresa"
        />
      </div>

      {/* Preco especial customizado */}
      {(customCents > 0 || customProCents > 0 || customPremiumCents > 0) && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:'var(--brand-soft)', border:'1px solid var(--border)'}}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: brand.color}}>
            <svg className="w-5 h-5" fill="none" stroke="#ffffff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6M9.5 9h.01M14.5 15h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{color: brand.color}}>Voce tem um preco especial</p>
            <p className="text-xs" style={{color:'var(--text-sub)'}}>
              {customProCents > 0 && <span>Pro: <b>{fmt(customProCents / 100)}/mes</b>{customPremiumCents > 0 ? ' - ' : ''}</span>}
              {customPremiumCents > 0 && <span>Premium: <b>{fmt(customPremiumCents / 100)}/mes</b></span>}
              {customProCents <= 0 && customPremiumCents <= 0 && customCents > 0 && <span>Combinado com voce: <b>{fmt(customCents / 100)}/mes</b> no plano que assinar.</span>}
            </p>
          </div>
        </div>
      )}

      {/* Admin test mode */}
      {isAdminTest && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:'#ecfeff', border:'1px solid #a5f3fc'}}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'#0891b2'}}>
            <svg className="w-5 h-5" fill="none" stroke="#ffffff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{color:'#0e7490'}}>Modo de teste admin ativo</p>
            <p className="text-xs" style={{color:'#155e75'}}>Cobranca de teste: <b>R$ 0,01</b>.</p>
          </div>
        </div>
      )}

      {/* Cards de planos */}
      <div className="flex flex-col gap-4">
        {PRICING_PLANS.map(function(p) {
          var price = p.price;
          var originalPrice = null;
          if (p.id === 'pro' && customProCents > 0) { originalPrice = p.price; price = customProCents / 100; }
          if (p.id === 'premium' && customPremiumCents > 0) { originalPrice = p.price; price = customPremiumCents / 100; }
          var planCard = Object.assign({}, p, { price: price, original_price: originalPrice });
          return <PlanCard key={p.id} plan={planCard} brand={brand} cta={planChangeCta(plan, p.id)} onAction={handleAction}
            planExpiresAt={planInfo && planInfo.plan_expires_at} currentPlanId={plan}
            planActivatedBy={planInfo && planInfo.plan_activated_by}
            subStatus={planCard.id === plan ? subStatus : null}
            onCancel={function() { setCancelOpen(true); }}/>;
        })}
      </div>



      {/* Checkout */}
      {checkout && (
        <StripeCheckout plan={checkout.plan} ctaKind={checkout.kind} brand={brand} toast={toast}
          onClose={function() { setCheckout(null); }}/>
      )}

      {/* Cancelamento */}
      {cancelOpen && (
        <Modal title="Cancelar assinatura" onClose={function() { setCancelOpen(false); }}
          onSave={confirmCancel} saving={cancelling} saveLabel="Confirmar cancelamento"
          color="#dc2626">
          <div className="flex flex-col gap-3">
            <p className="text-sm" style={{color:'var(--text-main)'}}>
              Voce voltara para o plano Gratis ao fim do periodo ja pago. Seus dados continuam salvos.
            </p>
            {planInfo && planInfo.plan_expires_at && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{background:'#fffbeb', border:'1px solid #fde68a'}}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#d97706" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{color:'#92400e'}}>Seu plano fica ativo ate {fmtDate(planInfo.plan_expires_at)}</p>
                  <p className="text-xs mt-0.5" style={{color:'#b45309'}}>Depois dessa data, voce volta automaticamente para o Gratis.</p>
                </div>
              </div>
            )}
            <p className="text-xs" style={{color:'var(--text-muted)'}}>
              Pode reativar quando quiser. Nenhuma cobranca nova sera feita.
            </p>
          </div>
        </Modal>
      )}

      {/* White-label */}
      {wlOpen && (
        <StripeCheckout plan={wlPlan} mode="payment" brand={brand} toast={toast}
          onClose={function() { setWlOpen(false); }}/>
      )}

      {/* Pacote white-label */}
      <div className="relative rounded-2xl overflow-hidden" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--plan-shadow-elevated)'
      }}>
        <div className="h-1 w-full" style={{background: brand.color}}/>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:'var(--brand-soft)'}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={brand.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z M12 12l8-4.5M12 12v9M12 12L4 7.5"/>
              </svg>
            </div>
            <div>
              <p className="font-display text-lg font-semibold" style={{color:'var(--text-main)'}}>App da sua empresa</p>
              <p className="text-xs mt-0.5" style={{color:'var(--text-sub)'}}>{WHITELABEL.tagline}</p>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <span className="font-display text-3xl font-bold" style={{color:'var(--text-main)'}}>{fmt(whiteLabelPrice)}</span>
            {wlOriginalPrice && <span className="text-sm mb-1 line-through" style={{color:'var(--text-muted)'}}>{fmt(wlOriginalPrice)}</span>}
            <span className="text-sm mb-1 font-semibold" style={{color: brand.color}}>pagamento unico</span>
          </div>

          <div className="flex flex-col gap-2">
            {WHITELABEL.features.map(function(f) {
              return (
                <div key={f} className="flex items-start gap-2">
                  <CheckIcon color={brand.color}/>
                  <span className="text-sm" style={{color:'var(--text-main)'}}>{f}</span>
                </div>
              );
            })}
          </div>

          {hasWhiteLabel ? (
            <div className="mt-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl min-h-[44px]" style={{background:'var(--brand-soft)', color: brand.color}}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              Personalizacao ativa - configure em Aparencia
            </div>
          ) : (
            <div className="mt-1 flex flex-col gap-2">
              <button type="button" onClick={function() { setWlOpen(true); }}
                className="w-full text-sm font-semibold px-4 py-3 rounded-xl text-white transition hover:opacity-90 min-h-[44px] flex items-center justify-center gap-2 btn-plan-grad"
                style={{background: 'var(--btn-grad, ' + brand.color + ')'}}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                Comprar personalizacao - {fmt(whiteLabelPrice)}
              </button>
              <a href={waLink(wlMsg)} target="_blank" rel="noopener noreferrer"
                className="text-center text-xs font-semibold transition hover:opacity-70" style={{color: brand.color}}>
                Prefere falar antes? Chamar no WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Contato */}
      <Card className="p-5 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:'var(--brand-soft)'}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={brand.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11 11 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
        </div>
        <div>
          <p className="font-display text-base font-semibold" style={{color:'var(--text-main)'}}>Duvidas ou quer negociar?</p>
          <p className="text-xs mt-1" style={{color:'var(--text-sub)'}}>Fale comigo no WhatsApp. Respondo pessoalmente.</p>
        </div>
        <a href={waLink(duvidaMsg)} target="_blank" rel="noopener noreferrer"
          className="text-sm font-semibold px-5 py-3 rounded-xl transition hover:opacity-90 min-h-[44px] flex items-center gap-2"
          style={{background:'var(--brand-soft)', color: brand.color}}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.477-.913z"/></svg>
          Falar no WhatsApp
        </a>
      </Card>
    </div>
  );
}
