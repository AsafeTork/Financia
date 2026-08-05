import React, { Suspense, useState, useEffect, useCallback } from 'react';
import Loader from './Loader.jsx';

var DEFAULT_TIMEOUT = 12000;

function LazyPage({ children, fallback, timeout }) {
  var ms = timeout || DEFAULT_TIMEOUT;
  var [timedOut, setTimedOut] = useState(false);

  useEffect(function() {
    var id = setTimeout(function() { setTimedOut(true); }, ms);
    return function() { clearTimeout(id); };
  }, [ms]);

  var handleRetry = useCallback(function() {
    setTimedOut(false);
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

  return <Suspense fallback={fallback || <Loader/>}>{children}</Suspense>;
}

export default LazyPage;
