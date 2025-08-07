import React, { useState, useEffect } from 'react';

const WorkoutPlannerSimple = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulation simple du chargement
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-lg">Chargement du programme...</span>
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

  // Programme simulé simple
  const weeklyPlan = [
    {
      day: 'Lundi',
      type: 'Musculation',
      duration: 45,
      intensity: 'Modéré',
      icon: '💪',
      color: 'bg-red-100 border-red-300 text-red-800'
    },
    {
      day: 'Mardi',
      type: 'Cardio',
      duration: 30,
      intensity: 'Modéré',
      icon: '🏃‍♂️',
      color: 'bg-blue-100 border-blue-300 text-blue-800'
    },
    {
      day: 'Mercredi',
      type: 'Yoga',
      duration: 25,
      intensity: 'Faible',
      icon: '🧘‍♀️',
      color: 'bg-green-100 border-green-300 text-green-800'
    },
    {
      day: 'Jeudi',
      type: 'HIIT',
      duration: 20,
      intensity: 'Intense',
      icon: '🔥',
      color: 'bg-orange-100 border-orange-300 text-orange-800'
    },
    {
      day: 'Vendredi',
      type: 'Musculation',
      duration: 40,
      intensity: 'Modéré',
      icon: '💪',
      color: 'bg-red-100 border-red-300 text-red-800'
    },
    {
      day: 'Samedi',
      type: 'Natation',
      duration: 45,
      intensity: 'Modéré',
      icon: '🏊‍♂️',
      color: 'bg-cyan-100 border-cyan-300 text-cyan-800'
    },
    {
      day: 'Dimanche',
      type: 'Récupération',
      duration: 30,
      intensity: 'Faible',
      icon: '😌',
      color: 'bg-green-100 border-green-300 text-green-800'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📅 Programme d'Entraînement
            </h1>
            <p className="text-lg text-gray-600">
              Votre programme personnalisé pour atteindre vos objectifs
            </p>
          </div>
          
          <button
            className="mt-4 md:mt-0 px-6 py-3 rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => alert('Fonctionnalité de régénération bientôt disponible!')}
          >
            🔄 Régénérer le plan
          </button>
        </div>

        {/* Objectifs santé simulés */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🎯 Vos Objectifs Santé</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">68kg</div>
              <div className="text-sm text-gray-600">Poids cible</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">10000</div>
              <div className="text-sm text-gray-600">Pas/jour</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">2000</div>
              <div className="text-sm text-gray-600">Calories/jour</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">30min</div>
              <div className="text-sm text-gray-600">Sport/jour</div>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé du programme */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-md border">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">235</div>
              <div className="text-sm text-gray-600">Minutes/semaine</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md border">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">1760</div>
              <div className="text-sm text-gray-600">Calories brûlées</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md border">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">Équilibré</div>
              <div className="text-sm text-gray-600">Type de programme</div>
            </div>
          </div>
        </div>
      </div>

      {/* Programme hebdomadaire - Cartes par jour */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">📋 Programme de la Semaine</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {weeklyPlan.map((dayPlan, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-lg border-2 hover:shadow-xl transition-all duration-300 overflow-hidden ${dayPlan.color.split(' ')[1]}`}
            >
              {/* En-tête de la carte */}
              <div className={`${dayPlan.color.split(' ')[0]} px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold text-lg ${dayPlan.color.split(' ')[2]}`}>
                    {dayPlan.day}
                  </h3>
                  <span className="text-2xl">{dayPlan.icon}</span>
                </div>
              </div>

              {/* Contenu de la carte */}
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-xl text-gray-800 mb-2">
                    {dayPlan.type}
                  </h4>
                </div>

                {/* Détails de l'entraînement */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Durée:</span>
                    <span className="font-semibold text-gray-800">{dayPlan.duration} min</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Intensité:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${dayPlan.color}`}>
                      {dayPlan.intensity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkoutPlannerSimple;
