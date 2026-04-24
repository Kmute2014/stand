import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="modal-bg" id="modal-error-boundary">
          <div className="modal">
            <div className="modal-h">
              <div className="modal-title">Error</div>
              <div className="modal-close" onClick={() => {
                document.getElementById('modal-error-boundary')?.classList.remove('show');
                this.setState({ hasError: false, error: undefined });
              }}>×</div>
            </div>
            <div className="modal-body">
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">Something went wrong</div>
                <div className="text-sm text-slate-600 mb-4">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    document.getElementById('modal-error-boundary')?.classList.remove('show');
                    this.setState({ hasError: false, error: undefined });
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
