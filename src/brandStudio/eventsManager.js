var _savedBrandConfig = null;

export const SEASONAL_EVENTS = [
  { id: 'natal', name: 'Natal', month: 12, dayStart: 20, dayEnd: 26, presetId: 'financia_christmas', priority: 10 },
  { id: 'ano_novo', name: 'Ano Novo', month: 12, dayStart: 28, dayEnd: 31, presetId: 'financia_newyear', priority: 10 },
  { id: 'black_friday', name: 'Black Friday', month: 11, dayStart: 25, dayEnd: 29, presetId: 'financia_blackfriday', priority: 20 },
  { id: 'carnaval', name: 'Carnaval', month: 2, dayStart: 1, dayEnd: 14, presetId: 'financia_carnival', priority: 5 },
  { id: 'outubro_rosa', name: 'Outubro Rosa', month: 10, dayStart: 1, dayEnd: 31, presetId: 'financia_pink', priority: 8 },
  { id: 'novembro_azul', name: 'Novembro Azul', month: 11, dayStart: 1, dayEnd: 30, presetId: 'financia_blue', priority: 8 },
];

export const EVENT_PRESETS = {
  financia_christmas: { modules: { palette: { primary: '#cc0000', accent: '#006400', bgPage: '#faf5eb', bgCard: '#ffffff' }, cards: { style: 'raised' }, animations: { speed: 'normal', enabled: true } } },
  financia_newyear: { modules: { palette: { primary: '#0a0a2e', accent: '#ffd700', bgPage: '#f0f0ff' }, animations: { speed: 'normal', enabled: true } } },
  financia_blackfriday: { modules: { palette: { primary: '#000000', accent: '#ff4444', bgPage: '#f5f5f5' }, buttons: { style: 'pill' }, shadows: { intensity: 'strong' } } },
  financia_carnival: { modules: { palette: { primary: '#8b5cf6', accent: '#f59e0b', bgPage: '#fef9f0' }, animations: { speed: 'fast', enabled: true } } },
  financia_pink: { modules: { palette: { primary: '#ec4899', accent: '#be185d', bgPage: '#fdf2f8' } } },
  financia_blue: { modules: { palette: { primary: '#2563eb', accent: '#1e3a5f', bgPage: '#eff6ff' } } },
};

var _customEvents = [];
var _activeEventId = null;

export function getActiveEvent() {
  var now = new Date();
  var todayMonth = now.getMonth() + 1;
  var todayDay = now.getDate();

  var candidates = [];

  SEASONAL_EVENTS.forEach(function(ev) {
    if (ev.month === todayMonth && todayDay >= ev.dayStart && todayDay <= ev.dayEnd) {
      candidates.push(ev);
    }
  });

  _customEvents.forEach(function(ev) {
    if (!ev.enabled) return;
    var start = new Date(ev.starts_at);
    var end = new Date(ev.expires_at);
    if (now >= start && now <= end) {
      candidates.push(ev);
    }
  });

  if (candidates.length === 0) return null;

  candidates.sort(function(a, b) { return (b.priority || 0) - (a.priority || 0); });
  _activeEventId = candidates[0].id;
  return candidates[0];
}

export function getActiveEventOverride() {
  var ev = getActiveEvent();
  if (!ev) return null;
  var preset = EVENT_PRESETS[ev.presetId];
  if (preset) return preset;
  if (ev.config) return ev.config;
  return null;
}

export function isEventActive() {
  return getActiveEvent() !== null;
}

export function saveCurrentBrandBeforeEvent(brand) {
  _savedBrandConfig = brand ? Object.assign({}, brand) : null;
}

export function restoreBrandAfterEvent() {
  var saved = _savedBrandConfig;
  _savedBrandConfig = null;
  return saved;
}

export function listCustomEvents() {
  return [].concat(_customEvents);
}

export function addCustomEvent(event) {
  var id = 'customevent_' + Date.now();
  _customEvents.push(Object.assign({ id: id, priority: 5, enabled: true }, event));
  return id;
}

export function removeCustomEvent(id) {
  var idx = -1;
  for (var ci = 0; ci < _customEvents.length; ci++) {
    if (_customEvents[ci].id === id) { idx = ci; break; }
  }
  if (idx === -1) return false;
  _customEvents.splice(idx, 1);
  return true;
}

export function toggleCustomEvent(id) {
  for (var ci = 0; ci < _customEvents.length; ci++) {
    if (_customEvents[ci].id === id) {
      _customEvents[ci].enabled = !_customEvents[ci].enabled;
      return _customEvents[ci].enabled;
    }
  }
  return null;
}

export function listSeasonalEvents() {
  return SEASONAL_EVENTS.map(function(e) { return { id: e.id, name: e.name, month: e.month, dayStart: e.dayStart, dayEnd: e.dayEnd, priority: e.priority, seasonal: true }; });
}
