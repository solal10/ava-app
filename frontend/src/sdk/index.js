/**
 * Health SDK Manager
 * Gestionnaire central pour les bridges d'appareils connectés
 * Coordonne Garmin Connect et Apple HealthKit
 */

import garminBridge from './garminBridge.js';
import appleBridge from './appleBridge.js';

class HealthSDKManager {
  constructor() {
    this.connectedDevices = [];
    this.lastSync = null;
    this.syncInterval = null;
    this.autoSyncEnabled = false;
  }

  /**
   * Initialiser le SDK avec les appareils disponibles
   * @param {Object} config - Configuration du SDK
   * @returns {Promise<Object>} - Résultat de l'initialisation
   */
  async initialize(config = {}) {
    const results = {
      garmin: false,
      apple: false,
      errors: []
    };

    try {
      console.log('🚀 Initialisation du Health SDK Manager...');

      // Tentative de connexion Garmin
      if (config.enableGarmin !== false) {
        try {
          results.garmin = await garminBridge.initialize(config.garminCredentials);
          if (results.garmin) {
            this.connectedDevices.push('garmin');
            console.log('✅ Garmin Connect connecté');
          }
        } catch (error) {
          results.errors.push({ device: 'garmin', error: error.message });
          console.warn('⚠️ Garmin Connect non disponible:', error.message);
        }
      }

      // Tentative de connexion Apple HealthKit
      if (config.enableApple !== false) {
        try {
          results.apple = await appleBridge.initialize(config.applePermissions);
          if (results.apple) {
            this.connectedDevices.push('apple');
            console.log('✅ Apple HealthKit connecté');
          }
        } catch (error) {
          results.errors.push({ device: 'apple', error: error.message });
          console.warn('⚠️ Apple HealthKit non disponible:', error.message);
        }
      }

      // Configuration de la synchronisation automatique
      if (config.autoSync && this.connectedDevices.length > 0) {
        this.enableAutoSync(config.syncInterval || 300000); // 5 minutes par défaut
      }

      console.log(`🎉 SDK initialisé avec ${this.connectedDevices.length} appareil(s) connecté(s)`);
      return results;

    } catch (error) {
      console.error('❌ Erreur d\'initialisation du SDK:', error);
      results.errors.push({ device: 'sdk', error: error.message });
      return results;
    }
  }

  /**
   * Récupérer les données de santé de tous les appareils connectés
   * @param {string} date - Date au format YYYY-MM-DD
   * @returns {Promise<Object>} - Données consolidées
   */
  async getAllHealthData(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const consolidatedData = {
      date: targetDate,
      sources: [],
      metrics: {},
      devices: [],
      syncTime: new Date().toISOString()
    };

    try {
      const promises = [];

      // Récupérer les données Garmin si connecté
      if (this.connectedDevices.includes('garmin')) {
        promises.push(
          garminBridge.getAllHealthData(targetDate)
            .then(data => ({ source: 'garmin', data }))
            .catch(error => ({ source: 'garmin', error: error.message }))
        );
      }

      // Récupérer les données Apple si connecté
      if (this.connectedDevices.includes('apple')) {
        promises.push(
          appleBridge.getAllHealthData(targetDate)
            .then(data => ({ source: 'apple', data }))
            .catch(error => ({ source: 'apple', error: error.message }))
        );
      }

      const results = await Promise.all(promises);

      // Consolider les données
      for (const result of results) {
        if (result.data) {
          consolidatedData.sources.push(result.source);
          consolidatedData.devices.push(result.data.device);
          
          // Fusionner les métriques (priorité à Apple si les deux sont disponibles)
          if (result.source === 'apple' || !consolidatedData.metrics.sleep) {
            consolidatedData.metrics = {
              ...consolidatedData.metrics,
              ...this.extractMetrics(result.data, result.source)
            };
          }
        } else {
          console.warn(`⚠️ Erreur ${result.source}:`, result.error);
        }
      }

      // Calculer un score de santé global consolidé
      consolidatedData.healthScore = this.calculateConsolidatedHealthScore(consolidatedData.metrics);

      return consolidatedData;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données:', error);
      throw error;
    }
  }

  /**
   * Extraire les métriques d'un appareil
   * @param {Object} deviceData - Données de l'appareil
   * @param {string} source - Source des données
   * @returns {Object} - Métriques extraites
   */
  extractMetrics(deviceData, source) {
    const metrics = {};

    // Sommeil
    if (deviceData.sleep) {
      metrics.sleep = {
        value: deviceData.sleep.totalSleepTime,
        quality: deviceData.sleep.sleepQuality || deviceData.sleep.sleepScore,
        source,
        details: deviceData.sleep
      };
    }

    // Fréquence cardiaque
    if (deviceData.heartRate) {
      metrics.heartRate = {
        resting: deviceData.heartRate.restingHeartRate,
        average: deviceData.heartRate.averageHeartRate,
        max: deviceData.heartRate.maxHeartRate,
        variability: deviceData.heartRate.heartRateVariability || deviceData.heartRate.hrvData,
        source,
        details: deviceData.heartRate
      };
    }

    // Activité
    if (deviceData.activity) {
      metrics.activity = {
        steps: deviceData.activity.steps,
        distance: deviceData.activity.distance,
        calories: deviceData.activity.activeCalories || deviceData.activity.totalCalories,
        exerciseMinutes: deviceData.activity.exerciseMinutes || deviceData.activity.activeMinutes,
        source,
        details: deviceData.activity
      };
    }

    // VO2Max
    if (deviceData.vo2max) {
      metrics.vo2max = {
        value: deviceData.vo2max.currentVO2Max,
        category: deviceData.vo2max.category || deviceData.vo2max.cardioFitnessLevel,
        trend: deviceData.vo2max.trend,
        source,
        details: deviceData.vo2max
      };
    }

    // Stress (Garmin) ou données de récupération (Apple)
    if (deviceData.stress) {
      metrics.stress = {
        level: deviceData.stress.averageStress || deviceData.stress.estimatedStress?.average,
        recovery: deviceData.stress.recovery || { overallScore: 75 },
        source,
        details: deviceData.stress
      };
    }

    // Body Battery (Garmin uniquement)
    if (deviceData.bodyBattery) {
      metrics.bodyBattery = {
        current: deviceData.bodyBattery.currentLevel,
        average: deviceData.bodyBattery.averageLevel,
        source,
        details: deviceData.bodyBattery
      };
    }

    // Hydratation (Apple principalement)
    if (deviceData.hydration) {
      metrics.hydration = {
        intake: deviceData.hydration.totalWaterIntake,
        goal: deviceData.hydration.goal,
        percentage: deviceData.hydration.percentage,
        source,
        details: deviceData.hydration
      };
    }

    return metrics;
  }

  /**
   * Calculer un score de santé consolidé
   * @param {Object} metrics - Métriques consolidées
   * @returns {number} - Score sur 100
   */
  calculateConsolidatedHealthScore(metrics) {
    let totalScore = 0;
    let scoreCount = 0;

    // Score sommeil
    if (metrics.sleep) {
      const sleepScore = typeof metrics.sleep.quality === 'number' 
        ? metrics.sleep.quality 
        : (metrics.sleep.value >= 7 ? 85 : metrics.sleep.value * 12);
      totalScore += sleepScore;
      scoreCount++;
    }

    // Score activité
    if (metrics.activity) {
      const activityScore = Math.min(100, (metrics.activity.steps / 10000) * 100);
      totalScore += activityScore;
      scoreCount++;
    }

    // Score fréquence cardiaque
    if (metrics.heartRate) {
      const hrScore = metrics.heartRate.resting <= 65 ? 90 : Math.max(50, 100 - metrics.heartRate.resting);
      totalScore += hrScore;
      scoreCount++;
    }

    // Score VO2Max
    if (metrics.vo2max) {
      const vo2Score = Math.min(100, (metrics.vo2max.value / 50) * 100);
      totalScore += vo2Score;
      scoreCount++;
    }

    // Score stress/récupération
    if (metrics.stress) {
      const stressScore = metrics.stress.recovery?.overallScore || (100 - metrics.stress.level);
      totalScore += stressScore;
      scoreCount++;
    }

    return scoreCount > 0 ? Math.round(totalScore / scoreCount) : 75;
  }

  /**
   * Synchroniser avec le contexte utilisateur
   * @param {Function} updateUserContext - Fonction de mise à jour
   * @param {string} date - Date à synchroniser
   * @returns {Promise<boolean>} - Succès de la synchronisation
   */
  async syncToUserContext(updateUserContext, date = null) {
    try {
      console.log('🔄 Synchronisation SDK vers contexte utilisateur...');

      const consolidatedData = await this.getAllHealthData(date);
      
      // Transformer au format de l'application
      const appFormatData = this.transformToAppFormat(consolidatedData);
      
      // Mettre à jour le contexte
      await updateUserContext(appFormatData);
      
      this.lastSync = new Date();
      console.log('✅ Synchronisation SDK terminée avec succès');
      
      return true;
    } catch (error) {
      console.error('❌ Erreur de synchronisation SDK:', error);
      return false;
    }
  }

  /**
   * Transformer les données consolidées au format de l'application
   * @param {Object} consolidatedData - Données consolidées
   * @returns {Object} - Données formatées pour l'application
   */
  transformToAppFormat(consolidatedData) {
    const metrics = {};

    // Sommeil
    if (consolidatedData.metrics.sleep) {
      metrics.sleep = {
        value: consolidatedData.metrics.sleep.value,
        max: 10,
        label: 'Sommeil',
        unit: 'h',
        status: this.getMetricStatus(consolidatedData.metrics.sleep.value, 7),
        source: consolidatedData.metrics.sleep.source
      };
    }

    // Stress
    if (consolidatedData.metrics.stress) {
      const stressValue = consolidatedData.metrics.stress.level 
        ? 10 - (consolidatedData.metrics.stress.level / 10)
        : (consolidatedData.metrics.stress.recovery.overallScore / 10);
      
      metrics.stress = {
        value: Math.max(0, stressValue),
        max: 10,
        label: 'Stress',
        unit: '/10',
        status: this.getMetricStatus(stressValue * 10, 70),
        source: consolidatedData.metrics.stress.source
      };
    }

    // Énergie (Body Battery ou anneaux d'activité)
    if (consolidatedData.metrics.bodyBattery) {
      metrics.energy = {
        value: consolidatedData.metrics.bodyBattery.current / 10,
        max: 10,
        label: 'Énergie',
        unit: '/10',
        status: this.getMetricStatus(consolidatedData.metrics.bodyBattery.current, 70),
        source: consolidatedData.metrics.bodyBattery.source
      };
    } else if (consolidatedData.metrics.activity) {
      metrics.energy = {
        value: (consolidatedData.metrics.activity.exerciseMinutes / 30) * 10,
        max: 10,
        label: 'Énergie',
        unit: '/10',
        status: this.getMetricStatus(consolidatedData.metrics.activity.exerciseMinutes, 25),
        source: consolidatedData.metrics.activity.source
      };
    }

    // Hydratation
    if (consolidatedData.metrics.hydration) {
      metrics.hydration = {
        value: consolidatedData.metrics.hydration.intake,
        max: 3,
        label: 'Hydratation',
        unit: 'L',
        status: this.getMetricStatus(consolidatedData.metrics.hydration.percentage, 80),
        source: consolidatedData.metrics.hydration.source
      };
    } else {
      // Valeur par défaut si pas de données d'hydratation
      metrics.hydration = {
        value: 2.1,
        max: 3,
        label: 'Hydratation',
        unit: 'L',
        status: 'good',
        source: 'estimated'
      };
    }

    // Activité
    if (consolidatedData.metrics.activity) {
      metrics.activity = {
        value: consolidatedData.metrics.activity.steps,
        max: 10000,
        label: 'Activité',
        unit: 'pas',
        status: this.getMetricStatus(consolidatedData.metrics.activity.steps, 8000),
        source: consolidatedData.metrics.activity.source
      };
    }

    return {
      source: 'sdk',
      sources: consolidatedData.sources,
      devices: consolidatedData.devices,
      metrics,
      healthScore: consolidatedData.healthScore,
      lastUpdated: consolidatedData.syncTime
    };
  }

  /**
   * Obtenir le statut d'une métrique
   * @param {number} value - Valeur
   * @param {number} threshold - Seuil
   * @returns {string} - Statut
   */
  getMetricStatus(value, threshold) {
    if (value >= threshold * 1.2) return 'excellent';
    if (value >= threshold) return 'good';
    if (value >= threshold * 0.7) return 'average';
    return 'poor';
  }

  /**
   * Activer la synchronisation automatique
   * @param {number} interval - Intervalle en millisecondes
   */
  enableAutoSync(interval = 300000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.autoSyncEnabled = true;
    this.syncInterval = setInterval(() => {
      console.log('⏰ Synchronisation automatique...');
      // La synchronisation sera déclenchée par l'application
    }, interval);

    console.log(`🔄 Synchronisation automatique activée (${interval / 1000}s)`);
  }

  /**
   * Désactiver la synchronisation automatique
   */
  disableAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.autoSyncEnabled = false;
    console.log('⏹️ Synchronisation automatique désactivée');
  }

  /**
   * Obtenir le statut du SDK
   * @returns {Object} - Informations de statut
   */
  getStatus() {
    return {
      connectedDevices: this.connectedDevices,
      lastSync: this.lastSync,
      autoSyncEnabled: this.autoSyncEnabled,
      garminStatus: garminBridge.getStatus(),
      appleStatus: appleBridge.getStatus()
    };
  }

  /**
   * Déconnecter tous les appareils
   */
  disconnectAll() {
    garminBridge.disconnect();
    appleBridge.disconnect();
    this.disableAutoSync();
    this.connectedDevices = [];
    console.log('🔌 Tous les appareils déconnectés');
  }
}

// Instance singleton
const healthSDK = new HealthSDKManager();

// Exports
export default healthSDK;
export { garminBridge, appleBridge };
export { HealthSDKManager };
