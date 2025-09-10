/**
 * API pour la gestion des programmes d'entraînement
 */

// Configuration API
const API_BASE_URL = 'http://localhost:5003/api';

// Types d'entraînement avec leurs propriétés
const WORKOUT_TYPES = {
  cardio: {
    name: 'Cardio',
    icon: '🏃‍♂️',
    color: 'blue',
    description: 'Entraînement cardiovasculaire'
  },
  strength: {
    name: 'Musculation',
    icon: '💪',
    color: 'red',
    description: 'Renforcement musculaire'
  },
  flexibility: {
    name: 'Flexibilité',
    icon: '🧘‍♀️',
    color: 'purple',
    description: 'Étirements et yoga'
  },
  recovery: {
    name: 'Récupération',
    icon: '😌',
    color: 'green',
    description: 'Récupération active'
  },
  hiit: {
    name: 'HIIT',
    icon: '🔥',
    color: 'orange',
    description: 'Entraînement à haute intensité'
  },
  swimming: {
    name: 'Natation',
    icon: '🏊‍♂️',
    color: 'cyan',
    description: 'Entraînement aquatique'
  },
  cycling: {
    name: 'Cyclisme',
    icon: '🚴‍♂️',
    color: 'yellow',
    description: 'Vélo et cyclisme'
  }
};

// Niveaux d'intensité
const INTENSITY_LEVELS = {
  low: {
    name: 'Faible',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300'
  },
  moderate: {
    name: 'Modéré',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300'
  },
  high: {
    name: 'Intense',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300'
  }
};

/**
 * Génère un programme d'entraînement personnalisé
 * @param {Object} userProfile - Profil utilisateur
 * @param {Object} goals - Objectifs de l'utilisateur
 * @returns {Promise<Object>} - Programme d'entraînement généré
 */
export const generateWorkoutPlan = async (userProfile = {}, goals = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/workout/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ userProfile, goals })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la génération du programme:', error);
    
    // Fallback avec programme simulé personnalisé
    return generateMockWorkoutPlan(userProfile, goals);
  }
};

/**
 * Récupère le programme d'entraînement actuel
 * @returns {Promise<Object>} - Programme d'entraînement actuel
 */
export const getCurrentWorkoutPlan = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/workout/current`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération du programme:', error);
    
    // Fallback avec programme par défaut
    return generateMockWorkoutPlan();
  }
};

/**
 * Génère un programme d'entraînement simulé
 * @param {Object} userProfile - Profil utilisateur
 * @param {Object} goals - Objectifs
 * @returns {Object} - Programme simulé
 */
const generateMockWorkoutPlan = (userProfile = {}, goals = {}) => {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const workoutTypes = Object.keys(WORKOUT_TYPES);
  const intensities = Object.keys(INTENSITY_LEVELS);
  
  // Programme équilibré sur 7 jours
  const weeklyPlan = [
    {
      day: 'Lundi',
      type: 'strength',
      duration: 45,
      intensity: 'moderate',
      objectives: ['Force', 'Endurance musculaire'],
      exercises: ['Squats', 'Développé couché', 'Tractions'],
      calories: 280
    },
    {
      day: 'Mardi',
      type: 'cardio',
      duration: 30,
      intensity: 'moderate',
      objectives: ['Cardio', 'Perte de poids'],
      exercises: ['Course à pied', 'Vélo elliptique'],
      calories: 320
    },
    {
      day: 'Mercredi',
      type: 'flexibility',
      duration: 25,
      intensity: 'low',
      objectives: ['Flexibilité', 'Récupération'],
      exercises: ['Yoga', 'Étirements', 'Méditation'],
      calories: 120
    },
    {
      day: 'Jeudi',
      type: 'hiit',
      duration: 20,
      intensity: 'high',
      objectives: ['Cardio intense', 'Métabolisme'],
      exercises: ['Burpees', 'Mountain climbers', 'Jumping jacks'],
      calories: 250
    },
    {
      day: 'Vendredi',
      type: 'strength',
      duration: 40,
      intensity: 'moderate',
      objectives: ['Force', 'Tonification'],
      exercises: ['Deadlifts', 'Overhead press', 'Rows'],
      calories: 260
    },
    {
      day: 'Samedi',
      type: 'cardio',
      duration: 45,
      intensity: 'moderate',
      objectives: ['Endurance', 'Bien-être'],
      exercises: ['Natation', 'Cyclisme', 'Marche rapide'],
      calories: 380
    },
    {
      day: 'Dimanche',
      type: 'recovery',
      duration: 30,
      intensity: 'low',
      objectives: ['Récupération', 'Mobilité'],
      exercises: ['Marche légère', 'Étirements doux', 'Relaxation'],
      calories: 150
    }
  ];

  return {
    plan: weeklyPlan,
    totalDuration: weeklyPlan.reduce((sum, day) => sum + day.duration, 0),
    totalCalories: weeklyPlan.reduce((sum, day) => sum + day.calories, 0),
    weeklyGoals: {
      strength: 2,
      cardio: 2,
      flexibility: 1,
      recovery: 1,
      hiit: 1
    },
    generatedAt: new Date().toISOString(),
    planType: 'balanced'
  };
};

/**
 * Sauvegarde un programme d'entraînement
 * @param {Object} workoutPlan - Programme à sauvegarder
 * @returns {Promise<Object>} - Résultat de la sauvegarde
 */
export const saveWorkoutPlan = async (workoutPlan) => {
  try {
    const response = await fetch(`${API_BASE_URL}/workout/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(workoutPlan)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    
    // Sauvegarde locale en fallback
    localStorage.setItem('workout_plan', JSON.stringify(workoutPlan));
    return { success: true, saved: 'locally' };
  }
};

// Exports nommés pour les constantes
export { WORKOUT_TYPES, INTENSITY_LEVELS };

// Export par défaut
export default {
  generateWorkoutPlan,
  getCurrentWorkoutPlan,
  saveWorkoutPlan,
  WORKOUT_TYPES,
  INTENSITY_LEVELS
};
