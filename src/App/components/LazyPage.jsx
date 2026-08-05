import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import Loader from './Loader.jsx';

var DEFAULT_TIMEOUT = 12000;

function ResetTimer({ onMount }) {
  useEffect(function() { onMount(); }, [onMount]);
  return null;
}

function LazyPage({ children, fallback, timeout }) {
  var ms = timeout || DEFAULT_TIMEOUT;
  var [timedOut, setTimedOut] = useState(false);
  var cleared = useRef(false);
  var timerRef = useRef(null);

  useEffect(function() {
    timerRef.current = setTimeout(function() {
      if (!cleared.current) setTimedOut(true);
    }, ms);
    return function() { clearTimeout(timerRef.current); };
  }, [ms]);

  var handleResolved = useCallback(function() {
    cleared.current = true;
    clearTimeout(timerRef.current);
  }, []);

  var handleRetry = useCallback(function() {
    setTimedOut(false);
    cleared.current = false;
    window.location.reload();
  }, []);

  if (timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6"
        style={{ background: 'var(--bg-page)' }}>
        <span className="text-4xl">⏱</span>
        <p className="text-sm font-semibold text-gray-700">A página demorou muito para carregar.</p>
        <button onClick={handleRetry}
          className="px-6 py-2.5 text-white rounded-xl text-sm font-semibold bg-green-600">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <Suspense fallback={fallback || <Loader/>}>
      <ResetTimer onMount={handleResolved}/>
      {children}
    </Suspense>
  );
}

export default LazyPage;
