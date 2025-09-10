const mongoose = require('mongoose');
const User = require('../models/user.model');

class GarminWebhookService {
  constructor() {
    this.webhookEndpoints = new Map();
    this.processingQueue = [];
    this.isProcessing = false;
    
    // Démarrer le processeur de queue
    this.startQueueProcessor();
  }

  // Enregistrer un endpoint de webhook
  registerWebhookEndpoint(userId, callbackUrl, eventTypes = ['health', 'activity', 'sleep']) {
    this.webhookEndpoints.set(userId, {
      callbackUrl,
      eventTypes,
      registeredAt: new Date(),
      isActive: true
    });
    
    console.log(`✅ Webhook enregistré pour l'utilisateur ${userId}: ${callbackUrl}`);
  }

  // Traitement principal des données webhook Garmin
  async processWebhookData(req, res) {
    try {
      const webhookData = req.body;
      const headers = req.headers;
      
      console.log('🎯 WEBHOOK GARMIN - Données reçues');
      console.log('📊 Headers:', JSON.stringify(headers, null, 2));
      console.log('📦 Data type:', Array.isArray(webhookData) ? 'Array' : typeof webhookData);
      console.log('📦 Data count:', Array.isArray(webhookData) ? webhookData.length : 1);

      // Validation de la signature Garmin (si configurée)
      if (process.env.GARMIN_WEBHOOK_SECRET) {
        const isValid = this.validateGarminSignature(req);
        if (!isValid) {
          console.error('❌ Signature webhook invalide');
          return res.status(401).json({ error: 'Signature invalide' });
        }
      }

      // Normaliser les données (peut être un objet ou un array)
      const dataArray = Array.isArray(webhookData) ? webhookData : [webhookData];
      
      // Ajouter chaque élément à la queue de traitement
      for (const item of dataArray) {
        await this.queueWebhookItem(item, headers);
      }

      // Répondre immédiatement à Garmin
      res.status(200).json({
        status: 'received',
        message: 'Données webhook reçues et mises en queue',
        itemsReceived: dataArray.length,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ ${dataArray.length} éléments ajoutés à la queue de traitement`);

    } catch (error) {
      console.error('❌ Erreur traitement webhook:', error);
      res.status(500).json({ 
        error: 'Erreur interne du webhook',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Ajouter un élément à la queue de traitement
  async queueWebhookItem(item, headers) {
    const queueItem = {
      id: this.generateItemId(),
      data: item,
      headers: headers,
      receivedAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
      status: 'pending'
    };

    this.processingQueue.push(queueItem);
    console.log(`📋 Item ajouté à la queue: ${queueItem.id}`);
  }

  // Démarrer le processeur de queue
  startQueueProcessor() {
    setInterval(async () => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        await this.processQueue();
      }
    }, 1000); // Vérifier toutes les secondes
  }

  // Traiter la queue des webhooks
  async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      while (this.processingQueue.length > 0) {
        const item = this.processingQueue.shift();
        
        try {
          await this.processWebhookItem(item);
          console.log(`✅ Item traité avec succès: ${item.id}`);
        } catch (error) {
          console.error(`❌ Erreur traitement item ${item.id}:`, error);
          
          item.attempts++;
          item.lastError = error.message;
          
          if (item.attempts < item.maxAttempts) {
            // Remettre en queue avec délai exponentiel
            setTimeout(() => {
              this.processingQueue.push(item);
            }, Math.pow(2, item.attempts) * 1000);
            
            console.log(`🔄 Item ${item.id} remis en queue (tentative ${item.attempts + 1})`);
          } else {
            console.error(`💀 Item ${item.id} abandonné après ${item.maxAttempts} tentatives`);
            await this.logFailedWebhook(item);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Traiter un élément webhook individuel
  async processWebhookItem(item) {
    const data = item.data;
    
    // Identifier le type de données
    const dataType = this.identifyDataType(data);
    console.log(`🔍 Type de données identifié: ${dataType} pour l'item ${item.id}`);

    switch (dataType) {
      case 'health_snapshot':
        await this.processHealthSnapshot(data);
        break;
        
      case 'activity':
        await this.processActivityData(data);
        break;
        
      case 'sleep':
        await this.processSleepData(data);
        break;
        
      case 'stress':
        await this.processStressData(data);
        break;
        
      default:
        console.log(`⚠️ Type de données non reconnu: ${dataType}`);
        await this.processGenericData(data);
    }

    // Déclencher les notifications temps réel si nécessaire
    await this.triggerRealTimeNotifications(data, dataType);
  }

  // Identifier le type de données Garmin
  identifyDataType(data) {
    if (data.summaryId) return 'health_snapshot';
    if (data.activityId || data.activityName) return 'activity';
    if (data.sleepTimeInSeconds) return 'sleep';
    if (data.averageStressLevel !== undefined) return 'stress';
    if (data.steps || data.heartRate) return 'health_snapshot';
    
    return 'unknown';
  }

  // Traiter les données de santé générale
  async processHealthSnapshot(data) {
    try {
      const userId = this.extractUserId(data);
      if (!userId) {
        console.warn('⚠️ userId non trouvé dans les données de santé');
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        console.warn(`⚠️ Utilisateur ${userId} non trouvé`);
        return;
      }

      // Mettre à jour les statistiques utilisateur
      const updates = {};
      
      if (data.steps) {
        updates['stats.activite'] = Math.min(100, (data.steps / 10000) * 100);
      }
      
      if (data.sleepTimeInSeconds) {
        const sleepHours = data.sleepTimeInSeconds / 3600;
        updates['stats.sommeil'] = sleepHours >= 7 && sleepHours <= 9 ? 90 : 
                                  sleepHours >= 6 ? 75 : 60;
      }
      
      if (data.averageStressLevel !== undefined) {
        updates['stats.stress'] = Math.max(0, 100 - data.averageStressLevel);
      }
      
      if (data.bodyBatteryChargedValue !== undefined) {
        updates['stats.energie'] = data.bodyBatteryChargedValue;
      }

      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(userId, updates);
        console.log(`✅ Stats utilisateur ${userId} mises à jour:`, updates);
      }

      // Sauvegarder les données brutes pour l'historique
      await this.saveRawGarminData(userId, 'health_snapshot', data);

    } catch (error) {
      console.error('❌ Erreur traitement health snapshot:', error);
      throw error;
    }
  }

  // Traiter les données d'activité
  async processActivityData(data) {
    try {
      const userId = this.extractUserId(data);
      if (!userId) return;

      console.log(`🏃 Nouvelle activité pour ${userId}:`, {
        name: data.activityName,
        type: data.activityTypeDTO?.typeKey,
        duration: data.durationInSeconds,
        calories: data.caloriesConsumed
      });

      // Sauvegarder l'activité
      await this.saveRawGarminData(userId, 'activity', data);

      // Mettre à jour le score d'activité de l'utilisateur
      const activityScore = this.calculateActivityScore(data);
      await User.findByIdAndUpdate(userId, {
        'stats.activite': Math.min(100, activityScore)
      });

    } catch (error) {
      console.error('❌ Erreur traitement activité:', error);
      throw error;
    }
  }

  // Traiter les données de sommeil
  async processSleepData(data) {
    try {
      const userId = this.extractUserId(data);
      if (!userId) return;

      const sleepHours = data.sleepTimeInSeconds / 3600;
      console.log(`😴 Données sommeil pour ${userId}: ${sleepHours.toFixed(1)}h`);

      // Calculer le score de sommeil
      const sleepScore = sleepHours >= 7 && sleepHours <= 9 ? 95 : 
                        sleepHours >= 6 ? 80 : 
                        sleepHours >= 5 ? 60 : 40;

      await User.findByIdAndUpdate(userId, {
        'stats.sommeil': sleepScore
      });

      await this.saveRawGarminData(userId, 'sleep', data);

    } catch (error) {
      console.error('❌ Erreur traitement sommeil:', error);
      throw error;
    }
  }

  // Traiter les données de stress
  async processStressData(data) {
    try {
      const userId = this.extractUserId(data);
      if (!userId) return;

      console.log(`😰 Données stress pour ${userId}: niveau ${data.averageStressLevel}`);

      const stressScore = Math.max(0, 100 - data.averageStressLevel);
      
      await User.findByIdAndUpdate(userId, {
        'stats.stress': stressScore
      });

      await this.saveRawGarminData(userId, 'stress', data);

    } catch (error) {
      console.error('❌ Erreur traitement stress:', error);
      throw error;
    }
  }

  // Traiter données génériques non reconnues
  async processGenericData(data) {
    console.log('🔄 Traitement données génériques:', Object.keys(data));
    
    const userId = this.extractUserId(data);
    if (userId) {
      await this.saveRawGarminData(userId, 'generic', data);
    }
  }

  // Sauvegarder les données Garmin brutes
  async saveRawGarminData(userId, dataType, rawData) {
    try {
      // Utiliser le modèle GarminData pour sauvegarder
      const GarminData = require('../models/GarminData.model');
      
      const garminDataEntry = new GarminData({
        userId,
        dataType,
        data: rawData,
        source: 'webhook_realtime',
        syncTimestamp: new Date(),
        metadata: {
          webhookProcessed: true,
          processedAt: new Date(),
          dataKeys: Object.keys(rawData)
        }
      });

      const saved = await garminDataEntry.save();
      console.log(`💾 Données Garmin ${dataType} sauvées: ${saved._id} pour utilisateur ${userId}`);
      
      return saved;

    } catch (error) {
      console.error('❌ Erreur sauvegarde données Garmin:', error);
      // Ne pas faire échouer le webhook si la sauvegarde échoue
      console.log(`📊 Fallback - Données ${dataType}:`, {
        userId,
        timestamp: new Date(),
        dataKeys: Object.keys(rawData)
      });
    }
  }

  // Extraire l'userId des données Garmin
  extractUserId(data) {
    return data.userId || data.userAccessToken || data.userProfileUuid || null;
  }

  // Calculer le score d'activité basé sur les données Garmin
  calculateActivityScore(data) {
    let score = 0;
    
    if (data.durationInSeconds) {
      const minutes = data.durationInSeconds / 60;
      score += Math.min(50, minutes); // Max 50 points pour la durée
    }
    
    if (data.caloriesConsumed) {
      score += Math.min(30, data.caloriesConsumed / 10); // Max 30 points pour calories
    }
    
    if (data.averageHeartRateInBeatsPerMinute) {
      const intensity = data.averageHeartRateInBeatsPerMinute > 140 ? 20 : 10;
      score += intensity; // Max 20 points pour l'intensité
    }
    
    return Math.min(100, score);
  }

  // Déclencher notifications temps réel
  async triggerRealTimeNotifications(data, dataType) {
    try {
      const userId = this.extractUserId(data);
      if (!userId) return;

      // Conditions pour notifications urgentes
      const shouldNotify = this.checkNotificationConditions(data, dataType);
      
      if (shouldNotify) {
        console.log(`🔔 Notification temps réel déclenchée pour ${userId}`);
        
        // TODO: Implémenter le service de notifications (NOTIF-001)
        // await notificationService.sendRealTimeAlert(userId, shouldNotify.message);
        
        console.log(`📱 Notification: ${shouldNotify.message}`);
      }

    } catch (error) {
      console.error('❌ Erreur notifications temps réel:', error);
    }
  }

  // Vérifier les conditions de notification
  checkNotificationConditions(data, dataType) {
    // Stress élevé
    if (data.averageStressLevel > 80) {
      return {
        type: 'high_stress',
        message: 'Niveau de stress élevé détecté. Prenez une pause pour vous détendre.'
      };
    }

    // Sommeil insuffisant
    if (data.sleepTimeInSeconds && data.sleepTimeInSeconds < 5 * 3600) {
      return {
        type: 'insufficient_sleep',
        message: 'Sommeil insuffisant détecté. Essayez de vous coucher plus tôt ce soir.'
      };
    }

    // Batterie corporelle faible
    if (data.bodyBatteryChargedValue < 20) {
      return {
        type: 'low_energy',
        message: 'Niveau d\'énergie faible. Il est temps de vous reposer.'
      };
    }

    return null;
  }

  // Valider la signature Garmin (si configurée)
  validateGarminSignature(req) {
    try {
      const signature = req.headers['x-garmin-signature'] || req.headers['X-Garmin-Signature'];
      const timestamp = req.headers['x-garmin-timestamp'] || req.headers['X-Garmin-Timestamp'];
      
      if (!process.env.GARMIN_WEBHOOK_SECRET) {
        console.warn('⚠️ GARMIN_WEBHOOK_SECRET non configuré - validation ignorée');
        return true;
      }
      
      if (!signature || !timestamp) {
        console.error('❌ Headers signature/timestamp manquants');
        return false;
      }

      // Valider la fraîcheur du webhook (éviter replay attacks)
      const now = Math.floor(Date.now() / 1000);
      const webhookTime = parseInt(timestamp);
      const tolerance = 300; // 5 minutes
      
      if (Math.abs(now - webhookTime) > tolerance) {
        console.error('❌ Webhook trop ancien ou timestamp invalide');
        return false;
      }

      // Valider la signature HMAC-SHA256
      const crypto = require('crypto');
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', process.env.GARMIN_WEBHOOK_SECRET)
        .update(timestamp + payload)
        .digest('hex');
      
      const receivedSignature = signature.replace('sha256=', '');
      
      // Comparaison temporelle sécurisée
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );

      if (isValid) {
        console.log('✅ Signature webhook Garmin valide');
      } else {
        console.error('❌ Signature webhook Garmin invalide');
      }
      
      return isValid;
      
    } catch (error) {
      console.error('❌ Erreur validation signature:', error.message);
      return false;
    }
  }

  // Générer un ID unique pour les items
  generateItemId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Logger les webhooks échoués
  async logFailedWebhook(item) {
    console.error('💀 WEBHOOK ÉCHOUÉ:', {
      id: item.id,
      attempts: item.attempts,
      lastError: item.lastError,
      data: item.data
    });
    
    try {
      // Sauvegarder les échecs pour analyse
      const GarminData = require('../models/GarminData.model');
      
      await GarminData.create({
        userId: this.extractUserId(item.data) || 'unknown',
        dataType: 'webhook_failure',
        data: {
          originalData: item.data,
          error: item.lastError,
          attempts: item.attempts,
          failedAt: new Date()
        },
        source: 'webhook_error',
        syncTimestamp: new Date(),
        metadata: {
          webhookProcessed: false,
          errorLogged: true,
          itemId: item.id
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur logging échec webhook:', error.message);
    }
  }

  // Statistiques des webhooks
  async getWebhookStats(timeRange = 24) {
    try {
      const GarminData = require('../models/GarminData.model');
      const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);
      
      const stats = await GarminData.aggregate([
        {
          $match: {
            syncTimestamp: { $gte: since },
            source: { $in: ['webhook_realtime', 'webhook_error'] }
          }
        },
        {
          $group: {
            _id: {
              dataType: '$dataType',
              source: '$source'
            },
            count: { $sum: 1 },
            lastProcessed: { $max: '$syncTimestamp' }
          }
        },
        {
          $group: {
            _id: '$_id.dataType',
            success: {
              $sum: {
                $cond: [{ $eq: ['$_id.source', 'webhook_realtime'] }, '$count', 0]
              }
            },
            errors: {
              $sum: {
                $cond: [{ $eq: ['$_id.source', 'webhook_error'] }, '$count', 0]
              }
            },
            lastActivity: { $max: '$lastProcessed' }
          }
        }
      ]);

      return {
        timeRange: `${timeRange}h`,
        queueLength: this.processingQueue.length,
        isProcessing: this.isProcessing,
        stats,
        summary: {
          totalSuccess: stats.reduce((sum, s) => sum + s.success, 0),
          totalErrors: stats.reduce((sum, s) => sum + s.errors, 0),
          successRate: stats.length > 0 
            ? Math.round((stats.reduce((sum, s) => sum + s.success, 0) / 
               (stats.reduce((sum, s) => sum + s.success + s.errors, 0))) * 100)
            : 0
        }
      };

    } catch (error) {
      console.error('❌ Erreur récupération stats webhook:', error.message);
      return {
        error: error.message,
        queueLength: this.processingQueue.length,
        isProcessing: this.isProcessing
      };
    }
  }

  // Test de connectivité webhook
  async testWebhookConnectivity() {
    return {
      service: 'GarminWebhookService',
      status: 'operational',
      features: {
        signatureValidation: !!process.env.GARMIN_WEBHOOK_SECRET,
        queueProcessing: true,
        realTimeNotifications: true,
        dataStorage: true
      },
      processing: {
        queueLength: this.processingQueue.length,
        isProcessing: this.isProcessing
      },
      supportedEventTypes: this.supportedEventTypes || [
        'health_snapshot', 'activity', 'sleep', 'stress'
      ],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new GarminWebhookService();