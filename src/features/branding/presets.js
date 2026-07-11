import { ldb } from '../../lib/dexie.js';

export async function loadPresetsFromDb() {
  try {
    const rows = await ldb.brand_presets.toArray();
    return rows.map(r => ({
      id: r.id, name: r.name, description: r.description || '',
      category: r.category || 'custom', tags: r.tags || [],
      author: 'Usuario', protected: false, favorite: !!r.favorite,
      config: r.config ? (typeof r.config === 'string' ? JSON.parse(r.config) : r.config) : { modules: {} },
    }));
  } catch { return []; }
}

function _dbRow(preset) {
  return {
    id: preset.id, name: preset.name, description: preset.description || '',
    category: preset.category || 'custom', tags: preset.tags || [],
    favorite: preset.favorite ? 1 : 0,
    config: typeof preset.config === 'string' ? preset.config : JSON.stringify(preset.config),
    updated_at: Date.now(),
  };
}

function _persistPreset(preset) {
  try { ldb.brand_presets.put(_dbRow(preset)); } catch (_) { void _; }
}

function _deletePresetFromDb(id) {
  try { ldb.brand_presets.delete(id); } catch (_) { void _; }
}

function genId() { return `preset_${Date.now()}_${Math.random().toString(36).slice(2)}`; }

export const OFFICIAL_PRESETS = [
  {
    id: 'financia_classic', name: 'Financia Classic', description: 'Identidade original do Financia',
    category: 'classic', author: 'Financia', tags: ['classic', 'original', 'default'],
    protected: true,
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#002f59', secondary: '#e8f0f7', accent: '#1a6b5c', mode: 'light' }, typography: { style: 'modern', size: 'medium' }, sidebar: { style: 'solid' }, cards: { style: 'raised' }, buttons: { style: 'rounded' }, inputs: { style: 'outlined' }, borderRadius: { style: 'rounded' }, spacing: { density: 'comfortable' }, shadows: { intensity: 'subtle' }, animations: { speed: 'normal' } } },
  },
  {
    id: 'financia_modern', name: 'Financia Modern', description: 'Design contemporaneo com cores vibrantes',
    category: 'modern', author: 'Financia', tags: ['modern', 'vibrant', 'clean'],
    protected: true,
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#2563eb', secondary: '#eff6ff', accent: '#7c3aed', mode: 'light' }, typography: { style: 'modern', size: 'medium' }, sidebar: { style: 'minimal' }, cards: { style: 'flat' }, buttons: { style: 'pill' }, inputs: { style: 'minimal' }, borderRadius: { style: 'rounded' }, spacing: { density: 'comfortable' }, shadows: { intensity: 'medium' }, animations: { speed: 'fast' } } },
  },
  {
    id: 'financia_corporate', name: 'Financia Corporate', description: 'Sobriedade e profissionalismo',
    category: 'corporate', author: 'Financia', tags: ['corporate', 'professional', 'serious'],
    protected: true,
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#1e3a5f', secondary: '#f0f4f8', accent: '#0ea5e9', mode: 'light' }, typography: { style: 'classic', size: 'medium' }, sidebar: { style: 'solid' }, cards: { style: 'raised' }, buttons: { style: 'rounded' }, inputs: { style: 'outlined' }, borderRadius: { style: 'sharp' }, spacing: { density: 'comfortable' }, shadows: { intensity: 'subtle' }, animations: { speed: 'normal' } } },
  },
  {
    id: 'financia_premium', name: 'Financia Premium', description: 'Experiencia visual premium',
    category: 'premium', author: 'Financia', tags: ['premium', 'luxo', 'elegant'],
    protected: true,
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#0f172a', secondary: '#f8fafc', accent: '#f59e0b', mode: 'light' }, typography: { style: 'modern', size: 'large' }, sidebar: { style: 'dark' }, cards: { style: 'raised' }, buttons: { style: 'rounded' }, inputs: { style: 'outlined' }, borderRadius: { style: 'rounded' }, spacing: { density: 'spacious' }, shadows: { intensity: 'strong' }, animations: { speed: 'normal' } } },
  },
  {
    id: 'financia_dark', name: 'Financia Dark', description: 'Tema escuro completo',
    category: 'dark', author: 'Financia', tags: ['dark', 'night', 'modern'],
    protected: true,
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#6366f1', secondary: '#1e1b4b', accent: '#22d3ee', mode: 'dark', bgPage: '#0f0f23', bgCard: '#1a1a2e', textMain: '#e2e8f0', textSub: '#94a3b8', border: '#334155' }, typography: { style: 'modern', size: 'medium' }, sidebar: { style: 'dark' }, cards: { style: 'glass' }, buttons: { style: 'rounded' }, inputs: { style: 'filled' }, borderRadius: { style: 'rounded' }, spacing: { density: 'comfortable' }, shadows: { intensity: 'medium' }, animations: { speed: 'normal' } } },
  },
  {
    id: 'financia_glass', name: 'Financia Glass', description: 'Efeito vidro translucido',
    category: 'modern', author: 'Financia', tags: ['glass', 'translucent', 'modern'],
    protected: true,
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#8b5cf6', secondary: '#f5f3ff', accent: '#06b6d4', mode: 'light', bgPage: '#f0f0ff', bgCard: 'rgba(255,255,255,0.6)', border: 'rgba(139,92,246,0.15)' }, typography: { style: 'modern', size: 'medium' }, sidebar: { style: 'glass' }, cards: { style: 'glass' }, buttons: { style: 'pill' }, inputs: { style: 'minimal' }, borderRadius: { style: 'pill' }, spacing: { density: 'spacious' }, shadows: { intensity: 'subtle' }, animations: { speed: 'normal' } } },
  },
  {
    id: 'financia_minimal', name: 'Financia Minimal', description: 'Menos e mais',
    category: 'minimal', author: 'Financia', tags: ['minimal', 'clean', 'simple'],
    protected: true,
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#0f172a', secondary: '#f8fafc', accent: '#475569', style: 'minimal', mode: 'light' }, typography: { style: 'minimal', size: 'small' }, sidebar: { style: 'minimal' }, cards: { style: 'flat' }, buttons: { style: 'sharp' }, inputs: { style: 'underlined' }, borderRadius: { style: 'sharp' }, spacing: { density: 'compact' }, shadows: { intensity: 'none' }, animations: { speed: 'fast' } } },
  },
  {
    id: 'financia_executive', name: 'Financia Executive', description: 'Para tomada de decisao',
    category: 'corporate', author: 'Financia', tags: ['executive', 'board', 'decision'],
    protected: true,
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#1e293b', secondary: '#f1f5f9', accent: '#dc2626', mode: 'light' }, typography: { style: 'classic', size: 'large' }, sidebar: { style: 'solid' }, cards: { style: 'raised' }, buttons: { style: 'sharp' }, inputs: { style: 'outlined' }, borderRadius: { style: 'sharp' }, spacing: { density: 'comfortable' }, shadows: { intensity: 'medium' }, animations: { speed: 'normal' } } },
  },
];

let _userPresets = [];
let _onChange = null;

export function setOnChange(fn) { _onChange = fn; }

function _notifyChange() { if (_onChange) _onChange(); }

export function listPresets() {
  return [...OFFICIAL_PRESETS, ..._userPresets].map(p => ({
    id: p.id, name: p.name, description: p.description, category: p.category, author: p.author, tags: p.tags, protected: p.protected, favorite: p.favorite || false,
  }));
}

export function getPreset(id) {
  const found = [...OFFICIAL_PRESETS, ..._userPresets].filter(p => p.id === id);
  return found.length > 0 ? found[0] : null;
}

export async function savePreset(name, description, category, config, tags) {
  const preset = {
    id: genId(), name, description: description || '', category: category || 'custom',
    author: 'Usuario', tags: tags || [], protected: false, favorite: false,
    config: typeof config === 'string' ? JSON.parse(config) : config,
  };
  _userPresets.push(preset);
  _persistPreset(preset);
  _notifyChange();
  return preset;
}

export function deletePreset(id) {
  const idx = _userPresets.findIndex(p => p.id === id);
  if (idx === -1) return false;
  _userPresets.splice(idx, 1);
  _deletePresetFromDb(id);
  _notifyChange();
  return true;
}

export async function duplicatePreset(id) {
  const original = getPreset(id);
  if (!original) return null;
  return savePreset(`${original.name} (copia)`, original.description, original.category, original.config, original.tags);
}

export function toggleFavoritePreset(id) {
  for (let ui = 0; ui < _userPresets.length; ui++) {
    if (_userPresets[ui].id === id) {
      const val = !_userPresets[ui].favorite;
      _userPresets[ui].favorite = val;
      _persistPreset(_userPresets[ui]);
      _notifyChange();
      return val;
    }
  }
  return false;
}

export function exportPreset(id) {
  const p = getPreset(id);
  if (!p) return null;
  return JSON.stringify({ preset: p.config, meta: { name: p.name, description: p.description, category: p.category, tags: p.tags } }, null, 2);
}

export async function importPreset(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    const config = data.preset || data;
    const meta = data.meta || {};
    const name = meta.name || 'Preset importado';
    const desc = meta.description || '';
    const cat = meta.category || 'imported';
    const tags = meta.tags || [];
    return savePreset(name, desc, cat, config, tags);
  } catch {
    return null;
  }
}

export function getPresetCategories() {
  const cats = {};
  [...OFFICIAL_PRESETS, ..._userPresets].forEach(p => {
    if (!cats[p.category]) cats[p.category] = 0;
    cats[p.category]++;
  });
  return Object.keys(cats).sort().map(k => ({ name: k, count: cats[k] }));
}