import React from 'react';
import config from '../../config/env';

/**
 * Error Boundary spécialisé pour les opérations asynchrones
 * Gère les erreurs d'API, de chargement de données, etc.
 */
class AsyncErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      isLoading: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, isLoading: false };
  }

  componentDidCatch(error, errorInfo) {
    if (config.isDevelopment()) {
      console.error('AsyncErrorBoundary caught error:', error, errorInfo);
    }
    
    this.setState({ error, isLoading: false });

    // Reporter l'erreur
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // En production, envoyer à Sentry ou autre service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: this.props.componentName || 'AsyncOperation',
          errorBoundary: 'AsyncErrorBoundary',
          operation: this.props.operationType || 'unknown'
        },
        extra: {
          errorInfo,
          operationType: this.props.operationType,
          retryable: this.props.retryable
        }
      });
    }
  };

  handleRetry = async () => {
    this.setState({ hasError: false, error: null, isLoading: true });
    
    try {
      if (this.props.onRetry) {
        await this.props.onRetry();
      }
      this.setState({ isLoading: false });
    } catch (error) {
      this.setState({ hasError: true, error, isLoading: false });
      this.reportError(error);
    }
  };

  render() {
    const { hasError, error, isLoading } = this.state;
    const { 
      componentName = 'Cette opération',
      operationType = 'chargement',
      retryable = true,
      fallback 
    } = this.props;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span className="text-sm">Nouvelle tentative...</span>
          </div>
        </div>
      );
    }

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      // Déterminer le type d'erreur et le message approprié
      let errorMessage = 'Une erreur inattendue s\'est produite';
      let canRetry = retryable;
      let iconColor = 'text-red-600';
      let bgColor = 'bg-red-50';
      let borderColor = 'border-red-200';

      if (error) {
        if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
          errorMessage = 'Problème de connexion réseau';
          iconColor = 'text-orange-600';
          bgColor = 'bg-orange-50';
          borderColor = 'border-orange-200';
        } else if (error.status === 404) {
          errorMessage = 'Ressource non trouvée';
        } else if (error.status === 403) {
          errorMessage = 'Accès non autorisé';
          canRetry = false;
        } else if (error.status >= 500) {
          errorMessage = 'Erreur du serveur';
        } else if (error.name === 'TimeoutError') {
          errorMessage = 'Délai d\'attente dépassé';
        }
      }

      return (
        <div className={`${bgColor} border ${borderColor} rounded-lg p-4 m-2`}>
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
              <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-800">
                Erreur lors du {operationType}
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                {errorMessage}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                disabled={isLoading}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition-colors disabled:opacity-50"
              >
                Réessayer
              </button>
            )}
            {this.props.onCancel && (
              <button
                onClick={this.props.onCancel}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors"
              >
                Annuler
              </button>
            )}
          </div>

          {config.isDevelopment() && error && (
            <details className="mt-3">
              <summary className="text-xs cursor-pointer text-gray-700 hover:text-gray-900">
                Détails techniques
              </summary>
              <div className="mt-2 text-xs bg-white p-2 rounded border">
                <div className="mb-2">
                  <strong>Type:</strong> {error.name || 'Unknown'}
                </div>
                <div className="mb-2">
                  <strong>Message:</strong> {error.message}
                </div>
                {error.status && (
                  <div className="mb-2">
                    <strong>Status:</strong> {error.status}
                  </div>
                )}
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 text-xs overflow-auto max-h-24">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default AsyncErrorBoundary;