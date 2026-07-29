import { useState, useEffect } from 'react';

export function useDebouncedValue(value, delay) {
  var [debounced, setDebounced] = useState(value);
  useEffect(function() {
    var t = setTimeout(function() { setDebounced(value); }, delay || 250);
    return function() { clearTimeout(t); };
  }, [value, delay]);
  return debounced;
}
