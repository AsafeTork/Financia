import { useRef, useState, useCallback, useEffect, useMemo } from 'react';

var THRESHOLD_PX = 80;
var MAX_SWIPE_PX = 120;
var DRAG_DEADZONE = 3;

export function useSwipeActions(options) {
  var opts = options || {};
  var actions = useMemo(function() { return opts.actions || []; }, [opts.actions]);
  var threshold = opts.threshold != null ? opts.threshold : THRESHOLD_PX;
  var maxSwipe = opts.maxSwipe != null ? opts.maxSwipe : MAX_SWIPE_PX;

  var elementRef = useRef(null);
  var [offset, setOffset] = useState(0);
  var [isSwiping, setIsSwiping] = useState(false);

  var activeRef = useRef(false);
  var startXRef = useRef(0);
  var currentXRef = useRef(0);

  var reset = useCallback(function() {
    if (!activeRef.current && !isSwiping) return;
    activeRef.current = false;
    currentXRef.current = 0;
    setIsSwiping(false);
    setOffset(0);
  }, [isSwiping]);

  var commitSwipe = useCallback(function() {
    var delta = currentXRef.current - startXRef.current;
    if (Math.abs(delta) > threshold && actions.length > 0) {
      var dir = delta < 0 ? -1 : 1;
      var matched = null;
      for (var i = 0; i < actions.length; i++) {
        var a = actions[i];
        if (a.dir === 'left' && dir === -1) { matched = a; break; }
        if (a.dir === 'right' && dir === 1) { matched = a; break; }
        if (!a.dir) { matched = a; break; }
      }
      if (matched && matched.onAction) {
        matched.onAction();
      }
    }
    reset();
  }, [actions, threshold, reset]);

  var prefersReducedMotion = useCallback(function() {
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  var onPointerDown = useCallback(function(e) {
    if (isSwiping) return;
    if (prefersReducedMotion()) return;
    if (e.touches && e.touches.length > 1) return;
    var startX = e.touches ? e.touches[0].clientX : (e.clientX || 0);
    startXRef.current = startX;
    currentXRef.current = startX;
    activeRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSwiping]);

  var onPointerMove = useCallback(function(e) {
    if (!activeRef.current) return;
    var clientX = e.touches ? e.touches[0].clientX : (e.clientX || 0);
    currentXRef.current = clientX;
    var delta = clientX - startXRef.current;
    if (Math.abs(delta) < DRAG_DEADZONE) return;
    if (!isSwiping) setIsSwiping(true);
    e.preventDefault();
    var damped = Math.max(-maxSwipe, Math.min(maxSwipe, delta));
    setOffset(damped);
  }, [maxSwipe, isSwiping]);

  var onPointerUp = useCallback(function() {
    if (!activeRef.current) return;
    commitSwipe();
  }, [commitSwipe]);

  var onPointerCancel = useCallback(function() {
    if (!activeRef.current) return;
    reset();
  }, [reset]);

  useEffect(function() {
    var el = elementRef.current;
    if (!el) return undefined;

    el.addEventListener('touchstart', onPointerDown, { passive: false });
    el.addEventListener('touchmove', onPointerMove, { passive: false });
    el.addEventListener('touchend', onPointerUp);
    el.addEventListener('touchcancel', onPointerCancel);

    return function() {
      el.removeEventListener('touchstart', onPointerDown);
      el.removeEventListener('touchmove', onPointerMove);
      el.removeEventListener('touchend', onPointerUp);
      el.removeEventListener('touchcancel', onPointerCancel);
    };
  }, [onPointerDown, onPointerMove, onPointerUp, onPointerCancel]);

  return { elementRef, offset, isSwiping, reset };
}
