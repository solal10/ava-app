import React from 'react';
import LoadingSpinner, { 
  CardLoader, 
  ListLoader, 
  GridLoader, 
  TableLoader, 
  MetricLoader,
  ButtonSpinner 
} from './LoadingSpinner';

/**
 * Composant de chargement intelligent qui s'adapte au contexte
 */
const SmartLoader = ({ 
  type = 'spinner',
  isLoading = false,
  children,
  fallback,
  delay = 0,
  minDuration = 0,
  // Props spécifiques aux différents types
  size = 'medium',
  text,
  items,
  columns,
  rows,
  lines,
  showAvatar = true,
  className = ''
}) => {
  const [showLoader, setShowLoader] = React.useState(false);
  const [startTime] = React.useState(Date.now());

  // Gérer le délai d'affichage
  React.useEffect(() => {
    let delayTimeout;
    let minDurationTimeout;

    if (isLoading) {
      if (delay > 0) {
        delayTimeout = setTimeout(() => setShowLoader(true), delay);
      } else {
        setShowLoader(true);
      }
    } else {
      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        minDurationTimeout = setTimeout(() => setShowLoader(false), minDuration - elapsed);
      } else {
        setShowLoader(false);
      }
    }

    return () => {
      if (delayTimeout) clearTimeout(delayTimeout);
      if (minDurationTimeout) clearTimeout(minDurationTimeout);
    };
  }, [isLoading, delay, minDuration, startTime]);

  // Si pas de chargement et pas de fallback, afficher les enfants
  if (!isLoading && !showLoader) {
    return children;
  }

  // Si fallback personnalisé fourni
  if (fallback && (isLoading || showLoader)) {
    return fallback;
  }

  // Si chargement mais pas encore temps d'afficher
  if (isLoading && !showLoader) {
    return children; // Continuer à afficher le contenu pendant le délai
  }

  // Sélectionner le bon type de loader
  const renderLoader = () => {
    switch (type) {
      case 'card':
        return <CardLoader lines={lines} showAvatar={showAvatar} />;
      
      case 'list':
        return <ListLoader items={items || 5} showAvatar={showAvatar} />;
      
      case 'grid':
        return <GridLoader items={items || 6} columns={columns || 3} />;
      
      case 'table':
        return <TableLoader rows={rows || 5} columns={columns || 4} />;
      
      case 'metric':
        return <MetricLoader />;
      
      case 'button':
        return <ButtonSpinner size={size} className={className} />;
      
      case 'overlay':
        return <LoadingSpinner size={size} text={text} overlay className={className} />;
      
      case 'section':
        return (
          <div className={`flex items-center justify-center py-8 ${className}`}>
            <LoadingSpinner size={size} text={text} />
          </div>
        );
      
      case 'inline':
        return (
          <div className={`inline-flex items-center space-x-2 ${className}`}>
            <LoadingSpinner size="small" />
            {text && <span className="text-sm text-gray-600">{text}</span>}
          </div>
        );
      
      case 'spinner':
      default:
        return <LoadingSpinner size={size} text={text} className={className} />;
    }
  };

  return renderLoader();
};

/**
 * HOC pour wrapper automatiquement un composant avec un loader
 */
export const withLoader = (WrappedComponent, loaderConfig = {}) => {
  const LoaderWrappedComponent = (props) => {
    const { isLoading, loaderType, ...otherProps } = props;
    
    return (
      <SmartLoader
        type={loaderType || loaderConfig.type || 'spinner'}
        isLoading={isLoading}
        {...loaderConfig}
      >
        <WrappedComponent {...otherProps} />
      </SmartLoader>
    );
  };

  LoaderWrappedComponent.displayName = `withLoader(${WrappedComponent.name || 'Component'})`;
  return LoaderWrappedComponent;
};

/**
 * Composant pour les zones de contenu avec état de chargement
 */
export const LoadableContent = ({ 
  isLoading, 
  isEmpty = false,
  error = null,
  children,
  loaderType = 'spinner',
  emptyMessage = "Aucune donnée disponible",
  errorMessage = "Une erreur s'est produite",
  onRetry,
  className = ''
}) => {
  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-medium">{errorMessage}</p>
          {error.message && (
            <p className="text-sm text-gray-600 mt-2">{error.message}</p>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return <SmartLoader type={loaderType} isLoading />;
  }

  if (isEmpty) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" />
          </svg>
          <p className="text-lg font-medium text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return children;
};

/**
 * Composant pour les boutons avec état de chargement
 */
export const LoadableButton = ({ 
  isLoading = false,
  disabled = false,
  children,
  onClick,
  loadingText = "Chargement...",
  className = '',
  variant = 'primary',
  size = 'medium',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-primary-500'
  };

  const sizeClasses = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-4 py-2 text-sm', 
    large: 'px-6 py-3 text-base'
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner 
          size="xs" 
          color="white" 
          className="mr-2"
        />
      )}
      {isLoading ? loadingText : children}
    </button>
  );
};

export default SmartLoader;