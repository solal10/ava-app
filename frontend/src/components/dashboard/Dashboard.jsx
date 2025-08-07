import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userAPI from '../../api/userAPI';
import { fetchFromGarmin, fetchFromAppleHealth, syncAllDevices } from '../../sdk/wearablesBridge';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [wearableData, setWearableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wearableLoading, setWearableLoading] = useState(true);

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const userStats = await userAPI.getStats();
        setStats(userStats);
        
        // Sauvegarder le score global dans localStorage
        if (userStats.healthScore) {
          localStorage.setItem('healthScore', userStats.healthScore.toString());
        }
      } catch (err) {
        console.error('Erreur lors du chargement des statistiques:', err);
        setError('Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    const loadWearableData = async () => {
      try {
        setWearableLoading(true);
        const userId = user?.id || 'demo-user';
        
        // Récupérer les données Garmin (ou Apple selon préférence utilisateur)
        const wearableInfo = await fetchFromGarmin(userId);
        setWearableData(wearableInfo);
        
        console.log('Données montre connectée chargées:', wearableInfo);
      } catch (err) {
        console.error('Erreur lors du chargement des données de montre:', err);
        // Ne pas bloquer l'interface si les données de montre ne sont pas disponibles
      } finally {
        setWearableLoading(false);
      }
    };

    loadUserStats();
    loadWearableData();
  }, [user?.id]);

  // Fonction pour obtenir le message personnalisé selon le score de santé
  const getPersonalizedMessage = (score) => {
    if (score >= 85) {
      return "Tu es en pleine forme aujourd'hui ! 🌟";
    } else if (score >= 70) {
      return "Bonne journée santé ! Continue comme ça ! 💪";
    } else if (score >= 55) {
      return "Quelques ajustements et tu seras au top ! 🎯";
    } else {
      return "Pense à bien dormir et t'hydrater ce soir ! 💤";
    }
  };

  // Fonction pour obtenir la couleur selon le score
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Fonction pour obtenir la couleur de fond selon le score
  const getScoreBgColor = (score) => {
    if (score >= 85) return 'bg-green-100';
    if (score >= 70) return 'bg-blue-100';
    if (score >= 55) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Fonction pour obtenir la couleur selon le statut de la métrique
  const getMetricColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Boutons de navigation rapide
  const quickNavButtons = [
    {
      title: 'Suivi Santé',
      path: '/health',
      icon: '📊',
      description: 'Voir tes métriques détaillées'
    },
    {
      title: 'Objectifs',
      path: '/goals/tracker',
      icon: '🏆',
      description: 'Gérer tes objectifs santé'
    },
    {
      title: 'Analyseur Repas',
      path: '/meal-analyzer',
      icon: '🍽️',
      description: 'Analyser tes repas avec l\'IA'
    },
    {
      title: 'Recommandations',
      path: '/advice',
      icon: '💡',
      description: 'Conseils personnalisés'
    },
    {
      title: 'Chat IA',
      path: '/chat',
      icon: '🤖',
      description: 'Parle avec ton coach IA'
    }
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Erreur</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const healthScore = stats?.healthScore || parseInt(localStorage.getItem('healthScore')) || 75;
  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Utilisateur';
  
  // Informations sur la source des données
  const dataSource = stats?.source || 'fallback';
  const connectedDevices = stats?.sources || [];
  const deviceInfo = stats?.devices || [];

  return (
    <div className="container-app py-6 animate-fade-in">
      {/* En-tête avec message de bienvenue */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Bonjour {firstName} ! 👋
            </h1>
            <p className="text-lg text-text-secondary mb-4">
              {getPersonalizedMessage(healthScore)}
            </p>
            
            {/* Indicateur de source des données */}
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-text-muted">Source des données :</span>
              {dataSource === 'sdk' && connectedDevices.length > 0 ? (
                <div className="flex items-center space-x-2">
                  {connectedDevices.includes('garmin') && (
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs bg-primary-100 text-primary-700 font-medium">
                      🏃 Garmin
                    </span>
                  )}
                  {connectedDevices.includes('apple') && (
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs bg-background-accent text-text-primary font-medium">
                      🍎 Apple
                    </span>
                  )}
                  <span className="text-xs text-health-excellent font-medium">✅ Connecté</span>
                </div>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs bg-orange-100 text-health-average font-medium">
                  📱 Données simulées
                </span>
              )}
            </div>
          </div>
          
          {/* Badge niveau d'abonnement */}
          <div className="mb-4 md:mb-0">
            <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              user?.isPremium 
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-soft hover:scale-105' 
                : 'bg-background-accent text-text-secondary border border-gray-200 hover:bg-gray-100'
            }`}>
              {user?.isPremium ? '⭐ Premium' : '🆓 Gratuit'}
            </span>
          </div>
        </div>
      </div>

      {/* Score santé global */}
      <div className="mb-8">
        <div className={`card-hover ${getScoreBgColor(healthScore)} border-l-4 border-primary-500 animate-slide-up`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary mb-3">
                Score Santé Global
              </h2>
              <div className="flex items-center">
                <span className={`text-5xl font-bold ${getScoreColor(healthScore)} transition-all duration-300`}>
                  {healthScore}
                </span>
                <span className="text-2xl text-text-muted ml-2">/100</span>
              </div>
            </div>
            
            {/* Barre de progression circulaire */}
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${getScoreColor(healthScore)} transition-all duration-500`}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray={`${healthScore}, 100`}
                  strokeLinecap="round"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-text-muted">{healthScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Récapitulatif des 5 métriques */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-6">
          Tes Métriques Aujourd'hui
        </h2>
        {/* Métriques détaillées */}
        <div className="grid-responsive gap-6">
            {stats?.metrics && Object.entries(stats.metrics).map(([key, metric]) => (
              <div key={key} className={`card-hover ${getMetricColor(metric.status)} border-2 animate-slide-up`} style={{animationDelay: `${Object.keys(stats.metrics).indexOf(key) * 100}ms`}}>
                <div className="text-center">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-text-primary">{metric.label}</h3>
                    {/* Indicateur de source pour chaque métrique */}
                    {metric.source && (
                      <span className="text-sm opacity-70">
                        {metric.source === 'garmin' && '🏃'}
                        {metric.source === 'apple' && '🍎'}
                        {metric.source === 'estimated' && '📊'}
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold mb-2 transition-all duration-300">
                    {typeof metric.value === 'number' && metric.value % 1 !== 0 
                      ? metric.value.toFixed(1) 
                      : metric.value}
                  </div>
                  <div className="text-xs text-text-muted font-medium mb-4">
                    {metric.unit}
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="mt-4">
                    <div className="bg-white bg-opacity-60 rounded-full h-2.5">
                      <div 
                        className="bg-current rounded-full h-2.5 transition-all duration-500 ease-out"
                        style={{ width: `${Math.min((metric.value / metric.max) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-text-muted mt-1">
                      <span>0</span>
                      <span>{metric.max}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Données Montre Connectée */}
      {wearableData && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-text-primary">
              📱 Données Montre Connectée
            </h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-text-muted font-medium">
                Garmin Connect
              </span>
              {!wearableLoading && (
                <span className="w-3 h-3 bg-health-excellent rounded-full animate-pulse-soft shadow-sm"></span>
              )}
            </div>
          </div>
          
          <div className="card-hover bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200 border-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="text-center p-3 rounded-xl bg-white bg-opacity-60 hover:bg-opacity-80 transition-all duration-200">
                <div className="text-3xl mb-3">😴</div>
                <div className="text-xl font-bold text-text-primary mb-1">{wearableData.sleep}h</div>
                <div className="text-xs text-text-muted font-medium">Sommeil</div>
              </div>
              
              <div className="text-center p-3 rounded-xl bg-white bg-opacity-60 hover:bg-opacity-80 transition-all duration-200">
                <div className="text-3xl mb-3">👟</div>
                <div className="text-xl font-bold text-text-primary mb-1">{wearableData.steps.toLocaleString()}</div>
                <div className="text-xs text-text-muted font-medium">Pas</div>
              </div>
              
              <div className="text-center p-3 rounded-xl bg-white bg-opacity-60 hover:bg-opacity-80 transition-all duration-200">
                <div className="text-3xl mb-3">❤️</div>
                <div className="text-xl font-bold text-text-primary mb-1">{wearableData.heartRate}</div>
                <div className="text-xs text-text-muted font-medium">BPM</div>
              </div>
              
              <div className="text-center p-3 rounded-xl bg-white bg-opacity-60 hover:bg-opacity-80 transition-all duration-200">
                <div className="text-3xl mb-3">💧</div>
                <div className="text-xl font-bold text-text-primary mb-1">{wearableData.hydration}L</div>
                <div className="text-xs text-text-muted font-medium">Hydratation</div>
              </div>
              
              <div className="text-center p-3 rounded-xl bg-white bg-opacity-60 hover:bg-opacity-80 transition-all duration-200">
                <div className="text-3xl mb-3">🧘‍♂️</div>
                <div className="text-xl font-bold text-text-primary mb-1">{wearableData.stress}/5</div>
                <div className="text-xs text-text-muted font-medium">Stress</div>
              </div>
              
              <div className="text-center p-3 rounded-xl bg-white bg-opacity-60 hover:bg-opacity-80 transition-all duration-200">
                <div className="text-3xl mb-3">⚡</div>
                <div className="text-xl font-bold text-text-primary mb-1">{wearableData.energy}%</div>
                <div className="text-xs text-text-muted font-medium">Énergie</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Dernière sync: {wearableData ? new Date(wearableData.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
                <button 
                  onClick={() => window.location.reload()}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition"
                >
                  <span>🔄</span>
                  <span>Synchroniser</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Indicateur de chargement des données wearables */}
      {wearableLoading && !wearableData && (
        <div className="mb-8">
          <div className="card bg-background-accent border-primary-200">
            <div className="flex items-center justify-center space-x-4">
              <div className="loading-spinner w-8 h-8"></div>
              <span className="text-text-secondary font-medium">Synchronisation avec votre montre connectée...</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation rapide */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-6">
          Navigation Rapide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickNavButtons.map((button, index) => (
            <Link
              key={button.path}
              to={button.path}
              className="card-hover hover:border-primary-300 hover:shadow-soft group animate-slide-up"
              style={{animationDelay: `${index * 100}ms`}}
            >
              <div className="text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {button.icon}
                </div>
                <h3 className="font-semibold text-text-primary mb-3 group-hover:text-primary-600 transition-colors duration-200">
                  {button.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {button.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Informations détaillées sur les appareils connectés */}
      {deviceInfo.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            📱 Appareils Connectés
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deviceInfo.map((device, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">{device.deviceName}</h3>
                    <p className="text-sm text-gray-600">{device.deviceId}</p>
                    {device.firmwareVersion && (
                      <p className="text-xs text-gray-500">Version: {device.firmwareVersion}</p>
                    )}
                    {device.watchOSVersion && (
                      <p className="text-xs text-gray-500">watchOS: {device.watchOSVersion}</p>
                    )}
                  </div>
                  {device.batteryLevel && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-800">
                        🔋 {device.batteryLevel}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dernière mise à jour */}
      {stats?.lastUpdated && (
        <div className="text-center text-sm text-gray-500">
          Dernière mise à jour : {new Date(stats.lastUpdated).toLocaleString('fr-FR')}
          {dataSource === 'sdk' && connectedDevices.length > 0 && (
            <span className="ml-2 text-green-600">• Données en temps réel</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
