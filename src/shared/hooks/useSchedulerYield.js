import { useCallback, useRef } from 'react';

export function useSchedulerYield() {
  const scheduledRef = useRef(false);

  const yieldToMain = useCallback(async () => {
    if (!scheduledRef.current && 'scheduler' in window && 'yield' in window.scheduler) {
      scheduledRef.current = true;
      try {
        await window.scheduler.yield();
      } finally {
        scheduledRef.current = false;
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }, []);

  return yieldToMain;
}

export function useChunkedMemo(factory, deps, chunkSize = 1000) {
  useSchedulerYield();
  const cacheRef = useRef({ value: undefined, deps: null });

  const result = factory();

  if (cacheRef.current.deps === null || deps.some((d, i) => d !== cacheRef.current.deps[i])) {
    cacheRef.current.value = result;
    cacheRef.current.deps = deps;
  }

  return cacheRef.current.value;
}

export async function chunkedMap(items, mapper, options = {}) {
  const { chunkSize = 100, onProgress } = options;
  const results = new Array(items.length);
  let processed = 0;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(mapper));
    chunkResults.forEach((r, idx) => { results[i + idx] = r; });
    processed += chunk.length;
    if (onProgress) onProgress(processed, items.length);
    if (i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  return results;
}