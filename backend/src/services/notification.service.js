const admin = require('firebase-admin');
const User = require('../models/user.model');

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.app = null;
    this.messaging = null;
    this.initializeFirebase();
  }

  initializeFirebase() {
    try {
      // Configuration Firebase Admin SDK
      const serviceAccount = {
        type: process.env.FIREBASE_TYPE || "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      };

      // Vérifier si les variables d'environnement sont configurées
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        console.warn('⚠️ Configuration Firebase incomplète, mode simulation activé');
        this.isInitialized = false;
        return;
      }

      // Initialiser Firebase Admin
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });

      this.messaging = admin.messaging();
      this.isInitialized = true;
      
      console.log('✅ Firebase Admin SDK initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase:', error);
      this.isInitialized = false;
    }
  }

  async sendNotification(userId, notification, options = {}) {
    try {
      if (!this.isInitialized) {
        return this.simulateNotification(userId, notification, options);
      }

      // Récupérer les tokens FCM de l'utilisateur
      const user = await User.findById(userId);
      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        console.warn(`⚠️ Aucun token FCM trouvé pour l'utilisateur ${userId}`);
        return { success: false, error: 'No FCM tokens found' };
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: {
          type: notification.type || 'general',
          userId: userId.toString(),
          timestamp: new Date().toISOString(),
          ...notification.data
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#4F46E5',
            sound: 'default',
            priority: options.priority || 'normal'
          },
          ttl: options.ttl || 86400000 // 24h par défaut
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: options.badge || 1,
              category: notification.type || 'general'
            }
          }
        },
        webpush: {
          headers: {
            TTL: options.ttl || 86400
          },
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            requireInteraction: options.requireInteraction || false
          }
        }
      };

      const results = [];
      
      // Envoyer aux tokens actifs
      for (const tokenData of user.fcmTokens) {
        if (!tokenData.active) continue;

        try {
          const response = await this.messaging.send({
            ...message,
            token: tokenData.token
          });

          results.push({
            token: tokenData.token.substring(0, 20) + '...',
            success: true,
            messageId: response
          });

          // Mettre à jour les statistiques d'utilisation
          tokenData.lastUsed = new Date();
          tokenData.successCount = (tokenData.successCount || 0) + 1;

        } catch (error) {
          console.error(`❌ Erreur envoi notification token ${tokenData.token}:`, error);
          
          results.push({
            token: tokenData.token.substring(0, 20) + '...',
            success: false,
            error: error.message
          });

          // Marquer le token comme inactif si erreur persistante
          if (error.code === 'messaging/registration-token-not-registered') {
            tokenData.active = false;
            tokenData.deactivatedAt = new Date();
          } else {
            tokenData.errorCount = (tokenData.errorCount || 0) + 1;
            if (tokenData.errorCount >= 5) {
              tokenData.active = false;
              tokenData.deactivatedAt = new Date();
            }
          }
        }
      }

      // Sauvegarder les modifications des tokens
      await user.save();

      // Enregistrer la notification dans l'historique
      await this.saveNotificationHistory(userId, notification, results);

      const successCount = results.filter(r => r.success).length;
      
      console.log(`📱 Notification envoyée: ${successCount}/${results.length} succès pour ${userId}`);

      return {
        success: successCount > 0,
        results,
        successCount,
        totalTokens: results.length,
        notificationId: `notif_${userId}_${Date.now()}`
      };

    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkNotifications(userIds, notification, options = {}) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('Liste d\'utilisateurs vide');
      }

      if (userIds.length > 500) {
        throw new Error('Maximum 500 utilisateurs par envoi groupé');
      }

      const results = [];
      const batchSize = options.batchSize || 100;

      // Traiter par lots pour éviter la surcharge
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(userId => 
          this.sendNotification(userId, notification, options)
            .catch(error => ({ userId, success: false, error: error.message }))
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Pause entre les lots pour respecter les limites de débit
        if (i + batchSize < userIds.length) {
          await this.delay(options.batchDelay || 1000);
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalSent = results.reduce((sum, r) => sum + (r.successCount || 0), 0);

      console.log(`📱 Notification groupée: ${successCount}/${userIds.length} utilisateurs, ${totalSent} notifications envoyées`);

      return {
        success: true,
        totalUsers: userIds.length,
        successfulUsers: successCount,
        totalNotifications: totalSent,
        results: options.includeDetails ? results : undefined
      };

    } catch (error) {
      console.error('❌ Erreur envoi notifications groupées:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTopicNotification(topic, notification, options = {}) {
    try {
      if (!this.isInitialized) {
        return this.simulateTopicNotification(topic, notification, options);
      }

      const message = {
        topic: topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: {
          type: notification.type || 'topic',
          topic: topic,
          timestamp: new Date().toISOString(),
          ...notification.data
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#4F46E5',
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await this.messaging.send(message);

      console.log(`📢 Notification topic "${topic}" envoyée:`, response);

      return {
        success: true,
        messageId: response,
        topic,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Erreur notification topic "${topic}":`, error);
      return { success: false, error: error.message };
    }
  }

  async registerFCMToken(userId, token, deviceInfo = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier si le token existe déjà
      const existingTokenIndex = user.fcmTokens.findIndex(t => t.token === token);
      
      if (existingTokenIndex !== -1) {
        // Mettre à jour le token existant
        user.fcmTokens[existingTokenIndex] = {
          ...user.fcmTokens[existingTokenIndex],
          active: true,
          lastUsed: new Date(),
          deviceInfo: {
            ...user.fcmTokens[existingTokenIndex].deviceInfo,
            ...deviceInfo
          },
          updatedAt: new Date()
        };
      } else {
        // Ajouter un nouveau token
        user.fcmTokens.push({
          token,
          active: true,
          registeredAt: new Date(),
          lastUsed: new Date(),
          deviceInfo,
          successCount: 0,
          errorCount: 0
        });
      }

      // Limiter le nombre de tokens par utilisateur
      if (user.fcmTokens.length > 5) {
        // Garder les 5 tokens les plus récents
        user.fcmTokens = user.fcmTokens
          .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
          .slice(0, 5);
      }

      await user.save();

      console.log(`✅ Token FCM enregistré pour utilisateur ${userId}`);

      return {
        success: true,
        userId,
        tokenCount: user.fcmTokens.length,
        message: 'Token FCM enregistré avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur enregistrement token FCM:', error);
      return { success: false, error: error.message };
    }
  }

  async unregisterFCMToken(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const initialCount = user.fcmTokens.length;
      user.fcmTokens = user.fcmTokens.filter(t => t.token !== token);

      if (user.fcmTokens.length < initialCount) {
        await user.save();
        console.log(`✅ Token FCM supprimé pour utilisateur ${userId}`);
        return { success: true, message: 'Token FCM supprimé avec succès' };
      } else {
        return { success: false, error: 'Token non trouvé' };
      }

    } catch (error) {
      console.error('❌ Erreur suppression token FCM:', error);
      return { success: false, error: error.message };
    }
  }

  async subscribeToTopic(userId, topic) {
    try {
      if (!this.isInitialized) {
        return this.simulateTopicSubscription(userId, topic, true);
      }

      const user = await User.findById(userId);
      if (!user || !user.fcmTokens.length) {
        throw new Error('Utilisateur ou tokens FCM non trouvés');
      }

      const activeTokens = user.fcmTokens
        .filter(t => t.active)
        .map(t => t.token);

      if (activeTokens.length === 0) {
        throw new Error('Aucun token FCM actif');
      }

      const response = await this.messaging.subscribeToTopic(activeTokens, topic);

      // Mettre à jour les abonnements de l'utilisateur
      if (!user.topicSubscriptions.includes(topic)) {
        user.topicSubscriptions.push(topic);
        await user.save();
      }

      console.log(`✅ Abonnement topic "${topic}" pour ${activeTokens.length} tokens`);

      return {
        success: true,
        topic,
        tokensSubscribed: activeTokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount
      };

    } catch (error) {
      console.error(`❌ Erreur abonnement topic "${topic}":`, error);
      return { success: false, error: error.message };
    }
  }

  async unsubscribeFromTopic(userId, topic) {
    try {
      if (!this.isInitialized) {
        return this.simulateTopicSubscription(userId, topic, false);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const activeTokens = user.fcmTokens
        .filter(t => t.active)
        .map(t => t.token);

      if (activeTokens.length > 0) {
        await this.messaging.unsubscribeFromTopic(activeTokens, topic);
      }

      // Supprimer l'abonnement de l'utilisateur
      user.topicSubscriptions = user.topicSubscriptions.filter(t => t !== topic);
      await user.save();

      console.log(`✅ Désabonnement topic "${topic}" pour utilisateur ${userId}`);

      return {
        success: true,
        topic,
        message: 'Désabonnement réussi'
      };

    } catch (error) {
      console.error(`❌ Erreur désabonnement topic "${topic}":`, error);
      return { success: false, error: error.message };
    }
  }

  async saveNotificationHistory(userId, notification, results) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const historyEntry = {
        title: notification.title,
        body: notification.body,
        type: notification.type || 'general',
        sentAt: new Date(),
        success: results.some(r => r.success),
        tokensCount: results.length,
        successCount: results.filter(r => r.success).length,
        data: notification.data
      };

      // Ajouter à l'historique (limiter à 100 entrées)
      if (!user.notificationHistory) {
        user.notificationHistory = [];
      }
      
      user.notificationHistory.unshift(historyEntry);
      if (user.notificationHistory.length > 100) {
        user.notificationHistory = user.notificationHistory.slice(0, 100);
      }

      await user.save();
    } catch (error) {
      console.error('❌ Erreur sauvegarde historique notifications:', error);
    }
  }

  // Méthodes de simulation pour le développement
  simulateNotification(userId, notification, options) {
    console.log(`🔄 Simulation notification pour ${userId}:`, {
      title: notification.title,
      body: notification.body,
      type: notification.type,
      options
    });

    return {
      success: true,
      simulated: true,
      userId,
      notification: notification.title,
      timestamp: new Date().toISOString()
    };
  }

  simulateTopicNotification(topic, notification, options) {
    console.log(`🔄 Simulation notification topic "${topic}":`, {
      title: notification.title,
      body: notification.body,
      options
    });

    return {
      success: true,
      simulated: true,
      topic,
      notification: notification.title,
      timestamp: new Date().toISOString()
    };
  }

  simulateTopicSubscription(userId, topic, subscribe) {
    const action = subscribe ? 'Abonnement' : 'Désabonnement';
    console.log(`🔄 Simulation ${action} topic "${topic}" pour ${userId}`);

    return {
      success: true,
      simulated: true,
      action: subscribe ? 'subscribe' : 'unsubscribe',
      topic,
      userId
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Méthodes utilitaires
  getNotificationTemplates() {
    return {
      welcome: {
        title: '🎉 Bienvenue sur AVA Coach Santé !',
        body: 'Votre parcours vers une meilleure santé commence maintenant.',
        type: 'welcome'
      },
      dailyReminder: {
        title: '💪 N\'oubliez pas votre objectif santé !',
        body: 'Il est temps de faire le point sur votre journée.',
        type: 'reminder'
      },
      achievementUnlocked: {
        title: '🏆 Nouveau succès débloqué !',
        body: 'Félicitations ! Vous avez atteint un nouveau palier.',
        type: 'achievement'
      },
      healthAlert: {
        title: '🚨 Alerte santé',
        body: 'Une action est recommandée pour votre bien-être.',
        type: 'health_alert'
      },
      premiumFeature: {
        title: '✨ Fonctionnalité Premium disponible',
        body: 'Découvrez de nouvelles possibilités avec votre abonnement.',
        type: 'premium'
      }
    };
  }

  async scheduleNotification(userId, notification, scheduledTime) {
    // Cette méthode pourrait être étendue avec un système de queue/scheduler
    const delay = new Date(scheduledTime) - new Date();
    
    if (delay <= 0) {
      return await this.sendNotification(userId, notification);
    }

    setTimeout(async () => {
      await this.sendNotification(userId, notification);
    }, delay);

    return {
      success: true,
      scheduled: true,
      scheduledTime,
      userId,
      delay
    };
  }

  getServiceStatus() {
    return {
      initialized: this.isInitialized,
      firebase: !!this.messaging,
      mode: this.isInitialized ? 'production' : 'simulation',
      features: {
        push: true,
        topics: true,
        scheduled: true,
        bulk: true,
        templates: true
      }
    };
  }
}

// Instance singleton
const notificationService = new NotificationService();

module.exports = {
  notificationService,
  NotificationService
};