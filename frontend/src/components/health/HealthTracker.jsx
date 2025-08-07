import React, { useState, useEffect } from 'react';
import userAPI from '../../api/userAPI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const HealthTracker = ({ user }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'trends', 'details'
  const [aiInsights, setAiInsights] = useState([]);

  // Couleurs pour les graphiques
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Charger les données de santé et l'historique au montage
  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les données depuis l'API
        const response = await userAPI.getStats();
        
        // Extraire les métriques de santé des données reçues
        const receivedData = response.data || {};
        
        // Fusionner avec les valeurs par défaut pour s'assurer que toutes les métriques existent
        const healthMetrics = {
          sleep: receivedData.sleep || 0,
          stress: receivedData.stress || 0,
          hydration: receivedData.hydration || 0,
          energy: receivedData.energy || 0,
          activity: receivedData.activity || 0
        };
        
        // Mettre à jour l'état
        setHealthData(healthMetrics);
        
        // Charger les données historiques (si disponibles)
        if (response.history && Array.isArray(response.history)) {
          setHistoryData(response.history);
        } else {
          // Générer des données historiques simulées si non disponibles
          generateMockHistoryData(healthMetrics);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données de santé:', err);
        setError(err.message || 'Impossible de charger vos données de santé');
        
        // Essayer de récupérer depuis le localStorage comme fallback
        const storedData = localStorage.getItem('health_data');
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            setHealthData(parsedData);
            setError('Utilisation des données locales (impossible de se connecter au serveur)');
          } catch (e) {
            console.error('Erreur lors de la lecture des données locales:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHealthData();
    }
  }, [user]);

  // Générer des données historiques simulées pour la démo
  const generateMockHistoryData = (currentData) => {
    // Générer 7 jours d'historique (aujourd'hui + 6 jours précédents)
    const mockHistory = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Créer des variations aléatoires basées sur les valeurs actuelles
      mockHistory.push({
        date: date.toISOString().split('T')[0],
        sleep: Math.max(0, Math.min(10, currentData.sleep + (Math.random() * 4 - 2))),
        stress: Math.max(0, Math.min(10, currentData.stress + (Math.random() * 4 - 2))),
        hydration: Math.max(0, Math.min(10, currentData.hydration + (Math.random() * 4 - 2))),
        energy: Math.max(0, Math.min(10, currentData.energy + (Math.random() * 4 - 2))),
        activity: Math.max(0, Math.min(10, currentData.activity + (Math.random() * 4 - 2)))
      });
    }
    
    setHistoryData(mockHistory);
  };

  // Gérer le changement de valeur pour une métrique
  const handleMetricChange = (metric, value) => {
    setHealthData(prev => ({
      ...prev,
      [metric]: value
    }));
  };

  // Gérer l'incrément/décrément d'une métrique
  const handleIncrement = (metric, increment) => {
    setHealthData(prev => ({
      ...prev,
      [metric]: Math.min(10, Math.max(0, prev[metric] + increment))
    }));
  };

  // Sauvegarder les données de santé mises à jour
  const saveHealthData = async () => {
    try {
      setUpdating(true);
      setError(null);
      setSuccessMessage(null);

      // Envoyer les données mises à jour à l'API
      await userAPI.updateStats(healthData);
      
      // Sauvegarder les données dans le localStorage comme backup
      localStorage.setItem('health_data', JSON.stringify(healthData));
      
      setSuccessMessage('✅ Données enregistrées avec succès !');
      
      // Faire disparaître le message de succès après 3 secondes
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour des données de santé:', err);
      setError(err.message || 'Impossible de mettre à jour vos données de santé');
    } finally {
      setUpdating(false);
    }
  };

  // Générer la couleur en fonction de la valeur
  const getColorForValue = (value) => {
    if (value <= 3) return 'bg-red-500';
    if (value <= 7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Suivi Santé Personnalisé</h1>
      
      {/* Messages de feedback */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div>
          {/* Métriques de santé */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Métriques d'aujourd'hui</h2>
            
            {/* Affichage des sliders et boutons pour chaque métrique */}
            {Object.keys(healthData).map((metric) => (
              <div key={metric} className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium">{metricsInfo[metric].label}</h3>
                    <p className="text-sm text-gray-500">{metricsInfo[metric].description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleIncrement(metric, -1)}
                      disabled={healthData[metric] <= 0}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="text-lg font-medium w-8 text-center">{Math.round(healthData[metric])}</span>
                    <button 
                      onClick={() => handleIncrement(metric, 1)}
                      disabled={healthData[metric] >= 10}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    step="1"
                    value={healthData[metric]} 
                    onChange={(e) => handleMetricChange(metric, parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                {/* Indicateur visuel de la valeur */}
                <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${getColorForValue(healthData[metric])}`} 
                    style={{ width: `${healthData[metric] * 10}%` }}
                  ></div>
                </div>
              </div>
            ))}
            
            {/* Bouton de sauvegarde */}
            <button
              onClick={saveHealthData}
              disabled={updating}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
            >
              {updating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </span>
              ) : 'Enregistrer mes données'}
            </button>
          </div>
          
          {/* Graphique historique des métriques de santé */}
          {historyData.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Evolution sur 7 jours</h2>
              
              {/* Sélecteur de métrique */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.keys(healthData).map(metric => (
                  <button
                    key={metric}
                    onClick={() => setActiveMetric(metric)}
                    className={`px-3 py-1 rounded-full text-sm ${activeMetric === metric ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    {metricsInfo[metric].label}
                  </button>
                ))}
              </div>
              
              {/* Graphique Recharts */}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={historyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={activeMetric}
                    stroke="#3182CE"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name={metricsInfo[activeMetric]?.label || activeMetric}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthTracker;
