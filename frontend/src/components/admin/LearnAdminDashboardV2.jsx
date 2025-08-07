import React, { useState, useEffect } from 'react';
import SectionCard, { MetricCard, StatCard } from '../layout/SectionCard';

// Composant LogCard modernisé
const LogCard = ({ log, index }) => {
  const getTypeColor = (type) => {
    const colors = {
      'Chat IA': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
      'Analyse Santé': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
      'Analyse Repas': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
      'Objectifs': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
      'Entraînement': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
    };
    return colors[type] || { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
  };

  const getTypeIcon = (type) => {
    const icons = {
      'Chat IA': '💬',
      'Analyse Santé': '🏥',
      'Analyse Repas': '🍽️',
      'Objectifs': '🎯',
      'Entraînement': '💪'
    };
    return icons[type] || '📝';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const typeStyle = getTypeColor(log.type);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:bg-slate-700/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getTypeIcon(log.type)}</span>
          <div>
            <h3 className="text-slate-100 font-medium">{log.user}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border} border`}>
                {log.type}
              </span>
              <span className="text-xs text-slate-400">#{index + 1}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">
            {formatTimestamp(log.timestamp)}
          </div>
        </div>
      </div>

      <div className="bg-slate-700/50 rounded-lg p-3">
        <p className="text-sm text-slate-300 leading-relaxed">
          {log.content}
        </p>
      </div>
    </div>
  );
};

// Composant FilterSection modernisé
const FilterSection = ({ filterEmail, setFilterEmail, onFilter, onClear, onRefresh, loading }) => {
  return (
    <SectionCard
      title="Filtres et Actions"
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
        </svg>
      }
      color="blue"
    >
      <div className="space-y-4">
        {/* Filtre par email */}
        <div>
          <label htmlFor="email-filter" className="block text-sm font-medium text-slate-300 mb-2">
            Filtrer par utilisateur (email)
          </label>
          <input
            id="email-filter"
            type="email"
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
            placeholder="exemple@email.com"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onFilter}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            Filtrer
          </button>
          
          <button
            onClick={onClear}
            disabled={loading}
            className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-600/50 text-slate-200 px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Effacer
          </button>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {loading ? 'Actualisation...' : 'Actualiser les logs'}
          </button>
        </div>
      </div>
    </SectionCard>
  );
};

// Composant LogsSection modernisé
const LogsSection = ({ logs, loading, filterEmail }) => {
  if (loading) {
    return (
      <SectionCard
        title="Logs d'Apprentissage IA"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        color="cyan"
        loading={true}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="w-12 h-12 text-slate-400 animate-spin mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-slate-400">Chargement des logs...</p>
          </div>
        </div>
      </SectionCard>
    );
  }

  if (logs.length === 0) {
    const token = localStorage.getItem('token');
    
    return (
      <SectionCard
        title="Logs d'Apprentissage IA"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        color="cyan"
      >
        <div className="text-center py-12">
          {!token ? (
            <>
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Authentification requise</h3>
              <p className="text-slate-400 mb-4">
                Veuillez vous connecter pour accéder aux logs d'apprentissage IA
              </p>
              <button 
                onClick={() => window.location.href = '/login'}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Se connecter
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Aucun log trouvé</h3>
              <p className="text-slate-400">
                {filterEmail 
                  ? `Aucun log trouvé pour l'utilisateur "${filterEmail}"`
                  : 'Aucun log d\'apprentissage IA disponible pour le moment'
                }
              </p>
            </>
          )}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={`Logs d'Apprentissage IA (${logs.length})`}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      color="cyan"
      headerAction={
        filterEmail && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-cyan-400">Filtré par:</span>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
              {filterEmail}
            </span>
          </div>
        )
      }
    >
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {logs.map((log, index) => (
          <LogCard key={index} log={log} index={index} />
        ))}
      </div>
    </SectionCard>
  );
};

// Composant principal LearnAdminDashboardV2
const LearnAdminDashboardV2 = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterEmail, setFilterEmail] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);

  // Statistiques calculées
  const [stats, setStats] = useState({
    totalLogs: 0,
    uniqueUsers: 0,
    chatLogs: 0,
    healthLogs: 0,
    mealLogs: 0,
    goalLogs: 0,
    workoutLogs: 0
  });

  // Fonction pour récupérer les logs depuis l'API
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Ne pas afficher d'erreur si pas de token, juste arrêter le chargement
        setLoading(false);
        setLogs([]);
        setFilteredLogs([]);
        return;
      }

      const response = await fetch('http://localhost:5003/api/learn/all', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setLogs(data);
      setFilteredLogs(data);

      // Calculer les statistiques
      const uniqueUsers = new Set(data.map(log => log.user)).size;
      const typeCount = data.reduce((acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalLogs: data.length,
        uniqueUsers,
        chatLogs: typeCount['Chat IA'] || 0,
        healthLogs: typeCount['Analyse Santé'] || 0,
        mealLogs: typeCount['Analyse Repas'] || 0,
        goalLogs: typeCount['Objectifs'] || 0,
        workoutLogs: typeCount['Entraînement'] || 0
      });

    } catch (err) {
      console.error('Erreur lors de la récupération des logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Charger les logs au montage du composant
  useEffect(() => {
    fetchLogs();
  }, []);

  // Fonction pour filtrer les logs
  const handleFilter = () => {
    if (!filterEmail.trim()) {
      setFilteredLogs(logs);
      return;
    }

    const filtered = logs.filter(log => 
      log.user.toLowerCase().includes(filterEmail.toLowerCase())
    );
    setFilteredLogs(filtered);
  };

  // Fonction pour effacer le filtre
  const handleClearFilter = () => {
    setFilterEmail('');
    setFilteredLogs(logs);
  };

  // Fonction pour actualiser les logs
  const handleRefresh = () => {
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Dashboard Learn Admin</h1>
          <p className="text-slate-400 mt-1">Supervision et analyse des logs d'apprentissage IA</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-300">Système actif</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total des logs"
          value={stats.totalLogs}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          color="cyan"
        />

        <MetricCard
          title="Utilisateurs uniques"
          value={stats.uniqueUsers}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
          color="green"
        />

        <MetricCard
          title="Logs Chat IA"
          value={stats.chatLogs}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          color="blue"
        />

        <MetricCard
          title="Logs Santé"
          value={stats.healthLogs}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          color="red"
        />
      </div>

      {/* Section de filtrage */}
      <FilterSection
        filterEmail={filterEmail}
        setFilterEmail={setFilterEmail}
        onFilter={handleFilter}
        onClear={handleClearFilter}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Gestion des erreurs */}
      {error && (
        <SectionCard
          title="Erreur"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
          color="red"
        >
          <div className="text-center py-6">
            <p className="text-red-400 mb-4">Erreur lors du chargement des logs:</p>
            <p className="text-slate-300 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Réessayer
            </button>
          </div>
        </SectionCard>
      )}

      {/* Section des logs */}
      {!error && (
        <LogsSection
          logs={filteredLogs}
          loading={loading}
          filterEmail={filterEmail}
        />
      )}

      {/* Informations système */}
      <SectionCard
        title="Informations Système"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        color="purple"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Système d'apprentissage</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex justify-between">
                <span>API Endpoint:</span>
                <span className="text-slate-300">/api/learn/all</span>
              </div>
              <div className="flex justify-between">
                <span>Méthode:</span>
                <span className="text-slate-300">GET</span>
              </div>
              <div className="flex justify-between">
                <span>Authentification:</span>
                <span className="text-green-400">Bearer Token</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Types de logs supportés</h4>
            <div className="space-y-1 text-sm text-slate-400">
              <div>• Chat IA - Conversations utilisateur</div>
              <div>• Analyse Santé - Métriques de santé</div>
              <div>• Analyse Repas - Données nutritionnelles</div>
              <div>• Objectifs - Suivi des objectifs</div>
              <div>• Entraînement - Plans d'exercice</div>
            </div>
          </div>
        </div>
      </SectionCard>

    </div>
  );
};

export default LearnAdminDashboardV2;
