import React, { useState, useEffect } from 'react';
import userAPI from '../../api/userAPI';
import { SectionCard, MetricCard, StatCard } from '../layout/SectionCard';

const HealthTrackerAI = ({ user }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [activeView, setActiveView] = useState('overview');
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
        const [statsResponse, historyResponse] = await Promise.all([
          userAPI.getStats(),
          userAPI.getHealthHistory(7)
        ]);

        setHealthData(statsResponse);
        setHistoryData(historyResponse.history || []);

        // Générer des insights IA basés sur les données
        generateAIInsights(statsResponse);

      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger les données de santé');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, []);

  // Générer des insights IA basés sur les données de santé
  const generateAIInsights = (data) => {
    const insights = [];
    const metrics = data.metrics || {};

    // Analyse du sommeil
    if (metrics.sleep) {
      if (metrics.sleep.value < 6) {
        insights.push({
          type: 'warning',
          category: 'Sommeil',
          message: 'Votre sommeil est insuffisant. Essayez de dormir au moins 7-8h par nuit.',
          recommendation: 'Établissez une routine de coucher régulière et évitez les écrans 1h avant de dormir.'
        });
      } else if (metrics.sleep.value >= 8) {
        insights.push({
          type: 'success',
          category: 'Sommeil',
          message: 'Excellent ! Vous dormez suffisamment.',
          recommendation: 'Continuez à maintenir cette bonne habitude de sommeil.'
        });
      }
    }

    // Analyse du stress
    if (metrics.stress) {
      if (metrics.stress.value > 7) {
        insights.push({
          type: 'alert',
          category: 'Stress',
          message: 'Votre niveau de stress est élevé.',
          recommendation: 'Pratiquez des exercices de respiration ou de méditation. Considérez une pause dans votre journée.'
        });
      } else if (metrics.stress.value <= 3) {
        insights.push({
          type: 'success',
          category: 'Stress',
          message: 'Votre niveau de stress est bien géré.',
          recommendation: 'Continuez vos bonnes pratiques de gestion du stress.'
        });
      }
    }

    // Analyse de l'hydratation
    if (metrics.hydration) {
      if (metrics.hydration.value < 1.5) {
        insights.push({
          type: 'warning',
          category: 'Hydratation',
          message: 'Vous ne buvez pas assez d\'eau.',
          recommendation: 'Visez au moins 2L d\'eau par jour. Gardez une bouteille d\'eau à portée de main.'
        });
      }
    }

    // Analyse de l'activité
    if (metrics.activity) {
      if (metrics.activity.value < 5000) {
        insights.push({
          type: 'info',
          category: 'Activité',
          message: 'Votre activité physique pourrait être améliorée.',
          recommendation: 'Essayez de faire au moins 8000 pas par jour. Prenez les escaliers ou marchez pendant vos pauses.'
        });
      } else if (metrics.activity.value >= 10000) {
        insights.push({
          type: 'success',
          category: 'Activité',
          message: 'Fantastique ! Vous êtes très actif aujourd\'hui.',
          recommendation: 'Maintenez ce niveau d\'activité pour une santé optimale.'
        });
      }
    }

    setAiInsights(insights);
  };

  // Fonction pour obtenir l'icône selon le type d'insight
  const getInsightIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'alert': return '🚨';
      case 'info': return 'ℹ️';
      default: return '💡';
    }
  };

  // Fonction pour obtenir la couleur selon le type d'insight
  const getInsightColor = (type) => {
    switch (type) {
      case 'success': return 'metric-excellent border-2';
      case 'warning': return 'metric-average border-2';
      case 'alert': return 'metric-poor border-2';
      case 'info': return 'metric-good border-2';
      default: return 'card border-2';
    }
  };

  // Préparer les données pour le graphique en secteurs
  const preparePieData = () => {
    if (!healthData?.metrics) return [];
    
    return Object.entries(healthData.metrics).map(([key, metric]) => ({
      name: metric.label,
      value: Math.round((metric.value / metric.max) * 100),
      color: COLORS[Object.keys(healthData.metrics).indexOf(key)]
    }));
  };

  // Préparer les données pour le graphique en barres
  const prepareBarData = () => {
    if (!healthData?.metrics) return [];
    
    return Object.entries(healthData.metrics).map(([key, metric]) => ({
      name: metric.label,
      valeur: metric.value,
      objectif: metric.max,
      pourcentage: Math.round((metric.value / metric.max) * 100)
    }));
  };

  if (loading) {
    return (
      <div className="container-app py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="loading-spinner w-12 h-12"></div>
          <span className="ml-4 text-lg text-text-secondary font-medium">Analyse de vos données de santé en cours...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-app py-8">
        <div className="card metric-poor border-2">
          <p className="font-bold text-text-primary mb-2">Erreur d'analyse</p>
          <p className="text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-6 animate-fade-in">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          🏥 Suivi Santé Intelligent
        </h1>
        <p className="text-lg text-text-secondary">
          Analyse automatique de vos métriques de santé par notre IA
        </p>
      </div>

      {/* Navigation des vues */}
      <div className="mb-8">
        <div className="flex space-x-2 bg-background-accent rounded-2xl p-2">
          {[
            { key: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
            { key: 'trends', label: 'Tendances', icon: '📈' },
            { key: 'insights', label: 'Insights IA', icon: '🤖' }
          ].map((view) => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={`px-6 py-3 font-medium rounded-xl transition-all duration-200 ${
                activeView === view.key
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-primary'
              }`}
            >
              {view.icon} {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vue d'ensemble */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Score global */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">Score Santé Global</h2>
            <div className="flex items-center justify-center">
              <div className="text-6xl font-bold text-primary">
                {healthData?.healthScore || 75}
              </div>
              <div className="ml-4">
                <div className="text-2xl text-gray-600">/100</div>
                <div className="text-sm text-gray-500">Analysé par IA</div>
              </div>
            </div>
          </div>

          {/* Métriques détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthData?.metrics && Object.entries(healthData.metrics).map(([key, metric]) => (
              <div key={key} className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="font-semibold text-gray-800 mb-2">{metric.label}</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-primary">
                    {typeof metric.value === 'number' && metric.value % 1 !== 0 
                      ? metric.value.toFixed(1) 
                      : metric.value}
                  </span>
                  <span className="text-sm text-gray-500">{metric.unit}</span>
                </div>
                
                {/* Barre de progression */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-primary rounded-full h-3 transition-all duration-500"
                    style={{ width: `${Math.min((metric.value / metric.max) * 100, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>{metric.max} {metric.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vue Tendances */}
      {activeView === 'trends' && (
        <div className="space-y-6">
          {/* Graphique en barres */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">Comparaison avec les Objectifs</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareBarData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="valeur" fill="#2563eb" name="Valeur actuelle" />
                <Bar dataKey="objectif" fill="#e5e7eb" name="Objectif" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique en secteurs */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">Répartition des Performances</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={preparePieData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {preparePieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Historique */}
          {historyData.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4">Évolution du Score Santé</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Vue Insights IA */}
      {activeView === 'insights' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-2">🤖 Analyse IA Personnalisée</h2>
            <p>Notre intelligence artificielle a analysé vos données et vous propose des recommandations personnalisées.</p>
          </div>

          {aiInsights.length > 0 ? (
            <div className="grid gap-4">
              {aiInsights.map((insight, index) => (
                <div key={index} className={`border-l-4 rounded-lg p-4 ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">{getInsightIcon(insight.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-gray-800">{insight.category}</h3>
                      </div>
                      <p className="text-gray-700 mb-2">{insight.message}</p>
                      <div className="bg-white bg-opacity-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-800">
                          💡 Recommandation : {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-gray-600">Aucun insight disponible pour le moment. Continuez à utiliser l'application pour obtenir des analyses personnalisées.</p>
            </div>
          )}
        </div>
      )}

      {/* Dernière mise à jour */}
      {healthData?.lastUpdated && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Dernière analyse : {new Date(healthData.lastUpdated).toLocaleString('fr-FR')}
        </div>
      )}
    </div>
  );
};

export default HealthTrackerAI;
