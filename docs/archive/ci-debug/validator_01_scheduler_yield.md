# VALIDATOR REPORT: scheduler.yield() in AiInsightsCard.jsx

**Validator:** VALIDATOR-1 (scheduler.yield)
**File:** `src/shared/ui/AiInsightsCard.jsx`
**Status:** ❌ **FALSIFIED** — 4 critical flaws found

---

## What the code currently does

```js
function yieldToMain() {
  if (globalThis.scheduler?.yield) return scheduler.yield();
  return new Promise(function(r) { setTimeout(r, 0); });
}
```

Used once inside `gerarInsights`, **after** the state update (`setAiLoading(true)`) but **before** the sync data-crunching (`.filter().reduce()`) and the `askAI()` call:

```js
setAiLoading(true); setAiErr(''); setAiText('');
await yieldToMain();
// ... then expensive filter/reduce/format + askAI()
```

---

## Flaw #1 — Safari not supported; fallback is suboptimal

`scheduler.yield()` is **not supported in Safari** as of mid-2026. Global coverage: ~70.78% (Chrome 129+, Edge 129+, Firefox 142+, Opera). Safari and Safari iOS show ❌ on all versions.

- MDN: _"This feature is not Baseline because it does not work in some of the most widely-used browsers."_
  https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield
- Caniuse: Safari ❌ all versions; global support 70.78%
  https://caniuse.com/mdn-api_scheduler_yield
- Web Perf Clinic (May 2026): _"Safari hasn't implemented it yet. Roughly 70% of global traffic supports the API natively; the rest need a fallback."_
  https://webperfclinic.com/article/scheduler-yield-break-up-long-tasks-fix-inp-2026

**The `setTimeout(0)` fallback has two problems:**

1. **4ms nested-timer clamp** — After 5 nested `setTimeout(0)` calls, HTML spec mandates a minimum 4ms delay. If `yieldToMain()` were called repeatedly (e.g., inside a loop), the Nth+5 call would be penalized.
   - https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html
   - https://subhsen.dev/blog/settimeout-is-never-zero

2. **Continuation goes to the back of the queue** — `setTimeout(0)` schedules the continuation as a normal macrotask at the END of the queue, so third-party scripts or other timers can interleave. `scheduler.yield()` gives continuation priority (resumes before other queued tasks). The fallback loses this benefit entirely.
   - https://danholloran.me/posts/scheduler-yield-the-one-liner-that-fixes-your-inp

**Better fallback:** `MessageChannel` (avoids the 4ms clamp; used by React's own scheduler):
https://webperfclinic.com/article/scheduler-yield-break-up-long-tasks-fix-inp-2026

---

## Flaw #2 — Only yields once; work is not split incrementally

The single `await yieldToMain()` happens **before** the computational work, but the entire `.filter().reduce().sort().map().join()` runs synchronously after it. If the `mtx` array is large (>10k entries), this chain still blocks the main thread for tens of milliseconds — the yield has no effect because all heavy work runs in a single contiguous block.

Google's official guidance: _"Yield often to break up long tasks"_ and _"break up the work in event callbacks into separate tasks."_
https://web.dev/articles/top-cwv

The standard pattern for heavy data processing is to yield every N iterations inside the loop, not just once at the start:
```js
async function processLargeList(items) {
  for (let i = 0; i < items.length; i++) {
    processItem(items[i]);
    if (i % 50 === 0) await yieldToMain();
  }
}
```
https://developer.chrome.com/blog/use-scheduler-yield

**For the data in question:** a single pass of filter+reduce+sort over <5000 rows is ~2-5ms — **not worth yielding at all**. The yield only adds latency with zero INP benefit. If the data IS large enough to warrant yielding, a single yield at the top does not protect against the long task.

---

## Flaw #3 — No try-catch around native call

`globalThis.scheduler?.yield` returns the method if it exists, but calling `scheduler.yield()` (note: bare global, not `globalThis.scheduler.yield()`) can throw if:

- The API surfaces but is behind a flag and not fully functional
- Called in a context where `scheduler` is not on the global scope (e.g., some workers, or if polyfilled incorrectly)
- An `AbortSignal.reason` rejection is triggered

The Safari article from Web Perf Clinic explicitly warns:
_"On Safari 18.4, `scheduler` is `undefined` — the entire `scheduler` global is missing. So the first iteration throws `TypeError: undefined is not an object`."_
https://webperfclinic.com/article/scheduler-yield-fallback-safari-2026

The current code avoids this because `globalThis.scheduler?.yield` returns `undefined` on Safari, so the `setTimeout` branch runs. But the bare `scheduler` reference instead of `globalThis.scheduler.yield()` is inconsistent and fragile. If a polyfill or a future browser defines `scheduler` but without a working `yield`, the call crashes.

---

## Flaw #4 — Ignores React concurrent features

This is a React component in a React app. React 18+ provides `useTransition` and `useDeferredValue` for exactly this pattern — keeping the UI responsive during expensive work.

Instead of manual scheduler yielding, the state updates triggered by the AI result (`setAiText`, `setAiLoading`, `setAiErr`) should be wrapped in `startTransition` to tell React they're low-priority:

```js
const [isPending, startTransition] = useTransition();
// ...
startTransition(() => {
  setAiText(r.text);
  setAiLoading(false);
});
```

This lets React interrupt the re-render if the user interacts again. Manual `scheduler.yield()` does not interact with React's scheduling at all.

Heavy data computation (`.filter().reduce()`) could be moved to a **Web Worker** for truly large datasets, completely off the main thread.
https://softtechnosol.com/blog/react-js-optimization-techniques-for-faster-apps

---

## Correct Implementation

```js
const channel = new MessageChannel();
const pending = [];
channel.port2.onmessage = () => pending.shift()?.();

function yieldToMain() {
  // 1. Native scheduler.yield — best continuation priority
  if (globalThis.scheduler?.yield) {
    return globalThis.scheduler.yield();
  }
  // 2. postTask fallback — maintains priority semantics
  if (globalThis.scheduler?.postTask) {
    return globalThis.scheduler.postTask(() => {}, { priority: 'user-visible' });
  }
  // 3. MessageChannel fallback — no 4ms clamp
  return new Promise((resolve) => {
    pending.push(resolve);
    channel.port1.postMessage(null);
  });
}
```

And inside `gerarInsights`, if the data is truly large enough to warrant yielding, yield **inside** the processing loop, not just once before it. For typical sizes (<5000 rows), remove the yield entirely — it adds unnecessary latency without measurable INP benefit. For the React state transitions, prefer `startTransition` or `useDeferredValue` so React can manage priorities properly.
