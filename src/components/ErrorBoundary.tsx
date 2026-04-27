import React, { useState, ReactNode, useEffect } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error caught by ErrorBoundary:', event.error);
      setHasError(true);
      setError(event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
      setError(new Error(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="modal-bg" id="modal-error-boundary">
        <div className="modal">
          <div className="modal-h">
            <div className="modal-title">Error</div>
            <div className="modal-close" onClick={() => {
              document.getElementById('modal-error-boundary')?.classList.remove('show');
            }}>×</div>
          </div>
          <div className="modal-b">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">An unexpected error occurred. Please try refreshing the page.</p>
              {error && (
                <details className="text-left text-sm text-gray-500 mb-4">
                  <summary>Error details</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {error.message}
                  </pre>
                </details>
              )}
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
