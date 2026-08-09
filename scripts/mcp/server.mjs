/* global process, setTimeout, clearTimeout, Buffer, fetch, AbortController */
import { spawn } from "node:child_process";
import { mkdir, writeFile, unlink, stat } from "node:fs/promises";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline";

const HOME = homedir();
const CWD = process.cwd();
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "coverage", ".next", ".cache", ".opencode"]);
const MAX_OUT = 30000;
const UA = "Mozilla/5.0 (X11; Linux x86_64) FinanciaNative/1.0";

const TOOLS = new Map();
const todo = [];

function reg(name, definition) {
  TOOLS.set(name, { name, ...definition });
}

function out(text, error) {
  const result = { content: [{ type: "text", text: String(text) }] };
  if (error) result.isError = true;
  return result;
}

function trimOut(s, n = MAX_OUT) {
  s = String(s);
  return s.length > n ? s.slice(0, n) + `\n...[truncated ${s.length - n} chars]` : s;
}

function fpath(p) {
  if (p.startsWith("/")) return p;
  if (p.startsWith("~")) return join(HOME, p.slice(1));
  return join(CWD, p);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function globToRegex(pattern) {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*") {
      if (pattern[i + 1] === "*") {
        re += ".*";
        i++;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else if (c === "{") {
      const end = pattern.indexOf("}", i);
      if (end > i) {
        re += "(" + pattern.slice(i + 1, end).split(",").map(escapeRe).join("|") + ")";
        i = end;
      } else {
        re += escapeRe(c);
      }
    } else {
      re += escapeRe(c);
    }
  }
  return new RegExp("^" + re + "$");
}

function walkFiles(root, outArr, rel = "") {
  let entries;
  try {
    entries = readdirSync(join(root, rel), { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walkFiles(root, outArr, rel ? join(rel, e.name) : e.name);
    } else if (e.isFile()) {
      outArr.push(rel ? join(rel, e.name) : e.name);
    }
  }
}

function humanSize(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)}K`;
  return `${(n / 1048576).toFixed(1)}M`;
}

async function exec(cmd, args, { timeout = 120000, cwd = CWD, env = {} } = {}) {
  return new Promise((resolveP) => {
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1", ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let so = "";
    let se = "";
    let killed = false;
    const timer = setTimeout(() => {
      killed = true;
      child.kill("SIGKILL");
    }, timeout);
    child.stdout.on("data", (d) => (so += d));
    child.stderr.on("data", (d) => (se += d));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolveP({ code, so, se, killed, error: null });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolveP({ code: -1, so, se, killed, error: err.message });
    });
  });
}

async function httpJson(url, { timeout = 30000, headers = {} } = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ac.signal, redirect: "follow", headers: { "user-agent": UA, ...headers } });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    return { status: res.status, data, text };
  } catch (e) {
    return { status: 0, data: null, text: e.message };
  } finally {
    clearTimeout(t);
  }
}

function listDir(p, depth) {
  const lines = [];
  const rec = (dir, lv) => {
    let ents;
    try {
      ents = readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      lines.push(`${"  ".repeat(lv)}! ${e.message}`);
      return;
    }
    ents.sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const e of ents) {
      if (lv === 0 && SKIP_DIRS.has(e.name)) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        lines.push(`${"  ".repeat(lv)}${e.name}/`);
        if (lv < depth) rec(full, lv + 1);
      } else {
        let sz = "";
        try {
          sz = " " + humanSize(statSync(full).size);
        } catch {
          /* stat may fail for race-deleted entries */
        }
        lines.push(`${"  ".repeat(lv)}${e.name}${sz}`);
      }
    }
  };
  rec(p, 0);
  return out(lines.join("\n") || "(empty)");
}

/* ============================== core tools ============================== */

reg("n_read", {
  description: "Read a text file with line numbers (offset/limit) or list a directory.",
  inputSchema: {
    type: "object",
    properties: {
      filePath: { type: "string", description: "Absolute or project-relative path" },
      offset: { type: "number", description: "First line (1-based)" },
      limit: { type: "number", description: "Max lines" },
      raw: { type: "boolean", description: "Content without line numbers" },
    },
    required: ["filePath"],
  },
  run: async ({ filePath, offset, limit, raw }) => {
    const p = fpath(filePath);
    let st;
    try {
      st = await stat(p);
    } catch (e) {
      return out(`not found: ${e.message}`, true);
    }
    if (st.isDirectory()) return listDir(p, 1);
    const buf = readFileSync(p);
    if (buf.indexOf(0) >= 0) return out(`binary file (${buf.length} bytes) — use n_bash to handle it`);
    let text = buf.toString("utf8");
    if (text.length > 500000) text = text.slice(0, 500000) + "\n...[truncated]";
    if (raw) return out(text);
    const lines = text.split("\n");
    const start = Math.max(1, Number(offset) || 1);
    const end = Math.min(lines.length, start + (Number(limit) || 4000) - 1);
    const body = lines
      .slice(start - 1, end)
      .map((l, i) => `${String(start + i).padStart(5)}: ${l}`)
      .join("\n");
    if (offset == null && limit == null) return out(`${p} (${lines.length} lines)\n${body}`);
    return out(`${p} lines ${start}-${end} of ${lines.length}\n${body}`);
  },
});

reg("n_list", {
  description: "List a directory tree with sizes (depth limited).",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory (default: repo root)" },
      depth: { type: "number", description: "Recursion depth (default 2, max 6)" },
    },
    required: [],
  },
  run: async ({ path, depth }) => listDir(fpath(path || CWD), Math.min(Number(depth) || 2, 6)),
});

reg("n_write", {
  description: "Create or overwrite a file, creating parent directories.",
  inputSchema: {
    type: "object",
    properties: {
      filePath: { type: "string" },
      content: { type: "string" },
    },
    required: ["filePath", "content"],
  },
  run: async ({ filePath, content }) => {
    const p = fpath(filePath);
    try {
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, content, "utf8");
      return out(`wrote ${p} (${Buffer.byteLength(content)} bytes)`);
    } catch (e) {
      return out(`write failed: ${e.message}`, true);
    }
  },
});

reg("n_edit", {
  description: "Replace exact text in a file. Fails safely when not found or ambiguous.",
  inputSchema: {
    type: "object",
    properties: {
      filePath: { type: "string" },
      oldString: { type: "string", description: "Exact existing text" },
      newString: { type: "string" },
      replaceAll: { type: "boolean", description: "Replace all occurrences (default true)" },
      dryRun: { type: "boolean", description: "Only report the match count" },
    },
    required: ["filePath", "oldString", "newString"],
  },
  run: async ({ filePath, oldString, newString, replaceAll, dryRun }) => {
    const p = fpath(filePath);
    let text;
    try {
      text = readFileSync(p, "utf8");
    } catch (e) {
      return out(`edit failed: ${e.message}`, true);
    }
    const count = text.split(oldString).length - 1;
    if (count === 0) return out(`oldString not found in ${p}`, true);
    if (count > 1 && replaceAll === false)
      return out(`oldString found ${count} times — use replaceAll=true or more context`, true);
    const updated = replaceAll === false ? text.replace(oldString, newString) : text.split(oldString).join(newString);
    if (dryRun) return out(`matches=${count}`);
    try {
      await writeFile(p, updated, "utf8");
    } catch (e) {
      return out(`edit failed: ${e.message}`, true);
    }
    return out(`edited ${p} (${count} occurrence${count > 1 ? "s" : ""})`);
  },
});

reg("n_apply_patch", {
  description: "Apply a unified diff (git apply) to the working tree.",
  inputSchema: {
    type: "object",
    properties: {
      patch: { type: "string", description: "Unified diff text" },
      reverse: { type: "boolean" },
    },
    required: ["patch"],
  },
  run: async ({ patch, reverse }) => {
    const tmp = join("/tmp", `native-patch-${Date.now()}.diff`);
    try {
      await writeFile(tmp, patch, "utf8");
      const r = await exec("git", ["apply", "--whitespace=nowarn", ...(reverse ? ["-R"] : []), tmp], { cwd: CWD });
      return r.code === 0
        ? out(`patch applied (${Buffer.byteLength(patch)} bytes)`)
        : out(`git apply failed (exit ${r.code}):\n${trimOut(r.se, 3000)}`, true);
    } finally {
      try {
        await unlink(tmp);
      } catch {
        /* temp file already gone */
      }
    }
  },
});

reg("n_bash", {
  description: "Run a shell command. Returns stdout, stderr and exit code.",
  inputSchema: {
    type: "object",
    properties: {
      command: { type: "string" },
      cwd: { type: "string", description: "Working directory (default: repo root)" },
      timeout: { type: "number", description: "Timeout ms (default 120000)" },
    },
    required: ["command"],
  },
  run: async ({ command, cwd, timeout }) => {
    const r = await exec("bash", ["-lc", command], { timeout: timeout || 120000, cwd: cwd ? fpath(cwd) : CWD });
    const msg = `exit=${r.error ? "spawn-error" : r.killed ? "timeout" : r.code}\n--- stdout ---\n${r.so}\n--- stderr ---\n${r.se}`;
    return out(trimOut(msg), r.error ? true : r.code !== 0);
  },
});

reg("n_glob", {
  description: "Find files by glob pattern (** supported). Returns relative paths.",
  inputSchema: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "e.g. src/**/*.jsx" },
      cwd: { type: "string" },
      maxResults: { type: "number", default: 500 },
    },
    required: ["pattern"],
  },
  run: async ({ pattern, cwd, maxResults }) => {
    const root = fpath(cwd || CWD);
    const rx = globToRegex(pattern);
    const files = [];
    walkFiles(root, files);
    const matched = files.filter((f) => rx.test(f.replace(/\\/g, "/")));
    const cap = maxResults || 500;
    const shown = matched.slice(0, cap).map((f) => f.replace(/\\/g, "/"));
    const extra = matched.length - shown.length;
    return out(shown.length ? `${shown.join("\n")}${extra > 0 ? `\n... plus ${extra} more` : ""}` : `no matches for ${pattern}`);
  },
});

reg("n_grep", {
  description: "Search file contents with a regex. Results: path:line: content.",
  inputSchema: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Regular expression" },
      path: { type: "string", description: "File or directory (default: repo root)" },
      include: { type: "string", description: "Filename glob filter" },
      ignoreCase: { type: "boolean" },
      maxResults: { type: "number", default: 100 },
    },
    required: ["pattern"],
  },
  run: async ({ pattern, path, include, ignoreCase, maxResults }) => {
    let rx;
    try {
      rx = new RegExp(pattern, ignoreCase ? "i" : "");
    } catch (e) {
      return out(`invalid regex: ${e.message}`, true);
    }
    const p = fpath(path || CWD);
    let st;
    try {
      st = await stat(p);
    } catch (e) {
      return out(`path not found: ${e.message}`, true);
    }
    const fileRx = include ? globToRegex(include) : null;
    const hits = [];
    const scan = (file, rel) => {
      if (fileRx && !fileRx.test(rel.replace(/\\/g, "/"))) return;
      let text;
      try {
        text = readFileSync(file, "utf8");
      } catch {
        return;
      }
      const lines = text.split("\n");
      for (let i = 0; i < lines.length && hits.length < (maxResults || 100); i++) {
        if (rx.test(lines[i])) hits.push(`${rel.replace(/\\/g, "/")}:${i + 1}: ${lines[i].slice(0, 300)}`);
      }
    };
    if (st.isFile()) {
      scan(p, basename(p));
    } else {
      const files = [];
      walkFiles(p, files);
      for (const f of files) scan(join(p, f), f);
    }
    return out(hits.length ? hits.join("\n") : `no matches for ${pattern}`);
  },
});

/* ============================== web tools ============================== */

reg("n_webfetch", {
  description: "Fetch a URL and return its text content (HTML stripped to text).",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string" },
      format: { type: "string", enum: ["markdown", "text", "html"], default: "markdown" },
      timeout: { type: "number", default: 60000 },
    },
    required: ["url"],
  },
  run: async ({ url, format, timeout }) => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeout || 60000);
    try {
      const res = await fetch(url, { signal: ac.signal, redirect: "follow", headers: { "user-agent": UA } });
      const raw = await res.text();
      if (res.status >= 400) return out(`HTTP ${res.status} from ${url}\n${raw.slice(0, 2000)}`, true);
      const isHtml = /html/i.test(res.headers.get("content-type") || "");
      const text = isHtml ? htmlToText(raw, format === "html" ? "html" : "markdown") : raw;
      return out(`URL ${res.url} (${res.status})\n${trimOut(text, 60000)}`);
    } catch (e) {
      return out(`fetch failed: ${e.message}`, true);
    } finally {
      clearTimeout(t);
    }
  },
});

reg("n_websearch", {
  description: "Web search (DuckDuckGo). Returns title, URL and snippet per result.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      numResults: { type: "number", default: 8 },
    },
    required: ["query"],
  },
  run: async ({ query, numResults }) => {
    const r = await httpJson(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { timeout: 30000 });
    if (r.status !== 200) return out(`search failed (HTTP ${r.status}): ${r.text.slice(0, 300)}`, true);
    const results = parseDdg(r.text).slice(0, numResults || 8);
    if (!results.length) return out(`no results for "${query}"`);
    return out(results.map((res, i) => `${i + 1}. ${res.title}\n   ${res.url}\n   ${res.snippet}\n`).join(""));
  },
});

function parseDdg(html) {
  const items = [];
  const blocks = html.split('class="result__a"');
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const title = b.match(/>([^<]*)<\/a>/);
    const href = b.match(/href="([^"]+)"/);
    const snippet = b.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
    if (!href) continue;
    const uddg = href[1].match(/uddg=([^&]+)/);
    items.push({
      title: title ? title[1].trim() : "",
      url: uddg ? decodeURIComponent(uddg[1]) : href[1],
      snippet: snippet ? collapseHtml(snippet[1]) : "",
    });
  }
  return items;
}

function collapseHtml(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}

function htmlToText(html, mode) {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  if (mode === "html") return trimOut(stripped, 60000);
  return trimOut(
    stripped
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .split("\n")
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n"),
    60000
  );
}

/* ============================== free API tools ============================== */

reg("n_currency", {
  description: "Exchange rates/conversion (ECB/Frankfurter, free). Rates are daily ECB data.",
  inputSchema: {
    type: "object",
    properties: {
      from: { type: "string", description: "Base currency (default BRL)", default: "BRL" },
      to: { type: "string", description: "Target currency, comma list (default USD)", default: "USD" },
      amount: { type: "number", description: "Amount to convert (default 1)" },
    },
    required: [],
  },
  run: async ({ from, to, amount }) => {
    const a = Number(amount) || 1;
    const [f, t] = [from || "BRL", to || "USD"];
    const r = await httpJson(`https://api.frankfurter.app/latest?from=${f.toUpperCase()}&to=${t.toUpperCase()}`);
    if (r.status !== 200 || !r.data?.rates) return out(`currency API failed (HTTP ${r.status}): ${(r.data?.message || r.text || "").slice(0, 300)}`, true);
    const lines = [f.toUpperCase(), `source: https://api.frankfurter.app (ECB daily rates)`];
    for (const [cur, rate] of Object.entries(r.data.rates)) {
      lines.push(`${cur.toUpperCase()}: 1 ${f.toUpperCase()} = ${rate} ${cur.toUpperCase()}  |  ${a} ${f.toUpperCase()} = ${(a * rate).toFixed(4)} ${cur.toUpperCase()}`);
    }
    return out(lines.join("\n"));
  },
});

reg("n_cep", {
  description: "Brazilian postal code lookup (ViaCEP, free). Returns the address.",
  inputSchema: {
    type: "object",
    properties: {
      cep: { type: "string", description: "8-digit CEP, e.g. 01001000" },
    },
    required: ["cep"],
  },
  run: async ({ cep }) => {
    const c = String(cep || "").replace(/\D/g, "");
    if (c.length !== 8) return out(`invalid CEP: "${cep}"`, true);
    const r = await httpJson(`https://viacep.com.br/ws/${c}/json/`);
    if (r.status !== 200) return out(`ViaCEP failed (HTTP ${r.status})`, true);
    if (r.data?.erro) return out("CEP not found", true);
    return out(
      `CEP: ${r.data.cep}\nLogradouro: ${r.data.logradouro}\nBairro: ${r.data.bairro}\nCidade: ${r.data.localidade}/${r.data.uf}\nIBGE: ${r.data.ibge}\nComplemento: ${r.data.complemento || "-"}`
    );
  },
});

reg("n_cnpj", {
  description: "Brazilian company lookup (ReceitaWS, free, rate-limited). Company status, address, owners.",
  inputSchema: {
    type: "object",
    properties: {
      cnpj: { type: "string", description: "14 digits, e.g. 11444777000161" },
    },
    required: ["cnpj"],
  },
  run: async ({ cnpj }) => {
    const c = String(cnpj || "").replace(/\D/g, "");
    if (c.length !== 14) return out(`invalid CNPJ: "${cnpj}"`, true);
    const r = await httpJson(`https://www.receitaws.com.br/v1/cnpj/${c}`, { timeout: 60000 });
    if (r.status !== 200 || !r.data?.status) return out(`ReceitaWS failed (HTTP ${r.status}): ${r.text.slice(0, 300)}`, true);
    const d = r.data;
    return out(
      `CNPJ: ${d.cnpj}\nRazao social: ${d.nome}\nNome fantasia: ${d.fantasia || "-"}\nStatus: ${d.status} (${d.situacao || "-"}) desde ${d.data_situacao || "-"}\nAtividade: ${d.atividade_principal?.[0]?.text || "-"}\nEndereco: ${d.logradouro}, ${d.numero} - ${d.municipio}/${d.uf} ${d.cep || ""}\nTelefone: ${d.telefone || "-"}\nData abertura: ${d.abertura || "-"}\nCapital social: ${d.capital_social || "-"}\nSocios: ${(d.qsa || []).map((q) => `${q.nome_socio} (${q.qual_socio})`).join("; ") || "-"}`
    );
  },
});

reg("n_ipinfo", {
  description: "IP address geolocation (ip-api.com, free, 45 req/min).",
  inputSchema: {
    type: "object",
    properties: {
      ip: { type: "string", description: "IPv4 (default: current IP)" },
    },
    required: [],
  },
  run: async ({ ip }) => {
    const url = ip ? `http://ip-api.com/json/${encodeURIComponent(ip)}?lang=pt-BR` : "http://ip-api.com/json/?lang=pt-BR";
    const r = await httpJson(url, { timeout: 20000 });
    if (r.status !== 200 || !r.data || r.data.status !== "success") {
      return out(`ip lookup failed (HTTP ${r.status}): ${r.data?.message || r.data?.status || r.text.slice(0, 300)}`, true);
    }
    return out(
      `IP: ${r.data.query}\nPaís: ${r.data.country} (${r.data.countryCode})\nRegião: ${r.data.regionName}\nCidade: ${r.data.city}\nISP: ${r.data.isp}\nLat/Lon: ${r.data.lat}, ${r.data.lon}`
    );
  },
});

reg("n_weather", {
  description: "Weather forecast (Open-Meteo, free, no key). Requires lat/lon.",
  inputSchema: {
    type: "object",
    properties: {
      latitude: { type: "number" },
      longitude: { type: "number" },
      days: { type: "number", description: "Forecast days (default 3, max 7)" },
    },
    required: ["latitude", "longitude"],
  },
  run: async ({ latitude, longitude, days }) => {
    const n = Math.min(Math.max(Number(days) || 3, 1), 7);
    const r = await httpJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&forecast_days=${n}&timezone=auto`
    );
    if (r.status !== 200 || !r.data?.daily) return out(`weather failed (HTTP ${r.status}): ${r.text.slice(0, 300)}`, true);
    const d = r.data.daily;
    const codes = { 0: "céu limpo", 1: "maiormente limpo", 2: "parcialmente nublado", 3: "encoberto", 45: "névoa", 48: "névoa congelante", 51: "garoa", 61: "chuva leve", 63: "chuva", 65: "chuva forte", 71: "neve leve", 73: "neve", 75: "neve forte", 80: "pancadas leves", 81: "pancadas", 82: "pancadas fortes", 95: "trovoada" };
    const lines = [`Previsão ${d.time[0]}..${d.time.at(-1)} (${d.time.length} dias)`];
    d.time.forEach((date, i) => {
      lines.push(`${date}: ${d.temperature_2m_min[i]}°C..${d.temperature_2m_max[i]}°C | chuva ${d.precipitation_probability_max[i]}% | ${codes[d.weathercode[i]] || d.weathercode[i]}`);
    });
    return out(lines.join("\n"));
  },
});

reg("n_github", {
  description: "GitHub API queries (free, unauthenticated 60 req/h). repo, releases or commits of a repo.",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string" },
      repo: { type: "string" },
      kind: { type: "string", enum: ["repo", "releases", "commits"], default: "repo" },
      limit: { type: "number", default: 5 },
    },
    required: ["owner", "repo"],
  },
  run: async ({ owner, repo, kind, limit }) => {
    const k = kind || "repo";
    const n = Math.min(Math.max(Number(limit) || 5, 1), 30);
    const base = `https://api.github.com/repos/${owner}/${repo}`;
    const url = k === "repo" ? base : `${base}/${k}?per_page=${n}`;
    const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    const headers = ghToken ? { authorization: `Bearer ${ghToken}` } : {};
    const r = await httpJson(url, { headers });
    if (r.status === 403) return out("GitHub rate limit exceeded (60 req/h sem token). Defina GITHUB_TOKEN/GH_TOKEN para mais.", true);
    if (r.status !== 200) return out(`GitHub API failed (HTTP ${r.status})`, true);
    if (k === "repo") {
      const d = r.data;
      return out(`${d.full_name} — ${d.description || "sem descrição"}\nstars: ${d.stargazers_count} | forks: ${d.forks_count} | open issues: ${d.open_issues_count}\nlanguage: ${d.language} | license: ${d.license?.spdx_id || "-"}\nupdated: ${d.updated_at}\nurl: ${d.html_url}`);
    }
    const items = Array.isArray(r.data) ? r.data : [];
    return out(items.length ? items.map((it, i) => `${i + 1}. ${it.tag_name || it.name || (it.commit?.message || "").split("\n")[0]} (${it.published_at || it.created_at || it.commit?.author?.date || "-"})`).join("\n") : `no ${k} found`);
  },
});

reg("n_npm", {
  description: "npm registry info (free): latest version, size, deps and download stats.",
  inputSchema: {
    type: "object",
    properties: {
      package: { type: "string", description: "Package name, e.g. vite" },
      scope: { type: "string", description: "Optional scope, e.g. @opencode-ai" },
    },
    required: ["package"],
  },
  run: async ({ package: pkg, scope }) => {
    const name = scope ? `${scope}/${pkg}` : pkg;
    const [meta, dl] = await Promise.all([
      httpJson(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`),
      httpJson(`https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(name)}`),
    ]);
    if (meta.status !== 200 || !meta.data) return out(`npm registry failed (HTTP ${meta.status})`, true);
    const d = meta.data;
    const lines = [
      `${name}@${d.version}`,
      `description: ${d.description || "-"}`,
      `license: ${d.license || "-"} | deps: ${Object.keys(d.dependencies || {}).length} | bin: ${Object.keys(d.bin || {}).join(", ") || "-"}`,
      `engines: ${JSON.stringify(d.engines || {})}`,
      `dist.tarball: ${d.dist?.tarball || "-"}`,
    ];
    if (dl.data) lines.push(`downloads last month: ${dl.data.downloads.toLocaleString("pt-BR")}`);
    return out(lines.join("\n"));
  },
});

/* ============================== orchestration tools ============================== */

reg("n_task", {
  description: "Spawn a subagent via 'opencode run' isolated to this MCP (agent mcp-only). Returns the final message.",
  inputSchema: {
    type: "object",
    properties: {
      description: { type: "string" },
      subagent_type: { type: "string", description: "Agent: mcp-only (default), quick, explore, general ou reviewer", default: "mcp-only" },
      prompt: { type: "string", description: "Self-contained instructions" },
      model: { type: "string" },
      timeout: { type: "number", default: 600000 },
    },
    required: ["prompt"],
  },
  run: async ({ description, subagent_type, prompt, model, timeout }) => {
    const agent = subagent_type || "mcp-only";
    const args = ["run"];
    if (description) args.push("--title", String(description).slice(0, 80));
    args.push("--agent", agent);
    if (model) args.push("--model", model);
    args.push("--format", "json");
    args.push(prompt);
    const r = await exec("opencode", args, { timeout: timeout || 600000, cwd: CWD, env: { OPENCODE_NON_INTERACTIVE: "1" } });
    if (r.error) return out(`cannot spawn opencode: ${r.error}`, true);
    const chunks = [];
    const toolCalls = [];
    try {
      const events = r.so
        .split("\n")
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      for (const e of events) {
        const parts = e.parts || (e.part ? [e.part] : []);
        for (const p of parts) {
          if (p.type === "text" && p.text) chunks.push(p.text);
          if (p.type === "tool" && p.tool) {
            const t = p.tool.startsWith("native_") ? p.tool.slice(7) : p.tool;
            toolCalls.push(t.startsWith("n_") ? t : `NÃO-MCP:${t}`);
          }
        }
      }
    } catch {
      /* event stream may contain non-JSON banner lines */
    }
    if (r.killed) return out(`subagent timed out after ${Math.round((timeout || 600000) / 1000)}s`, true);
    if (r.code !== 0 && !chunks.length) return out(`subagent exited ${r.code}: ${trimOut(r.se, 2000)}`, true);
    const header = `[${agent} done, exit ${r.code}]\ntools usados: ${toolCalls.length ? [...new Set(toolCalls)].join(", ") : "nenhum"}`;
    return out(header + (chunks.length ? `\n\n${trimOut(chunks.join("\n"), 20000)}` : "\n(sem resposta)"));
  },
});

/* ============================== state/meta tools ============================== */

reg("n_todowrite", {
  description: "Replace the server-side task list (in-memory).",
  inputSchema: {
    type: "object",
    properties: {
      todos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            content: { type: "string" },
            status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"] },
            priority: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["content"],
        },
      },
    },
    required: ["todos"],
  },
  run: ({ todos }) => {
    todo.length = 0;
    for (const t of todos) todo.push({ content: t.content, status: t.status || "pending", priority: t.priority || "medium" });
    return out(JSON.stringify(todo, null, 2));
  },
});

reg("n_todo", {
  description: "Read the in-memory task list.",
  inputSchema: { type: "object", properties: {}, required: [] },
  run: () => out(todo.length ? JSON.stringify(todo, null, 2) : "(empty)"),
});

reg("n_tools_info", {
  description: "List every tool exposed by this server, one line each.",
  inputSchema: { type: "object", properties: {}, required: [] },
  run: () => out([...TOOLS.values()].map((t) => `${t.name} — ${t.description}`).join("\n")),
});

reg("n_question", {
  description: "Register a question for the user (MCP cannot render interactive options).",
  inputSchema: {
    type: "object",
    properties: {
      question: { type: "string" },
      options: { type: "array", items: { type: "string" } },
    },
    required: ["question"],
  },
  run: ({ question, options }) =>
    out(
      `QUESTION: ${question}${options?.length ? ` | options: ${options.join(" / ")}` : ""}\n(The main agent must ask the user directly; no interactive prompt exists inside MCP.)`
    ),
});

reg("n_skill", {
  description: "Load a skill's SKILL.md by name from all local skill directories.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
    },
    required: ["name"],
  },
  run: async ({ name }) => {
    const candidates = [
      join(CWD, ".agents", "skills", name, "SKILL.md"),
      join(CWD, ".opencode", "skills", name, "SKILL.md"),
      join(HOME, ".claude", "skills", name, "SKILL.md"),
      join(HOME, ".agents", "skills", name, "SKILL.md"),
      join(HOME, ".config", "opencode", "skills", name, "SKILL.md"),
    ];
    for (const f of candidates) {
      if (existsSync(f)) {
        return out(`# skill ${name}\nsource: ${f}\n\n${trimOut(readFileSync(f, "utf8"), 40000)}`);
      }
    }
    const known = await skillNames();
    return out(`skill "${name}" not found. Available: ${known.join(", ") || "(none)"}`, true);
  },
});

async function skillNames() {
  const roots = [
    [CWD, ".agents", "skills"],
    [CWD, ".opencode", "skills"],
    [HOME, ".claude", "skills"],
    [HOME, ".agents", "skills"],
    [HOME, ".config", "opencode", "skills"],
  ];
  const names = new Set();
  for (const r of roots) {
    const base = join(...r);
    if (!existsSync(base)) continue;
    for (const d of readdirSync(base, { withFileTypes: true })) {
      if (d.isDirectory() && existsSync(join(base, d.name, "SKILL.md"))) names.add(d.name);
    }
  }
  return [...names].sort();
}

reg("n_plan", {
  description: "Plan mode cannot be toggled from an MCP server; use /plan in the TUI.",
  inputSchema: { type: "object", properties: {}, required: [] },
  run: () => out("To enter/exit plan mode use the TUI command /plan. No equivalent exists inside this MCP."),
});

/* ============================== MCP protocol ============================== */

function sendToHost(obj) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...obj }) + "\n");
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on("line", async (raw) => {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }
  if (msg.id === undefined || msg.id === null) return;
  if (msg.method === "initialize") {
    sendToHost({
      id: msg.id,
      result: {
        protocolVersion: msg.params?.protocolVersion || "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "opencode-native", version: "2.0.0" },
      },
    });
    return;
  }
  if (msg.method === "ping") {
    sendToHost({ id: msg.id, result: {} });
    return;
  }
  if (msg.method === "tools/list") {
    sendToHost({
      id: msg.id,
      result: {
        tools: [...TOOLS.values()].map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      },
    });
    return;
  }
  if (msg.method === "tools/call") {
    const { name, arguments: args } = msg.params || {};
    const tool = TOOLS.get(name);
    if (!tool) {
      sendToHost({ id: msg.id, result: { content: [{ type: "text", text: `unknown tool: ${name}` }], isError: true } });
      return;
    }
    try {
      const result = await tool.run(args || {});
      sendToHost({ id: msg.id, result });
    } catch (e) {
      sendToHost({ id: msg.id, result: { content: [{ type: "text", text: `tool error: ${e?.message || e}` }], isError: true } });
    }
    return;
  }
  if (msg.method?.startsWith("notifications/")) return;
});