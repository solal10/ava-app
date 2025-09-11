import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { healthAPI, mealAPI } from '../../utils/api';
import { useSubscription } from '../../contexts/SubscriptionContext';
import garminBridge from '../../sdk/garminBridge';
import config from '../../config/env';

// Composant CircularScoreGauge
const CircularScoreGauge = ({ score, size = 120 }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(51 65 85)"
          strokeWidth="8"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(34 197 94)"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-100">{score}</span>
        <span className="text-xs text-slate-400">Score</span>
      </div>
    </div>
  );
};

// Composant HealthChart
const HealthChart = ({ data }) => {
  const maxValue = Math.max(...data.sleep, ...data.energy, ...data.stress);
  const days = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];
  
  const getPath = (values, color) => {
    if (values.length === 0) return '';
    
    const points = values.map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 280;
      const y = 120 - (value / Math.max(maxValue, 1)) * 100;
      return `${x},${y}`;
    }).join(' ');
    
    return `M${points}`;
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Health Trends</h3>
      
      <div className="relative">
        <svg width="300" height="140" className="w-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(value => (
            <line
              key={value}
              x1="0"
              y1={120 - (value / maxValue) * 100}
              x2="280"
              y2={120 - (value / maxValue) * 100}
              stroke="rgb(51 65 85)"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          
          {/* Sleep line */}
          <path
            d={getPath(data.sleep)}
            fill="none"
            stroke="rgb(34 197 94)"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Energy line */}
          <path
            d={getPath(data.energy)}
            fill="none"
            stroke="rgb(59 130 246)"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Stress line */}
          <path
            d={getPath(data.stress)}
            fill="none"
            stroke="rgb(239 68 68)"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {data.sleep.map((value, index) => (
            <circle
              key={`sleep-${index}`}
              cx={(index / Math.max(data.sleep.length - 1, 1)) * 280}
              cy={120 - (value / maxValue) * 100}
              r="3"
              fill="rgb(34 197 94)"
              className="drop-shadow-sm"
            />
          ))}
          
          {data.energy.map((value, index) => (
            <circle
              key={`energy-${index}`}
              cx={(index / Math.max(data.energy.length - 1, 1)) * 280}
              cy={120 - (value / maxValue) * 100}
              r="3"
              fill="rgb(59 130 246)"
              className="drop-shadow-sm"
            />
          ))}
          
          {data.stress.map((value, index) => (
            <circle
              key={`stress-${index}`}
              cx={(index / Math.max(data.stress.length - 1, 1)) * 280}
              cy={120 - (value / maxValue) * 100}
              r="3"
              fill="rgb(239 68 68)"
              className="drop-shadow-sm"
            />
          ))}
        </svg>
        
        {/* Days labels */}
        <div className="flex justify-between mt-2 px-2">
          {days.slice(0, data.sleep.length).map((day, index) => (
            <span key={index} className="text-xs text-slate-400">{day}</span>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-slate-300">Sleep</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-slate-300">Energy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-slate-300">Stress</span>
        </div>
      </div>
    </div>
  );
};

// Composant IAInsightCard
const IAInsightCard = ({ insight }) => {
  if (!insight) return null;

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-2xl p-6 border border-purple-500/20">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🤖</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-purple-200 mb-2">AI Insight</h3>
          <p className="text-slate-300 leading-relaxed">{insight}</p>
        </div>
      </div>
    </div>
  );
};

// Composant GoalCard
const GoalCard = ({ goal }) => {
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'text-green-500';
    if (progress >= 75) return 'text-blue-500';
    if (progress >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressBgColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600 hover:border-slate-500 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{goal.icon}</span>
          <h3 className="text-lg font-semibold text-slate-100">{goal.title}</h3>
        </div>
        <span className={`text-2xl font-bold ${getProgressColor(goal.progress)}`}>
          {Math.round(goal.progress)}%
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getProgressBgColor(goal.progress)} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(100, goal.progress)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Current: {goal.current}</span>
          <span className="text-slate-400">Target: {goal.target}</span>
        </div>
      </div>
    </div>
  );
};

// Composant MealCard
const MealCard = ({ meal }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-600 hover:border-slate-500 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🍽️</span>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-100">{meal.name || 'Repas'}</h4>
          <p className="text-sm text-slate-400">{formatTime(meal.date)}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">{meal.calories || 0}</div>
          <div className="text-slate-400">cal</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">{meal.protein || 0}g</div>
          <div className="text-slate-400">protein</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">{meal.carbs || 0}g</div>
          <div className="text-slate-400">carbs</div>
        </div>
      </div>
    </div>
  );
};

// Composant principal DashboardV2
const DashboardV2 = () => {
  const { currentPlan } = useSubscription();
  const [healthData, setHealthData] = useState({ sleep: [], energy: [], stress: [] });
  const [healthDataState, setHealthDataState] = useState(null);
  const [todayMeals, setTodayMeals] = useState([]);
  const [mealData, setMealData] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiMessage, setAIMessage] = useState('Welcome to your health dashboard');
  const [userName] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.name || 'User';
  });
  const [garminStatus, setGarminStatus] = useState({ 
    isConnected: false, 
    loading: false 
  });

  // Vérifier le statut de connexion Garmin
  const checkGarminStatus = () => {
    console.log('🔍 Vérification statut Garmin...');
    const accessToken = localStorage.getItem('garmin_access_token');
    const tokenExpires = localStorage.getItem('garmin_token_expires');
    
    const hasValidToken = accessToken && tokenExpires && Date.now() < parseInt(tokenExpires);
    
    console.log('🔑 Token présent:', !!accessToken);
    console.log('⏰ Token valide:', hasValidToken);
    
    setGarminStatus({ isConnected: hasValidToken, loading: false });
    return hasValidToken;
  };

  // Connecter à Garmin
  const connectGarmin = async () => {
    try {
      console.log('🔗 Connexion Garmin initiée...');
      setGarminStatus(prev => ({ ...prev, loading: true }));
      
      // Rediriger vers l'endpoint de connexion Garmin
      const authUrl = `${config.API_URL}/api/garmin/login`;
      console.log('🎯 Redirection vers:', authUrl);
      
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('❌ Erreur connexion Garmin:', error);
      setGarminStatus(prev => ({ ...prev, loading: false }));
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  // Synchroniser les données Garmin en temps réel
  const syncGarminData = async () => {
    const accessToken = localStorage.getItem('garmin_access_token');
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    
    if (!accessToken || !userId) {
      console.error('❌ Token ou userId manquant pour sync Garmin');
      return;
    }
    
    try {
      console.log('🔄 Synchronisation Garmin en cours...');
      
      const response = await fetch('http://localhost:5003/api/garmin/health-data?userId=' + userId, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Données Garmin synchronisées:', result.data);
        
        // Mettre à jour les données de santé
        setHealthData({
          sleep: result.data.history.map(h => h.sleepQuality),
          energy: result.data.history.map(h => h.energyLevel),
          stress: result.data.history.map(h => h.stressLevel)
        });
        
        // Mettre à jour les goals avec les vraies données
        setGoals([
          { id: 1, title: 'Steps Today', icon: '🚶', progress: Math.min(100, (result.data.current.steps / 10000) * 100), current: result.data.current.steps, target: 10000 },
          { id: 2, title: 'Calories', icon: '🔥', progress: Math.min(100, (result.data.current.calories / 2000) * 100), current: result.data.current.calories, target: 2000 },
          { id: 3, title: 'Body Battery', icon: '⚡', progress: result.data.current.bodyBattery, current: result.data.current.bodyBattery, target: 100 },
          { id: 4, title: 'Sleep Quality', icon: '😴', progress: result.data.health.sleepQuality, current: result.data.health.sleepQuality, target: 100 }
        ]);
        
        // Afficher notification de succès
        alert(`✅ Synchronisation réussie!\n\nPas: ${result.data.current.steps}\nCalories: ${result.data.current.calories}\nScore santé: ${result.data.healthScore}/100`);
        
      } else {
        console.error('❌ Erreur sync Garmin:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Erreur sync Garmin:', error);
    }
  };

  // Déconnecter Garmin et effacer le cache
  const disconnectGarmin = () => {
    console.log('🚫 Déconnexion Garmin demandée');
    
    // Effacer TOUT le cache Garmin (y compris simulation)
    localStorage.removeItem('garmin_access_token');
    localStorage.removeItem('garmin_refresh_token');
    localStorage.removeItem('garmin_token_expires');
    localStorage.removeItem('garmin_tokens'); // Cache de simulation
    
    console.log('🧹 Cache Garmin complètement effacé');
    
    // Mettre à jour le statut
    setGarminStatus({ isConnected: false, loading: false });
    
    alert('🚫 Déconnecté de Garmin. Vous pouvez maintenant vous reconnecter.');
  };

  // Charger les données de santé
  const loadHealthData = async () => {
    try {
      console.log('🔄 Chargement des VRAIES données de santé...');
      const response = await healthAPI.getHealthData();
      
      if (response && response.data) {
        console.log('✅ Vraies données de santé reçues:', response.data);
        setHealthData(response.data);
        setHealthDataState(response.data);
      } else if (response.sleep && response.energy && response.stress) {
        console.log('✅ Données de santé format direct reçues');
        setHealthData(response);
        setHealthDataState(response);
      } else {
        console.warn('⚠️ Données de santé invalides:', response);
        setError('Format de données de santé invalide');
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des données de santé:', err);
      setError('Impossible de charger les données de santé');
    }
  };

  // Charger les données de repas
  const loadMealData = async () => {
    try {
      console.log('🔄 Chargement des VRAIS repas...');
      const response = await mealAPI.getMeals();
      
      if (Array.isArray(response)) {
        console.log('✅ Vrais repas reçus:', response);
        setTodayMeals(response);
        setMealData(response);
      } else if (response.data && Array.isArray(response.data)) {
        console.log('✅ Vrais repas reçus (format data):', response.data);
        setTodayMeals(response.data);
        setMealData(response.data);
      } else {
        console.warn('⚠️ Aucun repas trouvé, initialisation vide');
        setTodayMeals([]);
        setMealData([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des repas:', err);
      setError('Impossible de charger les données des repas');
      setTodayMeals([]);
      setLoading(false);
    }
  };

  // Charger les objectifs par défaut
  const loadDefaultGoals = () => {
    setGoals([
      { id: 1, title: 'Daily Steps', icon: '🚶', progress: 65, current: 6500, target: 10000 },
      { id: 2, title: 'Calories Burned', icon: '🔥', progress: 80, current: 1600, target: 2000 },
      { id: 3, title: 'Water Intake', icon: '💧', progress: 50, current: 4, target: 8 },
      { id: 4, title: 'Sleep Hours', icon: '😴', progress: 87, current: 7, target: 8 }
    ]);
  };

  // Calculer le score de santé global
  const calculateHealthScore = () => {
    if (!healthData || !healthData.sleep || healthData.sleep.length === 0) {
      return 75; // Score par défaut
    }

    const latestSleep = healthData.sleep[healthData.sleep.length - 1] || 75;
    const latestEnergy = healthData.energy[healthData.energy.length - 1] || 75;
    const latestStress = 100 - (healthData.stress[healthData.stress.length - 1] || 25); // Inverser stress

    return Math.round((latestSleep + latestEnergy + latestStress) / 3);
  };

  // Effect de chargement initial
  useEffect(() => {
    const initDashboard = async () => {
      console.log('🚀 Initialisation dashboard...');
      
      // Vérifier le statut Garmin
      checkGarminStatus();
      
      // Charger les données en parallèle
      await Promise.all([
        loadHealthData(),
        loadMealData()
      ]);
      
      // Charger les objectifs par défaut si pas de données Garmin
      loadDefaultGoals();
    };

    initDashboard();
    
    // Message IA rotatif
    const interval = setInterval(() => {
      const messages = [
        'Your health journey is looking great! Keep it up.',
        'Remember to stay hydrated throughout the day.',
        'Consider taking a short walk to boost your energy.',
        'Quality sleep is the foundation of good health.',
        'You\'re making excellent progress on your wellness goals!'
      ];
      setAIMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Fonction helper pour les salutations
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-100">
            {getGreeting()}, {userName}
          </h1>
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 border border-slate-600">
            <p className="text-slate-300 leading-relaxed">{aiMessage}</p>
          </div>
        </div>

        {/* Garmin Connection Section */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-6 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">⌚</div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Garmin Connect</h2>
                <p className="text-slate-300">
                  {garminStatus.isConnected 
                    ? '🟢 Connected - Real-time data sync enabled' 
                    : '🔴 Not connected - Connect for real-time health data'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {!garminStatus.isConnected ? (
                <button
                  onClick={connectGarmin}
                  disabled={garminStatus.loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {garminStatus.loading ? 'Connecting...' : 'Connect Garmin'}
                </button>
              ) : (
                <>
                  <button
                    onClick={syncGarminData}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    🔄 Sync Data
                  </button>
                  <button
                    onClick={disconnectGarmin}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column - Health Score */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600 text-center">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Health Score</h2>
              <CircularScoreGauge score={calculateHealthScore()} size={140} />
              <p className="text-slate-400 mt-4 text-sm">
                Based on your recent activity, sleep, and wellness metrics
              </p>
            </div>

            <IAInsightCard insight="Great progress this week! Your sleep quality has improved by 15%. Keep maintaining your evening routine." />
          </div>

          {/* Middle Column - Health Chart */}
          <div className="lg:col-span-2">
            <HealthChart data={healthData} />
          </div>

          {/* Right Column - Quick Stats */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-600">
              <h3 className="text-lg font-semibold text-slate-100 mb-3">Today</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Steps</span>
                  <span className="text-slate-100 font-medium">8,542</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Calories</span>
                  <span className="text-slate-100 font-medium">1,847</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Water</span>
                  <span className="text-slate-100 font-medium">6 glasses</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Sleep</span>
                  <span className="text-slate-100 font-medium">7h 23m</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-600">
              <h3 className="text-lg font-semibold text-slate-100 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  to="/health"
                  className="block w-full text-left p-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  📊 Log Health Data
                </Link>
                <Link
                  to="/meal-photo"
                  className="block w-full text-left p-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  📷 Add Meal
                </Link>
                <Link
                  to="/chat"
                  className="block w-full text-left p-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  🤖 AI Coach
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-100">Daily Goals</h2>
            <span className="text-slate-400 text-sm">Real-time updates from your devices</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {goals.map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>

        {/* Meals Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-100">Today's Meals</h2>
            <Link 
              to="/meal-photo" 
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Add meal →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayMeals.map(meal => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardV2;