import React, { useState, useEffect } from 'react';
import workoutAPI, { WORKOUT_TYPES, INTENSITY_LEVELS } from '../../api/workoutAPI';
import userAPI from '../../api/userAPI';

const WorkoutPlanner = ({ user }) => {
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [userGoals, setUserGoals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);

  // Charger le programme et les objectifs au montage
  useEffect(() => {
    const loadWorkoutData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger le programme et les objectifs en parallèle
        const [planResponse, goalsResponse] = await Promise.all([
          workoutAPI.getCurrentWorkoutPlan(),
          userAPI.getGoals()
        ]);

        // Vérification et assignation sécurisée des données
        if (planResponse && typeof planResponse === 'object') {
          setWorkoutPlan(planResponse);
        }
        
        if (goalsResponse) {
          // Gestion flexible de la structure des objectifs
          const goals = goalsResponse.goals || goalsResponse;
          if (goals && typeof goals === 'object') {
            setUserGoals(goals);
          }
        }

      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger le programme d\'entraînement');
      } finally {
        setLoading(false);
      }
    };

    loadWorkoutData();
  }, []);

  // Fonction pour régénérer le plan
  const handleRegeneratePlan = async () => {
    try {
      setRegenerating(true);
      setError(null);

      const userProfile = {
        age: user?.age || 30,
        weight: user?.weight || 70,
        height: user?.height || 175,
        fitnessLevel: user?.fitnessLevel || 'intermediate'
      };

      const newPlan = await workoutAPI.generateWorkoutPlan(userProfile, userGoals);
      setWorkoutPlan(newPlan);

      // Sauvegarder le nouveau plan
      await workoutAPI.saveWorkoutPlan(newPlan);

    } catch (err) {
      console.error('Erreur lors de la régénération:', err);
      setError('Impossible de régénérer le programme');
    } finally {
      setRegenerating(false);
    }
  };

  // Fonction pour obtenir les classes CSS selon l'intensité
  const getIntensityClasses = (intensity) => {
    const intensityConfig = INTENSITY_LEVELS[intensity] || INTENSITY_LEVELS.moderate;
    return {
      bg: intensityConfig.bgColor,
      text: intensityConfig.textColor,
      border: intensityConfig.borderColor
    };
  };

  // Fonction pour obtenir les informations du type d'entraînement
  const getWorkoutTypeInfo = (type) => {
    return WORKOUT_TYPES[type] || WORKOUT_TYPES.cardio;
  };

  if (loading) {
    return (
      <div className="container-app py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="loading-spinner w-12 h-12"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-app py-8">
        <div className="card metric-poor border-2">
          <p className="font-bold text-text-primary mb-2">Erreur</p>
          <p className="text-text-secondary mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-health-poor"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-6 animate-fade-in">
      {/* En-tête avec objectifs santé */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              📅 Programme d'Entraînement
            </h1>
            <p className="text-lg text-text-secondary">
              Votre programme personnalisé pour atteindre vos objectifs
            </p>
          </div>
          
          <button
            onClick={handleRegeneratePlan}
            disabled={regenerating}
            className={`mt-4 md:mt-0 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${
              regenerating
                ? 'bg-background-accent text-text-muted cursor-not-allowed'
                : 'btn-primary hover:shadow-soft'
            }`}
          >
            {regenerating ? (
              <>
                <span className="animate-spin inline-block mr-2">⟳</span>
                Génération...
              </>
            ) : (
              <>
                🔄 Régénérer le plan
              </>
            )}
          </button>
        </div>

        {/* Objectifs santé liés */}
        {userGoals && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🎯 Vos Objectifs Santé</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userGoals.weight || 68}kg</div>
                <div className="text-sm text-gray-600">Poids cible</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userGoals.steps || 10000}</div>
                <div className="text-sm text-gray-600">Pas/jour</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{userGoals.calories || 2000}</div>
                <div className="text-sm text-gray-600">Calories/jour</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{userGoals.exercise || 30}min</div>
                <div className="text-sm text-gray-600">Sport/jour</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Résumé du programme */}
      {workoutPlan && (
        <div className="mb-8">
          <div className="grid-responsive gap-6">
            <div className="card-hover text-center animate-slide-up" style={{animationDelay: '0ms'}}>
              <div className="text-4xl font-bold text-primary-600 mb-2">{workoutPlan.totalDuration}</div>
              <div className="text-sm text-text-muted font-medium">Minutes/semaine</div>
            </div>
            <div className="card-hover text-center animate-slide-up" style={{animationDelay: '100ms'}}>
              <div className="text-4xl font-bold text-health-excellent mb-2">{workoutPlan.totalCalories}</div>
              <div className="text-sm text-text-muted font-medium">Calories brûlées</div>
            </div>
            <div className="card-hover text-center animate-slide-up" style={{animationDelay: '200ms'}}>
              <div className="text-4xl font-bold text-health-good mb-2">{workoutPlan.planType || 'Équilibré'}</div>
              <div className="text-sm text-text-muted font-medium">Type de programme</div>
            </div>
          </div>
        </div>
      )}

      {/* Programme hebdomadaire - Cartes par jour */}
      {workoutPlan?.plan && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-6">📋 Programme de la Semaine</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {workoutPlan.plan.map((dayPlan, index) => {
              const workoutType = getWorkoutTypeInfo(dayPlan.type);
              const intensityClasses = getIntensityClasses(dayPlan.intensity);
              const intensityInfo = INTENSITY_LEVELS[dayPlan.intensity];

              return (
                <div
                  key={index}
                  className={`card-hover border-2 ${intensityClasses.border} hover:shadow-soft transition-all duration-300 overflow-hidden animate-slide-up`}
                  style={{animationDelay: `${index * 100}ms`}}
                >
                  {/* En-tête de la carte */}
                  <div className={`${intensityClasses.bg} px-6 py-4`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-lg ${intensityClasses.text}`}>
                        {dayPlan.day}
                      </h3>
                      <span className="text-3xl">{workoutType.icon}</span>
                    </div>
                  </div>

                  {/* Contenu de la carte */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="font-semibold text-xl text-gray-800 mb-2">
                        {workoutType.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {workoutType.description}
                      </p>
                    </div>

                    {/* Détails de l'entraînement */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Durée:</span>
                        <span className="font-semibold text-gray-800">{dayPlan.duration} min</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Intensité:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${intensityClasses.bg} ${intensityClasses.text}`}>
                          {intensityInfo.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Calories:</span>
                        <span className="font-semibold text-orange-600">{dayPlan.calories} kcal</span>
                      </div>
                    </div>

                    {/* Objectifs */}
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-600 mb-2">Objectifs:</h5>
                      <div className="flex flex-wrap gap-1">
                        {dayPlan.objectives.map((objective, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {objective}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Exercices */}
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-600 mb-2">Exercices:</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {dayPlan.exercises.slice(0, 3).map((exercise, idx) => (
                          <li key={idx} className="flex items-center">
                            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                            {exercise}
                          </li>
                        ))}
                        {dayPlan.exercises.length > 3 && (
                          <li className="text-xs text-gray-500 italic">
                            +{dayPlan.exercises.length - 3} autres exercices
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Répartition hebdomadaire */}
      {workoutPlan?.weeklyGoals && (
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Répartition Hebdomadaire</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(workoutPlan.weeklyGoals).map(([type, count]) => {
              const workoutType = getWorkoutTypeInfo(type);
              return (
                <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-1">{workoutType.icon}</div>
                  <div className="text-sm font-medium text-gray-700">{workoutType.name}</div>
                  <div className="text-lg font-bold text-blue-600">{count}x</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutPlanner;
