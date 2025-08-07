import React, { useState, useEffect } from 'react';
import SectionCard, { MetricCard, StatCard } from '../layout/SectionCard';

// Composant WorkoutCard modernisé
const WorkoutCard = ({ workout, isToday, onStart, onComplete }) => {
  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 'Faible': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
      case 'Modérée': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
      case 'Élevée': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
      default: return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      'Cardio': '🏃‍♂️',
      'Musculation': '💪',
      'Flexibilité': '🧘‍♀️',
      'Récupération': '😌',
      'HIIT': '⚡',
      'Natation': '🏊‍♂️',
      'Cyclisme': '🚴‍♂️',
      'Repos': '💤'
    };
    return icons[type] || '🏋️‍♂️';
  };

  const intensity = getIntensityColor(workout.intensity);

  return (
    <SectionCard
      title={workout.day}
      icon={<span className="text-2xl">{getTypeIcon(workout.type)}</span>}
      color={isToday ? "cyan" : "gray"}
      className={isToday ? "ring-2 ring-cyan-500/50" : ""}
      headerAction={
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${intensity.bg} ${intensity.text} ${intensity.border} border`}>
            {workout.intensity}
          </span>
          {isToday && (
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Type et durée */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{workout.type}</h3>
            <p className="text-sm text-slate-400">{workout.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-100">{workout.duration}</div>
            <div className="text-xs text-slate-400">minutes</div>
          </div>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center bg-slate-700/50 rounded-lg p-2">
            <div className="text-lg font-bold text-red-400">{workout.calories}</div>
            <div className="text-xs text-slate-400">kcal brûlées</div>
          </div>
          <div className="text-center bg-slate-700/50 rounded-lg p-2">
            <div className="text-lg font-bold text-blue-400">{workout.sets || '-'}</div>
            <div className="text-xs text-slate-400">séries</div>
          </div>
        </div>

        {/* Exercices principaux */}
        {workout.exercises && workout.exercises.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300">Exercices principaux</h4>
            <div className="space-y-1">
              {workout.exercises.slice(0, 3).map((exercise, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>{exercise}</span>
                </div>
              ))}
              {workout.exercises.length > 3 && (
                <div className="text-xs text-slate-500">
                  +{workout.exercises.length - 3} autres exercices
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isToday ? (
            <button 
              onClick={() => onStart(workout.id)}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm py-2 rounded-lg transition-colors font-medium"
            >
              Commencer l'entraînement
            </button>
          ) : workout.completed ? (
            <button 
              disabled
              className="flex-1 bg-green-600/50 text-green-300 text-sm py-2 rounded-lg cursor-not-allowed"
            >
              ✓ Terminé
            </button>
          ) : (
            <button 
              onClick={() => onStart(workout.id)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-2 rounded-lg transition-colors"
            >
              Voir les détails
            </button>
          )}
          <button className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-2 rounded-lg transition-colors">
            📝
          </button>
        </div>
      </div>
    </SectionCard>
  );
};

// Composant WeeklyProgress
const WeeklyProgress = ({ workouts }) => {
  const completedWorkouts = workouts.filter(w => w.completed).length;
  const totalWorkouts = workouts.length;
  const progressPercent = (completedWorkouts / totalWorkouts) * 100;
  
  const totalCalories = workouts.reduce((acc, w) => w.completed ? acc + w.calories : acc, 0);
  const totalDuration = workouts.reduce((acc, w) => w.completed ? acc + w.duration : acc, 0);

  return (
    <SectionCard
      title="Progression hebdomadaire"
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2" />
        </svg>
      }
      color="green"
    >
      <div className="space-y-4">
        {/* Barre de progression principale */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">Entraînements complétés</span>
            <span className="text-green-400 font-semibold">{completedWorkouts}/{totalWorkouts}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="text-center text-xs text-slate-400 mt-1">
            {Math.round(progressPercent)}% complété
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center bg-slate-700/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-400">{totalCalories}</div>
            <div className="text-xs text-slate-400">kcal brûlées</div>
          </div>
          <div className="text-center bg-slate-700/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">{totalDuration}</div>
            <div className="text-xs text-slate-400">min d'activité</div>
          </div>
        </div>

        {/* Répartition par type */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300">Répartition des entraînements</h4>
          <div className="space-y-1">
            {['Cardio', 'Musculation', 'Flexibilité'].map(type => {
              const count = workouts.filter(w => w.type === type && w.completed).length;
              const total = workouts.filter(w => w.type === type).length;
              const percent = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-700 rounded-full h-1.5">
                      <div 
                        className="bg-cyan-400 h-1.5 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="text-slate-300 text-xs w-8">{count}/{total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

// Composant principal WorkoutPlannerV2
const WorkoutPlannerV2 = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Données mockées pour démonstration
  const [weeklyPlan, setWeeklyPlan] = useState([
    {
      id: 1,
      day: 'Lundi',
      type: 'Musculation',
      description: 'Haut du corps - Force',
      duration: 45,
      intensity: 'Élevée',
      calories: 320,
      sets: 4,
      completed: true,
      exercises: ['Développé couché', 'Tractions', 'Développé militaire', 'Rowing barre']
    },
    {
      id: 2,
      day: 'Mardi',
      type: 'Cardio',
      description: 'Course à pied modérée',
      duration: 30,
      intensity: 'Modérée',
      calories: 280,
      completed: true,
      exercises: ['Échauffement 5min', 'Course 20min', 'Retour au calme 5min']
    },
    {
      id: 3,
      day: 'Mercredi',
      type: 'Musculation',
      description: 'Bas du corps - Puissance',
      duration: 50,
      intensity: 'Élevée',
      calories: 380,
      sets: 5,
      completed: false,
      exercises: ['Squats', 'Soulevé de terre', 'Fentes', 'Mollets']
    },
    {
      id: 4,
      day: 'Jeudi',
      type: 'Flexibilité',
      description: 'Yoga et étirements',
      duration: 25,
      intensity: 'Faible',
      calories: 120,
      completed: false,
      exercises: ['Salutation au soleil', 'Étirements des hanches', 'Relaxation']
    },
    {
      id: 5,
      day: 'Vendredi',
      type: 'HIIT',
      description: 'Entraînement fractionné',
      duration: 35,
      intensity: 'Élevée',
      calories: 420,
      completed: false,
      exercises: ['Burpees', 'Mountain climbers', 'Jump squats', 'Planche']
    },
    {
      id: 6,
      day: 'Samedi',
      type: 'Cardio',
      description: 'Natation libre',
      duration: 40,
      intensity: 'Modérée',
      calories: 300,
      completed: false,
      exercises: ['Nage libre', 'Dos crawlé', 'Brasse', 'Récupération']
    },
    {
      id: 7,
      day: 'Dimanche',
      type: 'Récupération',
      description: 'Repos actif - Marche',
      duration: 60,
      intensity: 'Faible',
      calories: 180,
      completed: false,
      exercises: ['Marche en nature', 'Étirements légers']
    }
  ]);

  const [weeklyStats] = useState({
    totalWorkouts: weeklyPlan.length,
    completedWorkouts: weeklyPlan.filter(w => w.completed).length,
    totalCalories: weeklyPlan.reduce((acc, w) => acc + w.calories, 0),
    totalDuration: weeklyPlan.reduce((acc, w) => acc + w.duration, 0),
    averageIntensity: 'Modérée à Élevée'
  });

  // Déterminer l'entraînement du jour (simulé - Mercredi)
  const today = 'Mercredi';
  const todayWorkout = weeklyPlan.find(w => w.day === today);

  const handleStartWorkout = (workoutId) => {
    console.log('Start workout:', workoutId);
  };

  const handleRegeneratePlan = async () => {
    setRegenerating(true);
    // Simulation de régénération
    setTimeout(() => {
      setRegenerating(false);
      console.log('Plan régénéré !');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Planificateur d'Entraînement</h1>
          <p className="text-slate-400 mt-1">Votre programme personnalisé par l'IA</p>
        </div>
        <button 
          onClick={handleRegeneratePlan}
          disabled={regenerating}
          className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
        >
          {regenerating ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Génération...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Régénérer le plan
            </>
          )}
        </button>
      </div>

      {/* Statistiques de la semaine */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Entraînements"
          value={`${weeklyStats.completedWorkouts}/${weeklyStats.totalWorkouts}`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          color="green"
        />

        <MetricCard
          title="Calories prévues"
          value={weeklyStats.totalCalories}
          unit="kcal"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
          color="red"
        />

        <MetricCard
          title="Temps total"
          value={weeklyStats.totalDuration}
          unit="min"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="blue"
        />

        <MetricCard
          title="Intensité moy."
          value={weeklyStats.averageIntensity}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          color="purple"
        />
      </div>

      {/* Progression et plan hebdomadaire */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Progression hebdomadaire */}
        <div className="lg:col-span-1">
          <WeeklyProgress workouts={weeklyPlan} />
        </div>

        {/* Plan hebdomadaire */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-xl font-semibold text-slate-100">Plan de la semaine</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {weeklyPlan.map(workout => (
              <WorkoutCard 
                key={workout.id} 
                workout={workout}
                isToday={workout.day === today}
                onStart={handleStartWorkout}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Conseils IA */}
      <SectionCard
        title="Conseils d'Entraînement IA"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        }
        color="purple"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-xl">
            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Excellente progression cette semaine ! Vous avez maintenu une bonne régularité dans vos entraînements. 💪
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-xl">
            <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Aujourd'hui c'est jour de musculation bas du corps. Concentrez-vous sur la forme plutôt que sur la charge. 🎯
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-xl">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm leading-relaxed">
              N'oubliez pas de bien vous hydrater et de prendre au moins 8h de sommeil pour optimiser la récupération. 💧
            </p>
          </div>
        </div>
      </SectionCard>

    </div>
  );
};

export default WorkoutPlannerV2;
