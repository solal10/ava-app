import React, { useState, useEffect } from 'react';
import userAPI from '../../api/userAPI';

const SmartAdvice = ({ user }) => {
  // État pour stocker les données de santé
  const [healthData, setHealthData] = useState({
    sleep: 0,
    stress: 0,
    hydration: 0,
    energy: 0,
    activity: 0
  });
  
  // États pour gérer les indicateurs UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [globalScore, setGlobalScore] = useState(0);
  
  // Information sur les métriques
  const metricsInfo = {
    sleep: {
      label: 'Sommeil',
      icon: '😴',
      highAdvice: 'Continuez à maintenir votre bon rythme de sommeil ! Un sommeil de qualité est essentiel pour votre santé globale.',
      mediumAdvice: 'Essayez de vous coucher à heures régulières et évitez les écrans 1h avant le coucher pour améliorer votre sommeil.',
      lowAdvice: 'Votre sommeil est insuffisant ! Priorité absolue : établissez une routine de sommeil stricte et consultez notre guide de sommeil réparateur.'
    },
    stress: {
      label: 'Stress',
      icon: '😓',
      highAdvice: 'Bravo pour votre excellente gestion du stress ! Continuez vos techniques de relaxation.',
      mediumAdvice: 'Prenez 10 minutes par jour pour pratiquer la respiration profonde ou la méditation pour réduire votre niveau de stress.',
      lowAdvice: 'Attention : votre niveau de stress est trop élevé ! Intégrez urgement des pauses de relaxation dans votre journée et consultez nos techniques anti-stress.'
    },
    hydration: {
      label: 'Hydratation',
      icon: '💧',
      highAdvice: 'Excellente hydratation ! Maintenez ce bon rythme de consommation d\'eau tout au long de la journée.',
      mediumAdvice: 'Pensez à boire un verre d\'eau toutes les heures pour améliorer votre hydratation quotidienne.',
      lowAdvice: 'Hydratation critique ! Objectif immédiat : boire au moins 2L d\'eau par jour et utiliser notre rappel d\'hydratation.'
    },
    energy: {
      label: 'Énergie',
      icon: '⚡',
      highAdvice: 'Votre niveau d\'énergie est excellent ! Continuez à maintenir votre équilibre activité-repos.',
      mediumAdvice: 'Pour booster votre énergie, essayez de faire une courte marche de 15 minutes après le déjeuner.',
      lowAdvice: 'Niveau d\'énergie préoccupant ! Revoyez votre alimentation, votre sommeil et intégrez des micro-pauses actives dans votre journée.'
    },
    activity: {
      label: 'Activité',
      icon: '🏃',
      highAdvice: 'Félicitations pour votre excellent niveau d\'activité physique ! Maintenez ce rythme.',
      mediumAdvice: 'Pour augmenter votre activité, essayez d\'ajouter une séance courte d\'exercices de 20 minutes 3 fois par semaine.',
      lowAdvice: 'Votre niveau d\'activité est trop bas ! Commencez par des marches quotidiennes de 30 minutes et consultez notre programme débutant.'
    }
  };

  // Charger les données de santé
  const fetchHealthData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Récupérer les données depuis l'API
      const response = await userAPI.getStats();
      
      // Extraire les métriques de santé
      const receivedData = response.data || {};
      
      // S'assurer que toutes les métriques existent avec des valeurs par défaut si nécessaire
      const healthMetrics = {
        sleep: receivedData.sleep || 0,
        stress: receivedData.stress || 0,
        hydration: receivedData.hydration || 0,
        energy: receivedData.energy || 0,
        activity: receivedData.activity || 0
      };
      
      // Calculer le score global
      calculateGlobalScore(healthMetrics);
      
      // Mettre à jour l'état
      setHealthData(healthMetrics);
    } catch (err) {
      console.error('Erreur lors du chargement des données de santé:', err);
      setError(err.message || 'Impossible de charger vos données de santé');
      
      // Essayer de récupérer depuis le localStorage comme fallback
      const storedData = localStorage.getItem('health_data');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setHealthData(parsedData);
          calculateGlobalScore(parsedData);
          setError('Utilisation des données locales (impossible de se connecter au serveur)');
        } catch (e) {
          console.error('Erreur lors de la lecture des données locales:', e);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculer le score global
  const calculateGlobalScore = (data) => {
    // Pour le stress, plus la valeur est basse, mieux c'est (inverser le score)
    const stressScore = 10 - data.stress;
    
    // Moyenne des scores (stress inversé)
    const averageScore = (data.sleep + stressScore + data.hydration + data.energy + data.activity) / 5;
    
    // Convertir en pourcentage
    const scorePercent = Math.round(averageScore * 10);
    
    // Sauvegarder dans le localStorage
    localStorage.setItem('health_score', scorePercent.toString());
    
    // Mettre à jour l'état
    setGlobalScore(scorePercent);
  };

  // Générer un conseil en fonction de la valeur
  const getAdviceForMetric = (metric, value) => {
    if (value >= 7) {
      return metricsInfo[metric].highAdvice;
    } else if (value >= 4) {
      return metricsInfo[metric].mediumAdvice;
    } else {
      return metricsInfo[metric].lowAdvice;
    }
  };

  // Déterminer la priorité du conseil
  const getAdvicePriority = (value) => {
    if (value <= 3) return 'high';
    if (value <= 6) return 'medium';
    return 'low';
  };

  // Effet au chargement initial
  useEffect(() => {
    if (user) {
      fetchHealthData();
    }
    
    // Vérifier s'il y a un score de santé enregistré
    const storedScore = localStorage.getItem('health_score');
    if (storedScore) {
      setGlobalScore(parseInt(storedScore, 10));
    }
  }, [user]);

  // Vérifier si tout est excellent (>7 partout)
  const isAllExcellent = Object.values(healthData).every(value => value > 7);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Recommandations Santé Intelligentes</h1>
      
      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div>
          {/* Score de santé global */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Score Santé Global</h2>
            <div className="flex items-center mb-2">
              <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
                <div 
                  className={`h-4 rounded-full ${
                    globalScore >= 70 ? 'bg-green-500' : globalScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} 
                  style={{ width: `${globalScore}%` }}
                ></div>
              </div>
              <span className="text-lg font-bold">{globalScore}%</span>
            </div>
            <p className="text-gray-500 text-sm">
              Ce score représente votre état de santé global basé sur vos indicateurs.
            </p>
          </div>
          
          {/* Message de félicitations si tout est excellent */}
          {isAllExcellent && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <div className="flex">
                <div className="py-1">
                  <span className="text-3xl mr-2">🎉</span>
                </div>
                <div>
                  <p className="font-bold">Félicitations !</p>
                  <p className="text-sm">
                    Tous vos indicateurs sont excellents. Continuez ce superbe travail !
                    Votre régularité et votre discipline portent leurs fruits.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Recommandations par métrique */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Conseils personnalisés</h2>
            
            {Object.keys(healthData).map(metric => {
              const value = healthData[metric];
              const priority = getAdvicePriority(value);
              const advice = getAdviceForMetric(metric, value);
              
              return (
                <div 
                  key={metric} 
                  className={`mb-4 p-4 rounded-lg ${
                    priority === 'high' ? 'bg-red-100' : 
                    priority === 'medium' ? 'bg-yellow-100' : 
                    'bg-green-100'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{metricsInfo[metric].icon}</span>
                    <h3 className="text-lg font-medium">{metricsInfo[metric].label}</h3>
                    <span className={`ml-auto font-bold ${
                      value <= 3 ? 'text-red-600' : 
                      value <= 6 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {value}/10
                    </span>
                  </div>
                  <p>{advice}</p>
                </div>
              );
            })}
            
            {/* Bouton de rafraîchissement */}
            <button
              onClick={fetchHealthData}
              disabled={refreshing}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 mt-4"
            >
              {refreshing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Rafraîchissement...
                </span>
              ) : 'Recharger les conseils'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAdvice;
