import React from 'react';

export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GlobalErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6" style={{background:'var(--bg-page)'}}>
          <span className="text-4xl font-bold text-gray-700">(!)</span>
          <p className="text-lg font-semibold text-gray-700">Something went wrong</p>
          <p className="text-sm text-gray-500">An unexpected error occurred. Please reload the app.</p>
          <button
            onClick={function() { window.location.reload(); }}
            className="px-6 py-2.5 text-white rounded-xl text-sm font-semibold bg-green-600"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
