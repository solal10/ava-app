require('dotenv').config();
const mongoose = require('mongoose');
const Learn = require('../models/learn.model');
const User = require('../src/models/user.model');

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => {
    console.error('❌ Erreur MongoDB :', err);
    process.exit(1);
  });

const createTestLogs = async () => {
  try {
    // Récupérer les utilisateurs de test
    const users = await User.find({ 
      email: { $in: ['thomas@coach.com', 'sarah@coach.com'] } 
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur de test trouvé. Créez d\'abord les utilisateurs avec createTestUsers.js');
      return;
    }

    // Supprimer les logs existants
    await Learn.deleteMany({});
    console.log('🗑️ Logs existants supprimés');

    const testLogs = [];
    const now = new Date();

    // Générer des logs pour chaque utilisateur
    for (const user of users) {
      // Logs de chat/advice
      testLogs.push({
        userId: user._id,
        type: 'chat',
        context: 'Demande de conseils nutrition',
        result: 'Conseils personnalisés fournis',
        metadata: {
          userInput: 'Comment améliorer mon alimentation pour perdre du poids ?',
          aiResponse: 'Voici mes recommandations personnalisées...',
          confidence: 0.85,
          source: 'nutrition_expert',
          sessionId: 'session_' + Math.random().toString(36).substr(2, 9)
        },
        timestamp: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
      });

      // Logs de goals
      testLogs.push({
        userId: user._id,
        type: 'goals',
        context: 'Création objectif perte de poids',
        result: 'Objectif créé avec succès',
        metadata: {
          userInput: 'Je veux perdre 5kg en 3 mois',
          aiResponse: 'Objectif réalisable créé avec plan personnalisé',
          confidence: 0.92,
          source: 'goal_planner',
          sessionId: 'session_' + Math.random().toString(36).substr(2, 9)
        },
        timestamp: new Date(now - Math.random() * 5 * 24 * 60 * 60 * 1000) // 5 derniers jours
      });

      // Logs de nutrition
      testLogs.push({
        userId: user._id,
        type: 'nutrition',
        context: 'Analyse repas du midi',
        result: 'Repas analysé - 650 calories, équilibré',
        metadata: {
          userInput: 'Salade de quinoa avec légumes et poulet',
          aiResponse: 'Excellent choix ! Repas équilibré avec bon ratio protéines/glucides',
          confidence: 0.88,
          source: 'meal_analyzer',
          sessionId: 'session_' + Math.random().toString(36).substr(2, 9)
        },
        timestamp: new Date(now - Math.random() * 3 * 24 * 60 * 60 * 1000) // 3 derniers jours
      });

      // Logs de workout
      testLogs.push({
        userId: user._id,
        type: 'workout',
        context: 'Génération programme musculation',
        result: 'Programme 3x/semaine créé',
        metadata: {
          userInput: 'Programme musculation débutant 3 fois par semaine',
          aiResponse: 'Programme adapté créé avec progression sur 8 semaines',
          confidence: 0.90,
          source: 'workout_planner',
          sessionId: 'session_' + Math.random().toString(36).substr(2, 9)
        },
        timestamp: new Date(now - Math.random() * 2 * 24 * 60 * 60 * 1000) // 2 derniers jours
      });

      // Logs de health
      testLogs.push({
        userId: user._id,
        type: 'health',
        context: 'Analyse données santé',
        result: 'Recommandations santé générées',
        metadata: {
          userInput: 'Analyse de mes métriques de sommeil et stress',
          aiResponse: 'Votre sommeil s\'améliore, continuez vos efforts de relaxation',
          confidence: 0.87,
          source: 'health_analyzer',
          sessionId: 'session_' + Math.random().toString(36).substr(2, 9)
        },
        timestamp: new Date(now - Math.random() * 1 * 24 * 60 * 60 * 1000) // 1 dernier jour
      });
    }

    // Ajouter quelques logs supplémentaires récents
    const recentLogs = [
      {
        userId: users[0]._id,
        type: 'chat',
        context: 'Question sur hydratation',
        result: 'Conseils hydratation fournis',
        metadata: {
          userInput: 'Combien d\'eau dois-je boire par jour ?',
          aiResponse: 'Pour votre profil, je recommande 2.5L par jour',
          confidence: 0.95,
          source: 'hydration_expert'
        },
        timestamp: new Date(now - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        userId: users[1]._id,
        type: 'nutrition',
        context: 'Analyse petit-déjeuner',
        result: 'Petit-déjeuner analysé - 420 calories',
        metadata: {
          userInput: 'Avoine avec fruits et yaourt grec',
          aiResponse: 'Parfait petit-déjeuner équilibré !',
          confidence: 0.93,
          source: 'meal_analyzer'
        },
        timestamp: new Date(now - 15 * 60 * 1000) // 15 minutes ago
      }
    ];

    testLogs.push(...recentLogs);

    // Insérer tous les logs
    await Learn.insertMany(testLogs);

    console.log(`✅ ${testLogs.length} logs de test créés avec succès !`);
    console.log('📊 Répartition des logs :');
    
    const stats = testLogs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(stats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} logs`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création des logs :', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
};

createTestLogs();
