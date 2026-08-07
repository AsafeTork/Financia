import React from 'react';

export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

componentDidCatch(error, _errorInfo) {
    console.error('[GlobalErrorBoundary]', error);
    try {
      localStorage.setItem('financia_last_error', JSON.stringify({
        message: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      }));
    } catch (_e) {
      // ignore localStorage errors
    }
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6" style={{background:'var(--bg-page)'}}>
          <span className="text-4xl font-bold text-gray-700">(!)</span>
          <p className="text-lg font-semibold text-gray-700">Algo deu errado</p>
          <p className="text-sm text-gray-500">Ocorreu um erro inesperado. Recarregue o app.</p>
          {err && (
            <details className="w-full max-w-xl p-4 text-xs bg-gray-100 rounded-xl overflow-auto" style={{maxHeight:300}}>
              <summary className="font-semibold mb-2 cursor-pointer">Detalhes do erro (clique para expandir)</summary>
              <pre className="whitespace-pre-wrap text-red-700">{err.message}</pre>
              {err.stack && <pre className="whitespace-pre-wrap mt-2 text-gray-600">{err.stack}</pre>}
            </details>
          )}
          <button
            onClick={function() { window.location.reload(); }}
            className="px-6 py-2.5 text-white rounded-xl text-sm font-semibold bg-green-600"
          >
            Recarregar App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
