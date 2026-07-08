import React from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { friendlyStripeError, friendlyStripeClientError } from '../../lib/stripe.js';
import { fmt } from '../../lib/utils.js';
import { sb } from '../../lib/supabase.js';
import { Spin } from './ui.jsx';
import CardPreview from './CardPreview.jsx';
import useStripeCheckoutInit from '../hooks/useStripeCheckoutInit.js';

function confirmLabel(ctaKind) {
  if (ctaKind === 'upgrade') return 'Confirmar upgrade';
  if (ctaKind === 'downgrade') return 'Confirmar mudança';
  return 'Confirmar assinatura';
}

function PaymentForm({ plan, brand, onDone, onClose, mode }) {
  var stripe = useStripe();
  var elements = useElements();
  var [submitting, setSubmitting] = React.useState(false);
  var [payErr, setPayErr] = React.useState('');

  var submit = async function(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setPayErr('');
    try {
      var sub = await elements.submit();
      if (sub.error) { setPayErr(sub.error.message || 'Verifique os dados do cartão.'); setSubmitting(false); return; }
      var res = await stripe.confirmPayment({
        elements: elements,
        confirmParams: { return_url: window.location.origin + '/?checkout=success#planos' },
        redirect: 'if_required',
      });
      if (res.error) {
        setPayErr(friendlyStripeClientError(res.error));
        setSubmitting(false);
        return;
      }
      if (mode === 'payment') {
        try { await sb.functions.invoke('create-payment', { body: { kind: 'white_label', confirm_white_label: true } }); } catch (e) { void e; }
      } else {
        try { await sb.functions.invoke('create-subscription', { body: { confirm_subscription: true } }); } catch (e) { void e; }
      }
      onDone();
      onClose();
    } catch (err) {
      setPayErr(friendlyStripeError(err && err.message ? err.message : 'payment_failed'));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {payErr && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
          <p className="text-xs font-medium text-red-600">{payErr}</p>
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} disabled={submitting} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
        <button type="submit" disabled={!stripe || submitting} className="flex-1 text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition" style={{ background: brand.color }}>
          {submitting ? <Spin white /> : ('Pagar ' + fmt(plan.price))}
        </button>
      </div>
      <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>{mode === 'payment' ? 'Pagamento único e seguro, processado pela Stripe.' : 'Pagamento seguro processado pela Stripe. Você pode cancelar quando quiser.'}</p>
    </form>
  );
}

export default function StripeCheckout({ plan, brand, onClose, onDone, toast, mode, ctaKind }) {
  var checkoutMode = mode === 'payment' ? 'payment' : 'subscription';
  var kind = ctaKind || 'subscribe';
  var ctrl = useStripeCheckoutInit(plan, brand, checkoutMode, kind, onDone, onClose, toast);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 anim-fade" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}>
      <div className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col anim-scale" style={{ background: 'var(--bg-card)', maxHeight: '92vh', boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            <span className="font-semibold text-gray-900">{ctrl.headerTitle}</span>
            <p className="text-xs text-gray-400">{fmt(plan.price)}{plan.period || (checkoutMode === 'payment' ? ' (única)' : '/mês')}</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {ctrl.phase === 'loading' && (
            <div className="flex flex-col gap-3">
              <div className="skeleton" style={{ height: 44 }} />
              <div className="skeleton" style={{ height: 44 }} />
              <div className="skeleton" style={{ height: 48 }} />
            </div>
          )}

          {ctrl.phase === 'error' && (
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <p className="text-sm font-medium" style={{ color: 'var(--text-sub)' }}>{ctrl.loadErr}</p>
              <div className="flex gap-2">
                <button onClick={onClose} className="text-sm font-semibold px-5 py-2.5 rounded-xl border min-h-[44px]" style={{ borderColor: 'var(--border)', color: 'var(--text-sub)' }}>Fechar</button>
                <button onClick={ctrl.retry} className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white min-h-[44px]" style={{ background: brand.color }}>Tentar de novo</button>
              </div>
            </div>
          )}

          {(ctrl.phase === 'saved' || ctrl.phase === 'change') && !ctrl.useOtherCard && (
            <div className="flex flex-col gap-4">
              {ctrl.isChange && (
                <p className="text-sm" style={{ color: 'var(--text-sub)' }}>
                  {kind === 'upgrade' ? 'Você vai subir para o ' : 'Você vai mudar para o '}<span className="font-semibold" style={{ color: 'var(--text-main)' }}>{plan.name}</span>. Cobrado no cartão salvo, com ajuste proporcional.
                </p>
              )}
              {ctrl.card ? <CardPreview card={ctrl.card} brand={brand} /> : (
                <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Confirme para concluir.</p>
              )}
              {ctrl.actionErr && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                  <p className="text-xs font-medium text-red-600">{ctrl.actionErr}</p>
                </div>
              )}
              <button onClick={function() { if (checkoutMode === 'payment') { ctrl.runWhiteLabelSaved(); } else { ctrl.runSubscription(ctrl.phase === 'saved'); } }} disabled={ctrl.confirming}
                className="w-full text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition" style={{ background: brand.color }}>
                {ctrl.confirming ? <Spin white /> : (checkoutMode === 'payment' ? ('Pagar ' + fmt(plan.price)) : confirmLabel(kind))}
              </button>
              {ctrl.phase === 'saved' && (
                <button onClick={function() { ctrl.setUseOtherCard(true); ctrl.setActionErr(''); ctrl.startNewCardFromSaved(); }} disabled={ctrl.confirming}
                  className="text-xs font-semibold text-center transition hover:opacity-70 disabled:opacity-50" style={{ color: brand.color }}>
                  Usar outro cartão
                </button>
              )}
              <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>Pagamento seguro processado pela Stripe. Você pode cancelar quando quiser.</p>
            </div>
          )}

          {ctrl.phase === 'form' && ctrl.options && ctrl.stripePromise && (
            <Elements stripe={ctrl.stripePromise} options={ctrl.options}>
              <PaymentForm plan={plan} brand={brand} onDone={ctrl.done} onClose={onClose} mode={checkoutMode} />
            </Elements>
          )}
          {ctrl.phase === 'form' && (!ctrl.options || !ctrl.stripePromise) && (
            <div className="flex flex-col gap-3">
              <div className="skeleton" style={{ height: 44 }} />
              <div className="skeleton" style={{ height: 48 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
