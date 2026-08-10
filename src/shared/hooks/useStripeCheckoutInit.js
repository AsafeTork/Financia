import { useState, useEffect } from 'react';
import { getStripe, getPublishableKey, stripeAppearance, friendlyStripeError, friendlyStripeClientError, readFnErrorMessage } from '../../lib/stripe.js';
import { sb } from '../../lib/supabase.js';
import { isDarkTheme } from '../../lib/utils.js';
import { trackEvent } from '../../lib/analytics.js';

export default function useStripeCheckoutInit(plan, brand, checkoutMode, kind, onDone, onClose, toast) {
  var isChange = checkoutMode === 'subscription' && (kind === 'upgrade' || kind === 'downgrade');

  var [phase, setPhase] = useState('loading');
  var [clientSecret, setClientSecret] = useState('');
  var [loadErr, setLoadErr] = useState('');
  var [stripePromise, setStripePromise] = useState(null);
  var [card, setCard] = useState(null);
  var [confirming, setConfirming] = useState(false);
  var [actionErr, setActionErr] = useState('');
  var [attempt, setAttempt] = useState(0);
  var [requestId, setRequestId] = useState(function() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'checkout-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  });
  var [useOtherCard, setUseOtherCard] = useState(false);

  var retry = function() {
    setActionErr('');
    setUseOtherCard(false);
    setRequestId(function() {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      return 'checkout-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    });
    setAttempt(function(a) { return a + 1; });
  };

  var done = function(customMsg) {
    trackEvent('payment_success', { plan: plan && plan.id ? plan.id : 'white_label', mode: checkoutMode });
    if (checkoutMode === 'subscription') trackEvent('subscription_active', { plan: plan.id });
    var msg = customMsg;
    if (!msg) {
      if (checkoutMode === 'payment') msg = 'Pagamento recebido! Sua personalização será liberada em instantes.';
      else if (isChange) msg = 'Plano alterado! A mudança já está valendo.';
      else msg = 'Pagamento recebido! Seu plano será ativado em instantes.';
    }
    if (toast) toast(msg, 'success');
    if (typeof window !== 'undefined' && window.__financia_reload_plan) {
      window.__financia_reload_plan();
    }
    if (onDone) onDone();
    onClose();
  };

  var runWhiteLabelSaved = async function() {
    setConfirming(true);
    setActionErr('');
    try {
      var res = await sb.functions.invoke('create-payment', { body: { kind: 'white_label', use_saved_card: true, request_id: requestId } });
      var data = res && res.data ? res.data : null;
      if (data && data.status === 'paid') { done(); return; }
      if (data && data.clientSecret) {
        var stripe = await stripePromise;
        if (!stripe) { setActionErr('Não foi possível carregar o Stripe. Tente de novo.'); setConfirming(false); return; }
        var r = await stripe.handleNextAction({ clientSecret: data.clientSecret });
        if (r && r.error) { setActionErr(friendlyStripeClientError(r.error)); setConfirming(false); return; }
        if (data.paymentIntentId) {
          await sb.functions.invoke('create-payment', {
            body: {
              kind: 'white_label',
              confirm_white_label: true,
              payment_intent_id: data.paymentIntentId,
            },
          });
        }
        done();
        return;
      }
      var msg = await readFnErrorMessage(res, data);
      setActionErr(friendlyStripeError(msg));
      setConfirming(false);
    } catch (err) {
      readFnErrorMessage(err, null).then(function(msg) {
        setActionErr(friendlyStripeError(msg || '') || 'Erro ao processar pagamento. Tente de novo.');
      });
      setConfirming(false);
    }
  };

  var runSubscription = async function(useSaved) {
    setConfirming(true);
    setActionErr('');
    try {
      var body = { plan_id: plan.id, request_id: requestId };
      if (useSaved) body.use_saved_card = true;
      var res = await sb.functions.invoke('create-subscription', { body: body });
      var data = res && res.data ? res.data : null;
      if (data && (data.status === 'active' || data.status === 'changed' || data.status === 'unchanged')) {
        if (data.status === 'changed' && data.scheduled) {
          done('Downgrade agendado. Você mantém o plano atual até o fim do período já pago e depois muda automaticamente para o ' + plan.name + '.');
        } else {
          done();
        }
        return;
      }
      if (data && data.clientSecret && (data.requiresAction || useSaved || isChange)) {
        var stripe = await stripePromise;
        if (!stripe) { setActionErr('Nao foi possivel carregar o Stripe. Tente de novo.'); setConfirming(false); return; }
        var r = await stripe.handleNextAction({ clientSecret: data.clientSecret });
        if (r && r.error) { setActionErr(friendlyStripeClientError(r.error)); setConfirming(false); return; }
        try { await sb.functions.invoke('create-subscription', { body: { confirm_subscription: true } }); } catch (e) { void e; }
        done();
        return;
      }
      if (data && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setUseOtherCard(false);
        setPhase('form');
        setConfirming(false);
        return;
      }
      var msg = await readFnErrorMessage(res, data);
      setActionErr(friendlyStripeError(msg));
      setConfirming(false);
    } catch (err) {
      readFnErrorMessage(err, null).then(function(msg) {
        setActionErr(friendlyStripeError(msg || '') || 'Erro ao processar pagamento. Tente de novo.');
      });
      setConfirming(false);
    }
  };

  function startNewCardFromSaved() {
    setPhase('loading');
    if (checkoutMode === 'payment') {
      sb.functions.invoke('create-payment', { body: { kind: 'white_label', request_id: requestId } }).then(function(result) {
        var data = result && result.data ? result.data : null;
        if (data && data.clientSecret) { setClientSecret(data.clientSecret); setPhase('form'); return; }
        if (data && data.status === 'paid') { done(); return; }
        readFnErrorMessage(result, data).then(function(msg) { setLoadErr(friendlyStripeError(msg)); setPhase('error'); });
      }).catch(function(err) {
        readFnErrorMessage(err, null).then(function(msg) {
          setLoadErr(friendlyStripeError(msg || '') || 'Erro ao processar. Verifique sua internet e tente de novo.');
          setPhase('error');
        });
      });
      return;
    }
    sb.functions.invoke('create-subscription', { body: { plan_id: plan.id, request_id: requestId } }).then(function(result) {
      var data = result && result.data ? result.data : null;
      if (data && data.clientSecret) { setClientSecret(data.clientSecret); setPhase('form'); return; }
      if (data && (data.status === 'changed' || data.status === 'active' || data.status === 'unchanged')) { done(); return; }
      readFnErrorMessage(result, data).then(function(msg) { setLoadErr(friendlyStripeError(msg)); setPhase('error'); });
    }).catch(function(err) {
      readFnErrorMessage(err, null).then(function(msg) {
        setLoadErr(friendlyStripeError(msg || '') || 'Erro ao processar. Verifique sua internet e tente de novo.');
        setPhase('error');
      });
    });
  }

  useEffect(function() {
    var alive = true;
    var settled = false;
    var timer = null;
    var abort = new AbortController();
    setPhase('loading');
    setLoadErr('');
    setClientSecret('');

    var fail = function(msg) {
      if (!alive || settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      setLoadErr(msg);
      setPhase('error');
    };
    var toForm = function(cs) {
      if (!alive || settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      setClientSecret(cs);
      setPhase('form');
    };
    var toPreview = function(c, nextPhase) {
      if (!alive || settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      setCard(c);
      setPhase(nextPhase);
    };

    timer = setTimeout(function() {
      fail('O servidor está demorando para responder (pode estar reativando). Toque em Tentar de novo.');
    }, 30000);

    var startNewCardSubscription = function() {
      sb.functions.invoke('create-subscription', { body: { plan_id: plan.id, request_id: requestId }, signal: abort.signal }).then(function(result) {
        if (!alive || settled) return;
        var data = result && result.data ? result.data : null;
        if (data && data.clientSecret) { toForm(data.clientSecret); return; }
        if (data && (data.status === 'changed' || data.status === 'active' || data.status === 'unchanged')) { done(); return; }
        readFnErrorMessage(result, data).then(function(msg) { fail(friendlyStripeError(msg)); });
      }).catch(function(err) {
        readFnErrorMessage(err, null).then(function(msg) {
          fail(friendlyStripeError(msg || '') || 'Erro ao processar. Verifique sua internet e tente de novo.');
        });
      });
    };

    var startNewCardPayment = function() {
      sb.functions.invoke('create-payment', { body: { kind: 'white_label', request_id: requestId }, signal: abort.signal }).then(function(result) {
        if (!alive || settled) return;
        var data = result && result.data ? result.data : null;
        if (data && data.clientSecret) { toForm(data.clientSecret); return; }
        if (data && data.status === 'paid') { done(); return; }
        readFnErrorMessage(result, data).then(function(msg) { fail(friendlyStripeError(msg)); });
      }).catch(function(err) {
        readFnErrorMessage(err, null).then(function(msg) {
          fail(friendlyStripeError(msg || '') || 'Erro ao processar. Verifique sua internet e tente de novo.');
        });
      });
    };

    getPublishableKey().then(function(key) {
      if (!alive || settled) return;
      if (!key) {
        fail('Chave pública do Stripe ausente. Defina STRIPE_PUBLISHABLE_KEY (pk_...) nos secrets do Supabase ou VITE_STRIPE_PUBLISHABLE_KEY no front.');
        return;
      }
      setStripePromise(getStripe());

      if (checkoutMode === 'payment') {
        sb.functions.invoke('get-payment-method', { body: {}, signal: abort.signal }).then(function(result) {
          if (!alive || settled) return;
          var data = result && result.data ? result.data : null;
          var savedCard = data && data.card ? data.card : null;
          if (savedCard) { toPreview(savedCard, 'saved'); return; }
          startNewCardPayment();
        }).catch(function() {
          if (!alive || settled) return;
          startNewCardPayment();
        });
        return;
      }

      sb.functions.invoke('get-payment-method', { body: {}, signal: abort.signal }).then(function(result) {
        if (!alive || settled) return;
        var data = result && result.data ? result.data : null;
        var savedCard = data && data.card ? data.card : null;
        if (isChange) { toPreview(savedCard, 'change'); return; }
        if (savedCard) { toPreview(savedCard, 'saved'); return; }
        startNewCardSubscription();
      }).catch(function(err) {
        if (!alive || settled) return;
        startNewCardSubscription();
      });
    }).catch(function(err) {
      readFnErrorMessage(err, null).then(function(msg) {
        fail(friendlyStripeError(msg || '') || 'Erro ao processar. Verifique sua internet e tente de novo.');
      });
    });

    return function() { alive = false; if (timer) clearTimeout(timer); abort.abort(); };
    // eslint-disable-next-line
  }, [plan.id, attempt]);

  var headerTitle;
  if (checkoutMode === 'payment') headerTitle = 'Comprar ' + plan.name;
  else if (isChange) headerTitle = 'Mudar para ' + plan.name;
  else headerTitle = 'Assinar ' + plan.name;

  var options = clientSecret ? { clientSecret: clientSecret, appearance: stripeAppearance(brand.color, isDarkTheme()) } : null;

  return {
    phase, clientSecret, loadErr, stripePromise, card, confirming, actionErr, useOtherCard,
    options, headerTitle, isChange,
    retry, done, runWhiteLabelSaved, runSubscription, startNewCardFromSaved,
    setUseOtherCard, setConfirming, setActionErr,
  };
}
