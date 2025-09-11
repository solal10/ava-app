import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer les états de chargement
 */
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingStates, setLoadingStates] = useState({});
  const timeoutRef = useRef();

  // Nettoyer le timeout à la destruction du composant
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Démarrer le chargement
  const startLoading = useCallback((key = 'default') => {
    setIsLoading(true);
    setLoadingStates(prev => ({ ...prev, [key]: true }));
  }, []);

  // Arrêter le chargement
  const stopLoading = useCallback((key = 'default') => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      
      // Si plus aucun état de chargement, arrêter le loading global
      if (Object.keys(newStates).length === 0) {
        setIsLoading(false);
      }
      
      return newStates;
    });
  }, []);

  // Chargement avec timeout automatique
  const startLoadingWithTimeout = useCallback((timeout = 5000, key = 'default') => {
    startLoading(key);
    
    timeoutRef.current = setTimeout(() => {
      stopLoading(key);
    }, timeout);
  }, [startLoading, stopLoading]);

  // Wrapper pour les opérations asynchrones
  const withLoading = useCallback(async (asyncOperation, key = 'default') => {
    try {
      startLoading(key);
      const result = await asyncOperation();
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  // Vérifier si une clé spécifique est en cours de chargement
  const isLoadingKey = useCallback((key) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  // Arrêter tous les chargements
  const stopAllLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingStates({});
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    isLoading,
    loadingStates,
    startLoading,
    stopLoading,
    startLoadingWithTimeout,
    withLoading,
    isLoadingKey,
    stopAllLoading,
    hasAnyLoading: Object.keys(loadingStates).length > 0
  };
};

/**
 * Hook spécialisé pour les requêtes API avec gestion du loading
 */
export const useApiLoading = () => {
  const [requests, setRequests] = useState({});
  const [errors, setErrors] = useState({});

  // Démarrer une requête
  const startRequest = useCallback((requestId) => {
    setRequests(prev => ({ ...prev, [requestId]: { loading: true, timestamp: Date.now() } }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[requestId];
      return newErrors;
    });
  }, []);

  // Terminer une requête avec succès
  const finishRequest = useCallback((requestId, data = null) => {
    setRequests(prev => {
      const newRequests = { ...prev };
      if (newRequests[requestId]) {
        newRequests[requestId] = {
          ...newRequests[requestId],
          loading: false,
          completed: true,
          data
        };
      }
      return newRequests;
    });
  }, []);

  // Terminer une requête avec erreur
  const failRequest = useCallback((requestId, error) => {
    setRequests(prev => {
      const newRequests = { ...prev };
      if (newRequests[requestId]) {
        newRequests[requestId] = {
          ...newRequests[requestId],
          loading: false,
          failed: true
        };
      }
      return newRequests;
    });
    setErrors(prev => ({ ...prev, [requestId]: error }));
  }, []);

  // Wrapper pour les appels API
  const apiCall = useCallback(async (requestId, apiFunction) => {
    try {
      startRequest(requestId);
      const result = await apiFunction();
      finishRequest(requestId, result);
      return result;
    } catch (error) {
      failRequest(requestId, error);
      throw error;
    }
  }, [startRequest, finishRequest, failRequest]);

  // Obtenir le statut d'une requête
  const getRequestStatus = useCallback((requestId) => {
    const request = requests[requestId];
    if (!request) return { loading: false, completed: false, failed: false };
    
    return {
      loading: request.loading,
      completed: request.completed || false,
      failed: request.failed || false,
      data: request.data,
      timestamp: request.timestamp,
      duration: request.completed || request.failed ? Date.now() - request.timestamp : null
    };
  }, [requests]);

  // Vérifier si au moins une requête est en cours
  const hasActiveRequests = Object.values(requests).some(req => req.loading);

  // Nettoyer les requêtes terminées
  const cleanupRequests = useCallback((olderThan = 300000) => { // 5 minutes par défaut
    const now = Date.now();
    setRequests(prev => {
      const newRequests = {};
      Object.entries(prev).forEach(([id, request]) => {
        if (request.loading || (now - request.timestamp) < olderThan) {
          newRequests[id] = request;
        }
      });
      return newRequests;
    });
    
    setErrors(prev => {
      const newErrors = {};
      Object.entries(prev).forEach(([id, error]) => {
        if (requests[id] && requests[id].loading) {
          newErrors[id] = error;
        }
      });
      return newErrors;
    });
  }, [requests]);

  return {
    requests,
    errors,
    hasActiveRequests,
    startRequest,
    finishRequest,
    failRequest,
    apiCall,
    getRequestStatus,
    cleanupRequests,
    isLoading: (requestId) => getRequestStatus(requestId).loading,
    hasError: (requestId) => !!errors[requestId],
    getError: (requestId) => errors[requestId]
  };
};

/**
 * Hook pour gérer les états de chargement des boutons
 */
export const useButtonLoading = () => {
  const [loadingButtons, setLoadingButtons] = useState(new Set());

  const setButtonLoading = useCallback((buttonId, loading) => {
    setLoadingButtons(prev => {
      const newSet = new Set(prev);
      if (loading) {
        newSet.add(buttonId);
      } else {
        newSet.delete(buttonId);
      }
      return newSet;
    });
  }, []);

  const isButtonLoading = useCallback((buttonId) => {
    return loadingButtons.has(buttonId);
  }, [loadingButtons]);

  const withButtonLoading = useCallback(async (buttonId, asyncOperation) => {
    try {
      setButtonLoading(buttonId, true);
      return await asyncOperation();
    } finally {
      setButtonLoading(buttonId, false);
    }
  }, [setButtonLoading]);

  return {
    isButtonLoading,
    setButtonLoading,
    withButtonLoading,
    hasLoadingButtons: loadingButtons.size > 0
  };
};

/**
 * Hook pour gérer les états de chargement avec retry
 */
export const useLoadingWithRetry = (maxRetries = 3) => {
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);

  const executeWithRetry = useCallback(async (asyncOperation) => {
    let attempts = 0;
    
    while (attempts <= maxRetries) {
      try {
        setIsLoading(true);
        setError(null);
        setRetryCount(attempts);
        
        const result = await asyncOperation();
        setIsLoading(false);
        setRetryCount(0);
        return result;
        
      } catch (error) {
        attempts++;
        if (attempts > maxRetries) {
          setIsLoading(false);
          setError(error);
          throw error;
        }
        
        // Délai avant retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
  }, [maxRetries]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setRetryCount(0);
    setError(null);
  }, []);

  return {
    isLoading,
    retryCount,
    error,
    executeWithRetry,
    reset,
    canRetry: retryCount < maxRetries
  };
};

export default useLoading;