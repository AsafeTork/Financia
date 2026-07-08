export default function diffSummarize(current, proposed) {
  var execLines = [];
  var techLines = [];
  var jsonDiff = {};

  var currentMods = (current && current.modules) || {};
  var proposedMods = (proposed && proposed.modules) || {};

  var allKeys = Object.keys(Object.assign({}, currentMods, proposedMods));
  allKeys.sort();

  for (var mi = 0; mi < allKeys.length; mi++) {
    var modName = allKeys[mi];
    var cur = currentMods[modName];
    var prop = proposedMods[modName];

    if (!cur && prop) {
      execLines.push('O modulo "' + moduleLabel(modName) + '" sera configurado pela primeira vez.');
      techLines.push({ module: modName, status: 'added', fields: Object.keys(prop) });
      jsonDiff[modName] = { status: 'added', from: null, to: prop };
      continue;
    }
    if (cur && !prop) {
      continue;
    }
    if (!cur && !prop) continue;

    var propKeys = Object.keys(prop);
    var changed = [];
    var details = [];

    for (var ki = 0; ki < propKeys.length; ki++) {
      var pk = propKeys[ki];
      if (cur[pk] !== prop[pk]) {
        changed.push(pk);
        details.push({ field: pk, from: cur[pk], to: prop[pk] });
      }
    }

    if (changed.length === 0) continue;

    execLines.push('O modulo "' + moduleLabel(modName) + '" sera atualizado (' + changed.length + ' campo(s)).');
    techLines.push({ module: modName, status: 'modified', fields: details });
    jsonDiff[modName] = { status: 'modified', changes: details };
  }

  var unchanged = [];
  for (var ui = 0; ui < allKeys.length; ui++) {
    var mn = allKeys[ui];
    if (!jsonDiff[mn] && currentMods[mn] && proposedMods[mn]) {
      var same = true;
      var ck = Object.keys(Object.assign({}, currentMods[mn], proposedMods[mn]));
      for (var si = 0; si < ck.length; si++) {
        if (currentMods[mn][ck[si]] !== proposedMods[mn][ck[si]]) { same = false; break; }
      }
      if (same) unchanged.push(mn);
    }
  }

  if (unchanged.length > 0) {
    execLines.push('Nenhuma alteracao em: ' + unchanged.map(moduleLabel).join(', ') + '.');
  }

  return {
    executive: execLines,
    technical: techLines,
    jsonDiff: jsonDiff,
  };
}

function moduleLabel(name) {
  var labels = {
    palette: 'Paleta de cores',
    typography: 'Tipografia',
    sidebar: 'Barra lateral',
    header: 'Cabecalho',
    cards: 'Cartoes',
    buttons: 'Botoes',
    inputs: 'Campos de entrada',
    borderRadius: 'Bordas arredondadas',
    shadows: 'Sombras',
    spacing: 'Espacamento',
    animations: 'Animacoes',
    layout: 'Layout',
  };
  return labels[name] || name;
}
