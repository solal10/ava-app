import React, { useState, useEffect } from 'react';

const SimpleLearnDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour charger les logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Tentative de chargement des logs...');
      
      const response = await fetch('http://localhost:5003/api/learn/all');
      console.log('Réponse API:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Données reçues:', data.length, 'logs');
      
      setLogs(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des logs:', err);
      setError(err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    console.log('Composant SimpleLearnDashboard monté');
    fetchLogs();
  }, []);

  // Statistiques simples
  const stats = {
    total: logs.length,
    goalCreated: logs.filter(log => log.type === 'goal_created').length,
    mealAnalysis: logs.filter(log => log.type === 'meal_analysis').length,
    chatMessage: logs.filter(log => log.type === 'chat_message').length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 Dashboard Learn (Version Simple)
          </h1>
          <p className="text-gray-600">
            Test de l'API Learn et affichage des données
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total des logs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-500 rounded-xl p-3 text-white text-xl">📊</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Objectifs créés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.goalCreated}</p>
              </div>
              <div className="bg-green-500 rounded-xl p-3 text-white text-xl">🎯</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Analyses repas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.mealAnalysis}</p>
              </div>
              <div className="bg-orange-500 rounded-xl p-3 text-white text-xl">🍽️</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages chat</p>
                <p className="text-2xl font-bold text-gray-900">{stats.chatMessage}</p>
              </div>
              <div className="bg-purple-500 rounded-xl p-3 text-white text-xl">💬</div>
            </div>
          </div>
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Chargement des logs...</span>
            </div>
          </div>
        )}

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

        {/* Liste simple des logs */}
        {!loading && !error && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Logs Learn - {logs.length} événements
              </h3>
            </div>
            
            <div className="p-4">
              {logs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun log trouvé</p>
              ) : (
                <div className="space-y-2">
                  {logs.slice(0, 10).map((log, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">{log.user}</span>
                          <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {log.type}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{log.content}</p>
                    </div>
                  ))}
                  {logs.length > 10 && (
                    <p className="text-center text-gray-500 py-2">
                      ... et {logs.length - 10} autres logs
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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

export default SimpleLearnDashboard;
