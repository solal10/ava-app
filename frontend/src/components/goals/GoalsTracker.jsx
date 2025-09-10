import React, { useState, useEffect } from 'react';
import userAPI from '../../api/userAPI';
import { Link } from 'react-router-dom';
import healthSDK from '../../sdk/index.js';

// Composant GoalIndicator pour afficher l'indicateur visuel
const GoalIndicator = ({ currentValue, goalValue, type = 'standard', size = 'md' }) => {
  // Déterminer le statut (atteint, proche, loin)
  const getStatus = () => {
    // Pour les métriques où un objectif bas est meilleur (comme le stress)
    if (type === 'inverse') {
      if (currentValue <= goalValue) return 'atteint';
      if (currentValue <= goalValue + 2) return 'proche';
      return 'loin';
    }
    
    // Pour les métriques normales (plus c'est haut, mieux c'est)
    if (currentValue >= goalValue) return 'atteint';
    if (currentValue >= goalValue * 0.8) return 'proche';
    return 'loin';
  };

  const status = getStatus();
  
  // Classes Tailwind selon le statut
  const statusClasses = {
    atteint: 'bg-health-excellent',
    proche: 'bg-health-average',
    loin: 'bg-health-poor'
  };
  
  // Classes de taille
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <div className="flex items-center">
      <div className={`${statusClasses[status]} ${sizeClasses[size]} rounded-full mr-2`}></div>
      <span className="text-sm text-text-muted font-medium">
        {status === 'atteint' && 'Objectif atteint'}
        {status === 'proche' && 'Proche de l\'objectif'}
        {status === 'loin' && 'Loin de l\'objectif'}
      </span>
    </div>
  );
};

// Composant GoalCard pour afficher une carte d'objectif avec support IA
const GoalCard = ({ title, icon, currentValue, goalValue, unit, type = 'standard', aiGenerated = false }) => {
  const getStatus = () => {
    if (type === 'inverse') {
      if (currentValue <= goalValue) return 'atteint';
      if (currentValue <= goalValue + 2) return 'proche';
      return 'loin';
    }
    
    if (currentValue >= goalValue) return 'atteint';
    if (currentValue >= goalValue * 0.8) return 'proche';
    return 'loin';
  };

  const status = getStatus();
  const percentage = type === 'inverse' 
    ? Math.max(0, Math.min(100, ((goalValue + 2 - currentValue) / (goalValue + 2)) * 100))
    : Math.min(100, (currentValue / goalValue) * 100);

  const statusClasses = {
    atteint: aiGenerated ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' : 'bg-green-50 border-green-200',
    proche: aiGenerated ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300' : 'bg-yellow-50 border-yellow-200',
    loin: aiGenerated ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300' : 'bg-red-50 border-red-200'
  };

  const progressClasses = {
    atteint: aiGenerated ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-green-500',
    proche: aiGenerated ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-yellow-500',
    loin: aiGenerated ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-red-500'
  };

  return (
    <div className={`${statusClasses[status]} rounded-lg p-4 border relative overflow-hidden`}>
      {/* Indicateur IA en arrière-plan */}
      {aiGenerated && (
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 border border-blue-200">
            🤖 IA
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <span className="text-xl mr-2">{icon}</span>
          {title}
          {aiGenerated && (
            <span className="ml-2 text-xs text-blue-600">✨</span>
          )}
        </h3>
        <GoalIndicator currentValue={currentValue} goalValue={goalValue} type={type} size="sm" />
      </div>
      
      <div className="text-center mb-3">
        <div className="text-2xl font-bold text-gray-800">
          {typeof currentValue === 'number' && currentValue % 1 !== 0 
            ? currentValue.toFixed(1) 
            : currentValue}
          <span className="text-sm font-normal text-gray-600 ml-1">{unit}</span>
        </div>
        <div className="text-sm text-gray-600">
          Objectif: {typeof goalValue === 'number' && goalValue % 1 !== 0 ? goalValue.toFixed(1) : goalValue}{unit}
          {aiGenerated && (
            <span className="ml-1 text-xs text-blue-600">(Adaptatif)</span>
          )}
        </div>
      </div>
      
      {/* Barre de progression améliorée */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div 
          className={`${progressClasses[status]} rounded-full h-2.5 transition-all duration-500 ease-out`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        ></div>
      </div>
      
      {/* Pourcentage de progression */}
      <div className="text-center text-xs text-gray-500">
        {Math.round(percentage)}% {status === 'atteint' ? 'Atteint ✅' : 'Complété'}
      </div>
    </div>
  );
};

// Composant principal GoalsTracker avec IA
const GoalsTracker = ({ user }) => {
  const [goals, setGoals] = useState({});
  const [currentValues, setCurrentValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [goalsAchieved, setGoalsAchieved] = useState(0);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [goalHistory, setGoalHistory] = useState([]);
  const [personalizedInsights, setPersonalizedInsights] = useState('');
  const [adaptiveGoals, setAdaptiveGoals] = useState(false);

  // Générer des objectifs personnalisés avec l'IA
  const generateAIGoals = async (userProfile, healthData, chatHistory = []) => {
    try {
      console.log('🤖 Génération d\'objectifs IA personnalisés...');
      
      // Analyser le profil utilisateur et les données de santé
      const analysis = {
        age: userProfile?.age || 30,
        activityLevel: healthData?.metrics?.activity?.value || 5000,
        sleepPattern: healthData?.metrics?.sleep?.value || 7,
        stressLevel: healthData?.metrics?.stress?.value || 5,
        healthScore: healthData?.healthScore || 75,
        preferences: userProfile?.preferences || {},
        limitations: userProfile?.limitations || []
      };
      
      // Simuler l'analyse IA des discussions utilisateur
      const chatInsights = analyzeChatHistory(chatHistory);
      
      // Générer des objectifs adaptatifs
      const aiGeneratedGoals = {
        sommeil: calculateOptimalSleep(analysis, chatInsights),
        hydratation: calculateOptimalHydration(analysis, chatInsights),
        stress: calculateOptimalStress(analysis, chatInsights),
        activite: calculateOptimalActivity(analysis, chatInsights),
        energie: calculateOptimalEnergy(analysis, chatInsights),
        nutrition: calculateOptimalNutrition(analysis, chatInsights)
      };
      
      // Générer des recommandations personnalisées
      const recommendations = generatePersonalizedRecommendations(analysis, chatInsights, aiGeneratedGoals);
      
      return {
        goals: aiGeneratedGoals,
        recommendations,
        insights: chatInsights,
        lastUpdated: new Date().toISOString(),
        source: 'ai_generated'
      };
      
    } catch (error) {
      console.error('Erreur génération IA:', error);
      return null;
    }
  };
  
  // Analyser l'historique des discussions pour extraire les besoins
  const analyzeChatHistory = (chatHistory) => {
    // Simulation de l'analyse IA des conversations
    const insights = {
      mentionedGoals: [],
      healthConcerns: [],
      preferences: [],
      challenges: [],
      motivations: []
    };
    
    // Exemples de patterns détectés dans les conversations
    const patterns = [
      { keyword: 'dormir', category: 'sleep', priority: 'high' },
      { keyword: 'stress', category: 'stress', priority: 'high' },
      { keyword: 'fatigue', category: 'energy', priority: 'medium' },
      { keyword: 'sport', category: 'activity', priority: 'medium' },
      { keyword: 'eau', category: 'hydration', priority: 'low' }
    ];
    
    // Simuler l'extraction d'insights
    insights.mentionedGoals = ['améliorer sommeil', 'réduire stress', 'plus d\'énergie'];
    insights.healthConcerns = ['sommeil irrégulier', 'stress au travail'];
    insights.preferences = ['exercices courts', 'méditation'];
    insights.challenges = ['manque de temps', 'motivation variable'];
    insights.motivations = ['bien-être général', 'performance au travail'];
    
    return insights;
  };
  
  // Fonctions de calcul des objectifs optimaux
  const calculateOptimalSleep = (analysis, insights) => {
    let baseGoal = 8; // Objectif de base
    
    // Ajustements basés sur l'âge
    if (analysis.age < 25) baseGoal = 8.5;
    if (analysis.age > 50) baseGoal = 7.5;
    
    // Ajustements basés sur les insights du chat
    if (insights.healthConcerns.includes('sommeil irrégulier')) baseGoal += 0.5;
    if (insights.mentionedGoals.includes('améliorer sommeil')) baseGoal += 0.5;
    
    return Math.min(Math.max(baseGoal, 6), 10);
  };
  
  const calculateOptimalHydration = (analysis, insights) => {
    let baseGoal = 2.5; // Litres par jour
    
    // Ajustements basés sur l'activité
    if (analysis.activityLevel > 8000) baseGoal += 0.5;
    if (analysis.activityLevel > 12000) baseGoal += 1;
    
    return Math.min(Math.max(baseGoal, 1.5), 4);
  };
  
  const calculateOptimalStress = (analysis, insights) => {
    let baseGoal = 3; // Niveau de stress cible (sur 10)
    
    // Ajustements basés sur les préoccupations
    if (insights.healthConcerns.includes('stress au travail')) baseGoal = 2;
    if (insights.preferences.includes('méditation')) baseGoal = 2.5;
    
    return Math.min(Math.max(baseGoal, 1), 5);
  };
  
  const calculateOptimalActivity = (analysis, insights) => {
    let baseGoal = 60; // Minutes par jour
    
    // Ajustements basés sur les préférences
    if (insights.preferences.includes('exercices courts')) baseGoal = 30;
    if (insights.challenges.includes('manque de temps')) baseGoal = 45;
    if (insights.mentionedGoals.includes('plus d\'activité')) baseGoal = 90;
    
    return Math.min(Math.max(baseGoal, 20), 120);
  };
  
  const calculateOptimalEnergy = (analysis, insights) => {
    let baseGoal = 8; // Niveau d'énergie cible (sur 10)
    
    // Ajustements basés sur les besoins exprimés
    if (insights.mentionedGoals.includes('plus d\'énergie')) baseGoal = 9;
    if (insights.healthConcerns.includes('fatigue')) baseGoal = 8.5;
    
    return Math.min(Math.max(baseGoal, 6), 10);
  };
  
  const calculateOptimalNutrition = (analysis, insights) => {
    return {
      fruits: 3, // portions par jour
      legumes: 5,
      proteines: 2,
      cereales: 4
    };
  };
  
  // Générer des recommandations personnalisées
  const generatePersonalizedRecommendations = (analysis, insights, goals) => {
    const recommendations = [];
    
    // Recommandations basées sur les objectifs et insights
    if (insights.challenges.includes('manque de temps')) {
      recommendations.push({
        type: 'time_management',
        title: 'Optimisation du temps',
        message: 'Essayez des séances d\'exercice de 15 minutes le matin pour maximiser votre temps.',
        priority: 'high'
      });
    }
    
    if (insights.healthConcerns.includes('stress au travail')) {
      recommendations.push({
        type: 'stress_management',
        title: 'Gestion du stress',
        message: 'Intégrez 5 minutes de respiration profonde entre vos réunions.',
        priority: 'high'
      });
    }
    
    if (insights.preferences.includes('méditation')) {
      recommendations.push({
        type: 'mindfulness',
        title: 'Méditation guidée',
        message: 'Continuez votre pratique de méditation, elle aide à atteindre vos objectifs de stress.',
        priority: 'medium'
      });
    }
    
    return recommendations;
  };

  // Charger les données et générer les objectifs IA
  useEffect(() => {
    const loadDataAndGenerateGoals = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger les données de santé actuelles
        const healthData = await userAPI.getStats();
        
        // Charger le profil utilisateur
        const userProfile = await userAPI.getProfile();
        
        // Charger l'historique des conversations (simulé)
        const chatHistory = JSON.parse(localStorage.getItem('chat_history')) || [];
        
        // Générer les objectifs avec l'IA
        const aiGoalsData = await generateAIGoals(userProfile, healthData, chatHistory);
        
        if (aiGoalsData) {
          setGoals(aiGoalsData.goals);
          setAiRecommendations(aiGoalsData.recommendations);
          setPersonalizedInsights(aiGoalsData.insights);
          setAdaptiveGoals(true);
          
          // Sauvegarder les objectifs générés
          localStorage.setItem('ai_generated_goals', JSON.stringify(aiGoalsData));
          
          console.log('✅ Objectifs IA générés:', aiGoalsData);
        } else {
          // Fallback vers objectifs par défaut
          const defaultGoals = {
            sommeil: 8,
            hydratation: 2.5,
            stress: 3,
            activite: 60,
            energie: 8,
            nutrition: { fruits: 3, legumes: 5, proteines: 2, cereales: 4 }
          };
          setGoals(defaultGoals);
        }
        
        // Charger les valeurs actuelles depuis les métriques
        if (healthData?.metrics) {
          const current = {
            sommeil: healthData.metrics.sleep?.value || 0,
            hydratation: healthData.metrics.hydration?.value || 0,
            stress: healthData.metrics.stress?.value || 0,
            activite: healthData.metrics.activity?.value || 0,
            energie: healthData.metrics.energy?.value || 0
          };
          setCurrentValues(current);
        }

      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError("Impossible de charger vos données. Utilisation des objectifs par défaut.");
        
        // Objectifs de secours
        setGoals({
          sommeil: 8,
          hydratation: 2.5,
          stress: 3,
          activite: 60,
          energie: 8
        });
      } finally {
        setLoading(false);
      }
    };

    loadDataAndGenerateGoals();
  }, []);

  // Calculer le nombre d'objectifs atteints
  useEffect(() => {
    let achieved = 0;

    // Sommeil
    if (currentValues.sommeil >= goals.sommeil) achieved++;
    
    // Hydratation
    if (currentValues.hydratation >= goals.hydratation) achieved++;
    
    // Stress (inverse: plus bas est mieux)
    if (currentValues.stress <= goals.stress) achieved++;
    
    // Activité physique
    if (currentValues.activite >= goals.activite) achieved++;
    
    // Énergie
    if (currentValues.energie >= goals.energie) achieved++;

    setGoalsAchieved(achieved);
  }, [currentValues, goals]);

  // Si en cours de chargement, afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center">
            🎯 Objectifs Personnalisés
            {adaptiveGoals && (
              <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700 font-medium">
                🤖 IA Adaptée
              </span>
            )}
          </h1>
          <p className="text-lg text-text-secondary mt-2">
            Objectifs générés automatiquement selon vos besoins et discussions
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-secondary flex items-center gap-2 hover:scale-105 transition-all"
        >
          🔄 Actualiser IA
        </button>
      </div>
      
      {/* Score global amélioré */}
      <div className="card-hover bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 mb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Score du jour</h2>
          {adaptiveGoals && (
            <span className="text-sm text-primary-600 font-medium bg-primary-200 px-3 py-1 rounded-full">
              ✨ Objectifs adaptatifs
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <div className="text-5xl font-bold text-primary-600 mr-4">{goalsAchieved}/{Object.keys(goals).length}</div>
          <div className="text-text-secondary font-medium">objectifs atteints</div>
        </div>
        
        {/* Barre de progression améliorée */}
        <div className="w-full bg-background-accent rounded-full h-4 mb-3">
          <div 
            className={`h-4 rounded-full transition-all duration-500 ${
              goalsAchieved >= Object.keys(goals).length * 0.8 ? 'bg-gradient-to-r from-health-excellent to-health-excellent' : 
              goalsAchieved >= Object.keys(goals).length * 0.6 ? 'bg-gradient-to-r from-health-average to-health-average' : 
              'bg-gradient-to-r from-health-poor to-health-poor'
            }`}
            style={{ width: `${Math.max((goalsAchieved / Math.max(Object.keys(goals).length, 1)) * 100, 5)}%` }}
          ></div>
        </div>
        
        <div className="text-center text-sm text-gray-600">
          {goalsAchieved === Object.keys(goals).length ? 
            '🎉 Félicitations ! Tous vos objectifs sont atteints !' :
            `Encore ${Object.keys(goals).length - goalsAchieved} objectif(s) à atteindre`
          }
        </div>
      </div>
      
      {/* Insights personnalisés IA */}
      {personalizedInsights && Object.keys(personalizedInsights).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            🧠 Insights IA Personnalisés
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personalizedInsights.mentionedGoals?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">🎯 Objectifs mentionnés</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {personalizedInsights.mentionedGoals.map((goal, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {personalizedInsights.healthConcerns?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">⚠️ Préoccupations santé</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {personalizedInsights.healthConcerns.map((concern, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Recommandations IA personnalisées */}
      {aiRecommendations.length > 0 && (
        <div className="card-hover bg-gradient-to-br from-health-excellent/10 to-primary-50 border-2 border-health-excellent/30 mb-8 animate-slide-up" style={{animationDelay: '200ms'}}>
          <h3 className="text-xl font-semibold text-text-primary mb-6 flex items-center">
            💡 Recommandations IA Personnalisées
          </h3>
          <div className="space-y-4">
            {aiRecommendations.map((rec, index) => (
              <div key={index} className={`p-5 rounded-2xl border-l-4 transition-all hover:scale-[1.02] ${
                rec.priority === 'high' ? 'metric-poor border-l-health-poor' :
                rec.priority === 'medium' ? 'metric-average border-l-health-average' :
                'metric-good border-l-health-good'
              }`}>
                <div className="flex items-start">
                  <div className={`w-4 h-4 rounded-full mt-1 mr-4 ${
                    rec.priority === 'high' ? 'bg-health-poor' :
                    rec.priority === 'medium' ? 'bg-health-average' :
                    'bg-health-good'
                  }`}></div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">{rec.title}</h4>
                    <p className="text-sm text-text-secondary leading-relaxed">{rec.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div className="card metric-poor border-2 mb-6">
          <p className="text-text-primary font-medium">{error}</p>
        </div>
      )}
      
      {/* Affichage des objectifs adaptatifs */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          📊 Vos Objectifs Adaptatifs
          {adaptiveGoals && (
            <span className="ml-2 text-sm text-green-600">• Mis à jour automatiquement</span>
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Objectifs principaux */}
          {goals.sommeil && (
            <GoalCard 
              title="Sommeil" 
              icon="😴" 
              currentValue={currentValues.sommeil || 0} 
              goalValue={goals.sommeil} 
              unit="h" 
              aiGenerated={adaptiveGoals}
            />
          )}
          
          {goals.hydratation && (
            <GoalCard 
              title="Hydratation" 
              icon="💧" 
              currentValue={currentValues.hydratation || 0} 
              goalValue={goals.hydratation} 
              unit="L" 
              aiGenerated={adaptiveGoals}
            />
          )}
          
          {goals.stress && (
            <GoalCard 
              title="Stress" 
              icon="🧘" 
              currentValue={currentValues.stress || 0} 
              goalValue={goals.stress} 
              unit="/10" 
              type="inverse"
              aiGenerated={adaptiveGoals}
            />
          )}
          
          {goals.activite && (
            <GoalCard 
              title="Activité" 
              icon="🏃" 
              currentValue={currentValues.activite || 0} 
              goalValue={goals.activite} 
              unit="min" 
              aiGenerated={adaptiveGoals}
            />
          )}
          
          {goals.energie && (
            <GoalCard 
              title="Énergie" 
              icon="⚡" 
              currentValue={currentValues.energie || 0} 
              goalValue={goals.energie} 
              unit="/10" 
              aiGenerated={adaptiveGoals}
            />
          )}
          
          {/* Objectif nutrition si disponible */}
          {goals.nutrition && (
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  🥗 Nutrition
                  {adaptiveGoals && (
                    <span className="ml-2 text-xs text-blue-600">IA</span>
                  )}
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>🍎 Fruits:</span>
                  <span className="font-medium">{goals.nutrition.fruits} portions/jour</span>
                </div>
                <div className="flex justify-between">
                  <span>🥬 Légumes:</span>
                  <span className="font-medium">{goals.nutrition.legumes} portions/jour</span>
                </div>
                <div className="flex justify-between">
                  <span>🥩 Protéines:</span>
                  <span className="font-medium">{goals.nutrition.proteines} portions/jour</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Section de conseils */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center">
          <span className="mr-2">💡</span> Conseils pour atteindre vos objectifs
        </h3>
        <ul className="list-disc pl-6 text-blue-700">
          {currentValues.sommeil < goals.sommeil && (
            <li>Essayez de vous coucher 15 minutes plus tôt chaque soir pour atteindre votre objectif de sommeil.</li>
          )}
          {currentValues.hydratation < goals.hydratation && (
            <li>Gardez une bouteille d'eau à portée de main et fixez des rappels pour boire régulièrement.</li>
          )}
          {currentValues.stress > goals.stress && (
            <li>Pratiquez 5 minutes de respiration profonde ou de méditation pour réduire votre niveau de stress.</li>
          )}
          {currentValues.activite < goals.activite && (
            <li>Même de courtes périodes d'activité comptent. Essayez de marcher pendant vos appels téléphoniques.</li>
          )}
          {currentValues.energie < goals.energie && (
            <li>Vérifiez votre alimentation et hydratation - ils sont directement liés à votre niveau d'énergie.</li>
          )}
          {goalsAchieved === 5 && (
            <li>Félicitations ! Vous avez atteint tous vos objectifs aujourd'hui. Continuez comme ça !</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default GoalsTracker;
