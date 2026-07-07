import { BRAND_SCHEMA_VERSION } from './schema.js';
import { listModules } from './schemaRegistry.js';

export default function generatePrompt(opts) {
  var modules = listModules();

  var lines = [];
  lines.push('# FINANCIA — PERSONALIZACAO VISUAL');
  lines.push('');
  lines.push('## Instrucoes');
  lines.push('');
  lines.push('Voce e um designer de identidade visual. O usuario do Financia pediu para voce personalizar');
  lines.push('o aplicativo de gestao financeira dele. Gere um JSON valido seguindo o schema abaixo.');
  lines.push('');
  lines.push('### Regras');
  lines.push('- Retorne APENAS o JSON, sem markdown, sem explicacoes, sem comentarios.');
  lines.push('- O JSON deve ter os campos: schemaVersion, modules.');
  lines.push('- schemaVersion deve ser "' + BRAND_SCHEMA_VERSION + '".');
  lines.push('- Cores devem estar em formato hexadecimal (#RRGGBB).');
  lines.push('- Use valores semanticos (style, mood, density) quando possivel.');
  lines.push('- Nao invente campos que nao estao no schema.');
  lines.push('- Se o usuario nao especificar algo, use o default ou omita.');
  lines.push('');

  if (opts && opts.context) {
    lines.push('### Contexto da Tela');
    lines.push('');
    lines.push(opts.context);
    lines.push('');
  }

  lines.push('### Modulos Disponiveis');
  lines.push('');
  for (var mi = 0; mi < modules.length; mi++) {
    var mod = modules[mi];
    lines.push('**' + mod.def.name + '** — ' + mod.def.description);
    if (mod.def.semanticMap) {
      var semanticKeys = Object.keys(mod.def.semanticMap);
      for (var si = 0; si < semanticKeys.length; si++) {
        var sk = semanticKeys[si];
        lines.push('  - ' + sk + ': ' + mod.def.semanticMap[sk].join(', '));
      }
    }
    lines.push('');
  }

  lines.push('### Schema (Formato Compacto)');
  lines.push('');
  lines.push('```json');
  lines.push('{');
  lines.push('  "schemaVersion": "' + BRAND_SCHEMA_VERSION + '",');
  lines.push('  "modules": {');
  lines.push('    "palette": {');
  lines.push('      "primary": "#hex",');
  lines.push('      "style": "minimal|bold|elegant|fun",');
  lines.push('      "mood": "professional|creative|warm|playful"');
  lines.push('    },');
  lines.push('    "typography": {');
  lines.push('      "style": "modern|classic|minimal|playful",');
  lines.push('      "size": "small|medium|large"');
  lines.push('    },');
  lines.push('    "sidebar": { "style": "solid|glass|minimal|dark" },');
  lines.push('    "header": { "style": "solid|transparent|bordered" },');
  lines.push('    "cards": { "style": "flat|raised|outlined|glass" },');
  lines.push('    "buttons": { "style": "rounded|sharp|pill" },');
  lines.push('    "inputs": { "style": "outlined|filled|underlined|minimal" },');
  lines.push('    "borderRadius": { "style": "sharp|rounded|pill" },');
  lines.push('    "spacing": { "density": "compact|comfortable|spacious" },');
  lines.push('    "shadows": { "intensity": "none|subtle|medium|strong" },');
  lines.push('    "animations": { "speed": "slow|normal|fast", "enabled": true }');
  lines.push('  }');
  lines.push('}');
  lines.push('```');
  lines.push('');

  if (opts && opts.limitations) {
    lines.push('### Limitacoes');
    lines.push('');
    lines.push(opts.limitations);
    lines.push('');
  }

  lines.push('### Exemplo');
  lines.push('');
  lines.push('```json');
  lines.push('{');
  lines.push('  "schemaVersion": "' + BRAND_SCHEMA_VERSION + '",');
  lines.push('  "modules": {');
  lines.push('    "palette": { "primary": "#1e3a5f", "style": "minimal", "mood": "professional" },');
  lines.push('    "typography": { "style": "modern", "size": "medium" },');
  lines.push('    "sidebar": { "style": "dark" },');
  lines.push('    "cards": { "style": "raised" },');
  lines.push('    "buttons": { "style": "rounded" },');
  lines.push('    "borderRadius": { "style": "rounded" },');
  lines.push('    "spacing": { "density": "comfortable" }');
  lines.push('  }');
  lines.push('}');
  lines.push('```');

  return lines.join('\n');
}
