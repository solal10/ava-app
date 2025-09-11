import React from 'react';
import ComponentErrorBoundary from './ComponentErrorBoundary';
import AsyncErrorBoundary from './AsyncErrorBoundary';

/**
 * Wrapper qui combine plusieurs types d'Error Boundaries
 * pour protéger les composants de façon granulaire
 */
const SafeComponent = ({ 
  children, 
  componentName,
  fallback,
  errorMessage,
  // Props pour AsyncErrorBoundary
  enableAsync = false,
  operationType,
  retryable = true,
  onRetry,
  onCancel
}) => {
  // Si async est activé, utiliser AsyncErrorBoundary en priorité
  if (enableAsync) {
    return (
      <AsyncErrorBoundary
        componentName={componentName}
        operationType={operationType}
        retryable={retryable}
        onRetry={onRetry}
        onCancel={onCancel}
        fallback={fallback}
      >
        {children}
      </AsyncErrorBoundary>
    );
  }

  // Sinon, utiliser ComponentErrorBoundary standard
  return (
    <ComponentErrorBoundary
      componentName={componentName}
      fallback={fallback}
      errorMessage={errorMessage}
    >
      {children}
    </ComponentErrorBoundary>
  );
};

/**
 * HOC (Higher Order Component) pour protéger automatiquement un composant
 */
export const withErrorBoundary = (WrappedComponent, options = {}) => {
  const {
    componentName = WrappedComponent.name || 'Component',
    fallback,
    errorMessage,
    enableAsync = false,
    ...asyncOptions
  } = options;

  const SafeWrappedComponent = (props) => {
    return (
      <SafeComponent
        componentName={componentName}
        fallback={fallback}
        errorMessage={errorMessage}
        enableAsync={enableAsync}
        {...asyncOptions}
      >
        <WrappedComponent {...props} />
      </SafeComponent>
    );
  };

  SafeWrappedComponent.displayName = `withErrorBoundary(${componentName})`;
  return SafeWrappedComponent;
};

/**
 * HOC spécialisé pour les composants qui font des appels API
 */
export const withAsyncErrorBoundary = (WrappedComponent, options = {}) => {
  return withErrorBoundary(WrappedComponent, {
    ...options,
    enableAsync: true,
    operationType: options.operationType || 'chargement des données'
  });
};

/**
 * Composant pour les sections critiques qui ont besoin d'une protection renforcée
 */
export const CriticalSection = ({ children, sectionName, fallbackMessage }) => {
  const fallback = (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-2">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-medium text-yellow-800">
            Section {sectionName} temporairement indisponible
          </h4>
          <p className="text-xs text-yellow-600 mt-1">
            {fallbackMessage || 'Cette section rencontre un problème technique. Veuillez recharger la page.'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <SafeComponent
      componentName={`CriticalSection-${sectionName}`}
      fallback={fallback}
    >
      {children}
    </SafeComponent>
  );
};

export default SafeComponent;