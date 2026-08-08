import { ldb } from './dexie.js';
import { askAI } from './aiClient.js';

// Categorização inteligente de despesas com aprendizado local:
//  1) regras locais aprendidas (descricao normalizada -> categoria) vivem no
//     Dexie meta por usuário — funcionam offline, sem custo de API e melhoram
//     com cada correção manual do usuário;
//  2) heurística de palavras-chave cobre descrições comuns de microempreendedores;
//  3) IA (modo 'categorize' na EF ai) apenas para o que não casou — e cada
//     resposta aceita vira regra local (aprendizado em loop).

export var CATEGORIES = ['Fixo', 'Variavel', 'Estoque', 'Marketing', 'Pessoal', 'Servicos', 'Outro'];

var RULES_KEY = function(uid) { return 'catrules_' + uid; };

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').trim().replace(/\s+/g, ' ');
}

export async function getRules(uid) {
  try { var r = await ldb.meta.get(RULES_KEY(uid)); return (r && r.val) || {}; }
  catch { return {}; }
}

export async function setRules(uid, rules) {
  return ldb.meta.put({ key: RULES_KEY(uid), val: rules || {} });
}

// Aprende(ou reforça) a regra descricao -> categoria. Chamado quando o usuário
// salva uma edição manual de despesa (o app aprende com o dono do negócio).
export async function learnCategory(uid, desc, cat) {
  if (!uid || !desc || !cat) return;
  var rules = await getRules(uid);
  var key = norm(desc);
  if (!key) return;
  rules[key] = cat;
  await setRules(uid, rules);
}

// Palavras-chave heuristicas. Ordem importa: primeira chave vence.
var HEURISTICS = [
  { cat: 'Fixo',     words: ['aluguel', 'agua', 'luz', 'energia', 'internet', 'telefone', 'seguro', 'condominio', 'assinatura', 'caderno', 'mensalidade', 'certificado', 'domini'] },
  { cat: 'Variavel', words: ['ifood', 'uber', '99', 'mercado', 'combustivel', 'gasolina', 'refeicao', 'lanche', 'alimentacao', 'supermercado', 'farmacia', 'transporte', 'passagem', 'pedagio'] },
  { cat: 'Estoque',  words: ['fornecedor', 'estoque', 'mercadoria', 'mataria', 'materia', 'insumo', 'compra insumo', 'revenda', 'atacado'] },
  { cat: 'Marketing', words: ['anuncio', 'ads', 'marketing', 'meta ads', 'google ads', 'impulsionar', 'publicidade', 'redes sociais', 'design grafico', 'arte para'] },
  { cat: 'Pessoal',  words: ['salario', 'pro-labore', 'beneficio', 'vale transporte', 'vale alimentacao', 'bonus', 'comissao', 'decimo', 'ferias', 'inss', 'contribuicao'] },
  { cat: 'Servicos', words: ['contador', 'contabilidade', 'frete', 'manutencao', 'servico', 'reparo', 'conserto', 'consultoria', 'limpeza', 'oficina'] },
];

export function heuristica(desc) {
  var key = norm(desc);
  if (!key) return null;
  for (var i = 0; i < HEURISTICS.length; i++) {
    var h = HEURISTICS[i];
    for (var j = 0; j < h.words.length; j++) {
      if (key.indexOf(h.words[j]) !== -1) return h.cat === 'Varia' ? 'Variavel' : h.cat;
    }
  }
  return null;
}

export function applyRules(rules, desc) {
  var key = norm(desc);
  if (key && rules[key]) return rules[key];
  return null;
}

// Categoriza uma lista [{id, desc}] em lotes. Devolve [{id, desc, categoria|null}].
// IA só para os sem regra/heurística; erros / ia indisponível nunca derrubam o fluxo.
export async function categorizeBatch(uid, items) {
  var out = items.map(function(it) { return { id: it.id, desc: it.desc, category: null }; });
  var pending = [];
  var rules = await getRules(uid).catch(function() { return {}; });
  for (var i = 0; i < out.length; i++) {
    var c = classifyRules(rules, out[i].desc) || heuristica(out[i].desc);
    if (c) out[i].category = c; else pending.push(out[i]);
  }
  if (!pending.length) return out;

  var prompt = pending.map(function(p, idx) { return idx + '|' + String(p.desc).slice(0, 80); }).join('\n');
  try {
    var res = await askAI(prompt, { mode: 'categorize', maxTokens: 400 });
    var map = {};
    if (res && res.ok && res.text && res.text.indexOf('{') !== -1) {
      var start = res.text.indexOf('{');
      var end = res.text.lastIndexOf('}');
      var data = JSON.parse(res.text.slice(start, end + 1));
      Object.keys(data).forEach(function(k) { map[String(k).trim()] = data[k]; });
    }
    var newRules = Object.assign({}, rules);
    for (var j = 0; j < pending.length; j++) {
      var cat = map[String(j)] || map[pending[j].desc] || heuristica(pending[j].desc);
      if (cat && CATEGORIES.indexOf(cat) !== -1) {
        pending[j].category = cat;
        newRules[norm(pending[j].desc)] = cat;
      }
      if (!cat) pending[j].category = heuristica(pending[j].desc);
    }
    if (Object.keys(newRules).length > Object.keys(rules).length) await setRules(uid, newRules);
  } catch {
    for (var k = 0; k < pending.length; k++) pending[k].category = heuristica(pending[k].desc);
  }
  return out;
}

export function classifyRules(rules, desc) {
  return applyRules(rules, desc);
}