import { useState, useCallback, useRef, useEffect } from 'react';

var MAX_HISTORY = 50;

export function useNavigationHistory() {
  var [history, setHistory] = useState([]);
  var [currentIndex, setCurrentIndex] = useState(-1);
  var isNavigatingRef = useRef(false);
  var listenersRef = useRef(new Set());

  function notifyListeners() {
    listenersRef.current.forEach(function(listener) {
      try { listener(history, currentIndex); } catch (_e) { /* listener error */ }
    });
  }

  function subscribe(listener) {
    listenersRef.current.add(listener);
    return function() { listenersRef.current.delete(listener); };
  }

  function push(path, metadata) {
    if (isNavigatingRef.current) return;
    
    var newEntry = {
      path: path,
      timestamp: Date.now(),
      metadata: metadata || {},
    };
    
    var newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newEntry);
    
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    notifyListeners();
  }

  function replace(path, metadata) {
    if (isNavigatingRef.current) return;
    
    var newEntry = {
      path: path,
      timestamp: Date.now(),
      metadata: metadata || {},
    };
    
    var newHistory = history.slice(0, currentIndex + 1);
    newHistory[newHistory.length - 1] = newEntry;
    
    setHistory(newHistory);
    notifyListeners();
  }

  function go(delta) {
    var targetIndex = currentIndex + delta;
    if (targetIndex < 0 || targetIndex >= history.length) return false;
    
    isNavigatingRef.current = true;
    setCurrentIndex(targetIndex);
    notifyListeners();
    isNavigatingRef.current = false;
    return true;
  }

  function back() { return go(-1); }
  function forward() { return go(1); }

  function goTo(index) {
    if (index < 0 || index >= history.length) return false;
    isNavigatingRef.current = true;
    setCurrentIndex(index);
    notifyListeners();
    isNavigatingRef.current = false;
    return true;
  }

  function clear() {
    setHistory([]);
    setCurrentIndex(-1);
    notifyListeners();
  }

  function canGoBack() { return currentIndex > 0; }
  function canGoForward() { return currentIndex < history.length - 1; }

  var currentEntry = history[currentIndex] || null;
  var previousEntry = currentIndex > 0 ? history[currentIndex - 1] : null;
  var nextEntry = currentIndex < history.length - 1 ? history[currentIndex + 1] : null;

  return {
    history: history,
    currentIndex: currentIndex,
    currentEntry: currentEntry,
    previousEntry: previousEntry,
    nextEntry: nextEntry,
    push: push,
    replace: replace,
    go: go,
    back: back,
    forward: forward,
    goTo: goTo,
    clear: clear,
    canGoBack: canGoBack,
    canGoForward: canGoForward,
    subscribe: subscribe,
    length: history.length,
  };
}

export function useNavigationTracker(onNav) {
  var history = useNavigationHistory();
  
  var trackedNav = useCallback(function(path, metadata) {
    onNav(path);
    history.push(path, metadata);
  }, [onNav, history]);
  
  return { ...history, nav: trackedNav };
}

export function usePageViewTracking(pageName, onTrack) {
  var mountedRef = useRef(false);
  var startTimeRef = useRef(Date.now());
  
  useEffect(function() {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    
    var loadTime = Date.now() - startTimeRef.current;
    onTrack?.(pageName, { loadTime: loadTime, timestamp: Date.now() });
    startTimeRef.current = Date.now();
  }, [pageName, onTrack]);
  
  useEffect(function() {
    return function() {
      var duration = Date.now() - startTimeRef.current;
      onTrack?.(pageName + '_exit', { duration: duration, timestamp: Date.now() });
    };
  }, []);
}
