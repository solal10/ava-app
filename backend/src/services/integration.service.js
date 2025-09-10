const { notificationService } = require('./notification.service');
const { aiChatService } = require('./ai-chat.service');
const { foodRecognitionService } = require('./food-recognition.service');
const spoonacularService = require('./spoonacular.service');
const garminApiService = require('./garmin-api.service');
const User = require('../models/user.model');

class IntegrationService {
  constructor() {
    this.initialized = false;
    this.services = {
      notifications: notificationService,
      aiChat: aiChatService,
      foodRecognition: foodRecognitionService,
      spoonacular: spoonacularService,
      garmin: garminApiService
    };
  }

  async initialize() {
    try {
      console.log('🔄 Initialisation du service d\'intégration...');
      
      // Vérifier l'état de tous les services
      const statuses = {
        notifications: notificationService.getServiceStatus(),
        aiChat: true, // aiChatService est toujours disponible
        foodRecognition: foodRecognitionService.isModelLoaded,
        spoonacular: !!process.env.SPOONACULAR_API_KEY,
        garmin: !!process.env.GARMIN_CLIENT_ID
      };

      this.initialized = true;
      
      console.log('✅ Service d\'intégration initialisé:', statuses);
      return { success: true, statuses };
    } catch (error) {
      console.error('❌ Erreur initialisation service d\'intégration:', error);
      return { success: false, error: error.message };
    }
  }

  // Workflow complet d'onboarding utilisateur
  async onboardNewUser(userId, preferences = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('Utilisateur non trouvé');

      const results = {
        notifications: null,
        aiWelcome: null,
        healthSetup: null,
        topicSubscriptions: null
      };

      // 1. Envoyer notification de bienvenue
      if (this.services.notifications.isInitialized) {
        const welcomeNotification = {
          title: '🎉 Bienvenue sur AVA Coach Santé !',
          body: `Bonjour ${user.prenom || 'Champion'} ! Votre parcours vers une meilleure santé commence maintenant.`,
          type: 'welcome',
          data: {
            onboarding: true,
            step: 'welcome'
          }
        };

        results.notifications = await this.services.notifications.sendNotification(
          userId, 
          welcomeNotification
        );
      }

      // 2. Configuration IA personnalisée
      const aiContext = {
        userId,
        userProfile: user,
        preferences,
        onboarding: true
      };

      results.aiWelcome = await this.services.aiChat.generateResponse(
        `Bienvenue ${user.prenom || 'Champion'} ! Peux-tu me donner quelques conseils personnalisés pour bien commencer mon parcours santé ?`,
        aiContext
      );

      // 3. Abonnement automatique aux topics pertinents
      if (this.services.notifications.isInitialized && preferences.topics) {
        const subscriptionPromises = preferences.topics.map(topic =>
          this.services.notifications.subscribeToTopic(userId, topic)
        );
        results.topicSubscriptions = await Promise.all(subscriptionPromises);
      }

      // 4. Configuration initiale santé
      results.healthSetup = {
        recommendedGoals: this.generateHealthGoals(user, preferences),
        initialStats: user.stats,
        nextSteps: [
          'Configurer vos objectifs de santé',
          'Prendre votre première photo de repas',
          'Connecter votre Garmin (optionnel)',
          'Explorer les fonctionnalités premium'
        ]
      };

      console.log(`✅ Onboarding complet pour utilisateur ${userId}`);

      return {
        success: true,
        userId,
        results,
        message: 'Onboarding terminé avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur onboarding utilisateur:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Analyse complète d'un repas avec IA
  async analyzeCompleteMeal(userId, imageData, mealContext = {}) {
    try {
      const results = {
        foodRecognition: null,
        nutritionAnalysis: null,
        aiRecommendations: null,
        healthImpact: null,
        notification: null
      };

      const imageBuffer = Buffer.from(imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');

      // 1. Reconnaissance alimentaire avec TensorFlow.js
      if (this.services.foodRecognition.isModelLoaded) {
        results.foodRecognition = await this.services.foodRecognition.recognizeFood(imageBuffer, {
          topK: 5,
          portionHint: mealContext.portion
        });
      }

      // 2. Analyse nutritionnelle détaillée
      if (results.foodRecognition?.success) {
        results.nutritionAnalysis = await this.services.foodRecognition.analyzeNutritionalValue(
          results.foodRecognition,
          mealContext.portion
        );
      }

      // 3. Recommandations IA personnalisées
      const user = await User.findById(userId);
      if (user && results.nutritionAnalysis) {
        const aiContext = {
          userId,
          userProfile: user,
          mealAnalysis: results.nutritionAnalysis,
          foodRecognition: results.foodRecognition?.results,
          mealContext,
          responseType: 'nutrition_analysis'
        };

        results.aiRecommendations = await this.services.aiChat.generateResponse(
          `Analyse ce repas et donne-moi des conseils personnalisés pour optimiser ma nutrition.`,
          aiContext
        );
      }

      // 4. Impact sur la santé globale
      results.healthImpact = await this.calculateHealthImpact(userId, results.nutritionAnalysis);

      // 5. Notification si nécessaire (alertes nutritionnelles)
      if (results.nutritionAnalysis && this.shouldSendNutritionalAlert(results.nutritionAnalysis)) {
        const alertNotification = {
          title: '⚠️ Alerte nutritionnelle',
          body: this.generateNutritionalAlertMessage(results.nutritionAnalysis),
          type: 'health_alert',
          data: {
            mealAnalysis: results.nutritionAnalysis,
            timestamp: new Date().toISOString()
          }
        };

        results.notification = await this.services.notifications.sendNotification(
          userId,
          alertNotification
        );
      }

      console.log(`✅ Analyse complète repas pour utilisateur ${userId}`);

      return {
        success: true,
        results,
        confidence: results.foodRecognition?.confidence || 0,
        processingTime: Date.now()
      };

    } catch (error) {
      console.error('❌ Erreur analyse complète repas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Synchronisation intelligente Garmin avec notifications
  async syncGarminDataWithNotifications(userId) {
    try {
      // 1. Récupérer les dernières données Garmin
      const garminData = await this.services.garmin.syncUserData(userId);
      
      if (!garminData.success) {
        return { success: false, error: 'Échec sync Garmin' };
      }

      // 2. Analyser les données avec IA pour détecter des insights
      const user = await User.findById(userId);
      const insights = await this.analyzeHealthDataWithAI(user, garminData.data);

      // 3. Générer notifications basées sur les insights
      const notifications = [];
      
      if (insights.achievements.length > 0) {
        for (const achievement of insights.achievements) {
          const achievementNotif = {
            title: '🏆 Nouveau succès débloqué !',
            body: achievement.message,
            type: 'achievement',
            data: { achievement }
          };

          const result = await this.services.notifications.sendNotification(userId, achievementNotif);
          notifications.push(result);
        }
      }

      if (insights.alerts.length > 0) {
        for (const alert of insights.alerts) {
          const alertNotif = {
            title: '🚨 Alerte santé',
            body: alert.message,
            type: 'health_alert',
            data: { alert }
          };

          const result = await this.services.notifications.sendNotification(userId, alertNotif);
          notifications.push(result);
        }
      }

      return {
        success: true,
        garminData: garminData.data,
        insights,
        notificationsSent: notifications.length,
        notifications
      };

    } catch (error) {
      console.error('❌ Erreur sync Garmin avec notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Recommandations quotidiennes intelligentes
  async generateDailyRecommendations(userId) {
    try {
      const user = await User.findById(userId).populate('recentMeals recentWorkouts');
      
      // Récupérer données des dernières 24h
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const dailyData = {
        garmin: await this.services.garmin.getUserData(userId, last24h),
        meals: [], // TODO: Récupérer de la DB
        workouts: [], // TODO: Récupérer de la DB
        sleep: user.stats?.sommeil || 70,
        stress: user.stats?.stress || 30
      };

      // Générer recommandations avec IA
      const aiContext = {
        userId,
        userProfile: user,
        dailyData,
        responseType: 'daily_recommendations'
      };

      const recommendations = await this.services.aiChat.generateResponse(
        'Génère mes recommandations personnalisées pour aujourd\'hui basées sur mes données de santé.',
        aiContext
      );

      // Envoyer notification avec recommandations
      if (recommendations.success) {
        const dailyNotification = {
          title: '💪 Vos recommandations du jour',
          body: 'Découvrez vos conseils personnalisés pour aujourd\'hui !',
          type: 'reminder',
          data: {
            recommendations: recommendations.response,
            dailyData
          }
        };

        await this.services.notifications.sendNotification(userId, dailyNotification);
      }

      return {
        success: true,
        recommendations,
        dailyData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erreur génération recommandations quotidiennes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Méthodes utilitaires privées
  generateHealthGoals(user, preferences) {
    const goals = [];
    
    switch (preferences.objective || user.preferences?.objectif) {
      case 'perte_poids':
        goals.push('Maintenir un déficit calorique de 300-500 kcal/jour');
        goals.push('Augmenter l\'activité cardio à 150 min/semaine');
        break;
      case 'force':
        goals.push('Consommer 2g de protéines par kg de poids corporel');
        goals.push('Entraînement force 3-4x par semaine');
        break;
      case 'endurance':
        goals.push('Augmenter progressivement le volume d\'entraînement');
        goals.push('Optimiser l\'hydratation et les glucides');
        break;
      default:
        goals.push('Maintenir un mode de vie équilibré');
        goals.push('8h de sommeil par nuit');
        goals.push('10 000 pas par jour');
    }

    return goals;
  }

  async calculateHealthImpact(userId, nutritionAnalysis) {
    try {
      const user = await User.findById(userId);
      const nutrition = nutritionAnalysis.nutrition;
      
      // Calculer l'impact sur les stats utilisateur
      const impact = {
        energie: this.calculateEnergyImpact(nutrition),
        hydratation: this.calculateHydrationImpact(nutrition),
        recommendations: []
      };

      if (nutrition.calories > 600) {
        impact.recommendations.push('Repas très calorique - considérer une portion plus petite');
      }
      if (nutrition.protein < 10) {
        impact.recommendations.push('Faible en protéines - ajouter une source protéique');
      }
      if (nutrition.fiber < 3) {
        impact.recommendations.push('Peu de fibres - ajouter des légumes ou fruits');
      }

      return impact;
    } catch (error) {
      console.error('❌ Erreur calcul impact santé:', error);
      return { impact: 'unknown', recommendations: [] };
    }
  }

  calculateEnergyImpact(nutrition) {
    // Formule simplifiée d'impact énergétique
    const energyScore = Math.min(100, (nutrition.calories / 400) * 100);
    return Math.round(energyScore);
  }

  calculateHydrationImpact(nutrition) {
    // Impact sur l'hydratation basé sur le sodium
    if (nutrition.sodium > 1000) return -10; // Déshydratant
    if (nutrition.sodium > 500) return -5;
    return 0; // Neutre
  }

  shouldSendNutritionalAlert(nutritionAnalysis) {
    const nutrition = nutritionAnalysis.nutrition;
    return nutrition.sodium > 1500 || nutrition.calories > 800 || nutrition.sugar > 30;
  }

  generateNutritionalAlertMessage(nutritionAnalysis) {
    const nutrition = nutritionAnalysis.nutrition;
    const alerts = [];

    if (nutrition.sodium > 1500) alerts.push('taux de sodium très élevé');
    if (nutrition.calories > 800) alerts.push('repas très calorique');
    if (nutrition.sugar > 30) alerts.push('taux de sucre élevé');

    return `Attention: ${alerts.join(', ')} détecté dans ce repas.`;
  }

  async analyzeHealthDataWithAI(user, garminData) {
    const achievements = [];
    const alerts = [];

    // Logique de détection d'achievements
    if (garminData.basicMetrics?.steps > 10000) {
      achievements.push({
        type: 'steps',
        message: `Bravo ! Vous avez fait ${garminData.basicMetrics.steps} pas aujourd'hui !`,
        value: garminData.basicMetrics.steps
      });
    }

    // Logique de détection d'alertes
    if (garminData.stress?.averageLevel > 80) {
      alerts.push({
        type: 'stress',
        message: 'Votre niveau de stress est élevé. Pensez à prendre une pause.',
        value: garminData.stress.averageLevel
      });
    }

    if (garminData.sleep?.sleepScore < 60) {
      alerts.push({
        type: 'sleep',
        message: 'Qualité de sommeil faible détectée. Essayez de vous coucher plus tôt.',
        value: garminData.sleep.sleepScore
      });
    }

    return { achievements, alerts };
  }

  // Statut global du système
  getSystemStatus() {
    return {
      initialized: this.initialized,
      services: {
        notifications: this.services.notifications.getServiceStatus(),
        aiChat: { initialized: true, available: true },
        foodRecognition: {
          initialized: this.services.foodRecognition.isModelLoaded,
          modelInfo: this.services.foodRecognition.getModelInfo()
        },
        spoonacular: { 
          configured: !!process.env.SPOONACULAR_API_KEY 
        },
        garmin: { 
          configured: !!(process.env.GARMIN_CLIENT_ID && process.env.GARMIN_CLIENT_SECRET)
        }
      },
      capabilities: {
        fullMealAnalysis: true,
        smartNotifications: true,
        aiRecommendations: true,
        garminIntegration: true,
        onboarding: true
      }
    };
  }
}

// Instance singleton
const integrationService = new IntegrationService();

module.exports = {
  integrationService,
  IntegrationService
};