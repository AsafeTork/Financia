var ADAPTERS = [];

export function registerAdapter(name, fn) {
  ADAPTERS.push({ name: name, detect: fn.detect, adapt: fn.adapt });
}

export function detectAndAdapt(rawResponse) {
  if (!rawResponse || typeof rawResponse !== 'string') {
    return { success: false, error: 'Resposta vazia ou invalida', adapted: false, detectedModel: null };
  }

  var trimmed = rawResponse.trim();

  for (var ai = 0; ai < ADAPTERS.length; ai++) {
    var adapter = ADAPTERS[ai];
    if (adapter.detect(trimmed)) {
      var adapted = adapter.adapt(trimmed);
      if (adapted) {
        var parsed = tryParseJSON(adapted);
        if (parsed) {
          return { success: true, json: parsed, adapted: true, detectedModel: adapter.name };
        }
      }
    }
  }

  var direct = tryParseJSON(trimmed);
  if (direct) {
    return { success: true, json: direct, adapted: false, detectedModel: 'unknown' };
  }

  var jsonBlock = extractJSONBlock(trimmed);
  if (jsonBlock) {
    var parsedBlock = tryParseJSON(jsonBlock);
    if (parsedBlock) {
      return { success: true, json: parsedBlock, adapted: true, detectedModel: 'generic_markdown' };
    }
  }

  return { success: false, error: 'Nao foi possivel extrair JSON valido da resposta', adapted: false, detectedModel: null };
}

function tryParseJSON(str) {
  try { return JSON.parse(str); } catch (_) { return null; }
}

function extractJSONBlock(text) {
  var match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match && match[1]) {
    var inner = match[1].trim();
    if (inner.startsWith('{') || inner.startsWith('[')) return inner;
  }
  var braceStart = text.indexOf('{');
  if (braceStart !== -1) {
    var depth = 0;
    var start = braceStart;
    for (var ci = start; ci < text.length; ci++) {
      var ch = text[ci];
      if (ch === '{') depth++;
      if (ch === '}') { depth--; if (depth === 0) return text.substring(start, ci + 1); }
    }
  }
  return null;
}

registerAdapter('chatgpt', {
  detect: function(t) { return t.includes('ChatGPT') || t.startsWith('Here') || t.startsWith('Claro') || t.startsWith('Aqui'); },
  adapt: function(t) {
    var block = extractJSONBlock(t);
    if (block) return block;
    var braceStart = t.indexOf('{');
    if (braceStart !== -1) {
      var depth = 0;
      for (var ci = braceStart; ci < t.length; ci++) {
        if (t[ci] === '{') depth++;
        if (t[ci] === '}') { depth--; if (depth === 0) return t.substring(braceStart, ci + 1); }
      }
    }
    return null;
  },
});

registerAdapter('claude', {
  detect: function(t) { return t.startsWith('{') || t.startsWith('```'); },
  adapt: function(t) {
    var block = extractJSONBlock(t);
    return block || null;
  },
});
