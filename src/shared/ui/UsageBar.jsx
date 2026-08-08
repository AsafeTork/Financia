import React, { memo, useMemo, useState, useEffect } from 'react';
import { Card } from './ui.jsx';
import { brandAlpha } from '../../lib/utils.js';
import { useCountUp } from '../hooks/useCountUp.js';

export const UsageBar = memo(function UsageBar({ label, used, limit, color, accentColor }) {
  var unlimited = limit === Infinity;
  var pct = unlimited ? 0 : Math.min(Math.round((used / limit) * 100), 100);
  var reached = !unlimited && used >= limit;
  var warn = !reached && pct >= 80;
  var dotColor = accentColor || color || 'var(--brand, #1a6b5c)';
  var barColor = reached ? 'var(--danger)' : warn ? 'var(--warning)' : dotColor;
  var countStyle = reached ? {color: 'var(--danger)'} : warn ? {color: 'var(--warning)'} : {color: 'var(--text-muted)'};
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background: dotColor}}/>
          <span className="truncate">{label}</span>
          {reached && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.08)'}}>no limite</span>}
        </span>
        <span className="text-xs font-semibold tabular flex-shrink-0" style={countStyle}>
          {used}/{unlimited ? 'ilimitado' : limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{background:'var(--bg-subtle)'}}>
        <div className="h-full rounded-full transition-all duration-300 ease-out" style={{width: pct + '%', background: barColor}}/>
      </div>
    </div>
  );
});

export const KpiCard = memo(function KpiCard({ label, value, variation, sub, color, accentBar, onClick, invert, headline, heading, highlight }) {
  var hasClick = typeof onClick === 'function';
  var barColor = accentBar || color;
  var hasVar = variation !== null && variation !== undefined;
  var up = hasVar && variation >= 0;
  var good = invert ? (hasVar && variation <= 0) : up;
  var kpiId = React.useId();
  var LabelTag = heading || 'p';
  var cardStyle = highlight ? { background: brandAlpha(barColor, 0.06) } : undefined;
  var ariaLabel = useMemo(function() {
    if (!hasClick) return undefined;
    return label + ': ' + value + (hasVar ? ', variação ' + (up ? '+' : '') + variation + '%' : '');
  }, [label, value, hasVar, up, variation, hasClick]);

  var [mounted, setMounted] = useState(false);
  var [prefersReduce, setPrefersReduce] = useState(false);
  useEffect(function() {
    setMounted(true);
    setPrefersReduce(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  var valStr = String(value);
  var numVal = parseFloat(valStr.replace(/[^\d.-]/g, ''));
  var isNumeric = !isNaN(numVal);
  var animatedVal = useCountUp(numVal, mounted && !prefersReduce && isNumeric && headline);
  var displayValue = (mounted && !prefersReduce && isNumeric && headline) ? (
    <React.Fragment>
      <span aria-hidden="true">{animatedVal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
      <span className="sr-only" role="status">{value}</span>
    </React.Fragment>
  ) : value;

  return (
    <Card style={cardStyle} className={(headline ? 'p-5 sm:p-6' : 'p-4') + ' overflow-hidden' + (hasClick ? ' cursor-pointer card-hover transition-transform duration-150 active:scale-[0.98]' : '')}
      onClick={hasClick ? onClick : undefined}
      tabIndex={hasClick ? 0 : undefined}
      role={hasClick ? 'button' : undefined}
      onKeyDown={hasClick ? function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); }
      } : undefined}
      accent={true}
      color={barColor}
      aria-label={ariaLabel}
      id={hasClick ? kpiId : undefined}>
      <LabelTag className="text-xs font-semibold uppercase tracking-wider mt-2" style={{color:'var(--text-muted)'}}>{label}</LabelTag>
      <p className="font-extrabold mt-2 text-foreground truncate tabular" style={{fontSize: headline ? 28 : 22, letterSpacing:'-0.5px'}}>{displayValue}</p>
      {variation !== null && variation !== undefined && (
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md" style={good ? {background: 'color-mix(in srgb, var(--success) 8%, transparent)', color: 'var(--success)'} : {background: 'color-mix(in srgb, var(--danger) 8%, transparent)', color: 'var(--danger)'}}>
            {up ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M5 15l7-7 7 7"/></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M19 9l-7 7-7-7"/></svg>
            )}
            {variation > 0 ? '+' : ''}{variation}%
          </span>
          <span className="text-xs text-muted-foreground">vs mes ant.</span>
        </div>
      )}
      {sub && variation === null || (sub && variation === undefined) ? <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p> : null}
    </Card>
  );
});

export const BarChartSVG = memo(function BarChartSVG({ data, color, ...rest }) {
  var barColor = color || 'var(--brand, #1a6b5c)';
  var nums = data.reduce(function(acc, d) { acc.push(d.i, d.o); return acc; }, []);
  var max = Math.max.apply(null, nums);
  var maxVal = max || 1;
  var W = 44, H = 140, bw = 10, pad = 4;

  var fmtK = function(v) {
    if (v >= 1000) return (v / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(v);
  };

  var totalIncome = data.reduce(function(s, d) { return s + d.i; }, 0);
  var totalOutcome = data.reduce(function(s, d) { return s + d.o; }, 0);
  var ariaDesc = 'Gráfico de barras dos últimos 7 dias. Receitas total: ' + fmtK(totalIncome) + ', Despesas total: ' + fmtK(totalOutcome) + '. ' + data.map(function(d) { return d.day + ': entrada ' + fmtK(d.i) + ', saída ' + fmtK(d.o); }).join('; ');

  return (
    <React.Fragment>
      <svg role="img" aria-label="Gráfico de receitas e despesas" aria-describedby={rest.id ? rest.id + '-desc' : undefined} width="100%" height={H + 20} viewBox={'0 0 ' + (data.length * W + 40) + ' ' + (H + 20)} preserveAspectRatio="xMidYMid meet" {...rest}>
        <title>Gráfico de receitas e despesas</title>
        <desc id={rest.id ? rest.id + '-desc' : undefined}>{ariaDesc}</desc>
        {data.map(function(d, i) {
          var x = i * W + pad + 36;
          var ih = Math.round((d.i / maxVal) * (H - 40));
          var oh = Math.round((d.o / maxVal) * (H - 40));
          return (
            <g key={i}>
              <rect x={x} y={H - 28 - ih} width={bw} height={ih || 2} fill={barColor} rx={3} opacity="0.85"/>
              <rect x={x + bw + 2} y={H - 28 - oh} width={bw} height={oh || 2} fill="var(--danger)" rx={3} opacity="0.85"/>
              <text x={x + bw + 1} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--text-muted, #9ca3af)">{d.day}</text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>Resumo do gráfico de receitas e despesas dos últimos 7 dias</caption>
        <thead>
          <tr>
            <th scope="col">Dia</th>
            <th scope="col">Receitas</th>
            <th scope="col">Despesas</th>
          </tr>
        </thead>
        <tbody>
          {data.map(function(d, i) {
            return (
              <tr key={i}>
                <th scope="row">{d.day}</th>
                <td>{fmtK(d.i)}</td>
                <td>{fmtK(d.o)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </React.Fragment>
  );
});
