import React from 'react';

export class WidgetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[WidgetErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-300 bg-red-50 rounded-lg p-3 text-center">
          <p className="text-xs text-red-600 font-medium">Failed to load</p>
        </div>
      );
    }
    return this.props.children;
  }
}
