import React from 'react';
import config from '../../config/env';

/**
 * Error Boundary spécialisé pour les composants individuels
 * Plus léger que l'ErrorBoundary principal, permet la récupération locale
 */
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      retryCount: 0 
    };
    this.maxRetries = 3;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log de l'erreur
    if (config.isDevelopment()) {
      console.error(`Component Error in ${this.props.componentName || 'Unknown'}:`, error, errorInfo);
    }
    
    this.setState({ error });

    // En production, logger vers Sentry ou autre service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: this.props.componentName || 'Unknown',
          errorBoundary: 'ComponentErrorBoundary'
        },
        extra: {
          errorInfo,
          props: this.props
        }
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Interface d'erreur par défaut
      const canRetry = this.state.retryCount < this.maxRetries;
      const componentName = this.props.componentName || 'Ce composant';

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-2">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-800">
                Erreur dans {componentName}
              </h4>
              <p className="text-xs text-red-600 mt-1">
                {this.props.errorMessage || 'Une erreur inattendue s\'est produite'}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors"
              >
                Réessayer ({this.maxRetries - this.state.retryCount} restants)
              </button>
            )}
            <button
              onClick={this.handleReset}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors"
            >
              Réinitialiser
            </button>
          </div>

          {config.isDevelopment() && this.state.error && (
            <details className="mt-3">
              <summary className="text-xs cursor-pointer text-red-700 hover:text-red-900">
                Détails de l'erreur
              </summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;