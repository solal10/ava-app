// const { notificationService } = require('../../services/notification.service');
const firebaseService = require('../../services/firebase.service');
const User = require('../../models/User.model');

// Envoyer une notification à un utilisateur
exports.sendNotification = async (req, res) => {
  try {
    const { userId, notification, options = {} } = req.body;

    if (!userId || !notification || !notification.title || !notification.body) {
      return res.status(400).json({
        message: 'userId, notification.title et notification.body sont requis'
      });
    }

    const result = await firebaseService.sendNotificationToUser(userId, notification);

    res.status(200).json({
      message: 'Notification envoyée avec succès',
      result
    });

  } catch (error) {
    console.error('❌ Erreur envoi notification:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'envoi de la notification',
      error: error.message
    });
  }
};

// Envoyer une notification à plusieurs utilisateurs
exports.sendBulkNotifications = async (req, res) => {
  try {
    const { userIds, notification, options = {} } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        message: 'Liste userIds non vide requise'
      });
    }

    if (!notification || !notification.title || !notification.body) {
      return res.status(400).json({
        message: 'notification.title et notification.body sont requis'
      });
    }

    const result = await firebaseService.sendNotificationToUsers(userIds, notification);

    res.status(200).json({
      message: 'Notifications groupées envoyées',
      result
    });

  } catch (error) {
    console.error('❌ Erreur envoi notifications groupées:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'envoi des notifications groupées',
      error: error.message
    });
  }
};

// Envoyer une notification à un topic
exports.sendTopicNotification = async (req, res) => {
  try {
    const { topic, notification, options = {} } = req.body;

    if (!topic || !notification || !notification.title || !notification.body) {
      return res.status(400).json({
        message: 'topic, notification.title et notification.body sont requis'
      });
    }

    const result = await firebaseService.sendNotificationToTopic(topic, notification);

    res.status(200).json({
      message: 'Notification topic envoyée avec succès',
      result
    });

  } catch (error) {
    console.error('❌ Erreur envoi notification topic:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'envoi de la notification topic',
      error: error.message
    });
  }
};

// Enregistrer un token FCM
exports.registerFCMToken = async (req, res) => {
  try {
    const { userId } = req;
    const { token, deviceInfo = {} } = req.body;

    if (!token) {
      return res.status(400).json({
        message: 'Token FCM requis'
      });
    }

    const result = await firebaseService.registerFCMToken(userId, token);

    res.status(200).json({
      message: 'Token FCM enregistré avec succès',
      result
    });

  } catch (error) {
    console.error('❌ Erreur enregistrement token FCM:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'enregistrement du token FCM',
      error: error.message
    });
  }
};

// Supprimer un token FCM
exports.unregisterFCMToken = async (req, res) => {
  try {
    const { userId } = req;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: 'Token FCM requis'
      });
    }

    const result = await firebaseService.unregisterFCMToken(userId, token);

    res.status(200).json({
      message: 'Token FCM supprimé avec succès',
      result
    });

  } catch (error) {
    console.error('❌ Erreur suppression token FCM:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du token FCM',
      error: error.message
    });
  }
};

// S'abonner à un topic
exports.subscribeToTopic = async (req, res) => {
  try {
    const { userId } = req;
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({
        message: 'Topic requis'
      });
    }

    // Récupérer les tokens de l'utilisateur
    const user = await User.findById(userId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return res.status(400).json({
        message: 'Utilisateur sans token FCM'
      });
    }

    const result = await firebaseService.subscribeToTopic(user.fcmTokens, topic);
    
    // Enregistrer l'abonnement dans l'utilisateur
    if (!user.topicSubscriptions) {
      user.topicSubscriptions = [];
    }
    if (!user.topicSubscriptions.includes(topic)) {
      user.topicSubscriptions.push(topic);
      await user.save();
    }

    res.status(200).json({
      message: `Abonnement au topic "${topic}" réussi`,
      result
    });

  } catch (error) {
    console.error('❌ Erreur abonnement topic:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'abonnement au topic',
      error: error.message
    });
  }
};

// Se désabonner d'un topic
exports.unsubscribeFromTopic = async (req, res) => {
  try {
    const { userId } = req;
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({
        message: 'Topic requis'
      });
    }

    // Récupérer les tokens de l'utilisateur
    const user = await User.findById(userId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return res.status(400).json({
        message: 'Utilisateur sans token FCM'
      });
    }

    const result = await firebaseService.unsubscribeFromTopic(user.fcmTokens, topic);
    
    // Supprimer l'abonnement de l'utilisateur
    if (user.topicSubscriptions) {
      user.topicSubscriptions = user.topicSubscriptions.filter(t => t !== topic);
      await user.save();
    }

    res.status(200).json({
      message: `Désabonnement du topic "${topic}" réussi`,
      result
    });

  } catch (error) {
    console.error('❌ Erreur désabonnement topic:', error);
    res.status(500).json({
      message: 'Erreur lors du désabonnement du topic',
      error: error.message
    });
  }
};

// Récupérer les préférences de notifications d'un utilisateur
exports.getNotificationPreferences = async (req, res) => {
  try {
    const { userId } = req;

    const user = await User.findById(userId).select('notificationPreferences fcmTokens topicSubscriptions');
    
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    const preferences = user.notificationPreferences || {};
    const subscriptions = user.topicSubscriptions || [];

    res.status(200).json({
      message: 'Préférences de notifications récupérées',
      preferences,
      tokens: {
        total: user.fcmTokens?.length || 0,
        active: user.fcmTokens?.length || 0
      },
      subscriptions
    });

  } catch (error) {
    console.error('❌ Erreur récupération préférences:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des préférences',
      error: error.message
    });
  }
};

// Mettre à jour les préférences de notifications
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { userId } = req;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        message: 'Objet preferences requis'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Valider les préférences
    const validPreferences = {
      enabled: preferences.enabled !== undefined ? Boolean(preferences.enabled) : true,
      types: {
        welcome: preferences.types?.welcome !== undefined ? Boolean(preferences.types.welcome) : true,
        reminder: preferences.types?.reminder !== undefined ? Boolean(preferences.types.reminder) : true,
        achievement: preferences.types?.achievement !== undefined ? Boolean(preferences.types.achievement) : true,
        health_alert: preferences.types?.health_alert !== undefined ? Boolean(preferences.types.health_alert) : true,
        premium: preferences.types?.premium !== undefined ? Boolean(preferences.types.premium) : true
      },
      timing: {
        quietHours: {
          enabled: preferences.timing?.quietHours?.enabled !== undefined ? Boolean(preferences.timing.quietHours.enabled) : false,
          start: preferences.timing?.quietHours?.start || '22:00',
          end: preferences.timing?.quietHours?.end || '08:00'
        },
        timezone: preferences.timing?.timezone || 'Europe/Paris'
      }
    };

    user.notificationPreferences = validPreferences;
    await user.save();

    res.status(200).json({
      message: 'Préférences mises à jour avec succès',
      preferences: validPreferences
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour préférences:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour des préférences',
      error: error.message
    });
  }
};

// Récupérer l'historique des notifications
exports.getNotificationHistory = async (req, res) => {
  try {
    const { userId } = req;
    const { limit = 20, offset = 0 } = req.query;

    const user = await User.findById(userId).select('notificationHistory');
    
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    const history = user.notificationHistory || [];
    const paginatedHistory = history.slice(offset, offset + parseInt(limit));

    res.status(200).json({
      message: 'Historique des notifications récupéré',
      history: paginatedHistory,
      pagination: {
        total: history.length,
        offset: parseInt(offset),
        limit: parseInt(limit),
        hasMore: offset + parseInt(limit) < history.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
};

// Obtenir les modèles de notifications disponibles
exports.getNotificationTemplates = async (_, res) => {
  try {
    const templates = {
      welcome: {
        title: '🎉 Bienvenue {userName}!',
        body: 'Commencez votre parcours santé avec AVA Coach.',
        type: 'welcome'
      },
      hydration_reminder: {
        title: '💧 Rappel Hydratation',
        body: 'N\'oubliez pas de boire de l\'eau !',
        type: 'health_reminder'
      },
      workout_reminder: {
        title: '🏃‍♂️ Temps d\'Activité',
        body: 'Que diriez-vous d\'un peu d\'exercice ?',
        type: 'health_reminder'
      },
      achievement: {
        title: '🏆 Nouveau Succès !',
        body: 'Félicitations pour vos progrès !',
        type: 'achievement'
      },
      subscription_upgrade: {
        title: '⭐ Mise à niveau Premium',
        body: 'Découvrez nos nouvelles fonctionnalités premium.',
        type: 'premium'
      }
    };
    
    res.status(200).json({
      message: 'Modèles de notifications récupérés',
      templates
    });

  } catch (error) {
    console.error('❌ Erreur récupération modèles:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des modèles',
      error: error.message
    });
  }
};

// Envoyer une notification basée sur un modèle
exports.sendTemplateNotification = async (req, res) => {
  try {
    const { userId, templateName, data = {}, options = {} } = req.body;

    if (!userId || !templateName) {
      return res.status(400).json({
        message: 'userId et templateName sont requis'
      });
    }

    const templates = {
      welcome: {
        title: '🎉 Bienvenue {userName}!',
        body: 'Commencez votre parcours santé avec AVA Coach.',
        type: 'welcome'
      },
      hydration_reminder: {
        title: '💧 Rappel Hydratation',
        body: 'N\'oubliez pas de boire de l\'eau !',
        type: 'health_reminder'
      },
      workout_reminder: {
        title: '🏃‍♂️ Temps d\'Activité',
        body: 'Que diriez-vous d\'un peu d\'exercice ?',
        type: 'health_reminder'
      },
      achievement: {
        title: '🏆 Nouveau Succès !',
        body: 'Félicitations pour vos progrès !',
        type: 'achievement'
      },
      subscription_upgrade: {
        title: '⭐ Mise à niveau Premium',
        body: 'Découvrez nos nouvelles fonctionnalités premium.',
        type: 'premium'
      }
    };
    const template = templates[templateName];

    if (!template) {
      return res.status(400).json({
        message: 'Modèle de notification non trouvé',
        availableTemplates: Object.keys(templates)
      });
    }

    // Personnaliser le modèle avec les données
    const notification = {
      title: data.title || template.title,
      body: data.body || template.body,
      type: template.type,
      imageUrl: data.imageUrl,
      data: data.customData || {}
    };

    const result = await firebaseService.sendNotificationToUser(userId, notification);

    res.status(200).json({
      message: `Notification modèle "${templateName}" envoyée avec succès`,
      result
    });

  } catch (error) {
    console.error('❌ Erreur envoi notification modèle:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'envoi de la notification modèle',
      error: error.message
    });
  }
};

// Obtenir le statut du service de notifications
exports.getServiceStatus = async (_, res) => {
  try {
    const status = firebaseService.getServiceStatus();
    
    res.status(200).json({
      message: 'Statut du service de notifications',
      status
    });

  } catch (error) {
    console.error('❌ Erreur récupération statut service:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du statut',
      error: error.message
    });
  }
};

// Tester l'envoi d'une notification
exports.testNotification = async (req, res) => {
  try {
    const { userId } = req;
    const { message = 'Ceci est une notification de test' } = req.body;

    const testNotification = {
      title: '🧪 Test de notification',
      body: message,
      type: 'test',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    const result = await firebaseService.sendNotificationToUser(userId, testNotification);

    res.status(200).json({
      message: 'Notification de test envoyée',
      result
    });

  } catch (error) {
    console.error('❌ Erreur test notification:', error);
    res.status(500).json({
      message: 'Erreur lors du test de notification',
      error: error.message
    });
  }
};