# VALIDATOR-4: PWA / Service Worker — Auditoria de Falhas

**Tipo:** REPORT  
**Status:** 🛑 FALHAS ENCONTRADAS  
**Data:** 2026-07-21  
**Validador:** VALIDATOR-4 (PWA offline + Service Worker)  

---

## Resumo

Foram identificadas **7 falhas** no Service Worker (`public/sw.js`). Nenhuma das estratégias de cache está correta para um app financeiro que precisa de dados frescos. O navigation preload está ativo mas produz **double-fetch**, o offline page nunca é exibida, e a estratégia SWR de API não tem controle de frescor.

---

## FALHA 1 — Navigation Preload habilitado mas NUNCA consumido → Double-fetch

**Arquivo:** `public/sw.js:54-56` (activate) + `public/sw.js:91-97` (fetch handler)

```js
// activate — preload habilitado
if (self.registration.navigationPreload) {
  return self.registration.navigationPreload.enable();
}

// fetch — IGNORA o preloadResponse e faz outro fetch()
e.respondWith(
  fetch(req).then(...)   // ← segundo fetch! o primeiro (preload) é descartado
);
```

**Problema:** O Navigation Preload é ativado corretamente em `activate`, mas o handler de navegação em `fetch` **nunca** lê `event.preloadResponse`. Em vez disso, chama `fetch(req)` diretamente, o que inicia **uma segunda requisição de rede**. O preload response (já baixado) é descartado.

**Citação:**  
> *"If navigation preload is enabled, but the fetch handler does not call `respondWith()`, we fallback to initiating a new request. This results in two requests to the server. The first navigation preload request and its response are thrown away."* — [W3C/ServiceWorker Issue #1611](https://github.com/w3c/ServiceWorker/issues/1611)  

> *"Using navigation preload directly in a service worker not powered by Workbox is tricky. First, it's not supported in all browsers. Secondly, it can be difficult to get right."* — [Chrome Developers docs on Navigation Preload](https://developer.chrome.com/docs/workbox/navigation-preload/)

**Impacto:** Performance **pior** com SW do que sem SW para navegação. Dobra o tráfego de rede em cada navegação. O benefício do preload (paralelismo com boot do SW) é anulado.

---

## FALHA 2 — Navegação sempre cacheia em `/` → deep links offline quebrados

**Arquivo:** `public/sw.js:91-99`

```js
if (req.mode === 'navigate') {
  e.respondWith(
    fetch(req).then(function(res) {
      if (res.ok) { var c = res.clone(); caches.open(CACHE).then(function(ca) { ca.put('/', c); }); }
      //                                ^^^^^^^^^^^^^^^^^^^^^^
      //  SEMPRE cacheia na chave "/", nunca na URL real
      return res;
    }).catch(function() {
      return caches.match('/').then(function(s) { return s || caches.match('/offline.html'); });
      //     ^^^^^^^^^^^^^^^^
      //  Offline: sempre serve "/", nunca "/dashboard" ou "/transactions"
    })
  );
}
```

**Problema:** A resposta de **qualquer navegação** (ex: `/dashboard`, `/transactions/123`) é armazenada no cache sob a chave `/`. Quando offline, **todas** as rotas recebem o conteúdo de `/`, ignorando a URL real. Um SPA com roteamento client-side pode até renderizar algo, mas:

1. Se o servidor renderiza HTML diferente por rota (SSR), o usuário recebe o conteúdo errado.
2. O cache é populado com chave errada — a próxima visita online a `/dashboard` sobrescreve `/` de novo, mas `/dashboard` nunca é cacheada.
3. Bookmark de `/transactions/123` quando offline nunca vai funcionar.

**Citação MDN:**  
> *"The ability to refer to any resource by a unique URL is one of the most powerful features of the web. PWAs can, and should, take advantage of this feature."* — [MDN: Best practices for PWAs — Support deep links](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices)

**Impacto:** Deep links falham offline. Experiência inconsistente. Qualquer rota que não seja `/` fica sem suporte offline.

---

## FALHA 3 — Offline page NUNCA é exibida (precached `/` sempre vence)

**Arquivo:** `public/sw.js:96`

```js
return caches.match('/').then(function(s) { return s || caches.match('/offline.html'); });
```

**Problema:** O `/offline.html` está em `STATIC` (linha 4) e é precached no `install`. Porém, no fallback de navegação, o handler **primeiro** tenta `caches.match('/')`. Como `/` é sempre precached (linha 4: `const STATIC = ['/', ...]`), o `s ||` nunca chega a avaliar `/offline.html`. O offline page personalizado **nunca é servido** — o usuário sempre vê a página inicial stale.

**Citação MDN:**  
> *"Your PWA should provide a custom offline page that informs the user that they are offline instead of showing the generic browser error page."* — [MDN: Best practices for PWAs — Provide an offline experience](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices)

**Impacto:** Recurso de offline page existe, é precached, mas é inalcançável. Usuário vê página inicial possivelmente quebrada em vez de mensagem clara de offline.

---

## FALHA 4 — SWR de API não tem verificação temporal → dados financeiros sempre servem stale

**Arquivo:** `public/sw.js:101-109`

```js
if (req.url.includes('/api/') && req.method === 'GET') {
  e.respondWith(
    caches.match(req).then(function(cached) {
      return cached || fp;  // Se QUALQUER cache existir, sempre serve stale primeiro
    })
  );
}
```

**Problema:** Não há `max-age` ou janela de frescor. Uma resposta de API cacheada há **dias** é servida instantaneamente antes da requisição de rede completar. Para um app **financeiro**, dados de saldo, transações e extratos ficam visivelmente desatualizados até a revalidação completar.

Uma implementação correta de SWR exige:
```js
// Correto: verificar timestamp do cache
const cachedResponse = await cache.match(request);
if (cachedResponse) {
  const cachedDate = new Date(cachedResponse.headers.get('date'));
  const age = (Date.now() - cachedDate.getTime()) / 1000;
  if (age < MAX_AGE_SECONDS) return cachedResponse;  // fresco: serve direto
}
```

**Citação:**  
> *"Stale-while-revalidate means: serve the cached version immediately (stale), and simultaneously fetch a fresh version from the network in the background (revalidate). The next request gets the fresh version."* — [renderlog: SWR caching strategies](https://renderlog.in/blog/service-worker-caching-strategies-workbox)  

> *"Generally, any response that updates at a known interval, is likely to be requested multiple times, and is static within that interval is a good candidate for short-term caching via max-age."* — [web.dev: Keeping things fresh with stale-while-revalidate](https://web.dev/articles/stale-while-revalidate)

Sem `max-age` e `stale-while-revalidate` via `Cache-Control`, a implementação não distingue dado fresco de dado velho.

**Impacto:** Dados financeiros stale visíveis ao usuário. Experiência inaceitável para um app de finanças.

---

## FALHA 5 — API handler não usa `event.waitUntil` → revalidação pode ser abortada

**Arquivo:** `public/sw.js:104`

```js
var fp = fetch(req).then(function(res) {
  if (res.ok) { var c = res.clone(); caches.open(CACHE).then(function(ca) { ca.put(req, c); }); }
  return res;
}).catch(function() { return cached; });
```

**Problema:** O fetch de revalidação (network update) não é envolvido em `event.waitUntil()`. O Service Worker pode ser terminado pelo navegador a qualquer momento entre eventos. Se o SW for morto antes do `fetch` + `cache.put` completarem, a revalidação é perdida silenciosamente e o cache nunca é atualizado.

```js
// Correto:
event.waitUntil(fetchAndCache(req));
```

**Citação MDN:**  
> *"The `event.waitUntil()` method extends the lifetime of the event. It's used to notify the browser that work is ongoing, and the service worker shouldn't be terminated."* — [MDN: ExtendableEvent.waitUntil()](https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil)

**Impacto:** Revalidações de API perdidas intermitentemente. Cache fica stale por mais tempo.

---

## FALHA 6 — Nenhum limite de tamanho de cache → crescimento infinito

**Arquivo:** `public/sw.js:146-154` (fallback network-first)

```js
e.respondWith(
  fetch(req).then(function(res) {
    if (res && res.status === 200) {
      var clone = res.clone();
      caches.open(CACHE).then(function(c) { c.put(req, clone); });
    }
    return res;
  }).catch(function() { return caches.match(req); })
);
```

**Problema:** O fallback genérico cacheia **toda** resposta GET same-origin `200` sem limites: sem `maxEntries`, sem `maxAgeSeconds`, sem LRU. Requests de API (já tratados no SWR), imagens, JSON, páginas — tudo acumula no mesmo bucket `CACHE` indefinidamente.

O navegador aplica quota (tipicamente 6–10% do disco), e quando atinge o limite, `caches.open(...).put(...)` começa a lançar `QuotaExceededError` silenciosamente, quebrando todo o mecanismo de cache.

**Citação:**  
> *"Implement cache size limits. Browser storage isn't infinite. Monitor your cache size and implement LRU (Least Recently Used) eviction for dynamic content."* — [CodeSamplez: Service Worker Caching Strategies](https://codesamplez.com/front-end/service-worker-caching-strategies)

**Impacto:** Cache cresce até o limite de quota. Operações de `cache.put()` falham silenciosamente. Todo o cache do SW para de funcionar.

---

## FALHA 7 — `caches.match(req)` no API SWR usa chave volátil

**Arquivo:** `public/sw.js:101-109`

```js
caches.match(req).then(function(cached) {
  var fp = fetch(req).then(function(res) { ... return res; }).catch(function() { return cached; });
  return cached || fp;
});
```

**Problema:** `caches.match(req)` usa o objeto `Request` completo como chave, incluindo headers como `Authorization`, `Cookie`, etc. Para um app financeiro com autenticação, cada requisição API pode ter headers diferentes. Isso significa:

1. O **cache nunca bate** se os headers diferem entre requisições (cache miss sempre → sem benefício)
2. Se bater, pode servir resposta de **outro usuário** se a resposta foi cacheada sem considerar o header de autenticação

**Citação:**  
> *"If a resource requires a fresh token in each request and you cannot cache the token, you cannot meaningfully cache the resource either."* — [renderlog: What service workers cannot cache](https://renderlog.in/blog/service-worker-caching-strategies-workbox)

**Impacto:** SWR de API é ineficaz (cache miss constante) ou inseguro (cross-user data leak).

---

## Tabela Resumo

| # | Falha | Gravidade | Linha |
|---|-------|-----------|-------|
| 1 | Navigation Preload produz double-fetch (nunca consumido) | **Crítica** | 54-56, 91-97 |
| 2 | Deep links offline quebrados (cache sempre em `/`) | **Alta** | 93 |
| 3 | Offline page inalcançável (precached `/` sempre vence) | **Alta** | 96 |
| 4 | SWR de API sem controle de frescor (dado financeiro stale) | **Crítica** | 101-109 |
| 5 | Revalidação de API sem `event.waitUntil` (pode ser abortada) | **Média** | 104 |
| 6 | Nenhum limite de tamanho de cache (crescimento infinito) | **Média** | 146-154 |
| 7 | `caches.match(req)` usa chave com headers de auth (cache miss ou vazamento) | **Alta** | 103 |

---

## Conclusão

O Service Worker tem **erros fundamentais de arquitetura**:

1. **Navigation Preload ativo mas inútil** — gera double-fetch, piorando performance em vez de melhorar.
2. **Offline parcialmente funcional** — apenas `/` funciona offline. Deep links, offline page personalizado, e dados financeiros frescos estão todos quebrados.
3. **Estratégia de API inadequada** — SWR sem validade temporal é inaceitável para dados financeiros, e a chave de cache com headers de auth o torna ineficaz ou inseguro.
4. **Sem gerenciamento de recursos** — sem limites de cache, sem `waitUntil`, sem proteção contra crescimento infinito.

**Nenhuma das 7 falhas pode ser ignorada.** Recomenda-se rescrita completa do fetch handler com Workbox ou implementação manual corrigindo todos os pontos acima.
