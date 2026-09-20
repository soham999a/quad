import React from 'react';

/**
 * Catches render-time errors anywhere below it and shows a styled recovery
 * card instead of unmounting the whole app (blank screen).
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error boundary caught:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="max-w-md w-full border-[0.5px] border-error/40 bg-surface-container-low p-10 text-center">
          <div className="text-technical-sm font-technical-sm text-error uppercase tracking-[0.2em] mb-4">
            Something went wrong
          </div>
          <p className="text-body-md text-on-surface-variant leading-relaxed mb-8">
            {this.props.message || 'An unexpected error occurred while rendering this page. Your saved progress is intact.'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => this.setState({ error: null })} className="btn-primary">
              Try again
            </button>
            <button onClick={() => window.location.assign('/app/dashboard')} className="btn-outline">
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
