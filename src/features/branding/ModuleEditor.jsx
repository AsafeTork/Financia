import React from 'react';

export default function ModuleEditor({ mod, brandConfig, onApply, brandColor }) {
  const currentConfig = (brandConfig && brandConfig.modules && brandConfig.modules[mod.name]) || {};
  const props = (mod.def.schema && mod.def.schema.properties) || {};
  const [values, setValues] = React.useState(() => deepMerge(defaultsFromSchema(props), currentConfig));
  const [expandedField, setExpandedField] = React.useState(null);

  const hasChanges = () => {
    const curr = JSON.stringify(currentConfig);
    const next = JSON.stringify(values);
    return curr !== next;
  };

  const doApply = () => {
    const wrapped = { schemaVersion: '1.0.0', modules: {} };
    wrapped.modules[mod.name] = JSON.parse(JSON.stringify(values));
    onApply(JSON.stringify(wrapped));
  };

  const setField = (path, val) => {
    setValues(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      setNested(copy, path, val);
      return copy;
    });
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      {Object.keys(props).map(key => {
        const prop = props[key];
        if (prop.type === 'object' && prop.properties) {
          return (
            <div key={key}>
              <button onClick={() => setExpandedField(expandedField === key ? null : key)}
                className="flex items-center gap-2 text-xs font-semibold w-full text-left px-3 py-2 rounded-lg transition hover:opacity-80"
                style={{background:'var(--bg-input)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedField === key ? 'rotate-90' : ''}`}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
                {labelFromKey(key)} ({Object.keys(prop.properties).length} campos)
              </button>
              {expandedField === key && (
                <div className="pl-4 pt-2 flex flex-col gap-2">
                  {Object.keys(prop.properties).map(subKey => {
                    const subProp = prop.properties[subKey];
                    return renderField(`${key}.${subKey}`, subProp, subKey, getNested(values, `${key}.${subKey}`), v => setField(`${key}.${subKey}`, v));
                  })}
                </div>
              )}
            </div>
          );
        }
        return renderField(key, prop, key, values[key], v => setField(key, v));
      })}

      {hasChanges() && (
        <button onClick={doApply}
          className="text-xs font-semibold px-4 py-2.5 rounded-xl text-white transition hover:opacity-90 min-h-[44px] w-full"
          style={{background: brandColor}}>
          Aplicar {mod.def.description}
        </button>
      )}
    </div>
  );
}

function renderField(path, prop, label, value, onChange) {
  const isColor = prop.pattern && prop.pattern === '^#[0-9a-fA-F]{6}$';
  const isUrl = prop.pattern && (prop.pattern.indexOf('https?://') !== -1 || prop.pattern === '^(https?://|data:)');
  const isNumber = prop.type === 'number';
  const hasMinMax = prop.minimum !== undefined || prop.maximum !== undefined;

  const fieldId = `mod_field_${path.replace(/\./g, '_')}`;

  if (isColor) {
    return (
      <div key={path} className="flex items-center gap-2">
        <label htmlFor={fieldId} className="text-[11px] font-medium min-w-[80px]" style={{color:'var(--text-sub)'}}>{labelFromKey(label)}</label>
        <input type="color" id={fieldId} value={value || '#000000'} onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5 flex-shrink-0" />
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder={'#' + '000000'}
          className="flex-1 rounded-lg px-2.5 py-1.5 text-[11px] font-mono focus:outline-none"
          style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
      </div>
    );
  }

  if (isNumber && hasMinMax) {
    return (
      <div key={path} className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor={fieldId} className="text-[11px] font-medium" style={{color:'var(--text-sub)'}}>{labelFromKey(label)}</label>
          <span className="text-[10px] font-mono" style={{color:'var(--text-muted)'}}>{value !== undefined ? value : '-'}</span>
        </div>
        <input type="range" id={fieldId}
          min={prop.minimum !== undefined ? prop.minimum : 0}
          max={prop.maximum !== undefined ? prop.maximum : 1}
          step={prop.type === 'integer' ? 1 : 0.01}
          value={value !== undefined ? value : 0}
          onChange={e => onChange(prop.type === 'integer' ? parseInt(e.target.value, 10) : parseFloat(e.target.value))}
          className="w-full accent-current" style={{color: 'var(--brand)'}} />
      </div>
    );
  }

  if (isUrl || (prop.type === 'string' && (label.indexOf('url') !== -1 || label.indexOf('logo') !== -1))) {
    const handleUpload = e => {
      const file = e.target && e.target.files && e.target.files[0];
      if (!file) return;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedTypes.indexOf(file.type) === -1) return;
      if (file.size > 512 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => onChange(String(reader.result));
      reader.readAsDataURL(file);
    };
    const uploadId = `upload_${path.replace(/\./g, '_')}`;
    return (
      <div key={path} className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-[11px] font-medium" style={{color:'var(--text-sub)'}}>{labelFromKey(label)}</label>
        <div className="flex items-center gap-2">
          {value && <img src={value} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" style={{border:'1px solid var(--border)'}} />}
          <input type="text" id={fieldId} value={value || ''} onChange={e => onChange(e.target.value)}
            placeholder="URL ou upload"
            className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-[11px] font-mono focus:outline-none"
            style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
          <label htmlFor={uploadId} className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg cursor-pointer whitespace-nowrap hover:opacity-80 transition" style={{background:'var(--brand-soft)', color:'var(--brand)'}}>
            Upload
            <input type="file" id={uploadId} accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
          {value && <button onClick={() => onChange('')} className="text-[10px] px-2 py-1 rounded-lg hover:opacity-70 flex-shrink-0" style={{color:'#ef4444'}}>x</button>}
        </div>
      </div>
    );
  }

  if (prop.type === 'boolean') {
    return (
      <div key={path} className="flex items-center gap-2">
        <label className="text-[11px] font-medium flex items-center gap-2 cursor-pointer min-h-[36px]" style={{color:'var(--text-sub)'}}>
          <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
            className="w-4 h-4 rounded accent-current" style={{color: 'var(--brand)'}} />
          {labelFromKey(label)}
        </label>
      </div>
    );
  }

  return (
    <div key={path} className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-[11px] font-medium" style={{color:'var(--text-sub)'}}>{labelFromKey(label)}</label>
      <input type="text" id={fieldId} value={value !== undefined ? value : ''} onChange={e => onChange(e.target.value)}
        placeholder={labelFromKey(label)}
        className="rounded-lg px-2.5 py-1.5 text-[11px] font-mono focus:outline-none"
        style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
    </div>
  );
}

function labelFromKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace(/_/g, ' ');
}

function defaultsFromSchema(props) {
  const out = {};
  Object.keys(props).forEach(key => {
    const p = props[key];
    if (p.type === 'object' && p.properties) {
      out[key] = defaultsFromSchema(p.properties);
    } else if (p.type === 'string') {
      out[key] = '';
    } else if (p.type === 'number') {
      out[key] = p.default !== undefined ? p.default : 0;
    } else if (p.type === 'boolean') {
      out[key] = p.default !== undefined ? p.default : false;
    }
  });
  return out;
}

function deepMerge(base, override) {
  const result = JSON.parse(JSON.stringify(base));
  Object.keys(override).forEach(k => {
    if (typeof override[k] === 'object' && override[k] !== null && !Array.isArray(override[k]) && typeof result[k] === 'object' && result[k] !== null) {
      result[k] = deepMerge(result[k], override[k]);
    } else {
      result[k] = override[k];
    }
  });
  return result;
}

function setNested(obj, path, val) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = val;
}

function getNested(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}