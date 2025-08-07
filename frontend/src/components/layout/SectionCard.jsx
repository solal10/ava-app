import React from 'react';

const SectionCard = ({ 
  title, 
  children, 
  icon, 
  color = 'cyan', 
  className = '',
  headerAction,
  loading = false,
  error = null
}) => {
  // Couleurs disponibles
  const colorClasses = {
    cyan: {
      icon: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-900/10'
    },
    green: {
      icon: 'text-green-400',
      border: 'border-green-500/20',
      bg: 'bg-green-900/10'
    },
    red: {
      icon: 'text-red-400',
      border: 'border-red-500/20',
      bg: 'bg-red-900/10'
    },
    blue: {
      icon: 'text-blue-400',
      border: 'border-blue-500/20',
      bg: 'bg-blue-900/10'
    },
    purple: {
      icon: 'text-purple-400',
      border: 'border-purple-500/20',
      bg: 'bg-purple-900/10'
    },
    yellow: {
      icon: 'text-yellow-400',
      border: 'border-yellow-500/20',
      bg: 'bg-yellow-900/10'
    },
    gray: {
      icon: 'text-slate-400',
      border: 'border-slate-500/20',
      bg: 'bg-slate-900/10'
    }
  };

  const currentColor = colorClasses[color] || colorClasses.cyan;

  return (
    <div className={`bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-4 transition-all duration-200 hover:shadow-xl hover:border-slate-600 ${className}`}>
      {/* Header */}
      {(title || icon || headerAction) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`flex-shrink-0 ${currentColor.icon}`}>
                {icon}
              </div>
            )}
            {title && (
              <h3 className="text-lg font-semibold text-slate-100">
                {title}
              </h3>
            )}
          </div>
          {headerAction && (
            <div className="flex-shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <span className="ml-3 text-slate-400">Chargement...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={`rounded-xl p-4 mb-4 ${colorClasses.red.bg} ${colorClasses.red.border} border`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400 text-sm font-medium">Erreur</span>
          </div>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="text-slate-300">
          {children}
        </div>
      )}
    </div>
  );
};

// Variantes prédéfinies pour des cas d'usage courants
export const MetricCard = ({ title, value, unit, trend, icon, color = 'cyan' }) => (
  <SectionCard
    title={title}
    icon={icon}
    color={color}
    className="text-center"
  >
    <div className="space-y-2">
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-3xl font-bold text-slate-100">{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      {trend && (
        <div className={`flex items-center justify-center gap-1 text-sm ${
          trend.direction === 'up' ? 'text-green-400' : 
          trend.direction === 'down' ? 'text-red-400' : 
          'text-slate-400'
        }`}>
          {trend.direction === 'up' && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
          )}
          {trend.direction === 'down' && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
            </svg>
          )}
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  </SectionCard>
);

export const StatCard = ({ title, stats, icon, color = 'cyan' }) => (
  <SectionCard
    title={title}
    icon={icon}
    color={color}
  >
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
          <div className="text-sm text-slate-400">{stat.label}</div>
        </div>
      ))}
    </div>
  </SectionCard>
);

export const ProgressCard = ({ title, progress, icon, color = 'cyan' }) => {
  const getProgressColor = (value) => {
    if (value >= 80) return 'bg-green-400';
    if (value >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <SectionCard
      title={title}
      icon={icon}
      color={color}
    >
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-300">Progression</span>
          <span className="text-slate-300">{progress.current}/{progress.target}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(progress.percentage)}`}
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold text-slate-100">{progress.percentage}%</span>
        </div>
      </div>
    </SectionCard>
  );
};

export default SectionCard;
