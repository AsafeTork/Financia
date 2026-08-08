import { useRef, useState, useCallback, useEffect } from 'react';

var THRESHOLD_PX = 80;
var MAX_PULL_PX = 120;

export function usePullToRefresh(onRefresh) {
  var containerRef = useRef(null);
  var [isPulling, setIsPulling] = useState(false);
  var [pullProgress, setPullProgress] = useState(0);
  var [isRefreshing, setIsRefreshing] = useState(false);

  var activeRef = useRef(false);
  var startYRef = useRef(0);
  var currentYRef = useRef(0);
  var rafRef = useRef(0);
  var isPullingRef = useRef(false);
  var isRefreshingRef = useRef(false);

  var runRefresh = useCallback(function() {
    if (!onRefresh || isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setIsPulling(false);
    isPullingRef.current = false;
    setPullProgress(0);
    activeRef.current = false;
    Promise.resolve(onRefresh()).then(function() {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }, function() {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    });
  }, [onRefresh]);

  var prefersReducedMotion = useCallback(function() {
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  var onPointerDown = useCallback(function(e) {
    if (isRefreshingRef.current) return;
    if (prefersReducedMotion()) return;
    var container = containerRef.current;
    if (!container) return;
    if (container.scrollTop > 0) return;
    if (e.touches && e.touches.length > 1) return;
    startYRef.current = e.touches ? e.touches[0].clientY : (e.clientY || 0);
    currentYRef.current = startYRef.current;
    activeRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  var onPointerMove = useCallback(function(e) {
    if (!activeRef.current || isRefreshingRef.current) return;
    var clientY = e.touches ? e.touches[0].clientY : (e.clientY || 0);
    currentYRef.current = clientY;
    var delta = clientY - startYRef.current;
    if (delta <= 0) return;
    e.preventDefault();
    var damped = Math.min(delta, MAX_PULL_PX);
    var progress = Math.min((damped / THRESHOLD_PX) * 0.5 + 0.5, 1);
    if (!isPullingRef.current) {
      isPullingRef.current = true;
      setIsPulling(true);
    }
    setPullProgress(progress);
  }, []);

  var finishPull = useCallback(function() {
    if (!activeRef.current) return;
    activeRef.current = false;
    isPullingRef.current = false;
    var delta = currentYRef.current - startYRef.current;
    setIsPulling(false);
    setPullProgress(0);
    if (delta > THRESHOLD_PX) {
      runRefresh();
    }
  }, [runRefresh]);

  var onPointerUp = useCallback(function() {
    if (!activeRef.current) return;
    finishPull();
  }, [finishPull]);

  var onPointerCancel = useCallback(function() {
    if (!activeRef.current) return;
    activeRef.current = false;
    isPullingRef.current = false;
    setIsPulling(false);
    setPullProgress(0);
  }, []);

  useEffect(function() {
    var container = containerRef.current;
    if (!container) return undefined;

    container.addEventListener('touchstart', onPointerDown, { passive: false });
    container.addEventListener('touchmove', onPointerMove, { passive: false });
    container.addEventListener('touchend', onPointerUp);
    container.addEventListener('touchcancel', onPointerCancel);
    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mouseup', onPointerUp);
    container.addEventListener('mouseleave', onPointerCancel);

    return function() {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      var rafId = rafRef.current;
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener('touchstart', onPointerDown);
      container.removeEventListener('touchmove', onPointerMove);
      container.removeEventListener('touchend', onPointerUp);
      container.removeEventListener('touchcancel', onPointerCancel);
      container.removeEventListener('mousedown', onPointerDown);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('mouseleave', onPointerCancel);
    };
  }, [onPointerDown, onPointerMove, onPointerUp, onPointerCancel]);

  return { containerRef, isPulling, pullProgress, isRefreshing, runRefresh };
}
