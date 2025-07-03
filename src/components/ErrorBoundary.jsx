import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo,
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Error caught by boundary:', error, errorInfo);
      // TODO: Send to error reporting service
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="error-boundary">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 text-center">
                <div className="error-content">
                  <h2>Oops! Something went wrong</h2>
                  <p>
                    We apologize for the inconvenience. An unexpected error has
                    occurred.
                  </p>
                  <button
                    className="theme-btn"
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </button>
                  {process.env.NODE_ENV === 'development' && (
                    <details className="error-details mt-4">
                      <summary>Error Details (Development Only)</summary>
                      <pre className="text-left mt-2">
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;