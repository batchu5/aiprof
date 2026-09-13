import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import Button from './Button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught Error Boundary Exception:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white/90 border border-slate-200 p-8 rounded-2xl max-w-lg w-full shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-400 shadow-lg shadow-red-950/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              An unexpected application error occurred. You can retry loading or return to the main dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center mb-4">
              <Button onClick={this.handleReload} variant="primary" className="w-full sm:w-auto flex items-center gap-2 justify-center">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Go to Dashboard
              </Button>
            </div>

            {this.state.error && (
              <div className="mt-4 text-left">
                <button
                  onClick={this.toggleDetails}
                  className="text-xs text-slate-500 hover:text-slate-600 flex items-center gap-1 mx-auto transition-colors"
                >
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {this.state.showDetails ? 'Hide Error Details' : 'Show Technical Details'}
                </button>
                {this.state.showDetails && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-red-300 font-mono overflow-x-auto max-h-40">
                    {this.state.error.toString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
