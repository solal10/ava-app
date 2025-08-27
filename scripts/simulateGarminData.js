require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const Health = require('../src/models/health.model');
const Meal = require('../src/models/meal.model');
const Learn = require('../models/learn.model');

// Configuration
const TARGET_EMAIL = 'thomas@coach.com';
const DAYS_TO_SIMULATE = 14;

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => {
    console.error('❌ Erreur MongoDB :', err);
    process.exit(1);
  });

// Fonction pour générer un nombre aléatoire dans une plage
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;

// Fonction pour générer une date pour un jour spécifique
const getDateForDay = (daysAgo, hour = 12, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date;
};

// Données de repas réalistes
const mealDatabase = {
  petit_dejeuner: [
    { name: 'Avoine aux fruits', description: 'Flocons d\'avoine avec banane et myrtilles', calories: 420, proteines: 15, lipides: 8, glucides: 65 },
    { name: 'Omelette aux légumes', description: 'Omelette 2 œufs avec épinards et tomates', calories: 320, proteines: 22, lipides: 24, glucides: 6 },
    { name: 'Toast avocat', description: 'Pain complet avec avocat et œuf poché', calories: 380, proteines: 18, lipides: 22, glucides: 28 },
    { name: 'Smoothie protéiné', description: 'Banane, épinards, protéine whey, lait d\'amande', calories: 350, proteines: 25, lipides: 8, glucides: 35 },
    { name: 'Yaourt grec aux noix', description: 'Yaourt grec avec noix et miel', calories: 290, proteines: 20, lipides: 15, glucides: 18 }
  ],
  dejeuner: [
    { name: 'Salade de quinoa', description: 'Quinoa, légumes grillés, poulet, vinaigrette', calories: 650, proteines: 35, lipides: 18, glucides: 75 },
    { name: 'Saumon grillé', description: 'Saumon avec riz basmati et brocolis', calories: 720, proteines: 42, lipides: 28, glucides: 65 },
    { name: 'Bowl Buddha', description: 'Légumineuses, légumes, avocat, graines', calories: 580, proteines: 22, lipides: 25, glucides: 68 },
    { name: 'Pâtes au pesto', description: 'Pâtes complètes, pesto maison, tomates cerises', calories: 620, proteines: 18, lipides: 22, glucides: 85 },
    { name: 'Wrap au thon', description: 'Tortilla complète, thon, crudités, houmous', calories: 480, proteines: 28, lipides: 16, glucides: 52 }
  ],
  diner: [
    { name: 'Poisson blanc aux légumes', description: 'Cabillaud avec légumes vapeur et quinoa', calories: 420, proteines: 35, lipides: 8, glucides: 45 },
    { name: 'Curry de lentilles', description: 'Lentilles corail, lait de coco, épices, riz', calories: 520, proteines: 20, lipides: 15, glucides: 72 },
    { name: 'Salade de poulet', description: 'Poulet grillé, salade verte, avocat, noix', calories: 450, proteines: 38, lipides: 22, glucides: 18 },
    { name: 'Soupe de légumes', description: 'Soupe maison avec pain complet', calories: 320, proteines: 12, lipides: 8, glucides: 48 },
    { name: 'Omelette aux champignons', description: 'Omelette légère avec salade verte', calories: 280, proteines: 20, lipides: 18, glucides: 8 }
  ]
};

// Générer des données de santé pour un jour
const generateHealthData = (userId, daysAgo) => {
  const baseDate = getDateForDay(daysAgo);
  
  // Variation réaliste selon les jours (weekend vs semaine)
  const isWeekend = baseDate.getDay() === 0 || baseDate.getDay() === 6;
  
  return {
    userId,
    date: baseDate,
    metrics: {
      sommeil: {
        heures: randomFloat(5.5, 8.5),
        qualite: randomBetween(60, 95)
      },
      stress: {
        niveau: isWeekend ? randomBetween(20, 60) : randomBetween(30, 80),
        facteurs: isWeekend ? ['repos', 'détente'] : ['travail', 'transport']
      },
      hydratation: {
        verresEau: randomBetween(6, 12),
        score: randomBetween(65, 90)
      },
      energie: {
        niveau: randomBetween(40, 90),
        facteurs: ['sommeil', 'alimentation', 'exercice']
      },
      activite: {
        duree: isWeekend ? randomBetween(60, 180) : randomBetween(30, 90),
        type: isWeekend ? 
          ['course', 'velo', 'natation', 'marche'][randomBetween(0, 3)] :
          ['marche', 'cardio', 'musculation'][randomBetween(0, 2)],
        intensite: randomBetween(5, 9)
      }
    },
    healthScore: randomBetween(65, 92),
    notes: `Données Garmin - ${isWeekend ? 'Weekend' : 'Jour de semaine'}`,
    source: 'garmin'
  };
};

// Générer des repas pour un jour
const generateMealsForDay = (userId, daysAgo) => {
  const meals = [];
  const mealTypes = ['petit_dejeuner', 'dejeuner', 'diner'];
  
  mealTypes.forEach((mealType, index) => {
    const mealOptions = mealDatabase[mealType];
    const selectedMeal = mealOptions[randomBetween(0, mealOptions.length - 1)];
    
    // Variation des heures de repas
    const mealHours = { petit_dejeuner: 8, dejeuner: 13, diner: 19 };
    const mealTime = getDateForDay(daysAgo, mealHours[mealType] + randomBetween(-1, 1), randomBetween(0, 59));
    
    meals.push({
      userId,
      name: selectedMeal.name,
      description: selectedMeal.description,
      calories: selectedMeal.calories + randomBetween(-50, 50), // Variation réaliste
      nutrients: {
        proteines: selectedMeal.proteines + randomBetween(-3, 3),
        lipides: selectedMeal.lipides + randomBetween(-2, 2),
        glucides: selectedMeal.glucides + randomBetween(-5, 5),
        fibres: randomBetween(3, 12)
      },
      mealType,
      date: mealTime,
      aiAnalysis: {
        foodItems: selectedMeal.description.split(', '),
        healthScore: randomBetween(70, 95),
        recommendations: [
          'Bon équilibre nutritionnel',
          'Riche en nutriments essentiels',
          'Adapté à vos objectifs'
        ]
      }
    });
  });
  
  return meals;
};

// Générer des logs Learn pour un jour
const generateLearnLogs = (userId, daysAgo) => {
  const logs = [];
  const baseDate = getDateForDay(daysAgo);
  
  // Log de mise à jour santé (quotidien)
  logs.push({
    userId,
    type: 'health',
    context: 'Synchronisation données Garmin',
    result: 'Données santé mises à jour avec succès',
    metadata: {
      userInput: 'Sync automatique Garmin',
      aiResponse: 'Données intégrées: sommeil, stress, activité, fréquence cardiaque',
      confidence: 0.95,
      source: 'garmin_sync',
      sessionId: `garmin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    timestamp: new Date(baseDate.getTime() + randomBetween(0, 2) * 60 * 60 * 1000) // 0-2h après minuit
  });
  
  // Logs d'analyse de repas (3 par jour)
  for (let i = 0; i < 3; i++) {
    const mealTimes = [8, 13, 19]; // heures des repas
    const mealNames = ['petit-déjeuner', 'déjeuner', 'dîner'];
    
    logs.push({
      userId,
      type: 'nutrition',
      context: `Analyse automatique ${mealNames[i]}`,
      result: 'Repas analysé et recommandations générées',
      metadata: {
        userInput: `Photo ${mealNames[i]} via Garmin Connect`,
        aiResponse: 'Analyse nutritionnelle complète avec suggestions d\'amélioration',
        confidence: randomFloat(0.82, 0.94),
        source: 'meal_analyzer',
        sessionId: `meal_${Date.now()}_${i}`
      },
      timestamp: new Date(baseDate.getTime() + (mealTimes[i] + randomBetween(0, 2)) * 60 * 60 * 1000)
    });
  }
  
  // Log de création d'objectif (aléatoire, 30% de chance par jour)
  if (Math.random() < 0.3) {
    const goals = [
      'Améliorer la qualité du sommeil',
      'Augmenter l\'hydratation quotidienne',
      'Réduire le niveau de stress',
      'Atteindre 10000 pas par jour',
      'Optimiser la récupération post-exercice'
    ];
    
    logs.push({
      userId,
      type: 'goals',
      context: 'Suggestion d\'objectif basée sur les données Garmin',
      result: 'Nouvel objectif créé automatiquement',
      metadata: {
        userInput: 'Analyse des tendances de performance',
        aiResponse: `Objectif suggéré: ${goals[randomBetween(0, goals.length - 1)]}`,
        confidence: randomFloat(0.88, 0.96),
        source: 'goal_generator',
        sessionId: `goal_${Date.now()}`
      },
      timestamp: new Date(baseDate.getTime() + randomBetween(18, 22) * 60 * 60 * 1000) // Soirée
    });
  }
  
  // Message chat occasionnel (20% de chance par jour)
  if (Math.random() < 0.2) {
    const chatMessages = [
      'Félicitations pour votre activité d\'aujourd\'hui !',
      'Votre sommeil s\'améliore, continuez ainsi',
      'Pensez à vous hydrater davantage',
      'Excellente séance d\'entraînement détectée',
      'Vos habitudes alimentaires sont sur la bonne voie'
    ];
    
    logs.push({
      userId,
      type: 'chat',
      context: 'Message motivationnel automatique',
      result: 'Encouragement personnalisé envoyé',
      metadata: {
        userInput: 'Analyse comportementale quotidienne',
        aiResponse: chatMessages[randomBetween(0, chatMessages.length - 1)],
        confidence: 0.90,
        source: 'motivation_engine',
        sessionId: `chat_${Date.now()}`
      },
      timestamp: new Date(baseDate.getTime() + randomBetween(19, 21) * 60 * 60 * 1000) // Soirée
    });
  }
  
  return logs;
};

// Fonction principale
const simulateGarminData = async () => {
  try {
    console.log(`🔍 Recherche de l'utilisateur: ${TARGET_EMAIL}`);
    
    // Trouver l'utilisateur
    const user = await User.findOne({ email: TARGET_EMAIL });
    if (!user) {
      console.error(`❌ Utilisateur ${TARGET_EMAIL} non trouvé`);
      return;
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.prenom} (${user._id})`);
    
    // Supprimer les données existantes pour éviter les doublons
    console.log('🗑️ Suppression des données existantes...');
    await Health.deleteMany({ userId: user._id, source: 'garmin' });
    await Meal.deleteMany({ userId: user._id });
    await Learn.deleteMany({ userId: user._id });
    
    const allHealthData = [];
    const allMealData = [];
    const allLearnLogs = [];
    
    console.log(`📊 Génération de ${DAYS_TO_SIMULATE} jours de données Garmin...`);
    
    // Générer les données pour chaque jour
    for (let day = DAYS_TO_SIMULATE - 1; day >= 0; day--) {
      console.log(`   Jour -${day}: ${getDateForDay(day).toLocaleDateString('fr-FR')}`);
      
      // Données de santé
      const healthData = generateHealthData(user._id, day);
      allHealthData.push(healthData);
      
      // Repas
      const mealsData = generateMealsForDay(user._id, day);
      allMealData.push(...mealsData);
      
      // Logs Learn
      const learnLogs = generateLearnLogs(user._id, day);
      allLearnLogs.push(...learnLogs);
    }
    
    // Insérer toutes les données
    console.log('💾 Insertion des données dans MongoDB...');
    
    await Health.insertMany(allHealthData);
    console.log(`   ✅ ${allHealthData.length} entrées Health créées`);
    
    await Meal.insertMany(allMealData);
    console.log(`   ✅ ${allMealData.length} entrées Meal créées`);
    
    await Learn.insertMany(allLearnLogs);
    console.log(`   ✅ ${allLearnLogs.length} entrées Learn créées`);
    
    // Statistiques finales
    console.log('\n📈 Résumé des données simulées:');
    console.log(`   👤 Utilisateur: ${user.prenom} (${TARGET_EMAIL})`);
    console.log(`   📅 Période: ${DAYS_TO_SIMULATE} jours`);
    console.log(`   🏥 Données santé: ${allHealthData.length} jours`);
    console.log(`   🍽️ Repas: ${allMealData.length} repas (${allMealData.length / DAYS_TO_SIMULATE} par jour)`);
    console.log(`   🤖 Logs IA: ${allLearnLogs.length} événements`);
    
    // Répartition des logs Learn
    const logStats = allLearnLogs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n🔍 Répartition des logs Learn:');
    Object.entries(logStats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} événements`);
    });
    
    console.log('\n🎉 Simulation Garmin terminée avec succès !');
    console.log('💡 Vous pouvez maintenant tester:');
    console.log('   - Dashboard avec données réelles');
    console.log('   - Module Learn avec historique');
    console.log('   - Analyses IA basées sur les tendances');
    console.log('   - Goals avec données de référence');
    
  } catch (error) {
    console.error('❌ Erreur lors de la simulation:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
};

// Exécution du script
simulateGarminData();
