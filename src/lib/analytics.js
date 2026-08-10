import { sb } from './supabase.js';

const EVENT_NAMES = new Set([
  'landing_view', 'landing_cta_click', 'signup_start', 'signup_complete',
  'onboarding_started', 'onboarding_complete', 'first_value', 'first_sale',
  'return', 'checkout_started', 'payment_success', 'subscription_active',
]);
const QUEUE_KEY = 'financia_product_event_queue';
const ANON_KEY = 'financia_analytics_anonymous_id';
const SESSION_KEY = 'financia_analytics_session_id';
const MAX_QUEUE = 100;
const PRIVATE_KEYS = new Set(['email', 'name', 'phone', 'description', 'amount', 'value', 'user_id']);
var flushPromise = null;
var queueVersion = 0;

function randomId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

function storedId(key, prefix) {
  try {
    var current = localStorage.getItem(key);
    if (current) return current;
    var next = randomId(prefix);
    localStorage.setItem(key, next);
    return next;
  } catch (_) {
    return randomId(prefix);
  }
}

function sessionId() {
  try {
    var current = sessionStorage.getItem(SESSION_KEY);
    if (current) return current;
    var next = randomId('session');
    sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch (_) {
    return randomId('session');
  }
}

function readQueue() {
  try {
    var raw = localStorage.getItem(QUEUE_KEY);
    var parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeQueue(items) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUE))); } catch (_) { /* best effort */ }
}

function safeProperties(input) {
  var out = {};
  if (!input || typeof input !== 'object') return out;
  Object.keys(input).slice(0, 8).forEach(function(key) {
    if (PRIVATE_KEYS.has(key)) return;
    var value = input[key];
    if (typeof value === 'string') out[key] = value.slice(0, 80);
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    else if (typeof value === 'boolean') out[key] = value;
  });
  return out;
}

function currentUserId() {
  try {
    return localStorage.getItem('financia_last_uid') || null;
  } catch (_) {
    return null;
  }
}

async function send(event) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  var userId = await currentUserId();
  var row = Object.assign({}, event, { user_id: userId || null });
  delete row._queue_id;
  var result = await sb.from('product_events').insert(row);
  return !result.error;
}

export async function flushAnalytics() {
  if (flushPromise) {
    return flushPromise;
  }
  flushPromise = (async function() {
    try {
      var version = queueVersion;
      for (var pass = 0; pass < 3; pass++) {
        await flushQueue();
        if (version === queueVersion || !readQueue().length) break;
        version = queueVersion;
      }
    } finally {
      flushPromise = null;
    }
  })();
  return flushPromise;
}

async function flushQueue() {
  var queue = readQueue();
  if (!queue.length) return;
  var sentIds = new Set();
  for (var i = 0; i < queue.length; i++) {
    try {
      if (await send(queue[i])) sentIds.add(queue[i]._queue_id);
    } catch (_) {
      // Keep failed events queued for a later online flush.
    }
  }
  var latestQueue = readQueue().filter(function(event) { return !sentIds.has(event._queue_id); });
  writeQueue(latestQueue);
}

export function trackEvent(eventName, properties) {
  if (!EVENT_NAMES.has(eventName)) return;
  var event = {
    _queue_id: randomId('event'),
    event_name: eventName,
    anonymous_id: storedId(ANON_KEY, 'anonymous'),
    session_id: sessionId(),
    properties: safeProperties(properties),
  };
  var queue = readQueue();
  queue.push(event);
  writeQueue(queue);
  queueVersion++;
  flushAnalytics().catch(function() { /* analytics never blocks product actions */ });
}

export function trackEventOnce(eventName, dedupeKey, properties) {
  var key = 'financia_event_once_' + eventName + '_' + String(dedupeKey || eventName);
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch (_) { /* best effort; event can still be recorded if storage is unavailable */ }
  trackEvent(eventName, properties);
}
