import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = null, 
  className = '',
  overlay = false,
  centered = false
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}>
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {text && (
        <p className={`mt-3 text-sm font-medium ${colorClasses[color]}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
        {spinner}
      </div>
    );
  }

  if (centered) {
    return (
      <div className="flex items-center justify-center p-4">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Composant de page de chargement complète
export const LoadingPage = ({ text = "Chargement en cours..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" text={text} />
      </div>
    </div>
  );
};

// Composant de chargement pour sections
export const LoadingSection = ({ text = "Chargement...", className = "" }) => {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <LoadingSpinner size="large" text={text} />
    </div>
  );
};

// Composant de chargement pour boutons
export const ButtonSpinner = ({ size = 'small', className = '' }) => (
  <LoadingSpinner 
    size={size} 
    color="white" 
    className={className}
  />
);

// Composant de chargement pour cartes
export const CardLoader = ({ lines = 3, showAvatar = false }) => (
  <div className="animate-pulse p-4 bg-white rounded-lg border border-gray-200">
    <div className="flex items-center space-x-3 mb-4">
      {showAvatar && (
        <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
      )}
      <div className="flex-1">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className={`h-3 bg-gray-200 rounded ${
            index === lines - 1 ? 'w-2/3' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  </div>
);

// Composant de chargement pour listes
export const ListLoader = ({ items = 5, showAvatar = true }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="animate-pulse flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
        {showAvatar && (
          <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
        )}
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// Composant de chargement pour grilles
export const GridLoader = ({ items = 6, columns = 3 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-4`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="bg-gray-300 rounded-lg h-48 mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// Composant de chargement pour tableaux
export const TableLoader = ({ rows = 5, columns = 4 }) => (
  <div className="overflow-hidden border border-gray-200 rounded-lg">
    <div className="bg-gray-50 border-b border-gray-200 p-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-300 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 animate-pulse">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={`h-3 bg-gray-200 rounded ${
                  colIndex === 0 ? 'w-3/4' : colIndex === columns - 1 ? 'w-1/2' : 'w-full'
                }`}
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Composant de skeleton pour métriques/dashboard
export const MetricLoader = () => (
  <div className="animate-pulse bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
      <div className="h-6 w-6 bg-gray-300 rounded"></div>
    </div>
    <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  </div>
);

export default LoadingSpinner;