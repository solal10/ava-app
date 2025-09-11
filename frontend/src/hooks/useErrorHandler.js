import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour la gestion d'erreurs dans les composants fonctionnels
 * Complète les Error Boundaries pour la gestion d'état locale
 */
export const useErrorHandler = (componentName = 'Unknown Component') => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Gestionnaire d'erreur générique
  const handleError = useCallback((error, context = {}) => {
    console.error(`Error in ${componentName}:`, error);
    
    // Reporter à Sentry si disponible
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: componentName,
          errorHandler: 'useErrorHandler'
        },
        extra: context
      });
    }
    
    setError(error);
    setIsLoading(false);
  }, [componentName]);

  // Wrapper pour les opérations asynchrones
  const asyncHandler = useCallback(async (asyncOperation, context = {}) => {
    try {
      setError(null);
      setIsLoading(true);
      const result = await asyncOperation();
      setIsLoading(false);
      return result;
    } catch (error) {
      handleError(error, context);
      throw error; // Re-throw pour permettre la gestion locale si nécessaire
    }
  }, [handleError]);

  // Wrapper sécurisé pour les fonctions
  const safeHandler = useCallback((fn, context = {}) => {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        handleError(error, { ...context, args });
      }
    };
  }, [handleError]);

  // Réinitialiser l'état d'erreur
  const clearError = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  // Retry avec gestion d'erreur
  const retry = useCallback(async (operation) => {
    clearError();
    return asyncHandler(operation);
  }, [asyncHandler, clearError]);

  return {
    error,
    isLoading,
    handleError,
    asyncHandler,
    safeHandler,
    clearError,
    retry,
    hasError: !!error
  };
};

/**
 * Hook spécialisé pour les appels API
 */
export const useApiErrorHandler = (componentName = 'API Component') => {
  const baseHandler = useErrorHandler(componentName);
  
  // Gestionnaire spécialisé pour les erreurs API
  const handleApiError = useCallback((error, endpoint = 'unknown') => {
    const context = {
      endpoint,
      status: error.status || error.response?.status,
      statusText: error.statusText || error.response?.statusText,
      url: error.url || error.config?.url
    };

    // Transformer l'erreur pour avoir des messages plus clairs
    let transformedError = error;
    
    if (error.response?.status === 401) {
      transformedError = new Error('Session expirée. Veuillez vous reconnecter.');
      transformedError.code = 'AUTH_ERROR';
    } else if (error.response?.status === 403) {
      transformedError = new Error('Accès non autorisé à cette ressource.');
      transformedError.code = 'FORBIDDEN_ERROR';
    } else if (error.response?.status === 404) {
      transformedError = new Error('Ressource non trouvée.');
      transformedError.code = 'NOT_FOUND_ERROR';
    } else if (error.response?.status >= 500) {
      transformedError = new Error('Erreur du serveur. Veuillez réessayer plus tard.');
      transformedError.code = 'SERVER_ERROR';
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      transformedError = new Error('Problème de connexion réseau.');
      transformedError.code = 'NETWORK_ERROR';
    }

    transformedError.originalError = error;
    baseHandler.handleError(transformedError, context);
  }, [baseHandler]);

  // Wrapper pour les appels API
  const apiCall = useCallback(async (apiFunction, endpoint = 'unknown') => {
    try {
      baseHandler.clearError();
      const result = await baseHandler.asyncHandler(apiFunction, { endpoint });
      return result;
    } catch (error) {
      handleApiError(error, endpoint);
      throw error;
    }
  }, [baseHandler, handleApiError]);

  return {
    ...baseHandler,
    handleApiError,
    apiCall
  };
};

/**
 * Hook pour la gestion d'erreurs de formulaire
 */
export const useFormErrorHandler = (componentName = 'Form Component') => {
  const baseHandler = useErrorHandler(componentName);
  const [fieldErrors, setFieldErrors] = useState({});

  // Gestionnaire d'erreurs de validation
  const handleValidationError = useCallback((error) => {
    if (error.validationErrors) {
      setFieldErrors(error.validationErrors);
    } else {
      baseHandler.handleError(error);
    }
  }, [baseHandler]);

  // Nettoyer les erreurs de champ
  const clearFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  // Nettoyer toutes les erreurs
  const clearAllErrors = useCallback(() => {
    baseHandler.clearError();
    clearFieldErrors();
  }, [baseHandler, clearFieldErrors]);

  return {
    ...baseHandler,
    fieldErrors,
    handleValidationError,
    clearFieldErrors,
    clearAllErrors,
    hasFieldErrors: Object.keys(fieldErrors).length > 0
  };
};

export default useErrorHandler;