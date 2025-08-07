/**
 * Données simulées pour l'application Coach Santé
 * Utilisées comme fallback quand l'API n'est pas disponible
 */

// Utilisateur simulé
export const mockUser = {
  id: 'test-user-id',
  name: 'Utilisateur Test',
  email: 'test@example.com',
  age: 30,
  weight: 70,
  height: 175,
  isPremium: true,
  goals: {
    weight: 68,
    steps: 10000,
    calories: 2000,
    sleep: 8,
    stress: 1,
    hydration: 2.5
  }
};

// Statistiques simulées
export const mockStats = {
  metrics: {
    weight: 70,
    steps: 9500,
    calories: 2100,
    sleep: 7.5,
    stress: 2,
    mood: 4,
    hydration: 2.2
  },
  goals: {
    weight: 68,
    steps: 10000,
    calories: 2000,
    sleep: 8,
    stress: 1,
    hydration: 2.5
  },
  progress: {
    weight: 95,
    steps: 95,
    calories: 105,
    sleep: 94,
    stress: 50,
    hydration: 88
  }
};

// Historique de santé simulé
export const generateMockHealthHistory = (days = 7) => {
  const now = new Date();
  const history = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    history.push({
      date: date.toISOString().split('T')[0],
      weight: 70 + (Math.random() - 0.5) * 2,
      steps: 8000 + Math.floor(Math.random() * 4000),
      calories: 1800 + Math.floor(Math.random() * 400),
      sleep: 7 + Math.random() * 2,
      stress: Math.floor(Math.random() * 5) + 1,
      mood: Math.floor(Math.random() * 5) + 1,
      hydration: 1.5 + Math.random() * 1.5
    });
  }
  
  return history;
};

// Programme simulé
export const mockProgram = {
  program: {
    name: "Programme Équilibré",
    duration: "4 semaines",
    exercises: [
      { name: "Marche rapide", duration: "30 min", frequency: "5x/semaine" },
      { name: "Exercices de force", duration: "20 min", frequency: "3x/semaine" },
      { name: "Étirements", duration: "10 min", frequency: "Quotidien" }
    ],
    nutrition: {
      calories: 2000,
      protein: "25%",
      carbs: "45%",
      fat: "30%"
    }
  }
};

// Repas simulés
export const mockMeals = {
  meals: [
    {
      id: 1,
      name: "Petit-déjeuner équilibré",
      calories: 350,
      time: "08:00",
      foods: ["Avoine", "Banane", "Amandes"]
    },
    {
      id: 2,
      name: "Déjeuner protéiné",
      calories: 450,
      time: "12:30",
      foods: ["Poulet", "Quinoa", "Légumes verts"]
    },
    {
      id: 3,
      name: "Dîner léger",
      calories: 300,
      time: "19:00",
      foods: ["Saumon", "Brocolis", "Riz complet"]
    }
  ]
};

// Messages simulés
export const mockMessages = {
  messages: [
    {
      id: 1,
      type: "conseil",
      title: "Hydratation",
      content: "N'oubliez pas de boire suffisamment d'eau aujourd'hui !",
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      type: "encouragement",
      title: "Objectifs",
      content: "Vous êtes proche de votre objectif de pas quotidien !",
      timestamp: new Date().toISOString()
    }
  ]
};

// Évolution simulée
export const mockEvolution = {
  evolution: {
    weight: generateMockHealthHistory(30).map(day => ({
      date: day.date,
      value: day.weight
    })),
    steps: generateMockHealthHistory(30).map(day => ({
      date: day.date,
      value: day.steps
    })),
    mood: generateMockHealthHistory(30).map(day => ({
      date: day.date,
      value: day.mood
    }))
  }
};
