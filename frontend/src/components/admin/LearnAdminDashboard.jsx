import React, { useState, useEffect } from 'react';

// Composant pour les statistiques en haut
const StatsBox = ({ title, value, icon, color = "bg-blue-500" }) => (
  <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`${color} rounded-xl p-3 text-white text-xl`}>
        {icon}
      </div>
    </div>
  </div>
);

// Composant pour la barre de filtre
const FilterBar = ({ filterEmail, setFilterEmail, onFilter, onClear }) => (
  <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 mb-6">
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="flex-1">
        <label htmlFor="email-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filtrer par utilisateur (email)
        </label>
        <input
          id="email-filter"
          type="email"
          value={filterEmail}
          onChange={(e) => setFilterEmail(e.target.value)}
          placeholder="exemple@email.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="flex gap-2 mt-6 sm:mt-0">
        <button
          onClick={onFilter}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
        >
          Filtrer
        </button>
        <button
          onClick={onClear}
          className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
        >
          Effacer
        </button>
      </div>
    </div>
  </div>
);

// Composant pour le tableau des logs
const LearnLogTable = ({ logs, loading }) => {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'goal_created':
        return 'bg-green-100 text-green-800';
      case 'meal_analysis':
        return 'bg-orange-100 text-orange-800';
      case 'chat_message':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'goal_created':
        return 'Objectif créé';
      case 'meal_analysis':
        return 'Analyse repas';
      case 'chat_message':
        return 'Message chat';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Chargement des logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Logs Learn - {logs.length} événements
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type d'action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contenu
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                  Aucun log trouvé
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {log.user || 'Utilisateur inconnu'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(log.type)}`}>
                      {getTypeLabel(log.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={log.content}>
                      {log.content || 'Aucun contenu'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.timestamp)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Composant principal
const LearnAdminDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterEmail, setFilterEmail] = useState('');

  // Statistiques calculées
  const stats = {
    total: filteredLogs.length,
    goalCreated: filteredLogs.filter(log => log.type === 'goal_created').length,
    mealAnalysis: filteredLogs.filter(log => log.type === 'meal_analysis').length,
    chatMessage: filteredLogs.filter(log => log.type === 'chat_message').length
  };

  // Chargement des logs depuis l'API
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5003/api/learn/all');
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Trier par date décroissante et limiter à 100 entrées
      const sortedLogs = (data || [])
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 100);
      
      setLogs(sortedLogs);
      setFilteredLogs(sortedLogs);
    } catch (err) {
      console.error('Erreur lors du chargement des logs:', err);
      setError(err.message);
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage par email
  const handleFilter = () => {
    if (!filterEmail.trim()) {
      setFilteredLogs(logs);
      return;
    }
    
    const filtered = logs.filter(log => 
      log.user && log.user.toLowerCase().includes(filterEmail.toLowerCase())
    );
    setFilteredLogs(filtered);
  };

  // Effacer le filtre
  const handleClearFilter = () => {
    setFilterEmail('');
    setFilteredLogs(logs);
  };

  // Chargement initial
  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 Dashboard Admin Learn
          </h1>
          <p className="text-gray-600">
            Surveillance des logs IA et interactions utilisateurs
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsBox
            title="Total des logs"
            value={stats.total}
            icon="📊"
            color="bg-blue-500"
          />
          <StatsBox
            title="Objectifs créés"
            value={stats.goalCreated}
            icon="🎯"
            color="bg-green-500"
          />
          <StatsBox
            title="Analyses repas"
            value={stats.mealAnalysis}
            icon="🍽️"
            color="bg-orange-500"
          />
          <StatsBox
            title="Messages chat"
            value={stats.chatMessage}
            icon="💬"
            color="bg-purple-500"
          />
        </div>

        {/* Barre de filtre */}
        <FilterBar
          filterEmail={filterEmail}
          setFilterEmail={setFilterEmail}
          onFilter={handleFilter}
          onClear={handleClearFilter}
        />

        {/* Gestion des erreurs */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-500 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchLogs}
              className="mt-3 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Tableau des logs */}
        <LearnLogTable logs={filteredLogs} loading={loading} />

        {/* Bouton de rechargement */}
        <div className="mt-6 text-center">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {loading ? 'Chargement...' : '🔄 Actualiser les logs'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearnAdminDashboard;
