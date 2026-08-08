import { useState, useEffect, useRef } from 'react';

var DURATION = 300;
var EASE_OUT = 0.16;

export function useCountUp(value, animate) {
  var [display, setDisplay] = useState(value);
  var rafRef = useRef(null);
  var prevVal = useRef(value);
  var animIdRef = useRef(0);

  useEffect(function() {
    if (!animate) { setDisplay(value); return; }
    var start = prevVal.current;
    var end = value;
    var startTime = performance.now();
    var id = ++animIdRef.current;

    function step(now) {
      if (id !== animIdRef.current) return;
      var t = Math.min((now - startTime) / DURATION, 1);
      var eased = 1 - Math.pow(1 - t, 1 / (1 - EASE_OUT));
      var current = start + (end - start) * eased;
      setDisplay(Math.round(current * 100) / 100);
      if (t < 1) { rafRef.current = requestAnimationFrame(step); }
    }
    rafRef.current = requestAnimationFrame(step);
    prevVal.current = value;

    return function() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, animate]);

  return display;
}
