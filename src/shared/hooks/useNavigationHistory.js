import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

var MAX_HISTORY = 50;

export function useNavigationHistory() {
  var [history, setHistory] = useState([]);
  var [currentIndex, setCurrentIndex] = useState(-1);
  var isNavigatingRef = useRef(false);
  var listenersRef = useRef(new Set());
  var historyRef = useRef(history);
  var indexRef = useRef(currentIndex);
  historyRef.current = history;
  indexRef.current = currentIndex;

  var notifyListeners = useCallback(function() {
    listenersRef.current.forEach(function(listener) {
      try { listener(historyRef.current, indexRef.current); } catch (_e) { /* listener error */ }
    });
  }, []);

  var push = useCallback(function(path, metadata) {
    if (isNavigatingRef.current) return;
    var curIdx = indexRef.current;
    var curHist = historyRef.current;
    var newEntry = {
      path: path,
      timestamp: Date.now(),
      metadata: metadata || {},
    };
    var newHistory = curHist.slice(0, curIdx + 1);
    newHistory.push(newEntry);
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    notifyListeners();
  }, [notifyListeners]);

  var replace = useCallback(function(path, metadata) {
    if (isNavigatingRef.current) return;
    var curIdx = indexRef.current;
    var curHist = historyRef.current;
    var newEntry = {
      path: path,
      timestamp: Date.now(),
      metadata: metadata || {},
    };
    var newHistory = curHist.slice(0, curIdx + 1);
    newHistory[newHistory.length - 1] = newEntry;
    setHistory(newHistory);
    notifyListeners();
  }, [notifyListeners]);

  var go = useCallback(function(delta) {
    var curIdx = indexRef.current;
    var curHist = historyRef.current;
    var targetIndex = curIdx + delta;
    if (targetIndex < 0 || targetIndex >= curHist.length) return false;
    isNavigatingRef.current = true;
    setCurrentIndex(targetIndex);
    notifyListeners();
    isNavigatingRef.current = false;
    return true;
  }, [notifyListeners]);

  var back = useCallback(function() { return go(-1); }, [go]);
  var forward = useCallback(function() { return go(1); }, [go]);

  var goTo = useCallback(function(index) {
    var curHist = historyRef.current;
    if (index < 0 || index >= curHist.length) return false;
    isNavigatingRef.current = true;
    setCurrentIndex(index);
    notifyListeners();
    isNavigatingRef.current = false;
    return true;
  }, [notifyListeners]);

  var clear = useCallback(function() {
    setHistory([]);
    setCurrentIndex(-1);
    notifyListeners();
  }, [notifyListeners]);

  var canGoBack = useCallback(function() { return indexRef.current > 0; }, []);
  var canGoForward = useCallback(function() { return indexRef.current < historyRef.current.length - 1; }, []);

  var currentEntry = history[currentIndex] || null;
  var previousEntry = currentIndex > 0 ? history[currentIndex - 1] : null;
  var nextEntry = currentIndex < history.length - 1 ? history[currentIndex + 1] : null;

  return useMemo(function() {
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
      subscribe: function(listener) {
        listenersRef.current.add(listener);
        return function() { listenersRef.current.delete(listener); };
      },
      length: history.length,
    };
  }, [history, currentIndex, currentEntry, previousEntry, nextEntry, push, replace, go, back, forward, goTo, clear, canGoBack, canGoForward]);
}

export function useNavigationTracker(onNav) {
  var history = useNavigationHistory();

  var trackedNav = useCallback(function(path, metadata) {
    onNav(path);
    history.push(path, metadata);
  }, [onNav, history]);

  return useMemo(function() {
    var result = {};
    for (var k in history) {
      if (Object.prototype.hasOwnProperty.call(history, k)) result[k] = history[k];
    }
    result.nav = trackedNav;
    return result;
  }, [history, trackedNav]);
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
    if (onTrack) onTrack(pageName, { loadTime: loadTime, timestamp: Date.now() });
    startTimeRef.current = Date.now();
  }, [pageName, onTrack]);

  useEffect(function() {
    return function() {
      var duration = Date.now() - startTimeRef.current;
      if (onTrack) onTrack(pageName + '_exit', { duration: duration, timestamp: Date.now() });
    };
  }, [pageName, onTrack]);
}
