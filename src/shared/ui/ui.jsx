// DEPRECATED — migrate to individual shadcn components
import React from 'react';
import { cleanNumeric, cn } from '../../lib/utils.js';
import { Input } from './input.jsx';
import { Button } from './button.jsx';
import { Textarea as ShadcnTextarea } from './textarea.jsx';
import { Spinner } from './spinner.jsx';
import { Label } from './label.jsx';

var ShadcnCard = function({ className, children, ...p }) {
  return <div className={cn('rounded-xl border bg-card text-card-foreground shadow', className)} {...p}>{children}</div>;
};
var ShadcnBadge = function({ className, variant, children, ...p }) {
  var v = variant === 'default' ? 'border-transparent bg-primary text-primary-foreground shadow'
    : variant === 'secondary' ? 'border-transparent bg-secondary text-secondary-foreground'
    : variant === 'destructive' ? 'border-transparent bg-destructive text-destructive-foreground shadow'
    : variant === 'outline' ? 'text-foreground' : '';
  return <div className={cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors', v, className)} {...p}>{children}</div>;
};

export const Card = function({ children, className, hover, variant, accent, color }) {
  var cls = (className || '');
  if (hover) cls += ' card-hover';
  if (variant === 'flat') cls += ' shadow-none';
  if (variant === 'raised') cls += ' shadow-md';
  return (
    <ShadcnCard className={'overflow-hidden ' + cls}>
      {accent && <div style={{position:'absolute', top:0, left:0, right:0, height:3, background: color || 'var(--brand-grad, var(--brand))', zIndex:1}}/>}
      {children}
    </ShadcnCard>
  );
};

export const Inp = function({ label, hint, error, success, className, icon, id, ...p }) {
  var generatedId = React.useId();
  var inputId = id || generatedId;
  return (
    <div className={'flex flex-col gap-1.5 min-w-0 ' + (className || '')}>
      {label && (
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <Label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wide">{label}</Label>
        </div>
      )}
      <Input id={inputId}
        className={'h-auto py-3 px-3.5 ' + (error ? 'border-destructive focus-visible:ring-destructive' : success ? 'border-green-500' : '')}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? inputId + '-error' : undefined}
        {...p}
      />
      {(hint || error) && (
        <p id={error ? inputId + '-error' : undefined} className={'text-xs mt-0.5 ' + (error ? 'text-destructive font-medium' : 'text-muted-foreground')}>{error || hint}</p>
      )}
    </div>
  );
};

export const NumInp = function(props) {
  var decimals = props.decimals !== false;
  var maxLen = props.maxLen || (decimals ? 12 : 7);
  var onChange = props.onChange;
  var st = React.useState(false);
  var charErr = st[0], setCharErr = st[1];

  var handle = function(e) {
    var res = cleanNumeric(e.target.value, { decimals: decimals, maxLen: maxLen });
    setCharErr(res.invalid);
    if (onChange) onChange({ target: { value: res.value } });
  };

  var rest = Object.assign({}, props);
  delete rest.decimals; delete rest.maxLen; delete rest.onChange;
  delete rest.error; delete rest.type; delete rest.min; delete rest.step;
  var err = charErr ? 'Caracteres não permitidos' : (props.error || '');

  return React.createElement(Inp, Object.assign({}, rest, {
    type: 'text',
    inputMode: decimals ? 'decimal' : 'numeric',
    maxLength: maxLen,
    onChange: handle,
    error: err,
  }));
};

export const Sel = function({ label, className, children, id, ...p }) {
  var generatedId = React.useId();
  var selectId = id || generatedId;
  return (
    <div className={'flex flex-col gap-1.5 min-w-0 ' + (className || '')}>
      {label && <Label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wide">{label}</Label>}
      <select id={selectId}
        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        {...p}
      >{children}</select>
    </div>
  );
};

export const Textarea = function({ label, className, id, ...p }) {
  var generatedId = React.useId();
  var textareaId = id || generatedId;
  return (
    <div className={'flex flex-col gap-1.5 ' + (className || '')}>
      {label && <Label htmlFor={textareaId} className="text-xs font-semibold uppercase tracking-wide">{label}</Label>}
      <ShadcnTextarea id={textareaId} className="resize-none min-h-[120px]" rows={6} {...p}/>
    </div>
  );
};

export const Spin = function({ white, size }) {
  return <Spinner className={white ? 'text-white' : 'text-muted-foreground'} size={size}/>
};

export const Btn = function({ variant, size, loading, children, style, className, ...p }) {
  var v = variant === 'danger' ? 'destructive' : variant === 'secondary' ? 'outline' : variant || 'default';
  var s = size || 'default';
  if (s === 'md') s = 'default';
  return (
    <Button variant={v} size={s} disabled={loading || p.disabled} className={className} style={style} {...p}>
      {loading ? <Spinner size="sm" className={v === 'default' || v === 'destructive' ? 'text-white' : ''}/> : children}
    </Button>
  );
};

export const Badge = function({ color, bg, children, variant, className }) {
  if (variant) {
    return <ShadcnBadge variant={variant} className={className}>{children}</ShadcnBadge>;
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{color: color || 'var(--brand)', background: bg || 'var(--brand-soft)'}}
    >
      {children}
    </span>
  );
};

export const Empty = function({ icon, title, sub, action, onAction, color }) {
  return (
    <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1" style={{background: 'var(--brand-soft)'}}>
        {icon && typeof icon === 'string' && icon.length <= 2
          ? <span className="text-2xl">{icon}</span>
          : icon
          ? icon
          : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          )
        }
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{sub}</p>
      {action && (
        <button onClick={onAction}
          className="mt-1 text-xs font-semibold px-5 py-2.5 rounded-xl text-white transition hover:opacity-90"
          style={{background: color || 'var(--brand)'}}>
          {action}
        </button>
      )}
    </div>
  );
};

export const Modal = function({ title, onClose, onSave, color, saving, children, saveLabel, wide }) {
  var bg = color || 'var(--brand)';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade" style={{background:'rgba(15,23,42,0.55)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)'}}>
      <div role="dialog" aria-modal="true" aria-label={title} className={'rounded-xl flex flex-col w-full anim-scale ' + (wide ? 'max-w-lg' : 'max-w-sm')} style={{background:'var(--bg-card)', boxShadow:'var(--shadow-lg)', maxHeight:'90vh', border:'1px solid var(--border)'}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <span className="font-semibold text-foreground">{title}</span>
          <button onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3 overflow-y-auto flex-1">{children}</div>
        <div className="flex gap-2 px-6 pb-5 flex-shrink-0 pt-2">
          <button onClick={onClose} className="flex-1 border border-input text-muted-foreground rounded-xl py-2.5 text-sm font-medium hover:bg-muted">Cancelar</button>
          <button onClick={onSave} disabled={saving} className="flex-1 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-40 transition" style={{background: bg}}>
            {saving ? <Spin white/> : (saveLabel || 'Salvar')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const EditBtn = function({ onClick }) {
  return (
    <button onClick={onClick} title="Editar" aria-label="Editar" type="button" className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-primary/10 transition flex-shrink-0">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
    </button>
  );
};

export const DelBtn = function({ onClick }) {
  return (
    <button onClick={onClick} title="Excluir" aria-label="Excluir" type="button" className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted hover:text-destructive hover:bg-destructive/10 transition flex-shrink-0">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
    </button>
  );
};

export const PageHead = function({ icon, title, sub, right, color }) {
  var c = color || 'var(--brand)';
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:'var(--brand-soft)'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg>
          </div>
        )}
        <div className="min-w-0">
          <h2 className="page-header">{title}</h2>
          {sub && <p className="page-sub">{sub}</p>}
        </div>
      </div>
      {right && <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end ml-auto">{right}</div>}
    </div>
  );
};

export const Skeleton = function({ w, h, r, className }) {
  return <div className={'skeleton ' + (className || '')} style={{ width: w || '100%', height: h || 12, borderRadius: r || 8 }} />;
};

export const PageSkeleton = function() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <Skeleton w="45%" h={26} r={10} />
        <Skeleton w="28%" h={12} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map(function(i) { return <Skeleton key={i} h={88} r={16} />; })}
      </div>
      <Skeleton h={180} r={16} />
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map(function(i) { return <Skeleton key={i} h={56} r={12} />; })}
      </div>
    </div>
  );
};
