const User = require('../../models/user.model');
const aiChatService = require('../../services/ai-chat.service');

// Modèle pour l'historique des conversations (simple cache en mémoire)
const conversationHistory = new Map();

// Compteur de requêtes par utilisateur (simulé - à remplacer par une base de données)
const userRequestCounts = {};

exports.askCoach = async (req, res) => {
  try {
    const { userId, subscriptionLevel, user } = req;
    const { question, context, responseType = 'health_coach' } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question manquante' });
    }

    console.log(`🤖 Question IA de ${user?.email}: "${question.substring(0, 100)}..."`);

    // Gestion des limites pour le niveau "explore"
    if (subscriptionLevel === 'explore') {
      if (!userRequestCounts[userId]) {
        userRequestCounts[userId] = 0;
      }

      if (userRequestCounts[userId] >= 3) {
        return res.status(403).json({
          message: 'Limite de 3 questions par semaine atteinte pour le niveau Explore',
          upgrade: true,
          upgradeMessage: 'Passez à Perform pour un chat illimité !'
        });
      }

      userRequestCounts[userId]++;
    }

    // Récupérer le profil utilisateur et les données de santé
    const userProfile = await User.findById(userId).select('-password');
    
    // Obtenir l'historique de conversation
    const chatHistory = conversationHistory.get(userId) || [];
    
    // Construire le contexte pour l'IA
    const aiContext = {
      userId,
      userProfile,
      healthData: userProfile?.stats || context?.healthData,
      chatHistory,
      responseType,
      subscriptionLevel,
      maxTokens: subscriptionLevel === 'explore' ? 150 : 300
    };

    // Générer la réponse avec l'IA
    const aiResponse = await aiChatService.generateResponse(question, aiContext);

    // Sauvegarder dans l'historique
    const conversationEntry = {
      timestamp: new Date(),
      question,
      response: aiResponse.response,
      provider: aiResponse.provider,
      intent: aiResponse.intent
    };

    // Limiter l'historique à 20 échanges
    chatHistory.push(conversationEntry);
    if (chatHistory.length > 20) {
      chatHistory.shift();
    }
    conversationHistory.set(userId, chatHistory);

    // Réponse complète
    res.status(200).json({
      question,
      response: aiResponse.response,
      metadata: {
        provider: aiResponse.provider,
        model: aiResponse.model,
        tokens: aiResponse.tokens,
        cost: aiResponse.cost,
        intent: aiResponse.intent,
        confidence: aiResponse.confidence
      },
      subscription: {
        level: subscriptionLevel,
        requestCount: subscriptionLevel === 'explore' ? userRequestCounts[userId] : null,
        maxRequests: subscriptionLevel === 'explore' ? 3 : 'unlimited',
        gated: aiResponse.subscription_gated
      },
      conversationId: `${userId}_${Date.now()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur chat IA:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la communication avec l\'IA', 
      error: error.message 
    });
  }
};

// Obtenir l'historique de conversation d'un utilisateur
exports.getConversationHistory = async (req, res) => {
  try {
    const { userId } = req;
    const { limit = 10 } = req.query;

    const history = conversationHistory.get(userId) || [];
    const recentHistory = history.slice(-parseInt(limit));

    res.status(200).json({
      userId,
      conversationCount: history.length,
      recentConversations: recentHistory,
      hasMore: history.length > parseInt(limit)
    });

  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message 
    });
  }
};

// Analyser les tendances de conversation
exports.getConversationAnalytics = async (req, res) => {
  try {
    const { userId, subscriptionLevel } = req;

    // Fonctionnalité premium
    if (!['pro', 'elite'].includes(subscriptionLevel)) {
      return res.status(403).json({
        message: 'Fonctionnalité réservée aux abonnements Pro et Elite',
        upgrade: true
      });
    }

    const analytics = await aiChatService.analyzeConversationTrends(userId, 30);

    res.status(200).json({
      userId,
      period: '30 derniers jours',
      analytics,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur analytics conversation:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'analyse des conversations',
      error: error.message 
    });
  }
};

// Fonction d'apprentissage et feedback
exports.provideFeedback = async (req, res) => {
  try {
    const { userId } = req;
    const { conversationId, rating, feedback, helpful } = req.body;
    
    if (!conversationId || rating === undefined) {
      return res.status(400).json({ message: 'ID de conversation et évaluation requis' });
    }

    // Enregistrer le feedback pour amélioration future
    console.log('📝 Feedback reçu:', {
      userId,
      conversationId,
      rating,
      feedback,
      helpful,
      timestamp: new Date()
    });

    // TODO: Sauvegarder en base de données pour analyse
    
    res.status(200).json({ 
      message: 'Merci pour votre retour ! Il nous aide à améliorer AVA.',
      recorded: true,
      conversationId
    });

  } catch (error) {
    console.error('❌ Erreur feedback:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'enregistrement du retour', 
      error: error.message 
    });
  }
};

// Réinitialiser l'historique de conversation
exports.clearConversationHistory = async (req, res) => {
  try {
    const { userId } = req;

    conversationHistory.delete(userId);

    res.status(200).json({
      message: 'Historique de conversation effacé',
      userId,
      clearedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur nettoyage historique:', error);
    res.status(500).json({ 
      message: 'Erreur lors du nettoyage de l\'historique',
      error: error.message 
    });
  }
};

// Obtenir les limites d'utilisation
exports.getUsageLimits = async (req, res) => {
  try {
    const { userId, subscriptionLevel } = req;

    const limits = {
      explore: { questionsPerWeek: 3, maxTokensPerResponse: 150 },
      perform: { questionsPerWeek: 'unlimited', maxTokensPerResponse: 300 },
      pro: { questionsPerWeek: 'unlimited', maxTokensPerResponse: 500 },
      elite: { questionsPerWeek: 'unlimited', maxTokensPerResponse: 800 }
    };

    const currentLimits = limits[subscriptionLevel] || limits.explore;
    const currentUsage = userRequestCounts[userId] || 0;

    res.status(200).json({
      subscriptionLevel,
      limits: currentLimits,
      currentUsage: {
        questionsThisWeek: subscriptionLevel === 'explore' ? currentUsage : 'unlimited'
      },
      resetDate: subscriptionLevel === 'explore' ? exports.getNextWeekReset() : null
    });

  } catch (error) {
    console.error('❌ Erreur limites usage:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des limites',
      error: error.message 
    });
  }
};

// Obtenir le statut du service IA
exports.getServiceStatus = async (req, res) => {
  try {
    const status = aiChatService.getServiceStatus();
    
    res.status(200).json({
      message: 'Statut du service IA récupéré',
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur récupération statut IA:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du statut IA',
      error: error.message
    });
  }
};

// Tester les connexions API
exports.testAPIConnections = async (req, res) => {
  try {
    const { subscriptionLevel } = req;
    
    // Fonctionnalité réservée aux admins ou Elite
    if (subscriptionLevel !== 'elite') {
      return res.status(403).json({
        message: 'Test API réservé aux utilisateurs Elite',
        upgrade: true
      });
    }

    const results = await aiChatService.testAPIConnections();
    
    res.status(200).json({
      message: 'Test des connexions API terminé',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur test connexions API:', error);
    res.status(500).json({
      message: 'Erreur lors du test des connexions API',
      error: error.message
    });
  }
};

// Helper: Obtenir la date de réinitialisation hebdomadaire
exports.getNextWeekReset = function() {
  const now = new Date();
  const nextMonday = new Date();
  nextMonday.setDate(now.getDate() + (7 - now.getDay() + 1) % 7);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday.toISOString();
};
