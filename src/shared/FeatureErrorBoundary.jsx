import React from 'react';

export class FeatureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[FeatureErrorBoundary] ' + (this.props.featureName || 'unknown'), error, errorInfo);
  }

  handleTryAgain() {
    this.setState({ hasError: false });
  }

  handleGoHome() {
    window.location.hash = '#/';
  }

  render() {
    if (this.state.hasError) {
      var name = this.props.featureName || 'this feature';
      return (
        <div className="min-h-full flex items-center justify-center flex-col gap-4 p-6" style={{background:'var(--bg-page)'}}>
          <span className="text-4xl font-bold text-gray-700">(!)</span>
          <p className="text-lg font-semibold text-gray-700">Failed to load</p>
          <p className="text-sm text-gray-500">{name} encountered an error.</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={this.handleGoHome}
              className="px-6 py-2.5 text-white rounded-xl text-sm font-semibold bg-gray-600"
            >
              Go Home
            </button>
            <button
              onClick={this.handleTryAgain.bind(this)}
              className="px-6 py-2.5 text-white rounded-xl text-sm font-semibold bg-green-600"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
